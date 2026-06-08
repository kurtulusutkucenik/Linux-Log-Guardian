/* daemon_stats.h — eBPF daemon ↔ analyzer paylaşımlı durum dosyası */
#ifndef DAEMON_STATS_H
#define DAEMON_STATS_H

#include <stdint.h>
#include "tui.h"

#define DAEMON_STATS_PATH "/run/log-guardian/daemon_stats.json"

typedef struct {
    uint64_t rce_detections;
    uint64_t rce_kills;
    char     rce_last_comm[16];
    char     rce_last_cid[13];
    uint64_t lineage_events;
    uint64_t lineage_connects;
    uint64_t uptime_sec;
    int      xdp_active;
    int      execve_probe;
    int      lineage_probe;
    int      l7_probe;
    uint64_t l7_http_hits;
    uint64_t l7_http_get;
    uint64_t l7_http_post;
} DaemonStatsSnapshot;

#ifdef __cplusplus
extern "C" {
#endif

void daemon_stats_init_clock(void);
void daemon_stats_note_rce(const char *comm, const char *container_id, int killed);
void daemon_stats_note_lineage(void);
void daemon_stats_note_lineage_connect(void);
void daemon_stats_note_l7_http(const char *method);

/* ebpf_daemon: hangi alt sistemler yuklendi (0/1) */
void daemon_stats_set_caps(int xdp_active, int execve_probe, int lineage_probe,
                           int l7_probe);

/* ebpf_daemon: atomik sayaçları JSON dosyasına yazar */
void daemon_stats_write_file(void);

/* log-guardian: dosyadan TuiStats alanlarını günceller (yoksa dokunmaz) */
void daemon_stats_apply_tui(TuiStats *stats);

/* İsteğe bağlı: son snapshot oku */
int daemon_stats_read(DaemonStatsSnapshot *out);

#ifdef __cplusplus
}
#endif

#endif /* DAEMON_STATS_H */
