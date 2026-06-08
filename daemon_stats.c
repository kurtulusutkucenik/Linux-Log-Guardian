#define _GNU_SOURCE
#include "daemon_stats.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <stdatomic.h>

static _Atomic uint64_t g_rce_detections = 0;
static _Atomic uint64_t g_rce_kills      = 0;
static _Atomic uint64_t g_lineage_events   = 0;
static _Atomic uint64_t g_lineage_connects = 0;
static _Atomic uint64_t g_l7_http_hits     = 0;
static _Atomic uint64_t g_l7_http_get      = 0;
static _Atomic uint64_t g_l7_http_post     = 0;
static char             g_rce_last_comm[16] = "";
static char             g_rce_last_cid[13]   = "";
static time_t           g_daemon_start     = 0;
static int              g_cap_xdp          = 0;
static int              g_cap_execve       = 0;
static int              g_cap_lineage      = 0;
static int              g_cap_l7           = 0;

void daemon_stats_set_caps(int xdp_active, int execve_probe, int lineage_probe,
                           int l7_probe)
{
    g_cap_xdp     = xdp_active ? 1 : 0;
    g_cap_execve  = execve_probe ? 1 : 0;
    g_cap_lineage = lineage_probe ? 1 : 0;
    g_cap_l7      = l7_probe ? 1 : 0;
}

void daemon_stats_init_clock(void)
{
    if (g_daemon_start == 0)
        g_daemon_start = time(NULL);
}

void daemon_stats_note_rce(const char *comm, const char *container_id, int killed)
{
    atomic_fetch_add(&g_rce_detections, 1);
    if (killed)
        atomic_fetch_add(&g_rce_kills, 1);
    if (comm && comm[0]) {
        strncpy(g_rce_last_comm, comm, sizeof(g_rce_last_comm) - 1);
        g_rce_last_comm[sizeof(g_rce_last_comm) - 1] = '\0';
    }
    if (container_id && container_id[0]) {
        size_t n = strlen(container_id);
        if (n > 12) n = 12;
        memcpy(g_rce_last_cid, container_id, n);
        g_rce_last_cid[n] = '\0';
    } else {
        g_rce_last_cid[0] = '\0';
    }
}

void daemon_stats_note_lineage(void)
{
    atomic_fetch_add(&g_lineage_events, 1);
}

void daemon_stats_note_lineage_connect(void)
{
    atomic_fetch_add(&g_lineage_connects, 1);
}

static void bump_l7_method(const char *method)
{
    if (!method || !method[0]) return;
    if (method[0] == 'G' && method[1] == 'E' && method[2] == 'T')
        atomic_fetch_add(&g_l7_http_get, 1);
    else if (method[0] == 'P' && method[1] == 'O' && method[2] == 'S')
        atomic_fetch_add(&g_l7_http_post, 1);
}

void daemon_stats_note_l7_http(const char *method)
{
    atomic_fetch_add(&g_l7_http_hits, 1);
    bump_l7_method(method);
}

void daemon_stats_write_file(void)
{
    DaemonStatsSnapshot snap = {0};
    snap.rce_detections = atomic_load(&g_rce_detections);
    snap.rce_kills      = atomic_load(&g_rce_kills);
    snap.lineage_events    = atomic_load(&g_lineage_events);
    snap.lineage_connects = atomic_load(&g_lineage_connects);
    snap.l7_http_hits     = atomic_load(&g_l7_http_hits);
    snap.l7_http_get      = atomic_load(&g_l7_http_get);
    snap.l7_http_post     = atomic_load(&g_l7_http_post);
    strncpy(snap.rce_last_comm, g_rce_last_comm, sizeof(snap.rce_last_comm) - 1);
    strncpy(snap.rce_last_cid, g_rce_last_cid, sizeof(snap.rce_last_cid) - 1);
    if (g_daemon_start > 0)
        snap.uptime_sec = (uint64_t)(time(NULL) - g_daemon_start);
    snap.xdp_active     = g_cap_xdp;
    snap.execve_probe   = g_cap_execve;
    snap.lineage_probe  = g_cap_lineage;
    snap.l7_probe       = g_cap_l7;

    FILE *f = fopen(DAEMON_STATS_PATH, "w");
    if (!f) return;
    fprintf(f,
            "{\"rce_detections\":%lu,\"rce_kills\":%lu,"
            "\"rce_last_comm\":\"%s\",\"rce_last_cid\":\"%s\","
            "\"lineage_events\":%lu,\"lineage_connects\":%lu,"
            "\"l7_http_hits\":%lu,\"l7_http_get\":%lu,\"l7_http_post\":%lu,"
            "\"uptime_sec\":%lu,"
            "\"xdp_active\":%d,\"execve_probe\":%d,\"lineage_probe\":%d,"
            "\"l7_probe\":%d}\n",
            (unsigned long)snap.rce_detections,
            (unsigned long)snap.rce_kills,
            snap.rce_last_comm,
            snap.rce_last_cid,
            (unsigned long)snap.lineage_events,
            (unsigned long)snap.lineage_connects,
            (unsigned long)snap.l7_http_hits,
            (unsigned long)snap.l7_http_get,
            (unsigned long)snap.l7_http_post,
            (unsigned long)snap.uptime_sec,
            snap.xdp_active, snap.execve_probe, snap.lineage_probe,
            snap.l7_probe);
    fclose(f);
    chmod(DAEMON_STATS_PATH, 0644);
}

int daemon_stats_read(DaemonStatsSnapshot *out)
{
    if (!out) return -1;
    memset(out, 0, sizeof(*out));

    FILE *f = fopen(DAEMON_STATS_PATH, "r");
    if (!f) return -1;

    char buf[640];
    size_t n = fread(buf, 1, sizeof(buf) - 1, f);
    fclose(f);
    if (n == 0) return -1;
    buf[n] = '\0';

    char comm[32] = {0};
    char cid[32]  = {0};
    unsigned long det = 0, kills = 0, lin = 0, up = 0;
    char *p;
    if ((p = strstr(buf, "\"rce_detections\""))) {
        p = strchr(p, ':');
        if (p) det = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"rce_kills\""))) {
        p = strchr(p, ':');
        if (p) kills = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"rce_last_comm\""))) {
        p = strchr(p, ':');
        if (p) {
            p = strchr(p, '"');
            if (p) {
                p++;
                char *e = strchr(p, '"');
                if (e) {
                    size_t len = (size_t)(e - p);
                    if (len >= sizeof(comm)) len = sizeof(comm) - 1;
                    memcpy(comm, p, len);
                }
            }
        }
    }
    if ((p = strstr(buf, "\"rce_last_cid\""))) {
        p = strchr(p, ':');
        if (p) {
            p = strchr(p, '"');
            if (p) {
                p++;
                char *e = strchr(p, '"');
                if (e) {
                    size_t len = (size_t)(e - p);
                    if (len >= sizeof(cid)) len = sizeof(cid) - 1;
                    memcpy(cid, p, len);
                }
            }
        }
    }
    if ((p = strstr(buf, "\"lineage_events\""))) {
        p = strchr(p, ':');
        if (p) lin = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"lineage_connects\""))) {
        p = strchr(p, ':');
        if (p) out->lineage_connects = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"uptime_sec\""))) {
        p = strchr(p, ':');
        if (p) up = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"xdp_active\""))) {
        p = strchr(p, ':');
        if (p) out->xdp_active = (strtoul(p + 1, NULL, 10) != 0);
    }
    if ((p = strstr(buf, "\"execve_probe\""))) {
        p = strchr(p, ':');
        if (p) out->execve_probe = (strtoul(p + 1, NULL, 10) != 0);
    }
    if ((p = strstr(buf, "\"lineage_probe\""))) {
        p = strchr(p, ':');
        if (p) out->lineage_probe = (strtoul(p + 1, NULL, 10) != 0);
    }
    if ((p = strstr(buf, "\"l7_http_hits\""))) {
        p = strchr(p, ':');
        if (p) out->l7_http_hits = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"l7_probe\""))) {
        p = strchr(p, ':');
        if (p) out->l7_probe = (strtoul(p + 1, NULL, 10) != 0);
    }
    if ((p = strstr(buf, "\"l7_http_get\""))) {
        p = strchr(p, ':');
        if (p) out->l7_http_get = strtoul(p + 1, NULL, 10);
    }
    if ((p = strstr(buf, "\"l7_http_post\""))) {
        p = strchr(p, ':');
        if (p) out->l7_http_post = strtoul(p + 1, NULL, 10);
    }

    out->rce_detections = det;
    out->rce_kills      = kills;
    out->lineage_events = lin;
    out->uptime_sec     = up;
    strncpy(out->rce_last_comm, comm, sizeof(out->rce_last_comm) - 1);
    strncpy(out->rce_last_cid, cid, sizeof(out->rce_last_cid) - 1);
    return 0;
}

void daemon_stats_apply_tui(TuiStats *stats)
{
    if (!stats) return;
    DaemonStatsSnapshot snap;
    if (daemon_stats_read(&snap) != 0) return;
    stats->rce_detections = snap.rce_detections;
    stats->rce_kills      = snap.rce_kills;
    strncpy(stats->rce_last_comm, snap.rce_last_comm, sizeof(stats->rce_last_comm) - 1);
    strncpy(stats->rce_last_cid, snap.rce_last_cid, sizeof(stats->rce_last_cid) - 1);
}
