/* apt_graph.c — Graph-Based Distributed APT Correlation Engine */
#include "apt_graph.h"
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <stdatomic.h>
#include <arpa/inet.h>
#include <pthread.h>

static pthread_mutex_t g_apt_mutex = PTHREAD_MUTEX_INITIALIZER;
static AptCluster g_clusters[APT_MAX_CLUSTERS];
static int        g_cluster_count = 0;

/* Hash tablosu: payload_hash → cluster index */
static int16_t g_hash_table[APT_HASH_BUCKETS]; /* -1 = boş */

static _Atomic uint64_t g_total_clusters   = 0;
static _Atomic uint64_t g_apt_detections   = 0;

/* ── Yardımcı: Shannon entropy ───────────────────────────────────── */
static double shannon(const char *s, size_t len) {
    if (!s || len == 0) return 0.0;
    unsigned long freq[256] = {0};
    for (size_t i = 0; i < len; i++) freq[(unsigned char)s[i]]++;
    double e = 0.0;
    for (int i = 0; i < 256; i++) {
        if (!freq[i]) continue;
        double p = (double)freq[i] / (double)len;
        e -= p * log2(p);
    }
    return e;
}

/* ── Payload normalizasyonu + FNV-1a hash ────────────────────────── */
/*
 * Normalizasyon: URL query string ve body birleştirilir, büyük/küçük
 * harf dönüşümü yapılır, sayısal değerler '?' ile maskelenir.
 * Bu sayede "id=1" ve "id=9" aynı hash'i üretir.
 */
static uint32_t normalize_payload_hash(StrView url, StrView body) {
    uint32_t h = 2166136261u;
    /* URL path'i al (? öncesi) */
    const char *q = url.ptr;
    size_t qlen = url.len;
    for (size_t i = 0; i < url.len; i++) {
        if (url.ptr[i] == '?') { qlen = i; break; }
    }
    /* Path'i hash'le */
    for (size_t i = 0; i < qlen; i++) {
        char c = q[i];
        if (c >= 'A' && c <= 'Z') c += 32;
        h ^= (uint8_t)c; h *= 16777619u;
    }
    /* Body'yi hash'le ama sayıları '?' ile değiştir */
    for (size_t i = 0; i < body.len && i < 512; i++) {
        char c = body.ptr[i];
        if (c >= '0' && c <= '9') c = '?';
        else if (c >= 'A' && c <= 'Z') c += 32;
        h ^= (uint8_t)c; h *= 16777619u;
    }
    return h;
}

/* ── IPv4/IPv6 string → struct in6_addr ──────────────────────────── */
static int ip_to_in6(const char *ip, struct in6_addr *out) {
    if (inet_pton(AF_INET6, ip, out) == 1) return 1;
    struct in_addr a4;
    if (inet_pton(AF_INET, ip, &a4) == 1) {
        /* IPv4-mapped IPv6 */
        memset(out->s6_addr, 0, 10);
        out->s6_addr[10] = 0xff;
        out->s6_addr[11] = 0xff;
        memcpy(&out->s6_addr[12], &a4.s_addr, 4);
        return 1;
    }
    return 0;
}

/* ── Küme arama / oluşturma ──────────────────────────────────────── */
static AptCluster *find_or_create_cluster(uint32_t hash) {
    uint16_t bucket = (uint16_t)(hash & (APT_HASH_BUCKETS - 1));
    int idx = g_hash_table[bucket];

    /* Var olan kümeyi bul */
    if (idx >= 0 && idx < g_cluster_count &&
        g_clusters[idx].payload_hash == hash)
        return &g_clusters[idx];

    /* Linear probe — çarpışma durumu */
    for (int i = 0; i < g_cluster_count; i++) {
        if (g_clusters[i].payload_hash == hash) {
            g_hash_table[bucket] = i;
            return &g_clusters[i];
        }
    }

    /* Yeni küme oluştur */
    if (g_cluster_count >= APT_MAX_CLUSTERS) return NULL;
    AptCluster *c = &g_clusters[g_cluster_count];
    memset(c, 0, sizeof(*c));
    c->payload_hash = hash;
    c->first_seen   = 0;
    g_hash_table[bucket] = g_cluster_count;
    g_cluster_count++;
    atomic_fetch_add(&g_total_clusters, 1);
    return c;
}

/* ── IP ekleme — çift kayıt önlemi ──────────────────────────────── */
static int cluster_add_ip(AptCluster *c, const struct in6_addr *ip, time_t ts) {
    for (int i = 0; i < c->ip_count; i++) {
        if (memcmp(&c->ip_list[i], ip, sizeof(struct in6_addr)) == 0) {
            c->last_request_times[i] = ts;
            return 0; /* zaten var, güncelle */
        }
    }
    if (c->ip_count >= APT_CLUSTER_MAX_IPS) return 0;
    int idx = c->ip_count++;
    memcpy(&c->ip_list[idx], ip, sizeof(struct in6_addr));
    c->last_request_times[idx] = ts;
    return 1; /* yeni IP eklendi */
}

/* ── Senkron beaconing kontrolü ──────────────────────────────────── */
/*
 * Kümedeki tüm IP'lerin son istek zamanları APT_SYNC_WINDOW_SEC içinde
 * ise → senkronize botnet davranışı.
 */
static int check_sync_beaconing(const AptCluster *c, time_t now) {
    if (c->ip_count < APT_MIN_CLUSTER_IPS) return 0;
    int active = 0;
    for (int i = 0; i < c->ip_count; i++) {
        if (c->last_request_times[i] > 0 &&
            (now - c->last_request_times[i]) <= APT_SYNC_WINDOW_SEC)
            active++;
    }
    return (active >= APT_MIN_CLUSTER_IPS) ? 1 : 0;
}

/* ── Ana tespit fonksiyonu ───────────────────────────────────────── */
void apt_graph_init(void) {
    pthread_mutex_lock(&g_apt_mutex);
    memset(g_clusters, 0, sizeof(g_clusters));
    memset(g_hash_table, -1, sizeof(g_hash_table));
    g_cluster_count = 0;
    pthread_mutex_unlock(&g_apt_mutex);
}

AptResult apt_graph_submit(const char *ip_str, StrView url,
                           StrView body, time_t ts) {
    if (!ip_str) return APT_RESULT_CLEAN;

    uint32_t hash = normalize_payload_hash(url, body);
    struct in6_addr ip;
    if (!ip_to_in6(ip_str, &ip)) return APT_RESULT_CLEAN;

    AptResult result = APT_RESULT_CLEAN;

    pthread_mutex_lock(&g_apt_mutex);

    AptCluster *c = find_or_create_cluster(hash);
    if (!c) goto unlock;

    if (c->first_seen == 0) c->first_seen = ts;
    c->last_seen = ts;

    cluster_add_ip(c, &ip, ts);

    /* Entropi güncelle */
    char combined[1024];
    int  clen = 0;
    size_t ul = url.len < 512 ? url.len : 512;
    size_t bl = body.len < 512 ? body.len : 512;
    memcpy(combined,      url.ptr,  ul); clen += (int)ul;
    memcpy(combined+clen, body.ptr, bl); clen += (int)bl;
    double ent = shannon(combined, (size_t)clen);
    /* Hareketli ortalama */
    c->payload_entropy = (c->payload_entropy == 0.0)
                         ? ent
                         : (c->payload_entropy * 0.8 + ent * 0.2);

    if (c->alerted) goto unlock;

    /* Kriter 1: Yeterli IP sayısına ulaşıldı */
    if (c->ip_count >= APT_MIN_CLUSTER_IPS) {
        /* Kriter 2: Senkron beaconing */
        if (check_sync_beaconing(c, ts)) {
            c->alerted    = 1;
            c->synchronized = 1;
            atomic_fetch_add(&g_apt_detections, 1);
            result = APT_RESULT_SYNC_APT;
            goto unlock;
        }
        /* Kriter 3: Yüksek entropi eşitliği */
        if (c->payload_entropy >= 4.5) {
            c->alerted = 1;
            atomic_fetch_add(&g_apt_detections, 1);
            result = APT_RESULT_ENTROPY;
            goto unlock;
        }
        /* Temel küme alarmı */
        c->alerted = 1;
        atomic_fetch_add(&g_apt_detections, 1);
        result = APT_RESULT_CLUSTER;
    }

unlock:
    pthread_mutex_unlock(&g_apt_mutex);
    return result;
}

void apt_graph_describe(uint32_t payload_hash, char *out, size_t len) {
    if (!out || len == 0) return;
    pthread_mutex_lock(&g_apt_mutex);
    for (int i = 0; i < g_cluster_count; i++) {
        if (g_clusters[i].payload_hash == payload_hash) {
            AptCluster *c = &g_clusters[i];
            char ip_buf[256] = {0};
            int  pos = 0;
            for (int j = 0; j < c->ip_count && pos < (int)sizeof(ip_buf)-40; j++) {
                char tmp[INET6_ADDRSTRLEN];
                inet_ntop(AF_INET6, &c->ip_list[j], tmp, sizeof(tmp));
                pos += snprintf(ip_buf+pos, sizeof(ip_buf)-pos,
                                j?", ":"" "%s", tmp);
            }
            snprintf(out, len,
                     "Kume#%08x | IP:%d | Senkron:%s | Entropi:%.2f | [%s]",
                     payload_hash, c->ip_count,
                     c->synchronized ? "EVET" : "HAYIR",
                     c->payload_entropy, ip_buf);
            pthread_mutex_unlock(&g_apt_mutex);
            return;
        }
    }
    snprintf(out, len, "Kume bulunamadi: %08x", payload_hash);
    pthread_mutex_unlock(&g_apt_mutex);
}

void apt_graph_get_stats(uint64_t *total_clusters, uint64_t *apt_detections) {
    if (total_clusters)  *total_clusters  = atomic_load(&g_total_clusters);
    if (apt_detections)  *apt_detections  = atomic_load(&g_apt_detections);
}

void apt_graph_purge_old(time_t older_than) {
    pthread_mutex_lock(&g_apt_mutex);
    for (int i = 0; i < g_cluster_count; i++) {
        if (g_clusters[i].last_seen < older_than) {
            /* Sil: son elemanla yer değiştir */
            g_clusters[i] = g_clusters[--g_cluster_count];
            memset(g_hash_table, -1, sizeof(g_hash_table));
            /* Hash tablosunu yeniden oluştur */
            for (int j = 0; j < g_cluster_count; j++) {
                uint16_t b = (uint16_t)(g_clusters[j].payload_hash
                                        & (APT_HASH_BUCKETS - 1));
                g_hash_table[b] = j;
            }
            i--;
        }
    }
    pthread_mutex_unlock(&g_apt_mutex);
}
