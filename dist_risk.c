/* dist_risk.c — JA3/UA + /24 + ulke korelasyonu → ban risk bonusu */
#define _GNU_SOURCE
#include "dist_risk.h"
#include "geoip_lookup.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <stdatomic.h>

#define DR_BUCKETS   96
#define DR_MAX_IPS   24
#define DR_KEY_LEN   40
#define DR_IP_LEN    48

typedef struct {
    char    key[DR_KEY_LEN];
    char    ips[DR_MAX_IPS][DR_IP_LEN];
    int     ip_count;
    time_t  window_start;
} DrBucket;

static void bucket_reset_if_stale(DrBucket *b, time_t now);

static DrBucket g_sl[DR_BUCKETS];
static DrBucket g_fp[DR_BUCKETS];
static DrBucket g_cc[48];
static int      g_enabled;
static int      g_min_ips = 3;
static int      g_window_sec = 300;
static atomic_uint_fast64_t g_observe_total = 0;
static atomic_uint_fast64_t g_bonus_applied = 0;

int dist_risk_enabled(void)
{
    return g_enabled;
}

static int count_active_buckets(DrBucket *table, int n, time_t now)
{
    int c = 0;
    for (int i = 0; i < n; i++) {
        DrBucket *b = &table[i];
        if (!b->key[0])
            continue;
        bucket_reset_if_stale(b, now);
        if (b->key[0] && b->ip_count >= 2)
            c++;
    }
    return c;
}

void dist_risk_get_stats(uint64_t *buckets_active, uint64_t *bonus_applied,
                         uint64_t *observe_total)
{
    time_t now = time(NULL);
    if (buckets_active)
        *buckets_active = (uint64_t)(count_active_buckets(g_sl, DR_BUCKETS, now)
                                   + count_active_buckets(g_fp, DR_BUCKETS, now)
                                   + count_active_buckets(g_cc, 48, now));
    if (bonus_applied)
        *bonus_applied = atomic_load(&g_bonus_applied);
    if (observe_total)
        *observe_total = atomic_load(&g_observe_total);
}

static uint32_t fnv1a(const char *s)
{
    uint32_t h = 2166136261u;
    for (; s && *s; s++) {
        h ^= (unsigned char)*s;
        h *= 16777619u;
    }
    return h;
}

void dist_risk_init(void)
{
    memset(g_sl, 0, sizeof(g_sl));
    memset(g_fp, 0, sizeof(g_fp));
    memset(g_cc, 0, sizeof(g_cc));
}

void dist_risk_config(int enabled)
{
    g_enabled = enabled ? 1 : 0;
}

void dist_risk_set_min_ips(int n)
{
    if (n >= 2)
        g_min_ips = n;
}

void dist_risk_set_window_sec(int sec)
{
    if (sec >= 60 && sec <= 3600)
        g_window_sec = sec;
}

static int ipv4_slash24(const char *ip, char *out, size_t cap)
{
    struct in_addr a;
    if (!ip || !out || cap < 12)
        return 0;
    if (inet_pton(AF_INET, ip, &a) != 1)
        return 0;
    uint32_t n = ntohl(a.s_addr);
    if ((n & 0xff000000u) == 0x7f000000u)
        return 0;
    if ((n & 0xffff0000u) == 0xc0a80000u)
        return 0;
    if ((n & 0xff000000u) == 0x0a000000u)
        return 0;
    unsigned o1 = (n >> 24) & 0xff;
    unsigned o2 = (n >> 16) & 0xff;
    unsigned o3 = (n >> 8) & 0xff;
    snprintf(out, cap, "sl:%u.%u.%u", o1, o2, o3);
    return 1;
}

static DrBucket *bucket_get(DrBucket *table, int n, const char *key)
{
    if (!key || !key[0])
        return NULL;
    uint32_t h = fnv1a(key);
    for (int i = 0; i < n; i++) {
        int idx = (int)((h + (uint32_t)i) % (uint32_t)n);
        DrBucket *b = &table[idx];
        if (!b->key[0]) {
            strncpy(b->key, key, DR_KEY_LEN - 1);
            b->key[DR_KEY_LEN - 1] = '\0';
            b->window_start = time(NULL);
            return b;
        }
        if (strcmp(b->key, key) == 0)
            return b;
    }
    return NULL;
}

static void bucket_reset_if_stale(DrBucket *b, time_t now)
{
    if (!b || !b->key[0])
        return;
    if (b->window_start && (now - b->window_start) > g_window_sec) {
        memset(b, 0, sizeof(*b));
    }
}

static int bucket_has_ip(DrBucket *b, const char *ip)
{
    for (int i = 0; i < b->ip_count; i++) {
        if (strcmp(b->ips[i], ip) == 0)
            return 1;
    }
    return 0;
}

static void bucket_add_ip(DrBucket *b, const char *ip, time_t now)
{
    if (!b || !ip || !ip[0])
        return;
    if (!b->window_start)
        b->window_start = now;
    if (bucket_has_ip(b, ip))
        return;
    if (b->ip_count >= DR_MAX_IPS)
        return;
    strncpy(b->ips[b->ip_count], ip, DR_IP_LEN - 1);
    b->ips[b->ip_count][DR_IP_LEN - 1] = '\0';
    b->ip_count++;
}

static int bucket_count_for_ip(DrBucket *table, int n, const char *ip, time_t now)
{
    for (int i = 0; i < n; i++) {
        DrBucket *b = &table[i];
        if (!b->key[0])
            continue;
        bucket_reset_if_stale(b, now);
        if (!b->key[0])
            continue;
        if (bucket_has_ip(b, ip))
            return b->ip_count;
    }
    return 0;
}

void dist_risk_observe(const char *ip, const char *fingerprint, time_t ts)
{
    if (!g_enabled || !ip || !ip[0])
        return;
    atomic_fetch_add(&g_observe_total, 1);
    time_t now = ts > 0 ? ts : time(NULL);

    char slkey[DR_KEY_LEN];
    if (ipv4_slash24(ip, slkey, sizeof(slkey))) {
        DrBucket *b = bucket_get(g_sl, DR_BUCKETS, slkey);
        if (b) {
            bucket_reset_if_stale(b, now);
            if (b->key[0])
                bucket_add_ip(b, ip, now);
        }
    }

    if (fingerprint && fingerprint[0]) {
        char fpkey[DR_KEY_LEN];
        snprintf(fpkey, sizeof(fpkey), "fp:%.28s", fingerprint);
        DrBucket *b = bucket_get(g_fp, DR_BUCKETS, fpkey);
        if (b) {
            bucket_reset_if_stale(b, now);
            if (b->key[0])
                bucket_add_ip(b, ip, now);
        }
    }

    if (geoip_lookup_enabled()) {
        char cc[4] = "";
        if (geoip_lookup_country(ip, cc, sizeof(cc)) && cc[0]) {
            char cckey[DR_KEY_LEN];
            snprintf(cckey, sizeof(cckey), "cc:%s", cc);
            DrBucket *b = bucket_get(g_cc, 48, cckey);
            if (b) {
                bucket_reset_if_stale(b, now);
                if (b->key[0])
                    bucket_add_ip(b, ip, now);
            }
        }
    }
}

double dist_risk_bonus(const char *ip)
{
    if (!g_enabled || !ip || !ip[0])
        return 0.0;

    time_t now = time(NULL);
    double bonus = 0.0;

    int sl_n = bucket_count_for_ip(g_sl, DR_BUCKETS, ip, now);
    if (sl_n >= 5)
        bonus += 12.0;
    else if (sl_n >= g_min_ips)
        bonus += 6.0;

    int fp_n = bucket_count_for_ip(g_fp, DR_BUCKETS, ip, now);
    if (fp_n >= g_min_ips)
        bonus += 8.0;
    else if (fp_n >= 2)
        bonus += 4.0;

    int cc_n = bucket_count_for_ip(g_cc, 48, ip, now);
    if (cc_n >= 4)
        bonus += 4.0;

    if (bonus > 20.0)
        bonus = 20.0;
    if (bonus > 0.0)
        atomic_fetch_add(&g_bonus_applied, 1);
    return bonus;
}
