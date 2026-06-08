#ifndef LOGGER_H
#define LOGGER_H

#include <syslog.h>
#include <stddef.h>

/* Initialize syslog connection and rate limiter */
void log_rl_init(void);

/* Rate limited logging function */
void log_rl(int priority, const char *fmt, ...);

#define LOG_RL(prio, ...) log_rl(prio, __VA_ARGS__)

/* JSON formatinda alert kaydetme (SIEM / ELK entegrasyonu) */
void log_alert_json(const void *alert_ptr, const char *filepath);

/*
 * Audit log HMAC anahtarını ayarla.
 * key: ham bayt dizisi (min 16, max 64 byte).
 * key_len: anahtar uzunluğu.
 * Çağrılmadan önce log_alert_json_signed() HMAC üretmez.
 */
void log_set_hmac_key(const unsigned char *key, size_t key_len);

/*
 * HMAC-SHA256 imzalı JSON alert kaydı.
 * Her satır sonuna "hmac":"<64hex>" alanı eklenir.
 * Adli analiz için log bütünlüğü sağlar.
 */
void log_alert_json_signed(const void *alert_ptr, const char *filepath);

/*
 * ArcSight CEF (Common Event Format) formatında alert kaydı.
 * Gelişmiş SIEM ürünlerine (QRadar, ArcSight) native entegrasyon.
 */
void log_alert_cef(const void *alert_ptr, const char *filepath);

#endif /* LOGGER_H */
