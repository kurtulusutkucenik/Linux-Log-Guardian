#define _GNU_SOURCE
#include "agent_sync.h"
#include "tui.h"
#include "logger.h"
#include "waf_rules.h"
#include "schema_validator.h"
#include "wasm_runtime.h"
#include "rules_fleet.h"
#include "firewall.h"
#include "ban_pipeline.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <pthread.h>
#include <curl/curl.h>

AgentSyncConfig g_agent_sync_config = {
    .enabled = 0,
    .url = "",
    .token = "",
    .agent_id = "",
    .interval_sec = 5
};

static pthread_t g_sync_thread;
static volatile int g_sync_running = 0;
static int g_sync_thread_started = 0;
static int g_sync_fail_streak = 0;

extern TuiStats g_stats;
extern pthread_mutex_t g_tui_mutex;

/* Etcd Mesh stats */
#include "etcd_mesh.h"
#include "daemon_ipc.h"
#include "attack_tree_snapshot.h"
#include "incident_engine.h"

static size_t curl_write_cb(void *data, size_t sz, size_t nmemb, void *userp) {
    size_t realsize = sz * nmemb;
    char **buf = (char **)userp;
    /* basit statik buffer stratejisi (sadece son yanıtı tutar) */
    if (*buf == NULL) {
        *buf = calloc(1, 8192);
    }
    if (*buf) {
        size_t used = strlen(*buf);
        size_t room = 8190 - used;
        size_t copy = realsize < room ? realsize : room;
        if (copy > 0)
            memcpy(*buf + used, data, copy);
        (*buf)[used + copy] = '\0';
    }
    return realsize;
}

static int url_host_is_loopback(const char *url)
{
    if (!url || strncmp(url, "https://", 8) != 0)
        return 0;

    const char *host = url + 8;
    const char *end = strchr(host, '/');
    if (!end)
        end = host + strlen(host);

    size_t host_len = (size_t)(end - host);
    const char *colon = memchr(host, ':', host_len);
    if (colon)
        host_len = (size_t)(colon - host);

    if (host_len >= 2 && host[0] == '[' && host[host_len - 1] == ']') {
        host++;
        host_len -= 2;
    }

    if (host_len == 9 && strncmp(host, "localhost", 9) == 0)
        return 1;
    if (host_len == 9 && strncmp(host, "127.0.0.1", 9) == 0)
        return 1;
    if (host_len == 3 && strncmp(host, "::1", 3) == 0)
        return 1;
    return 0;
}

static void apply_curl_tls_for_url(CURL *curl, const char *url) {
    if (!curl || !url) return;
    if (url_host_is_loopback(url)) {
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
    }
}

static int fleet_path_allowed(const char *path)
{
    if (!path || !path[0] || strstr(path, "..") != NULL)
        return 0;
    if (strncmp(path, "/etc/log-guardian/", 18) == 0)
        return 1;
    if (path[0] != '/' && path[0] != '.')
        return 1;
    return 0;
}

static int fleet_ban_ip(const char *ip, char *detail, size_t detail_sz)
{
    if (!is_valid_ip(ip)) {
        snprintf(detail, detail_sz, "invalid ip");
        return -1;
    }
    if (ban_pipeline_ban(ip, "fleet", NULL) != 0) {
        snprintf(detail, detail_sz, "ban pipeline failed");
        return -1;
    }
    return 0;
}

static int fleet_unban_ip(const char *ip, char *detail, size_t detail_sz)
{
    if (!is_valid_ip(ip)) {
        snprintf(detail, detail_sz, "invalid ip");
        return -1;
    }
    if (ban_pipeline_unban(ip) != 0) {
        snprintf(detail, detail_sz, "unban failed");
        return -1;
    }
    return 0;
}

static void fleet_ack_command(const char *cmd_id, const char *status, const char *detail)
{
    if (!cmd_id || !cmd_id[0] || !g_agent_sync_config.url[0]) return;

    char ack_url[640];
    strncpy(ack_url, g_agent_sync_config.url, sizeof(ack_url) - 1);
    char *telemetry_ptr = strstr(ack_url, "/telemetry");
    if (!telemetry_ptr) return;
    snprintf(telemetry_ptr, (size_t)(sizeof(ack_url) - (size_t)(telemetry_ptr - ack_url)),
             "/fleet/commands/ack");

    char body[1024];
    snprintf(body, sizeof(body),
             "{\"id\":\"%s\",\"status\":\"%s\",\"detail\":\"%s\",\"agent_id\":\"%s\"}",
             cmd_id, status ? status : "executed",
             detail ? detail : "",
             g_agent_sync_config.agent_id);

    CURL *curl = curl_easy_init();
    if (!curl) return;
    struct curl_slist *hdrs = NULL;
    char auth[256];
    snprintf(auth, sizeof(auth), "Authorization: Bearer %s", g_agent_sync_config.token);
    hdrs = curl_slist_append(hdrs, "Content-Type: application/json");
    hdrs = curl_slist_append(hdrs, auth);
    curl_easy_setopt(curl, CURLOPT_URL, ack_url);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hdrs);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 3L);
    apply_curl_tls_for_url(curl, ack_url);
    curl_easy_perform(curl);
    curl_slist_free_all(hdrs);
    curl_easy_cleanup(curl);
}

static void process_commands(const char *json) {
    if (!json) return;

    /* ── JSON'dan belirli command_id ve commandType'ı parse et ──── */
    const char *p = json;
    /* JSON array veya object: [{"id":"...","commandType":"BAN_IP","payload":"..."},...]  */

    /* Yardımcı: anahtar → string değeri */
    #define EXTRACT_STR(src, key, dst, dsz) do { \
        const char *__k = strstr((src), "\"" key "\":\""); \
        if (__k) { __k += strlen("\"" key "\":\""); int __i=0; \
            while (*__k && *__k != '"' && __i < (int)(dsz)-1) (dst)[__i++]=*__k++; \
            (dst)[__i]='\0'; } } while(0)

    while ((p = strstr(p, "\"commandType\":\"")) != NULL) {
        char cmd_type[64] = {0};
        char payload[512] = {0};
        char cmd_id[64]   = {0};
        /* commandType */
        const char *ct = p + 15; /* '"commandType":"' den sonra */
        int i = 0;
        while (*ct && *ct != '"' && i < 63) cmd_type[i++] = *ct++;

        /* Aynı nesne içinde payload ve id'yi bul (max 512 byte ileri bak) */
        char local[512];
        snprintf(local, sizeof(local), "%.*s", 512, p);
        EXTRACT_STR(local, "payload", payload, sizeof(payload));
        EXTRACT_STR(local, "id",      cmd_id,  sizeof(cmd_id));

        /* ── BAN_IP ───────────────────────────────────────────────── */
        int cmd_ok = 1;
        char ack_detail[128] = {0};

        if (strcmp(cmd_type, "BAN_IP") == 0) {
            log_rl(LOG_INFO, "[Fleet] BAN_IP: %s", payload);
            if (fleet_ban_ip(payload, ack_detail, sizeof(ack_detail)) != 0)
                cmd_ok = 0;

        /* ── PUSH_WAF_RULE ─────────────────────────────────────────── */
        } else if (strcmp(cmd_type, "PUSH_WAF_RULE") == 0) {
            /* payload: "ENABLE lfi 1" veya "SET ban_threshold 15" */
            log_rl(LOG_INFO, "[Fleet] PUSH_WAF_RULE: %s", payload);
            WafConfig cur;
            waf_config_get(&cur);
            char key[64] = {0}; int val = 0;
            if (sscanf(payload, "%*s %63s %d", key, &val) == 2) {
                if      (strcmp(key,"ban_threshold")==0) cur.ban_threshold = val;
                else if (strcmp(key,"lfi")==0)           cur.lfi_enabled   = val;
                else if (strcmp(key,"ssrf")==0)          cur.ssrf_enabled  = val;
                else if (strcmp(key,"xss")==0)           cur.xss_enabled   = val;
                else if (strcmp(key,"shellcmd")==0)      cur.shellcmd_enabled = val;
                else if (strcmp(key,"enabled")==0)       cur.enabled       = val;
                waf_config_set(&cur);
                log_rl(LOG_INFO, "[Fleet] WAF kural guncellendi: %s=%d", key, val);
            }

        /* ── PUSH_THREAT_FEED ──────────────────────────────────────── */
        } else if (strcmp(cmd_type, "PUSH_THREAT_FEED") == 0) {
            log_rl(LOG_INFO, "[Fleet] PUSH_THREAT_FEED: %zu IP alindi", strlen(payload));
            char ips[512];
            strncpy(ips, payload, sizeof(ips) - 1);
            ips[sizeof(ips) - 1] = '\0';
            char *tok = strtok(ips, " ,\t\n");
            while (tok) {
                if (!is_valid_ip(tok)) {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "invalid ip in feed");
                    break;
                }
                if (ban_pipeline_ban(tok, "fleet-feed", NULL) != 0) {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "ban failed");
                }
                tok = strtok(NULL, " ,\t\n");
            }

        /* ── PUSH_CONFIG ───────────────────────────────────────────── */
        } else if (strcmp(cmd_type, "PUSH_CONFIG") == 0) {
            log_rl(LOG_INFO, "[Fleet] PUSH_CONFIG: %s", payload);
            if (rules_fleet_apply_kv(payload) != 0) {
                cmd_ok = 0;
                snprintf(ack_detail, sizeof(ack_detail), "apply_kv failed");
            }
            kill(getpid(), SIGHUP);

        /* ── PUSH_SCHEMA ───────────────────────────────────────────── */
        } else if (strcmp(cmd_type, "PUSH_SCHEMA") == 0) {
            log_rl(LOG_INFO, "[Fleet] PUSH_SCHEMA: %s", payload);
            if (strlen(payload) > 0) {
                if (!fleet_path_allowed(payload)) {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "path denied");
                } else if (schema_load(payload) == 0)
                    log_rl(LOG_INFO, "[Fleet] Schema başarıyla yüklendi: %s", payload);
                else {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "schema load failed");
                    log_rl(LOG_ERR, "[Fleet] Schema yüklenemedi: %s", payload);
                }
            }

        /* ── PUSH_WASM_PLUGIN ──────────────────────────────────────── */
        } else if (strcmp(cmd_type, "PUSH_WASM_PLUGIN") == 0) {
            log_rl(LOG_INFO, "[Fleet] PUSH_WASM_PLUGIN: %s", payload);
            if (strlen(payload) > 0) {
                if (!fleet_path_allowed(payload) ||
                    strstr(payload, "/plugins/") == NULL) {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "wasm path denied");
                } else if (wasm_plugin_load(payload) == 0)
                    log_rl(LOG_INFO, "[Fleet] Wasm plugin yüklendi: %s", payload);
                else {
                    cmd_ok = 0;
                    snprintf(ack_detail, sizeof(ack_detail), "wasm load failed");
                    log_rl(LOG_ERR, "[Fleet] Wasm plugin yüklenemedi: %s", payload);
                }
            }

        /* ── UNBAN_IP ─────────────────────────────────────────────── */
        } else if (strcmp(cmd_type, "UNBAN_IP") == 0) {
            log_rl(LOG_INFO, "[Fleet] UNBAN_IP: %s", payload);
            if (fleet_unban_ip(payload, ack_detail, sizeof(ack_detail)) != 0)
                cmd_ok = 0;
        } else {
            cmd_ok = 0;
            snprintf(ack_detail, sizeof(ack_detail), "unknown command");
        }

        if (cmd_id[0])
            fleet_ack_command(cmd_id, cmd_ok ? "executed" : "failed", ack_detail);

        p += 15;
    }
    #undef EXTRACT_STR
}

static void *sync_thread_func(void *arg) {
    (void)arg;
    
    CURL *curl = curl_easy_init();
    if (!curl) {
        log_rl(LOG_ERR, "AgentSync: curl_easy_init failed");
        return NULL;
    }

    struct curl_slist *headers = NULL;
    char auth_header[256];
    snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", g_agent_sync_config.token);
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, auth_header);

    while (g_sync_running) {
        /* Metrikleri topla */
        pthread_mutex_lock(&g_tui_mutex);
        TuiStats st = g_stats;
        pthread_mutex_unlock(&g_tui_mutex);

        uint64_t inc_active = 0, inc_corr = 0;
        incident_engine_get_stats(&inc_active, &inc_corr);

        char attack_tree_json[4096] = "[]";
        char tree_path[512];
        if (attack_tree_resolve_file(tree_path, sizeof(tree_path)) == 0) {
            FILE *f = fopen(tree_path, "r");
            if (f) {
                size_t n = fread(attack_tree_json, 1, sizeof(attack_tree_json) - 1, f);
                attack_tree_json[n] = '\0';
                fclose(f);
            }
        }

        /* JSON olustur (cJSON yerine snprintf ile basit yapi) */
        char payload[8192];
        snprintf(payload, sizeof(payload),
            "{"
            "\"agent_id\":\"%s\","
            "\"eps\":%.2f,"
            "\"total_lines\":%ld,"
            "\"alerts_total\":%ld,"
            "\"rce_detections\":%lu,"
            "\"tarpit_active\":%lu,"
            "\"tarpit_trapped\":%lu,"
            "\"mesh_peers\":%u,"
            "\"unique_ips\":%zu,"
            "\"incidents_active\":%lu,"
            "\"incidents_correlated\":%lu,"
            "\"attack_tree\":%s"
            "}",
            g_agent_sync_config.agent_id,
            st.eps,
            st.total_lines,
            st.alerts_total,
            st.rce_detections,
            st.tarpit_active_conns,
            st.tarpit_total_trapped,
            st.mesh_peers,
            st.unique_ips,
            (unsigned long)inc_active,
            (unsigned long)inc_corr,
            attack_tree_json[0] == '[' ? attack_tree_json : "[]"
        );

        curl_easy_setopt(curl, CURLOPT_URL, g_agent_sync_config.url);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, payload);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 3L);
        apply_curl_tls_for_url(curl, g_agent_sync_config.url);

        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            g_sync_fail_streak++;
            int backoff = g_sync_fail_streak < 6 ? g_sync_fail_streak : 6;
            log_rl(LOG_ERR,
                   "AgentSync: telemetry gönderilemedi: %s (streak=%d, backoff=%ds)",
                   curl_easy_strerror(res), g_sync_fail_streak, backoff);
            for (int b = 0; b < backoff * 10 && g_sync_running; b++)
                usleep(100000);
        } else {
            if (g_sync_fail_streak > 0)
                log_rl(LOG_INFO, "AgentSync: telemetry yeniden baglandi (streak=%d)",
                       g_sync_fail_streak);
            g_sync_fail_streak = 0;
        }

        /* 2. Komutları Çek (Polling) */
        char cmd_url[512];
        /* SAAS_URL genelde http://host/api/telemetry şeklindedir, bunu fleet/commands'e çevirelim */
        strncpy(cmd_url, g_agent_sync_config.url, sizeof(cmd_url)-1);
        char *telemetry_ptr = strstr(cmd_url, "/telemetry");
        if (telemetry_ptr) {
            snprintf(telemetry_ptr, 200, "/fleet/commands?agent_id=%s", g_agent_sync_config.agent_id);
            
            char *response_buf = NULL;
            CURL *curl_cmd = curl_easy_init();
            if (curl_cmd) {
                curl_easy_setopt(curl_cmd, CURLOPT_URL, cmd_url);
                curl_easy_setopt(curl_cmd, CURLOPT_HTTPHEADER, headers);
                curl_easy_setopt(curl_cmd, CURLOPT_WRITEFUNCTION, curl_write_cb);
                curl_easy_setopt(curl_cmd, CURLOPT_WRITEDATA, &response_buf);
                curl_easy_setopt(curl_cmd, CURLOPT_TIMEOUT, 3L);
                apply_curl_tls_for_url(curl_cmd, cmd_url);
                
                if (curl_easy_perform(curl_cmd) == CURLE_OK && response_buf) {
                    process_commands(response_buf);
                }
                if (response_buf) free(response_buf);
                curl_easy_cleanup(curl_cmd);
            }
        }

        /* Uyku modu (interruptible uyuma simülasyonu) */
        for (int i = 0; i < g_agent_sync_config.interval_sec * 10 && g_sync_running; i++) {
            usleep(100000); /* 100ms */
        }
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    log_rl(LOG_INFO, "AgentSync: thread durdu.");
    return NULL;
}

void agent_sync_init(void) {
    if (!g_agent_sync_config.enabled || g_agent_sync_config.url[0] == '\0') {
        return;
    }
    
    if (g_sync_running) return;
    g_sync_running = 1;
    if (pthread_create(&g_sync_thread, NULL, sync_thread_func, NULL) == 0)
        g_sync_thread_started = 1;
    else
        g_sync_running = 0;
    log_rl(LOG_INFO, "AgentSync: basladi. URL: %s, Agent: %s", g_agent_sync_config.url, g_agent_sync_config.agent_id);
}

void agent_sync_stop(void) {
    if (!g_sync_running && !g_sync_thread_started) return;
    g_sync_running = 0;
    if (g_sync_thread_started) {
        pthread_join(g_sync_thread, NULL);
        g_sync_thread_started = 0;
    }
}

void agent_sync_request_stop(void) {
    g_sync_running = 0;
}
