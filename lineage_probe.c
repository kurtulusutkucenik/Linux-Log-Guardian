/* lineage_probe.c — eBPF Process & Network Lineage Probe (Feature 3)
 *
 * Kernel-space eBPF programı:
 *   - sys_enter_openat  → hangi dosyalar açılıyor
 *   - sys_enter_execve  → shell spawn (RCE tespiti)
 *   - sys_enter_connect → dışarıya hangi IP'lere bağlanılıyor
 *
 * Olaylar ring buffer üzerinden userspace'e (ebpf_daemon.c) iletilir.
 * Linux >= 5.8 gerektirir (ring buffer + cgroup helpers).
 */
#include "bpf_compat.h"

/* ── Olay Tipleri (userspace ile senkron) ───────────────────────── */
#define LINEAGE_OPENAT  0
#define LINEAGE_EXECVE  1
#define LINEAGE_CONNECT 2
#define LINEAGE_WRITE   3

#define LINEAGE_DETAIL_LEN 128
#define LINEAGE_COMM_LEN    16

/* ── Ring Buffer çıkış olayı ────────────────────────────────────── */
struct lineage_event {
    __u32 type;
    __u32 pid;
    __u32 ppid;
    __u32 uid;
    char  comm[LINEAGE_COMM_LEN];
    char  detail[LINEAGE_DETAIL_LEN];
    __u64 ts_ns;
};

/* ── Ring Buffer map'i (8 MB) ───────────────────────────────────── */
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 8 * 1024 * 1024);
} lineage_events SEC(".maps");

/* ── Web process cgroup filtresi: yalnızca nginx/apache/php izle ─ */
static __always_inline int is_web_process(const char *comm) {
    /* Basit string prefix kontrolü */
    if (comm[0]=='n' && comm[1]=='g' && comm[2]=='i') return 1; /* nginx */
    if (comm[0]=='a' && comm[1]=='p' && comm[2]=='a') return 1; /* apache */
    if (comm[0]=='p' && comm[1]=='h' && comm[2]=='p') return 1; /* php-fpm */
    if (comm[0]=='p' && comm[1]=='y' && comm[2]=='t') return 1; /* python */
    if (comm[0]=='n' && comm[1]=='o' && comm[2]=='d') return 1; /* node */
    if (comm[0]=='r' && comm[1]=='u' && comm[2]=='b') return 1; /* ruby */
    if (comm[0]=='j' && comm[1]=='a' && comm[2]=='v') return 1; /* java */
    if (comm[0]=='g' && comm[1]=='u' && comm[2]=='n') return 1; /* gunicorn */
    if (comm[0]=='u' && comm[1]=='w' && comm[2]=='s') return 1; /* uwsgi */
    return 0;
}

static __always_inline void fill_event_base(struct lineage_event *e,
                                             __u32 type) {
    __u64 pid_tgid = bpf_get_current_pid_tgid();
    e->type  = type;
    e->pid   = (__u32)(pid_tgid >> 32);
    e->uid   = (__u32)bpf_get_current_uid_gid();
    e->ts_ns = bpf_ktime_get_ns();
    bpf_get_current_comm(e->comm, sizeof(e->comm));

    /* ppid: CO-RE task_struct; fallback'te 0 */
#ifdef VMLINUX_LOADED
    struct task_struct *task = (struct task_struct *)bpf_get_current_task();
    struct task_struct *parent = NULL;
    bpf_core_read(&parent, sizeof(parent), &task->real_parent);
    if (parent) {
        __u32 ppid = 0;
        bpf_core_read(&ppid, sizeof(ppid), &parent->tgid);
        e->ppid = ppid;
    }
#else
    e->ppid = 0;
#endif
}

/* ── tracepoint: sys_enter_openat ───────────────────────────────── */
SEC("tracepoint/syscalls/sys_enter_openat")
int trace_openat(struct trace_event_raw_sys_enter *ctx) {
    char comm[LINEAGE_COMM_LEN];
    bpf_get_current_comm(comm, sizeof(comm));
    if (!is_web_process(comm)) return 0;

    struct lineage_event *e = bpf_ringbuf_reserve(&lineage_events,
                                                    sizeof(*e), 0);
    if (!e) return 0;

    fill_event_base(e, LINEAGE_OPENAT);

    /* 2. argüman: filename pointer */
    const char *fname = (const char *)ctx->args[1];
    bpf_probe_read_user_str(e->detail, sizeof(e->detail), fname);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

/* ── tracepoint: sys_enter_execve ───────────────────────────────── */
SEC("tracepoint/syscalls/sys_enter_execve")
int trace_execve(struct trace_event_raw_sys_enter *ctx) {
    char comm[LINEAGE_COMM_LEN];
    bpf_get_current_comm(comm, sizeof(comm));
    if (!is_web_process(comm)) return 0;

    struct lineage_event *e = bpf_ringbuf_reserve(&lineage_events,
                                                    sizeof(*e), 0);
    if (!e) return 0;

    fill_event_base(e, LINEAGE_EXECVE);

    /* 1. argüman: filename */
    const char *filename = (const char *)ctx->args[0];
    bpf_probe_read_user_str(e->detail, sizeof(e->detail), filename);

    bpf_ringbuf_submit(e, 0);
    return 0;
}

/* ── tracepoint: sys_enter_connect ─────────────────────────────── */
SEC("tracepoint/syscalls/sys_enter_connect")
int trace_connect(struct trace_event_raw_sys_enter *ctx) {
    char comm[LINEAGE_COMM_LEN];
    bpf_get_current_comm(comm, sizeof(comm));
    if (!is_web_process(comm)) return 0;

    struct lineage_event *e = bpf_ringbuf_reserve(&lineage_events,
                                                    sizeof(*e), 0);
    if (!e) return 0;

    fill_event_base(e, LINEAGE_CONNECT);

    /* 2. argüman: sockaddr pointer */
    struct sockaddr_in sa;
    const void *uaddr = (const void *)ctx->args[1];
    if (bpf_probe_read_user(&sa, sizeof(sa), uaddr) == 0) {
        if (sa.sin_family == 2 /* AF_INET */) {
            __u32 ip = __builtin_bswap32(sa.sin_addr.s_addr);
            __u16 port = __builtin_bswap16(sa.sin_port);
            unsigned long long args[5] = {
                (ip >> 24) & 0xFF, (ip >> 16) & 0xFF,
                (ip >> 8)  & 0xFF,  ip & 0xFF, port
            };
            bpf_snprintf(e->detail, sizeof(e->detail), "%d.%d.%d.%d:%d", args, sizeof(args));
        } else {
            /* IPv6 veya bilinmeyen */
            __builtin_memcpy(e->detail, "ipv6/unknown", 13);
        }
    }

    bpf_ringbuf_submit(e, 0);
    return 0;
}

/* ── tracepoint: sys_enter_write (tmp dosyaları için) ─────────── */
SEC("tracepoint/syscalls/sys_enter_write")
int trace_write(struct trace_event_raw_sys_enter *ctx) {
    /* Sadece küçük yazma işlemlerini filtrele (webshell drop) */
    __u64 count = (__u64)ctx->args[2];
    if (count > 65536 || count == 0) return 0; /* büyük transfer değil */

    char comm[LINEAGE_COMM_LEN];
    bpf_get_current_comm(comm, sizeof(comm));
    if (!is_web_process(comm)) return 0;

    struct lineage_event *e = bpf_ringbuf_reserve(&lineage_events,
                                                    sizeof(*e), 0);
    if (!e) return 0;

    fill_event_base(e, LINEAGE_WRITE);
    unsigned long long args[2] = { ctx->args[0], count };
    bpf_snprintf(e->detail, sizeof(e->detail), "fd=%lld bytes=%lld", args, sizeof(args));
    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
