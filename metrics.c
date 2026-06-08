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
#include <liburing.h>

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

static void write_all(int fd, const char *buf, size_t len) {
    while (len > 0) {
        ssize_t n = write(fd, buf, len);
        if (n <= 0) break;
        buf += n;
        len -= (size_t)n;
    }
}

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
        "loganalyzer_webhook_telegram_batch_sec{tenant_id=\"%s\"} %ld\n",
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
        g_tenant_label, s->webhook_sent,
        g_tenant_label, s->webhook_fail,
        g_tenant_label, s->webhook_queue_drops,
        g_tenant_label, s->webhook_queue_depth,
        g_tenant_label, s->webhook_telegram_route,
        g_tenant_label, s->webhook_telegram_batch_sec);
}

static void handle_client(int cfd) {
    /* İsteği oku (basit HTTP/1.1 GET — tam parse gerekmez) */
    char req[512];
    ssize_t n = read(cfd, req, sizeof(req) - 1);
    if (n <= 0) { close(cfd); return; }
    req[n] = '\0';

    /* Sadece GET /metrics desteklenir */
    int is_metrics = (strncmp(req, "GET /metrics", 12) == 0);

    char body[8192];
    int blen = 0;

    if (is_metrics) {
        MetricsSnapshot s;
        pthread_mutex_lock(&g_snap_lock);
        s = g_snap;
        pthread_mutex_unlock(&g_snap_lock);
        webhook_metrics_snapshot(&s.webhook_sent, &s.webhook_fail,
                                 &s.webhook_queue_drops, &s.webhook_queue_depth);
        webhook_config_metrics(&s.webhook_telegram_route, &s.webhook_telegram_batch_sec);

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

/* ── io_uring sunucu döngüsü ─────────────────────────────────────── */

#define METRICS_URING_DEPTH  32

/* Her bağlantı için taşınan bağlam */
typedef struct {
    int     fd;
    int     phase;      /* 0=read, 1=write_header, 2=write_body */
    char    req[512];
    char    body[8192];
    char    header[256];
    int     blen;
    int     hlen;
} MetricsCtx;

static void metrics_build_response(MetricsCtx *ctx) {
    ctx->req[511] = '\0';
    int is_metrics = (strncmp(ctx->req, "GET /metrics", 12) == 0);

    if (is_metrics) {
        MetricsSnapshot s;
        pthread_mutex_lock(&g_snap_lock);
        s = g_snap;
        pthread_mutex_unlock(&g_snap_lock);
        webhook_metrics_snapshot(&s.webhook_sent, &s.webhook_fail,
                                 &s.webhook_queue_drops, &s.webhook_queue_depth);
        webhook_config_metrics(&s.webhook_telegram_route, &s.webhook_telegram_batch_sec);

        ctx->blen = metrics_format_prometheus(ctx->body, sizeof(ctx->body), &s);
    } else {
        ctx->blen = snprintf(ctx->body, sizeof(ctx->body),
            "404 Not Found\nEndpoint: /metrics\n");
    }

    ctx->hlen = snprintf(ctx->header, sizeof(ctx->header),
        "HTTP/1.1 %s\r\n"
        "Content-Type: text/plain; version=0.0.4; charset=utf-8\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n\r\n",
        is_metrics ? "200 OK" : "404 Not Found", ctx->blen);
}

static void *metrics_thread_fn(void *arg) {
    (void)arg;

    struct io_uring ring;
    if (io_uring_queue_init(METRICS_URING_DEPTH, &ring, 0) < 0) {
        /* io_uring yok: klasik accept döngüsüne düş */
        while (g_metrics_run) {
            struct sockaddr_in ca;
            socklen_t clen = sizeof(ca);
            int cfd = accept(g_metrics_fd, (struct sockaddr *)&ca, &clen);
            if (cfd < 0) {
                if (errno == EINTR || errno == EAGAIN) continue;
                break;
            }
            handle_client(cfd);
        }
        return NULL;
    }

    /* İlk ACCEPT SQE */
    {
        struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
        struct sockaddr_in ca;
        socklen_t clen = sizeof(ca);
        io_uring_prep_accept(sqe, g_metrics_fd,
                             (struct sockaddr *)&ca, &clen, 0);
        io_uring_sqe_set_data(sqe, NULL);   /* NULL → accept token */
        io_uring_submit(&ring);
    }

    while (g_metrics_run) {
        struct io_uring_cqe *cqe;
        struct __kernel_timespec ts = { .tv_sec = 1, .tv_nsec = 0 };
        int ret = io_uring_wait_cqe_timeout(&ring, &cqe, &ts);
        if (ret == -ETIME) continue;
        if (ret < 0)  break;

        MetricsCtx *ctx = (MetricsCtx *)io_uring_cqe_get_data(cqe);
        int res         = cqe->res;
        io_uring_cqe_seen(&ring, cqe);

        if (ctx == NULL) {
            /* ACCEPT tamamlandi */
            if (res < 0) {
                if (res != -EINTR) break;
            } else {
                /* Yeni bağlantı: READ SQE */
                MetricsCtx *nc = malloc(sizeof(*nc));
                if (nc) {
                    memset(nc, 0, sizeof(*nc));
                    nc->fd    = res;
                    nc->phase = 0;
                    struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                    io_uring_prep_read(sqe, nc->fd, nc->req,
                                       sizeof(nc->req) - 1, 0);
                    io_uring_sqe_set_data(sqe, nc);
                    io_uring_submit(&ring);
                } else {
                    close(res);
                }
            }

            if (!g_metrics_run) break;

            /* Yeni ACCEPT SQE */
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            struct sockaddr_in ca;
            socklen_t clen = sizeof(ca);
            io_uring_prep_accept(sqe, g_metrics_fd,
                                 (struct sockaddr *)&ca, &clen, 0);
            io_uring_sqe_set_data(sqe, NULL);
            io_uring_submit(&ring);

        } else if (ctx->phase == 0) {
            /* READ tamamlandi */
            if (res > 0) metrics_build_response(ctx);
            ctx->phase = 1;
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_write(sqe, ctx->fd, ctx->header,
                                (unsigned)ctx->hlen, 0);
            io_uring_sqe_set_data(sqe, ctx);
            io_uring_submit(&ring);

        } else if (ctx->phase == 1) {
            /* Header yazıldı: body yaz */
            ctx->phase = 2;
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_write(sqe, ctx->fd, ctx->body,
                                (unsigned)ctx->blen, 0);
            io_uring_sqe_set_data(sqe, ctx);
            io_uring_submit(&ring);

        } else {
            /* Body yazıldı: bağlantıyı kapat */
            close(ctx->fd);
            free(ctx);
        }
    }

    io_uring_queue_exit(&ring);
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
