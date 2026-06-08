#ifndef PKT_INSPECTOR_H
#define PKT_INSPECTOR_H

/* XDP Ring Buffer Event Yapisi
 * BPF katmanından userspace'e payload yollamak icin.
 *
 * is_tls_hello=1 → payload, TLS Client Hello baytlarini icerir.
 * ja3_engine.c bu baytlari parse ederek JA3/JA4 hash'ini uretir.
 */

#define PKT_PAYLOAD_SIZE 256   /* 128 → 256: TLS Client Hello icin yeterli */

struct pkt_event {
    unsigned int   src_ip;          /* IPv4 network-byte-order */
    unsigned short payload_len;
    unsigned char  is_tls_hello;    /* 1 = TLS Client Hello, 0 = diger */
    unsigned short dst_port;         /* Hedef port (80 veya 443) */
    unsigned char  payload[PKT_PAYLOAD_SIZE];
};

#endif /* PKT_INSPECTOR_H */
