/* covert_ch.h — Covert Channel & Steganography Detection Engine
 *
 * Veri hırsızlığı yöntemleri:
 *   A) Yüksek entropili Cookie/ETag başlıkları (veri gizleme)
 *   B) Yanıt boyutu sapması (LSB steganografi, PNG içi veri)
 *   C) DNS tüneli (uzun/entropi-yüksek subdomain)
 *   D) HTTP timing channel (yanıt süresi örüntüsü)
 */
#ifndef COVERT_CH_H
#define COVERT_CH_H

#include "parser.h"
#include "ip_map.h"
#include <stdint.h>
#include <time.h>

/* Eşikler */
#define COVERT_COOKIE_ENTROPY_THRESH   5.5    /* bit/karakter */
#define COVERT_RESP_SIZE_DEVIATION     0.15   /* %15 sapma */
#define COVERT_RESP_HISTORY_SIZE       32
#define COVERT_DNS_SUBDOMAIN_LEN       45     /* max kabul edilebilir subdomain */
#define COVERT_DNS_ENTROPY_THRESH      4.2
#define COVERT_TIMING_PATTERN_SAMPLES  8

/* Tespit kategorisi */
typedef enum {
    COVERT_NONE         = 0,
    COVERT_COOKIE       = 1,   /* Cookie/ETag entropi anomalisi */
    COVERT_RESP_SIZE    = 2,   /* Yanıt boyutu sapması */
    COVERT_DNS_TUNNEL   = 3,   /* DNS tüneli */
    COVERT_TIMING       = 4,   /* Zamanlama kanalı */
    COVERT_MULTI        = 5,   /* Birden fazla sinyal */
} CovertType;

/* Yanıt boyutu geçmişi (URL başına) */
typedef struct {
    uint32_t url_hash;
    uint32_t sizes[COVERT_RESP_HISTORY_SIZE];
    uint8_t  head;
    uint8_t  count;
    uint32_t mean;
} RespSizeTracker;

#define COVERT_SIZE_TRACKER_COUNT (1 << 12)  /* 4096 URL */

/* Tespit sonucu */
typedef struct {
    CovertType type;
    double     entropy;          /* Tespit edilen entropi değeri */
    char       detail[128];      /* İnsan-okunabilir açıklama */
} CovertResult;

/* ── API ──────────────────────────────────────────────────────────── */
void covert_ch_init(void);

/*
 * Ana analiz fonksiyonu. Bir log entry'si için tüm kanalları kontrol eder.
 * Tespit varsa COVERT_NONE dışı değer döner.
 */
CovertType covert_ch_analyze(IpRecord *rec, const LogEntry *e,
                             CovertResult *out);

/* Cookie/ETag entropi analizi */
int covert_detect_cookie(StrView cookie, StrView etag, double *entropy_out);

/* Yanıt boyutu sapma analizi */
int covert_detect_resp_size(StrView url, uint32_t resp_bytes);

/* DNS tüneli tespiti (Host / Referer başlıklarında) */
int covert_detect_dns_tunnel(StrView host);

/* İstatistikler */
void covert_get_stats(uint64_t *cookie_hits, uint64_t *respsize_hits,
                      uint64_t *dns_hits,    uint64_t *timing_hits);

#endif /* COVERT_CH_H */
