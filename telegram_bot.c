#include "telegram_bot.h"
#include "webhook.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <unistd.h>
#include <pthread.h>
#include <curl/curl.h>

static TelegramOpsStatusFn g_ops_status = NULL;
static TelegramAckFn         g_ack_hook = NULL;
static TelegramLastFn        g_last_hook = NULL;
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

void telegram_bot_set_last_hook(TelegramLastFn fn) {
    g_last_hook = fn;
}

void telegram_bot_build_ack_markup(const char *incident_or_ip,
                                   char *out, size_t cap) {
    if (!out || cap < 32) return;
    char cb[56] = "ack";
    if (incident_or_ip && incident_or_ip[0]) {
        snprintf(cb, sizeof(cb), "ack:%.48s", incident_or_ip);
    }
    char esc[128];
    size_t j = 0;
    for (const char *s = cb; *s && j + 2 < sizeof(esc); s++) {
        if (*s == '"' || *s == '\\') esc[j++] = '\\';
        esc[j++] = *s;
    }
    esc[j] = '\0';
    snprintf(out, cap,
             "{\"inline_keyboard\":[[{\"text\":\"✅ Gördüm\","
             "\"callback_data\":\"%s\"}]]}",
             esc);
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
    snprintf(body + pos, sizeof(body) - pos, "\",\"parse_mode\":\"HTML\"}");
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
        FILE *f = popen("ipset list block 2>/dev/null | grep -E '^[0-9]' | head -8", "r");
        if (f) {
            char line[64];
            int n = 0;
            while (fgets(line, sizeof(line), f) && n < 8) {
                size_t len = strlen(line);
                while (len > 0 && (line[len - 1] == '\n' || line[len - 1] == '\r'))
                    line[--len] = '\0';
                if (len > 0) {
                    strncat(msg, line, sizeof(msg) - strlen(msg) - 2);
                    strncat(msg, "\n", sizeof(msg) - strlen(msg) - 1);
                    n++;
                }
            }
            pclose(f);
        }
        if (strstr(msg, "<code>") && msg[strlen(msg) - 1] == '\n')
            msg[strlen(msg) - 1] = '\0';
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

    if (strncmp(text, "/start", 6) == 0 || strncmp(text, "/help", 5) == 0) {
        send_text(chat_id,
                   "<b>Log Guardian Bot</b>\n\n"
                   "<b>Komutlar (bu sohbet):</b>\n"
                   "/status — EPS, ban, webhook (Prometheus + route)\n"
                   "/bans — ipset block listesi\n"
                   "/last — son alarmlar (events.db)\n"
                   "/ping — sağlık kontrolü\n\n"
                   "<b>Kanal:</b> sadece alarm akışı + <b>Gördüm</b> butonu.\n"
                   "Onay için alarm mesajındaki butona basın.");
    }
}

static void handle_callback(const char *cb_id, const char *chat_id,
                            const char *data, long msg_id) {
    if (!chat_allowed(chat_id)) return;

    char ack_key[64];
    ack_key[0] = '\0';
    if (data && strncmp(data, "ack:", 4) == 0) {
        strncpy(ack_key, data + 4, sizeof(ack_key) - 1);
    } else if (data && data[0]) {
        strncpy(ack_key, data, sizeof(ack_key) - 1);
    }

    if (g_ack_hook && ack_key[0])
        g_ack_hook(chat_id, ack_key);

    char body[512];
    snprintf(body, sizeof(body),
             "{\"callback_query_id\":\"%s\",\"text\":\"Kaydedildi\"}",
             cb_id);
    (void)tg_post_json("answerCallbackQuery", body, NULL);

    if (msg_id > 0) {
        snprintf(body, sizeof(body),
                 "{\"chat_id\":\"%s\",\"message_id\":%ld,"
                 "\"text\":\"✅ Onaylandı — Log Guardian\",\"parse_mode\":\"HTML\"}",
                 chat_id, msg_id);
        (void)tg_post_json("editMessageText", body, NULL);
    }
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

        char payload[64];
        data += 8;
        n = 0;
        for (; *data && *data != '"' && n + 1 < sizeof(payload); data++)
            payload[n++] = *data;
        payload[n] = '\0';

        char chat_id[32];
        long ch = strtol(chat_idp + 5, NULL, 10);
        snprintf(chat_id, sizeof(chat_id), "%ld", ch);
        long msg_id = mid ? strtol(mid + 13, NULL, 10) : 0;

        if (strncmp(payload, "ack:", 4) == 0)
            handle_callback(cb_id, chat_id, payload, msg_id);
    }
}

static void *poll_loop(void *arg) {
    (void)arg;
    while (!g_poll_stop) {
        char url[640];
        snprintf(url, sizeof(url),
                 "%s/bot%s/getUpdates?timeout=25&offset=%ld",
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
    if (pthread_create(&g_poll_thread, NULL, poll_loop, NULL) != 0) {
        fprintf(stderr, "[TELEGRAM_BOT] poll thread baslatilamadi\n");
        return;
    }
    g_poll_running = 1;
    fprintf(stderr, "[TELEGRAM_BOT] komut dinleyici acik (/status /bans /ping)\n");
}

void telegram_bot_stop(void) {
    if (!g_poll_running) return;
    g_poll_stop = 1;
    pthread_join(g_poll_thread, NULL);
    g_poll_running = 0;
}
