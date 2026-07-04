#define _GNU_SOURCE
#include "api_server.h"
#include "crypto_utils.h"
#include "tui.h"      /* for TuiStats, MinHeap, g_top10, g_stats */
#include "ip_map.h"   /* for g_ipmap */
#include "attack_tree_snapshot.h"
#include "attack_tree.h"
#include "incident_engine.h"
#include "firewall.h"
#include "ban_pipeline.h"
#include "waf_rules.h"
#include "anomaly.h"
#include "parser.h"
#include "telegram_bot.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <sys/time.h>
#include <liburing.h>
#include <stdatomic.h>
#include <time.h>

#define ACTIVE_BANS_JSON "/run/log-guardian/active_bans.json"

/* Global metrics from main.c / db.c / webhook.c */
extern _Atomic long g_atomic_lines;
extern _Atomic long g_atomic_errors;
extern _Atomic long g_atomic_alerts;
extern _Atomic long g_atomic_ban_attempts;
extern _Atomic long g_atomic_ban_success;
extern TuiStats g_stats;
extern MinHeap g_top10;
extern IpMap g_ipmap;
extern struct timeval t_start;

/* Server state */
static pthread_t g_api_thread;
static volatile int g_api_running = 0;
static int g_server_fd = -1;

/* Connection context */
enum {
    CONN_ACCEPT,
    CONN_READ,
    CONN_WRITE,
    CONN_CLOSE
};

typedef struct {
    int fd;
    int state;
    char peer_ip[48];
    char rx_buf[API_BUFFER_SIZE];
    char tx_buf[API_BUFFER_SIZE * 4];
    int tx_len;
} conn_info_t;

/* HTTP Headers (with CORS) */
static const char *HTTP_200_OK =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Connection: close\r\n\r\n";

static const char *HTTP_404_NOTFOUND =
    "HTTP/1.1 404 Not Found\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Connection: close\r\n\r\n"
    "{\"error\": \"not found\"}";

static double get_uptime(void) {
    struct timeval t_now;
    gettimeofday(&t_now, NULL);
    double elapsed = (t_now.tv_sec - t_start.tv_sec) + 
                     (t_now.tv_usec - t_start.tv_usec) / 1000000.0;
    return elapsed > 0 ? elapsed : 0.001;
}

static const char *HTTP_400_BAD =
    "HTTP/1.1 400 Bad Request\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Connection: close\r\n\r\n";

static const char *HTTP_403_FORBIDDEN =
    "HTTP/1.1 403 Forbidden\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Connection: close\r\n\r\n";

static const char *HTTP_429_TOO_MANY =
    "HTTP/1.1 429 Too Many Requests\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Connection: close\r\n\r\n";

/* consult rate limit — global + per client IP (query ip=) */
#define CONSULT_MAX_GLOBAL_PER_SEC 120
#define CONSULT_MAX_PER_IP_PER_SEC 30
#define CONSULT_IP_SLOTS           64

typedef struct {
    char   ip[48];
    time_t window;
    int    count;
} consult_ip_slot_t;

static time_t            g_consult_window = 0;
static int               g_consult_count  = 0;
static pthread_mutex_t   g_consult_mu     = PTHREAD_MUTEX_INITIALIZER;
static consult_ip_slot_t g_consult_ips[CONSULT_IP_SLOTS];

static _Atomic uint64_t g_api_requests;
static _Atomic uint64_t g_api_auth_fail;
static _Atomic uint64_t g_api_rate_limited;

void api_server_get_stats(ApiServerStats *out)
{
    if (!out)
        return;
    out->requests_total     = atomic_load(&g_api_requests);
    out->auth_fail_total    = atomic_load(&g_api_auth_fail);
    out->rate_limited_total = atomic_load(&g_api_rate_limited);
}

static void api_count_request(void)
{
    atomic_fetch_add(&g_api_requests, 1);
}

static void api_count_auth_fail(void)
{
    atomic_fetch_add(&g_api_auth_fail, 1);
}

static void api_count_rate_limited(void)
{
    atomic_fetch_add(&g_api_rate_limited, 1);
}
static pthread_mutex_t   g_consult_ip_mu  = PTHREAD_MUTEX_INITIALIZER;

/* consult result cache — ip+method+path (TTL rules.conf CONSULT_CACHE_TTL) */
#define CONSULT_CACHE_SLOTS 128
typedef struct {
    uint64_t key;
    time_t   expire;
    int      allow;
    int      score;
    int      sqli;
} consult_cache_slot_t;

static int                   g_consult_cache_ttl = 0;
static consult_cache_slot_t  g_consult_cache[CONSULT_CACHE_SLOTS];
static pthread_mutex_t       g_consult_cache_mu  = PTHREAD_MUTEX_INITIALIZER;

void api_server_set_consult_cache_ttl(int sec)
{
    g_consult_cache_ttl = (sec > 0 && sec <= 300) ? sec : 0;
}

static uint64_t consult_cache_key(const char *ip, const char *method, const char *path)
{
    uint64_t h = 1469598103934665603ULL;
    const char *parts[] = { ip, method, path, NULL };
    for (int i = 0; parts[i]; i++) {
        for (const unsigned char *p = (const unsigned char *)parts[i]; *p; p++) {
            h ^= (uint64_t)*p;
            h *= 1099511628211ULL;
        }
        h ^= (uint64_t)'|';
        h *= 1099511628211ULL;
    }
    return h ? h : 1ULL;
}

static int consult_cache_lookup(uint64_t key, int *allow, int *score, int *sqli)
{
    if (g_consult_cache_ttl <= 0)
        return 0;
    time_t now = time(NULL);
    int hit = 0;
    pthread_mutex_lock(&g_consult_cache_mu);
    for (int i = 0; i < CONSULT_CACHE_SLOTS; i++) {
        consult_cache_slot_t *s = &g_consult_cache[i];
        if (s->key == key && s->expire > now) {
            *allow = s->allow;
            *score = s->score;
            *sqli  = s->sqli;
            hit = 1;
            break;
        }
    }
    pthread_mutex_unlock(&g_consult_cache_mu);
    return hit;
}

static void consult_cache_store(uint64_t key, int allow, int score, int sqli)
{
    if (g_consult_cache_ttl <= 0)
        return;
    time_t exp = time(NULL) + g_consult_cache_ttl;
    pthread_mutex_lock(&g_consult_cache_mu);
    int slot = (int)(key % CONSULT_CACHE_SLOTS);
    for (int i = 0; i < CONSULT_CACHE_SLOTS; i++) {
        int j = (slot + i) % CONSULT_CACHE_SLOTS;
        consult_cache_slot_t *s = &g_consult_cache[j];
        if (s->key == key || s->expire <= time(NULL)) {
            s->key    = key;
            s->expire = exp;
            s->allow  = allow;
            s->score  = score;
            s->sqli   = sqli;
            break;
        }
    }
    pthread_mutex_unlock(&g_consult_cache_mu);
}

/* ban/unban — token basina dakika limiti */
#define BAN_MAX_PER_MIN 30
static time_t          g_ban_min_window = 0;
static int             g_ban_min_count  = 0;
static pthread_mutex_t g_ban_mu         = PTHREAD_MUTEX_INITIALIZER;

static const char *HTTP_200_PLAIN =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/plain\r\n"
    "Connection: close\r\n\r\n";

static const char *http_body(const char *req)
{
    if (!req)
        return NULL;
    const char *sep = strstr(req, "\r\n\r\n");
    return sep ? sep + 4 : NULL;
}

static int http_header_value(const char *req, const char *name,
                             char *out, size_t cap)
{
    if (!req || !name || !out || cap < 2)
        return -1;
    char pattern[80];
    snprintf(pattern, sizeof(pattern), "%s:", name);
    const char *p = req;
    size_t nlen = strlen(pattern);
    while ((p = strstr(p, pattern)) != NULL) {
        if (p == req || p[-1] == '\n') {
            p += nlen;
            while (*p == ' ')
                p++;
            size_t i = 0;
            while (p[i] && p[i] != '\r' && p[i] != '\n' && i + 1 < cap) {
                out[i] = p[i];
                i++;
            }
            out[i] = '\0';
            return (i > 0) ? 0 : -1;
        }
        p += nlen;
    }
    return -1;
}

static void handle_post_telegram_webhook(conn_info_t *conn)
{
    if (!telegram_bot_webhook_mode()) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                                "%s", HTTP_404_NOTFOUND);
        return;
    }

    char secret_hdr[128] = "";
    (void)http_header_value(conn->rx_buf,
                            "X-Telegram-Bot-Api-Secret-Token",
                            secret_hdr, sizeof(secret_hdr));
    if (!telegram_bot_webhook_secret_ok(secret_hdr)) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                                "%s{\"error\":\"forbidden\"}", HTTP_403_FORBIDDEN);
        return;
    }

    const char *body = http_body(conn->rx_buf);
    if (!body || !body[0]) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                                "%s{\"error\":\"empty body\"}", HTTP_400_BAD);
        return;
    }

    telegram_bot_handle_update(body);
    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf), "%s", HTTP_200_PLAIN);
}

static const char *api_token_expected(void)
{
    const char *t = getenv("GUARDIAN_API_TOKEN");
    return (t && t[0]) ? t : NULL;
}

static int api_token_matches(const char *expected, conn_info_t *conn)
{
    char hdr[256] = "";
    if (http_header_value(conn->rx_buf, "Authorization", hdr, sizeof(hdr)) == 0) {
        if (strncmp(hdr, "Bearer ", 7) == 0 &&
            secure_equals(hdr + 7, expected))
            return 1;
    }
    if (http_header_value(conn->rx_buf, "X-Guardian-Token", hdr, sizeof(hdr)) == 0) {
        if (secure_equals(hdr, expected))
            return 1;
    }
    return 0;
}

/* fail-closed: API_TOKEN yoksa veya eslesmezse reddet */
static int api_check_mutation_auth(conn_info_t *conn)
{
    const char *expected = api_token_expected();
    if (!expected)
        return -1;
    return api_token_matches(expected, conn) ? 0 : -1;
}

static int api_check_consult_auth(conn_info_t *conn)
{
    return api_check_mutation_auth(conn);
}

static int api_check_read_auth(conn_info_t *conn)
{
    return api_check_mutation_auth(conn);
}

static int consult_global_rate_ok(void)
{
    time_t now = time(NULL);
    int ok = 0;
    pthread_mutex_lock(&g_consult_mu);
    if (now != g_consult_window) {
        g_consult_window = now;
        g_consult_count = 0;
    }
    g_consult_count++;
    ok = (g_consult_count <= CONSULT_MAX_GLOBAL_PER_SEC);
    pthread_mutex_unlock(&g_consult_mu);
    return ok;
}

static int consult_ip_rate_ok(const char *client_ip)
{
    if (!client_ip || !client_ip[0])
        client_ip = "0.0.0.0";
    time_t now = time(NULL);
    unsigned h = 2166136261u;
    for (const char *p = client_ip; *p; p++) {
        h ^= (unsigned char)*p;
        h *= 16777619u;
    }
    int idx = (int)(h % CONSULT_IP_SLOTS);
    int ok = 0;
    pthread_mutex_lock(&g_consult_ip_mu);
    for (int i = 0; i < CONSULT_IP_SLOTS; i++) {
        int j = (idx + i) % CONSULT_IP_SLOTS;
        consult_ip_slot_t *s = &g_consult_ips[j];
        if (s->ip[0] == '\0' || strcmp(s->ip, client_ip) == 0) {
            if (s->ip[0] == '\0') {
                strncpy(s->ip, client_ip, sizeof(s->ip) - 1);
                s->ip[sizeof(s->ip) - 1] = '\0';
            }
            if (now != s->window) {
                s->window = now;
                s->count = 0;
            }
            s->count++;
            ok = (s->count <= CONSULT_MAX_PER_IP_PER_SEC);
            break;
        }
    }
    pthread_mutex_unlock(&g_consult_ip_mu);
    return ok;
}

static int ban_rate_ok(void)
{
    time_t minute = time(NULL) / 60;
    int ok = 0;
    pthread_mutex_lock(&g_ban_mu);
    if (minute != g_ban_min_window) {
        g_ban_min_window = minute;
        g_ban_min_count = 0;
    }
    g_ban_min_count++;
    ok = (g_ban_min_count <= BAN_MAX_PER_MIN);
    pthread_mutex_unlock(&g_ban_mu);
    return ok;
}

static void api_send_rate_limited(conn_info_t *conn)
{
    api_count_rate_limited();
    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
        "%s{\"success\":false,\"error\":\"rate limit\"}", HTTP_429_TOO_MANY);
}

static void api_send_unauthorized(conn_info_t *conn)
{
    api_count_auth_fail();
    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
        "%s{\"success\":false,\"error\":\"unauthorized\"}",
        HTTP_403_FORBIDDEN);
}

static int parse_query_param(const char *req, const char *key,
                             char *out, size_t outsz)
{
    const char *q = strchr(req, '?');
    if (!q || !out || outsz < 2)
        return -1;
    char pattern[64];
    snprintf(pattern, sizeof(pattern), "%s=", key);
    const char *p = strstr(q, pattern);
    if (!p)
        return -1;
    p += strlen(pattern);
    size_t i = 0;
    while (p[i] && p[i] != '&' && p[i] != ' ' && i + 1 < outsz) {
        out[i] = p[i];
        i++;
    }
    out[i] = '\0';
    return (i > 0) ? 0 : -1;
}

static void decode_query_field(const char *raw, char *out, size_t outsz);

static void handle_post_ban(conn_info_t *conn, int unban)
{
    if (api_check_mutation_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    if (!ban_rate_ok()) {
        api_send_rate_limited(conn);
        return;
    }

    char ip_raw[64] = {0};
    char ip[64] = {0};
    char reason_raw[256] = "dashboard-api";
    char reason[256] = "dashboard-api";
    parse_query_param(conn->rx_buf, "reason", reason_raw, sizeof(reason_raw));
    decode_query_field(reason_raw, reason, sizeof(reason));

    if (parse_query_param(conn->rx_buf, "ip", ip_raw, sizeof(ip_raw)) != 0) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"success\":false,\"error\":\"invalid or missing ip\"}",
            HTTP_400_BAD);
        return;
    }
    decode_query_field(ip_raw, ip, sizeof(ip));
    if (!is_valid_ip(ip)) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"success\":false,\"error\":\"invalid or missing ip\"}",
            HTTP_400_BAD);
        return;
    }

    BanPath path = BAN_PATH_FAILED;
    int rc = unban
        ? ban_pipeline_unban(ip)
        : ban_pipeline_ban(ip, reason, &path);

    const char *path_label = "failed";
    if (unban) {
        path_label = (rc == 0) ? "ipset" : "failed";
    } else {
        switch (path) {
        case BAN_PATH_IPC_XDP:       path_label = "ipc-xdp"; break;
        case BAN_PATH_XDP_DIRECT:    path_label = "xdp"; break;
        case BAN_PATH_IPSET:         path_label = "ipset"; break;
        case BAN_PATH_WHITELIST_SKIP: path_label = "whitelist-skip"; break;
        default: break;
        }
    }

    if (rc == 0) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"success\":true,\"ip\":\"%s\",\"action\":\"%s\",\"path\":\"%s\"}",
            HTTP_200_OK, ip, unban ? "unban" : "ban", path_label);
    } else {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "HTTP/1.1 502 Bad Gateway\r\n"
            "Content-Type: application/json\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Connection: close\r\n\r\n"
            "{\"success\":false,\"ip\":\"%s\",\"error\":\"ban pipeline failed\"}",
            ip);
    }
}

static void handle_get_metrics(conn_info_t *conn) {
    if (api_check_read_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    double uptime = get_uptime();
    long lines = atomic_load(&g_atomic_lines);
    double eps = lines / uptime;
    size_t unique_ips = ipmap_size(&g_ipmap);

    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
        "%s"
        "{\n"
        "  \"uptime_sec\": %.1f,\n"
        "  \"eps\": %.1f,\n"
        "  \"total_lines\": %ld,\n"
        "  \"parse_errors\": %ld,\n"
        "  \"unique_ips\": %zu,\n"
        "  \"total_alerts\": %ld,\n"
        "  \"ban_attempts\": %ld,\n"
        "  \"ban_success\": %ld\n"
        "}",
        HTTP_200_OK,
        uptime, eps, lines, 
        atomic_load(&g_atomic_errors), unique_ips, 
        atomic_load(&g_atomic_alerts),
        atomic_load(&g_atomic_ban_attempts),
        atomic_load(&g_atomic_ban_success)
    );
}

static void handle_get_attack_tree(conn_info_t *conn) {
    if (api_check_read_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    const char *tree_path = attack_tree_get_json_path();
    FILE *f = fopen(tree_path, "r");
    if (!f) {
        char alt[512];
        if (attack_tree_resolve_file(alt, sizeof(alt)) == 0)
            f = fopen(alt, "r");
        if (f) tree_path = alt;
    }
    if (!f) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"trees\":[],\"source\":\"%s\"}",
            HTTP_200_OK, attack_tree_get_json_path());
        return;
    }
    char body[API_BUFFER_SIZE * 3];
    size_t n = fread(body, 1, sizeof(body) - 1, f);
    fclose(f);
    body[n] = '\0';
    if (n == 0 || body[0] != '[') {
        AttackTreeSnapshot snap;
        if (attack_tree_snapshot_read(&snap, ATREE_RISK_THRESHOLD_ALERT) == 0) {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s"
                "{\"summary\":{\"active_trees\":%lu,\"high_risk\":%lu,"
                "\"max_risk\":%.1f,\"top_comm\":\"%s\",\"top_pid\":%d},"
                "\"trees\":[]}",
                HTTP_200_OK,
                (unsigned long)snap.active_trees,
                (unsigned long)snap.high_risk_trees,
                snap.max_risk, snap.top_comm, (int)snap.top_pid);
        } else {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s{\"trees\":[],\"error\":\"empty\"}", HTTP_200_OK);
        }
        return;
    }
    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
        "%s{\"trees\":%s}", HTTP_200_OK, body);
}

static void handle_get_top10(conn_info_t *conn) {
    if (api_check_read_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    /* Create a snapshot of the top10 heap to avoid lock contention for long */
    MinHeap tmp = g_top10;
    IpRecord *sorted[HEAP_K] = {NULL};
    heap_sort_desc(&tmp, sorted);

    char body[API_BUFFER_SIZE * 3];
    int pos = 0;
    pos += snprintf(body + pos, sizeof(body) - pos, "[");

    int first = 1;
    for (int i = 0; i < HEAP_K; i++) {
        IpRecord *rec = sorted[i];
        if (!rec || rec->ip[0] == '\0') break;

        if (!first) pos += snprintf(body + pos, sizeof(body) - pos, ",");
        first = 0;

        pos += snprintf(body + pos, sizeof(body) - pos,
            "\n  {"
            "\"ip\": \"%s\", "
            "\"total\": %ld, "
            "\"err4xx\": %ld, "
            "\"sqli\": %ld, "
            "\"banned\": %d"
            "}",
            rec->ip,
            atomic_load(&rec->cnt.total_requests),
            atomic_load(&rec->cnt.error_4xx),
            atomic_load(&rec->cnt.sqli_hits),
            atomic_load(&rec->banned) ? 1 : 0
        );
    }
    snprintf(body + pos, sizeof(body) - pos, "\n]");

    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf), "%s%s", HTTP_200_OK, body);
}

static void decode_query_field(const char *raw, char *out, size_t outsz)
{
    size_t dlen = 0;
    if (!raw || !raw[0] || !out || outsz < 2) {
        if (out && outsz)
            out[0] = '\0';
        return;
    }
    size_t rlen = strlen(raw);
    if (rlen >= outsz)
        rlen = outsz - 1;
    url_decode(raw, rlen, out, &dlen);
}

static void handle_get_consult(conn_info_t *conn)
{
    if (api_check_consult_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    if (!consult_global_rate_ok()) {
        api_count_rate_limited();
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"allow\":false,\"error\":\"rate limit\"}", HTTP_429_TOO_MANY);
        return;
    }

    char path_raw[2048] = {0};
    char method_raw[16] = "GET";
    char ua_raw[512] = {0};
    char path[2048] = {0};
    char method[16] = "GET";
    char ua[512] = {0};
    char ip[64] = "127.0.0.1";

    if (parse_query_param(conn->rx_buf, "path", path_raw, sizeof(path_raw)) != 0 ||
        !path_raw[0]) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"allow\":false,\"error\":\"missing path\"}", HTTP_400_BAD);
        return;
    }
    parse_query_param(conn->rx_buf, "method", method_raw, sizeof(method_raw));
    parse_query_param(conn->rx_buf, "ua", ua_raw, sizeof(ua_raw));
    parse_query_param(conn->rx_buf, "ip", ip, sizeof(ip));
    if (!consult_ip_rate_ok(ip)) {
        api_count_rate_limited();
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"allow\":false,\"error\":\"rate limit\"}", HTTP_429_TOO_MANY);
        return;
    }

    decode_query_field(path_raw, path, sizeof(path));
    decode_query_field(method_raw, method, sizeof(method));
    decode_query_field(ua_raw, ua, sizeof(ua));
    if (!method[0])
        snprintf(method, sizeof(method), "GET");

    uint64_t ckey = consult_cache_key(ip, method, path);
    int cached_allow = 0, cached_score = 0, cached_sqli = 0;
    if (consult_cache_lookup(ckey, &cached_allow, &cached_score, &cached_sqli)) {
        if (!cached_allow) {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s{\"allow\":false,\"score\":%d,\"sqli\":%s,\"cached\":true}",
                HTTP_403_FORBIDDEN, cached_score, cached_sqli ? "true" : "false");
        } else {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s{\"allow\":true,\"score\":%d,\"sqli\":false,\"cached\":true}",
                HTTP_200_OK, cached_score);
        }
        return;
    }

    StrView url  = { path, strlen(path) };
    StrView body = { "", 0 };
    StrView user_agent = { ua, strlen(ua) };

    /* Inline consult: Host/cookie yok — OpenAPI strict bilinmeyen path'i 403 yapar.
     * Log hattinda tam baslik varken schema devreye girer; burada WAF+CRS+SQLi yeterli. */
    WafResult wr = waf_analyze(url, body, user_agent, method);
    int sqli = detect_sqli(url, body);
    /* Inline consult: log oncesi erken red — scanner/LFI tek basina da (>=7) */
    int block = sqli || waf_should_ban(&wr)
        || (wr.match_count > 0 && wr.total_score >= 7);

    consult_cache_store(ckey, block ? 0 : 1, wr.total_score, sqli);

    if (block) {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"allow\":false,\"score\":%d,\"sqli\":%s}",
            HTTP_403_FORBIDDEN, wr.total_score, sqli ? "true" : "false");
    } else {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
            "%s{\"allow\":true,\"score\":%d,\"sqli\":false}", HTTP_200_OK,
            wr.total_score);
    }
}

static void handle_get_bans(conn_info_t *conn)
{
    if (api_check_read_auth(conn) != 0) {
        api_send_unauthorized(conn);
        return;
    }
    const char *paths[] = {
        ACTIVE_BANS_JSON,
        "/run/log-guardian/active_bans.json",
        NULL,
    };
    for (int i = 0; paths[i]; i++) {
        FILE *f = fopen(paths[i], "r");
        if (!f) continue;
        char body[API_BUFFER_SIZE * 2];
        size_t n = fread(body, 1, sizeof(body) - 1, f);
        fclose(f);
        body[n] = '\0';
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf), "%s%s", HTTP_200_OK, body);
        return;
    }
    conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
        "%s{\"ips\":[],\"source\":\"empty\"}", HTTP_200_OK);
}

static void process_request(conn_info_t *conn, int rx_bytes) {
    conn->rx_buf[rx_bytes] = '\0';
    api_count_request();

    /* Very basic routing */
    if (strncmp(conn->rx_buf, "GET /api/v1/metrics", 19) == 0) {
        handle_get_metrics(conn);
    } else if (strncmp(conn->rx_buf, "GET /api/v1/top10", 17) == 0) {
        handle_get_top10(conn);
    } else if (strncmp(conn->rx_buf, "GET /api/v1/attack-tree", 23) == 0) {
        handle_get_attack_tree(conn);
    } else if (strncmp(conn->rx_buf, "GET /api/v1/incidents?", 22) == 0 ||
               strncmp(conn->rx_buf, "GET /api/v1/incidents ", 20) == 0) {
        if (api_check_read_auth(conn) != 0) {
            api_send_unauthorized(conn);
            return;
        }
        const char *q = strstr(conn->rx_buf, "id=");
        char body[API_BUFFER_SIZE * 2];
        if (q) {
            char id[32] = {0};
            sscanf(q + 3, "%31[^& \r\n]", id);
            if (incident_engine_export_one(id, body, sizeof(body)) > 0) {
                conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                    "%s%s", HTTP_200_OK, body);
            } else {
                conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                    "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n"
                    "Access-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n"
                    "{\"error\":\"incident not found\"}");
            }
        } else if (incident_engine_export_json(body, sizeof(body)) > 0) {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s%s", HTTP_200_OK, body);
        } else {
            conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf),
                "%s{\"incidents\":[],\"count\":0}", HTTP_200_OK);
        }
    } else if (strncmp(conn->rx_buf, "GET /api/v1/consult", 19) == 0) {
        handle_get_consult(conn);
    } else if (strncmp(conn->rx_buf, "GET /api/v1/bans", 16) == 0) {
        handle_get_bans(conn);
    } else if (strncmp(conn->rx_buf, "POST /api/v1/ban", 16) == 0) {
        handle_post_ban(conn, 0);
    } else if (strncmp(conn->rx_buf, "POST /api/v1/unban", 18) == 0) {
        handle_post_ban(conn, 1);
    } else if (strncmp(conn->rx_buf, "POST /telegram/webhook", 22) == 0 ||
               strncmp(conn->rx_buf, "POST /api/v1/telegram/webhook", 29) == 0) {
        handle_post_telegram_webhook(conn);
    } else {
        conn->tx_len = snprintf(conn->tx_buf, sizeof(conn->tx_buf), "%s", HTTP_404_NOTFOUND);
    }
}

static void add_accept(struct io_uring *ring, int fd, struct sockaddr_in *client_addr, socklen_t *client_len) {
    struct io_uring_sqe *sqe = io_uring_get_sqe(ring);
    conn_info_t *conn = calloc(1, sizeof(conn_info_t));
    conn->fd = fd;
    conn->state = CONN_ACCEPT;
    io_uring_prep_accept(sqe, fd, (struct sockaddr *)client_addr, client_len, 0);
    io_uring_sqe_set_data(sqe, conn);
}

static void add_read(struct io_uring *ring, conn_info_t *conn) {
    struct io_uring_sqe *sqe = io_uring_get_sqe(ring);
    conn->state = CONN_READ;
    io_uring_prep_recv(sqe, conn->fd, conn->rx_buf, sizeof(conn->rx_buf) - 1, 0);
    io_uring_sqe_set_data(sqe, conn);
}

static void add_write(struct io_uring *ring, conn_info_t *conn) {
    struct io_uring_sqe *sqe = io_uring_get_sqe(ring);
    conn->state = CONN_WRITE;
    io_uring_prep_send(sqe, conn->fd, conn->tx_buf, conn->tx_len, 0);
    io_uring_sqe_set_data(sqe, conn);
}

static void *api_worker(void *arg) {
    uint16_t port = (uint16_t)(uintptr_t)arg;
    struct io_uring ring;

    if (io_uring_queue_init(API_MAX_CONNECTIONS, &ring, 0) < 0) {
        fprintf(stderr, "[API] io_uring init failed\n");
        return NULL;
    }

    g_server_fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);
    if (g_server_fd < 0) {
        perror("[API] socket");
        return NULL;
    }

    int opt = 1;
    setsockopt(g_server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    struct sockaddr_in srv_addr = {0};
    srv_addr.sin_family = AF_INET;
    const char *bind_addr = getenv("GUARDIAN_API_BIND");
    if (!bind_addr || !bind_addr[0]) bind_addr = "127.0.0.1";
    srv_addr.sin_addr.s_addr = inet_addr(bind_addr);
    srv_addr.sin_port = htons(port);

    if (bind(g_server_fd, (struct sockaddr *)&srv_addr, sizeof(srv_addr)) < 0) {
        perror("[API] bind");
        close(g_server_fd);
        return NULL;
    }

    if (listen(g_server_fd, API_MAX_CONNECTIONS) < 0) {
        perror("[API] listen");
        close(g_server_fd);
        return NULL;
    }

    if (!api_token_expected()) {
        fprintf(stderr,
            "[API] UYARI: API_TOKEN bos — tum /api/v1 kapali (fail-closed)\n");
        fprintf(stderr,
            "[API]        sudo bash scripts/ensure_api_security.sh\n");
    } else {
        fprintf(stderr,
            "[API] API_TOKEN aktif — tum /api/v1 (Bearer veya X-Guardian-Token)\n");
    }
    fprintf(stderr, "[API] REST API listening on http://%s:%d\n",
            bind_addr, port);

    struct sockaddr_in client_addr;
    socklen_t client_len = sizeof(client_addr);
    
    add_accept(&ring, g_server_fd, &client_addr, &client_len);
    io_uring_submit(&ring);

    while (g_api_running) {
        struct io_uring_cqe *cqe;
        
        /* Non-blocking peek, with small sleep to avoid 100% CPU.
         * For a production HTTP server, io_uring_wait_cqe_timeout would be better,
         * but we need to check g_api_running flag periodically. */
        struct __kernel_timespec ts = { .tv_sec = 0, .tv_nsec = 100000000 }; /* 100ms */
        int ret = io_uring_wait_cqe_timeout(&ring, &cqe, &ts);
        
        if (ret == -ETIME) {
            continue; /* Timeout, check g_api_running and loop */
        } else if (ret < 0) {
            break;
        }

        struct io_uring_cqe *cqes[API_MAX_CONNECTIONS];
        int count = io_uring_peek_batch_cqe(&ring, cqes, API_MAX_CONNECTIONS);
        
        for (int i = 0; i < count; i++) {
            cqe = cqes[i];
            conn_info_t *conn = (conn_info_t *)io_uring_cqe_get_data(cqe);
            
            if (cqe->res < 0 && conn->state != CONN_ACCEPT) {
                close(conn->fd);
                free(conn);
            } else if (conn->state == CONN_ACCEPT) {
                int client_fd = cqe->res;
                /* Re-arm accept */
                add_accept(&ring, g_server_fd, &client_addr, &client_len);
                
                if (client_fd >= 0) {
                    conn_info_t *new_conn = calloc(1, sizeof(conn_info_t));
                    new_conn->fd = client_fd;
                    struct sockaddr_in peer;
                    socklen_t plen = sizeof(peer);
                    if (getpeername(client_fd, (struct sockaddr *)&peer, &plen) == 0)
                        inet_ntop(AF_INET, &peer.sin_addr, new_conn->peer_ip,
                                  sizeof(new_conn->peer_ip));
                    else
                        strncpy(new_conn->peer_ip, "127.0.0.1",
                                sizeof(new_conn->peer_ip) - 1);
                    add_read(&ring, new_conn);
                }
                free(conn); /* The accept conn object is just a dummy */
            } else if (conn->state == CONN_READ) {
                if (cqe->res <= 0) {
                    close(conn->fd);
                    free(conn);
                } else {
                    process_request(conn, cqe->res);
                    add_write(&ring, conn);
                }
            } else if (conn->state == CONN_WRITE) {
                /* Write done, HTTP/1.0 close connection */
                close(conn->fd);
                free(conn);
            }
        }
        io_uring_cq_advance(&ring, count);
        io_uring_submit(&ring);
    }

    /* Cleanup */
    if (g_server_fd >= 0) {
        close(g_server_fd);
        g_server_fd = -1;
    }
    io_uring_queue_exit(&ring);
    return NULL;
}

int api_server_start(uint16_t port) {
    if (g_api_running) return 0;
    g_api_running = 1;
    if (pthread_create(&g_api_thread, NULL, api_worker, (void *)(uintptr_t)port) != 0) {
        g_api_running = 0;
        return -1;
    }
    return 0;
}

void api_server_stop(void) {
    if (!g_api_running) return;
    g_api_running = 0;
    if (g_server_fd >= 0) {
        shutdown(g_server_fd, SHUT_RDWR);
        close(g_server_fd);
        g_server_fd = -1;
    }
    pthread_join(g_api_thread, NULL);
}
