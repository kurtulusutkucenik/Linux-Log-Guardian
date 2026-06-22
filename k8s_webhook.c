/* k8s_webhook.c — Kubernetes Operator Bildiri Köprüsü
 *
 * RCE tespitinde k8s_webhook_notify() çağrılır.
 * Verilen RceEvent, JSON payload'a dönüştürülür ve
 * detached bir pthread içinde libcurl HTTP POST ile
 * Go Operator endpoint'ine iletilir.
 *
 * Ana analiz döngüsü bloklanmaz.
 */
#define _GNU_SOURCE
#include "k8s_webhook.h"
#include "logger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pthread.h>
#include <curl/curl.h>

/* ── Global config (main.c'den load_rules_file() ile doldurulur) ── */
K8sWebhookConfig g_k8s_webhook_config = {
    .enabled  = 0,
    .endpoint = "http://localhost:8082/kill-pod",
};

/* ── Curl response sink (cevabı atıyoruz) ─────────────────────── */
static size_t discard_response(void *ptr, size_t size, size_t nmemb, void *userdata) {
    (void)ptr; (void)userdata;
    return size * nmemb;
}

static void json_escape_field(const char *in, char *out, size_t out_sz) {
    if (!out || out_sz == 0) return;
    if (!in) { out[0] = '\0'; return; }
    size_t j = 0;
    for (size_t i = 0; in[i] && j + 2 < out_sz; i++) {
        char c = in[i];
        if (c == '"' || c == '\\') {
            if (j + 2 >= out_sz) break;
            out[j++] = '\\';
            out[j++] = c;
        } else if ((unsigned char)c < 0x20) {
            if (j + 6 >= out_sz) break;
            j += (size_t)snprintf(out + j, out_sz - j, "\\u%04x", (unsigned char)c);
        } else {
            out[j++] = c;
        }
    }
    out[j] = '\0';
}

/* ── Detached thread payload ──────────────────────────────────── */
typedef struct {
    char endpoint[256];
    char payload[1024];
} WebhookTask;

static void *webhook_thread(void *arg) {
    WebhookTask *task = (WebhookTask *)arg;

    CURL *curl = curl_easy_init();
    if (!curl) { free(task); return NULL; }

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "X-Guardian-Source: k8s-guard");

    curl_easy_setopt(curl, CURLOPT_URL,            task->endpoint);
    curl_easy_setopt(curl, CURLOPT_POST,            1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS,      task->payload);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER,      headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,   discard_response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT,         3L);   /* 3 sn timeout */
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT,  2L);
    curl_easy_setopt(curl, CURLOPT_NOSIGNAL,        1L);   /* thread-safe */

    CURLcode res = curl_easy_perform(curl);
    if (res != CURLE_OK) {
        log_rl(LOG_WARNING, "[K8S-WEBHOOK] POST basarisiz: %s → %s",
               curl_easy_strerror(res), task->endpoint);
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    free(task);
    return NULL;
}

/* ── Public API ─────────────────────────────────────────────────── */
void k8s_webhook_notify(const RceEvent *ev) {
    if (!g_k8s_webhook_config.enabled || !ev) return;
    if (g_k8s_webhook_config.endpoint[0] == '\0') return;

    WebhookTask *task = malloc(sizeof(WebhookTask));
    if (!task) return;

    strncpy(task->endpoint, g_k8s_webhook_config.endpoint,
            sizeof(task->endpoint) - 1);
    task->endpoint[sizeof(task->endpoint) - 1] = '\0';

    /* JSON payload — string alanlari escape (argv icinde " veya \ olabilir) */
    char cid_esc[140], wl_esc[140], pc_esc[80], fn_esc[140], av_esc[140];
    const char *cid_raw = ev->container.container_id[0] ? ev->container.container_id : "unknown";
    const char *wl_raw  = ev->container.workload_name[0] ? ev->container.workload_name : "unknown";
    json_escape_field(cid_raw, cid_esc, sizeof(cid_esc));
    json_escape_field(wl_raw, wl_esc, sizeof(wl_esc));
    json_escape_field(ev->parent_comm, pc_esc, sizeof(pc_esc));
    json_escape_field(ev->filename, fn_esc, sizeof(fn_esc));
    json_escape_field(ev->argv1, av_esc, sizeof(av_esc));

    int n = snprintf(task->payload, sizeof(task->payload),
        "{"
            "\"pid\":%d,"
            "\"container_id\":\"%s\","
            "\"workload_name\":\"%s\","
            "\"parent_comm\":\"%s\","
            "\"exec_filename\":\"%s\","
            "\"argv1\":\"%s\","
            "\"timestamp_ns\":%llu,"
            "\"is_container\":%s"
        "}",
        (int)ev->pid,
        cid_esc,
        wl_esc,
        pc_esc,
        fn_esc,
        av_esc,
        (unsigned long long)ev->timestamp_ns,
        ev->container.is_container ? "true" : "false"
    );
    if (n < 0 || (size_t)n >= sizeof(task->payload)) {
        free(task);
        log_rl(LOG_WARNING, "[K8S-WEBHOOK] payload tasmasi — event atlandi");
        return;
    }

    /* Detached thread — ana döngü bloklanmaz */
    pthread_t tid;
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    if (pthread_create(&tid, &attr, webhook_thread, task) != 0) {
        free(task);
    }
    pthread_attr_destroy(&attr);
}
