/* mesh_intel.h — Global Mesh Tehdit İstihbaratı (ZeroMQ Pub/Sub)
 *
 * Cloudflare'in global IP ban sisteminin açık kaynak eşdeğeri.
 *
 * Mimari:
 *   PUB (Sunucu A tespit) -> tcp://IFACE:5556
 *       ↓ ZeroMQ PUSH/PULL veya PUB/SUB
 *   SUB (B, C, D sunucular) → daemon_ipc_ban_*() → XDP map
 *
 * Mesaj formatı (binary pack, 256 byte sabit):
 *   [MeshThreatEvent struct]
 *
 * Güvenlik: CURVE şifrelemesi veya TLS proxy (stunnel/nginx) önerilir.
 *            Bu modül şifreleme katmanını uygulama dışında bırakır.
 */
#ifndef MESH_INTEL_H
#define MESH_INTEL_H

#include <stdint.h>

/* ── Tehdit Olayı Yapısı (256 byte sabit, wire-format) ──────────────────── */
#define MESH_TOPIC "GUARDIAN.THREAT"  /* ZeroMQ topic filtresi */

typedef struct __attribute__((packed)) {
    char     ip[46];            /* Tehdit IP'si                               */
    uint8_t  prefix;            /* CIDR prefix (0=host /32)                   */
    uint8_t  action;            /* 0=ban, 1=tarpit, 2=watch, 3=unban          */
    uint32_t threat_score;      /* 0-1000 arası normalleştirilmiş skor        */
    char     mitre_tactic[16];  /* "T1190", "T1059", "T1071" vb.             */
    char     mitre_technique[8];/* "001", "003" vb. alt-teknik                */
    uint64_t timestamp_ns;      /* Unix epoch nanosaniye                      */
    char     source_agent[48];  /* "guardian-a.example.com" kimliği          */
    char     reason[80];        /* Kısa açıklama ("SQLi pattern", "APT swarm")*/
    uint8_t  _pad[16];          /* Gelecek kullanım için alan                 */
} MeshThreatEvent;   /* = 256 byte */

/* ── İstatistikler ─────────────────────────────────────────────────────── */
typedef struct {
    uint64_t pub_sent;          /* Yayınlanan event sayısı      */
    uint64_t sub_received;      /* Alınan event sayısı          */
    uint64_t sub_applied;       /* XDP'ye yazılan ban sayısı    */
    uint64_t sub_errors;        /* Parse / IPC hata sayısı      */
    uint32_t connected_peers;   /* SUB bağlı node sayısı        */
} MeshStats;

/* ── Publisher API (Tespit eden sunucu) ────────────────────────────────── */

/* PUB socket'i başlat ve bağla.
 * bind_addr ornek: "tcp://0.0.0.0:5556"
 * Dönüş: 0=başarı, -1=hata */
int  mesh_intel_init_pub(const char *bind_addr);

/* Tehdit event'ini tüm subscriber'lara yayınla */
void mesh_intel_publish(const MeshThreatEvent *ev);

/* Publisher'ı durdur */
void mesh_intel_pub_stop(void);

/* ── Subscriber API (Dinleyen sunucular) ───────────────────────────────── */

/* SUB socket başlat ve bağlan; arka plan thread'i tetikler.
 * connect_addr örn: "tcp://hub.example.com:5556"
 * Dönüş: 0=başarı, -1=hata */
int  mesh_intel_init_sub(const char *connect_addr);

/* Subscriber'ı durdur */
void mesh_intel_sub_stop(void);

/* ── Yardımcı fonksiyonlar ─────────────────────────────────────────────── */

/* Alert → MeshThreatEvent dönüştürücü (anomaly.c kullanır) */
void mesh_intel_fill_from_ip(MeshThreatEvent *ev,
                             const char *ip, uint8_t prefix,
                             uint32_t threat_score,
                             const char *mitre_tactic,
                             const char *reason);

/* Güncel istatistikleri doldur */
void mesh_intel_get_stats(MeshStats *out);

#endif /* MESH_INTEL_H */
