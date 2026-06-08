#ifndef XDP_LOADER_H
#define XDP_LOADER_H

#include <stdint.h>

/*
 * xdp_loader: libbpf tabanlı userspace yükleyici.
 * xdp_filter.o'yu kernel'e yükler, NIC'e attach eder,
 * BPF map'lere IP ekler/çıkarır.
 *
 * Gereksinim: libbpf-dev, root yetkisi, kernel >= 4.8
 */

/* XDP programını yükle ve ifindex numaralı NIC'e bağla.
 * obj_path:    "xdp_filter.o"
 * ifname:      "eth0" gibi ağ arayüzü adı
 * map_v4_size: IPv4 blacklist haritası kapasitesi (0 → varsayılan 65536)
 * map_v6_size: IPv6 blacklist haritası kapasitesi (0 → varsayılan 16384)
 * Dönüş: 0 başarı, -1 hata */
int  xdp_loader_init(const char *obj_path, const char *ifname,
                     int map_v4_size, int map_v6_size);

/* IPv4 adresini BPF blacklist map'e ekle (network byte-order dönüşümü otomatik) */
int  xdp_ban_ipv4(const char *ip_str);

/* IPv6 adresini BPF blacklist map'e ekle */
int  xdp_ban_ipv6(const char *ip_str);

/* IP'yi map'ten sil (unban) */
int  xdp_unban_ipv4(const char *ip_str);
int  xdp_unban_ipv6(const char *ip_str);

/* XDP programını NIC'ten ayır ve kapat */
void xdp_loader_destroy(void);

/* XDP aktif mi? (loader başarılı init sonrası 1) */
int  xdp_loader_active(void);

/* BPF Ring Buffer dosya tanimlayicisi (FD) dondurur */
int  xdp_loader_get_ringbuf_fd(void);

/* XDP istatistiklerini dondurur (index -> stat_out) */
int  xdp_loader_get_stats(uint32_t stat_idx, uint64_t *stat_out);

/* Dynamic Map Resizing Callback kaydetme */
void xdp_loader_register_resize_cb(void (*cb)(void));

#endif /* XDP_LOADER_H */
