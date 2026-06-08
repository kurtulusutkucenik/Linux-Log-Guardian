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

    /* JSON payload oluştur */
    snprintf(task->payload, sizeof(task->payload),
        "{"
            "\"pid\":%d,"
            "\"container_id\":\"%.64s\","
            "\"workload_name\":\"%s\","
            "\"parent_comm\":\"%s\","
            "\"exec_filename\":\"%s\","
            "\"argv1\":\"%s\","
            "\"timestamp_ns\":%llu,"
            "\"is_container\":%s"
        "}",
        (int)ev->pid,
        ev->container.container_id[0] ? ev->container.container_id : "unknown",
        ev->container.workload_name[0] ? ev->container.workload_name : "unknown",
        ev->parent_comm,
        ev->filename,
        ev->argv1,
        (unsigned long long)ev->timestamp_ns,
        ev->container.is_container ? "true" : "false"
    );

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
