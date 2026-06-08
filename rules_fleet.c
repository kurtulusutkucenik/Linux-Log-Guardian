#define _GNU_SOURCE
#include "rules_fleet.h"
#include "waf_rules.h"
#include "schema_validator.h"
#include "incident_engine.h"
#include "wasm_runtime.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static char g_rules_base[512] = "rules.conf";

void rules_fleet_set_rules_path(const char *rules_path)
{
    if (!rules_path || !rules_path[0]) return;
    strncpy(g_rules_base, rules_path, sizeof(g_rules_base) - 1);
    g_rules_base[sizeof(g_rules_base) - 1] = '\0';
}

int rules_fleet_overlay_path(char *out, size_t out_sz)
{
    if (!out || out_sz < 8) return -1;
    const char *slash = strrchr(g_rules_base, '/');
    if (slash) {
        size_t dir_len = (size_t)(slash - g_rules_base) + 1;
        if (dir_len + 20 >= out_sz) return -1;
        memcpy(out, g_rules_base, dir_len);
        snprintf(out + dir_len, out_sz - dir_len, "fleet.override.conf");
    } else {
        snprintf(out, out_sz, "fleet.override.conf");
    }
    return 0;
}

static int upsert_overlay_line(const char *key, const char *val)
{
    char path[512];
    if (rules_fleet_overlay_path(path, sizeof(path)) != 0) return -1;

    char lines[64][512];
    int n = 0;
    FILE *fp = fopen(path, "r");
    if (fp) {
        while (n < 64 && fgets(lines[n], sizeof(lines[0]), fp)) {
            char *p = lines[n];
            while (*p == ' ' || *p == '\t') p++;
            if (*p == '#' || *p == '\n') { lines[n][0] = '\0'; continue; }
            char *eq = strchr(p, '=');
            if (eq) {
                *eq = '\0';
                char *k = p;
                while (*k && (*k == ' ' || *k == '\t')) k++;
                char *ke = k + strlen(k) - 1;
                while (ke > k && (*ke == ' ' || *ke == '\t')) *ke-- = '\0';
                if (strcmp(k, key) == 0) {
                    snprintf(lines[n], sizeof(lines[0]), "%s=%s\n", key, val);
                    goto write_back;
                }
            }
            n++;
        }
        fclose(fp);
    }
    if (n < 64)
        snprintf(lines[n++], sizeof(lines[0]), "%s=%s\n", key, val);

write_back:
    fp = fopen(path, "w");
    if (!fp) return -1;
    fprintf(fp, "# Fleet overlay — PUSH_CONFIG ile guncellenir\n");
    for (int i = 0; i < n; i++) {
        if (lines[i][0]) fputs(lines[i], fp);
    }
    fclose(fp);
    return 0;
}

static int apply_key_value(const char *key, const char *val)
{
    if (!key || !key[0] || !val) return -1;

    char *end = NULL;
    long n = strtol(val, &end, 10);
    int is_num = (end && end != val && (*end == '\0' || *end == '\n'));

    if (strcmp(key, "WAF_LFI") == 0 && is_num) {
        WafConfig c;
        waf_config_get(&c);
        c.lfi_enabled = (int)(n != 0);
        waf_config_set(&c);
    } else if (strcmp(key, "WAF_SSRF") == 0 && is_num) {
        WafConfig c;
        waf_config_get(&c);
        c.ssrf_enabled = (int)(n != 0);
        waf_config_set(&c);
    } else if (strcmp(key, "WAF_XSS") == 0 && is_num) {
        WafConfig c;
        waf_config_get(&c);
        c.xss_enabled = (int)(n != 0);
        waf_config_set(&c);
    } else if (strcmp(key, "WAF_SHELLCMD") == 0 && is_num) {
        WafConfig c;
        waf_config_get(&c);
        c.shellcmd_enabled = (int)(n != 0);
        waf_config_set(&c);
    } else if (strcmp(key, "WAF_ENABLED") == 0 && is_num) {
        WafConfig c;
        waf_config_get(&c);
        c.enabled = (int)(n != 0);
        waf_config_set(&c);
    } else if (strcmp(key, "WAF_SCORE_BAN_THRESHOLD") == 0 && is_num && n > 0) {
        WafConfig c;
        waf_config_get(&c);
        c.ban_threshold = (int)n;
        waf_config_set(&c);
    } else if (strcmp(key, "OPENAPI_STRICT") == 0 && is_num) {
        schema_set_strict_mode((int)(n != 0));
    } else if (strcmp(key, "INCIDENT_MIN_LOG_HITS") == 0 && is_num && n >= 1) {
        incident_engine_set_min_log_hits((int)n);
    } else if (strcmp(key, "INCIDENT_WINDOW_SEC") == 0 && is_num && n >= 60) {
        incident_engine_set_window_sec((int)n);
    } else if (strcmp(key, "OPENAPI_SCHEMA") == 0 && val[0]) {
        if (schema_load(val) != 0) return -1;
    } else if (strcmp(key, "WASM_PLUGIN_DIR") == 0 && val[0]) {
        wasm_runtime_set_plugin_dir(val);
        wasm_runtime_scan_plugins();
    } else {
        upsert_overlay_line(key, val);
        return 0;
    }
    upsert_overlay_line(key, val);
    return 0;
}

int rules_fleet_apply_kv(const char *payload)
{
    if (!payload || !payload[0]) return -1;

    char key[128] = {0};
    char val[384] = {0};

    const char *eq = strchr(payload, '=');
    if (eq) {
        size_t kl = (size_t)(eq - payload);
        if (kl >= sizeof(key)) kl = sizeof(key) - 1;
        memcpy(key, payload, kl);
        key[kl] = '\0';
        strncpy(val, eq + 1, sizeof(val) - 1);
    } else {
        if (sscanf(payload, "%127s %383s", key, val) < 2)
            return -1;
    }

    char *k = key;
    while (*k == ' ' || *k == '\t') k++;
    char *ve = val + strlen(val) - 1;
    while (ve > val && (*ve == ' ' || *ve == '\t' || *ve == '\n' || *ve == '\r'))
        *ve-- = '\0';

    return apply_key_value(k, val);
}

void rules_fleet_reload_overlay(void)
{
    char path[512];
    if (rules_fleet_overlay_path(path, sizeof(path)) != 0) return;

    FILE *fp = fopen(path, "r");
    if (!fp) return;

    char line[512];
    while (fgets(line, sizeof(line), fp)) {
        char *p = line;
        while (*p == ' ' || *p == '\t') p++;
        if (*p == '#' || *p == '\n') continue;
        char *e = strchr(p, '=');
        if (!e) continue;
        *e = '\0';
        char *key = p;
        char *val = e + 1;
        char *ke = key + strlen(key) - 1;
        while (ke > key && (*ke == ' ' || *ke == '\t')) *ke-- = '\0';
        while (*val == ' ' || *val == '\t') val++;
        apply_key_value(key, val);
    }
    fclose(fp);
}
