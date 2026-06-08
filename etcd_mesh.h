/* etcd_mesh.h — Dağıtık Mesh İstihbaratı: Etcd v3 HTTP API Entegrasyonu
 *
 * Enterprise alternatifi: ZeroMQ PUB/SUB yerine Etcd v3 gRPC-Gateway (HTTP/JSON)
 * üzerinden ban/unban istatistikleri cluster genelinde senkronize edilir.
 *
 * Mimari (Cilium benzeri):
 *   Ajan A ban atar  → PUT /v3/kv/put → Etcd cluster
 *   Ajan B/C/D/...   → POST /v3/watch → değişikliği alır → XDP map'e uygular
 *
 * Derleme: -DHAVE_ETCD -lcurl
 * Gereksinim: libcurl >= 7.62, etcd >= 3.4
 */
#pragma once

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stddef.h>

/* ── Sabitler ──────────────────────────────────────────────────────── */
#define ETCD_MESH_MAX_ENDPOINTS   8     /* Kaç endpoint deneneceği (HA) */
#define ETCD_MESH_KEY_PREFIX      "/mesh/bans"
#define ETCD_MESH_ENDPOINT_MAXLEN 256
#define ETCD_MESH_TTL_DEFAULT_SEC 600   /* Ban TTL süresi (saniye) */
#define ETCD_MESH_WATCH_TIMEOUT   30    /* Long-poll timeout (saniye)  */
#define ETCD_MESH_RECONNECT_MS    2000  /* Bağlantı kopunca bekleme    */

/* ── Konfigürasyon ─────────────────────────────────────────────────── */
typedef struct {
    /* Noktalı virgülle ayrılmış endpoint listesi:
     * "http://127.0.0.1:2379;http://etcd2:2379;http://etcd3:2379" */
    char   endpoints[ETCD_MESH_ENDPOINT_MAXLEN];

    /* Tenant isolasyonu: Key prefix'e eklenir (/mesh/bans/{tenant_id}/...) */
    char   tenant_id[128];

    /* ETCD_MESH_TTL_DEFAULT_SEC üzerine yazabilir */
    int    ttl_sec;

    /* 0 = pub+watch, 1 = sadece pub, 2 = sadece watch */
    int    mode;

    /* Etcd'ye hangi seviyeden itibaren ban yayınlansın (0=hepsi) */
    int    min_threat_score;
} EtcdMeshConfig;

/* ── İstatistikler ─────────────────────────────────────────────────── */
typedef struct {
    uint64_t pub_sent;      /* Başarıyla Etcd'ye yazılan ban sayısı   */
    uint64_t watch_recv;    /* Etcd watch'tan alınan event sayısı      */
    uint64_t watch_applied; /* Başarıyla XDP map'e uygulanan ban       */
    uint64_t errors;        /* HTTP / JSON parse hataları              */
    uint64_t reconnects;    /* Watch thread yeniden bağlanma sayısı    */
} EtcdMeshStats;

/* ── API ───────────────────────────────────────────────────────────── */

/**
 * etcd_mesh_init - Modülü başlatır, watch thread'ini çalıştırır.
 * @cfg: Konfigürasyon pointer'ı (ömrü boyunca geçerli olmalı)
 * Dönüş: 0 başarı, -1 hata (HAVE_ETCD olmadan da -1 döner)
 */
int  etcd_mesh_init(const EtcdMeshConfig *cfg);

/**
 * etcd_mesh_publish - Bir IP ban'ını Etcd'ye yazar (TTL ile).
 * @ip:           Banlanacak IP adresi (IPv4 veya IPv6 string)
 * @threat_score: 0–100 arası tehdit skoru
 * @mitre_tactic: MITRE ATT&CK taktik string'i (NULL olabilir)
 * @reason:       Kısa açıklama (NULL olabilir)
 * Dönüş: 0 başarı, -1 hata
 */
int  etcd_mesh_publish(const char *ip,
                        uint32_t    threat_score,
                        const char *mitre_tactic,
                        const char *reason);

/**
 * etcd_mesh_stop - Watch thread'ini durdurur, kaynakları serbest bırakır.
 */
void etcd_mesh_stop(void);

/**
 * etcd_mesh_get_stats - Anlık istatistikleri doldurur.
 */
void etcd_mesh_get_stats(EtcdMeshStats *out);

/**
 * etcd_mesh_active - Modül başarıyla başlatıldıysa 1 döner.
 */
int  etcd_mesh_active(void);

#ifdef __cplusplus
}
#endif
