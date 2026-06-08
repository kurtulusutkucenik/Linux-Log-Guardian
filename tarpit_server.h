/* tarpit_server.h — io_uring Aktif Tarpit Sunucusu
 *
 * Saldırganın bağlantısını kapatmadan, saniyede 1 byte HTTP fragment
 * göndererek tarama araçlarını (Nmap, Masscan, Zmap) sonsuz döngüye sokar.
 *
 * Mimari:
 *   - Ayrı thread'de çalışan io_uring tabanlı TCP sunucu (port: TARPIT_PORT)
 *   - Bağlantı başına TarpitConn nesnesi (max: TARPIT_MAX_CONNS)
 *   - IORING_OP_TIMEOUT(100ms) → IORING_OP_SEND(1 byte) zinciri
 *   - AF_XDP xsk_map: XDP programı hedef IP paketlerini bu porta REDIRECT eder
 */
#ifndef TARPIT_SERVER_H
#define TARPIT_SERVER_H

#include <stdint.h>
#include <netinet/in.h>

#define TARPIT_DEFAULT_PORT  9998   /* Tarpit TCP port (rules.conf ile değişir)  */
#define TARPIT_MAX_CONNS     8192   /* Eş zamanlı maksimum tuzak bağlantısı      */
#define TARPIT_BYTE_INTERVAL_MS 100 /* Her gönderim arası bekleme (ms)           */

/* Tekli tarpit bağlantı durumu */
typedef struct {
    int      fd;               /* Bağlantı socket fd (-1=boş)           */
    uint64_t next_send_ns;     /* Sonraki gönderim zamanı (CLOCK_MONO)  */
    uint8_t  phase;            /* HTTP fragment döngü fazı (0-7)        */
    char     peer_ip[46];      /* Saldırganın IP adresi                 */
    uint64_t bytes_sent;       /* Toplam gönderilen byte                */
    uint64_t connected_at_ns;  /* Bağlantı zamanı                       */
} TarpitConn;

/* ── API ──────────────────────────────────────────────────────────────── */

/* Tarpit sunucusunu başlat (arka plan thread).
 * port: 0 ise TARPIT_DEFAULT_PORT kullanılır.
 * xsk_map_fd: XDP'nin redirect map fd'i (>0 ise AF_XDP yönlendirme aktif) */
int  tarpit_server_start(uint16_t port, int xsk_map_fd);

/* Sunucuyu durdur ve tüm bağlantıları kapat */
void tarpit_server_stop(void);

/* Belirli bir IP'yi tarpit yönlendirme listesine ekle
 * (XDP xsk_map güncellenir, yeni paketler tarpit porta düşer) */
int  tarpit_server_redirect(const char *ip, uint8_t prefix);

/* IP'yi tarpit listesinden çıkar */
int  tarpit_server_unredirect(const char *ip, uint8_t prefix);

/* İstatistikler */
void tarpit_server_get_stats(uint64_t *active_conns,
                             uint64_t *total_trapped,
                             uint64_t *total_bytes);

#endif /* TARPIT_SERVER_H */
