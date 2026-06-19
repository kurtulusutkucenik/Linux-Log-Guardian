/* fp_trust.h — Adaptive false-positive learning (IP + tenant trust) */
#pragma once
#ifndef FP_TRUST_H
#define FP_TRUST_H

#include "anomaly.h"
#include "parser.h"
#include <stddef.h>
#include <stdint.h>

void fp_trust_init(void);
void fp_trust_config(int enabled, int trust_days, int min_samples,
                     const char *store_path);
void fp_trust_set_tenant(const char *tenant_id);

/** FP_TRUST_AUTO_WHITELIST=1: tam guvene ulasan IP icin (opsiyonel) */
typedef void (*fp_trust_promote_fn)(const char *ip);
void fp_trust_register_promote_fn(fp_trust_promote_fn fn);

/* Her log satirinda cagir (temiz trafik EMA'si) */
void fp_trust_observe(const char *ip, const LogEntry *e);

/* Alarm emit oncesi: 1 = bastir (FP ogrenme) */
int fp_trust_should_suppress(const char *ip, const Alert *alert);

/* Adaptive threshold carpani (1.0 = normal, 2.0 = guvenilir IP) */
double fp_trust_adaptive_boost(const char *ip);

void fp_trust_note_suppressed(const char *ip);
void fp_trust_note_alert(const char *ip);

/* FP_LEARN acikken tam guvenilir IP (cluster ban haric tutma) */
int fp_trust_is_trusted(const char *ip);

void fp_trust_persist(void);
void fp_trust_export_json(const char *path);

typedef struct {
    int      enabled;
    int      trust_days;
    int      min_samples;
    uint64_t trusted_ips;
    uint64_t partial_ips;
    uint64_t suppressed_total;
    double   tenant_clean_ema;
    char     tenant_id[128];
} FpTrustStats;

void fp_trust_get_stats(FpTrustStats *out);

#endif /* FP_TRUST_H */
