#ifndef DB_H
#define DB_H

#include "anomaly.h"
#include "ip_map.h"
#include <time.h>

void db_load_previous_bans(IpMap *map);

/* Boot-sync: veritabanindaki aktif banlari XDP kernel map'ine yukler */
void db_sync_xdp_bans(void);

int db_init(const char *path);
void db_close(void);
void db_enqueue_alert(const Alert *a, const IpRecord *rec);
void db_log_ban_event(const char *ip, const char *action,
                      const char *reason, time_t ts);
void db_log_ban_event_ex(const char *ip, const char *action,
                         const char *reason, time_t ts,
                         double risk_score, const char *policy);

/*
 * db_log_alert: db_enqueue_alert icin geri-uyumlu alias.
 * main.c ve xdp_loader.c bu ismi kullaniyor; Lock-Free kuyruga yonlendirilir.
 */
#define db_log_alert db_enqueue_alert

#define DB_STATUS_MAX_ALERTS 10
#define DB_STATUS_MAX_BANS   5

typedef struct {
    time_t ts;
    char   ip[46];
    int    level;
    char   message[ALERT_MSG_LEN];
    char   incident_id[24];
} DbRecentAlert;

typedef struct {
    time_t ts;
    char   ip[46];
    char   action[16];
    char   reason[128];
} DbRecentBan;

typedef struct {
    long alerts_total;
    long bans_active;
    int  recent_count;
    DbRecentAlert recent[DB_STATUS_MAX_ALERTS];
    int  recent_ban_count;
    DbRecentBan recent_bans[DB_STATUS_MAX_BANS];
} DbStatusSnapshot;

/* Read-only snapshot (analyzer calismasa da --status icin) */
int db_status_snapshot(const char *path, DbStatusSnapshot *out);

/* threat-intel/geoip DB satirlarini kirp (ttl_days<=0: tum intel satirlari) */
int db_prune_intel_ban_events(const char *path, int ttl_days);

/* Telegram inline "Gordum" onaylari (events.db) */
void db_log_telegram_ack(const char *chat_id, const char *ack_key,
                         const char *incident_id);
/* Bot thread / CLI — ayri baglanti (g_db_ready gerekmez) */
int db_log_telegram_ack_path(const char *db_path, const char *chat_id,
                             const char *ack_key, const char *incident_id);

#endif /* DB_H */
