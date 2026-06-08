/* ban_policy.c — AUTO_BAN_MIN_RISK + audit jsonl */
#define _GNU_SOURCE
#include "ban_policy.h"
#include "incident_engine.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <pthread.h>
#include <stdatomic.h>

static int     g_enabled = 1;
static double  g_min_risk = 60.0;
static char    g_audit_path[512] = "data/ban-policy-audit.jsonl";
static char    g_tenant_id[128] = "default";
static pthread_mutex_t g_audit_mu = PTHREAD_MUTEX_INITIALIZER;
static atomic_uint_fast64_t g_allowed = 0;
static atomic_uint_fast64_t g_skipped = 0;

void ban_policy_init(void)
{
    g_enabled = 1;
    g_min_risk = 60.0;
}

void ban_policy_set_tenant(const char *tenant_id)
{
    if (!tenant_id) return;
    strncpy(g_tenant_id, tenant_id, sizeof(g_tenant_id) - 1);
    g_tenant_id[sizeof(g_tenant_id) - 1] = '\0';
}

void ban_policy_config(int enabled, double min_risk, const char *audit_path)
{
    g_enabled = enabled ? 1 : 0;
    if (min_risk >= 0.0 && min_risk <= 100.0) g_min_risk = min_risk;
    if (audit_path && audit_path[0]) {
        strncpy(g_audit_path, audit_path, sizeof(g_audit_path) - 1);
        g_audit_path[sizeof(g_audit_path) - 1] = '\0';
    }
}

static double alert_risk_score(const Alert *a)
{
    if (!a) return 0.0;
    double r = (a->level == ALERT_CRIT) ? 45.0
            : (a->level == ALERT_WARN)  ? 25.0 : 10.0;
    const char *m = a->message;
    if (!m || !m[0]) return r;
    if (strstr(m, "SQL INJECTION") || strstr(m, "SQLi"))
        r += 40.0;
    else if (strstr(m, "WAF ALARM") || strstr(m, "Wasm"))
        r += 35.0;
    else if (strstr(m, "HONEY") || strstr(m, "TRAP"))
        r += 50.0;
    else if (strstr(m, "BRUTE") || strstr(m, "Brute"))
        r += 30.0;
    else if (strstr(m, "BEACONING") || strstr(m, "COVERT"))
        r += 38.0;
    if (r > 100.0) r = 100.0;
    return r;
}

int ban_policy_should_auto_ban(const char *ip, const Alert *alert,
                               BanPolicyVerdict *out)
{
    if (out) {
        memset(out, 0, sizeof(*out));
        out->min_risk = g_min_risk;
    }

    if (!g_enabled) {
        if (out) {
            out->allow_ban = 1;
            out->risk_score = alert_risk_score(alert);
            strncpy(out->decision, "policy_off", sizeof(out->decision) - 1);
        }
        return 1;
    }

    double inc_risk = ip ? incident_engine_ip_risk(ip) : 0.0;
    double al_risk  = alert_risk_score(alert);
    double risk = inc_risk > al_risk ? inc_risk : al_risk;

    if (alert && alert->level == ALERT_CRIT && al_risk >= 85.0) {
        if (out) {
            out->risk_score = risk;
            out->allow_ban = 1;
            strncpy(out->decision, "force_crit", sizeof(out->decision) - 1);
        }
        return 1;
    }

    int allow = (risk >= g_min_risk) ? 1 : 0;
    if (out) {
        out->risk_score = risk;
        out->allow_ban = allow;
        strncpy(out->decision, allow ? "ban" : "skip_risk",
                sizeof(out->decision) - 1);
    }
    return allow;
}

void ban_policy_audit(const char *ip, const Alert *alert,
                      const BanPolicyVerdict *v, int banned)
{
    if (!ip || !v) return;
    if (v->allow_ban) atomic_fetch_add(&g_allowed, 1);
    else            atomic_fetch_add(&g_skipped, 1);

    if (!g_audit_path[0]) return;
    pthread_mutex_lock(&g_audit_mu);
    FILE *f = fopen(g_audit_path, "a");
    if (f) {
        time_t now = time(NULL);
        char msg_esc[512];
        const char *msg = (alert && alert->message[0]) ? alert->message : "";
        size_t j = 0;
        for (size_t i = 0; msg[i] && j + 2 < sizeof(msg_esc); i++) {
            char c = msg[i];
            if (c == '"' || c == '\\') msg_esc[j++] = '\\';
            if (c == '\n' || c == '\r') c = ' ';
            msg_esc[j++] = c;
        }
        msg_esc[j] = '\0';
        fprintf(f,
                "{\"ts\":%ld,\"tenant_id\":\"%s\",\"ip\":\"%s\",\"risk_score\":%.1f,\"min_risk\":%.1f,"
                "\"decision\":\"%s\",\"banned\":%s,\"alert_level\":%d,"
                "\"incident_id\":\"%s\",\"message\":\"%s\"}\n",
                (long)now, g_tenant_id, ip, v->risk_score, v->min_risk, v->decision,
                banned ? "true" : "false",
                alert ? (int)alert->level : 0,
                (alert && alert->incident_id[0]) ? alert->incident_id : "",
                msg_esc);
        fclose(f);
    }
    pthread_mutex_unlock(&g_audit_mu);
}

void ban_policy_get_stats(uint64_t *allowed, uint64_t *skipped)
{
    if (allowed) *allowed = atomic_load(&g_allowed);
    if (skipped) *skipped = atomic_load(&g_skipped);
}
