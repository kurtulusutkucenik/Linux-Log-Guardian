/*
 * metrics.c — Prometheus /metrics HTTP Endpoint
 *
 * Loopback-only (127.0.0.1) minimal HTTP/1.1 sunucu.
 * Harici bağımlılık yok; sadece POSIX socket API kullanır.
 *
 * Kullanım:
 *   curl http://127.0.0.1:9091/metrics
 */
#define _GNU_SOURCE
#include "metrics.h"
#include "webhook.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <pthread.h>
#include <stdatomic.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <fcntl.h>
#include <ctype.h>
#include <sys/time.h>

static pthread_t        g_metrics_thread;
static int              g_metrics_fd    = -1;
static volatile int     g_metrics_run   = 0;
static int              g_metrics_port  = 0;

static pthread_mutex_t  g_snap_lock = PTHREAD_MUTEX_INITIALIZER;
static MetricsSnapshot  g_snap      = {0};
static char             g_tenant_label[64] = "default";

void metrics_set_tenant_id(const char *tenant_id)
{
    if (!tenant_id || !tenant_id[0]) {
        strncpy(g_tenant_label, "default", sizeof(g_tenant_label) - 1);
        return;
    }
    size_t j = 0;
    for (size_t i = 0; tenant_id[i] && j < sizeof(g_tenant_label) - 1; i++) {
        char c = tenant_id[i];
        if (isalnum((unsigned char)c) || c == '_' || c == '-')
            g_tenant_label[j++] = c;
    }
    g_tenant_label[j] = '\0';
    if (!g_tenant_label[0])
        strncpy(g_tenant_label, "default", sizeof(g_tenant_label) - 1);
}

void metrics_update(const MetricsSnapshot *snap) {
    if (!snap) return;
    pthread_mutex_lock(&g_snap_lock);
    g_snap = *snap;
    pthread_mutex_unlock(&g_snap_lock);
}

void metrics_refresh_fp_trust(long trusted, long partial, long enabled, long suppressed)
{
    pthread_mutex_lock(&g_snap_lock);
    g_snap.fp_trusted_ips      = trusted;
    g_snap.fp_partial_ips      = partial;
    g_snap.fp_learn_enabled    = enabled;
    g_snap.fp_suppressed_total = suppressed;
    pthread_mutex_unlock(&g_snap_lock);
}

void metrics_refresh_telegram_ack(long ack_24h, long unacked_24h)
{
    pthread_mutex_lock(&g_snap_lock);
    g_snap.telegram_ack_24h     = ack_24h;
    g_snap.telegram_unacked_24h = unacked_24h;
    pthread_mutex_unlock(&g_snap_lock);
}

static void write_all(int fd, const char *buf, size_t len) {
    while (len > 0) {
        ssize_t n = write(fd, buf, len);
        if (n <= 0) break;
        buf += n;
        len -= (size_t)n;
    }
}

/* Tum tenant metrikleri (~8.5K+); 8192 tasiyordu → Prometheus parse fail */
#define METRICS_BODY_MAX 16384

static int metrics_format_prometheus(char *body, size_t cap, const MetricsSnapshot *s)
{
    return snprintf(body, cap,
        "# HELP loganalyzer_lines_total Log satirlari islendi\n"
        "# TYPE loganalyzer_lines_total counter\n"
        "loganalyzer_lines_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_parse_errors_total Parse hatalari\n"
        "# TYPE loganalyzer_parse_errors_total counter\n"
        "loganalyzer_parse_errors_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_bytes_total Islenen bayt\n"
        "# TYPE loganalyzer_bytes_total counter\n"
        "loganalyzer_bytes_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_alerts_total Toplam alarm sayisi\n"
        "# TYPE loganalyzer_alerts_total counter\n"
        "loganalyzer_alerts_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_bans_success Basarili ban islemi\n"
        "# TYPE loganalyzer_bans_success counter\n"
        "loganalyzer_bans_success{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_bans_fail Basarisiz ban denemesi\n"
        "# TYPE loganalyzer_bans_fail counter\n"
        "loganalyzer_bans_fail{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_unique_ips Izlenen benzersiz IP sayisi\n"
        "# TYPE loganalyzer_unique_ips gauge\n"
        "loganalyzer_unique_ips{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_eps Saniyedeki olay isleme hizi\n"
        "# TYPE loganalyzer_eps gauge\n"
        "loganalyzer_eps{tenant_id=\"%s\"} %.2f\n"
        "# HELP loganalyzer_http_requests_total HTTP metod sayilari\n"
        "# TYPE loganalyzer_http_requests_total counter\n"
        "loganalyzer_http_requests_total{tenant_id=\"%s\",method=\"GET\"} %ld\n"
        "loganalyzer_http_requests_total{tenant_id=\"%s\",method=\"POST\"} %ld\n"
        "loganalyzer_http_requests_total{tenant_id=\"%s\",method=\"PUT\"} %ld\n"
        "loganalyzer_http_requests_total{tenant_id=\"%s\",method=\"DELETE\"} %ld\n"
        "loganalyzer_http_requests_total{tenant_id=\"%s\",method=\"OTHER\"} %ld\n"
        "# HELP loganalyzer_http_status_total HTTP durum kodu dagilimi\n"
        "# TYPE loganalyzer_http_status_total counter\n"
        "loganalyzer_http_status_total{tenant_id=\"%s\",code=\"2xx\"} %ld\n"
        "loganalyzer_http_status_total{tenant_id=\"%s\",code=\"3xx\"} %ld\n"
        "loganalyzer_http_status_total{tenant_id=\"%s\",code=\"4xx\"} %ld\n"
        "loganalyzer_http_status_total{tenant_id=\"%s\",code=\"5xx\"} %ld\n"
        "# HELP loganalyzer_xdp_active XDP/eBPF aktif mi (1=evet)\n"
        "# TYPE loganalyzer_xdp_active gauge\n"
        "loganalyzer_xdp_active{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ringbuf_drops_total XDP Ring Buffer dolu\n"
        "# TYPE loganalyzer_ringbuf_drops_total counter\n"
        "loganalyzer_ringbuf_drops_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ja3_total_total Toplam JA3 TLS parmak izi\n"
        "# TYPE loganalyzer_ja3_total_total counter\n"
        "loganalyzer_ja3_total_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ja3_c2_total C2 araci JA3 eslesmesi\n"
        "# TYPE loganalyzer_ja3_c2_total counter\n"
        "loganalyzer_ja3_c2_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_apt_clusters APT kumesi sayisi\n"
        "# TYPE loganalyzer_apt_clusters gauge\n"
        "loganalyzer_apt_clusters{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_apt_detections_total APT tespit alarmi\n"
        "# TYPE loganalyzer_apt_detections_total counter\n"
        "loganalyzer_apt_detections_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_covert_hits_total Covert channel tespit\n"
        "# TYPE loganalyzer_covert_hits_total counter\n"
        "loganalyzer_covert_hits_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_honey_traps_total Honey-credential tuzak\n"
        "# TYPE loganalyzer_honey_traps_total counter\n"
        "loganalyzer_honey_traps_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_threat_last_sync_ts Son threat intel sync (unix)\n"
        "# TYPE loganalyzer_threat_last_sync_ts gauge\n"
        "loganalyzer_threat_last_sync_ts{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_threat_total_iocs Threat feed IOC sayisi\n"
        "# TYPE loganalyzer_threat_total_iocs gauge\n"
        "loganalyzer_threat_total_iocs{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_threat_last_applied Son sync'te uygulanan IOC\n"
        "# TYPE loganalyzer_threat_last_applied gauge\n"
        "loganalyzer_threat_last_applied{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_threat_last_failed Son sync'te basarisiz IOC\n"
        "# TYPE loganalyzer_threat_last_failed gauge\n"
        "loganalyzer_threat_last_failed{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_threat_feed_enabled Threat feed acik (1=evet)\n"
        "# TYPE loganalyzer_threat_feed_enabled gauge\n"
        "loganalyzer_threat_feed_enabled{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_fp_trusted_ips FP learn guvenilir IP\n"
        "# TYPE loganalyzer_fp_trusted_ips gauge\n"
        "loganalyzer_fp_trusted_ips{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_fp_partial_ips FP learn kismi guven IP\n"
        "# TYPE loganalyzer_fp_partial_ips gauge\n"
        "loganalyzer_fp_partial_ips{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_fp_learn_enabled FP_LEARN acik (1=evet)\n"
        "# TYPE loganalyzer_fp_learn_enabled gauge\n"
        "loganalyzer_fp_learn_enabled{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_fp_suppressed_total FP learn bastirilan alarm\n"
        "# TYPE loganalyzer_fp_suppressed_total counter\n"
        "loganalyzer_fp_suppressed_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ban_pipeline_ipc Ban pipeline IPC yolu\n"
        "# TYPE loganalyzer_ban_pipeline_ipc counter\n"
        "loganalyzer_ban_pipeline_ipc{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ban_pipeline_xdp Ban pipeline XDP yolu\n"
        "# TYPE loganalyzer_ban_pipeline_xdp counter\n"
        "loganalyzer_ban_pipeline_xdp{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ban_pipeline_ipset Ban pipeline ipset yolu\n"
        "# TYPE loganalyzer_ban_pipeline_ipset counter\n"
        "loganalyzer_ban_pipeline_ipset{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ban_pipeline_failed Ban pipeline basarisiz\n"
        "# TYPE loganalyzer_ban_pipeline_failed counter\n"
        "loganalyzer_ban_pipeline_failed{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ja3_clusters_active Aktif UA/JA3 cluster bucket\n"
        "# TYPE loganalyzer_ja3_clusters_active gauge\n"
        "loganalyzer_ja3_clusters_active{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ja3_cluster_bans_total Cluster flush ban sayisi\n"
        "# TYPE loganalyzer_ja3_cluster_bans_total counter\n"
        "loganalyzer_ja3_cluster_bans_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_dist_risk_buckets_active DIST_RISK aktif bucket (ip>=2)\n"
        "# TYPE loganalyzer_dist_risk_buckets_active gauge\n"
        "loganalyzer_dist_risk_buckets_active{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_dist_risk_bonus_applied_total DIST_RISK ban risk bonus\n"
        "# TYPE loganalyzer_dist_risk_bonus_applied_total counter\n"
        "loganalyzer_dist_risk_bonus_applied_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_dist_risk_observe_total DIST_RISK observe cagri\n"
        "# TYPE loganalyzer_dist_risk_observe_total counter\n"
        "loganalyzer_dist_risk_observe_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_dist_risk_enabled DIST_RISK ayari (1=acik)\n"
        "# TYPE loganalyzer_dist_risk_enabled gauge\n"
        "loganalyzer_dist_risk_enabled{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_sent_total Webhook basarili gonderim\n"
        "# TYPE loganalyzer_webhook_sent_total counter\n"
        "loganalyzer_webhook_sent_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_fail_total Webhook gonderim hatasi\n"
        "# TYPE loganalyzer_webhook_fail_total counter\n"
        "loganalyzer_webhook_fail_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_queue_drops_total Webhook kuyruk tasmasi\n"
        "# TYPE loganalyzer_webhook_queue_drops_total counter\n"
        "loganalyzer_webhook_queue_drops_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_queue_depth Webhook async kuyruk derinligi\n"
        "# TYPE loganalyzer_webhook_queue_depth gauge\n"
        "loganalyzer_webhook_queue_depth{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_telegram_route Telegram CRIT/WARN ayri hedef (1=acik)\n"
        "# TYPE loganalyzer_webhook_telegram_route gauge\n"
        "loganalyzer_webhook_telegram_route{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_telegram_batch_sec WARN/INFO ozet penceresi (0=kapali)\n"
        "# TYPE loganalyzer_webhook_telegram_batch_sec gauge\n"
        "loganalyzer_webhook_telegram_batch_sec{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_telegram_ack_24h Telegram inline onay (son 24s)\n"
        "# TYPE loganalyzer_telegram_ack_24h gauge\n"
        "loganalyzer_telegram_ack_24h{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_telegram_unacked_24h Onay bekleyen alarm/ban (24s)\n"
        "# TYPE loganalyzer_telegram_unacked_24h gauge\n"
        "loganalyzer_telegram_unacked_24h{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_quiet_hours Sessiz saat ayari (1=acik)\n"
        "# TYPE loganalyzer_webhook_quiet_hours gauge\n"
        "loganalyzer_webhook_quiet_hours{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_webhook_quiet_active Sessiz saat penceresi aktif\n"
        "# TYPE loganalyzer_webhook_quiet_active gauge\n"
        "loganalyzer_webhook_quiet_active{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_api_requests_total REST API istek sayisi\n"
        "# TYPE loganalyzer_api_requests_total counter\n"
        "loganalyzer_api_requests_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_api_auth_fail_total API 403 yetkisiz istek\n"
        "# TYPE loganalyzer_api_auth_fail_total counter\n"
        "loganalyzer_api_auth_fail_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_api_rate_limited_total API 429 rate limit\n"
        "# TYPE loganalyzer_api_rate_limited_total counter\n"
        "loganalyzer_api_rate_limited_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_ban_events_total SQLite ban_events satir sayisi (gecmis dahil)\n"
        "# TYPE loganalyzer_ban_events_total gauge\n"
        "loganalyzer_ban_events_total{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_intel_ban_legacy_rows threat-intel legacy satir (beklenen 0)\n"
        "# TYPE loganalyzer_intel_ban_legacy_rows gauge\n"
        "loganalyzer_intel_ban_legacy_rows{tenant_id=\"%s\"} %ld\n"
        "# HELP loganalyzer_intel_ban_summary_rows threat-intel-summary ozet satirlari\n"
        "# TYPE loganalyzer_intel_ban_summary_rows gauge\n"
        "loganalyzer_intel_ban_summary_rows{tenant_id=\"%s\"} %ld\n",
        g_tenant_label, s->total_lines,
        g_tenant_label, s->parse_errors,
        g_tenant_label, s->total_bytes,
        g_tenant_label, s->alerts_total,
        g_tenant_label, s->ban_success,
        g_tenant_label, s->ban_fail,
        g_tenant_label, s->unique_ips,
        g_tenant_label, s->eps,
        g_tenant_label, s->cnt_get,
        g_tenant_label, s->cnt_post,
        g_tenant_label, s->cnt_put,
        g_tenant_label, s->cnt_delete,
        g_tenant_label, s->cnt_other,
        g_tenant_label, s->cnt_2xx,
        g_tenant_label, s->cnt_3xx,
        g_tenant_label, s->cnt_4xx,
        g_tenant_label, s->cnt_5xx,
        g_tenant_label, s->xdp_active,
        g_tenant_label, s->ringbuf_drops,
        g_tenant_label, s->ja3_total,
        g_tenant_label, s->ja3_c2,
        g_tenant_label, s->apt_clusters,
        g_tenant_label, s->apt_detections,
        g_tenant_label, s->covert_hits,
        g_tenant_label, s->honey_traps,
        g_tenant_label, s->threat_last_sync_ts,
        g_tenant_label, s->threat_total_iocs,
        g_tenant_label, s->threat_last_applied,
        g_tenant_label, s->threat_last_failed,
        g_tenant_label, s->threat_feed_enabled,
        g_tenant_label, s->fp_trusted_ips,
        g_tenant_label, s->fp_partial_ips,
        g_tenant_label, s->fp_learn_enabled,
        g_tenant_label, s->fp_suppressed_total,
        g_tenant_label, s->ban_pipeline_ipc,
        g_tenant_label, s->ban_pipeline_xdp,
        g_tenant_label, s->ban_pipeline_ipset,
        g_tenant_label, s->ban_pipeline_failed,
        g_tenant_label, s->ja3_clusters_active,
        g_tenant_label, s->ja3_cluster_bans_total,
        g_tenant_label, s->dist_risk_buckets_active,
        g_tenant_label, s->dist_risk_bonus_applied,
        g_tenant_label, s->dist_risk_observe_total,
        g_tenant_label, s->dist_risk_enabled,
        g_tenant_label, s->webhook_sent,
        g_tenant_label, s->webhook_fail,
        g_tenant_label, s->webhook_queue_drops,
        g_tenant_label, s->webhook_queue_depth,
        g_tenant_label, s->webhook_telegram_route,
        g_tenant_label, s->webhook_telegram_batch_sec,
        g_tenant_label, s->telegram_ack_24h,
        g_tenant_label, s->telegram_unacked_24h,
        g_tenant_label, s->webhook_quiet_enabled,
        g_tenant_label, s->webhook_quiet_active,
        g_tenant_label, s->api_requests_total,
        g_tenant_label, s->api_auth_fail_total,
        g_tenant_label, s->api_rate_limited_total,
        g_tenant_label, s->ban_events_total,
        g_tenant_label, s->intel_ban_legacy_rows,
        g_tenant_label, s->intel_ban_summary_rows);
}

static void handle_client(int cfd) {
    /* Stuck client / half-open: accept thread'ini kilitlemesin */
    struct timeval tv = { .tv_sec = 2, .tv_usec = 0 };
    setsockopt(cfd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    setsockopt(cfd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

    char req[512];
    ssize_t n = read(cfd, req, sizeof(req) - 1);
    if (n <= 0) { close(cfd); return; }
    req[n] = '\0';

    int is_metrics = (strncmp(req, "GET /metrics", 12) == 0);

    char body[METRICS_BODY_MAX];
    int blen = 0;

    if (is_metrics) {
        MetricsSnapshot s;
        pthread_mutex_lock(&g_snap_lock);
        s = g_snap;
        pthread_mutex_unlock(&g_snap_lock);
        webhook_metrics_snapshot(&s.webhook_sent, &s.webhook_fail,
                                 &s.webhook_queue_drops, &s.webhook_queue_depth);
        webhook_config_metrics(&s.webhook_telegram_route, &s.webhook_telegram_batch_sec);
        s.webhook_quiet_enabled = webhook_quiet_hours_enabled() ? 1L : 0L;
        s.webhook_quiet_active  = webhook_quiet_hours_active() ? 1L : 0L;

        blen = metrics_format_prometheus(body, sizeof(body), &s);
    } else {
        blen = snprintf(body, sizeof(body),
            "404 Not Found\nEndpoint: /metrics\n");
    }

    char header[256];
    int hlen = snprintf(header, sizeof(header),
        "HTTP/1.1 %s\r\n"
        "Content-Type: text/plain; version=0.0.4; charset=utf-8\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n"
        "\r\n",
        is_metrics ? "200 OK" : "404 Not Found", blen);

    write_all(cfd, header, (size_t)hlen);
    write_all(cfd, body,   (size_t)blen);
    close(cfd);
}

/*
 * Klasik blocking accept. (Eski io_uring yolu Contabo/VPS'te 9091 LISTEN
 * ama curl timeout hang üretti — kaldırıldı.)
 */
static void *metrics_thread_fn(void *arg) {
    (void)arg;

    fprintf(stderr, "[METRICS] classic accept loop (port %d)\n", g_metrics_port);

    if (g_metrics_fd >= 0) {
        int fl = fcntl(g_metrics_fd, F_GETFL, 0);
        if (fl >= 0)
            fcntl(g_metrics_fd, F_SETFL, fl & ~O_NONBLOCK);
    }

    while (g_metrics_run) {
        struct sockaddr_in ca;
        socklen_t clen = sizeof(ca);
        int cfd = accept(g_metrics_fd, (struct sockaddr *)&ca, &clen);
        if (cfd < 0) {
            if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK)
                continue;
            if (!g_metrics_run)
                break;
            fprintf(stderr, "[METRICS] accept: %s\n", strerror(errno));
            usleep(50 * 1000);
            continue;
        }
        handle_client(cfd);
    }
    fprintf(stderr, "[METRICS] accept loop exit\n");
    return NULL;
}

void metrics_server_start(int port) {
    if (port <= 0) return;
    g_metrics_port = port;

    g_metrics_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (g_metrics_fd < 0) {
        perror("[METRICS] socket");
        return;
    }

    /* SO_REUSEADDR: hızlı yeniden başlatmada TIME_WAIT sorununu önler */
    int opt = 1;
    setsockopt(g_metrics_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    /* Sadece loopback: dışarıya açık değil */
    struct sockaddr_in addr = {0};
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons((uint16_t)port);
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);  /* 127.0.0.1 */

    if (bind(g_metrics_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        perror("[METRICS] bind");
        close(g_metrics_fd);
        g_metrics_fd = -1;
        return;
    }
    if (listen(g_metrics_fd, 8) < 0) {
        perror("[METRICS] listen");
        close(g_metrics_fd);
        g_metrics_fd = -1;
        return;
    }

    g_metrics_run = 1;
    if (pthread_create(&g_metrics_thread, NULL, metrics_thread_fn, NULL) != 0) {
        perror("[METRICS] pthread_create");
        close(g_metrics_fd);
        g_metrics_fd = -1;
        g_metrics_run = 0;
        return;
    }
    pthread_detach(g_metrics_thread);

    fprintf(stderr, "[METRICS] Prometheus endpoint: http://127.0.0.1:%d/metrics\n", port);
}

void metrics_server_stop(void) {
    g_metrics_run = 0;
    if (g_metrics_fd >= 0) {
        shutdown(g_metrics_fd, SHUT_RDWR);
        close(g_metrics_fd);
        g_metrics_fd = -1;
    }
}
