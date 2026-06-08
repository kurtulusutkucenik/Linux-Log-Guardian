/* http_l7_probe.c — eBPF: web worker write() icinde HTTP method tespiti (v1)
 *
 * sys_enter_write uprobe — nginx/node/php worker comm filtresi.
 * Ilk 8 byte GET/POST/HEAD/PUT ile basliyorsa ringbuf olay sayaci.
 */
#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>

#define L7_COMM_LEN 16
#define L7_SAMPLE   8

struct l7_http_event {
    __u32 pid;
    char  comm[L7_COMM_LEN];
    char  method[L7_SAMPLE];
    __u64 ts_ns;
};

struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 20);
} l7_http_events SEC(".maps");

static __always_inline int is_web_comm(const char *comm)
{
    if (comm[0] == 'n' && comm[1] == 'g' && comm[2] == 'i') return 1;
    if (comm[0] == 'n' && comm[1] == 'o' && comm[2] == 'd') return 1;
    if (comm[0] == 'p' && comm[1] == 'h' && comm[2] == 'p') return 1;
    if (comm[0] == 'a' && comm[1] == 'p' && comm[2] == 'a') return 1;
    return 0;
}

static __always_inline int looks_http(const char *buf, __u32 len)
{
    if (len < 4) return 0;
    if (buf[0] == 'G' && buf[1] == 'E' && buf[2] == 'T' && buf[3] == ' ') return 1;
    if (len >= 5 && buf[0] == 'P' && buf[1] == 'O' && buf[2] == 'S' && buf[3] == 'T' && buf[4] == ' ') return 1;
    if (len >= 5 && buf[0] == 'H' && buf[1] == 'E' && buf[2] == 'A' && buf[3] == 'D' && buf[4] == ' ') return 1;
    if (len >= 4 && buf[0] == 'P' && buf[1] == 'U' && buf[2] == 'T' && buf[3] == ' ') return 1;
    return 0;
}

SEC("tracepoint/syscalls/sys_enter_write")
int trace_l7_http_write(struct trace_event_raw_sys_enter *ctx)
{
    char comm[L7_COMM_LEN];
    bpf_get_current_comm(comm, sizeof(comm));
    if (!is_web_comm(comm)) return 0;

    __u32 count = (__u32)ctx->args[2];
    if (count < 4 || count > 4096) return 0;

    const char *buf = (const char *)ctx->args[1];
    char sample[L7_SAMPLE] = {};
    if (bpf_probe_read_user(sample, sizeof(sample), buf) < 0)
        return 0;
    if (!looks_http(sample, count > L7_SAMPLE ? L7_SAMPLE : count))
        return 0;

    struct l7_http_event *e = bpf_ringbuf_reserve(&l7_http_events, sizeof(*e), 0);
    if (!e) return 0;
    __u64 pid_tgid = bpf_get_current_pid_tgid();
    e->pid   = (__u32)(pid_tgid >> 32);
    e->ts_ns = bpf_ktime_get_ns();
    __builtin_memcpy(e->comm, comm, L7_COMM_LEN);
    __builtin_memcpy(e->method, sample, L7_SAMPLE);
    bpf_ringbuf_submit(e, 0);
    return 0;
}

char LICENSE[] SEC("license") = "GPL";
