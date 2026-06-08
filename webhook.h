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
    char discord_url[512];
    char slack_url[512];
    char generic_url[512];
    int  enabled;
    int  min_level;
    int  cooldown_sec;
    int  async_enabled;   /* WEBHOOK_ASYNC (varsayilan 1) */
    int  silent_info;     /* WEBHOOK_SILENT_INFO — INFO sessiz (varsayilan 1) */
    int  telegram_bot_enabled; /* WEBHOOK_TELEGRAM_BOT — /status + inline Ack */
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

#endif /* WEBHOOK_H */
