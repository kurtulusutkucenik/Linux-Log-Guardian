/* adaptive_threshold.h — EMA Tabanlı Dinamik Eşik Motoru
 *
 * Her IP için gerçek zamanlı trafik bazlı eşik hesaplar.
 * Statik rules.conf değerlerinin "yavaş ve sessiz" ataklarda
 * başarısız olma sorununu ortadan kaldırır.
 *
 * Algoritma: Üstel Hareketli Ortalama (EMA)
 *   EMA_new = alpha * value + (1 - alpha) * EMA_old
 *
 * Faz Geçişleri:
 *   WARMUP  (< WARMUP_SAMPLES): Öğrenme fazı, ban yok
 *   NORMAL  : Temel hat oluştu, anomali tespiti aktif
 *   ALERT   : EMA × warn_mult aşıldı → uyarı
 *   BAN     : EMA × ban_mult aşıldı → ban
 */
#pragma once
#ifndef ADAPTIVE_THRESHOLD_H
#define ADAPTIVE_THRESHOLD_H

#include <stdint.h>
#include <time.h>
#include <stdatomic.h>

/* Isınma süresi: İlk N örnekte false-positive üretme */
#define ADAPTIVE_WARMUP_SAMPLES   100

/* 1 saniyelik penceredeki maksimum slot sayısı */
#define ADAPTIVE_WINDOW_SEC       60

/* Bir IP'nin kendi EMA tablosu */
typedef struct {
    double   ema_rps;           /* Saniyedeki istek EMA'sı           */
    double   ema_err_rate;      /* 4xx hata oranı EMA'sı (0.0-1.0)   */
    double   ema_resp_ms;       /* Yanıt süresi EMA'sı                */
    uint64_t sample_count;      /* Toplam gözlem sayısı               */
    time_t   last_update;       /* Son EMA güncellemesi               */
    _Atomic uint32_t window_rps; /* Son 1 sn'deki gerçek RPS          */
} AdaptiveRecord;

/* Global adaptive motor parametreleri */
typedef struct {
    double alpha;               /* EMA yumuşatma katsayısı (0.05–0.3) */
    double warn_multiplier;     /* EMA × warn_mult → ALERT             */
    double ban_multiplier;      /* EMA × ban_mult  → BAN               */
    int    enabled;             /* 0 = devre dışı, 1 = aktif           */
    int    warmup_samples;      /* Isınma fazı eşiği                   */
} AdaptiveConfig;

/* Adaptive motor karar sonucu */
typedef enum {
    ADAPTIVE_OK    = 0,   /* Normal trafik                    */
    ADAPTIVE_WARN  = 1,   /* Şüpheli: warn_multiplier aşıldı  */
    ADAPTIVE_BAN   = 2,   /* Tehdit: ban_multiplier aşıldı    */
    ADAPTIVE_WARMUP = 3,  /* Öğrenme fazında, karar yok       */
} AdaptiveDecision;

/* API */
void             adaptive_config_set(double alpha, double warn_mult,
                                     double ban_mult, int warmup_samples);
void             adaptive_config_set_enabled(int enabled);
void             adaptive_config_get(AdaptiveConfig *out);
void             adaptive_record_init(AdaptiveRecord *rec);
AdaptiveDecision adaptive_check(AdaptiveRecord *rec, uint32_t cur_rps,
                                double cur_err_rate, long cur_resp_ms);
AdaptiveDecision adaptive_check_boost(AdaptiveRecord *rec, uint32_t cur_rps,
                                      double cur_err_rate, long cur_resp_ms,
                                      double threshold_boost);
void             adaptive_update(AdaptiveRecord *rec, uint32_t cur_rps,
                                 double cur_err_rate, long cur_resp_ms);
const char      *adaptive_decision_str(AdaptiveDecision d);
void             adaptive_global_reset(void);   /* SIGHUP sonrası */

#endif /* ADAPTIVE_THRESHOLD_H */
