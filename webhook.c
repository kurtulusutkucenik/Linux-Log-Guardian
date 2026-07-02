#include "webhook.h"
#include "telegram_bot.h"
#include "geoip_lookup.h"
#include "db.h"
#include "siem_forwarder.h"
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
    .quiet_hours_enabled = 0,
    .quiet_start_min = 0,
    .quiet_end_min = 0,
    .quiet_hours_spec = "",
    .telegram_alert_fmt = "",
    .generic_url        = "",
    .enabled            = 0,
    .min_level          = 2,
    .cooldown_sec       = 60,
    .async_enabled      = 1,
    .silent_info        = 1,
    .telegram_bot_enabled = 0,
    .operator_mute_sec    = 3600,
    .telegram_topic_waf   = 0,
    .telegram_topic_ban   = 0,
    .telegram_topic_trap  = 0,
    .telegram_topic_warn  = 0,
    .telegram_mirror_warn = 0,
    .dashboard_base_url   = "",
    .telegram_card_photo_url = "",
    .telegram_rich_card   = 0,
    .telegram_disable_preview = 1,
    .telegram_reply_chain = 0,
    .telegram_reply_chain_sec = 86400,
    .telegram_geoip       = 0,
    .telegram_pin_crit    = 0,
    .telegram_webhook_url    = "",
    .telegram_webhook_secret = "",
    .weekly_summary_enabled  = 0,
    .weekly_summary_wday     = 0,
    .weekly_summary_at_min   = 0,
    .weekly_summary_spec     = "",
};

typedef enum {
    WH_TG_TOPIC_NONE = 0,
    WH_TG_TOPIC_WAF,
    WH_TG_TOPIC_BAN,
    WH_TG_TOPIC_TRAP,
    WH_TG_TOPIC_WARN
} WhTelegramTopic;

#define COOLDOWN_TABLE_SIZE 64
#define WH_QUEUE_CAP        128
#define WH_BATCH_MAX_ENTRIES 16
#define WH_INCIDENT_DEDUP_SEC 60
#define WH_INCIDENT_DEDUP_SLOTS 32
#define TG_REPLY_CHAIN_SLOTS  96

typedef struct {
    char     incident_id[24];
    time_t   last_sent;
} WhIncidentDedup;

static WhIncidentDedup g_inc_dedup[WH_INCIDENT_DEDUP_SLOTS];
static pthread_mutex_t  g_inc_dedup_mutex = PTHREAD_MUTEX_INITIALIZER;

typedef struct {
    char   chat_id[24];
    int    thread_id;
    char   ip[46];
    long   message_id;
    time_t updated;
} TgReplyAnchor;

static TgReplyAnchor g_tg_reply[TG_REPLY_CHAIN_SLOTS];
static pthread_mutex_t g_tg_reply_mutex = PTHREAD_MUTEX_INITIALIZER;

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

/* Ayni IP icin kisa pencerede tek #ban (ja3_cluster + SQLi cift mesaj onleme) */
#define BAN_WEBHOOK_DEDUP_SEC 8
static struct {
    char   ip[46];
    time_t last_sent;
} g_ban_dedup_table[COOLDOWN_TABLE_SIZE];

static struct {
    char   ip[46];
    time_t mute_until;
} g_op_mute_table[COOLDOWN_TABLE_SIZE];

static pthread_mutex_t g_cooldown_mutex = PTHREAD_MUTEX_INITIALIZER;
static time_t g_webhook_mute_until = 0;
static int g_webhook_fail_streak = 0;
static int g_fail_operator_ping_sent = 0;
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

static void html_escape(const char *src, char *dst, size_t cap);

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

static char g_http_resp_body[384];

static size_t discard_response(void *ptr, size_t size, size_t nmemb, void *ud) {
    (void)ud;
    size_t n = size * nmemb;
    if (n == 0)
        return 0;
    size_t used = strnlen(g_http_resp_body, sizeof(g_http_resp_body) - 1);
    size_t room = sizeof(g_http_resp_body) - 1 - used;
    if (room > 0) {
        size_t copy = n < room ? n : room;
        memcpy(g_http_resp_body + used, ptr, copy);
        g_http_resp_body[used + copy] = '\0';
    }
    return n;
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

void webhook_metrics_reset(int fail_only)
{
    pthread_mutex_lock(&g_metric_store_mutex);
    long s = 0, f = 0, d = 0;
    metrics_read_unlocked(&s, &f, &d);
    f = 0;
    if (!fail_only) {
        s = 0;
        d = 0;
    }
    metrics_write_unlocked(s, f, d);
    atomic_store(&g_metric_sent, s);
    atomic_store(&g_metric_fail, f);
    atomic_store(&g_metric_drops, d);
    pthread_mutex_unlock(&g_metric_store_mutex);
}

static void trim_chat_token(char *id)
{
    if (!id || !id[0])
        return;
    char *p = id;
    if ((unsigned char)p[0] == 0xEF && (unsigned char)p[1] == 0xBB &&
        (unsigned char)p[2] == 0xBF)
        p += 3;
    while (*p == ' ' || *p == '\t' || *p == '\r' || *p == '\n')
        p++;
    if (p != id)
        memmove(id, p, strlen(p) + 1);
    size_t n = strlen(id);
    while (n > 0 && (id[n - 1] == ' ' || id[n - 1] == '\t' ||
                     id[n - 1] == '\r' || id[n - 1] == '\n'))
        id[--n] = '\0';
    if (n >= 2 && id[0] == '"' && id[n - 1] == '"') {
        id[n - 1] = '\0';
        memmove(id, id + 1, n - 1);
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
        trim_chat_token(g_webhook.telegram_chats[g_webhook.telegram_chat_count]);
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
        trim_chat_token(ids[*count]);
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

void webhook_set_telegram_topics(int waf, int ban, int trap, int warn)
{
    if (waf > 0)
        g_webhook.telegram_topic_waf = waf;
    if (ban > 0)
        g_webhook.telegram_topic_ban = ban;
    if (trap > 0)
        g_webhook.telegram_topic_trap = trap;
    if (warn > 0) {
        g_webhook.telegram_topic_warn = warn;
        g_webhook.telegram_mirror_warn = 1;
    }
}

int webhook_telegram_mirror_warn_enabled(void)
{
    return g_webhook.telegram_mirror_warn &&
           g_webhook.telegram_topic_warn > 0 ? 1 : 0;
}

void webhook_telegram_topics_line(char *buf, size_t cap)
{
    if (!buf || cap < 8) {
        if (buf && cap > 0)
            buf[0] = '\0';
        return;
    }
    if (!g_webhook.telegram_topic_waf && !g_webhook.telegram_topic_ban &&
        !g_webhook.telegram_topic_trap && !g_webhook.telegram_topic_warn) {
        buf[0] = '\0';
        return;
    }
    snprintf(buf, cap, "Topics: waf=%d ban=%d trap=%d warn=%d",
             g_webhook.telegram_topic_waf, g_webhook.telegram_topic_ban,
             g_webhook.telegram_topic_trap, g_webhook.telegram_topic_warn);
}

static int telegram_topic_thread_id(const char *chat_id, WhTelegramTopic topic)
{
    if (topic == WH_TG_TOPIC_NONE || !chat_id || !chat_id[0])
        return 0;

    int thread = 0;
    switch (topic) {
    case WH_TG_TOPIC_WAF:
        thread = g_webhook.telegram_topic_waf;
        break;
    case WH_TG_TOPIC_BAN:
        thread = g_webhook.telegram_topic_ban;
        break;
    case WH_TG_TOPIC_TRAP:
        thread = g_webhook.telegram_topic_trap;
        break;
    case WH_TG_TOPIC_WARN:
        thread = g_webhook.telegram_topic_warn;
        break;
    default:
        return 0;
    }
    if (thread <= 0)
        return 0;

    /* Forum topic yalnizca CRIT kanal hedefinde (operator DM'de gecersiz). */
    if (g_webhook.telegram_route_by_level &&
        !chat_in_list(chat_id, g_webhook.telegram_chats_crit,
                      g_webhook.telegram_chat_crit_count))
        return 0;

    return thread;
}

static void trim_trailing_slash(char *s)
{
    if (!s || !s[0])
        return;
    size_t n = strlen(s);
    while (n > 0 && s[n - 1] == '/')
        s[--n] = '\0';
}

void webhook_set_dashboard_base_url(const char *url)
{
    g_webhook.dashboard_base_url[0] = '\0';
    if (!url || !url[0])
        return;
    strncpy(g_webhook.dashboard_base_url, url,
            sizeof(g_webhook.dashboard_base_url) - 1);
    g_webhook.dashboard_base_url[sizeof(g_webhook.dashboard_base_url) - 1] = '\0';
    trim_trailing_slash(g_webhook.dashboard_base_url);
}

void webhook_set_telegram_card_photo_url(const char *url)
{
    g_webhook.telegram_card_photo_url[0] = '\0';
    if (!url || !url[0])
        return;
    strncpy(g_webhook.telegram_card_photo_url, url,
            sizeof(g_webhook.telegram_card_photo_url) - 1);
    g_webhook.telegram_card_photo_url[sizeof(g_webhook.telegram_card_photo_url) - 1] =
        '\0';
}

int webhook_telegram_rich_card_enabled(void)
{
    return g_webhook.telegram_rich_card ? 1 : 0;
}

int webhook_telegram_disable_preview_enabled(void)
{
    return g_webhook.telegram_disable_preview ? 1 : 0;
}

int webhook_telegram_reply_chain_enabled(void)
{
    return g_webhook.telegram_reply_chain ? 1 : 0;
}

int webhook_telegram_geoip_enabled(void)
{
    return g_webhook.telegram_geoip ? 1 : 0;
}

int webhook_telegram_pin_crit_enabled(void)
{
    return g_webhook.telegram_pin_crit ? 1 : 0;
}

const char *webhook_dashboard_base_url(void)
{
    return g_webhook.dashboard_base_url;
}

int webhook_build_incident_url(const char *incident_id, char *out, size_t cap)
{
    if (!out || cap < 8 || !g_webhook.dashboard_base_url[0])
        return -1;
    if (!incident_id || !incident_id[0])
        return -1;
    int n = snprintf(out, cap, "%s/incidents/%s",
                     g_webhook.dashboard_base_url, incident_id);
    return (n > 0 && (size_t)n < cap) ? 0 : -1;
}

int webhook_build_ban_url(const char *ip, char *out, size_t cap)
{
    if (!out || cap < 8 || !g_webhook.dashboard_base_url[0])
        return -1;
    if (!ip || !ip[0])
        return -1;
    int n = snprintf(out, cap, "%s/?ip=%s", g_webhook.dashboard_base_url, ip);
    return (n > 0 && (size_t)n < cap) ? 0 : -1;
}

int webhook_build_trap_url(char *out, size_t cap)
{
    if (!out || cap < 8 || !g_webhook.dashboard_base_url[0])
        return -1;
    int n = snprintf(out, cap, "%s/?view=traps", g_webhook.dashboard_base_url);
    return (n > 0 && (size_t)n < cap) ? 0 : -1;
}

void webhook_set_telegram_webhook_url(const char *url)
{
    g_webhook.telegram_webhook_url[0] = '\0';
    if (!url || !url[0])
        return;
    strncpy(g_webhook.telegram_webhook_url, url,
            sizeof(g_webhook.telegram_webhook_url) - 1);
    g_webhook.telegram_webhook_url[sizeof(g_webhook.telegram_webhook_url) - 1] = '\0';
}

void webhook_set_telegram_webhook_secret(const char *secret)
{
    g_webhook.telegram_webhook_secret[0] = '\0';
    if (!secret || !secret[0])
        return;
    strncpy(g_webhook.telegram_webhook_secret, secret,
            sizeof(g_webhook.telegram_webhook_secret) - 1);
    g_webhook.telegram_webhook_secret[sizeof(g_webhook.telegram_webhook_secret) - 1] = '\0';
}

int webhook_telegram_webhook_enabled(void)
{
    return g_webhook.telegram_webhook_url[0] ? 1 : 0;
}

const char *webhook_telegram_webhook_url(void)
{
    return g_webhook.telegram_webhook_url;
}

const char *webhook_telegram_webhook_secret(void)
{
    return g_webhook.telegram_webhook_secret;
}

static void append_dashboard_link_html(char *html, size_t html_sz,
                                       const char *url)
{
    if (!html || html_sz < 32 || !url || !url[0])
        return;
    if (!g_webhook.telegram_rich_card || !g_webhook.dashboard_base_url[0])
        return;

    char url_e[512];
    html_escape(url, url_e, sizeof(url_e));
    size_t used = strlen(html);
    if (used + 64 >= html_sz)
        return;
    snprintf(html + used, html_sz - used,
             "\n<a href=\"%s\">\u2192 Dashboard</a>", url_e);
}

static void append_dashboard_link_plain(char *plain, size_t plain_sz,
                                        const char *url)
{
    if (!plain || plain_sz < 32 || !url || !url[0])
        return;
    if (!g_webhook.telegram_rich_card || !g_webhook.dashboard_base_url[0])
        return;

    size_t used = strlen(plain);
    if (used + 64 >= plain_sz)
        return;
    snprintf(plain + used, plain_sz - used, "\nDashboard: %s", url);
}

static int parse_hhmm_min(const char *s, int *out_min)
{
    if (!s || !out_min)
        return -1;
    int h = 0, m = 0;
    if (sscanf(s, "%d:%d", &h, &m) != 2)
        return -1;
    if (h < 0 || h > 23 || m < 0 || m > 59)
        return -1;
    *out_min = h * 60 + m;
    return 0;
}

void webhook_set_quiet_hours(const char *spec)
{
    g_webhook.quiet_hours_enabled = 0;
    g_webhook.quiet_start_min = 0;
    g_webhook.quiet_end_min = 0;
    g_webhook.quiet_hours_spec[0] = '\0';
    if (!spec || !spec[0])
        return;

    char buf[32];
    strncpy(buf, spec, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';
    for (char *p = buf; *p; p++) {
        if (*p == ' ')
            *p = '\0';
    }

    char *dash = strchr(buf, '-');
    if (!dash)
        return;

    char endpart[8];
    strncpy(endpart, dash + 1, sizeof(endpart) - 1);
    endpart[sizeof(endpart) - 1] = '\0';
    *dash = '\0';

    int start = 0, end = 0;
    if (parse_hhmm_min(buf, &start) != 0 || parse_hhmm_min(endpart, &end) != 0)
        return;

    g_webhook.quiet_start_min = start;
    g_webhook.quiet_end_min = end;
    g_webhook.quiet_hours_enabled = 1;
    snprintf(g_webhook.quiet_hours_spec, sizeof(g_webhook.quiet_hours_spec),
             "%s-%s", buf, endpart);
}

int webhook_quiet_hours_enabled(void)
{
    return g_webhook.quiet_hours_enabled ? 1 : 0;
}

const char *webhook_quiet_hours_spec(void)
{
    return g_webhook.quiet_hours_spec;
}

int webhook_quiet_hours_active(void)
{
    if (!g_webhook.quiet_hours_enabled || g_webhook_test_mode)
        return 0;

    time_t now = time(NULL);
    struct tm *tm = localtime(&now);
    if (!tm)
        return 0;
    int cur = tm->tm_hour * 60 + tm->tm_min;
    int s = g_webhook.quiet_start_min;
    int e = g_webhook.quiet_end_min;

    if (s == e)
        return 1;
    if (s < e)
        return cur >= s && cur < e;
    return cur >= s || cur < e;
}

void webhook_set_daily_summary(const char *hhmm)
{
    g_webhook.daily_summary_enabled = 0;
    g_webhook.daily_summary_at_min = 0;
    g_webhook.daily_summary_spec[0] = '\0';
    if (!hhmm || !hhmm[0])
        return;

    char buf[16];
    strncpy(buf, hhmm, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';
    for (char *p = buf; *p; p++) {
        if (*p == ' ')
            *p = '\0';
    }

    int at = 0;
    if (parse_hhmm_min(buf, &at) != 0)
        return;

    g_webhook.daily_summary_at_min = at;
    g_webhook.daily_summary_enabled = 1;
    snprintf(g_webhook.daily_summary_spec, sizeof(g_webhook.daily_summary_spec),
             "%s", buf);
}

int webhook_daily_summary_enabled(void)
{
    return g_webhook.daily_summary_enabled ? 1 : 0;
}

const char *webhook_daily_summary_spec(void)
{
    return g_webhook.daily_summary_spec;
}

static const char *daily_summary_state_path(void)
{
    const char *p = getenv("LOGANALYZER_DAILY_SUMMARY_STATE");
    if (p && p[0])
        return p;
    return "/var/lib/log-guardian/daily_summary.last";
}

static int daily_summary_ymd(time_t now, int *ymd_out)
{
    struct tm *tm = localtime(&now);
    if (!tm || !ymd_out)
        return -1;
    *ymd_out = (tm->tm_year + 1900) * 10000 + (tm->tm_mon + 1) * 100 + tm->tm_mday;
    return 0;
}

static int daily_summary_already_sent(int ymd)
{
    FILE *fp = fopen(daily_summary_state_path(), "r");
    if (!fp)
        return 0;
    int stored = 0;
    if (fscanf(fp, "%d", &stored) == 1 && stored == ymd) {
        fclose(fp);
        return 1;
    }
    fclose(fp);
    return 0;
}

static void daily_summary_mark_sent(int ymd)
{
    FILE *fp = fopen(daily_summary_state_path(), "w");
    if (!fp)
        return;
    fprintf(fp, "%d\n", ymd);
    fclose(fp);
}

static int parse_weekday_token(const char *tok, int *wday_out)
{
    if (!tok || !tok[0] || !wday_out)
        return -1;
    if (tok[0] >= '0' && tok[0] <= '6' && tok[1] == '\0') {
        *wday_out = tok[0] - '0';
        return 0;
    }
    static const struct {
        const char *name;
        int wday;
    } map[] = {
        {"sun", 0}, {"pazar", 0}, {"paz", 0},
        {"mon", 1}, {"pazartesi", 1}, {"pzt", 1},
        {"tue", 2}, {"sali", 2}, {"sal", 2},
        {"wed", 3}, {"carsamba", 3}, {"car", 3},
        {"thu", 4}, {"persembe", 4}, {"per", 4},
        {"fri", 5}, {"cuma", 5}, {"cum", 5},
        {"sat", 6}, {"cumartesi", 6}, {"cmt", 6},
        {NULL, -1}
    };
    for (int i = 0; map[i].name; i++) {
        if (strcasecmp(tok, map[i].name) == 0) {
            *wday_out = map[i].wday;
            return 0;
        }
    }
    return -1;
}

void webhook_set_weekly_summary(const char *spec)
{
    g_webhook.weekly_summary_enabled = 0;
    g_webhook.weekly_summary_wday = 0;
    g_webhook.weekly_summary_at_min = 0;
    g_webhook.weekly_summary_spec[0] = '\0';
    if (!spec || !spec[0])
        return;

    char buf[24];
    strncpy(buf, spec, sizeof(buf) - 1);
    buf[sizeof(buf) - 1] = '\0';
    for (char *p = buf; *p; p++) {
        if (*p == ' ')
            *p = '\0';
    }

    char *colon = strchr(buf, ':');
    if (!colon)
        return;
    *colon = '\0';
    const char *timepart = colon + 1;

    int wday = 0;
    int at = 0;
    if (parse_weekday_token(buf, &wday) != 0)
        return;
    if (parse_hhmm_min(timepart, &at) != 0)
        return;

    g_webhook.weekly_summary_wday = wday;
    g_webhook.weekly_summary_at_min = at;
    g_webhook.weekly_summary_enabled = 1;
    snprintf(g_webhook.weekly_summary_spec, sizeof(g_webhook.weekly_summary_spec),
             "%s:%s", buf, timepart);
}

int webhook_weekly_summary_enabled(void)
{
    return g_webhook.weekly_summary_enabled ? 1 : 0;
}

const char *webhook_weekly_summary_spec(void)
{
    return g_webhook.weekly_summary_spec;
}

static const char *weekly_summary_state_path(void)
{
    const char *p = getenv("LOGANALYZER_WEEKLY_SUMMARY_STATE");
    if (p && p[0])
        return p;
    return "/var/lib/log-guardian/weekly_summary.last";
}

static int weekly_summary_yw(time_t now, int *yw_out)
{
    struct tm tm_buf;
    struct tm *tm = localtime_r(&now, &tm_buf);
    if (!tm || !yw_out)
        return -1;
    char buf[8];
    if (strftime(buf, sizeof(buf), "%G%V", tm) == 0)
        return -1;
    *yw_out = atoi(buf);
    return *yw_out > 0 ? 0 : -1;
}

static int weekly_summary_already_sent(int yw)
{
    FILE *fp = fopen(weekly_summary_state_path(), "r");
    if (!fp)
        return 0;
    int stored = 0;
    if (fscanf(fp, "%d", &stored) == 1 && stored == yw) {
        fclose(fp);
        return 1;
    }
    fclose(fp);
    return 0;
}

static void weekly_summary_mark_sent(int yw)
{
    FILE *fp = fopen(weekly_summary_state_path(), "w");
    if (!fp)
        return;
    fprintf(fp, "%d\n", yw);
    fclose(fp);
}

static int incident_dedup_should_send(const Alert *a)
{
    if (!a || !a->incident_id[0] || g_webhook_test_mode)
        return 1;

    time_t now = time(NULL);
    pthread_mutex_lock(&g_inc_dedup_mutex);
    int slot = -1;
    for (int i = 0; i < WH_INCIDENT_DEDUP_SLOTS; i++) {
        if (g_inc_dedup[i].incident_id[0] &&
            strcmp(g_inc_dedup[i].incident_id, a->incident_id) == 0) {
            if (now - g_inc_dedup[i].last_sent < WH_INCIDENT_DEDUP_SEC) {
                pthread_mutex_unlock(&g_inc_dedup_mutex);
                return 0;
            }
            slot = i;
            break;
        }
        if (slot < 0 && !g_inc_dedup[i].incident_id[0])
            slot = i;
    }
    if (slot < 0)
        slot = (int)(now % WH_INCIDENT_DEDUP_SLOTS);

    strncpy(g_inc_dedup[slot].incident_id, a->incident_id,
            sizeof(g_inc_dedup[slot].incident_id) - 1);
    g_inc_dedup[slot].incident_id[sizeof(g_inc_dedup[slot].incident_id) - 1] = '\0';
    g_inc_dedup[slot].last_sent = now;
    pthread_mutex_unlock(&g_inc_dedup_mutex);
    return 1;
}

static int telegram_has_any_chat(void) {
    return g_webhook.telegram_chat_count > 0 ||
           g_webhook.telegram_chat_crit_count > 0 ||
           g_webhook.telegram_chat_warn_count > 0;
}

static void telegram_route_targets(int alert_level, int force_crit,
                                   char ids[][64], int *count,
                                   int crit_channel_ok) {
    *count = 0;

    if (webhook_quiet_hours_active() && !crit_channel_ok) {
        if (force_crit || alert_level >= ALERT_CRIT) {
            force_crit = 0;
            if (alert_level >= ALERT_CRIT)
                alert_level = ALERT_WARN;
        }
    }

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
    if (g_webhook.generic_url[0]) n++;
    return n;
}

void webhook_status_json(FILE *out, long ack_24h, long unacked_24h) {
    long qd = 0;
    webhook_metrics_snapshot(NULL, NULL, NULL, &qd);
    fprintf(out,
            "\"notifications\":{\"enabled\":%s,\"dry_run\":%s,"
            "\"telegram\":%s,\"telegram_chats\":%d,\"generic\":%s,"
            "\"destinations\":%d,\"min_level\":%d,\"cooldown_sec\":%d,"
            "\"async\":%s,\"silent_info\":%s,\"telegram_bot\":%s,"
            "\"telegram_route\":%s,\"telegram_batch_sec\":%d,"
            "\"telegram_topic_waf\":%d,\"telegram_topic_ban\":%d,"
            "\"telegram_topic_trap\":%d,\"telegram_topic_warn\":%d,"
            "\"telegram_mirror_warn\":%s,"
            "\"telegram_rich_card\":%s,\"telegram_disable_preview\":%s,"
            "\"dashboard_base\":%s,"
            "\"quiet_hours\":%s,\"quiet_active\":%s,\"queue_depth\":%ld,"
            "\"ack_24h\":%ld,\"unacked_24h\":%ld}",
            g_webhook.enabled ? "true" : "false",
            webhook_is_dry_run() ? "true" : "false",
            (g_webhook.token[0] && telegram_has_any_chat()) ? "true" : "false",
            g_webhook.telegram_chat_count,
            g_webhook.generic_url[0] ? "true" : "false",
            webhook_destinations_configured(),
            g_webhook.min_level,
            g_webhook.cooldown_sec,
            g_webhook.async_enabled ? "true" : "false",
            g_webhook.silent_info ? "true" : "false",
            g_webhook.telegram_bot_enabled ? "true" : "false",
            g_webhook.telegram_route_by_level ? "true" : "false",
            g_webhook.telegram_batch_sec,
            g_webhook.telegram_topic_waf,
            g_webhook.telegram_topic_ban,
            g_webhook.telegram_topic_trap,
            g_webhook.telegram_topic_warn,
            g_webhook.telegram_mirror_warn ? "true" : "false",
            g_webhook.telegram_rich_card ? "true" : "false",
            g_webhook.telegram_disable_preview ? "true" : "false",
            g_webhook.dashboard_base_url[0] ? "true" : "false",
            g_webhook.quiet_hours_enabled ? "true" : "false",
            webhook_quiet_hours_active() ? "true" : "false",
            qd,
            ack_24h, unacked_24h);
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

static unsigned int cooldown_hash_slot(const char *ip, unsigned int i)
{
    unsigned int h = 0;
    for (const char *c = ip; *c; c++)
        h = h * 31 + (unsigned char)*c;
    return (h + i) % COOLDOWN_TABLE_SIZE;
}

static int ban_webhook_dedup_check(const char *ip, time_t now)
{
    if (g_webhook_test_mode || !ip || !ip[0])
        return 1;

    pthread_mutex_lock(&g_cooldown_mutex);
    unsigned int slot = 0;
    for (unsigned int i = 0; i < COOLDOWN_TABLE_SIZE; i++) {
        slot = cooldown_hash_slot(ip, i);
        if (g_ban_dedup_table[slot].ip[0] == '\0' ||
            strcmp(g_ban_dedup_table[slot].ip, ip) == 0)
            break;
    }

    if (g_ban_dedup_table[slot].ip[0] != '\0' &&
        strcmp(g_ban_dedup_table[slot].ip, ip) == 0 &&
        now - g_ban_dedup_table[slot].last_sent < BAN_WEBHOOK_DEDUP_SEC) {
        pthread_mutex_unlock(&g_cooldown_mutex);
        return 0;
    }

    memcpy(g_ban_dedup_table[slot].ip, ip, sizeof(g_ban_dedup_table[slot].ip) - 1);
    g_ban_dedup_table[slot].ip[sizeof(g_ban_dedup_table[slot].ip) - 1] = '\0';
    g_ban_dedup_table[slot].last_sent = now;
    pthread_mutex_unlock(&g_cooldown_mutex);
    return 1;
}

static int operator_mute_active(const char *ip, time_t now)
{
    if (!ip || !ip[0])
        return 0;
    pthread_mutex_lock(&g_cooldown_mutex);
    for (unsigned int i = 0; i < COOLDOWN_TABLE_SIZE; i++) {
        unsigned int slot = cooldown_hash_slot(ip, i);
        if (g_op_mute_table[slot].ip[0] == '\0')
            break;
        if (strcmp(g_op_mute_table[slot].ip, ip) == 0) {
            int active = g_op_mute_table[slot].mute_until > now;
            pthread_mutex_unlock(&g_cooldown_mutex);
            return active;
        }
    }
    pthread_mutex_unlock(&g_cooldown_mutex);
    return 0;
}

void webhook_operator_mute_ip(const char *ip, int sec)
{
    if (!ip || !ip[0])
        return;
    if (sec <= 0)
        sec = g_webhook.operator_mute_sec > 0 ? g_webhook.operator_mute_sec : 3600;
    time_t until = time(NULL) + (time_t)sec;

    pthread_mutex_lock(&g_cooldown_mutex);
    unsigned int slot = 0;
    for (unsigned int i = 0; i < COOLDOWN_TABLE_SIZE; i++) {
        slot = cooldown_hash_slot(ip, i);
        if (g_op_mute_table[slot].ip[0] == '\0' ||
            strcmp(g_op_mute_table[slot].ip, ip) == 0)
            break;
    }
    memcpy(g_op_mute_table[slot].ip, ip, sizeof(g_op_mute_table[slot].ip) - 1);
    g_op_mute_table[slot].ip[sizeof(g_op_mute_table[slot].ip) - 1] = '\0';
    g_op_mute_table[slot].mute_until = until;
    pthread_mutex_unlock(&g_cooldown_mutex);
}

void webhook_operator_unmute_ip(const char *ip)
{
    if (!ip || !ip[0])
        return;
    pthread_mutex_lock(&g_cooldown_mutex);
    for (unsigned int i = 0; i < COOLDOWN_TABLE_SIZE; i++) {
        unsigned int slot = cooldown_hash_slot(ip, i);
        if (g_op_mute_table[slot].ip[0] == '\0')
            break;
        if (strcmp(g_op_mute_table[slot].ip, ip) == 0) {
            g_op_mute_table[slot].ip[0] = '\0';
            g_op_mute_table[slot].mute_until = 0;
            break;
        }
    }
    pthread_mutex_unlock(&g_cooldown_mutex);
}

int webhook_operator_mute_sec(void)
{
    return g_webhook.operator_mute_sec > 0 ? g_webhook.operator_mute_sec : 3600;
}

static void json_append_str(char *dst, size_t cap, size_t *pos, const char *src) {
    for (; *src && *pos + 2 < cap; src++) {
        const char *esc = NULL;
        char ubuf[8];
        switch (*src) {
            case '"':
            case '\\':
                if (*pos + 2 < cap)
                    dst[(*pos)++] = '\\';
                if (*pos + 1 < cap)
                    dst[(*pos)++] = *src;
                continue;
            case '\n': esc = "\\n"; break;
            case '\r': esc = "\\r"; break;
            case '\t': esc = "\\t"; break;
            default:
                if ((unsigned char)*src < 0x20) {
                    snprintf(ubuf, sizeof(ubuf), "\\u%04x", (unsigned char)*src);
                    esc = ubuf;
                }
                break;
        }
        if (esc) {
            size_t el = strlen(esc);
            if (*pos + el >= cap)
                break;
            memcpy(dst + *pos, esc, el);
            *pos += el;
        } else if (*pos + 1 < cap) {
            dst[(*pos)++] = *src;
        }
    }
    dst[*pos] = '\0';
}

static void utf8_sanitize(char *s)
{
    if (!s)
        return;
    const unsigned char *rd = (const unsigned char *)s;
    unsigned char *wr = (unsigned char *)s;
    while (*rd) {
        unsigned char c = rd[0];
        int len = 1;
        if (c < 0x80) {
            *wr++ = c;
            rd++;
            continue;
        }
        if ((c & 0xE0) == 0xC0)
            len = 2;
        else if ((c & 0xF0) == 0xE0)
            len = 3;
        else if ((c & 0xF8) == 0xF0)
            len = 4;
        else {
            *wr++ = '?';
            rd++;
            continue;
        }
        int ok = 1;
        for (int i = 1; i < len; i++) {
            if (!rd[i] || (rd[i] & 0xC0) != 0x80) {
                ok = 0;
                break;
            }
        }
        if (ok) {
            for (int i = 0; i < len; i++)
                *wr++ = rd[i];
            rd += (size_t)len;
        } else {
            *wr++ = '?';
            rd++;
        }
    }
    *wr = '\0';
}

static int chat_id_is_numeric(const char *id)
{
    if (!id || !id[0])
        return 0;
    const char *p = id;
    if (*p == '-')
        p++;
    if (!*p)
        return 0;
    for (; *p; p++) {
        if (*p < '0' || *p > '9')
            return 0;
    }
    return 1;
}

static void json_append_chat_id(char *dst, size_t cap, size_t *pos, const char *chat_id)
{
    if (chat_id_is_numeric(chat_id)) {
        int n = snprintf(dst + *pos, cap - *pos, "\"chat_id\":%s", chat_id);
        if (n > 0)
            *pos += (size_t)n;
    } else {
        if (*pos + 12 >= cap)
            return;
        *pos += (size_t)snprintf(dst + *pos, cap - *pos, "\"chat_id\":\"");
        json_append_str(dst, cap, pos, chat_id);
        if (*pos + 1 < cap)
            dst[(*pos)++] = '"';
        dst[*pos] = '\0';
    }
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

static void prepend_message_badge(char *plain, size_t plain_sz,
                                  char *html, size_t html_sz)
{
    if (!webhook_is_dry_run() && !g_webhook_test_mode)
        return;

    char bp[48] = "";
    char bh[72] = "";
    if (webhook_is_dry_run()) {
        strncat(bp, "[DRY-RUN] ", sizeof(bp) - strlen(bp) - 1);
        strncat(bh, "<b>[DRY-RUN]</b> ", sizeof(bh) - strlen(bh) - 1);
    }
    if (g_webhook_test_mode) {
        strncat(bp, "[TEST] ", sizeof(bp) - strlen(bp) - 1);
        strncat(bh, "<b>[TEST]</b> ", sizeof(bh) - strlen(bh) - 1);
    }
    if (!bp[0])
        return;

    if (plain && plain_sz > 1 && plain[0]) {
        char tmp[1200];
        snprintf(tmp, sizeof(tmp), "%s%s", bp, plain);
        strncpy(plain, tmp, plain_sz - 1);
        plain[plain_sz - 1] = '\0';
    }
    if (html && html_sz > 1 && html[0]) {
        char tmp[1400];
        snprintf(tmp, sizeof(tmp), "%s%s", bh, html);
        strncpy(html, tmp, html_sz - 1);
        html[html_sz - 1] = '\0';
    }
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

static void note_http_result(CURLcode res, long http_code, const char *channel);

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
        g_http_resp_body[0] = '\0';

        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, discard_response);
        curl_easy_setopt(curl, CURLOPT_HEADERFUNCTION, curl_header_cb);
        curl_easy_setopt(curl, CURLOPT_HEADERDATA, &hdr);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 20L);
        curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 8L);
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

        if ((res == CURLE_OPERATION_TIMEDOUT || res == CURLE_COULDNT_CONNECT ||
             res == CURLE_COULDNT_RESOLVE_HOST) &&
            attempt < 3) {
            fprintf(stderr, "[WEBHOOK] %s ag hatasi — tekrar (%d/4): %s\n",
                    channel, attempt + 1, curl_easy_strerror(res));
            sleep((unsigned int)(2 + attempt * 2));
            continue;
        }

        note_http_result(res, hdr.http_code, channel);
        return -1;
    }
    return -1;
}

static const char *level_prefix_html(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return "\xf0\x9f\x9a\xa8 <b>KR\u0130T\u0130K ALARM</b>";
        case ALERT_WARN: return "\xe2\x9a\xa0\xef\xb8\x8f <b>UYARI</b>";
        case ALERT_INFO: return "\xf0\x9f\x94\xb5 <b>B\u0130LG\u0130</b>";
        default:         return "<b>ALARM</b>";
    }
}

static const char *level_prefix_plain(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return "KR\u0130T\u0130K ALARM";
        case ALERT_WARN: return "UYARI";
        case ALERT_INFO: return "B\u0130LG\u0130";
        default:         return "ALARM";
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

static void append_tmpl(char *out, size_t cap, size_t *pos, const char *s)
{
    if (!out || !pos || !s)
        return;
    while (*s && *pos + 1 < cap)
        out[(*pos)++] = *s++;
    out[*pos] = '\0';
}

static void expand_alert_fmt(const Alert *a, const char *tmpl,
                             char *out, size_t cap, int html)
{
    if (!out || cap == 0) {
        return;
    }
    out[0] = '\0';
    if (!tmpl || !tmpl[0] || !a) {
        return;
    }

    struct tm *tm_info = localtime(&a->ts);
    char tsbuf[32] = "?";
    if (tm_info)
        strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M:%S", tm_info);

    char host[64];
    get_hostname_label(host, sizeof(host));

    char ip_e[IP_STR_LEN * 2];
    char msg_e[ALERT_MSG_LEN * 2];
    char host_e[128];
    char mitre_buf[96] = "";
    char inc_buf[32] = "";
    html_escape(a->ip, ip_e, sizeof(ip_e));
    html_escape(a->message, msg_e, sizeof(msg_e));
    html_escape(host, host_e, sizeof(host_e));
    if (a->mitre_id[0])
        snprintf(mitre_buf, sizeof(mitre_buf), "%s (%s)",
                 a->mitre_id, a->mitre_tactic);
    if (a->incident_id[0])
        strncpy(inc_buf, a->incident_id, sizeof(inc_buf) - 1);

    size_t pos = 0;
    for (const char *p = tmpl; *p && pos + 1 < cap; ) {
        if (p[0] == '{' && strchr(p + 1, '}')) {
            const char *end = strchr(p + 1, '}');
            char tok[24];
            size_t tn = (size_t)(end - (p + 1));
            if (tn >= sizeof(tok))
                tn = sizeof(tok) - 1;
            memcpy(tok, p + 1, tn);
            tok[tn] = '\0';

            const char *val = NULL;
            if (strcmp(tok, "level") == 0)
                val = level_prefix_plain(a->level);
            else if (strcmp(tok, "host") == 0)
                val = html ? host_e : host;
            else if (strcmp(tok, "ip") == 0)
                val = html ? ip_e : a->ip;
            else if (strcmp(tok, "time") == 0)
                val = tsbuf;
            else if (strcmp(tok, "message") == 0)
                val = html ? msg_e : a->message;
            else if (strcmp(tok, "mitre") == 0)
                val = mitre_buf;
            else if (strcmp(tok, "incident") == 0)
                val = inc_buf;
            else if (strcmp(tok, "dashboard") == 0) {
                static char dash_buf[320];
                dash_buf[0] = '\0';
                if (inc_buf[0])
                    (void)webhook_build_incident_url(inc_buf, dash_buf,
                                                     sizeof(dash_buf));
                val = dash_buf;
            }
            else if (strcmp(tok, "geo") == 0) {
                static char geo_buf[32];
                geo_buf[0] = '\0';
                geoip_lookup_label(a->ip, geo_buf, sizeof(geo_buf));
                val = geo_buf[0] ? geo_buf : NULL;
            }
            else if (strcmp(tok, "country") == 0) {
                static char cc_buf[8];
                cc_buf[0] = '\0';
                if (geoip_lookup_country(a->ip, cc_buf, sizeof(cc_buf)))
                    val = cc_buf;
            }
            else if (strcmp(tok, "nl") == 0 || strcmp(tok, "newline") == 0)
                val = "\n";

            if (val)
                append_tmpl(out, cap, &pos, val);
            else
                append_tmpl(out, cap, &pos, p);
            p = end + 1;
            continue;
        }
        out[pos++] = *p++;
        out[pos] = '\0';
    }
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

    if (g_webhook.telegram_alert_fmt[0]) {
        expand_alert_fmt(a, g_webhook.telegram_alert_fmt, plain, plain_sz, 0);
        expand_alert_fmt(a, g_webhook.telegram_alert_fmt, html, html_sz, 1);
        if (plain[0]) {
            if (webhook_telegram_geoip_enabled() &&
                !strstr(g_webhook.telegram_alert_fmt, "{geo}") &&
                !strstr(g_webhook.telegram_alert_fmt, "{country}"))
                geoip_lookup_append_lines(a->ip, plain, plain_sz, html, html_sz);
            if (out_silent)
                *out_silent = telegram_silent_for_level(a->level);
            return;
        }
    }

    snprintf(plain, plain_sz,
             "[%s]\nHost: %s\nIP: %s\nZaman: %s%s%s\n\n%s",
             level_prefix_plain(a->level), host, a->ip, tsbuf,
             mitre_plain, inc_plain, a->message);
    snprintf(html, html_sz,
             "%s\n\nHost: <code>%s</code>\nIP: <code>%s</code>\nZaman: %s%s%s\n\n%s",
             level_prefix_html(a->level), host, ip_e, tsbuf,
             mitre_html, inc_html, msg_e);

    geoip_lookup_append_lines(a->ip, plain, plain_sz, html, html_sz);

    if (a->incident_id[0]) {
        char dash[320];
        if (webhook_build_incident_url(a->incident_id, dash, sizeof(dash)) == 0) {
            append_dashboard_link_html(html, html_sz, dash);
            append_dashboard_link_plain(plain, plain_sz, dash);
        }
    }

    if (out_silent) *out_silent = telegram_silent_for_level(a->level);
}

static const char *telegram_api_base(void) {
    const char *b = getenv("WEBHOOK_TELEGRAM_API_BASE");
    if (b && b[0]) return b;
    return "https://api.telegram.org";
}

static unsigned int tg_reply_slot_seed(const char *chat_id, int thread_id,
                                       const char *ip, unsigned int probe)
{
    unsigned int h = probe;
    for (const char *c = chat_id; c && *c; c++)
        h = h * 31u + (unsigned char)*c;
    h = h * 31u + (unsigned int)thread_id;
    for (const char *c = ip; c && *c; c++)
        h = h * 31u + (unsigned char)*c;
    return h % TG_REPLY_CHAIN_SLOTS;
}

static int tg_reply_slot_match(const TgReplyAnchor *slot, const char *chat_id,
                               int thread_id, const char *ip)
{
    return slot && slot->chat_id[0] && slot->ip[0] &&
           slot->thread_id == thread_id &&
           strcmp(slot->chat_id, chat_id) == 0 &&
           strcmp(slot->ip, ip) == 0;
}

static const char *tg_reply_chain_path(void)
{
    const char *p = getenv("LOGANALYZER_TELEGRAM_REPLY_CHAIN_FILE");
    if (p && p[0])
        return p;
    return "/var/lib/log-guardian/telegram_reply.chain";
}

static void tg_reply_persist_unlocked(void)
{
    char path[512];
    char tmp[560];
    snprintf(path, sizeof(path), "%s", tg_reply_chain_path());
    snprintf(tmp, sizeof(tmp), "%s.%d.tmp", path, (int)getpid());

    FILE *fp = fopen(tmp, "w");
    if (!fp)
        return;
    time_t now = time(NULL);
    int ttl = g_webhook.telegram_reply_chain_sec;
    if (ttl < 60)
        ttl = 60;

    for (int i = 0; i < TG_REPLY_CHAIN_SLOTS; i++) {
        TgReplyAnchor *a = &g_tg_reply[i];
        if (!a->chat_id[0] || !a->ip[0] || a->message_id <= 0)
            continue;
        if (now - a->updated > (time_t)ttl)
            continue;
        fprintf(fp, "%s\t%d\t%s\t%ld\t%ld\n",
                a->chat_id, a->thread_id, a->ip,
                a->message_id, (long)a->updated);
    }
    fclose(fp);
    (void)rename(tmp, path);
}

static void tg_reply_load(void)
{
    const char *path = tg_reply_chain_path();
    FILE *fp = fopen(path, "r");
    if (!fp)
        return;

    pthread_mutex_lock(&g_tg_reply_mutex);
    char line[256];
    while (fgets(line, sizeof(line), fp)) {
        char chat[24] = "";
        char ip[46] = "";
        int thread = 0;
        long mid = 0;
        long updated = 0;
        if (sscanf(line, "%23s\t%d\t%45s\t%ld\t%ld",
                   chat, &thread, ip, &mid, &updated) < 5)
            continue;
        if (!chat[0] || !ip[0] || mid <= 0)
            continue;

        unsigned int chosen = TG_REPLY_CHAIN_SLOTS;
        for (unsigned int i = 0; i < TG_REPLY_CHAIN_SLOTS; i++) {
            unsigned int slot = tg_reply_slot_seed(chat, thread, ip, i);
            TgReplyAnchor *a = &g_tg_reply[slot];
            if (tg_reply_slot_match(a, chat, thread, ip)) {
                chosen = slot;
                break;
            }
            if (chosen == TG_REPLY_CHAIN_SLOTS && !a->chat_id[0])
                chosen = slot;
        }
        if (chosen >= TG_REPLY_CHAIN_SLOTS)
            continue;
        TgReplyAnchor *a = &g_tg_reply[chosen];
        strncpy(a->chat_id, chat, sizeof(a->chat_id) - 1);
        a->thread_id = thread;
        strncpy(a->ip, ip, sizeof(a->ip) - 1);
        a->message_id = mid;
        a->updated = (time_t)updated;
    }
    pthread_mutex_unlock(&g_tg_reply_mutex);
    fclose(fp);
}

static long tg_reply_lookup(const char *chat_id, int thread_id, const char *ip)
{
    if (!g_webhook.telegram_reply_chain || !chat_id || !chat_id[0] ||
        !ip || !ip[0])
        return 0;

    time_t now = time(NULL);
    int ttl = g_webhook.telegram_reply_chain_sec;
    if (ttl < 60)
        ttl = 60;

    pthread_mutex_lock(&g_tg_reply_mutex);
    long mid = 0;
    for (unsigned int i = 0; i < TG_REPLY_CHAIN_SLOTS; i++) {
        unsigned int slot = tg_reply_slot_seed(chat_id, thread_id, ip, i);
        TgReplyAnchor *a = &g_tg_reply[slot];
        if (!tg_reply_slot_match(a, chat_id, thread_id, ip))
            continue;
        if (now - a->updated > (time_t)ttl) {
            a->chat_id[0] = '\0';
            continue;
        }
        mid = a->message_id;
        break;
    }
    pthread_mutex_unlock(&g_tg_reply_mutex);
    return mid;
}

static void tg_reply_store(const char *chat_id, int thread_id, const char *ip,
                           long message_id)
{
    if (!g_webhook.telegram_reply_chain || !chat_id || !chat_id[0] ||
        !ip || !ip[0] || message_id <= 0)
        return;

    time_t now = time(NULL);
    pthread_mutex_lock(&g_tg_reply_mutex);
    unsigned int chosen = TG_REPLY_CHAIN_SLOTS;
    for (unsigned int i = 0; i < TG_REPLY_CHAIN_SLOTS; i++) {
        unsigned int slot = tg_reply_slot_seed(chat_id, thread_id, ip, i);
        TgReplyAnchor *a = &g_tg_reply[slot];
        if (tg_reply_slot_match(a, chat_id, thread_id, ip)) {
            chosen = slot;
            break;
        }
        if (chosen == TG_REPLY_CHAIN_SLOTS && !a->chat_id[0])
            chosen = slot;
    }
    if (chosen < TG_REPLY_CHAIN_SLOTS) {
        TgReplyAnchor *a = &g_tg_reply[chosen];
        strncpy(a->chat_id, chat_id, sizeof(a->chat_id) - 1);
        a->chat_id[sizeof(a->chat_id) - 1] = '\0';
        a->thread_id = thread_id;
        strncpy(a->ip, ip, sizeof(a->ip) - 1);
        a->ip[sizeof(a->ip) - 1] = '\0';
        a->message_id = message_id;
        a->updated = now;
        tg_reply_persist_unlocked();
    }
    pthread_mutex_unlock(&g_tg_reply_mutex);
}

static int telegram_post_one_ex(const char *chat_id, const char *text, int silent,
                                const char *reply_markup_json,
                                const char *parse_mode,
                                int message_thread_id,
                                int disable_preview,
                                long reply_to_message_id) {
    if (!g_webhook.token[0] || !chat_id || !chat_id[0]) return 0;

    char url[640];
    snprintf(url, sizeof(url),
             "%s/bot%s/sendMessage", telegram_api_base(), g_webhook.token);

    char body[4096];
    size_t pos = 0;
    body[pos++] = '{';
    json_append_chat_id(body, sizeof(body), &pos, chat_id);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, ",\"text\":\"");
    json_append_str(body, sizeof(body), &pos, text);
    if (parse_mode && parse_mode[0]) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                "\",\"parse_mode\":\"%s\"", parse_mode);
    } else if (pos + 1 < sizeof(body)) {
        body[pos++] = '"';
        body[pos] = '\0';
    }
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            ",\"disable_notification\":%s",
                            silent ? "true" : "false");
    if (message_thread_id > 0) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"message_thread_id\":%d", message_thread_id);
    }
    if (disable_preview) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"disable_web_page_preview\":true");
    }
    if (reply_to_message_id > 0) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"reply_to_message_id\":%ld,"
                                "\"allow_sending_without_reply\":true",
                                reply_to_message_id);
    }
    if (reply_markup_json && reply_markup_json[0]) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"reply_markup\":%s", reply_markup_json);
    }
    if (pos + 2 < sizeof(body))
        body[pos++] = '}';
    body[pos] = '\0';

    return http_post_json_retry(url, body, "telegram");
}

static long parse_telegram_message_id(void)
{
    const char *p = strstr(g_http_resp_body, "\"message_id\":");
    if (!p)
        return 0;
    return strtol(p + 13, NULL, 10);
}

static int telegram_pin_one(const char *chat_id, long message_id, int message_thread_id)
{
    if (!g_webhook.telegram_pin_crit || !g_webhook.token[0] ||
        !chat_id || !chat_id[0] || message_id <= 0)
        return -1;
    /* Pin yalnizca grup/kanal (-100...); operator DM'de anlamsiz */
    if (chat_id[0] != '-')
        return 0;

    char url[640];
    snprintf(url, sizeof(url),
             "%s/bot%s/pinChatMessage", telegram_api_base(), g_webhook.token);

    char body[320];
    size_t pos = 0;
    body[pos++] = '{';
    json_append_chat_id(body, sizeof(body), &pos, chat_id);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            ",\"message_id\":%ld,\"disable_notification\":true",
                            message_id);
    if (message_thread_id > 0) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"message_thread_id\":%d", message_thread_id);
    }
    if (pos + 2 < sizeof(body))
        body[pos++] = '}';
    body[pos] = '\0';

    return http_post_json_retry(url, body, "telegram-pin");
}

static int telegram_post_photo_one_ex(const char *chat_id, const char *photo_url,
                                      const char *caption_html, int silent,
                                      const char *reply_markup_json,
                                      int message_thread_id,
                                      int disable_preview,
                                      long reply_to_message_id)
{
    if (!g_webhook.token[0] || !chat_id || !chat_id[0] || !photo_url || !photo_url[0])
        return -1;

    char url[640];
    snprintf(url, sizeof(url),
             "%s/bot%s/sendPhoto", telegram_api_base(), g_webhook.token);

    char body[4096];
    size_t pos = 0;
    body[pos++] = '{';
    json_append_chat_id(body, sizeof(body), &pos, chat_id);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, ",\"photo\":\"");
    json_append_str(body, sizeof(body), &pos, photo_url);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\",\"caption\":\"");
    json_append_str(body, sizeof(body), &pos, caption_html);
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            "\",\"parse_mode\":\"HTML\",\"disable_notification\":%s",
                            silent ? "true" : "false");
    if (message_thread_id > 0) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"message_thread_id\":%d", message_thread_id);
    }
    if (disable_preview) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"disable_web_page_preview\":true");
    }
    if (reply_to_message_id > 0) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"reply_to_message_id\":%ld,"
                                "\"allow_sending_without_reply\":true",
                                reply_to_message_id);
    }
    if (reply_markup_json && reply_markup_json[0]) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"reply_markup\":%s", reply_markup_json);
    }
    if (pos + 2 < sizeof(body))
        body[pos++] = '}';
    body[pos] = '\0';

    return http_post_json_retry(url, body, "telegram");
}

static int telegram_post_one(const char *chat_id, const char *text_html, int silent,
                             const char *reply_markup_json,
                             int message_thread_id, long reply_to,
                             long *out_mid) {
    int no_preview = g_webhook.telegram_disable_preview ? 1 : 0;
    int rc;
    if (g_webhook.telegram_rich_card && g_webhook.telegram_card_photo_url[0] &&
        text_html && text_html[0]) {
        rc = telegram_post_photo_one_ex(
            chat_id, g_webhook.telegram_card_photo_url, text_html, silent,
            reply_markup_json, message_thread_id, no_preview, reply_to);
        if (rc == 0) {
            if (out_mid)
                *out_mid = parse_telegram_message_id();
            return 0;
        }
    }
    rc = telegram_post_one_ex(chat_id, text_html, silent, reply_markup_json,
                              "HTML", message_thread_id, no_preview, reply_to);
    if (rc == 0 && out_mid)
        *out_mid = parse_telegram_message_id();
    return rc;
}

static int telegram_post_target(const char *chat_id, const char *text_html,
                                int silent, const char *reply_markup_json,
                                int thread, const char *reply_ip,
                                long *out_mid)
{
    long reply_to = 0;
    if (reply_ip && reply_ip[0])
        reply_to = tg_reply_lookup(chat_id, thread, reply_ip);
    long mid = 0;
    int rc = telegram_post_one(chat_id, text_html, silent, reply_markup_json,
                               thread, reply_to, &mid);
    if (rc == 0 && mid > 0 && reply_ip && reply_ip[0])
        tg_reply_store(chat_id, thread, reply_ip, mid);
    if (out_mid)
        *out_mid = mid;
    return rc;
}

static int telegram_post(const char *text_html, int silent,
                         const char *reply_markup_json,
                         int alert_level, int force_crit,
                         int crit_channel_ok, WhTelegramTopic topic,
                         const char *reply_ip) {
    char targets[WEBHOOK_MAX_TELEGRAM_CHATS][64];
    int n = 0;
    telegram_route_targets(alert_level, force_crit, targets, &n, crit_channel_ok);

    if (n == 0)
        return 0;

    int rc = 0;
    for (int i = 0; i < n; i++) {
        int tg_silent = silent;
        if (webhook_quiet_hours_active() && !crit_channel_ok)
            tg_silent = 1;
        int thread = telegram_topic_thread_id(targets[i], topic);
        long mid = 0;
        if (telegram_post_target(targets[i], text_html, tg_silent,
                                 reply_markup_json, thread, reply_ip, &mid) != 0)
            rc = -1;
        if (g_webhook.telegram_pin_crit &&
            alert_level >= ALERT_CRIT && !force_crit &&
            targets[i][0] == '-' && mid > 0)
            (void)telegram_pin_one(targets[i], mid, thread);
    }

    /* WARN: operator DM + Ops #uyari (cift bildirim) */
    if (!force_crit && alert_level == ALERT_WARN &&
        g_webhook.telegram_mirror_warn &&
        g_webhook.telegram_topic_warn > 0 &&
        g_webhook.telegram_route_by_level &&
        g_webhook.telegram_chat_crit_count > 0) {
        for (int i = 0; i < g_webhook.telegram_chat_crit_count; i++) {
            const char *crit = g_webhook.telegram_chats_crit[i];
            if (chat_in_list(crit, g_webhook.telegram_chats_warn,
                             g_webhook.telegram_chat_warn_count))
                continue;
            int tg_silent = silent;
            if (webhook_quiet_hours_active() && !crit_channel_ok)
                tg_silent = 1;
            long mid = 0;
            if (telegram_post_target(crit, text_html, tg_silent, reply_markup_json,
                                     g_webhook.telegram_topic_warn, reply_ip,
                                     &mid) != 0)
                rc = -1;
        }
    }

    return rc;
}

static const char *fail_operator_chat_id(void) {
    if (g_webhook.telegram_chat_warn_count > 0)
        return g_webhook.telegram_chats_warn[0];
    if (g_webhook.telegram_chat_count > 0)
        return g_webhook.telegram_chats[0];
    if (g_webhook.telegram_chat_crit_count > 0)
        return g_webhook.telegram_chats_crit[0];
    return NULL;
}

static int daily_summary_deliver(const char *html)
{
    const char *dm = fail_operator_chat_id();
    if (!dm)
        return -1;

    int rc = 0;
    if (telegram_post_one(dm, html, 0, NULL, 0, 0, NULL) != 0)
        rc = -1;

    if (g_webhook.telegram_route_by_level && g_webhook.telegram_chat_crit_count > 0) {
        for (int i = 0; i < g_webhook.telegram_chat_crit_count; i++) {
            const char *crit = g_webhook.telegram_chats_crit[i];
            if (chat_in_list(crit, g_webhook.telegram_chats_warn,
                             g_webhook.telegram_chat_warn_count))
                continue;
            if (telegram_post_one(crit, html, 0, NULL, 0, 0, NULL) != 0)
                rc = -1;
        }
    }
    return rc;
}

static void maybe_fail_operator_ping(void) {
    if (g_webhook_fail_streak < 3 || g_fail_operator_ping_sent)
        return;
    const char *chat = fail_operator_chat_id();
    if (!chat || !g_webhook.token[0])
        return;
    g_fail_operator_ping_sent = 1;
    (void)telegram_post_one(
        chat,
        "\xe2\x9a\xa0\xef\xb8\x8f <b>Telegram gonderim kopuk</b>\n\n"
        "Son 3 webhook denemesi basarisiz. Kanal/DM ve token kontrol edin.",
        0, NULL, 0, 0, NULL);
}

static void note_http_result(CURLcode res, long http_code, const char *channel) {
    if (res == CURLE_OK && http_code >= 200 && http_code < 300) {
        pthread_mutex_lock(&g_cooldown_mutex);
        g_webhook_fail_streak = 0;
        g_fail_operator_ping_sent = 0;
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
    int streak = g_webhook_fail_streak;
    pthread_mutex_unlock(&g_cooldown_mutex);
    if (streak >= 3 && strcmp(channel, "telegram") == 0)
        maybe_fail_operator_ping();
    if (res != CURLE_OK)
        fprintf(stderr, "[WEBHOOK] %s gonderilemedi: %s\n",
                channel, curl_easy_strerror(res));
    else {
        fprintf(stderr, "[WEBHOOK] %s HTTP %ld", channel, http_code);
        if (g_http_resp_body[0])
            fprintf(stderr, " — %s", g_http_resp_body);
        fputc('\n', stderr);
    }
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

static void deliver_job(const WhJob *job_in) {
    WhJob job = *job_in;
    prepend_message_badge(job.plain, sizeof(job.plain),
                          job.html, sizeof(job.html));

    char markup[1200] = "";
    const char *markup_ptr = NULL;
    char dash_url[320] = "";

    if (job.kind == WH_JOB_ALERT && job.alert.incident_id[0])
        (void)webhook_build_incident_url(job.alert.incident_id, dash_url,
                                         sizeof(dash_url));
    else if (job.kind == WH_JOB_SIMPLE) {
        if (strncmp(job.ack_key, "trap:", 5) == 0)
            (void)webhook_build_trap_url(dash_url, sizeof(dash_url));
        else if (job.ack_key[0])
            (void)webhook_build_ban_url(job.ack_key, dash_url, sizeof(dash_url));
    }

    if (telegram_bot_enabled()) {
        const char *key = NULL;
        const char *ip = NULL;
        if (job.kind == WH_JOB_ALERT && job.alert.level >= ALERT_WARN) {
            key = job.alert.incident_id[0] ? job.alert.incident_id
                                            : job.alert.ip;
            ip = job.alert.ip;
            if (job.alert.incident_id[0] &&
                strncmp(job.alert.incident_id, "BATCH-", 6) == 0)
                ip = NULL;
        } else if (job.kind == WH_JOB_SIMPLE && job.ack_key[0]) {
            key = job.ack_key;
            if (strncmp(job.ack_key, "trap:", 5) != 0)
                ip = job.ack_key;
        }
        if (key) {
            const char *du = dash_url[0] ? dash_url : NULL;
            telegram_bot_build_alert_markup(key, ip, du, markup, sizeof(markup));
            markup_ptr = markup;
        }
    }

    WhTelegramTopic topic = WH_TG_TOPIC_NONE;
    if (job.kind == WH_JOB_ALERT && job.alert.level >= ALERT_CRIT)
        topic = WH_TG_TOPIC_WAF;
    else if (strncmp(job.ack_key, "trap:", 5) == 0)
        topic = WH_TG_TOPIC_TRAP;
    else if (job.kind == WH_JOB_SIMPLE)
        topic = WH_TG_TOPIC_BAN;

    const char *chain_ip = NULL;
    if (job.kind == WH_JOB_ALERT && job.alert.ip[0])
        chain_ip = job.alert.ip;

    if (job.kind == WH_JOB_ALERT) {
        int crit_ok = !webhook_quiet_hours_active();
        (void)telegram_post(job.html, job.telegram_silent, markup_ptr,
                             job.alert.level, 0, crit_ok, topic, chain_ip);
    } else {
        int crit_ok = 1;
        if (webhook_quiet_hours_active() &&
            strncmp(job.ack_key, "trap:", 5) != 0)
            crit_ok = 0;
        (void)telegram_post(job.html, job.telegram_silent, markup_ptr,
                             ALERT_CRIT, 1, crit_ok, topic, NULL);
    }
    if (g_webhook.generic_url[0])
        (void)generic_post(job.plain);
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

    time_t now = time(NULL);
    char batch_id[32];
    snprintf(batch_id, sizeof(batch_id), "BATCH-%ld", (long)now);

    int warn_n = 0;
    int info_n = 0;
    for (int i = 0; i < entry_count; i++) {
        if ((int)entries[i].max_level >= ALERT_WARN)
            warn_n += entries[i].count;
        else
            info_n += entries[i].count;
    }

    WhJob job = {0};
    job.kind = WH_JOB_ALERT;
    job.alert.level = ALERT_WARN;
    job.alert.ts = now;
    strncpy(job.alert.incident_id, batch_id, sizeof(job.alert.incident_id) - 1);
    job.telegram_silent = telegram_silent_for_level(ALERT_WARN);
    if (entries[0].ip[0])
        strncpy(job.alert.ip, entries[0].ip, sizeof(job.alert.ip) - 1);

    size_t ppos = 0;
    size_t hpos = 0;
    ppos += (size_t)snprintf(
        job.plain + ppos, sizeof(job.plain) - ppos,
        "UYARI \u00d6ZET\u0130 (%ds \u00b7 %d olay \u00b7 %d IP)\n"
        "Host: %s\nWARN: %d  INFO: %d\n",
        g_webhook.telegram_batch_sec, total, entry_count, host,
        warn_n, info_n);
    hpos += (size_t)snprintf(
        job.html + hpos, sizeof(job.html) - hpos,
        "\xe2\x9a\xa0\xef\xb8\x8f <b>UYARI \u00d6ZET\u0130</b> (%ds \u00b7 %d olay \u00b7 %d IP)\n\n"
        "Host: <code>%s</code>\n"
        "WARN: <code>%d</code> \u00b7 INFO: <code>%d</code>\n",
        g_webhook.telegram_batch_sec, total, entry_count, host_e,
        warn_n, info_n);

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

    if (webhook_is_dry_run())
        fprintf(stderr,
                "[WEBHOOK][BATCH] id=%s total=%d unique_ips=%d warn=%d info=%d\n",
                batch_id, total, entry_count, warn_n, info_n);

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
    geoip_lookup_set_enabled(g_webhook.telegram_geoip);
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
    if (!incident_dedup_should_send(a)) return;

    time_t now = time(NULL);
    if (operator_mute_active(a->ip, now))
        return;
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
    if (!ip || !ip[0]) return;
    if (!ban_webhook_dedup_check(ip, ts > 0 ? ts : time(NULL)))
        return;

    const char *why = (reason && reason[0]) ? reason : "auto-ban";
    siem_forwarder_publish_ban(ip, ts > 0 ? ts : time(NULL), why, risk_score, policy);

    if (!g_webhook.enabled || webhook_destinations_configured() == 0) return;

    webhook_batch_flush();

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
    geoip_lookup_append_lines(ip, job.plain, sizeof(job.plain),
                              job.html, sizeof(job.html));
    {
        char dash[320];
        if (webhook_build_ban_url(ip, dash, sizeof(dash)) == 0) {
            append_dashboard_link_html(job.html, sizeof(job.html), dash);
            append_dashboard_link_plain(job.plain, sizeof(job.plain), dash);
        }
    }
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
    strncpy(job.title, "KR\u0130T\u0130K TUZAK ER\u0130\u015e\u0130M\u0130", sizeof(job.title) - 1);

    snprintf(job.plain, sizeof(job.plain),
             "KR\u0130T\u0130K TUZAK ER\u0130\u015e\u0130M\u0130\nHost: %s\nDosya: %s\nZaman: %s\n"
             "Durum: Tuzak dosya a\u00e7\u0131ld\u0131/eri\u015filidi.",
             host, file_path, tsbuf);
    snprintf(job.html, sizeof(job.html),
             "\xf0\x9f\x9a\xa8 <b>KR\u0130T\u0130K TUZAK ER\u0130\u015e\u0130M\u0130</b>\n\n"
             "Host: <code>%s</code>\nDosya: <code>%s</code>\nZaman: %s\n"
             "Durum: Tuzak dosya a\u00e7\u0131ld\u0131/eri\u015filidi.",
             host_e, path_e, tsbuf);
    {
        char dash[320];
        if (webhook_build_trap_url(dash, sizeof(dash)) == 0) {
            append_dashboard_link_html(job.html, sizeof(job.html), dash);
            append_dashboard_link_plain(job.plain, sizeof(job.plain), dash);
        }
    }
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
    } else if (strcmp(kind, "crit") == 0 || strcmp(kind, "alert-crit") == 0 ||
               strcmp(kind, "crit-chain") == 0) {
        if (g_webhook.telegram_reply_chain)
            tg_reply_load();
        const int chain_test = (kind && strcmp(kind, "crit-chain") == 0);
        for (int n = 0; n < (chain_test ? 2 : 1); n++) {
            Alert a = {0};
            a.level = ALERT_CRIT;
            a.ts = now + (time_t)n;
            strncpy(a.ip, "203.0.113.50", sizeof(a.ip) - 1);
            strncpy(a.mitre_id, "T1190", sizeof(a.mitre_id) - 1);
            strncpy(a.mitre_tactic, "Initial Access", sizeof(a.mitre_tactic) - 1);
            if (chain_test)
                snprintf(a.incident_id, sizeof(a.incident_id),
                         "INC-test-crit-%d", n + 1);
            else
                strncpy(a.incident_id, "INC-test-crit",
                        sizeof(a.incident_id) - 1);
            snprintf(a.message, sizeof(a.message),
                     chain_test
                         ? "Log Guardian CRIT chain test #%d"
                         : "Log Guardian CRIT test (pin)",
                     n + 1);
            webhook_send_alert(&a);
        }
    } else if (strcmp(kind, "ban") == 0) {
        webhook_send_ban("203.0.113.99", now, "WAF SQLi e\u015fi\u011fi a\u015f\u0131ld\u0131", 87.0, "ban");
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

int webhook_send_daily_summary(const char *db_path, int force_resend)
{
    if (!g_webhook.enabled || webhook_destinations_configured() == 0)
        return -1;
    if (!g_webhook.token[0])
        return -1;

    const char *chat = fail_operator_chat_id();
    if (!chat)
        return -1;

    time_t now = time(NULL);
    int ymd = 0;
    if (daily_summary_ymd(now, &ymd) != 0)
        return -1;
    if (!force_resend && daily_summary_already_sent(ymd))
        return 0;

    DbDailySummary ds;
    memset(&ds, 0, sizeof(ds));
    if (db_path && db_path[0])
        (void)db_daily_summary_path(db_path, now - 86400, &ds);

    long wh_sent = 0, wh_fail = 0;
    webhook_metrics_snapshot(&wh_sent, &wh_fail, NULL, NULL);

    char host[64];
    get_hostname_label(host, sizeof(host));
    utf8_sanitize(host);
    char host_e[128];
    html_escape(host, host_e, sizeof(host_e));

    struct tm *tm_info = localtime(&now);
    char tsbuf[32];
    strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M", tm_info);

    char html[1400];
    snprintf(html, sizeof(html),
             "\xf0\x9f\x93\x8a <b>G\u00fcnl\u00fck \u00d6zet</b> (son 24s)\n\n"
             "Host: <code>%s</code>\n"
             "Zaman: <code>%s</code>\n\n"
             "Alarm: <b>%ld</b> (Krit <code>%ld</code> / Uyari <code>%ld</code> / "
             "Info <code>%ld</code>)\n"
             "Ban: <code>%ld</code> yeni / <code>%ld</code> aktif\n"
             "Tuzak: <code>%ld</code>\n"
             "Ack: <code>%ld</code> / unacked: <code>%ld</code>\n"
             "Webhook: <code>%ld</code> ok / <code>%ld</code> fail",
             host_e, tsbuf,
             ds.alerts_total, ds.alerts_crit, ds.alerts_warn, ds.alerts_info,
             ds.bans_new, ds.bans_active, ds.traps,
             ds.acks, ds.unacked, wh_sent, wh_fail);
    utf8_sanitize(html);

    if (daily_summary_deliver(html) != 0)
        return -1;

    if (!force_resend)
        daily_summary_mark_sent(ymd);
    return 0;
}

void webhook_daily_summary_tick(const char *db_path)
{
    if (!webhook_daily_summary_enabled() || !g_webhook.enabled || g_webhook_test_mode)
        return;

    time_t now = time(NULL);
    struct tm *tm = localtime(&now);
    if (!tm)
        return;

    int ymd = 0;
    if (daily_summary_ymd(now, &ymd) != 0)
        return;
    if (daily_summary_already_sent(ymd))
        return;

    int now_min = tm->tm_hour * 60 + tm->tm_min;
    if (now_min < g_webhook.daily_summary_at_min)
        return;

    (void)webhook_send_daily_summary(db_path, 0);
}

int webhook_send_weekly_summary(const char *db_path, int force_resend)
{
    if (!g_webhook.enabled || webhook_destinations_configured() == 0)
        return -1;
    if (!g_webhook.token[0])
        return -1;

    const char *chat = fail_operator_chat_id();
    if (!chat)
        return -1;

    time_t now = time(NULL);
    int yw = 0;
    if (weekly_summary_yw(now, &yw) != 0)
        return -1;
    if (!force_resend && weekly_summary_already_sent(yw))
        return 0;

    DbDailySummary ds;
    memset(&ds, 0, sizeof(ds));
    if (db_path && db_path[0])
        (void)db_daily_summary_path(db_path, now - 7L * 86400L, &ds);

    long wh_sent = 0, wh_fail = 0;
    webhook_metrics_snapshot(&wh_sent, &wh_fail, NULL, NULL);

    char host[64];
    get_hostname_label(host, sizeof(host));
    utf8_sanitize(host);
    char host_e[128];
    html_escape(host, host_e, sizeof(host_e));

    struct tm tm_buf;
    struct tm *tm_info = localtime_r(&now, &tm_buf);
    char tsbuf[32];
    if (tm_info)
        strftime(tsbuf, sizeof(tsbuf), "%d.%m.%Y %H:%M", tm_info);
    else
        tsbuf[0] = '\0';

    char html[1500];
    snprintf(html, sizeof(html),
             "\xf0\x9f\x93\x88 <b>Haftal\u0131k \u00d6zet</b> (son 7 g\u00fcn)\n\n"
             "Host: <code>%s</code>\n"
             "Zaman: <code>%s</code>\n\n"
             "Alarm: <b>%ld</b> (Krit <code>%ld</code> / Uyari <code>%ld</code> / "
             "Info <code>%ld</code>)\n"
             "Ban: <code>%ld</code> yeni / <code>%ld</code> aktif\n"
             "Tuzak: <code>%ld</code>\n"
             "Ack: <code>%ld</code> / unacked: <code>%ld</code>\n"
             "Webhook: <code>%ld</code> ok / <code>%ld</code> fail",
             host_e, tsbuf,
             ds.alerts_total, ds.alerts_crit, ds.alerts_warn, ds.alerts_info,
             ds.bans_new, ds.bans_active, ds.traps,
             ds.acks, ds.unacked, wh_sent, wh_fail);
    utf8_sanitize(html);

    if (daily_summary_deliver(html) != 0)
        return -1;

    if (!force_resend)
        weekly_summary_mark_sent(yw);
    return 0;
}

void webhook_weekly_summary_tick(const char *db_path)
{
    if (!webhook_weekly_summary_enabled() || !g_webhook.enabled ||
        g_webhook_test_mode)
        return;

    time_t now = time(NULL);
    struct tm tm_buf;
    struct tm *tm = localtime_r(&now, &tm_buf);
    if (!tm)
        return;

    if (tm->tm_wday != g_webhook.weekly_summary_wday)
        return;

    int yw = 0;
    if (weekly_summary_yw(now, &yw) != 0)
        return;
    if (weekly_summary_already_sent(yw))
        return;

    int now_min = tm->tm_hour * 60 + tm->tm_min;
    if (now_min < g_webhook.weekly_summary_at_min)
        return;

    (void)webhook_send_weekly_summary(db_path, 0);
}
