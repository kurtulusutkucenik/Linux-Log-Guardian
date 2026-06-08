/* fp_trust.c — IP/tenant guven EMA ile yanlis pozitif bastirma */
#define _GNU_SOURCE
#include "fp_trust.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <pthread.h>

#define FP_POOL_SIZE (1u << 16)
#define FP_ALPHA     0.12
#define FP_PARTIAL_EMA 0.65
#define FP_FULL_EMA    0.82

typedef struct {
    char     ip[46];
    double   clean_ema;
    uint64_t samples;
    uint64_t suppress_count;
    time_t   first_seen;
    time_t   last_seen;
    time_t   last_alert;
    uint8_t  partial;
    uint8_t  trusted;
} FpTrustSlot;

static FpTrustSlot      g_pool[FP_POOL_SIZE];
static int              g_enabled;
static int              g_trust_days = 30;
static int              g_min_samples = 100;
static char             g_store_path[512] = "data/fp-trust.lst";
static char             g_tenant_id[128] = "default_tenant";
static double           g_tenant_ema;
static uint64_t         g_tenant_samples;
static uint64_t         g_suppressed_total;
static pthread_mutex_t  g_persist_mu = PTHREAD_MUTEX_INITIALIZER;

static uint32_t fp_hash(const char *s)
{
    uint32_t h = 2166136261u;
    for (const char *p = s; *p; p++) {
        h ^= (uint8_t)*p;
        h *= 16777619u;
    }
    return h & (FP_POOL_SIZE - 1);
}

static FpTrustSlot *fp_slot(const char *ip)
{
    if (!ip || !*ip) return NULL;
    uint32_t idx = fp_hash(ip);
    for (uint32_t i = 0; i < FP_POOL_SIZE; i++) {
        FpTrustSlot *s = &g_pool[(idx + i) & (FP_POOL_SIZE - 1)];
        if (s->ip[0] && strcmp(s->ip, ip) != 0)
            continue;
        if (!s->ip[0]) {
            strncpy(s->ip, ip, sizeof(s->ip) - 1);
            s->first_seen = time(NULL);
        }
        return s;
    }
    return NULL;
}

static double benign_score(const LogEntry *e)
{
    if (!e) return 0.5;
    if (e->status >= 200 && e->status < 400) return 1.0;
    if (e->status == 401 || e->status == 403 || e->status == 404) return 0.75;
    if (e->status >= 500) return 0.15;
    return 0.5;
}

static void refresh_flags(FpTrustSlot *s)
{
    if (!s || !s->ip[0]) return;
    time_t now = time(NULL);
    int days_ok = g_trust_days <= 0
        || (s->first_seen > 0 && (now - s->first_seen) >= (time_t)g_trust_days * 86400);

    s->partial = (s->samples >= (uint64_t)g_min_samples / 2u
                  && s->clean_ema >= FP_PARTIAL_EMA) ? 1 : 0;
    s->trusted = (s->samples >= (uint64_t)g_min_samples
                  && s->clean_ema >= FP_FULL_EMA
                  && days_ok) ? 1 : 0;
}

static int never_suppress_message(const Alert *a)
{
    if (!a || !a->message[0]) return 0;
    static const char *needles[] = {
        "SQL INJECTION", "WAF ALARM", "BEACONING", "COVERT CHANNEL",
        "HONEY-TOKEN", "APT ", "JA3", "TLS PLAINTEXT", NULL
    };
    for (int i = 0; needles[i]; i++) {
        if (strstr(a->message, needles[i])) return 1;
    }
    return 0;
}

void fp_trust_init(void)
{
    memset(g_pool, 0, sizeof(g_pool));
    g_tenant_ema = 0.5;
    g_tenant_samples = 0;
    g_suppressed_total = 0;

    if (!g_store_path[0]) return;
    FILE *f = fopen(g_store_path, "r");
    if (!f) return;

    char ip[48];
    double ema;
    unsigned long long samples, suppress;
    long fs, ls, la;
    while (fscanf(f, "%47s %lf %llu %llu %ld %ld %ld",
                  ip, &ema, &samples, &suppress, &fs, &ls, &la) >= 3) {
        FpTrustSlot *s = fp_slot(ip);
        if (!s) continue;
        s->clean_ema = ema;
        s->samples = (uint64_t)samples;
        s->suppress_count = (uint64_t)suppress;
        s->first_seen = (time_t)fs;
        s->last_seen = (time_t)ls;
        s->last_alert = (time_t)la;
        refresh_flags(s);
    }
    fclose(f);
}

void fp_trust_config(int enabled, int trust_days, int min_samples,
                     const char *store_path)
{
    g_enabled = enabled ? 1 : 0;
    if (trust_days >= 0) g_trust_days = trust_days;
    if (min_samples > 0) g_min_samples = min_samples;
    if (store_path && store_path[0]) {
        strncpy(g_store_path, store_path, sizeof(g_store_path) - 1);
        g_store_path[sizeof(g_store_path) - 1] = '\0';
    }
}

void fp_trust_set_tenant(const char *tenant_id)
{
    if (!tenant_id) return;
    strncpy(g_tenant_id, tenant_id, sizeof(g_tenant_id) - 1);
    g_tenant_id[sizeof(g_tenant_id) - 1] = '\0';
}

void fp_trust_observe(const char *ip, const LogEntry *e)
{
    if (!g_enabled || !ip || !e) return;
    FpTrustSlot *s = fp_slot(ip);
    if (!s) return;

    double score = benign_score(e);
    if (s->samples == 0)
        s->clean_ema = score;
    else
        s->clean_ema = FP_ALPHA * score + (1.0 - FP_ALPHA) * s->clean_ema;

    s->samples++;
    s->last_seen = e->ts > 0 ? e->ts : time(NULL);
    refresh_flags(s);

    if (g_tenant_samples == 0)
        g_tenant_ema = score;
    else
        g_tenant_ema = FP_ALPHA * score + (1.0 - FP_ALPHA) * g_tenant_ema;
    g_tenant_samples++;
}

void fp_trust_note_alert(const char *ip)
{
    FpTrustSlot *s = fp_slot(ip);
    if (!s) return;
    s->last_alert = time(NULL);
    s->clean_ema *= 0.85;
    if (s->clean_ema < 0.1) s->clean_ema = 0.1;
    s->partial = 0;
    s->trusted = 0;
}

void fp_trust_note_suppressed(const char *ip)
{
    FpTrustSlot *s = fp_slot(ip);
    if (s) s->suppress_count++;
    g_suppressed_total++;
}

int fp_trust_should_suppress(const char *ip, const Alert *alert)
{
    if (!g_enabled || !ip || !alert || alert->level == ALERT_NONE)
        return 0;
    if (never_suppress_message(alert))
        return 0;

    FpTrustSlot *s = fp_slot(ip);
    if (!s) return 0;

    if (alert->level <= ALERT_WARN && (s->partial || s->trusted))
        return 1;

    if (alert->level == ALERT_CRIT && s->trusted && s->clean_ema >= 0.88) {
        if (alert->mitre_id[0] == 'T') {
            if (strcmp(alert->mitre_id, "T1110") == 0 ||
                strcmp(alert->mitre_id, "T1083") == 0 ||
                strcmp(alert->mitre_id, "T1499") == 0)
                return 1;
        }
    }
    return 0;
}

double fp_trust_adaptive_boost(const char *ip)
{
    if (!g_enabled || !ip) return 1.0;
    FpTrustSlot *s = fp_slot(ip);
    if (!s) return 1.0;
    if (s->trusted) return 2.0;
    if (s->partial) return 1.5;
    if (g_tenant_ema >= 0.8 && g_tenant_samples > (uint64_t)g_min_samples)
        return 1.25;
    return 1.0;
}

int fp_trust_is_trusted(const char *ip)
{
    if (!g_enabled || !ip || !ip[0])
        return 0;
    FpTrustSlot *s = fp_slot(ip);
    return s && s->trusted;
}

void fp_trust_persist(void)
{
    if (!g_store_path[0]) return;
    pthread_mutex_lock(&g_persist_mu);
    char tmp[560];
    snprintf(tmp, sizeof(tmp), "%s.tmp", g_store_path);
    FILE *f = fopen(tmp, "w");
    if (!f) {
        pthread_mutex_unlock(&g_persist_mu);
        return;
    }
    for (size_t i = 0; i < FP_POOL_SIZE; i++) {
        FpTrustSlot *s = &g_pool[i];
        if (!s->ip[0] || s->samples == 0) continue;
        fprintf(f, "%s %.6f %llu %llu %ld %ld %ld\n",
                s->ip, s->clean_ema, (unsigned long long)s->samples,
                (unsigned long long)s->suppress_count,
                (long)s->first_seen, (long)s->last_seen, (long)s->last_alert);
    }
    fclose(f);
    rename(tmp, g_store_path);
    pthread_mutex_unlock(&g_persist_mu);
}

void fp_trust_export_json(const char *path)
{
    if (!path || !path[0]) return;
    FpTrustStats st;
    fp_trust_get_stats(&st);

    FILE *f = fopen(path, "w");
    if (!f) return;
    fprintf(f,
            "{\n"
            "  \"enabled\": %s,\n"
            "  \"trust_days\": %d,\n"
            "  \"min_samples\": %d,\n"
            "  \"tenant_id\": \"%s\",\n"
            "  \"tenant_clean_ema\": %.4f,\n"
            "  \"trusted_ips\": %llu,\n"
            "  \"partial_ips\": %llu,\n"
            "  \"suppressed_total\": %llu\n"
            "}\n",
            st.enabled ? "true" : "false",
            st.trust_days, st.min_samples, st.tenant_id,
            st.tenant_clean_ema,
            (unsigned long long)st.trusted_ips,
            (unsigned long long)st.partial_ips,
            (unsigned long long)st.suppressed_total);
    fclose(f);
}

void fp_trust_get_stats(FpTrustStats *out)
{
    if (!out) return;
    memset(out, 0, sizeof(*out));
    out->enabled = g_enabled;
    out->trust_days = g_trust_days;
    out->min_samples = g_min_samples;
    out->tenant_clean_ema = g_tenant_ema;
    out->suppressed_total = g_suppressed_total;
    strncpy(out->tenant_id, g_tenant_id, sizeof(out->tenant_id) - 1);

    for (size_t i = 0; i < FP_POOL_SIZE; i++) {
        if (!g_pool[i].ip[0]) continue;
        if (g_pool[i].trusted) out->trusted_ips++;
        else if (g_pool[i].partial) out->partial_ips++;
    }
}
