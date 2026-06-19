#ifndef TELEGRAM_BOT_H
#define TELEGRAM_BOT_H

#include <stddef.h>

typedef void (*TelegramOpsStatusFn)(char *buf, size_t cap);
/* 0=yeni onay, 1=tekrar, -1=hata */
typedef int (*TelegramAckFn)(const char *chat_id, const char *ack_key,
                             const char *operator_id, const char *operator_name);
typedef void (*TelegramInlineFn)(const char *chat_id, const char *verb,
                                   const char *arg);
typedef void (*TelegramLastFn)(char *html, size_t cap);
typedef void (*TelegramUnackedFn)(char *html, size_t cap);
typedef void (*TelegramIncidentFn)(const char *incident_id, char *html, size_t cap);

void telegram_bot_set_ops_status(TelegramOpsStatusFn fn);
void telegram_bot_set_ack_hook(TelegramAckFn fn);
void telegram_bot_set_ack_db_path(const char *path);
void telegram_bot_set_inline_hook(TelegramInlineFn fn);
void telegram_bot_set_last_hook(TelegramLastFn fn);
void telegram_bot_set_unacked_hook(TelegramUnackedFn fn);
void telegram_bot_set_incident_hook(TelegramIncidentFn fn);
void telegram_bot_start(void);
void telegram_bot_stop(void);
int  telegram_bot_enabled(void);
int  telegram_bot_webhook_mode(void);
void telegram_bot_handle_update(const char *json);
int  telegram_bot_webhook_secret_ok(const char *header_value);
int  telegram_bot_register_webhook(void);
void telegram_bot_unregister_webhook(void);

/* CRIT/WARN inline keyboard JSON (callback_data max 64) */
void telegram_bot_build_ack_markup(const char *incident_or_ip,
                                   char *out, size_t cap);
void telegram_bot_build_alert_markup(const char *ack_key, const char *ip,
                                     const char *dashboard_url,
                                     char *out, size_t cap);

#endif /* TELEGRAM_BOT_H */
