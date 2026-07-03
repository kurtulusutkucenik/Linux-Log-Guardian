#include "telegram_bot.h"
#include "webhook.h"
#include "db.h"
#include "firewall.h"
#include "crypto_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <unistd.h>
#include <pthread.h>
#include <curl/curl.h>

static TelegramOpsStatusFn g_ops_status = NULL;
static TelegramAckFn         g_ack_hook = NULL;
static char                  g_ack_db_path[512] = "";
static TelegramInlineFn      g_inline_hook = NULL;
static TelegramLastFn        g_last_hook = NULL;
static TelegramUnackedFn     g_unacked_hook = NULL;
static TelegramIncidentFn    g_incident_hook = NULL;
static pthread_t           g_poll_thread;
static int                 g_poll_running = 0;
static int                 g_poll_stop = 0;
static long                g_update_offset = 0;

int telegram_bot_enabled(void) {
    return g_webhook.telegram_bot_enabled ? 1 : 0;
}

void telegram_bot_set_ops_status(TelegramOpsStatusFn fn) {
    g_ops_status = fn;
}

void telegram_bot_set_ack_hook(TelegramAckFn fn) {
    g_ack_hook = fn;
}

void telegram_bot_set_ack_db_path(const char *path) {
    g_ack_db_path[0] = '\0';
    if (path && path[0])
        strncpy(g_ack_db_path, path, sizeof(g_ack_db_path) - 1);
}

void telegram_bot_set_inline_hook(TelegramInlineFn fn) {
    g_inline_hook = fn;
}

void telegram_bot_set_last_hook(TelegramLastFn fn) {
    g_last_hook = fn;
}

void telegram_bot_set_unacked_hook(TelegramUnackedFn fn) {
    g_unacked_hook = fn;
}

void telegram_bot_set_incident_hook(TelegramIncidentFn fn) {
    g_incident_hook = fn;
}

void telegram_bot_build_ack_markup(const char *incident_or_ip,
                                   char *out, size_t cap) {
    telegram_bot_build_alert_markup(incident_or_ip, NULL, NULL, out, cap);
}

static void json_escape_cb(const char *src, char *dst, size_t cap)
{
    size_t j = 0;
    for (; src && *src && j + 2 < cap; src++) {
        if (*src == '"' || *src == '\\')
            dst[j++] = '\\';
        dst[j++] = *src;
    }
    dst[j] = '\0';
}

void telegram_bot_build_alert_markup(const char *ack_key, const char *ip,
                                     const char *dashboard_url,
                                     char *out, size_t cap)
{
    if (!out || cap < 32)
        return;

    char ack_cb[56] = "ack";
    if (ack_key && ack_key[0])
        snprintf(ack_cb, sizeof(ack_cb), "ack:%.48s", ack_key);
    char ack_esc[128];
    json_escape_cb(ack_cb, ack_esc, sizeof(ack_esc));

    char url_esc[512] = "";
    int have_url = 0;
    if (dashboard_url && dashboard_url[0] &&
        webhook_telegram_rich_card_enabled()) {
        json_escape_cb(dashboard_url, url_esc, sizeof(url_esc));
        have_url = url_esc[0] ? 1 : 0;
    }

    if (!ip || !ip[0]) {
        if (have_url) {
            snprintf(out, cap,
                     "{\"inline_keyboard\":[[{\"text\":\"\\u2705 G\\u00f6rd\\u00fcm\","
                     "\"callback_data\":\"%s\"}],"
                     "[{\"text\":\"\\ud83d\\udcca Dashboard\",\"url\":\"%s\"}]]}",
                     ack_esc, url_esc);
        } else {
            snprintf(out, cap,
                     "{\"inline_keyboard\":[[{\"text\":\"\\u2705 G\\u00f6rd\\u00fcm\","
                     "\"callback_data\":\"%s\"}]]}",
                     ack_esc);
        }
        return;
    }

    char ip_esc[64];
    json_escape_cb(ip, ip_esc, sizeof(ip_esc));
    if (have_url) {
        snprintf(out, cap,
                 "{\"inline_keyboard\":["
                 "[{\"text\":\"\\u2705 G\\u00f6rd\\u00fcm\",\"callback_data\":\"%s\"},"
                  "{\"text\":\"\\u2022 Sessiz\",\"callback_data\":\"mute:%s\"}],"
                 "[{\"text\":\"\\u2b50 WL\",\"callback_data\":\"wl:%s\"},"
                  "{\"text\":\"\\u2022 Unban\",\"callback_data\":\"ub:%s\"}],"
                 "[{\"text\":\"\\ud83d\\udd0a Sesi a\\u00e7\",\"callback_data\":\"undo:%s\"}],"
                 "[{\"text\":\"\\ud83d\\udcca Dashboard\",\"url\":\"%s\"}]]}",
                 ack_esc, ip_esc, ip_esc, ip_esc, ip_esc, url_esc);
    } else {
        snprintf(out, cap,
                 "{\"inline_keyboard\":["
                 "[{\"text\":\"\\u2705 G\\u00f6rd\\u00fcm\",\"callback_data\":\"%s\"},"
                  "{\"text\":\"\\u2022 Sessiz\",\"callback_data\":\"mute:%s\"}],"
                 "[{\"text\":\"\\u2b50 WL\",\"callback_data\":\"wl:%s\"},"
                  "{\"text\":\"\\u2022 Unban\",\"callback_data\":\"ub:%s\"}],"
                 "[{\"text\":\"\\ud83d\\udd0a Sesi a\\u00e7\",\"callback_data\":\"undo:%s\"}]"
                 "]}",
                 ack_esc, ip_esc, ip_esc, ip_esc, ip_esc);
    }
}

static const char *api_base(void) {
    const char *b = getenv("WEBHOOK_TELEGRAM_API_BASE");
    if (b && b[0]) return b;
    return "https://api.telegram.org";
}

static size_t write_mem(void *ptr, size_t size, size_t nmemb, void *ud) {
    size_t total = size * nmemb;
    char **buf = ud;
    size_t cur = *buf ? strlen(*buf) : 0;
    char *n = realloc(*buf, cur + total + 1);
    if (!n) return 0;
    memcpy(n + cur, ptr, total);
    n[cur + total] = '\0';
    *buf = n;
    return total;
}

static int tg_post_json(const char *method, const char *json_body, char **resp_out) {
    if (!g_webhook.token[0] || !method) return -1;
    char url[512];
    snprintf(url, sizeof(url), "%s/bot%s/%s", api_base(), g_webhook.token, method);

    CURL *curl = curl_easy_init();
    if (!curl) return -1;

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    char *resp = NULL;
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body ? json_body : "{}");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_mem);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 35L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 5L);
    curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);

    CURLcode res = curl_easy_perform(curl);
    long code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &code);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (resp_out) *resp_out = resp;
    else free(resp);

    return (res == CURLE_OK && code >= 200 && code < 300) ? 0 : -1;
}

static int chat_allowed(const char *chat_id) {
    return webhook_telegram_chat_allowed(chat_id);
}

static int chat_is_private(const char *chat_id) {
    /* Kanal/grup: -100... — komutlar sadece bot DM (pozitif id) */
    return chat_id && chat_id[0] && chat_id[0] != '-';
}

static void send_text(const char *chat_id, const char *text_html) {
    if (!chat_allowed(chat_id)) return;
    char body[4096];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\"chat_id\":\"");
    for (const char *s = chat_id; *s && pos + 2 < sizeof(body); s++) {
        if (*s == '"' || *s == '\\') body[pos++] = '\\';
        body[pos++] = *s;
    }
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            "\",\"text\":\"");
    for (const char *s = text_html; *s && pos + 2 < sizeof(body); s++) {
        if (*s == '"' || *s == '\\') body[pos++] = '\\';
        body[pos++] = *s;
    }
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\",\"parse_mode\":\"HTML\"");
    if (webhook_telegram_disable_preview_enabled()) {
        pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                                ",\"disable_web_page_preview\":true");
    }
    if (pos + 2 < sizeof(body))
        body[pos++] = '}';
    body[pos] = '\0';
    (void)tg_post_json("sendMessage", body, NULL);
}

static void handle_command(const char *chat_id, const char *text) {
    if (!chat_allowed(chat_id)) return;
    if (!chat_is_private(chat_id)) return;

    if (strncmp(text, "/status", 7) == 0) {
        char status[900] = "<b>Log Guardian Status</b>\n";
        if (g_ops_status) {
            char extra[700];
            extra[0] = '\0';
            g_ops_status(extra, sizeof(extra));
            strncat(status, extra, sizeof(status) - strlen(status) - 1);
        } else {
            strncat(status, "Ops callback yok.", sizeof(status) - strlen(status) - 1);
        }
        send_text(chat_id, status);
        return;
    }

    if (strncmp(text, "/bans", 5) == 0) {
        char msg[1200] = "<b>Son banlar (ipset)</b>\n<code>";
        int n = 0;
        FILE *jf = fopen("/run/log-guardian/active_bans.json", "r");
        if (jf) {
            char buf[2048];
            size_t nr = fread(buf, 1, sizeof(buf) - 1, jf);
            fclose(jf);
            buf[nr] = '\0';
            const char *p = strstr(buf, "\"ips\":[");
            if (p) {
                p += 7;
                while (*p && n < 8) {
                    while (*p == ' ' || *p == '\n') p++;
                    if (*p == ']') break;
                    if (*p == '"') {
                        p++;
                        char ip[64] = {0};
                        int i = 0;
                        while (*p && *p != '"' && i < 63)
                            ip[i++] = *p++;
                        if (ip[0]) {
                            strncat(msg, ip, sizeof(msg) - strlen(msg) - 2);
                            strncat(msg, "\n", sizeof(msg) - strlen(msg) - 1);
                            n++;
                        }
                    }
                    while (*p && *p != ',' && *p != ']') p++;
                    if (*p == ',') p++;
                }
            }
        }
        if (n == 0) {
            char ips[8][64];
            int got = ipset_list_v4_members(ips, 8, NULL);
            for (int i = 0; i < got && i < 8; i++) {
                strncat(msg, ips[i], sizeof(msg) - strlen(msg) - 2);
                strncat(msg, "\n", sizeof(msg) - strlen(msg) - 1);
                n++;
            }
        }
        if (n == 0)
            strncat(msg, "(bos)", sizeof(msg) - strlen(msg) - 1);
        strncat(msg, "</code>", sizeof(msg) - strlen(msg) - 1);
        send_text(chat_id, msg);
        return;
    }

    if (strncmp(text, "/ping", 5) == 0) {
        send_text(chat_id, "Log Guardian bot OK");
        return;
    }

    if (strncmp(text, "/last", 5) == 0) {
        char msg[1400] = "<b>Son alarmlar</b>\n";
        if (g_last_hook) {
            char body[1200];
            body[0] = '\0';
            g_last_hook(body, sizeof(body));
            strncat(msg, body, sizeof(msg) - strlen(msg) - 1);
        } else {
            strncat(msg, "Veri kaynagi yok.", sizeof(msg) - strlen(msg) - 1);
        }
        send_text(chat_id, msg);
        return;
    }

    if (strncmp(text, "/unacked", 8) == 0) {
        char msg[1600] = "<b>Onay bekleyen (24h)</b>\n";
        if (g_unacked_hook) {
            char body[1400];
            body[0] = '\0';
            g_unacked_hook(body, sizeof(body));
            strncat(msg, body, sizeof(msg) - strlen(msg) - 1);
        } else {
            strncat(msg, "Veri kaynagi yok.", sizeof(msg) - strlen(msg) - 1);
        }
        send_text(chat_id, msg);
        return;
    }

    if (strncmp(text, "/incident", 9) == 0) {
        const char *arg = text + 9;
        while (*arg == ' ')
            arg++;
        if (!arg[0]) {
            send_text(chat_id,
                       "<b>/incident</b>\n"
                       "Kullanim: <code>/incident INC-xxxxxxxx-xxxx</code>");
            return;
        }
        char inc[32];
        size_t n = 0;
        while (arg[n] && arg[n] != ' ' && n + 1 < sizeof(inc)) {
            inc[n] = arg[n];
            n++;
        }
        inc[n] = '\0';
        char msg[1600] = "<b>Incident</b>\n";
        if (g_incident_hook) {
            char body[1400];
            body[0] = '\0';
            g_incident_hook(inc, body, sizeof(body));
            strncat(msg, body, sizeof(msg) - strlen(msg) - 1);
        } else {
            strncat(msg, "Veri kaynagi yok.", sizeof(msg) - strlen(msg) - 1);
        }
        send_text(chat_id, msg);
        return;
    }

    if (strncmp(text, "/start", 6) == 0 || strncmp(text, "/help", 5) == 0) {
        send_text(chat_id,
                   "<b>Log Guardian Bot</b>\n\n"
                   "<b>Komutlar (bu sohbet):</b>\n"
                   "/status — EPS, ban, webhook (Prometheus + route)\n"
                   "/bans — ipset block listesi\n"
                   "/last — son alarmlar (events.db)\n"
                   "/unacked — onay bekleyen alarmlar (24h)\n"
                   "/incident INC-… — tek incident ozeti\n"
                   "/ping — sağlık kontrolü\n\n"
                   "<b>Inline (alarm mesaji):</b>\n"
                   "Gordum · Sessiz (1s) · WL · Unban\n\n"
                   "<b>Kanal:</b> sadece alarm akışı + inline butonlar.\n"
                   "Onay için alarm mesajındaki butona basın.");
    }
}

static void answer_callback(const char *cb_id, const char *toast)
{
    char body[512];
    snprintf(body, sizeof(body),
             "{\"callback_query_id\":\"%s\","
             "\"text\":\"%s\",\"show_alert\":false}",
             cb_id, toast ? toast : "OK");
    (void)tg_post_json("answerCallbackQuery", body, NULL);
}

static void clear_inline_markup(const char *chat_id, long msg_id)
{
    if (msg_id <= 0)
        return;
    char body[256];
    snprintf(body, sizeof(body),
             "{\"chat_id\":\"%s\",\"message_id\":%ld,"
             "\"reply_markup\":{\"inline_keyboard\":[]}}",
             chat_id, msg_id);
    (void)tg_post_json("editMessageReplyMarkup", body, NULL);
}

static void json_unescape_value(const char *src, char *dst, size_t cap)
{
    if (!dst || cap < 2) {
        return;
    }
    dst[0] = '\0';
    if (!src)
        return;
    size_t j = 0;
    for (; *src && j + 1 < cap; src++) {
        if (*src == '\\' && src[1]) {
            src++;
            if (*src == 'n') {
                dst[j++] = '\n';
                continue;
            }
            if (*src == 'r') {
                dst[j++] = '\r';
                continue;
            }
            if (*src == 't') {
                dst[j++] = '\t';
                continue;
            }
            if (*src == '"') {
                dst[j++] = '"';
                continue;
            }
            if (*src == '\\') {
                dst[j++] = '\\';
                continue;
            }
        }
        dst[j++] = *src;
    }
    dst[j] = '\0';
}

static int json_extract_string(const char *blob, const char *key,
                               char *out, size_t cap)
{
    if (!blob || !key || !out || cap < 2)
        return 0;
    char needle[48];
    snprintf(needle, sizeof(needle), "\"%s\":\"", key);
    const char *p = strstr(blob, needle);
    if (!p)
        return 0;
    p += strlen(needle);
    char raw[2048];
    size_t n = 0;
    for (; *p && n + 1 < sizeof(raw); p++) {
        if (*p == '\\' && p[1]) {
            raw[n++] = *p++;
            raw[n++] = *p;
            continue;
        }
        if (*p == '"')
            break;
        raw[n++] = *p;
    }
    raw[n] = '\0';
    json_unescape_value(raw, out, cap);
    return out[0] ? 1 : 0;
}

static int json_extract_long(const char *blob, const char *key, long *out)
{
    if (!blob || !key || !out)
        return 0;
    char needle[48];
    snprintf(needle, sizeof(needle), "\"%s\":", key);
    const char *p = strstr(blob, needle);
    if (!p)
        return 0;
    p += strlen(needle);
    while (*p == ' ')
        p++;
    *out = strtol(p, NULL, 10);
    return 1;
}

static void strip_ack_footer(char *text)
{
    if (!text || !text[0])
        return;
    const char *mark = "\n\n\xe2\x9c\x85";
    char *p = strstr(text, mark);
    if (!p)
        return;
    *p = '\0';
    size_t n = strlen(text);
    while (n > 0 && (text[n - 1] == '\n' || text[n - 1] == ' '))
        text[--n] = '\0';
}

static void edit_message_text(const char *chat_id, long msg_id,
                              const char *text_html)
{
    if (!chat_id || !chat_id[0] || msg_id <= 0 || !text_html || !text_html[0])
        return;

    char body[4500];
    size_t pos = 0;
    body[pos++] = '{';
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos, "\"chat_id\":\"");
    for (const char *s = chat_id; *s && pos + 2 < sizeof(body); s++) {
        if (*s == '"' || *s == '\\')
            body[pos++] = '\\';
        body[pos++] = *s;
    }
    pos += (size_t)snprintf(body + pos, sizeof(body) - pos,
                            "\",\"message_id\":%ld,\"text\":\"", msg_id);
    for (const char *s = text_html; *s && pos + 2 < sizeof(body); s++) {
        if (*s == '"' || *s == '\\')
            body[pos++] = '\\';
        body[pos++] = *s;
    }
    snprintf(body + pos, sizeof(body) - pos, "\",\"parse_mode\":\"HTML\"}");
    (void)tg_post_json("editMessageText", body, NULL);
}

static void refresh_ack_footer(const char *chat_id, long msg_id,
                             const char *msg_text, const char *ack_key)
{
    if (!g_ack_db_path[0] || !ack_key || !ack_key[0] ||
        !msg_text || !msg_text[0])
        return;

    char names[256];
    if (db_telegram_ack_names_path(g_ack_db_path, ack_key,
                                   names, sizeof(names)) != 0 ||
        !names[0])
        return;

    char base[2048];
    strncpy(base, msg_text, sizeof(base) - 1);
    base[sizeof(base) - 1] = '\0';
    strip_ack_footer(base);

    char html[2400];
    snprintf(html, sizeof(html),
             "%s\n\n\xe2\x9c\x85 <b>G\xc3\xb6rd\xc3\xbc:</b> %s",
             base, names);
    edit_message_text(chat_id, msg_id, html);
}

static void extract_ip_from_message(const char *msg_text, char *ip_out, size_t cap)
{
    if (!msg_text || !ip_out || cap < 8)
        return;
    ip_out[0] = '\0';
    const char *p = strstr(msg_text, "<code>");
    if (!p)
        p = strstr(msg_text, "IP:");
    if (!p)
        return;
    if (*p == 'I')
        p += 3;
    else
        p += 6;
    while (*p == ' ' || *p == '\n')
        p++;
    size_t i = 0;
    for (; *p && i + 1 < cap; p++) {
        if (*p == '<' || *p == '\n' || *p == ' ')
            break;
        ip_out[i++] = *p;
    }
    ip_out[i] = '\0';
}

static void handle_callback(const char *cb_id, const char *chat_id,
                            const char *data, long msg_id,
                            const char *msg_text,
                            const char *operator_id,
                            const char *operator_name) {
    if (!cb_id || !cb_id[0])
        return;
    if (!data || !data[0]) {
        answer_callback(cb_id, "Bos callback");
        return;
    }
    if (!chat_id || !chat_allowed(chat_id)) {
        fprintf(stderr,
                "[TELEGRAM_BOT] callback reddedildi (chat izni yok): chat=%s data=%s\n",
                chat_id ? chat_id : "?", data);
        answer_callback(cb_id, "Bu chat icin yetki yok");
        return;
    }

    fprintf(stderr,
            "[TELEGRAM_BOT] callback chat=%s data=%s op=%s\n",
            chat_id, data, operator_name ? operator_name : "?");

    if (strncmp(data, "ack:", 4) == 0 || strcmp(data, "ack") == 0) {
        char ack_key[64];
        ack_key[0] = '\0';
        if (strncmp(data, "ack:", 4) == 0)
            strncpy(ack_key, data + 4, sizeof(ack_key) - 1);
        if (!ack_key[0]) {
            extract_ip_from_message(msg_text, ack_key, sizeof(ack_key));
        }
        if (!ack_key[0]) {
            answer_callback(cb_id, "Onay anahtari yok");
            return;
        }

        int rc = -1;
        if (g_ack_hook)
            rc = g_ack_hook(chat_id, ack_key, operator_id, operator_name);
        else if (g_ack_db_path[0])
            rc = db_telegram_ack_register_path(
                g_ack_db_path, chat_id, ack_key,
                (strncmp(ack_key, "INC-", 4) == 0 ||
                 strncmp(ack_key, "BATCH-", 6) == 0)
                    ? ack_key
                    : NULL,
                operator_id, operator_name);

        if (rc == 1) {
            answer_callback(cb_id, "Zaten onayladiniz");
            return;
        }
        if (rc != 0) {
            answer_callback(cb_id, "Onay kaydedilemedi");
            return;
        }

        answer_callback(cb_id, "\u2705 Onaylandi");
        refresh_ack_footer(chat_id, msg_id, msg_text, ack_key);
        return;
    }

    const char *verb = NULL;
    const char *arg = NULL;
    const char *toast = "OK";
    if (strncmp(data, "mute:", 5) == 0) {
        verb = "mute";
        arg = data + 5;
        toast = "Sessiz mod aktif";
    } else if (strncmp(data, "wl:", 3) == 0) {
        verb = "wl";
        arg = data + 3;
        toast = "Whitelist eklendi";
    } else if (strncmp(data, "ub:", 3) == 0) {
        verb = "ub";
        arg = data + 3;
        toast = "Unban gonderildi";
    } else if (strncmp(data, "undo:", 5) == 0) {
        verb = "undo";
        arg = data + 5;
        toast = "Sesli mod aktif";
    }

    if (verb && arg && arg[0] && g_inline_hook) {
        g_inline_hook(chat_id, verb, arg);
        answer_callback(cb_id, toast);
        clear_inline_markup(chat_id, msg_id);
        return;
    }
    if (verb && arg && arg[0]) {
        answer_callback(cb_id, "Inline handler yok");
        return;
    }
    answer_callback(cb_id, "Taninmayan buton");
}

static void process_update(const char *json) {
    if (!json) return;

    const char *msg = strstr(json, "\"message\"");
    if (msg) {
        const char *chat = strstr(msg, "\"chat\"");
        const char *cid = chat ? strstr(chat, "\"id\":") : NULL;
        const char *txt = strstr(msg, "\"text\":\"");
        if (cid && txt) {
            char chat_id[32];
            long id = strtol(cid + 5, NULL, 10);
            snprintf(chat_id, sizeof(chat_id), "%ld", id);

            txt += 8;
            char text[256];
            size_t i = 0;
            for (; *txt && i + 1 < sizeof(text); txt++) {
                if (*txt == '\\' && txt[1]) { txt++; }
                if (*txt == '"') break;
                text[i++] = *txt;
            }
            text[i] = '\0';
            if (text[0] == '/') handle_command(chat_id, text);
        }
    }

    const char *cb = strstr(json, "\"callback_query\"");
    if (cb) {
        const char *cid = strstr(cb, "\"id\":\"");
        const char *data = strstr(cb, "\"data\":\"");
        const char *chat = strstr(cb, "\"chat\"");
        const char *chat_idp = chat ? strstr(chat, "\"id\":") : NULL;
        const char *mid = strstr(cb, "\"message_id\":");
        if (!cid || !data || !chat_idp) return;

        char cb_id[128];
        cid += 6;
        size_t n = 0;
        for (; *cid && *cid != '"' && n + 1 < sizeof(cb_id); cid++)
            cb_id[n++] = *cid;
        cb_id[n] = '\0';

        char payload[96];
        data += 8;
        n = 0;
        for (; *data && *data != '"' && n + 1 < sizeof(payload); data++)
            payload[n++] = *data;
        payload[n] = '\0';

        char chat_id[32];
        long ch = strtol(chat_idp + 5, NULL, 10);
        snprintf(chat_id, sizeof(chat_id), "%ld", ch);
        long msg_id = mid ? strtol(mid + 13, NULL, 10) : 0;

        char operator_id[32] = "";
        char operator_name[64] = "Operator";
        const char *from = strstr(cb, "\"from\"");
        if (from) {
            long uid = 0;
            if (json_extract_long(from, "id", &uid) && uid > 0)
                snprintf(operator_id, sizeof(operator_id), "%ld", uid);
            char first[48] = "";
            char user[48] = "";
            if (json_extract_string(from, "first_name", first, sizeof(first)))
                strncpy(operator_name, first, sizeof(operator_name) - 1);
            else if (json_extract_string(from, "username", user, sizeof(user)))
                strncpy(operator_name, user, sizeof(operator_name) - 1);
        }

        char msg_text[2048] = "";
        const char *msg_blob = strstr(cb, "\"message\"");
        if (msg_blob)
            (void)json_extract_string(msg_blob, "text", msg_text,
                                      sizeof(msg_text));

        handle_callback(cb_id, chat_id, payload, msg_id, msg_text,
                        operator_id[0] ? operator_id : NULL,
                        operator_name);
    }
}

void telegram_bot_handle_update(const char *json)
{
    process_update(json);
}

int telegram_bot_webhook_mode(void)
{
    return webhook_telegram_webhook_enabled() ? 1 : 0;
}

int telegram_bot_webhook_secret_ok(const char *header_value)
{
    const char *want = webhook_telegram_webhook_secret();
    if (!want || !want[0])
        return 1;
    if (!header_value)
        return 0;
    return secure_equals(header_value, want);
}

static void json_escape_str(const char *src, char *dst, size_t cap)
{
    size_t j = 0;
    for (; src && *src && j + 2 < cap; src++) {
        if (*src == '"' || *src == '\\')
            dst[j++] = '\\';
        dst[j++] = *src;
    }
    dst[j] = '\0';
}

int telegram_bot_register_webhook(void)
{
    if (!telegram_bot_enabled() || !g_webhook.token[0])
        return -1;
    if (!webhook_telegram_webhook_enabled())
        return -1;

    char url_e[640];
    char sec_e[160];
    json_escape_str(webhook_telegram_webhook_url(), url_e, sizeof(url_e));

    char body[1024];
    if (webhook_telegram_webhook_secret()[0]) {
        json_escape_str(webhook_telegram_webhook_secret(), sec_e, sizeof(sec_e));
        snprintf(body, sizeof(body),
                 "{\"url\":\"%s\",\"secret_token\":\"%s\","
                 "\"allowed_updates\":[\"message\",\"callback_query\"],"
                 "\"drop_pending_updates\":false}",
                 url_e, sec_e);
    } else {
        snprintf(body, sizeof(body),
                 "{\"url\":\"%s\","
                 "\"allowed_updates\":[\"message\",\"callback_query\"],"
                 "\"drop_pending_updates\":false}",
                 url_e);
    }

    char *resp = NULL;
    int rc = tg_post_json("setWebhook", body, &resp);
    if (rc != 0) {
        fprintf(stderr, "[TELEGRAM_BOT] setWebhook FAIL\n");
        free(resp);
        return -1;
    }
    fprintf(stderr, "[TELEGRAM_BOT] setWebhook OK: %s\n",
            webhook_telegram_webhook_url());
    free(resp);
    return 0;
}

void telegram_bot_unregister_webhook(void)
{
    if (!g_webhook.token[0])
        return;
    (void)tg_post_json("deleteWebhook", "{}", NULL);
}

static void *poll_loop(void *arg) {
    (void)arg;
    while (!g_poll_stop) {
        char url[640];
        snprintf(url, sizeof(url),
                 "%s/bot%s/getUpdates?timeout=25&offset=%ld"
                 "&allowed_updates=%%5B%%22message%%22%%2C%%22callback_query%%22%%5D",
                 api_base(), g_webhook.token, g_update_offset);

        CURL *curl = curl_easy_init();
        if (!curl) { sleep(2); continue; }

        char *resp = NULL;
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_mem);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 35L);
        curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 5L);
        curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);

        curl_easy_perform(curl);
        curl_easy_cleanup(curl);

        if (resp) {
            const char *p = resp;
            while ((p = strstr(p, "\"update_id\":")) != NULL) {
                long uid = strtol(p + 12, NULL, 10);
                if (uid >= g_update_offset)
                    g_update_offset = uid + 1;
                p += 12;
            }
            const char *res = resp;
            while ((res = strstr(res, "\"update_id\":")) != NULL) {
                const char *end = strstr(res + 1, "\"update_id\":");
                char chunk[8192];
                size_t len = end ? (size_t)(end - res) : strlen(res);
                if (len >= sizeof(chunk)) len = sizeof(chunk) - 1;
                memcpy(chunk, res, len);
                chunk[len] = '\0';
                process_update(chunk);
                if (!end) break;
                res = end;
            }
            free(resp);
        }
        if (g_poll_stop) break;
    }
    return NULL;
}

void telegram_bot_start(void) {
    if (!telegram_bot_enabled() || !g_webhook.token[0]) return;
    if (g_poll_running) return;
    g_poll_stop = 0;

    if (telegram_bot_webhook_mode()) {
        g_poll_running = 1;
        fprintf(stderr,
                "[TELEGRAM_BOT] webhook modu (long-poll kapali) — "
                "setWebhook API baslatildiktan sonra\n");
        return;
    }

    if (pthread_create(&g_poll_thread, NULL, poll_loop, NULL) != 0) {
        fprintf(stderr, "[TELEGRAM_BOT] poll thread baslatilamadi\n");
        return;
    }
    g_poll_running = 1;
    fprintf(stderr,
            "[TELEGRAM_BOT] long-poll acik (/status /bans /last /unacked /incident)\n");
}

void telegram_bot_stop(void) {
    if (!g_poll_running) return;
    if (telegram_bot_webhook_mode()) {
        g_poll_running = 0;
        return;
    }
    g_poll_stop = 1;
    pthread_join(g_poll_thread, NULL);
    g_poll_running = 0;
}
