#ifndef METRICS_H
#define METRICS_H

/*
 * metrics.h — Prometheus /metrics HTTP Endpoint
 *
 * Loopback-only (127.0.0.1) minimal HTTP sunucu.
 * GET /metrics → tüm atomik sayaçları Prometheus text formatında döndürür.
 * Dış bağımlılık yok (libmicrohttpd gereksiz).
 */

/* Sunucuyu arka planda başlat (pthread); port 0 ise devre dışı */
void metrics_server_start(int port);

/* Sunucuyu durdur ve kaynakları serbest bırak */
void metrics_server_stop(void);

/* Prometheus endpoint'e yazılacak sayaçları güncelle (main.c atomik değişkenlerinden) */
typedef struct {
    long total_lines;
    long parse_errors;
    long total_bytes;
    long alerts_total;
    long ban_success;
    long ban_fail;
    long cnt_get;
    long cnt_post;
    long cnt_put;
    long cnt_delete;
    long cnt_other;
    long cnt_2xx;
    long cnt_3xx;
    long cnt_4xx;
    long cnt_5xx;
    long unique_ips;
    double eps;
    double eps_peak;
    long xdp_active;
    long ringbuf_drops;
    /* ── Intelligence Engine Metrikleri ── */
    long ja3_total;       /* Toplam JA3 parmak izi sayısı          */
    long ja3_c2;          /* C2 araç eşleşmesi sayısı              */
    long apt_clusters;    /* Aktif APT küme sayısı                 */
    long apt_detections;  /* APT tespit alarmı sayısı              */
    long covert_hits;     /* Covert channel tespit sayısı          */
    long honey_traps;     /* Honey-credential tuzak tetiklemesi    */
    /* ── Threat intel + FP learn + ban pipeline (Grafana SOC) ── */
    long threat_last_sync_ts;   /* Unix ts — son threat feed sync    */
    long threat_total_iocs;     /* Toplam IOC sayisi                 */
    long threat_last_applied;   /* Son sync'te uygulanan IOC         */
    long threat_last_failed;    /* Son sync'te basarisiz IOC         */
    long threat_feed_enabled;   /* 1=acik                          */
    long fp_trusted_ips;        /* FP_LEARN guvenilir IP             */
    long fp_partial_ips;        /* Kismi guven                      */
    long fp_learn_enabled;      /* 1=FP_LEARN acik                   */
    long fp_suppressed_total;   /* Bastirilan alarm                */
    long ban_pipeline_ipc;      /* Ban yolu: IPC→XDP                 */
    long ban_pipeline_xdp;      /* Ban yolu: XDP direct              */
    long ban_pipeline_ipset;    /* Ban yolu: ipset                   */
    long ban_pipeline_failed;   /* Ban basarisiz                     */
    long ja3_clusters_active;   /* Aktif UA/JA3 cluster bucket      */
    long ja3_cluster_bans_total;/* Cluster flush ile ban sayisi     */
    long dist_risk_buckets_active;   /* DIST_RISK aktif bucket (ip>=2) */
    long dist_risk_bonus_applied;    /* Risk bonus uygulama sayisi     */
    long dist_risk_observe_total;    /* dist_risk_observe cagri sayisi   */
    long dist_risk_enabled;          /* 1=DIST_RISK acik                 */
    long webhook_sent;          /* Webhook basarili gonderim        */
    long webhook_fail;          /* Webhook HTTP/curl hatasi         */
    long webhook_queue_drops;   /* Async kuyruk dolu — atilan       */
    long webhook_queue_depth;   /* Anlik kuyruk derinligi           */
    long webhook_telegram_route; /* 1=CRIT/WARN ayri hedef          */
    long webhook_telegram_batch_sec; /* WARN/INFO ozet penceresi    */
    long telegram_ack_24h;       /* Son 24s Telegram onay sayisi   */
    long telegram_unacked_24h;   /* Onay bekleyen alarm/ban (24s)  */
    long webhook_quiet_enabled;  /* WEBHOOK_QUIET_HOURS ayarli     */
    long webhook_quiet_active;   /* Simdi sessiz pencerede mi      */
    long api_requests_total;     /* REST API istek sayisi          */
    long api_auth_fail_total;    /* API 403 (token yok/hatali)     */
    long api_rate_limited_total; /* API 429 rate limit             */
    long ban_events_total;       /* SQLite ban_events satir sayisi */
    long intel_ban_legacy_rows;  /* threat-intel legacy (beklenen 0) */
    long intel_ban_summary_rows; /* threat-intel-summary ozet satirlari */
} MetricsSnapshot;

/* main.c bu fonksiyonu çağırarak anlık sayaçları metrics modülüne iletir */
void metrics_update(const MetricsSnapshot *snap);

/* FP store yuklendikten sonra — log satiri beklemeden gauge yayinla */
void metrics_refresh_fp_trust(long trusted, long partial, long enabled, long suppressed);

/* Telegram inline Gördüm sonrasi — Prometheus gauge aninda guncelle */
void metrics_refresh_telegram_ack(long ack_24h, long unacked_24h);

/* Prometheus label: tenant_id (rules.conf TENANT_ID) */
void metrics_set_tenant_id(const char *tenant_id);

#endif /* METRICS_H */
