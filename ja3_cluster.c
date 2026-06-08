/* ja3_cluster.c — Dagitik saldiri: ayni UA/JA3 → ban_pipeline toplu ban */
#define _GNU_SOURCE
#include "ja3_cluster.h"
#include "ban_pipeline.h"
#include "fp_trust.h"
#include "logger.h"
extern int g_output_json;
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdatomic.h>

#define JA3_CLUSTER_BUCKETS   256
#define JA3_CLUSTER_MAX_IPS   96
#define JA3_CLUSTER_KEY_LEN   72
#define JA3_CLUSTER_IP_LEN    48

typedef struct {
    char     key[JA3_CLUSTER_KEY_LEN];
    char     ips[JA3_CLUSTER_MAX_IPS][JA3_CLUSTER_IP_LEN];
    int      ip_count;
    time_t   last_seen;
    uint8_t  banned;
} Ja3ClusterBucket;

static Ja3ClusterBucket g_buckets[JA3_CLUSTER_BUCKETS];
static int              g_enabled;
static int              g_min_ips = 3;
static _Atomic uint64_t g_cluster_bans;
static _Atomic uint64_t g_clusters_active;

static uint32_t fnv1a(const char *s, size_t n)
{
    uint32_t h = 2166136261u;
    for (size_t i = 0; i < n; i++) {
        h ^= (unsigned char)s[i];
        h *= 16777619u;
    }
    return h;
}

void ja3_cluster_init(void)
{
    memset(g_buckets, 0, sizeof(g_buckets));
}

int ja3_cluster_enabled(void)
{
    return g_enabled;
}

void ja3_cluster_config(int enabled, int min_ips)
{
    g_enabled = enabled ? 1 : 0;
    if (min_ips >= 2)
        g_min_ips = min_ips;
}

static Ja3ClusterBucket *bucket_for_key(const char *key)
{
    uint32_t h = fnv1a(key, strlen(key));
    for (int i = 0; i < JA3_CLUSTER_BUCKETS; i++) {
        int idx = (int)((h + (uint32_t)i) % JA3_CLUSTER_BUCKETS);
        Ja3ClusterBucket *b = &g_buckets[idx];
        if (!b->key[0])
            return b;
        if (strcmp(b->key, key) == 0)
            return b;
    }
    return NULL;
}

static int bucket_has_ip(Ja3ClusterBucket *b, const char *ip)
{
    for (int i = 0; i < b->ip_count; i++) {
        if (strcmp(b->ips[i], ip) == 0)
            return 1;
    }
    return 0;
}

static int bucket_add_ip(Ja3ClusterBucket *b, const char *ip)
{
    if (b->ip_count >= JA3_CLUSTER_MAX_IPS)
        return 0;
    if (bucket_has_ip(b, ip))
        return 0;
    strncpy(b->ips[b->ip_count], ip, JA3_CLUSTER_IP_LEN - 1);
    b->ips[b->ip_count][JA3_CLUSTER_IP_LEN - 1] = '\0';
    b->ip_count++;
    return 1;
}

static int flush_cluster_bans(Ja3ClusterBucket *b)
{
    if (b->banned || b->ip_count < g_min_ips)
        return 0;

    int ok = 0;
    char reason[128];
    snprintf(reason, sizeof(reason), "ja3-cluster %s (%d IP)",
             b->key, b->ip_count);

    for (int i = 0; i < b->ip_count; i++) {
        if (fp_trust_is_trusted(b->ips[i]))
            continue;
        BanPath path;
        if (ban_pipeline_ban(b->ips[i], reason, &path) == 0)
            ok++;
    }

    b->banned = 1;
    if (!g_output_json) {
        fprintf(stderr, "[JA3-CLUSTER] flush %d IP (%s) ok=%d\n",
                b->ip_count, b->key, ok);
    }
    if (ok > 0)
        atomic_fetch_add(&g_cluster_bans, (uint64_t)ok);
    return ok;
}

int ja3_cluster_track(const char *ip, const char *fingerprint, time_t ts)
{
    if (!g_enabled || !ip || !ip[0] || !fingerprint || !fingerprint[0])
        return 0;
    if (fp_trust_is_trusted(ip))
        return 0;

    Ja3ClusterBucket *b = bucket_for_key(fingerprint);
    if (!b)
        return 0;

    if (!b->key[0]) {
        strncpy(b->key, fingerprint, JA3_CLUSTER_KEY_LEN - 1);
        b->key[JA3_CLUSTER_KEY_LEN - 1] = '\0';
        atomic_fetch_add(&g_clusters_active, 1);
    }

    b->last_seen = ts > 0 ? ts : time(NULL);
    bucket_add_ip(b, ip);

    if (b->ip_count >= g_min_ips && !b->banned)
        return flush_cluster_bans(b);
    return 0;
}

void ja3_cluster_get_stats(uint64_t *clusters_active, uint64_t *cluster_bans)
{
    if (clusters_active)
        *clusters_active = atomic_load(&g_clusters_active);
    if (cluster_bans)
        *cluster_bans = atomic_load(&g_cluster_bans);
}

void ja3_cluster_fingerprint_ua(const char *ua, size_t ua_len,
                                char *out, size_t out_cap)
{
    if (!out || out_cap < 8) return;
    if (!ua || ua_len == 0) {
        out[0] = '\0';
        return;
    }
    uint32_t h = fnv1a(ua, ua_len);
    snprintf(out, out_cap, "ua:%08x", h);
}

void ja3_cluster_fingerprint_ja3(const char *ja3_hash, char *out, size_t out_cap)
{
    if (!out || out_cap < 12 || !ja3_hash || !ja3_hash[0]) {
        if (out && out_cap > 0) out[0] = '\0';
        return;
    }
    snprintf(out, out_cap, "ja3:%s", ja3_hash);
}
