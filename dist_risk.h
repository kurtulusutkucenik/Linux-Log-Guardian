/* dist_risk.h — dagitik saldiri skoru: JA3/UA fp + /24 + ulke (ASN proxy) */
#pragma once

#include <stddef.h>
#include <stdint.h>
#include <time.h>

void dist_risk_init(void);
void dist_risk_config(int enabled);
void dist_risk_set_min_ips(int n);
void dist_risk_set_window_sec(int sec);

/** Her log satirinda (UA fingerprint ile) cagir. */
void dist_risk_observe(const char *ip, const char *fingerprint, time_t ts);

/** ban_policy risk skoruna eklenecek bonus (0..20). */
double dist_risk_bonus(const char *ip);

/** Prometheus /metrics: aktif bucket (ip_count>=2), bonus uygulama, observe sayaci */
void dist_risk_get_stats(uint64_t *buckets_active, uint64_t *bonus_applied,
                         uint64_t *observe_total);
int  dist_risk_enabled(void);
