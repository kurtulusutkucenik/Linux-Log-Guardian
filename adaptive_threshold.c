/* adaptive_threshold.c — EMA Tabanlı Dinamik Eşik Motoru
 *
 * Statik rules.conf eşiklerinin "low-and-slow" saldırıları kaçırma
 * sorununu çözer. Her IP'nin kendi trafik profiline göre dinamik eşik.
 */
#define _GNU_SOURCE
#include "adaptive_threshold.h"
#include <string.h>
#include <stdio.h>
#include <math.h>

/* Varsayılan konfigürasyon */
static AdaptiveConfig g_cfg = {
    .alpha          = 0.15,   /* Yavaş öğrenme: ani spike'lara dayanıklı */
    .warn_multiplier = 3.0,
    .ban_multiplier  = 5.0,
    .enabled         = 1,
    .warmup_samples  = ADAPTIVE_WARMUP_SAMPLES,
};

/* ── Konfigürasyon API ───────────────────────────────────────────────── */

void adaptive_config_set(double alpha, double warn_mult,
                         double ban_mult, int warmup_samples) {
    if (alpha > 0.0 && alpha < 1.0)  g_cfg.alpha           = alpha;
    if (warn_mult > 1.0)             g_cfg.warn_multiplier  = warn_mult;
    if (ban_mult  > warn_mult)       g_cfg.ban_multiplier   = ban_mult;
    if (warmup_samples > 0)          g_cfg.warmup_samples   = warmup_samples;
}

void adaptive_config_set_enabled(int enabled) {
    g_cfg.enabled = enabled ? 1 : 0;
}

void adaptive_config_get(AdaptiveConfig *out) {
    if (out) *out = g_cfg;
}

void adaptive_global_reset(void) {
    /* SIGHUP sonrası çağrılır; config sıfırlanmaz, sadece log */
    fprintf(stderr, "[ADAPTIVE] Global sıfırlama: alpha=%.2f warn=%.1fx ban=%.1fx\n",
            g_cfg.alpha, g_cfg.warn_multiplier, g_cfg.ban_multiplier);
}

/* ── Kayıt başlatma ─────────────────────────────────────────────────── */

void adaptive_record_init(AdaptiveRecord *rec) {
    if (!rec) return;
    memset(rec, 0, sizeof(*rec));
    rec->ema_rps      = 0.0;
    rec->ema_err_rate = 0.0;
    rec->ema_resp_ms  = 0.0;
    rec->sample_count = 0;
    rec->last_update  = 0;
    atomic_store(&rec->window_rps, 0u);
}

/* ── EMA güncelleme ─────────────────────────────────────────────────── */

void adaptive_update(AdaptiveRecord *rec, uint32_t cur_rps,
                     double cur_err_rate, long cur_resp_ms) {
    if (!rec || !g_cfg.enabled) return;

    double alpha = g_cfg.alpha;

    if (rec->sample_count == 0) {
        /* İlk örnek: EMA'yı doğrudan ata */
        rec->ema_rps      = (double)cur_rps;
        rec->ema_err_rate = cur_err_rate;
        rec->ema_resp_ms  = (double)cur_resp_ms;
    } else {
        /* EMA formülü: EMA_new = α × val + (1-α) × EMA_old */
        rec->ema_rps      = alpha * (double)cur_rps      + (1.0 - alpha) * rec->ema_rps;
        rec->ema_err_rate = alpha * cur_err_rate         + (1.0 - alpha) * rec->ema_err_rate;
        rec->ema_resp_ms  = alpha * (double)cur_resp_ms  + (1.0 - alpha) * rec->ema_resp_ms;
    }

    rec->sample_count++;
    rec->last_update = time(NULL);
    atomic_store(&rec->window_rps, cur_rps);
}

/* ── Karar motoru ────────────────────────────────────────────────────── */

AdaptiveDecision adaptive_check(AdaptiveRecord *rec, uint32_t cur_rps,
                                double cur_err_rate, long cur_resp_ms) {
    return adaptive_check_boost(rec, cur_rps, cur_err_rate, cur_resp_ms, 1.0);
}

AdaptiveDecision adaptive_check_boost(AdaptiveRecord *rec, uint32_t cur_rps,
                                      double cur_err_rate, long cur_resp_ms,
                                      double threshold_boost) {
    if (!rec || !g_cfg.enabled) return ADAPTIVE_OK;
    if (threshold_boost < 1.0) threshold_boost = 1.0;

    if (rec->sample_count < (uint64_t)g_cfg.warmup_samples)
        return ADAPTIVE_WARMUP;

    if (rec->ema_rps < 0.5 && rec->ema_err_rate < 0.01)
        return ADAPTIVE_OK;

    double rps_ratio  = (rec->ema_rps > 0.1)
                        ? (double)cur_rps / rec->ema_rps : 1.0;
    double err_ratio  = (rec->ema_err_rate > 0.01)
                        ? cur_err_rate / rec->ema_err_rate : 1.0;
    double resp_ratio = (rec->ema_resp_ms > 10.0)
                        ? (double)cur_resp_ms / rec->ema_resp_ms : 1.0;

    double threat_score = (rps_ratio * 3.0 + err_ratio * 2.0 + resp_ratio * 1.0) / 6.0;

    double ban_thr  = g_cfg.ban_multiplier * threshold_boost;
    double warn_thr = g_cfg.warn_multiplier * threshold_boost;

    if (threat_score >= ban_thr)  return ADAPTIVE_BAN;
    if (threat_score >= warn_thr) return ADAPTIVE_WARN;
    return ADAPTIVE_OK;
}

/* ── Yardımcı ─────────────────────────────────────────────────────────── */

const char *adaptive_decision_str(AdaptiveDecision d) {
    switch (d) {
        case ADAPTIVE_OK:     return "OK";
        case ADAPTIVE_WARN:   return "WARN";
        case ADAPTIVE_BAN:    return "BAN";
        case ADAPTIVE_WARMUP: return "WARMUP";
        default:              return "UNKNOWN";
    }
}
