#define _GNU_SOURCE
#include "threat_feed.h"
#include "ban_pipeline.h"
#include "firewall.h"
#include "daemon_ipc.h"
#include "mesh_intel.h"
#include "mesh_backend.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <time.h>
#include <curl/curl.h>
#include <ctype.h>
#include <stdatomic.h>
#include <grp.h>
#include <sys/stat.h>

#define THREAT_FEED_STATS_JSON "/etc/log-guardian/threat_feed_stats.json"

extern int g_allow_ban;
extern int g_operator_quiet;

ThreatFeedConfig g_threat_config = {
    .update_interval_sec = 3600,
    .enabled = 0,
    .use_ban_pipeline = 1,
    .min_score = 75,
    .max_ips_per_cycle = 50000,
    .audit_path = "data/threat-feed-audit.jsonl",
};

static pthread_t g_feed_thread;
static volatile int g_feed_running = 0;
static int g_feed_thread_started = 0;
static int g_mesh_pub_started = 0;
static int g_mesh_sub_started = 0;
static atomic_uint_fast64_t g_total_iocs = 0;
static atomic_uint_fast64_t g_last_applied = 0;
static atomic_uint_fast64_t g_last_skip_wl = 0;
static atomic_uint_fast64_t g_last_failed = 0;
static atomic_llong g_last_sync_ts = 0;
static pthread_mutex_t g_err_mu = PTHREAD_MUTEX_INITIALIZER;
static char g_last_error[128] = "";

#define TF_HTTP_MAX_BYTES   (8 * 1024 * 1024)

struct MemoryStruct {
    char *memory;
    size_t size;
};

static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;
    if (mem->size + realsize > TF_HTTP_MAX_BYTES)
        return 0;
    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) return 0;
    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;
    return realsize;
}

static void set_last_error(const char *msg)
{
    pthread_mutex_lock(&g_err_mu);
    if (msg && msg[0])
        snprintf(g_last_error, sizeof(g_last_error), "%.127s", msg);
    else
        g_last_error[0] = '\0';
    pthread_mutex_unlock(&g_err_mu);
}

static int looks_like_ipv4(const char *s)
{
    int dots = 0, digits = 0;
    for (const unsigned char *p = (const unsigned char *)s; *p; p++) {
        if (*p == '.') { dots++; digits = 0; }
        else if (isdigit(*p)) {
            digits++;
            if (digits > 3) return 0;
        } else return 0;
    }
    return dots == 3;
}

static const char *ban_path_label(BanPath p)
{
    switch (p) {
    case BAN_PATH_IPC_XDP:        return "ipc-xdp";
    case BAN_PATH_XDP_DIRECT:     return "xdp";
    case BAN_PATH_IPSET:          return "ipset";
    case BAN_PATH_WHITELIST_SKIP: return "whitelist-skip";
    case BAN_PATH_INVALID_IP:     return "invalid";
    default:                      return "failed";
    }
}

static void audit_ioc(const char *ip, const char *provider, const char *path_str, int applied)
{
    if (!g_threat_config.audit_path[0] || !ip || !ip[0]) return;
    FILE *fp = fopen(g_threat_config.audit_path, "a");
    if (!fp) return;
    fprintf(fp,
            "{\"ts\":%ld,\"ip\":\"%s\",\"provider\":\"%s\",\"path\":\"%s\","
            "\"applied\":%s}\n",
            (long)time(NULL), ip, provider ? provider : "?",
            path_str ? path_str : "none", applied ? "true" : "false");
    fclose(fp);
}

static void apply_ioc(const char *ip, const char *provider, uint64_t *applied,
                      uint64_t *skip_wl, uint64_t *failed)
{
    if (!ip || !ip[0] || !is_valid_ip(ip)) return;

    if (!g_allow_ban) {
        (*applied)++;
        audit_ioc(ip, provider, "dry-run", 1);
        return;
    }

    if (g_threat_config.use_ban_pipeline) {
        BanPath path = BAN_PATH_FAILED;
        if (ban_pipeline_ban(ip, provider, &path) == 0) {
            if (path == BAN_PATH_WHITELIST_SKIP) {
                (*skip_wl)++;
                audit_ioc(ip, provider, ban_path_label(path), 0);
                return;
            }
            (*applied)++;
            audit_ioc(ip, provider, ban_path_label(path), 1);
            return;
        }
        (*failed)++;
        audit_ioc(ip, provider, ban_path_label(path), 0);
        return;
    }

    if (strchr(ip, ':')) {
        if (daemon_ipc_ban_ipv6(ip) == 0) (*applied)++;
        else (*failed)++;
    } else {
        if (daemon_ipc_ban_ipv4(ip) == 0) (*applied)++;
        else (*failed)++;
    }
    audit_ioc(ip, provider, "ipc", (*applied) > 0);
}

static void extract_ipv4_field(const char *data, const char *key, uint64_t *applied,
                               uint64_t *skip_wl, uint64_t *failed,
                               int *limit, const char *provider)
{
    if (!data || !key) return;
    size_t key_len = strlen(key);
    const char *p = data;
    while (*limit > 0 && (p = strstr(p, key)) != NULL) {
        p += key_len;
        const char *end = strchr(p, '\"');
        if (!end || (end - p) >= 46) continue;
        char ip_str[46];
        memcpy(ip_str, p, (size_t)(end - p));
        ip_str[end - p] = '\0';
        if (looks_like_ipv4(ip_str)) {
            apply_ioc(ip_str, provider, applied, skip_wl, failed);
            (*limit)--;
        }
        p = end;
    }
}

static int abuseipdb_confidence_ok(const char *ctx, const char *ip_end)
{
    if (g_threat_config.min_score <= 0) return 1;
    const char *score_key = "\"abuseConfidenceScore\":";
    const char *search_start = ctx;
    if (ip_end) {
        const char *back = ip_end;
        for (int i = 0; i < 512 && back > ctx; i++, back--) {
            const char *hit = strstr(back, score_key);
            if (hit && hit < ip_end + 64) {
                search_start = hit;
                break;
            }
        }
    }
    const char *p = strstr(search_start, score_key);
    if (!p) return 1;
    p += strlen(score_key);
    while (*p == ' ') p++;
    int score = atoi(p);
    return score >= g_threat_config.min_score;
}

static void parse_abuseipdb_json(const char *data, uint64_t *applied,
                                 uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    const char *key = "\"ipAddress\":\"";
    size_t key_len = strlen(key);
    const char *p = data;
    while (*limit > 0 && (p = strstr(p, key)) != NULL) {
        p += key_len;
        const char *end = strchr(p, '\"');
        if (!end || (end - p) >= 46) continue;
        char ip_str[46];
        memcpy(ip_str, p, (size_t)(end - p));
        ip_str[end - p] = '\0';
        if (looks_like_ipv4(ip_str) && abuseipdb_confidence_ok(p, end)) {
            apply_ioc(ip_str, "abuseipdb", applied, skip_wl, failed);
            (*limit)--;
        }
        p = end;
    }
}

static void parse_stix_bundle(const char *data, uint64_t *applied,
                              uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    extract_ipv4_field(data, "\"value\":\"", applied, skip_wl, failed, limit, "stix");
    if (*limit > 0)
        extract_ipv4_field(data, "\"value\": \"", applied, skip_wl, failed, limit, "stix");
    if (*limit > 0) {
        const char *key = "ipv4-addr:value = '";
        size_t klen = strlen(key);
        const char *p = data;
        while (*limit > 0 && (p = strstr(p, key)) != NULL) {
            p += klen;
            const char *end = strchr(p, '\'');
            if (!end || (end - p) >= 46) continue;
            char ip_str[46];
            memcpy(ip_str, p, (size_t)(end - p));
            ip_str[end - p] = '\0';
            if (looks_like_ipv4(ip_str)) {
                apply_ioc(ip_str, "stix", applied, skip_wl, failed);
                (*limit)--;
            }
            p = end;
        }
    }
}

static void parse_plain_ips(const char *data, uint64_t *applied,
                            uint64_t *skip_wl, uint64_t *failed, int *limit,
                            const char *provider)
{
    char buf[65536];
    size_t n = strlen(data);
    if (n >= sizeof(buf)) n = sizeof(buf) - 1;
    memcpy(buf, data, n);
    buf[n] = '\0';
    char *tok = strtok(buf, " \t\n\r,;");
    while (*limit > 0 && tok) {
        if (looks_like_ipv4(tok)) {
            apply_ioc(tok, provider, applied, skip_wl, failed);
            (*limit)--;
        }
        tok = strtok(NULL, " \t\n\r,;");
    }
}

static int threat_feed_local_file_allowed(const char *path)
{
    if (!path || !path[0])
        return 0;
    if (strncmp(path, "/etc/log-guardian/data/", 23) == 0)
        return 1;
    if (strncmp(path, "data/", 5) == 0 && strstr(path, "..") == NULL)
        return 1;
    return 0;
}

static int threat_feed_url_allowed(const char *url)
{
    if (!url || !url[0])
        return 0;
    if (strncmp(url, "https://", 8) == 0)
        return 1;
    if (strncmp(url, "http://127.0.0.1", 16) == 0)
        return 1;
    if (strncmp(url, "http://localhost", 16) == 0)
        return 1;
    if (strncmp(url, "file://", 7) == 0) {
        const char *local = url + 7;
        return threat_feed_local_file_allowed(local);
    }
    return 0;
}

static int read_local_file(const char *path, struct MemoryStruct *chunk)
{
    if (!threat_feed_local_file_allowed(path)) {
        set_last_error("local file path denied");
        return -1;
    }
    FILE *fp = fopen(path, "rb");
    if (!fp) {
        char err[160];
        snprintf(err, sizeof(err), "file open: %s", path);
        set_last_error(err);
        return -1;
    }
    fseek(fp, 0, SEEK_END);
    long sz = ftell(fp);
    if (sz < 0) { fclose(fp); return -1; }
    if (sz > 16 * 1024 * 1024) sz = 16 * 1024 * 1024;
    rewind(fp);
    chunk->memory = malloc((size_t)sz + 1);
    if (!chunk->memory) { fclose(fp); return -1; }
    size_t n = fread(chunk->memory, 1, (size_t)sz, fp);
    fclose(fp);
    chunk->size = n;
    chunk->memory[n] = '\0';
    return 0;
}

static const char *file_url_path(const char *url)
{
    if (!url || strncmp(url, "file://", 7) != 0) return NULL;
    return url + 7;
}

static int http_fetch(const char *url, struct curl_slist *headers,
                      struct MemoryStruct *chunk, const char *provider)
{
    if (!threat_feed_url_allowed(url)) {
        set_last_error("URL scheme/host denied");
        return -1;
    }

    const char *local = file_url_path(url);
    if (local) {
        chunk->memory = NULL;
        chunk->size = 0;
        return read_local_file(local, chunk);
    }

    CURL *curl = curl_easy_init();
    if (!curl) {
        set_last_error("curl init failed");
        return -1;
    }
    chunk->memory = malloc(1);
    chunk->size = 0;
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, chunk);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "LogGuardian/2.0");
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 0L);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 60L);
    curl_easy_setopt(curl, CURLOPT_MAXFILESIZE, (long)TF_HTTP_MAX_BYTES);
#if defined(CURLOPT_PROTOCOLS) && defined(CURLPROTO_HTTPS)
    curl_easy_setopt(curl, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS | CURLPROTO_HTTP);
    curl_easy_setopt(curl, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTPS);
#endif
    if (headers)
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    CURLcode res = curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    if (res != CURLE_OK) {
        char err[160];
        snprintf(err, sizeof(err), "%s: %s", provider, curl_easy_strerror(res));
        set_last_error(err);
        free(chunk->memory);
        chunk->memory = NULL;
        chunk->size = 0;
        return -1;
    }
    return 0;
}

static void process_body(const char *body, const char *provider, int is_json_abuse,
                         int is_stix, uint64_t *applied, uint64_t *skip_wl,
                         uint64_t *failed, int *limit)
{
    if (!body) return;
    if (is_json_abuse)
        parse_abuseipdb_json(body, applied, skip_wl, failed, limit);
    else if (is_stix)
        parse_stix_bundle(body, applied, skip_wl, failed, limit);
    else
        parse_plain_ips(body, applied, skip_wl, failed, limit, provider);
}

static void run_abuseipdb(uint64_t *applied, uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    if (!g_threat_config.api_key[0]) return;
    struct MemoryStruct chunk = {0};
    struct curl_slist *headers = NULL;
    char header_key[256];
    snprintf(header_key, sizeof(header_key), "Key: %s", g_threat_config.api_key);
    headers = curl_slist_append(headers, header_key);
    headers = curl_slist_append(headers, "Accept: application/json");
    char url[512];
    snprintf(url, sizeof(url),
             "https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=%d&limit=10000",
             g_threat_config.min_score > 0 ? g_threat_config.min_score : 75);
    if (http_fetch(url, headers, &chunk, "abuseipdb") == 0 && chunk.memory)
        process_body(chunk.memory, "abuseipdb", 1, 0, applied, skip_wl, failed, limit);
    if (headers) curl_slist_free_all(headers);
    free(chunk.memory);
}

static void run_otx(uint64_t *applied, uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    if (!g_threat_config.otx_api_key[0]) return;
    struct MemoryStruct chunk = {0};
    struct curl_slist *headers = NULL;
    char header_key[256];
    snprintf(header_key, sizeof(header_key), "X-OTX-API-KEY: %s", g_threat_config.otx_api_key);
    headers = curl_slist_append(headers, header_key);
    const char *url =
        "https://otx.alienvault.com/api/v1/indicators/export?type=IPv4&include_inactive=0";
    if (http_fetch(url, headers, &chunk, "otx") == 0 && chunk.memory)
        process_body(chunk.memory, "otx", 0, 0, applied, skip_wl, failed, limit);
    if (headers) curl_slist_free_all(headers);
    free(chunk.memory);
}

static void run_stix(uint64_t *applied, uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    if (!g_threat_config.stix_url[0]) return;
    struct MemoryStruct chunk = {0};
    if (http_fetch(g_threat_config.stix_url, NULL, &chunk, "stix") == 0 && chunk.memory)
        process_body(chunk.memory, "stix", 0, 1, applied, skip_wl, failed, limit);
    free(chunk.memory);
}

static void run_url_feed(uint64_t *applied, uint64_t *skip_wl, uint64_t *failed, int *limit)
{
    if (!g_threat_config.feed_url[0]) return;
    struct MemoryStruct chunk = {0};
    struct curl_slist *headers = NULL;
    if (strstr(g_threat_config.feed_url, "abuseipdb") && g_threat_config.api_key[0]) {
        char header_key[256];
        snprintf(header_key, sizeof(header_key), "Key: %s", g_threat_config.api_key);
        headers = curl_slist_append(headers, header_key);
        headers = curl_slist_append(headers, "Accept: application/json");
    }
    int is_abuse = strstr(g_threat_config.feed_url, "abuseipdb") != NULL;
    int is_stix = strstr(g_threat_config.feed_url, "stix") != NULL ||
                  strstr(g_threat_config.feed_url, ".json") != NULL;
    if (http_fetch(g_threat_config.feed_url, headers, &chunk, "url") == 0 && chunk.memory)
        process_body(chunk.memory, "url", is_abuse, is_stix, applied, skip_wl, failed, limit);
    if (headers) curl_slist_free_all(headers);
    free(chunk.memory);
}

unsigned threat_feed_sources_mask(void)
{
    unsigned mask = 0;
    const char *src = g_threat_config.sources;
    if (src && src[0]) {
        char buf[128];
        snprintf(buf, sizeof(buf), "%.127s", src);
        char *tok = strtok(buf, ", \t");
        while (tok) {
            if (strcasecmp(tok, "abuseipdb") == 0) mask |= TF_SRC_ABUSEIPDB;
            else if (strcasecmp(tok, "otx") == 0) mask |= TF_SRC_OTX;
            else if (strcasecmp(tok, "stix") == 0) mask |= TF_SRC_STIX;
            else if (strcasecmp(tok, "url") == 0) mask |= TF_SRC_URL;
            tok = strtok(NULL, ", \t");
        }
        return mask;
    }
    if (g_threat_config.api_key[0]) mask |= TF_SRC_ABUSEIPDB;
    if (g_threat_config.otx_api_key[0]) mask |= TF_SRC_OTX;
    if (g_threat_config.stix_url[0]) mask |= TF_SRC_STIX;
    if (g_threat_config.feed_url[0]) mask |= TF_SRC_URL;
    return mask;
}

static int threat_feed_read_persisted(ThreatFeedStats *out);

static void threat_feed_persist_stats(void)
{
    ThreatFeedStats st;
    memset(&st, 0, sizeof(st));
    st.total_iocs = (uint64_t)atomic_load(&g_total_iocs);
    st.last_applied = (uint64_t)atomic_load(&g_last_applied);
    st.last_skipped_whitelist = (uint64_t)atomic_load(&g_last_skip_wl);
    st.last_failed = (uint64_t)atomic_load(&g_last_failed);
    st.last_sync_ts = (time_t)atomic_load(&g_last_sync_ts);
    pthread_mutex_lock(&g_err_mu);
    snprintf(st.last_error, sizeof(st.last_error), "%s", g_last_error);
    pthread_mutex_unlock(&g_err_mu);

    ThreatFeedStats prev;
    if (threat_feed_read_persisted(&prev) == 0) {
        if (st.last_applied == 0 && prev.last_applied > 0) {
            st.last_applied = prev.last_applied;
            st.last_skipped_whitelist = prev.last_skipped_whitelist;
            st.last_failed = prev.last_failed;
        }
        if (st.total_iocs < prev.total_iocs)
            st.total_iocs = prev.total_iocs;
        if (!st.last_error[0] && prev.last_error[0])
            snprintf(st.last_error, sizeof(st.last_error), "%s", prev.last_error);
    }

    FILE *fp = fopen(THREAT_FEED_STATS_JSON ".tmp", "w");
    if (!fp)
        return;
    fprintf(fp,
            "{\"last_sync_ts\":%ld,\"last_applied\":%lu,"
            "\"last_skipped_whitelist\":%lu,\"last_failed\":%lu,"
            "\"total_iocs\":%lu,\"last_error\":\"",
            (long)st.last_sync_ts,
            (unsigned long)st.last_applied,
            (unsigned long)st.last_skipped_whitelist,
            (unsigned long)st.last_failed,
            (unsigned long)st.total_iocs);
    for (const char *p = st.last_error; p && *p; p++) {
        if (*p == '"' || *p == '\\')
            fputc('\\', fp);
        fputc((unsigned char)*p, fp);
    }
    fputs("\"}\n", fp);
    fclose(fp);
    rename(THREAT_FEED_STATS_JSON ".tmp", THREAT_FEED_STATS_JSON);
    chmod(THREAT_FEED_STATS_JSON, 0660);
    const char *grp_name = getenv("LOG_GUARDIAN_IPC_GROUP");
    if (!grp_name || !grp_name[0])
        grp_name = "log-guardian";
    struct group *gr = getgrnam(grp_name);
    if (gr)
        chown(THREAT_FEED_STATS_JSON, 0, gr->gr_gid);
}

static uint64_t json_uint64(const char *json, const char *key)
{
    char pat[48];
    snprintf(pat, sizeof(pat), "\"%s\":", key);
    const char *p = strstr(json, pat);
    if (!p)
        return 0;
    p += strlen(pat);
    return strtoull(p, NULL, 10);
}

static void threat_feed_parse_json_buf(const char *buf, ThreatFeedStats *out)
{
    if (!buf || !out)
        return;
    out->last_sync_ts = (time_t)json_uint64(buf, "last_sync_ts");
    out->last_applied = json_uint64(buf, "last_applied");
    out->last_skipped_whitelist = json_uint64(buf, "last_skipped_whitelist");
    out->last_failed = json_uint64(buf, "last_failed");
    out->total_iocs = json_uint64(buf, "total_iocs");
    out->last_error[0] = '\0';
    const char *ek = "\"last_error\":\"";
    const char *p = strstr(buf, ek);
    if (!p)
        return;
    p += strlen(ek);
    size_t o = 0;
    for (size_t i = 0; p[i] && o + 1 < sizeof(out->last_error); ) {
        if (p[i] == '\\' && p[i + 1]) {
            out->last_error[o++] = p[i + 1];
            i += 2;
        } else if (p[i] == '"') {
            break;
        } else {
            out->last_error[o++] = p[i++];
        }
    }
    out->last_error[o] = '\0';
}

static int threat_feed_read_persisted(ThreatFeedStats *out)
{
    if (!out)
        return -1;
    FILE *fp = fopen(THREAT_FEED_STATS_JSON, "r");
    if (!fp)
        return -1;
    char buf[512];
    size_t n = fread(buf, 1, sizeof(buf) - 1, fp);
    fclose(fp);
    if (n == 0)
        return -1;
    buf[n] = '\0';
    memset(out, 0, sizeof(*out));
    threat_feed_parse_json_buf(buf, out);
    return 0;
}

static void threat_feed_merge_persisted(ThreatFeedStats *out)
{
    if (!out)
        return;
    ThreatFeedStats file;
    if (threat_feed_read_persisted(&file) != 0)
        return;

    if (file.total_iocs > out->total_iocs)
        out->total_iocs = file.total_iocs;

    if (file.last_sync_ts > out->last_sync_ts) {
        out->last_sync_ts = file.last_sync_ts;
        out->last_applied = file.last_applied;
        out->last_skipped_whitelist = file.last_skipped_whitelist;
        out->last_failed = file.last_failed;
        if (file.last_error[0])
            snprintf(out->last_error, sizeof(out->last_error), "%s", file.last_error);
        return;
    }

    if (out->last_applied == 0 && file.last_applied > 0) {
        out->last_applied = file.last_applied;
        out->last_skipped_whitelist = file.last_skipped_whitelist;
        out->last_failed = file.last_failed;
        if (!out->last_error[0] && file.last_error[0])
            snprintf(out->last_error, sizeof(out->last_error), "%s", file.last_error);
    }
}

static void feed_cycle(void)
{
    unsigned mask = threat_feed_sources_mask();
    if (!mask) return;

    if (g_threat_config.use_ban_pipeline && geteuid() == 0)
        ensure_ipset_ready();

    int limit = g_threat_config.max_ips_per_cycle > 0
                    ? g_threat_config.max_ips_per_cycle : 50000;
    uint64_t applied = 0, skip_wl = 0, failed = 0;

    if (mask & TF_SRC_ABUSEIPDB) run_abuseipdb(&applied, &skip_wl, &failed, &limit);
    if (mask & TF_SRC_OTX) run_otx(&applied, &skip_wl, &failed, &limit);
    if (mask & TF_SRC_STIX) run_stix(&applied, &skip_wl, &failed, &limit);
    if (mask & TF_SRC_URL) run_url_feed(&applied, &skip_wl, &failed, &limit);

    atomic_fetch_add(&g_total_iocs, applied + failed + skip_wl);
    atomic_store(&g_last_applied, applied);
    atomic_store(&g_last_skip_wl, skip_wl);
    atomic_store(&g_last_failed, failed);
    atomic_store(&g_last_sync_ts, (long long)time(NULL));
    if (applied > 0)
        fprintf(stderr, "[THREAT-FEED] %lu IoC uygulandi (skip_wl=%lu fail=%lu).\n",
                (unsigned long)applied, (unsigned long)skip_wl, (unsigned long)failed);
    threat_feed_persist_stats();
}

static void *feed_thread_func(void *arg)
{
    (void)arg;
    while (g_feed_running) {
        if (!g_threat_config.enabled) {
            sleep(10);
            continue;
        }
        if (!threat_feed_sources_mask()) {
            sleep(10);
            continue;
        }
        feed_cycle();
        for (int i = 0; i < g_threat_config.update_interval_sec && g_feed_running; i++)
            sleep(1);
    }
    return NULL;
}

void threat_feed_init(void)
{
    if (g_feed_running) return;
    unsigned mask = threat_feed_sources_mask();
    int need_thread = g_threat_config.enabled && mask != 0;
    int need_mesh = mesh_backend_use_zmq() &&
                    ((g_threat_config.mesh_pub_enabled && g_threat_config.mesh_pub_addr[0]) ||
                     (g_threat_config.mesh_sub_enabled && g_threat_config.mesh_sub_addr[0]));
    if (!need_thread && !need_mesh)
        return;

    g_feed_running = 1;
    if (need_thread) {
        if (pthread_create(&g_feed_thread, NULL, feed_thread_func, NULL) == 0)
            g_feed_thread_started = 1;
    }
    if (g_threat_config.mesh_pub_enabled && g_threat_config.mesh_pub_addr[0]) {
        if (mesh_intel_init_pub(g_threat_config.mesh_pub_addr) == 0) {
            g_mesh_pub_started = 1;
            if (!g_operator_quiet)
                fprintf(stderr, "[MESH] PUB aktif: %s\n", g_threat_config.mesh_pub_addr);
        }
    }
    if (g_threat_config.mesh_sub_enabled && g_threat_config.mesh_sub_addr[0]) {
        if (mesh_intel_init_sub(g_threat_config.mesh_sub_addr) == 0) {
            g_mesh_sub_started = 1;
            if (!g_operator_quiet)
                fprintf(stderr, "[MESH] SUB aktif: %s\n", g_threat_config.mesh_sub_addr);
        }
    }
    if (!g_feed_thread_started && !g_mesh_pub_started && !g_mesh_sub_started)
        g_feed_running = 0;
}

void threat_feed_stop(void)
{
    if (!g_feed_running) return;
    g_feed_running = 0;
    if (g_feed_thread_started) {
        pthread_join(g_feed_thread, NULL);
        g_feed_thread_started = 0;
    }
    if (g_mesh_pub_started) {
        mesh_intel_pub_stop();
        g_mesh_pub_started = 0;
    }
    if (g_mesh_sub_started) {
        mesh_intel_sub_stop();
        g_mesh_sub_started = 0;
    }
}

uint64_t threat_feed_get_total_iocs(void)
{
    return (uint64_t)atomic_load(&g_total_iocs);
}

void threat_feed_get_stats(ThreatFeedStats *out)
{
    if (!out) return;
    memset(out, 0, sizeof(*out));
    out->total_iocs = (uint64_t)atomic_load(&g_total_iocs);
    out->last_applied = (uint64_t)atomic_load(&g_last_applied);
    out->last_skipped_whitelist = (uint64_t)atomic_load(&g_last_skip_wl);
    out->last_failed = (uint64_t)atomic_load(&g_last_failed);
    out->last_sync_ts = (time_t)atomic_load(&g_last_sync_ts);
    pthread_mutex_lock(&g_err_mu);
    snprintf(out->last_error, sizeof(out->last_error), "%s", g_last_error);
    pthread_mutex_unlock(&g_err_mu);
    threat_feed_merge_persisted(out);
}

int threat_feed_run_once(void)
{
    if (!g_threat_config.enabled || !threat_feed_sources_mask())
        return -1;
    feed_cycle();
    return 0;
}
