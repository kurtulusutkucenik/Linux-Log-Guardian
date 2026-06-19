/* xdp_filter.c — eBPF/XDP Kernel-Space Paket Filtresi
 *
 * Derleme (CO-RE — Compile Once Run Everywhere):
 *   make vmlinux.h          # bpftool ile hedef çekirdek BTF'inden üret
 *   make xdp_filter.o       # Makefile otomatik yönetir
 *
 * CO-RE sayesinde hedef sunucunun kernel başlık dosyaları gerekmez.
 * BTF yoksa geleneksel linux/ başlıkları fallback olarak kullanılır.
 *
 * Gereksinim: Linux >= 5.2 (BTF), libbpf >= 0.8, clang >= 12
 */

/* CO-RE: gecerli vmlinux.h yoksa geleneksel basliklari kullan */
#ifdef __BPF_TRACING__
# if __has_include("vmlinux.h") && !defined(BPF_NO_VMLINUX)
#  include "vmlinux.h"
#  ifdef __VMLINUX_H__
#   define VMLINUX_LOADED 1
#  endif
# endif
#endif

#ifndef VMLINUX_LOADED
# include <linux/bpf.h>
# include <linux/if_ether.h>
# include <linux/ip.h>
# include <linux/ipv6.h>
# include <linux/in.h>
# include <linux/tcp.h>
#endif

/*
 * vmlinux.h struct tiplerini içerir ama ETH_P_* ve IPPROTO_* sabitleri
 * #define macro olduğundan BTF'e yansımaz. Bunları her iki modda da tanımla.
 */
#ifndef ETH_P_IP
# define ETH_P_IP   0x0800
#endif
#ifndef ETH_P_IPV6
# define ETH_P_IPV6 0x86DD
#endif
#ifndef IPPROTO_TCP
# define IPPROTO_TCP 6
#endif

#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
#include <bpf/bpf_core_read.h>
#include "pkt_inspector.h"

/* BPF Map: Ring Buffer - Supheli TCP payloadlarini userspace'e yollar */
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 256 * 1024); /* 256 KB ring buffer */
} xdp_ringbuf SEC(".maps");

/* BPF Map: IPv4 blacklist — LPM_TRIE tabanli CIDR subnet bloklama */
struct bpf_lpm_trie_key_v4 {
    __u32 prefixlen;
    __u32 ipv4_addr;
};

struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __uint(max_entries, 65536);
    __type(key, struct bpf_lpm_trie_key_v4);
    __type(value, __u8);    /* 1 = banli */
    __uint(map_flags, BPF_F_NO_PREALLOC);
} xdp_blacklist_v4 SEC(".maps");


/* BPF Map: IPv6 blacklist */
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 16384);
    __type(key,   __u8[16]);  /* 128-bit IPv6 */
    __type(value, __u8);
} xdp_blacklist_v6 SEC(".maps");

/* BPF Map: Tarpit Map — IP'yi anında düşürmek yerine yavaşlatır (Deception) */
struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __uint(max_entries, 65536);
    __type(key, struct bpf_lpm_trie_key_v4);
    __type(value, __u8);    /* Olasilik carpanı (1-100) */
    __uint(map_flags, BPF_F_NO_PREALLOC);
} xdp_tarpit_v4 SEC(".maps");

/* BPF Map: Per-CPU Token Bucket — burst-tolerant rate limiting */
struct token_bucket_val {
    __u64 tokens;        /* mevcut token sayisi      */
    __u64 last_refill;   /* son dolum zamani (ns)    */
};

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_HASH);
    __uint(max_entries, 32768);
    __type(key,   __u32);                 /* Kaynak IPv4              */
    __type(value, struct token_bucket_val);
} token_bucket_map SEC(".maps");

/* Token bucket parametreleri */
#define TB_CAPACITY    200   /* Maksimum token (burst izni)      */
#define TB_RATE_PER_NS 1     /* Ns basina kazan (=1M token/sn ~) */
#define TB_DRAIN       4     /* Her paket N token tuketir        */

/* BPF Map: TCP SYN / Port Scan takibi */
struct syn_entry {
    __u32 count;     /* SYN sayaci          */
    __u64 window_ts; /* Pencere baslangici  */
};

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_HASH);
    __uint(max_entries, 32768);
    __type(key,   __u32);
    __type(value, struct syn_entry);
} port_scan_map SEC(".maps");

/* İstatistik sayaçları (per-CPU, false-sharing yok) */
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 6);
    __type(key,   __u32);
    __type(value, __u64);
} xdp_stats SEC(".maps");

#define STAT_PASS      0
#define STAT_DROP      1
#define STAT_TB_DROP   2   /* Token bucket limit */
#define STAT_UDP_AMP   3   /* UDP amplification  */
#define STAT_TARPIT    4   /* Tarpit oyalaması   */
#define STAT_RINGBUF_DROP 5 /* Ring buffer dolu   */

#ifndef ETH_ALEN
# define ETH_ALEN 6
#endif

static __always_inline void bump_stat(__u32 idx) {
    __u64 *val = bpf_map_lookup_elem(&xdp_stats, &idx);
    if (val) __sync_fetch_and_add(val, 1);
}

static __always_inline int clamp_tcp_window(struct xdp_md *ctx, struct ethhdr *eth, struct iphdr *iph, struct tcphdr *th, void *data_end) {
    /* Ethernet MAC Swap */
    unsigned char tmp_mac[ETH_ALEN];
    __builtin_memcpy(tmp_mac, eth->h_source, ETH_ALEN);
    __builtin_memcpy(eth->h_source, eth->h_dest, ETH_ALEN);
    __builtin_memcpy(eth->h_dest, tmp_mac, ETH_ALEN);

    /* IP Swap */
    __u32 tmp_ip = iph->saddr;
    iph->saddr = iph->daddr;
    iph->daddr = tmp_ip;

    /* TCP Port Swap */
    __u16 tmp_port = th->source;
    th->source = th->dest;
    th->dest = tmp_port;

    /* Set TCP Seq & Ack */
    __u32 old_seq = bpf_ntohl(th->seq);
    __u32 old_ack = bpf_ntohl(th->ack_seq);
    
    th->seq = bpf_htonl(old_ack);
    /* Acknowledge at least 1 byte if SYN or data packet */
    th->ack_seq = bpf_htonl(old_seq + 1);

    /* Rewrite TCP Window to 0 (Clamp) */
    th->window = bpf_htons(0);

    /* Set TCP flags to ACK (and ACK only to force a window update) */
    th->ack = 1;
    th->syn = 0;
    th->psh = 0;
    th->fin = 0;
    th->rst = 0;
    th->urg = 0;

    /* Adjust packet length to exclude any payload (Tarpit Window Update has no payload) */
    __u16 ip_hlen = iph->ihl * 4;
    __u16 tcp_hlen = th->doff * 4;
    __u16 current_tot_len = bpf_ntohs(iph->tot_len);
    __u16 new_tot_len = ip_hlen + tcp_hlen;
    
    int shrink_len = current_tot_len - new_tot_len;
    if (shrink_len > 0) {
        if (bpf_xdp_adjust_tail(ctx, -shrink_len) < 0) {
            /* If we can't shrink, we still proceed */
        }
    }

    iph->tot_len = bpf_htons(new_tot_len);

    /* Recalculate IP Checksum */
    iph->check = 0;
    __u32 ip_csum = 0;
    __u16 *ip_u16 = (__u16 *)iph;
    #pragma clang loop unroll(full)
    for (int i = 0; i < 10; i++) {
        if ((void *)&ip_u16[i + 1] > data_end)
            break;
        ip_csum += bpf_ntohs(ip_u16[i]);
    }
    while (ip_csum >> 16) {
        ip_csum = (ip_csum & 0xffff) + (ip_csum >> 16);
    }
    iph->check = bpf_htons(~ip_csum);

    /* Recalculate TCP Checksum over Pseudo-header + TCP header (no payload) */
    th->check = 0;
    __u32 tcp_csum = 0;

    /* Pseudo-Header */
    tcp_csum += bpf_ntohs(iph->saddr & 0xffff);
    tcp_csum += bpf_ntohs(iph->saddr >> 16);
    tcp_csum += bpf_ntohs(iph->daddr & 0xffff);
    tcp_csum += bpf_ntohs(iph->daddr >> 16);
    tcp_csum += IPPROTO_TCP;
    tcp_csum += tcp_hlen;

    /* TCP Header */
    __u16 *tcp_u16 = (__u16 *)th;
    #pragma clang loop unroll(full)
    for (int i = 0; i < 30; i++) {
        if ((void *)&tcp_u16[i + 1] > data_end)
            break;
        if (i * 2 >= tcp_hlen)
            break;
        tcp_csum += bpf_ntohs(tcp_u16[i]);
    }

    while (tcp_csum >> 16) {
        tcp_csum = (tcp_csum & 0xffff) + (tcp_csum >> 16);
    }
    th->check = bpf_htons(~tcp_csum);

    return XDP_TX;
}

SEC("xdp")
int xdp_waf_filter(struct xdp_md *ctx) {
    void *data     = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;

    /* Ethernet başlığı sınır kontrolü */
    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end) goto pass;

    __u16 proto = bpf_ntohs(eth->h_proto);

    /* IPv4 */
    if (proto == ETH_P_IP) {
        struct iphdr *iph = (struct iphdr *)(eth + 1);
        if ((void *)(iph + 1) > data_end) goto pass;

        __u32 src = iph->saddr;  /* network byte-order */
        
        struct bpf_lpm_trie_key_v4 key = {
            .prefixlen = 32, // Tam eslesme, trie alt subnetleri kendi bulur
            .ipv4_addr = src
        };
        __u8 *blocked = bpf_map_lookup_elem(&xdp_blacklist_v4, &key);
        if (blocked && *blocked == 1) {
            bump_stat(STAT_DROP);
            return XDP_DROP;
        }

        /* ── Active Cyber Deception (Tarpit) ── */
        __u8 *tarpit_prob = bpf_map_lookup_elem(&xdp_tarpit_v4, &key);
        if (tarpit_prob && *tarpit_prob > 0) {
            if (iph->protocol == IPPROTO_TCP) {
                struct tcphdr *th = (struct tcphdr *)(iph + 1);
                if ((void *)(th + 1) <= data_end) {
                    __u32 rand = bpf_get_prandom_u32() % 100;
                    if (rand < *tarpit_prob) {
                        bump_stat(STAT_TARPIT);
                        return clamp_tcp_window(ctx, eth, iph, th, data_end);
                    }
                }
            } else {
                __u32 rand = bpf_get_prandom_u32() % 100;
                if (rand < *tarpit_prob) {
                    bump_stat(STAT_TARPIT);
                    return XDP_DROP;
                }
            }
        }

        /* TCP SYN Flood & Port Scan Tespiti */
        if (iph->protocol == IPPROTO_TCP) {
            struct tcphdr *th = (struct tcphdr *)(iph + 1);
            if ((void *)(th + 1) > data_end) goto pass;

            /* Sadece SYN bayrağı olan paketler (yeni bağlantı istekleri) */
            if (th->syn && !th->ack) {
                __u64 now_ns = bpf_ktime_get_ns();
                struct syn_entry *se = bpf_map_lookup_elem(&port_scan_map, &src);
                if (se) {
                    /* 1 saniyelik pencere: eski sayaci sifirla */
                    if (now_ns - se->window_ts > 1000000000ULL) {
                        se->count      = 1;
                        se->window_ts  = now_ns;
                    } else {
                        se->count++;
                        /* Saniyede 50+ SYN: kernel ici ban */
                        if (se->count > 50) {
                            __u8 ban = 1;
                            struct bpf_lpm_trie_key_v4 bkey = {
                                .prefixlen = 32, .ipv4_addr = src };
                            bpf_map_update_elem(&xdp_blacklist_v4, &bkey, &ban, BPF_ANY);
                            bump_stat(STAT_DROP);
                            return XDP_DROP;
                        }
                    }
                } else {
                    struct syn_entry init = { .count = 1, .window_ts = now_ns };
                    bpf_map_update_elem(&port_scan_map, &src, &init, BPF_ANY);
                }
            }

            /* Token Bucket: HTTP/HTTPS icin per-IP rate limiting */
            __u16 dest_port = bpf_ntohs(th->dest);
            if (dest_port == 80 || dest_port == 443) {
                __u64 now_ns = bpf_ktime_get_ns();
                struct token_bucket_val *tb =
                    bpf_map_lookup_elem(&token_bucket_map, &src);
                if (tb) {
                    /* Token dolumu: gecen sure * rate */
                    __u64 elapsed = now_ns - tb->last_refill;
                    __u64 new_tok = elapsed * TB_RATE_PER_NS;
                    tb->tokens += new_tok;
                    if (tb->tokens > TB_CAPACITY) tb->tokens = TB_CAPACITY;
                    tb->last_refill = now_ns;
                    /* Token tukendiyse drop */
                    if (tb->tokens < TB_DRAIN) {
                        bump_stat(STAT_TB_DROP);
                        return XDP_DROP;
                    }
                    tb->tokens -= TB_DRAIN;
                } else {
                    struct token_bucket_val init_tb = {
                        .tokens = TB_CAPACITY - TB_DRAIN,
                        .last_refill = now_ns
                    };
                    bpf_map_update_elem(&token_bucket_map, &src, &init_tb, BPF_ANY);
                }
                /* th boyutu, th->doff * 4 */
                __u16 tcp_hlen = th->doff * 4;
                void *payload = (void *)th + tcp_hlen;
                
                if (payload < data_end) {
                    __u16 len = data_end - payload;
                    if (len > 0) {
                        /* Sadece PUSH+ACK veya veri iceren paketler (boyut > 10 bayt ise genelde anlamlidir) */
                        if (len > 10) {
                            /* TLS Client Hello kontrolu: 0x16 0x03 */
                            __u8 is_tls = 0;
                            __u8 *p = (__u8 *)payload;
                            if (dest_port == 443 && len > 5) {
                                if (p[0] == 0x16 && p[1] == 0x03 && p[5] == 0x01) {
                                    is_tls = 1;
                                }
                            }
                            
                            struct pkt_event *evt = bpf_ringbuf_reserve(&xdp_ringbuf, sizeof(*evt), 0);
                            if (evt) {
                                evt->src_ip = src;
                                evt->payload_len = (len > PKT_PAYLOAD_SIZE) ? PKT_PAYLOAD_SIZE : len;
                                evt->is_tls_hello = is_tls;
                                evt->dst_port = (dest_port == 443) ? 443 : 80;
                                /* Veriyi kernel boslugundan xdp ringbuf uzerine kopyala */
                                bpf_probe_read_kernel(evt->payload, evt->payload_len, payload);
                                bpf_ringbuf_submit(evt, 0);
                            } else {
                                bump_stat(STAT_RINGBUF_DROP);
                            }
                        }
                    }
                }
            }
        }
    }
    /* IPv6 */
    else if (proto == ETH_P_IPV6) {
        struct ipv6hdr *ip6h = (struct ipv6hdr *)(eth + 1);
        if ((void *)(ip6h + 1) > data_end) goto pass;

        __u8 *blocked = bpf_map_lookup_elem(&xdp_blacklist_v6, &ip6h->saddr);
        if (blocked && *blocked == 1) {
            bump_stat(STAT_DROP);
            return XDP_DROP;
        }
    }

pass:
    bump_stat(STAT_PASS);
    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";
