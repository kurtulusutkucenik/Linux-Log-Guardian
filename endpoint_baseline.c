#define _GNU_SOURCE
#include "endpoint_baseline.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <pthread.h>

#define EP_MAX_PATHS  128
#define EP_PATH_LEN   128

typedef struct {
    char   path[EP_PATH_LEN];
    double ema_rpm;
    time_t first_seen;
    time_t last_seen;
    uint64_t samples;
} EpSlot;

static EpSlot g_slots[EP_MAX_PATHS];
static int    g_enabled = 0;
static int    g_window_days = 7;
static double g_warn_mult = 4.0;
static double g_ban_mult  = 8.0;
static double g_alpha     = 0.08;
static char   g_store_path[512] = "";
static pthread_mutex_t g_mu = PTHREAD_MUTEX_INITIALIZER;

static EpSlot *slot_find(const char *path)
{
    for (int i = 0; i < EP_MAX_PATHS; i++) {
        if (g_slots[i].path[0] && strcmp(g_slots[i].path, path) == 0)
            return &g_slots[i];
    }
    return NULL;
}

static EpSlot *slot_get(const char *path)
{
    EpSlot *s = slot_find(path);
    if (s) return s;
    for (int i = 0; i < EP_MAX_PATHS; i++) {
        if (!g_slots[i].path[0]) {
            strncpy(g_slots[i].path, path, EP_PATH_LEN - 1);
            g_slots[i].first_seen = time(NULL);
            return &g_slots[i];
        }
    }
    EpSlot *oldest = &g_slots[0];
    for (int i = 1; i < EP_MAX_PATHS; i++) {
        if (g_slots[i].last_seen < oldest->last_seen) oldest = &g_slots[i];
    }
    memset(oldest, 0, sizeof(*oldest));
    strncpy(oldest->path, path, EP_PATH_LEN - 1);
    oldest->first_seen = time(NULL);
    return oldest;
}

static void endpoint_baseline_load(void)
{
    if (!g_store_path[0]) return;
    FILE *f = fopen(g_store_path, "r");
    if (!f) return;
    char path[EP_PATH_LEN];
    double ema;
    time_t fs, ls;
    unsigned long long samples;
    while (fscanf(f, "%127s %lf %ld %ld %llu", path, &ema, &fs, &ls, &samples) == 5) {
        EpSlot *s = slot_get(path);
        if (s) {
            s->ema_rpm = ema;
            s->first_seen = fs;
            s->last_seen = ls;
            s->samples = (uint64_t)samples;
        }
    }
    fclose(f);
}

void endpoint_baseline_init(void)
{
    const char *home = getenv("HOME");
    if (home && home[0]) {
        snprintf(g_store_path, sizeof(g_store_path),
                 "%s/.local/share/log-guardian/endpoint_baseline.dat", home);
    } else {
        strncpy(g_store_path, "./endpoint_baseline.dat", sizeof(g_store_path) - 1);
    }
    endpoint_baseline_load();
}

void endpoint_baseline_set_enabled(int on) { g_enabled = on ? 1 : 0; }
void endpoint_baseline_set_window_days(int days)
{
    if (days >= 1 && days <= 30) g_window_days = days;
}

void endpoint_baseline_persist(void)
{
    if (!g_store_path[0] || !g_enabled) return;
    FILE *f = fopen(g_store_path, "w");
    if (!f) return;
    pthread_mutex_lock(&g_mu);
    for (int i = 0; i < EP_MAX_PATHS; i++) {
        if (!g_slots[i].path[0]) continue;
        fprintf(f, "%s %.4f %ld %ld %llu\n",
                g_slots[i].path, g_slots[i].ema_rpm,
                (long)g_slots[i].first_seen, (long)g_slots[i].last_seen,
                (unsigned long long)g_slots[i].samples);
    }
    pthread_mutex_unlock(&g_mu);
    fclose(f);
}

int endpoint_baseline_check(const char *path, uint32_t rpm_now,
                            char *reason_out, size_t reason_sz)
{
    if (!g_enabled || !path || !path[0]) return 0;

    pthread_mutex_lock(&g_mu);
    EpSlot *s = slot_get(path);
    if (!s) { pthread_mutex_unlock(&g_mu); return 0; }

    time_t now = time(NULL);
    s->last_seen = now;
    s->samples++;

    if (s->samples == 1) {
        s->ema_rpm = (double)rpm_now;
        pthread_mutex_unlock(&g_mu);
        return 0;
    }

    s->ema_rpm = g_alpha * (double)rpm_now + (1.0 - g_alpha) * s->ema_rpm;

    time_t learn_end = s->first_seen + (time_t)g_window_days * 86400;
    int learning = (now < learn_end);

    int decision = 0;
    if (!learning && s->ema_rpm > 0.5) {
        if ((double)rpm_now >= s->ema_rpm * g_ban_mult) {
            decision = 2;
            if (reason_out && reason_sz)
                snprintf(reason_out, reason_sz,
                         "Endpoint baseline: %s RPM %u >> EMA %.1f (7d)",
                         path, rpm_now, s->ema_rpm);
        } else if ((double)rpm_now >= s->ema_rpm * g_warn_mult) {
            decision = 1;
            if (reason_out && reason_sz)
                snprintf(reason_out, reason_sz,
                         "Endpoint baseline warn: %s RPM %u > EMA %.1f",
                         path, rpm_now, s->ema_rpm);
        }
    }
    pthread_mutex_unlock(&g_mu);

    if (s->samples % 500 == 0)
        endpoint_baseline_persist();

    return decision;
}
