/* syscall_uprobe.c — eBPF execve Tracepoint (Zero Trust K8s RCE Sensörü)
 *
 * BU DOSYA YALNIZCA BPF HEDEFI İÇİN DERLENİR:
 *   clang -O2 -g -target bpf -D__BPF_TRACING__ -I. \
 *         -I/usr/include/bpf -c syscall_uprobe.c -o syscall_uprobe.o
 *
 * Mantık:
 *   1. sys_enter_execve çağrıldığında tetiklenir (her shell spawn = RCE adayı)
 *   2. Çağrıyı yapan işlemin cgroup v2 ID'sini okur
 *   3. İzleme listesindeki cgroup ID'lerinden biri ise → event ring buffer'a yazar
 *   4. Userspace (ebpf_daemon.c) bu event'i alır, SIGKILL + IPC_CMD_RCE_ALERT gönderir
 *
 * Desteklenen kernel: >= 5.8 (ring buffer + cgroup helpers gerektirir)
 */

#include "bpf_compat.h"

/* ── Sabitler ─────────────────────────────────────────────────────────────── */
#define MAX_WATCHED_CGROUPS  64    /* İzlenen konteyner cgroup sayısı üst sınırı */
#define CMDLINE_MAX          128   /* argv[0]+argv[1] yakalanacak bayt            */
#define MAX_RINGBUF_EVENTS   256   /* Eş zamanlı maksimum event                  */

/* ── Event yapısı (userspace ile paylaşılan) ─────────────────────────────── */
struct rce_event {
    __u32 pid;                  /* Shell spawn eden PID (tgid)    */
    __u32 ppid;                 /* Üst proses PID                 */
    __u64 cgroup_id;            /* cgroup v2 ID                   */
    __u64 timestamp_ns;         /* bpf_ktime_get_ns()             */
    char  comm[16];             /* Çağıran proses adı (task_comm) */
    char  filename[64];         /* execve filename (argv[0])      */
    char  argv1[64];            /* İlk argüman (argv[1])          */
};

/* ── BPF Map'ler ─────────────────────────────────────────────────────────── */

/* Ring buffer: kernel → userspace event kanalı */
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, MAX_RINGBUF_EVENTS * sizeof(struct rce_event));
} rce_ringbuf SEC(".maps");

/* İzlenecek cgroup ID'leri — userspace tarafından güncellenir.
 * key=index (0..63), value=cgroup_id (u64) */
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, MAX_WATCHED_CGROUPS);
    __type(key,   __u32);
    __type(value, __u64);
} watched_cgroups SEC(".maps");

/* İzleme aktif mi? (0=tüm execve logla, 1=sadece watched_cgroups) */
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 1);
    __type(key,   __u32);
    __type(value, __u32);
} filter_mode SEC(".maps");

/* ── Şüpheli komut seti: web servislerinin spawn etmemesi gereken ikili ── */
/* Not: Tam string karşılaştırması yerine prefix kontrolü kullanılır —
 * kernel doğrulayıcı döngü sınırını aşmamak için. */
static __always_inline int is_suspicious_exec(const char *filename)
{
    /* /bin/sh, /bin/bash, /bin/dash, /usr/bin/python*, /usr/bin/perl,
     * /usr/bin/curl, /usr/bin/wget, /tmp/ — en kritik vektörler */
    char f[8];
    if (bpf_probe_read_user_str(f, sizeof(f), filename) <= 0)
        return 0;

    /* /bin/sh veya /bin/ba(sh) veya /tmp/ prefixleri */
    if (f[0] == '/' && f[1] == 'b' && f[2] == 'i' && f[3] == 'n' && f[4] == '/')
        return 1;   // /bin/* -> daima suphelie
    if (f[0] == '/' && f[1] == 't' && f[2] == 'm' && f[3] == 'p' && f[4] == '/')
        return 1;   // /tmp/* -> kesinlikle suphelie (dropper)
    if (f[0] == '/' && f[1] == 'u' && f[2] == 's' && f[3] == 'r')
        return 1;   // /usr/* -> python, perl, curl, wget
    return 0;
}

/* ── cgroup filtresi: yalnızca izlenen cgroup'lardan gelen execve ──────── */
static __always_inline int cgroup_is_watched(__u64 cgid)
{
    /* filter_mode=0 ise tüm execve'ler izlenir (debug/ilk kurulum) */
    __u32 k0 = 0;
    __u32 *mode = bpf_map_lookup_elem(&filter_mode, &k0);
    if (!mode || *mode == 0)
        return 1;  /* izleme filtresi kapalı — hepsini yakala */

    /* Verifier: dongu yok — 8 slot manuel tara */
    #define CG_MATCH(idx) do { \
        __u32 _k = (idx); \
        __u64 *_cg = bpf_map_lookup_elem(&watched_cgroups, &_k); \
        if (_cg && *_cg != 0 && *_cg == cgid) return 1; \
    } while (0)
    CG_MATCH(0);  CG_MATCH(1);  CG_MATCH(2);  CG_MATCH(3);
    CG_MATCH(4);  CG_MATCH(5);  CG_MATCH(6);  CG_MATCH(7);
    #undef CG_MATCH
    return 0;
}

/* ── Tracepoint: sys_enter_execve ────────────────────────────────────────── */
SEC("tracepoint/syscalls/sys_enter_execve")
int trace_execve(struct trace_event_raw_sys_enter *ctx)
{
    /* argv[0] = filename işaretçisi */
    const char *filename_ptr =
        (const char *)ctx->args[0];

    /* Şüpheli mi? */
    if (!is_suspicious_exec(filename_ptr))
        return 0;

    /* cgroup ID al */
    __u64 cgid = bpf_get_current_cgroup_id();

    /* cgroup filtresi */
    if (!cgroup_is_watched(cgid))
        return 0;

    /* Ring buffer'a alan ayır */
    struct rce_event *ev = bpf_ringbuf_reserve(&rce_ringbuf,
                                                sizeof(*ev), 0);
    if (!ev) return 0;

    /* PID / PPID */
    __u64 pid_tgid = bpf_get_current_pid_tgid();
    ev->pid        = (__u32)(pid_tgid >> 32);
    ev->ppid       = 0;  /* task->real_parent CO-RE ile doldurulabilir */
    ev->cgroup_id  = cgid;
    ev->timestamp_ns = bpf_ktime_get_ns();

    /* Proses adı */
    bpf_get_current_comm(ev->comm, sizeof(ev->comm));

    /* execve filename (argv[0]) */
    bpf_probe_read_user_str(ev->filename, sizeof(ev->filename),
                            filename_ptr);

    /* argv[1] — varsa */
    const char * const *argv_ptr =
        (const char * const *)ctx->args[1];
    const char *arg1 = NULL;
    bpf_probe_read_user(&arg1, sizeof(arg1), argv_ptr + 1);
    if (arg1)
        bpf_probe_read_user_str(ev->argv1, sizeof(ev->argv1), arg1);
    else
        ev->argv1[0] = '\0';

    /* Ring buffer'a yaz (commit) */
    bpf_ringbuf_submit(ev, 0);
    return 0;
}

char _license[] SEC("license") = "GPL";
