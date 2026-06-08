/* l7_telemetry.c — userspace + eBPF L7 HTTP istatistikleri */
#include "l7_telemetry.h"
#include <string.h>
#include <stdatomic.h>

static atomic_uint_fast64_t g_inspected = 0;
static atomic_uint_fast64_t g_blocked   = 0;
static atomic_uint_fast64_t g_ebpf_hits = 0;
static atomic_uint_fast64_t g_get       = 0;
static atomic_uint_fast64_t g_post      = 0;

void l7_telemetry_init(void) {}

static void bump_method(const char *method)
{
    if (!method) return;
    if (method[0] == 'G' && method[1] == 'E' && method[2] == 'T')
        atomic_fetch_add(&g_get, 1);
    else if (method[0] == 'P' && method[1] == 'O' && method[2] == 'S')
        atomic_fetch_add(&g_post, 1);
}

void l7_telemetry_record(const char *method, int blocked)
{
    atomic_fetch_add(&g_inspected, 1);
    bump_method(method);
    if (blocked) atomic_fetch_add(&g_blocked, 1);
}

void l7_telemetry_ebpf_hit(const char *method)
{
    atomic_fetch_add(&g_ebpf_hits, 1);
    bump_method(method);
}

void l7_telemetry_get_stats(uint64_t *inspected, uint64_t *blocked,
                            uint64_t *ebpf_hits,
                            uint64_t *get_cnt, uint64_t *post_cnt)
{
    if (inspected)  *inspected  = atomic_load(&g_inspected);
    if (blocked)    *blocked    = atomic_load(&g_blocked);
    if (ebpf_hits)  *ebpf_hits  = atomic_load(&g_ebpf_hits);
    if (get_cnt)    *get_cnt    = atomic_load(&g_get);
    if (post_cnt)   *post_cnt   = atomic_load(&g_post);
}
