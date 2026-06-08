#ifndef TELEGRAM_BOT_H
#define TELEGRAM_BOT_H

#include <stddef.h>

typedef void (*TelegramOpsStatusFn)(char *buf, size_t cap);
typedef void (*TelegramAckFn)(const char *chat_id, const char *ack_key);
typedef void (*TelegramLastFn)(char *html, size_t cap);

void telegram_bot_set_ops_status(TelegramOpsStatusFn fn);
void telegram_bot_set_ack_hook(TelegramAckFn fn);
void telegram_bot_set_last_hook(TelegramLastFn fn);
void telegram_bot_start(void);
void telegram_bot_stop(void);
int  telegram_bot_enabled(void);

/* CRIT/WARN inline keyboard JSON (callback_data max 64) */
void telegram_bot_build_ack_markup(const char *incident_or_ip,
                                   char *out, size_t cap);

#endif /* TELEGRAM_BOT_H */
