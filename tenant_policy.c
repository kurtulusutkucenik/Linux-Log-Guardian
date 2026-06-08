#define _GNU_SOURCE
#include "tenant_policy.h"
#include "tenant_db.h"
#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>

static TenantIsolationInfo g_info;

static void sanitize_copy(const char *in, char *out, size_t out_sz)
{
    size_t j = 0;
    if (!in || !out || out_sz < 2) return;
    for (size_t i = 0; in[i] && j < out_sz - 1; i++) {
        unsigned char c = (unsigned char)in[i];
        if (isalnum(c) || c == '_' || c == '-')
            out[j++] = (char)c;
    }
    out[j] = '\0';
    if (!out[0]) strncpy(out, "default", out_sz - 1);
}

static char *trim_ws(char *s)
{
    while (*s && isspace((unsigned char)*s)) s++;
    if (!*s) return s;
    char *e = s + strlen(s) - 1;
    while (e > s && isspace((unsigned char)*e)) *e-- = '\0';
    return s;
}

static void mkdir_p(const char *path)
{
    char tmp[512];
    size_t n = strlen(path);
    if (n >= sizeof(tmp)) return;
    memcpy(tmp, path, n + 1);
    for (char *p = tmp + 1; *p; p++) {
        if (*p == '/') {
            *p = '\0';
            mkdir(tmp, 0750);
            *p = '/';
        }
    }
    mkdir(tmp, 0750);
}

void tenant_policy_init(void)
{
    memset(&g_info, 0, sizeof(g_info));
    g_info.auto_ban_min_risk = -1.0;
    g_info.ban_ttl_sec = -1;
}

const TenantIsolationInfo *tenant_policy_info(void)
{
    return &g_info;
}

int tenant_policy_apply(const char *tenant_id, int multi_tenant,
                        const char *rules_dir,
                        char *db_buf, size_t db_sz,
                        int db_path_cli_set)
{
    tenant_policy_init();
    if (!tenant_id || !tenant_id[0]) tenant_id = "default";

    strncpy(g_info.tenant_id, tenant_id, sizeof(g_info.tenant_id) - 1);
    sanitize_copy(tenant_id, g_info.safe_id, sizeof(g_info.safe_id));
    g_info.multi_tenant = multi_tenant ? 1 : 0;

    if (!multi_tenant) {
        if (db_buf && db_sz)
            snprintf(g_info.db_path, sizeof(g_info.db_path), "%s",
                     db_buf[0] ? db_buf : "events.db");
        snprintf(g_info.ban_audit_path, sizeof(g_info.ban_audit_path),
                 "data/ban-policy-audit.jsonl");
        snprintf(g_info.threat_audit_path, sizeof(g_info.threat_audit_path),
                 "data/threat-feed-audit.jsonl");
        snprintf(g_info.fp_store_path, sizeof(g_info.fp_store_path),
                 "data/fp-trust.lst");
        snprintf(g_info.data_dir, sizeof(g_info.data_dir), "data");
        return 0;
    }

    snprintf(g_info.data_dir, sizeof(g_info.data_dir),
             "data/tenants/%s", g_info.safe_id);
    snprintf(g_info.ban_audit_path, sizeof(g_info.ban_audit_path),
             "%s/ban-policy-audit.jsonl", g_info.data_dir);
    snprintf(g_info.threat_audit_path, sizeof(g_info.threat_audit_path),
             "%s/threat-feed-audit.jsonl", g_info.data_dir);
    snprintf(g_info.fp_store_path, sizeof(g_info.fp_store_path),
             "%s/fp-trust.lst", g_info.data_dir);
    mkdir_p(g_info.data_dir);

    if (!db_path_cli_set && db_buf && db_sz) {
        if (tenant_db_apply_path(tenant_id, 1, db_buf, db_sz, rules_dir)) {
            strncpy(g_info.db_path, db_buf, sizeof(g_info.db_path) - 1);
        } else {
            snprintf(g_info.db_path, sizeof(g_info.db_path),
                     "events-%s.db", g_info.safe_id);
            if (db_sz >= strlen(g_info.db_path) + 1)
                strncpy(db_buf, g_info.db_path, db_sz - 1);
        }
    } else if (db_buf && db_buf[0]) {
        strncpy(g_info.db_path, db_buf, sizeof(g_info.db_path) - 1);
    }

    return 1;
}

int tenant_policy_load_overlay(const char *rules_dir)
{
    const char *candidates[4];
    int n = 0;
    if (rules_dir && rules_dir[0])
        candidates[n++] = rules_dir;
    candidates[n++] = "rules";
    candidates[n++] = ".";

    FILE *fp = NULL;
    for (int i = 0; i < n; i++) {
        snprintf(g_info.overlay_path, sizeof(g_info.overlay_path),
                 "%s/tenants/%s.conf", candidates[i], g_info.safe_id);
        fp = fopen(g_info.overlay_path, "r");
        if (fp) break;
    }
    if (!fp) return 0;

    g_info.overlay_loaded = 1;
    char line[256];
    while (fgets(line, sizeof(line), fp)) {
        char *p = trim_ws(line);
        if (*p == '\0' || *p == '#') continue;
        char *eq = strchr(p, '=');
        if (!eq) continue;
        *eq = '\0';
        char *key = trim_ws(p);
        char *val = trim_ws(eq + 1);
        if (!key[0] || !val[0]) continue;

        if (strcmp(key, "AUTO_BAN_MIN_RISK") == 0) {
            char *ep = NULL;
            double d = strtod(val, &ep);
            if (ep && *trim_ws(ep) == '\0' && d >= 0.0 && d <= 100.0)
                g_info.auto_ban_min_risk = d;
        } else if (strcmp(key, "BAN_TTL_SEC") == 0) {
            long v = strtol(val, NULL, 10);
            if (v > 0) g_info.ban_ttl_sec = (int)v;
        }
    }
    fclose(fp);
    return 1;
}
