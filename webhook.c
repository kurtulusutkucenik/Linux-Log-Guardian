#include "webhook.h"
#include "telegram_bot.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <time.h>
#include <pthread.h>
#include <unistd.h>
#include <stdatomic.h>
#include <curl/curl.h>

WebhookConfig g_webhook = {
    .token              = "",
    .chat_id_csv        = "",
    .telegram_chat_count = 0,
    .telegram_chat_crit_count = 0,
    .telegram_chat_warn_count = 0,
    .telegram_route_by_level = 0,
    .telegram_batch_sec = 0,
    .discord_url        = "",
    .slack_url          = "",
    .generic_url        = "",
    .enabled            = 0,
    .min_level          = 2,
    .cooldown_sec       = 60,
    .async_enabled      = 1,
    .silent_info        = 1,
    .telegram_bot_enabled = 0,
};

#define COOLDOWN_TABLE_SIZE 64
#define WH_QUEUE_CAP        128
#define WH_BATCH_MAX_ENTRIES 16

typedef enum {
    WH_JOB_ALERT,
    WH_JOB_SIMPLE
} WhJobKind;

typedef struct {
    WhJobKind     kind;
    Alert         alert;
    char          title[64];
    char          plain[1200];
    char          html[1400];
    char          ack_key[56];
    unsigned int  color;
    int           telegram_silent;
} WhJob;

static struct {
    char   ip[46];
    time_t last_sent;
} g_cooldown_table[COOLDOWN_TABLE_SIZE];

static pthread_mutex_t g_cooldown_mutex = PTHREAD_MUTEX_INITIALIZER;
static time_t g_webhook_mute_until = 0;
static int g_webhook_fail_streak = 0;
static int g_webhook_test_mode = 0;
static WebhookDeliveryStats g_last_delivery;

static WhJob g_queue[WH_QUEUE_CAP];
static int g_q_head = 0, g_q_tail = 0, g_q_count = 0;
static pthread_mutex_t g_q_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t  g_q_cond  = PTHREAD_COND_INITIALIZER;
static pthread_t       g_worker;
static int g_worker_started = 0;
static int g_worker_stop = 0;

typedef struct {
    char       ip[46];
    int        count;
    AlertLevel max_level;
    char       sample[48];
} WhBatchEntry;

static pthread_mutex_t g_batch_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_t       g_batch_timer;
static int             g_batch_timer_started = 0;
static time_t          g_batch_deadline = 0;
static int             g_batch_total = 0;
static int             g_batch_entry_count = 0;
static WhBatchEntry    g_batch_entries[WH_BATCH_MAX_ENTRIES];

static _Atomic long g_metric_sent = 0;
static _Atomic long g_metric_fail = 0;
static _Atomic long g_metric_drops = 0;
static pthread_mutex_t g_metric_store_mutex = PTHREAD_MUTEX_INITIALIZER;

static const char *metrics_store_path(void) {
    const char *p = getenv("LOGANALYZER_WEBHOOK_METRICS_FILE");
    if (p && p[0])
        return p;
    return "/var/lib/log-guardian/webhook.metrics";
}

static void metrics_read_unlocked(long *sent, long *fail, long *drops) {
    long s = 0, f = 0, d = 0;
    FILE *fp = fopen(metrics_store_path(), "r");
    if (fp) {
        char line[64];
        while (fgets(line, sizeof(line), fp)) {
            if (strncmp(line, "sent=", 5) == 0)
                s = strtol(line + 5, NULL, 10);
            else if (strncmp(line, "fail=", 5) == 0)
                f = strtol(line + 5, NULL, 10);
            else if (strncmp(line, "drops=", 6) == 0)
                d = strtol(line + 6, NULL, 10);
        }
        fclose(fp);
    }
    if (sent)
        *sent = s;
    if (fail)
        *fail = f;
    if (drops)
        *drops = d;
}

static void metrics_write_unlocked(long sent, long fail, long drops) {
    char path[512];
    char tmp[560];
    snprintf(path, sizeof(path), "%s", metrics_store_path());
    snprintf(tmp, sizeof(tmp), "%s.%d.tmp", path, (int)getpid());

    FILE *fp = fopen(tmp, "w");
    if (!fp)
        return;
    fprintf(fp, "sent=%ld\nfail=%ld\ndrops=%ld\n", sent, fail, drops);
    fclose(fp);
    (void)rename(tmp, path);
}

static void webhook_metrics_sync_from_file(void) {
    pthread_mutex_lock(&g_metric_store_mutex);
    long s = 0, f = 0, d = 0;
    metrics_read_unlocked(&s, &f, &d);
    atomic_store(&g_metric_sent, s);
    atomic_store(&g_metric_fail, f);
    atomic_store(&g_metric_drops, d);
    pthread_mutex_unlock(&g_metric_store_mutex);
}

static void webhook_metrics_bump(int kind) {
    pthread_mutex_lock(&g_metric_store_mutex);
    long s = 0, f = 0, d = 0;
    metrics_read_unlocked(&s, &f, &d);
    if (kind == 0)
        s++;
    else if (kind == 1)
        f++;
    else
        d++;
    metrics_write_unlocked(s, f, d);
    atomic_store(&g_metric_sent, s);
    atomic_store(&g_metric_fail, f);
    atomic_store(&g_metric_drops, d);
    pthread_mutex_unlock(&g_metric_store_mutex);
}

static size_t discard_response(void *ptr, size_t size, size_t nmemb, void *ud) {
    (void)ptr;
    (void)ud;
    return size * nmemb;
}

struct curl_hdr_ctx {
    long retry_after;
    long http_code;
};

static size_t curl_header_cb(char *buffer, size_t size, size_t nitems, void *userdata) {
    size_t total = size * nitems;
    struct curl_hdr_ctx *ctx = userdata;
    if (total >= 13 && strncasecmp(buffer, "Retry-After:", 12) == 0) {
        const char *p = buffer + 12;
        while (*p == ' ') p++;
        ctx->retry_after = strtol(p, NULL, 10);
    }
    return total;
}

int webhook_is_dry_run(void) {
    const char *v = getenv("WEBHOOK_DRY_RUN");
    return v && (v[0] == '1' || v[0] == 'y' || v[0] == 'Y');
}

void webhook_set_test_mode(int on) {
    g_webhook_test_mode = on ? 1 : 0;
}

void webhook_delivery_stats(WebhookDeliveryStats *out) {
    if (!out) return;
    *out = g_last_delivery;
}

void webhook_metrics_snapshot(long *sent, long *fail, long *queue_drops, long *queue_depth) {
    webhook_metrics_sync_from_file();
    if (sent)
        *sent = atomic_load(&g_metric_sent);
    if (fail)
        *fail = atomic_load(&g_metric_fail);
    if (queue_drops)
        *queue_drops = atomic_load(&g_metric_drops);
    if (queue_depth) {
        pthread_mutex_lock(&g_q_mutex);
        *queue_depth = g_q_count;
        pthread_mutex_unlock(&g_q_mutex);
    }
}

void webhook_set_telegram_chat_csv(const char *csv) {
    g_webhook.telegram_chat_count = 0;
    if (!csv || !csv[0]) {
        g_webhook.chat_id_csv[0] = '\0';
        return;
    }
    strncpy(g_webhook.chat_id_csv, csv, sizeof(g_webhook.chat_id_csv) - 1);
    g_webhook.chat_id_csv[sizeof(g_webhook.chat_id_csv) - 1] = '\0';

    char buf[WEBHOOK_CHAT_CSV_LEN];
    strncpy(buf, csv, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';

    char *save = NULL;
    for (char *tok = strtok_r(buf, ", \t", &save);
         tok && g_webhook.telegram_chat_count < WEBHOOK_MAX_TELEGRAM_CHATS;
         tok = strtok_r(NULL, ", \t", &save)) {
        if (!tok[0]) continue;
        strncpy(g_webhook.telegram_chats[g_webhook.telegram_chat_count], tok,
                sizeof(g_webhook.telegram_chats[0]) - 1);
        g_webhook.telegram_chats[g_webhook.telegram_chat_count]
            [sizeof(g_webhook.telegram_chats[0]) - 1] = '\0';
        g_webhook.telegram_chat_count++;
    }
}

static void telegram_chat_csv_into(char ids[][64], int *count, const char *csv) {
    *count = 0;
    if (!csv || !csv[0])
        return;

    char buf[WEBHOOK_CHAT_CSV_LEN];
    strncpy(buf, csv, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';

    char *save = NULL;
    for (char *tok = strtok_r(buf, ", \t", &save);
         tok && *count < WEBHOOK_MAX_TELEGRAM_CHATS;
         tok = strtok_r(NULL, ", \t", &save)) {
        if (!tok[0]) continue;
        strncpy(ids[*count], tok, 64 - 1);
        ids[*count][64 - 1] = '\0';
        (*count)++;
    }
}

void webhook_set_telegram_chat_crit_csv(const char *csv) {
    telegram_chat_csv_into(g_webhook.telegram_chats_crit,
                             &g_webhook.telegram_chat_crit_count, csv);
}

void webhook_set_telegram_chat_warn_csv(const char *csv) {
    telegram_chat_csv_into(g_webhook.telegram_chats_warn,
                             &g_webhook.telegram_chat_warn_count, csv);
}

static int chat_in_list(const char *chat_id,
                        char ids[][64], int count) {
    if (!chat_id || !chat_id[0])
        return 0;
    for (int i = 0; i < count; i++) {
        if (strcmp(ids[i], chat_id) == 0)
            return 1;
    }
    return 0;
}

int webhook_telegram_chat_allowed(const char *chat_id) {
    if (chat_in_list(chat_id, g_webhook.telegram_chats,
                     g_webhook.telegram_chat_count))
        return 1;
    if (chat_in_list(chat_id, g_webhook.telegram_chats_crit,
                     g_webhook.telegram_chat_crit_count))
        return 1;
    if (chat_in_list(chat_id, g_webhook.telegram_chats_warn,
                     g_webhook.telegram_chat_warn_count))
        return 1;
    return 0;
}

int webhook_telegram_target_count(void) {
    if (g_webhook.telegram_route_by_level)
        return g_webhook.telegram_chat_crit_count +
               g_webhook.telegram_chat_warn_count;
    if (g_webhook.telegram_chat_count > 0)
        return g_webhook.telegram_chat_count;
    return g_webhook.telegram_chat_crit_count +
           g_webhook.telegram_chat_warn_count;
}

void webhook_config_metrics(long *route_on, long *batch_sec) {
    if (route_on)
        *route_on = g_webhook.telegram_route_by_level ? 1L : 0L;
    if (batch_sec)
        *batch_sec = (long)g_webhook.telegram_batch_sec;
}

static int telegram_has_any_chat(void) {
    return g_webhook.telegram_chat_count > 0 ||
           g_webhook.telegram_chat_crit_count > 0 ||
           g_webhook.telegram_chat_warn_count > 0;
}

static void telegram_route_targets(int alert_level, int force_crit,
                                   char ids[][64], int *count) {
    *count = 0;
    if (!g_webhook.telegram_route_by_level ||
        (g_webhook.telegram_chat_crit_count == 0 &&
         g_webhook.telegram_chat_warn_count == 0)) {
        *count = g_webhook.telegram_chat_count;
        for (int i = 0; i < *count; i++)
            strncpy(ids[i], g_webhook.telegram_chats[i], 64);
        return;
    }

    const char (*src)[64] = NULL;
    int n = 0;
    if (force_crit || alert_level >= ALERT_CRIT) {
        src = g_webhook.telegram_chats_crit;
        n = g_webhook.telegram_chat_crit_count;
    } else {
        src = g_webhook.telegram_chats_warn;
        n = g_webhook.telegram_chat_warn_count;
    }

    if (n == 0) {
        *count = g_webhook.telegram_chat_count;
        for (int i = 0; i < *count; i++)
            strncpy(ids[i], g_webhook.telegram_chats[i], 64);
        return;
    }

    *count = n;
    for (int i = 0; i < n; i++)
        strncpy(ids[i], src[i], 64);
}

int webhook_destinations_configured(void) {
    int n = 0;
    if (g_webhook.token[0] && telegram_has_any_chat()) n++;
    if (g_webhook.discord_url[0]) n++;
    if (g_webhook.slack_url[0]) n++;
    if (g_webhook.generic_url[0]) n++;
    return n;
}

void webhook_status_json(FILE *out) {
    long qd = 0;
    webhook_metrics_snapshot(NULL, NULL, NULL, &qd);
    fprintf(out,
            "\"notifications\":{\"enabled\":%s,\"dry_run\":%s,"
            "\"telegram\":%s,\"telegram_chats\":%d,\"discord\":%s,"
            "\"slack\":%s,\"generic\":%s,"
            "\"destinations\":%d,\"min_level\":%d,\"cooldown_sec\":%d,"
            "\"async\":%s,\"silent_info\":%s,\"telegram_bot\":%s,"
            "\"telegram_route\":%s,\"telegram_batch_sec\":%d,\"queue_depth\":%ld}",
            g_webhook.enabled ? "true" : "false",
            webhook_is_dry_run() ? "true" : "false",
            (g_webhook.token[0] && telegram_has_any_chat()) ? "true" : "false",
            g_webhook.telegram_chat_count,
            g_webhook.discord_url[0] ? "true" : "false",
            g_webhook.slack_url[0] ? "true" : "false",
            g_webhook.generic_url[0] ? "true" : "false",
            webhook_destinations_configured(),
            g_webhook.min_level,
            g_webhook.cooldown_sec,
            g_webhook.async_enabled ? "true" : "false",
            g_webhook.silent_info ? "true" : "false",
            g_webhook.telegram_bot_enabled ? "true" : "false",
            g_webhook.telegram_route_by_level ? "true" : "false",
            g_webhook.telegram_batch_sec,
            qd);
}

static int cooldown_check_and_set(const char *ip, time_t now) {
    if (g_webhook_test_mode) return 1;

    pthread_mutex_lock(&g_cooldown_mutex);
    unsigned int slot = 0;
    for (unsigned int i = 0; i < COOLDOWN_TABLE_SIZE; i++) {
        unsigned int h = 0;
        for (const char *c = ip; *c; c++) h = h * 31 + (unsigned char)*c;
        slot = (h + i) % COOLDOWN_TABLE_SIZE;
        if (g_cooldown_table[slot].ip[0] == '\0' ||
            strcmp(g_cooldown_table[slot].ip, ip) == 0)
            break;
    }

    if (g_cooldown_table[slot].ip[0] != '\0' &&
        strcmp(g_cooldown_table[slot].ip, ip) == 0) {
        if (now - g_cooldown_table[slot].last_sent < g_webhook.cooldown_sec) {
            pthread_mutex_unlock(&g_cooldown_mutex);
            return 0;
        }
    }

    memcpy(g_cooldown_table[slot].ip, ip, sizeof(g_cooldown_table[slot].ip) - 1);
    g_cooldown_table[slot].ip[sizeof(g_cooldown_table[slot].ip) - 1] = '\0';
    g_cooldown_table[slot].last_sent = now;
    pthread_mutex_unlock(&g_cooldown_mutex);
    return 1;
}

static void json_append_str(char *dst, size_t cap, size_t *pos, const char *src) {
    for (; *src && *pos + 1 < cap; src++) {
        if (*src == '"' || *src == '\\')
            dst[(*pos)++] = '\\';
        if (*pos + 1 < cap)
            dst[(*pos)++] = *src;
    }
    dst[*pos] = '\0';
}

static void html_escape(const char *src, char *dst, size_t cap) {
    size_t pos = 0;
    for (; *src && pos + 6 < cap; src++) {
        const char *rep = NULL;
        switch (*src) {
            case '&': rep = "&amp;"; break;
            case '<': rep = "&lt;"; break;
            case '>': rep = "&gt;"; break;
            case '"': rep = "&quot;"; break;
            default: break;
        }
        if (rep) {
            size_t rl = strlen(rep);
            if (pos + rl >= cap) break;
            memcpy(dst + pos, rep, rl);
            pos += rl;
        } else {
            dst[pos++] = *src;
        }
    }
    dst[pos] = '\0';
}

static void dry_run_log(const char *channel, const char *url, const char *body) {
    char preview[160];
    size_t n = strlen(body);
    if (n > sizeof(preview) - 4) n = sizeof(preview) - 4;
    memcpy(preview, body, n);
    preview[n] = '\0';
    for (size_t i = 0; preview[i]; i++) {
        if (preview[i] == '\n' || preview[i] == '\r')
            preview[i] = ' ';
    }
    fprintf(stderr, "[WEBHOOK][DRY-RUN] %s -> %s\n  body: %s%s\n",
            channel, url, preview, strlen(body) > n ? "..." : "");
}

static void note_http_result(CURLcode res, long http_code, const char *channel) {
    if (res == CURLE_OK && http_code >= 200 && http_code < 300) {
        pthread_mutex_lock(&g_cooldown_mutex);
        g_webhook_fail_streak = 0;
        g_webhook_mute_until = 0;
        pthread_mutex_unlock(&g_cooldown_mutex);
        g_last_delivery.ok++;
        webhook_metrics_bump(0);
        return;
    }
    g_last_delivery.fail++;
    webhook_metrics_bump(1);
    pthread_mutex_lock(&g_cooldown_mutex);
    g_webhook_fail_streak++;
    int backoff = g_webhook_fail_streak < 8 ? g_webhook_fail_streak : 8;
    g_webhook_mute_until = time(NULL) + backoff;
    pthread_mutex_unlock(&g_cooldown_mutex);
    if (res != CURLE_OK)
        fprintf(stderr, "[WEBHOOK] %s gonderilemedi: %s\n",
                channel, curl_easy_strerror(res));
    else
        fprintf(stderr, "[WEBHOOK] %s HTTP %ld\n", channel, http_code);
}

static int http_post_json_retry(const char *url, const char *body, const char *channel) {
    if (!url || !url[0] || !body) return 0;

    time_t now = time(NULL);
    pthread_mutex_lock(&g_cooldown_mutex);
    if (!g_webhook_test_mode && g_webhook_mute_until > now) {
        pthread_mutex_unlock(&g_cooldown_mutex);
        return 0;
    }
    pthread_mutex_unlock(&g_cooldown_mutex);

    if (webhook_is_dry_run()) {
        dry_run_log(channel, url, body);
        g_last_delivery.ok++;
        return 0;
    }

    for (int attempt = 0; attempt < 4; attempt++) {
        CURL *curl = curl_easy_init();
        if (!curl) {
            g_last_delivery.fail++;
            webhook_metrics_bump(1);
            return -1;
        }

        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        struct curl_hdr_ctx hdr = {0, 0};

        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, discard_response);
        curl_easy_setopt(curl, CURLOPT_HEADERFUNCTION, curl_header_cb);
        curl_easy_setopt(curl, CURLOPT_HEADERDATA, &hdr);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 8L);
        curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 4L);
        curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);

        CURLcode res = curl_easy_perform(curl);
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &hdr.http_code);

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        if (res == CURLE_OK && hdr.http_code >= 200 && hdr.http_code < 300) {
            note_http_result(res, hdr.http_code, channel);
            return 0;
        }

        if (hdr.http_code == 429 && attempt < 3) {
            long wait = hdr.retry_after > 0 ? hdr.retry_after : (attempt + 1);
            if (wait > 30) wait = 30;
            fprintf(stderr, "[WEBHOOK] %s rate limit — %lds bekleniyor\n", channel, wait);
            sleep((unsigned int)wait);
            continue;
        }

        note_http_result(res, hdr.http_code, channel);
        return -1;
    }
    return -1;
}

static const char *level_prefix_html(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return "\xf0\x9f\x9a\xa8 <b>KRITIK ALARM</b>";
        case ALERT_WARN: return "\xe2\x9a\xa0\xef\xb8\x8f <b>UYARI</b>";
        case ALERT_INFO: return "\xf0\x9f\x94\xb5 <b>BILGI</b>";
        default:         return "<b>ALARM</b>";
    }
}

static const char *level_prefix_plain(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return "KRITIK ALARM";
        case ALERT_WARN: return "UYARI";
        case ALERT_INFO: return "BILGI";
        default:         return "ALARM";
    }
}

static unsigned int level_color(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return 15158332u;
        case ALERT_WARN: return 16744272u;
        case ALERT_INFO: return 3447003u;
        default:         return 9807270u;
    }
}

static int telegram_silent_for_level(AlertLevel lvl) {
    if (!g_webhook.silent_info) return 0;
    return lvl == ALERT_INFO ? 1 : 0;
}

static void get_hostname_label(char *out, size_t cap) {
    if (!out || cap == 0) return;
    out[0] = '\0';
    if (gethostname(out, cap - 1) != 0)
        strncpy(out, "log-guardian", cap - 1);
    out[cap - 1] = '\0';
}

static void build_alert_messages(const Alert *a,
                                 char *plain, size_t plain_sz,
                                 char *html, size_t html_sz,
                                 int *out_silent) {
    struct tm *tm_info = localtime(&a->ts);
    char tsbuf[32];
    strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M:%S", tm_info);

    char host[64];
    get_hostname_label(host, sizeof(host));

    char ip_e[IP_STR_LEN * 2];
    char msg_e[ALERT_MSG_LEN * 2];
    char mitre_e[32];
    char inc_e[48];
    html_escape(a->ip, ip_e, sizeof(ip_e));
    html_escape(a->message, msg_e, sizeof(msg_e));

    char mitre_plain[96] = "";
    char mitre_html[128] = "";
    if (a->mitre_id[0] != '\0') {
        html_escape(a->mitre_id, mitre_e, sizeof(mitre_e));
        snprintf(mitre_plain, sizeof(mitre_plain),
                 "\nMITRE: %s (%s)", a->mitre_id, a->mitre_tactic);
        snprintf(mitre_html, sizeof(mitre_html),
                 "\nMITRE: <code>%s</code> (%s)", mitre_e, a->mitre_tactic);
    }

    char inc_plain[64] = "";
    char inc_html[96] = "";
    if (a->incident_id[0] != '\0') {
        html_escape(a->incident_id, inc_e, sizeof(inc_e));
        snprintf(inc_plain, sizeof(inc_plain), "\nIncident: %s", a->incident_id);
        snprintf(inc_html, sizeof(inc_html), "\nIncident: <code>%s</code>", inc_e);
    }

    snprintf(plain, plain_sz,
             "[%s]\nHost: %s\nIP: %s\nZaman: %s%s%s\n\n%s",
             level_prefix_plain(a->level), host, a->ip, tsbuf,
             mitre_plain, inc_plain, a->message);
    snprintf(html, html_sz,
             "%s\n\nHost: <code>%s</code>\nIP: <code>%s</code>\nZaman: %s%s%s\n\n%s",
             level_prefix_html(a->level), host, ip_e, tsbuf,
             mitre_html, inc_html, msg_e);

    if (out_silent) *out_silent = telegram_silent_for_level(a->level);
}

static const char *telegram_api_base(void) {
    const char *b = getenv("WEBHOOK_TELEGRAM_API_BASE");
    if (b && b[0]) return b;
    return "https://api.telegram.org";
}

static int telegram_post_one(const char *chat_id, const char *text_html, int silent,
                             const char *reply_markup_json) {
    if (!g_webhook.token[0] || !chat_id || !chat_id[0]) return 0;

    char url[640];
    snprintf(url, sizeof(url),
             "%s/bot%s/sendMessage", telegram_api_base(), g_webhook.token);

    char body[4096];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\"chat_id\":\"");
    json_append_str(body, sizeof(body), &pos, chat_id);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\",\"text\":\"");
    json_append_str(body, sizeof(body), &pos, text_html);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            "\",\"parse_mode\":\"HTML\",\"disable_notification\":%s",
                            silent ? "true" : "false");
    if (reply_markup_json && reply_markup_json[0]) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"reply_markup\":%s", reply_markup_json);
    }
    snprintf(body + pos, sizeof(body) - pos, "}");

    return http_post_json_retry(url, body, "telegram");
}

static int telegram_post(const char *text_html, int silent,
                         const char *reply_markup_json,
                         int alert_level, int force_crit) {
    char targets[WEBHOOK_MAX_TELEGRAM_CHATS][64];
    int n = 0;
    telegram_route_targets(alert_level, force_crit, targets, &n);

    int rc = 0;
    for (int i = 0; i < n; i++) {
        if (telegram_post_one(targets[i], text_html, silent,
                              reply_markup_json) != 0)
            rc = -1;
    }
    return rc;
}

static int discord_post_embed(const char *title, const char *desc, unsigned int color) {
    if (!g_webhook.discord_url[0]) return 0;
    char body[2800];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            "\"embeds\":[{\"title\":\"");
    json_append_str(body, sizeof(body), &pos, title);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\",\"description\":\"");
    json_append_str(body, sizeof(body), &pos, desc);
    snprintf(body + pos, sizeof(body) - pos, "\",\"color\":%u}]}", color);
    return http_post_json_retry(g_webhook.discord_url, body, "discord");
}

static int slack_post(const char *text_plain) {
    if (!g_webhook.slack_url[0]) return 0;
    char body[2400];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\"text\":\"");
    json_append_str(body, sizeof(body), &pos, text_plain);
    snprintf(body + pos, sizeof(body) - pos, "\"}");
    return http_post_json_retry(g_webhook.slack_url, body, "slack");
}

static int generic_post(const char *text_plain) {
    if (!g_webhook.generic_url[0]) return 0;
    char body[2400];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\"text\":\"");
    json_append_str(body, sizeof(body), &pos, text_plain);
    snprintf(body + pos, sizeof(body) - pos, "\"}");
    return http_post_json_retry(g_webhook.generic_url, body, "generic");
}

static void deliver_job(const WhJob *job) {
    char markup[256] = "";
    const char *markup_ptr = NULL;
    if (telegram_bot_enabled()) {
        const char *key = NULL;
        if (job->kind == WH_JOB_ALERT && job->alert.level >= ALERT_WARN) {
            key = job->alert.incident_id[0] ? job->alert.incident_id
                                              : job->alert.ip;
        } else if (job->kind == WH_JOB_SIMPLE && job->ack_key[0]) {
            key = job->ack_key;
        }
        if (key) {
            telegram_bot_build_ack_markup(key, markup, sizeof(markup));
            markup_ptr = markup;
        }
    }

    if (job->kind == WH_JOB_ALERT) {
        (void)telegram_post(job->html, job->telegram_silent, markup_ptr,
                             job->alert.level, 0);
        (void)discord_post_embed(level_prefix_plain(job->alert.level),
                                 job->plain, level_color(job->alert.level));
    } else {
        (void)telegram_post(job->html, job->telegram_silent, markup_ptr,
                             ALERT_CRIT, 1);
        (void)discord_post_embed(job->title, job->plain, job->color);
    }
    (void)slack_post(job->plain);
    if (g_webhook.generic_url[0] &&
        strcmp(g_webhook.generic_url, g_webhook.slack_url) != 0 &&
        strcmp(g_webhook.generic_url, g_webhook.discord_url) != 0)
        (void)generic_post(job->plain);
}

static int queue_push(const WhJob *job) {
    pthread_mutex_lock(&g_q_mutex);
    if (g_q_count >= WH_QUEUE_CAP) {
        webhook_metrics_bump(2);
        pthread_mutex_unlock(&g_q_mutex);
        fprintf(stderr, "[WEBHOOK] kuyruk dolu — mesaj atildi\n");
        return -1;
    }
    g_queue[g_q_tail] = *job;
    g_q_tail = (g_q_tail + 1) % WH_QUEUE_CAP;
    g_q_count++;
    pthread_cond_signal(&g_q_cond);
    pthread_mutex_unlock(&g_q_mutex);
    return 0;
}

static void dispatch_job(WhJob *job) {
    if (g_webhook_test_mode || !g_webhook.async_enabled || !g_webhook.enabled) {
        deliver_job(job);
        return;
    }
    (void)queue_push(job);
}

static int alert_should_batch(const Alert *a) {
    if (g_webhook_test_mode)
        return 0;
    if (g_webhook.telegram_batch_sec <= 0)
        return 0;
    if ((int)a->level >= ALERT_CRIT)
        return 0;
    return 1;
}

static void batch_reset_unlocked(void) {
    g_batch_deadline = 0;
    g_batch_total = 0;
    g_batch_entry_count = 0;
}

static int batch_add_entry_unlocked(const Alert *a) {
    for (int i = 0; i < g_batch_entry_count; i++) {
        if (strcmp(g_batch_entries[i].ip, a->ip) == 0) {
            g_batch_entries[i].count++;
            if ((int)a->level > (int)g_batch_entries[i].max_level)
                g_batch_entries[i].max_level = a->level;
            g_batch_total++;
            return 0;
        }
    }
    if (g_batch_entry_count >= WH_BATCH_MAX_ENTRIES)
        return -1;

    WhBatchEntry *e = &g_batch_entries[g_batch_entry_count++];
    strncpy(e->ip, a->ip, sizeof(e->ip) - 1);
    e->ip[sizeof(e->ip) - 1] = '\0';
    e->count = 1;
    e->max_level = a->level;
    strncpy(e->sample, a->message, sizeof(e->sample) - 1);
    e->sample[sizeof(e->sample) - 1] = '\0';
    g_batch_total++;
    return 0;
}

static void batch_dispatch_summary(int total, int entry_count,
                                   const WhBatchEntry *entries) {
    if (total <= 0 || entry_count <= 0)
        return;

    char host[64];
    get_hostname_label(host, sizeof(host));
    char host_e[128];
    html_escape(host, host_e, sizeof(host_e));

    WhJob job = {0};
    job.kind = WH_JOB_ALERT;
    job.alert.level = ALERT_WARN;
    job.alert.ts = time(NULL);
    job.telegram_silent = telegram_silent_for_level(ALERT_WARN);
    if (entries[0].ip[0])
        strncpy(job.alert.ip, entries[0].ip, sizeof(job.alert.ip) - 1);

    size_t ppos = 0;
    size_t hpos = 0;
    ppos += (size_t)snprintf(
        job.plain + ppos, sizeof(job.plain) - ppos,
        "UYARI OZETI (%ds · %d olay)\nHost: %s\n",
        g_webhook.telegram_batch_sec, total, host);
    hpos += (size_t)snprintf(
        job.html + hpos, sizeof(job.html) - hpos,
        "\xe2\x9a\xa0\xef\xb8\x8f <b>UYARI OZETI</b> (%ds · %d olay)\n\n"
        "Host: <code>%s</code>\n",
        g_webhook.telegram_batch_sec, total, host_e);

    for (int i = 0; i < entry_count; i++) {
        char ip_e[96];
        html_escape(entries[i].ip, ip_e, sizeof(ip_e));
        if (ppos + 64 >= sizeof(job.plain))
            break;
        ppos += (size_t)snprintf(
            job.plain + ppos, sizeof(job.plain) - ppos,
            "• %s x%d", entries[i].ip, entries[i].count);
        if (entries[i].sample[0])
            ppos += (size_t)snprintf(
                job.plain + ppos, sizeof(job.plain) - ppos,
                " — %s", entries[i].sample);
        ppos += (size_t)snprintf(job.plain + ppos, sizeof(job.plain) - ppos, "\n");

        if (hpos + 96 >= sizeof(job.html))
            break;
        hpos += (size_t)snprintf(
            job.html + hpos, sizeof(job.html) - hpos,
            "• <code>%s</code> x%d", ip_e, entries[i].count);
        if (entries[i].sample[0]) {
            char msg_e[96];
            html_escape(entries[i].sample, msg_e, sizeof(msg_e));
            hpos += (size_t)snprintf(
                job.html + hpos, sizeof(job.html) - hpos,
                " — %s", msg_e);
        }
        hpos += (size_t)snprintf(job.html + hpos, sizeof(job.html) - hpos, "\n");
    }

    strncpy(job.alert.message, job.plain, sizeof(job.alert.message) - 1);
    job.alert.message[sizeof(job.alert.message) - 1] = '\0';
    dispatch_job(&job);
}

void webhook_batch_flush(void) {
    WhBatchEntry entries[WH_BATCH_MAX_ENTRIES];
    int total = 0;
    int entry_count = 0;

    pthread_mutex_lock(&g_batch_mutex);
    if (g_batch_total > 0) {
        total = g_batch_total;
        entry_count = g_batch_entry_count;
        memcpy(entries, g_batch_entries,
               (size_t)entry_count * sizeof(g_batch_entries[0]));
        batch_reset_unlocked();
    }
    pthread_mutex_unlock(&g_batch_mutex);

    batch_dispatch_summary(total, entry_count, entries);
}

static void *batch_timer_thread(void *arg) {
    (void)arg;
    while (!g_worker_stop) {
        sleep(1);
        int due = 0;
        pthread_mutex_lock(&g_batch_mutex);
        if (g_batch_total > 0 && g_batch_deadline > 0 &&
            time(NULL) >= g_batch_deadline)
            due = 1;
        pthread_mutex_unlock(&g_batch_mutex);
        if (due)
            webhook_batch_flush();
    }
    return NULL;
}

static void *webhook_worker(void *arg) {
    (void)arg;
    for (;;) {
        pthread_mutex_lock(&g_q_mutex);
        while (g_q_count == 0 && !g_worker_stop)
            pthread_cond_wait(&g_q_cond, &g_q_mutex);
        if (g_worker_stop && g_q_count == 0) {
            pthread_mutex_unlock(&g_q_mutex);
            break;
        }
        WhJob job = g_queue[g_q_head];
        g_q_head = (g_q_head + 1) % WH_QUEUE_CAP;
        g_q_count--;
        pthread_mutex_unlock(&g_q_mutex);
        deliver_job(&job);
    }
    return NULL;
}

void webhook_init(void) {
    if (g_worker_started)
        return;
    webhook_metrics_sync_from_file();
    g_worker_stop = 0;
    if (pthread_create(&g_worker, NULL, webhook_worker, NULL) != 0) {
        fprintf(stderr, "[WEBHOOK] worker baslatilamadi — senkron mod\n");
        g_webhook.async_enabled = 0;
        return;
    }
    g_worker_started = 1;
    if (g_webhook.telegram_batch_sec > 0 && !g_batch_timer_started) {
        if (pthread_create(&g_batch_timer, NULL, batch_timer_thread, NULL) == 0)
            g_batch_timer_started = 1;
    }
}

void webhook_shutdown(void) {
    telegram_bot_stop();
    webhook_batch_flush();
    if (!g_worker_started)
        return;
    pthread_mutex_lock(&g_q_mutex);
    g_worker_stop = 1;
    pthread_cond_broadcast(&g_q_cond);
    pthread_mutex_unlock(&g_q_mutex);
    pthread_join(g_worker, NULL);
    g_worker_started = 0;
    if (g_batch_timer_started) {
        pthread_join(g_batch_timer, NULL);
        g_batch_timer_started = 0;
    }
}

void webhook_send_alert(const Alert *a) {
    if (!g_webhook.enabled) return;
    if (webhook_destinations_configured() == 0) return;
    if (!g_webhook_test_mode && (int)a->level < g_webhook.min_level) return;

    time_t now = time(NULL);
    if (!cooldown_check_and_set(a->ip, now)) return;

    if (alert_should_batch(a)) {
        pthread_mutex_lock(&g_batch_mutex);
        if (g_batch_deadline > 0 && now >= g_batch_deadline) {
            pthread_mutex_unlock(&g_batch_mutex);
            webhook_batch_flush();
            pthread_mutex_lock(&g_batch_mutex);
            now = time(NULL);
        }
        if (g_batch_total == 0)
            g_batch_deadline = now + g_webhook.telegram_batch_sec;
        if (batch_add_entry_unlocked(a) != 0) {
            pthread_mutex_unlock(&g_batch_mutex);
            webhook_batch_flush();
            pthread_mutex_lock(&g_batch_mutex);
            g_batch_deadline = time(NULL) + g_webhook.telegram_batch_sec;
            (void)batch_add_entry_unlocked(a);
        }
        pthread_mutex_unlock(&g_batch_mutex);
        return;
    }

    webhook_batch_flush();

    WhJob job = {0};
    job.kind = WH_JOB_ALERT;
    job.alert = *a;
    build_alert_messages(a, job.plain, sizeof(job.plain),
                         job.html, sizeof(job.html), &job.telegram_silent);
    dispatch_job(&job);
}

void webhook_send_ban(const char *ip, time_t ts, const char *reason,
                      double risk_score, const char *policy) {
    if (!g_webhook.enabled || webhook_destinations_configured() == 0) return;
    if (!ip || !ip[0]) return;

    webhook_batch_flush();

    const char *why = (reason && reason[0]) ? reason : "auto-ban";

    struct tm *tm_info = localtime(&ts);
    char tsbuf[32];
    strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M:%S", tm_info);

    char host[64];
    get_hostname_label(host, sizeof(host));
    char ip_e[96], why_e[ALERT_MSG_LEN * 2], host_e[128];
    char pol_e[64] = "";
    html_escape(ip, ip_e, sizeof(ip_e));
    html_escape(why, why_e, sizeof(why_e));
    html_escape(host, host_e, sizeof(host_e));
    if (policy && policy[0])
        html_escape(policy, pol_e, sizeof(pol_e));

    char risk_plain[48] = "";
    char risk_html[64] = "";
    if (risk_score >= 0.0) {
        snprintf(risk_plain, sizeof(risk_plain), "\nRisk: %.0f", risk_score);
        snprintf(risk_html, sizeof(risk_html),
                 "\nRisk: <code>%.0f</code>", risk_score);
        if (pol_e[0]) {
            char extra_p[32], extra_h[48];
            snprintf(extra_p, sizeof(extra_p), " · %s", policy);
            snprintf(extra_h, sizeof(extra_h), " · <code>%s</code>", pol_e);
            strncat(risk_plain, extra_p, sizeof(risk_plain) - strlen(risk_plain) - 1);
            strncat(risk_html, extra_h, sizeof(risk_html) - strlen(risk_html) - 1);
        }
    }

    WhJob job = {0};
    job.kind = WH_JOB_SIMPLE;
    job.telegram_silent = 0;
    job.color = 15158332u;
    strncpy(job.title, "IP BANLANDI", sizeof(job.title) - 1);

    snprintf(job.plain, sizeof(job.plain),
             "IP BANLANDI\nHost: %s\nIP: %s\nZaman: %s\nSebep: %s%s\n"
             "ipset block listesine eklendi.",
             host, ip, tsbuf, why, risk_plain);
    snprintf(job.html, sizeof(job.html),
             "\xf0\x9f\x94\xa8 <b>IP BANLANDI</b>\n\n"
             "Host: <code>%s</code>\nIP: <code>%s</code>\nZaman: %s\n"
             "Sebep: %s%s\nipset block listesine eklendi.",
             host_e, ip_e, tsbuf, why_e, risk_html);
    strncpy(job.ack_key, ip, sizeof(job.ack_key) - 1);
    dispatch_job(&job);
}

void webhook_send_trap(const char *file_path, time_t ts) {
    if (!g_webhook.enabled || webhook_destinations_configured() == 0) return;
    if (!file_path || !file_path[0]) return;

    webhook_batch_flush();

    struct tm *tm_info = localtime(&ts);
    char tsbuf[32];
    strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M:%S", tm_info);

    char host[64];
    get_hostname_label(host, sizeof(host));
    char path_e[512], host_e[128];
    html_escape(file_path, path_e, sizeof(path_e));
    html_escape(host, host_e, sizeof(host_e));

    WhJob job = {0};
    job.kind = WH_JOB_SIMPLE;
    job.telegram_silent = 0;
    job.color = 15158332u;
    strncpy(job.title, "KRITIK TUZAK ERISIMI", sizeof(job.title) - 1);

    snprintf(job.plain, sizeof(job.plain),
             "KRITIK TUZAK ERISIMI\nHost: %s\nDosya: %s\nZaman: %s\n"
             "Durum: Tuzak dosya acildi/erisildi.",
             host, file_path, tsbuf);
    snprintf(job.html, sizeof(job.html),
             "\xf0\x9f\x9a\xa8 <b>KRITIK TUZAK ERISIMI</b>\n\n"
             "Host: <code>%s</code>\nDosya: <code>%s</code>\nZaman: %s\n"
             "Durum: Tuzak dosya acildi/erisildi.",
             host_e, path_e, tsbuf);
    snprintf(job.ack_key, sizeof(job.ack_key), "trap:%.48s", file_path);
    dispatch_job(&job);
}

int webhook_send_test(const char *kind) {
    g_last_delivery.ok = 0;
    g_last_delivery.fail = 0;
    webhook_set_test_mode(1);

    time_t now = time(NULL);
    if (!kind || !kind[0] || strcmp(kind, "alert") == 0) {
        Alert a = {0};
        a.level = ALERT_WARN;
        a.ts = now;
        strncpy(a.ip, "203.0.113.1", sizeof(a.ip) - 1);
        strncpy(a.mitre_id, "T1190", sizeof(a.mitre_id) - 1);
        strncpy(a.mitre_tactic, "Initial Access", sizeof(a.mitre_tactic) - 1);
        strncpy(a.incident_id, "INC-test-webhook", sizeof(a.incident_id) - 1);
        strncpy(a.message, "Log Guardian webhook-test ping", sizeof(a.message) - 1);
        webhook_send_alert(&a);
        if (webhook_is_dry_run())
            fprintf(stderr,
                    "[WEBHOOK][FORMAT-V2] incident=INC-test-webhook host=ok\n");
    } else if (strcmp(kind, "ban") == 0) {
        webhook_send_ban("203.0.113.99", now, "WAF SQLi esigi asildi", 87.0, "ban");
    } else if (strcmp(kind, "trap") == 0) {
        webhook_send_trap("/var/www/html/.env", now);
    } else if (strcmp(kind, "batch") == 0) {
        if (g_webhook.telegram_batch_sec <= 0) {
            webhook_set_test_mode(0);
            return -1;
        }
        webhook_set_test_mode(0);
        const char *ips[] = {"203.0.113.10", "203.0.113.11", "203.0.113.10"};
        const char *msgs[] = {"SQLi denemesi", "Brute force", "SQLi tekrar"};
        for (int i = 0; i < 3; i++) {
            Alert a = {0};
            a.level = ALERT_WARN;
            a.ts = now;
            strncpy(a.ip, ips[i], sizeof(a.ip) - 1);
            strncpy(a.message, msgs[i], sizeof(a.message) - 1);
            webhook_send_alert(&a);
        }
        webhook_batch_flush();
        webhook_set_test_mode(0);
    } else {
        webhook_set_test_mode(0);
        return -1;
    }

    webhook_set_test_mode(0);
    return 0;
}
