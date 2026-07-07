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
#define DB_STATUS_MAX_ACKS   8

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
    time_t ts;
    char   ack_key[64];
    char   operator_name[64];
    char   operator_id[64];
} DbRecentAck;

typedef struct {
    long alerts_total;
    long bans_active;
    int  recent_count;
    DbRecentAlert recent[DB_STATUS_MAX_ALERTS];
    int  recent_ban_count;
    DbRecentBan recent_bans[DB_STATUS_MAX_BANS];
    int  recent_ack_count;
    DbRecentAck recent_acks[DB_STATUS_MAX_ACKS];
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
/* 0=yeni onay, 1=aynı operator tekrar, -1=hata */
int db_telegram_ack_register_path(const char *db_path, const char *chat_id,
                                  const char *ack_key, const char *incident_id,
                                  const char *operator_id,
                                  const char *operator_name);
/* "Ali, Veli" — ack_key veya incident eslesmesi */
int db_telegram_ack_names_path(const char *db_path, const char *ack_key,
                               char *buf, size_t cap);
/* Son since_ts (unix) itibari Telegram ack sayisi — /status icin */
int db_telegram_ack_count_path(const char *db_path, time_t since_ts, long *out);

#define DB_UNACKED_MAX 10

/* Onay bekleyen olay sayisi (WARN/CRIT alert + ban, son since_ts) */
int db_unacked_count_path(const char *db_path, time_t since_ts, long *out);
/* HTML metin — Telegram /unacked (son since_ts, en fazla DB_UNACKED_MAX satir) */
int db_unacked_format_path(const char *db_path, time_t since_ts,
                           char *buf, size_t cap);
/* Tek incident ozeti — Telegram /incident INC-… */
int db_incident_format_path(const char *db_path, const char *incident_id,
                            char *buf, size_t cap);

typedef struct {
    long alerts_total;
    long alerts_crit;
    long alerts_warn;
    long alerts_info;
    long bans_new;
    long bans_active;
    long traps;
    long acks;
    long unacked;
} DbDailySummary;

/* Son since_ts (unix) itibari gunluk ozet sayilari */
int db_daily_summary_path(const char *db_path, time_t since_ts, DbDailySummary *out);

/* Prometheus / ops — ban_events DB boyutu (ban mantigina dokunmaz) */
typedef struct {
    long ban_events_total;
    long intel_legacy_rows;
    long intel_summary_rows;
} DbBanDbGauge;

int db_ban_db_gauge_path(const char *db_path, DbBanDbGauge *out);

#endif /* DB_H */
