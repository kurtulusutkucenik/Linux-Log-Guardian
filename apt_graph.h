/* apt_graph.h — Graph-Based Distributed APT Correlation Engine
 *
 * Devlet destekli gruplar tek IP'den saldırmaz. 50 farklı IP'den
 * çok yavaş, aynı payload hash'i veya aynı beaconing ritmiyle
 * saldırırlar. Bu modül bunu Union-Find ile yakalar.
 *
 * Tespit kriterleri:
 *   1. Aynı payload hash'ini >= APT_MIN_CLUSTER_IPS ayrı IP gönderdi
 *   2. Aynı kümede IP'lerin istek zamanları ±2sn içinde senkronize
 *   3. Kümedeki payload'ların Shannon entropisi istatistiksel olarak eş
 */
#ifndef APT_GRAPH_H
#define APT_GRAPH_H

#include "parser.h"
#include <stdint.h>
#include <time.h>
#include <netinet/in.h>

/* Ayarlanabilir eşikler */
#define APT_MIN_CLUSTER_IPS   5    /* Aynı payload → kaç farklı IP → alarm */
#define APT_SYNC_WINDOW_SEC   2    /* Senkron beaconing penceresi (sn) */
#define APT_CLUSTER_MAX_IPS   32   /* Küme başına max IP */
#define APT_HASH_BUCKETS      (1 << 14)  /* 16384 payload hash bucket */
#define APT_MAX_CLUSTERS      512  /* Toplam max aktif küme */

/* Tek bir APT küme kaydı */
typedef struct {
    uint32_t  payload_hash;                     /* FNV-1a normalized payload */
    struct in6_addr ip_list[APT_CLUSTER_MAX_IPS]; /* IPv4-mapped-IPv6 / IPv6 */
    uint8_t   ip_count;
    double    payload_entropy;                  /* Ortalama Shannon entropisi */
    time_t    first_seen;
    time_t    last_seen;
    time_t    last_request_times[APT_CLUSTER_MAX_IPS]; /* Beaconing tespiti */
    uint8_t   synchronized;                     /* 1 = senkron beaconing */
    uint8_t   alerted;                          /* Alarm zaten üretildi mi */
} AptCluster;

/* Tespit sonucu */
typedef enum {
    APT_RESULT_CLEAN    = 0,
    APT_RESULT_CLUSTER  = 1,   /* Yeni küme eşiği aşıldı */
    APT_RESULT_SYNC_APT = 2,   /* Senkronize beaconing tespit edildi */
    APT_RESULT_ENTROPY  = 3,   /* Aynı entropi kümesi tespit edildi */
} AptResult;

/* ── API ──────────────────────────────────────────────────────────── */
void      apt_graph_init(void);
AptResult apt_graph_submit(const char *ip_str, StrView url,
                           StrView body, time_t ts);
void      apt_graph_describe(uint32_t payload_hash, char *out, size_t len);
void      apt_graph_get_stats(uint64_t *total_clusters,
                              uint64_t *apt_detections);
void      apt_graph_purge_old(time_t older_than);

#endif /* APT_GRAPH_H */
