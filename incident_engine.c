/* incident_engine.c — Ayni IP: access log + execve/lineage → tek INCIDENT_ID */
#define _GNU_SOURCE
#include "incident_engine.h"
#include <stdio.h>
#include <string.h>
#include <strings.h>
#include <time.h>
#include <stdatomic.h>

#define INC_SLOTS     256
#define INC_HOT_MAX   64
#define INC_WINDOW_DEFAULT 600

typedef struct {
    char     ip[IP_STR_LEN];
    uint32_t signals;
    uint16_t log_hits;
    time_t   first_ts;
    time_t   last_ts;
    char     incident_id[24];
} IncSlot;

static IncSlot g_slots[INC_SLOTS];
static char    g_hot_ips[INC_HOT_MAX][IP_STR_LEN];
static int     g_hot_n;
static int     g_window_sec = INC_WINDOW_DEFAULT;
static int     g_min_log_hits = 3;
static atomic_uint_fast64_t g_correlated_total;

static uint32_t ip_hash(const char *ip)
{
    uint32_t h = 5381;
    for (const unsigned char *p = (const unsigned char *)ip; *p; p++)
        h = h * 33u + *p;
    return h;
}

static int is_valid_client_ip(const char *ip)
{
    if (!ip || !ip[0]) return 0;
    if (strcmp(ip, "lineage") == 0 || strcmp(ip, "SYSTEM") == 0) return 0;
    return strchr(ip, '.') != NULL || strchr(ip, ':') != NULL;
}

static IncSlot *slot_find(const char *ip)
{
    if (!is_valid_client_ip(ip)) return NULL;
    uint32_t h = ip_hash(ip);
    for (int i = 0; i < INC_SLOTS; i++) {
        IncSlot *s = &g_slots[(h + (uint32_t)i) % INC_SLOTS];
        if (s->ip[0] && strcmp(s->ip, ip) == 0) return s;
    }
    return NULL;
}

static IncSlot *slot_get_or_create(const char *ip)
{
    IncSlot *existing = slot_find(ip);
    if (existing) return existing;

    uint32_t h = ip_hash(ip);
    for (int i = 0; i < INC_SLOTS; i++) {
        IncSlot *s = &g_slots[(h + (uint32_t)i) % INC_SLOTS];
        if (!s->ip[0]) {
            strncpy(s->ip, ip, sizeof(s->ip) - 1);
            s->ip[sizeof(s->ip) - 1] = '\0';
            return s;
        }
    }
    /* tablo dolu — en eski slotu yeniden kullan */
    IncSlot *oldest = &g_slots[0];
    for (int i = 1; i < INC_SLOTS; i++) {
        if (g_slots[i].last_ts < oldest->last_ts) oldest = &g_slots[i];
    }
    memset(oldest, 0, sizeof(*oldest));
    strncpy(oldest->ip, ip, sizeof(oldest->ip) - 1);
    return oldest;
}

static void hot_touch(const char *ip)
{
    for (int i = 0; i < g_hot_n; i++) {
        if (strcmp(g_hot_ips[i], ip) == 0) return;
    }
    if (g_hot_n < INC_HOT_MAX) {
        strncpy(g_hot_ips[g_hot_n++], ip, IP_STR_LEN - 1);
        return;
    }
    memmove(g_hot_ips[0], g_hot_ips[1],
            (size_t)(INC_HOT_MAX - 1) * sizeof(g_hot_ips[0]));
    strncpy(g_hot_ips[INC_HOT_MAX - 1], ip, IP_STR_LEN - 1);
}

static int signal_popcount_log(uint32_t sig)
{
    int n = 0;
    if (sig & INC_SIG_LOG_SQLI)  n++;
    if (sig & INC_SIG_LOG_WAF)   n++;
    if (sig & INC_SIG_LOG_BRUTE) n++;
    return n;
}

static int should_correlate(const IncSlot *s)
{
    if (!s) return 0;
    uint32_t sig = s->signals;
    int log_any = signal_popcount_log(sig) > 0;
    int log_multi = signal_popcount_log(sig) >= 2;
    int ebpf_any = (sig & (INC_SIG_EBPF_EXECVE | INC_SIG_EBPF_LINEAGE |
                           INC_SIG_EBPF_OUTBOUND)) != 0;
    if (log_any && ebpf_any) return 1;
    if (log_multi) return 1;
    if (log_any && (int)s->log_hits >= g_min_log_hits) return 1;
    return 0;
}

static void maybe_open_incident(IncSlot *s)
{
    if (!s || s->incident_id[0]) return;
    if (!should_correlate(s)) return;

    snprintf(s->incident_id, sizeof(s->incident_id),
             "INC-%08lx-%04lx",
             (unsigned long)time(NULL), (unsigned long)(ip_hash(s->ip) & 0xffffu));
    atomic_fetch_add(&g_correlated_total, 1);
}

static void slot_refresh_window(IncSlot *s, time_t now)
{
    if (!s->ip[0]) return;
    if (s->last_ts && (now - s->last_ts) > (time_t)g_window_sec) {
        memset(s, 0, sizeof(*s));
    }
}

void incident_engine_init(void)
{
    memset(g_slots, 0, sizeof(g_slots));
    g_hot_n = 0;
}

void incident_engine_set_window_sec(int sec)
{
    if (sec >= 60 && sec <= 86400) g_window_sec = sec;
}

void incident_engine_set_min_log_hits(int n)
{
    if (n >= 1 && n <= 64) g_min_log_hits = n;
}

void incident_engine_note_signal(const char *ip, uint32_t signal)
{
    if (!signal || !is_valid_client_ip(ip)) return;
    time_t now = time(NULL);
    IncSlot *s = slot_get_or_create(ip);
    if (!s) return;
    slot_refresh_window(s, now);
    if (!s->ip[0]) strncpy(s->ip, ip, sizeof(s->ip) - 1);
    if (!s->first_ts) s->first_ts = now;
    if (signal & (INC_SIG_LOG_SQLI | INC_SIG_LOG_WAF | INC_SIG_LOG_BRUTE))
        s->log_hits++;
    s->signals |= signal;
    s->last_ts = now;
    hot_touch(ip);
    maybe_open_incident(s);
}

void incident_engine_note_host_signal(uint32_t signal)
{
    if (!signal) return;
    time_t now = time(NULL);
    for (int i = 0; i < g_hot_n; i++) {
        IncSlot *s = slot_find(g_hot_ips[i]);
        if (!s) continue;
        if ((now - s->last_ts) > (time_t)g_window_sec) continue;
        s->signals |= signal;
        s->last_ts = now;
        maybe_open_incident(s);
    }
}

uint32_t incident_engine_infer_signal(const Alert *alert)
{
    if (!alert) return 0;
    const char *m = alert->message;
    if (strstr(m, "SQLi") || strstr(m, "SQL") || strstr(m, "sqli"))
        return INC_SIG_LOG_SQLI;
    if (strstr(m, "WAF") || strstr(m, "Schema") || strstr(m, "BOLA"))
        return INC_SIG_LOG_WAF;
    if (strstr(m, "Brute") || strstr(m, "brute"))
        return INC_SIG_LOG_BRUTE;
    if (strstr(m, "Attack tree") || strstr(m, "lineage") || strstr(m, "Lineage"))
        return INC_SIG_EBPF_LINEAGE;
    if (strstr(m, "outbound") || strstr(m, "connect") || strstr(m, "C2"))
        return INC_SIG_EBPF_OUTBOUND;
    if (strstr(m, "RCE") || strstr(m, "execve") || strstr(m, "EXEC"))
        return INC_SIG_EBPF_EXECVE;
    return INC_SIG_LOG_WAF;
}

void incident_engine_attach_alert(Alert *alert, const char *ip)
{
    if (!alert || !is_valid_client_ip(ip)) return;
    IncSlot *s = slot_find(ip);
    if (s) maybe_open_incident(s);
    if (s && s->incident_id[0]) {
        strncpy(alert->incident_id, s->incident_id, sizeof(alert->incident_id) - 1);
        alert->incident_id[sizeof(alert->incident_id) - 1] = '\0';
    }
}

const char *incident_engine_best_ip(void)
{
    const char *best = NULL;
    uint32_t best_sig = 0;
    time_t now = time(NULL);
    for (int i = 0; i < g_hot_n; i++) {
        IncSlot *s = slot_find(g_hot_ips[i]);
        if (!s) continue;
        if ((now - s->last_ts) > (time_t)g_window_sec) continue;
        if (s->signals > best_sig) {
            best_sig = s->signals;
            best = s->ip;
        }
    }
    return best;
}

void incident_engine_get_stats(uint64_t *active, uint64_t *correlated)
{
    time_t now = time(NULL);
    uint64_t a = 0;
    for (int i = 0; i < INC_SLOTS; i++) {
        if (!g_slots[i].ip[0]) continue;
        if ((now - g_slots[i].last_ts) > (time_t)g_window_sec) continue;
        if (g_slots[i].incident_id[0]) a++;
    }
    if (active) *active = a;
    if (correlated) *correlated = atomic_load(&g_correlated_total);
}

static const char *signal_label(uint32_t sig)
{
    if (sig & INC_SIG_EBPF_EXECVE)    return "ebpf_execve";
    if (sig & INC_SIG_EBPF_OUTBOUND)  return "ebpf_outbound";
    if (sig & INC_SIG_EBPF_LINEAGE)   return "ebpf_lineage";
    if (sig & INC_SIG_LOG_SQLI)       return "log_sqli";
    if (sig & INC_SIG_LOG_WAF)        return "log_waf";
    if (sig & INC_SIG_LOG_BRUTE)      return "log_brute";
    return "unknown";
}

double incident_engine_risk_score(uint32_t signals, uint16_t log_hits)
{
    double score = (double)log_hits * 8.0;
    if (signals & INC_SIG_LOG_SQLI)   score += 12.0;
    if (signals & INC_SIG_LOG_WAF)    score += 10.0;
    if (signals & INC_SIG_LOG_BRUTE)  score += 8.0;
    if (signals & INC_SIG_EBPF_EXECVE)    score += 28.0;
    if (signals & INC_SIG_EBPF_LINEAGE)   score += 18.0;
    if (signals & INC_SIG_EBPF_OUTBOUND)  score += 22.0;
    if (score > 100.0) score = 100.0;
    return score;
}

double incident_engine_ip_risk(const char *ip)
{
    if (!is_valid_client_ip(ip)) return 0.0;
    IncSlot *s = slot_find(ip);
    if (!s || !s->ip[0]) return 0.0;
    time_t now = time(NULL);
    if (s->last_ts && (now - s->last_ts) > (time_t)g_window_sec) return 0.0;
    return incident_engine_risk_score(s->signals, s->log_hits);
}

static int append_incident_json(char *buf, size_t buf_sz, int *pos, const IncSlot *s, int first)
{
    double risk = incident_engine_risk_score(s->signals, s->log_hits);
    const char *action = risk >= 85.0 ? "BAN_IP" : (risk >= 50.0 ? "MONITOR" : "LOG");
    return snprintf(buf + *pos, buf_sz - (size_t)*pos,
        "%s{\"incident_id\":\"%s\",\"ip\":\"%s\",\"risk_score\":%.1f,"
        "\"signals\":%u,\"log_hits\":%u,\"first_ts\":%ld,\"last_ts\":%ld,"
        "\"primary_signal\":\"%s\",\"suggested_action\":\"%s\"}",
        first ? "" : ",",
        s->incident_id, s->ip, risk,
        (unsigned)s->signals, (unsigned)s->log_hits,
        (long)s->first_ts, (long)s->last_ts,
        signal_label(s->signals), action);
}

int incident_engine_export_json(char *buf, size_t buf_sz)
{
    if (!buf || buf_sz < 32) return -1;
    time_t now = time(NULL);
    int pos = snprintf(buf, buf_sz, "{\"incidents\":[");
    if (pos < 0 || (size_t)pos >= buf_sz) return -1;
    int count = 0;
    for (int i = 0; i < INC_SLOTS; i++) {
        IncSlot *s = &g_slots[i];
        if (!s->ip[0] || !s->incident_id[0]) continue;
        if ((now - s->last_ts) > (time_t)g_window_sec) continue;
        int n = append_incident_json(buf, buf_sz, &pos, s, count == 0);
        if (n < 0 || (size_t)pos + (size_t)n >= buf_sz) break;
        pos += n;
        count++;
    }
    pos += snprintf(buf + pos, buf_sz - (size_t)pos, "],\"count\":%d}", count);
    return pos;
}

int incident_engine_export_one(const char *incident_id, char *buf, size_t buf_sz)
{
    if (!incident_id || !buf || buf_sz < 64) return -1;
    time_t now = time(NULL);
    for (int i = 0; i < INC_SLOTS; i++) {
        IncSlot *s = &g_slots[i];
        if (!s->incident_id[0] || strcmp(s->incident_id, incident_id) != 0) continue;
        if ((now - s->last_ts) > (time_t)g_window_sec) return -1;
        double risk = incident_engine_risk_score(s->signals, s->log_hits);
        const char *action = risk >= 85.0 ? "BAN_IP" : (risk >= 50.0 ? "MONITOR" : "LOG");
        return snprintf(buf, buf_sz,
            "{\"incident_id\":\"%s\",\"ip\":\"%s\",\"risk_score\":%.1f,"
            "\"signals\":%u,\"log_hits\":%u,\"first_ts\":%ld,\"last_ts\":%ld,"
            "\"ebpf_chain\":[\"%s\"],\"log_hits_detail\":{\"count\":%u},"
            "\"suggested_action\":\"%s\"}",
            s->incident_id, s->ip, risk,
            (unsigned)s->signals, (unsigned)s->log_hits,
            (long)s->first_ts, (long)s->last_ts,
            signal_label(s->signals), (unsigned)s->log_hits, action);
    }
    return -1;
}
