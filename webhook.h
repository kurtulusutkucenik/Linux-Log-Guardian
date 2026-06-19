#ifndef WEBHOOK_H
#define WEBHOOK_H

#include "anomaly.h"
#include <stdio.h>

#define WEBHOOK_MAX_TELEGRAM_CHATS 4
#define WEBHOOK_CHAT_CSV_LEN       512

/*
 * Bildirim kanallari — rules.conf veya ortam degiskenleri.
 * Token/URL hic bir zaman kaynak koda yazilmaz.
 */
typedef struct {
    char token[256];
    char chat_id_csv[WEBHOOK_CHAT_CSV_LEN]; /* virgul/boslukla coklu chat_id */
    char telegram_chats[WEBHOOK_MAX_TELEGRAM_CHATS][64];
    int  telegram_chat_count;
    char telegram_chats_crit[WEBHOOK_MAX_TELEGRAM_CHATS][64];
    int  telegram_chat_crit_count;
    char telegram_chats_warn[WEBHOOK_MAX_TELEGRAM_CHATS][64];
    int  telegram_chat_warn_count;
    int  telegram_route_by_level; /* WEBHOOK_TELEGRAM_ROUTE — CRIT/WARN ayri hedef */
    int  telegram_batch_sec;    /* WEBHOOK_TELEGRAM_BATCH_SEC — WARN/INFO ozet (0=kapali) */
    int  quiet_hours_enabled;   /* WEBHOOK_QUIET_HOURS ayarli */
    int  quiet_start_min;       /* gece yarisindan dakika (or. 23:00 -> 1380) */
    int  quiet_end_min;         /* or. 08:00 -> 480 */
    char quiet_hours_spec[16];  /* or. "23:00-08:00" — /status icin */
    char telegram_alert_fmt[512]; /* WEBHOOK_TELEGRAM_ALERT_FMT — bos=varsayilan */
    int  daily_summary_enabled; /* WEBHOOK_DAILY_SUMMARY ayarli */
    int  daily_summary_at_min;  /* gece yarisindan dakika (or. 08:00 -> 480) */
    char daily_summary_spec[8]; /* or. "08:00" */
    int  weekly_summary_enabled; /* WEBHOOK_WEEKLY_SUMMARY ayarli */
    int  weekly_summary_wday;   /* 0=Pazar … 6=Cumartesi */
    int  weekly_summary_at_min; /* or. 20:00 -> 1200 */
    char weekly_summary_spec[16]; /* or. "Sun:20:00" */
    char generic_url[512];
    int  enabled;
    int  min_level;
    int  cooldown_sec;
    int  async_enabled;   /* WEBHOOK_ASYNC (varsayilan 1) */
    int  silent_info;     /* WEBHOOK_SILENT_INFO — INFO sessiz (varsayilan 1) */
    int  telegram_bot_enabled; /* WEBHOOK_TELEGRAM_BOT — /status + inline Ack */
    int  operator_mute_sec;    /* WEBHOOK_OPERATOR_MUTE_SEC — inline Sessiz suresi */
    int  telegram_topic_waf;   /* WEBHOOK_TELEGRAM_TOPIC_WAF — forum #waf thread_id (0=kapali) */
    int  telegram_topic_ban;   /* WEBHOOK_TELEGRAM_TOPIC_BAN — forum #ban */
    int  telegram_topic_trap;  /* WEBHOOK_TELEGRAM_TOPIC_TRAP — forum #trap */
    int  telegram_topic_warn;  /* WEBHOOK_TELEGRAM_TOPIC_WARN — forum #uyari */
    int  telegram_mirror_warn; /* WEBHOOK_TELEGRAM_MIRROR_WARN — WARN DM + Ops */
    char dashboard_base_url[256];   /* WEBHOOK_DASHBOARD_BASE_URL — deep-link kok */
    char telegram_card_photo_url[512]; /* WEBHOOK_TELEGRAM_CARD_PHOTO_URL — sendPhoto (ops.) */
    int  telegram_rich_card;    /* WEBHOOK_TELEGRAM_RICH_CARD — URL buton + deep-link */
    int  telegram_disable_preview; /* WEBHOOK_TELEGRAM_DISABLE_PREVIEW — link onizleme kapali */
    int  telegram_reply_chain;  /* WEBHOOK_TELEGRAM_REPLY_CHAIN — ayni IP reply_to zinciri */
    int  telegram_reply_chain_sec; /* WEBHOOK_TELEGRAM_REPLY_CHAIN_SEC — anchor TTL (sn) */
    int  telegram_geoip;        /* WEBHOOK_TELEGRAM_GEOIP — alarmda ulke satiri */
    int  telegram_pin_crit;     /* WEBHOOK_TELEGRAM_PIN_CRIT — CRIT alarm pin (grup) */
    char telegram_webhook_url[512];    /* WEBHOOK_TELEGRAM_WEBHOOK_URL — setWebhook HTTPS */
    char telegram_webhook_secret[128]; /* WEBHOOK_TELEGRAM_WEBHOOK_SECRET — X-Telegram-Bot-Api-Secret-Token */
} WebhookConfig;

extern WebhookConfig g_webhook;

typedef struct {
    int ok;
    int fail;
} WebhookDeliveryStats;

void webhook_init(void);
void webhook_shutdown(void);
void webhook_batch_flush(void);

void webhook_set_telegram_chat_csv(const char *csv);
void webhook_set_telegram_chat_crit_csv(const char *csv);
void webhook_set_telegram_chat_warn_csv(const char *csv);
int  webhook_telegram_chat_allowed(const char *chat_id);
int  webhook_telegram_target_count(void);
void webhook_config_metrics(long *route_on, long *batch_sec);
void webhook_set_quiet_hours(const char *spec); /* "23:00-08:00" veya bos=kapali */
void webhook_set_daily_summary(const char *hhmm); /* "08:00" veya bos=kapali */
void webhook_set_weekly_summary(const char *spec); /* "Sun:20:00" veya bos=kapali */
void webhook_set_telegram_topics(int waf, int ban, int trap, int warn);
int  webhook_telegram_mirror_warn_enabled(void);
void webhook_telegram_topics_line(char *buf, size_t cap); /* /status icin */
void webhook_set_dashboard_base_url(const char *url);
void webhook_set_telegram_card_photo_url(const char *url);
int  webhook_telegram_rich_card_enabled(void);
int  webhook_telegram_disable_preview_enabled(void);
int  webhook_telegram_reply_chain_enabled(void);
int  webhook_telegram_geoip_enabled(void);
int  webhook_telegram_pin_crit_enabled(void);
const char *webhook_dashboard_base_url(void);
int  webhook_build_incident_url(const char *incident_id, char *out, size_t cap);
int  webhook_build_ban_url(const char *ip, char *out, size_t cap);
int  webhook_build_trap_url(char *out, size_t cap);
void webhook_set_telegram_webhook_url(const char *url);
void webhook_set_telegram_webhook_secret(const char *secret);
int  webhook_telegram_webhook_enabled(void);
const char *webhook_telegram_webhook_url(void);
const char *webhook_telegram_webhook_secret(void);
int  webhook_quiet_hours_enabled(void);
int  webhook_quiet_hours_active(void); /* simdiki saat sessiz pencerede mi */
int  webhook_daily_summary_enabled(void);
const char *webhook_quiet_hours_spec(void);
const char *webhook_daily_summary_spec(void);
void webhook_daily_summary_tick(const char *db_path);
int  webhook_send_daily_summary(const char *db_path, int force_resend);
int  webhook_weekly_summary_enabled(void);
const char *webhook_weekly_summary_spec(void);
void webhook_weekly_summary_tick(const char *db_path);
int  webhook_send_weekly_summary(const char *db_path, int force_resend);

void webhook_send_alert(const Alert *a);
void webhook_send_ban(const char *ip, time_t ts, const char *reason,
                      double risk_score, const char *policy);
void webhook_send_trap(const char *file_path, time_t ts);

void webhook_set_test_mode(int on);
void webhook_delivery_stats(WebhookDeliveryStats *out);
int  webhook_send_test(const char *kind);

int webhook_destinations_configured(void);
int webhook_is_dry_run(void);
void webhook_status_json(FILE *out);

void webhook_metrics_snapshot(long *sent, long *fail, long *queue_drops, long *queue_depth);
/* fail_only=1: yalnizca fail sifirla (Grafana increase stale onleme) */
void webhook_metrics_reset(int fail_only);

/* Telegram inline: operator IP sessiz (varsayilan operator_mute_sec) */
void webhook_operator_mute_ip(const char *ip, int sec);
int  webhook_operator_mute_sec(void);

#endif /* WEBHOOK_H */
