/* k8s_guard.c — Zero Trust Konteyner Koruma Motoru */
#define _GNU_SOURCE
#include "k8s_guard.h"
#include "k8s_webhook.h"
#include "logger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <errno.h>
#include <syslog.h>
#include <stdatomic.h>
#include <pthread.h>
#include <sys/stat.h>

#ifdef HAVE_LIBBPF
#include <bpf/bpf.h>
#endif

static int            g_cgroups_map_fd = -1;
static uint32_t       g_cgroup_count   = 0;
static pthread_mutex_t g_guard_mutex   = PTHREAD_MUTEX_INITIALIZER;
static _Atomic uint64_t g_stat_kills   = 0;
static _Atomic uint64_t g_stat_watched = 0;

/* ── /proc/<pid>/cgroup'dan 64-hex container ID çıkar ────────────────── */
static int parse_cgroup_line(const char *line, char *id_out, size_t id_len)
{
    const char *p = line;
    while (*p) {
        if (*p == '/') {
            const char *s = p + 1;
            size_t n = 0;
            while (s[n] && ((s[n]>='0'&&s[n]<='9')||(s[n]>='a'&&s[n]<='f')||(s[n]>='A'&&s[n]<='F'))) n++;
            if (n == 64 && id_len > 64) {
                memcpy(id_out, s, 64); id_out[64] = '\0'; return 1;
            }
        }
        p++;
    }
    return 0;
}

int k8s_guard_resolve_pid(pid_t pid, ContainerInfo *out)
{
    if (!out) return 0;
    memset(out, 0, sizeof(*out));

    char path[256];
    snprintf(path, sizeof(path), "/proc/%d/cgroup", (int)pid);
    FILE *fp = fopen(path, "r");
    if (!fp) return 0;

    char line[512];
    int found = 0;
    while (fgets(line, sizeof(line), fp)) {
        size_t ln = strlen(line);
        if (ln && line[ln-1] == '\n') line[ln-1] = '\0';
        if (parse_cgroup_line(line, out->container_id, sizeof(out->container_id))) {
            found = 1; out->is_container = 1;
            break;
        }
    }
    fclose(fp);

    if (found) {
        /* HOSTNAME env var → workload_name */
        snprintf(path, sizeof(path), "/proc/%d/environ", (int)pid);
        fp = fopen(path, "r");
        if (fp) {
            char buf[4096];
            size_t n = fread(buf, 1, sizeof(buf)-1, fp);
            fclose(fp);
            buf[n] = '\0';
            const char *key = "HOSTNAME=";
            char *pos = buf;
            while (pos < buf + (int)n) {
                if (strncmp(pos, key, strlen(key)) == 0) {
                    strncpy(out->workload_name, pos+strlen(key), sizeof(out->workload_name)-1);
                    break;
                }
                pos += strlen(pos) + 1;
            }
        }
    }
    return found;
}

int k8s_guard_kill_process(const RceEvent *ev)
{
    if (!ev) return -1;

    /* Host/laptop: yalnizca izlenen konteyner cgroup'larinda SIGKILL */
    if (!ev->container.is_container) {
        syslog(LOG_INFO,
               "[K8S-GUARD] host execve (izleme disi) PID=%d %s — kill yok",
               (int)ev->pid, ev->filename);
        return 1;
    }

    syslog(LOG_CRIT,
           "[K8S-GUARD] *** ZERO TRUST RCE *** PID=%d Parent=%s Exec=%s Arg=%s "
           "Container=%.12s Workload=%s",
           (int)ev->pid, ev->parent_comm, ev->filename, ev->argv1,
           ev->container.container_id[0] ? ev->container.container_id : "host",
           ev->container.workload_name[0] ? ev->container.workload_name : "?");

    int rc = kill(ev->pid, SIGKILL);
    if (rc < 0 && errno != ESRCH) {
        syslog(LOG_ERR, "[K8S-GUARD] SIGKILL basarisiz PID=%d: %s",
               (int)ev->pid, strerror(errno));
        return -1;
    }
    syslog(LOG_INFO, "[K8S-GUARD] PID=%d SIGKILL → olduruld.", (int)ev->pid);
    atomic_fetch_add(&g_stat_kills, 1);
    /* Phase 3: Go K8s Operator'a asenkron bildirim */
    k8s_webhook_notify(ev);
    return 0;
}

int k8s_guard_watch_cgroup(uint64_t cgroup_id)
{
#ifdef HAVE_LIBBPF
    pthread_mutex_lock(&g_guard_mutex);
    if (g_cgroups_map_fd < 0 || g_cgroup_count >= 64) {
        pthread_mutex_unlock(&g_guard_mutex);
        return -1;
    }
    uint32_t idx = g_cgroup_count;
    int rc = bpf_map_update_elem(g_cgroups_map_fd, &idx, &cgroup_id, BPF_ANY);
    if (rc == 0) { g_cgroup_count++; atomic_fetch_add(&g_stat_watched, 1); }
    pthread_mutex_unlock(&g_guard_mutex);
    return rc;
#else
    (void)cgroup_id; return -1;
#endif
}

void k8s_guard_init(int watched_cgroups_map_fd)
{
    g_cgroups_map_fd = watched_cgroups_map_fd;
    g_cgroup_count   = 0;
    syslog(LOG_INFO, "[K8S-GUARD] Baslatildi. BPF cgroup map fd=%d", watched_cgroups_map_fd);
}

void k8s_guard_stop(void)
{
    g_cgroups_map_fd = -1;
    g_cgroup_count   = 0;
}

void k8s_guard_get_stats(uint64_t *kills, uint64_t *containers_watched)
{
    if (kills)              *kills              = atomic_load(&g_stat_kills);
    if (containers_watched) *containers_watched = atomic_load(&g_stat_watched);
}
