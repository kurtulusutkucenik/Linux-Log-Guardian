/* k8s_webhook.h — Kubernetes Operator Bildiri Köprüsü
 *
 * k8s_guard_kill_process() tarafından tetiklenir.
 * Container ID + workload_name + pod namespace bilgisini
 * Go K8s Operator'a veya Dashboard'a HTTP POST ile iletir.
 * libcurl ile asenkron (detached thread) çalışır; ana akışı bloklamaz.
 */
#ifndef K8S_WEBHOOK_H
#define K8S_WEBHOOK_H

#include "k8s_guard.h"

typedef struct {
    int  enabled;
    char endpoint[256];  /* örn: http://localhost:8082/kill-pod */
} K8sWebhookConfig;

extern K8sWebhookConfig g_k8s_webhook_config;

/* RCE olayını arka planda Operator'a bildir.
 * Non-blocking: kopyalanan event verisi detached thread içinde işlenir. */
void k8s_webhook_notify(const RceEvent *ev);

#endif /* K8S_WEBHOOK_H */
