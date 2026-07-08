/* xdp_filter_min.c — VPS / strict kernel verifier: blacklist-only XDP
 * Program adi: xdp_waf_filter (daemon ile uyumlu)
 * Derleme: XDP_MINIMAL=1 make xdp_filter.o
 */
#ifndef VMLINUX_LOADED
# include <linux/bpf.h>
# include <linux/if_ether.h>
# include <linux/ip.h>
# include <linux/ipv6.h>
# include <linux/in.h>
#endif

#ifndef ETH_P_IP
# define ETH_P_IP 0x0800
#endif
#ifndef ETH_P_IPV6
# define ETH_P_IPV6 0x86DD
#endif

#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>

struct bpf_lpm_trie_key_v4 {
    __u32 prefixlen;
    __u32 ipv4_addr;
};

struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __uint(max_entries, 65536);
    __type(key, struct bpf_lpm_trie_key_v4);
    __type(value, __u8);
    __uint(map_flags, BPF_F_NO_PREALLOC);
} xdp_blacklist_v4 SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __uint(max_entries, 16384);
    __type(key, __u8[16]);
    __type(value, __u8);
} xdp_blacklist_v6 SEC(".maps");

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 2);
    __type(key, __u32);
    __type(value, __u64);
} xdp_stats SEC(".maps");

#define STAT_PASS 0
#define STAT_DROP 1

static __always_inline void bump_stat(__u32 idx) {
    __u64 *val = bpf_map_lookup_elem(&xdp_stats, &idx);
    if (val)
        __sync_fetch_and_add(val, 1);
}

SEC("xdp")
int xdp_waf_filter(struct xdp_md *ctx) {
    void *data     = (void *)(long)ctx->data;
    void *data_end = (void *)(long)ctx->data_end;

    struct ethhdr *eth = data;
    if ((void *)(eth + 1) > data_end)
        return XDP_PASS;

    __u16 proto = bpf_ntohs(eth->h_proto);

    if (proto == ETH_P_IP) {
        struct iphdr *iph = (void *)(eth + 1);
        if ((void *)(iph + 1) > data_end)
            return XDP_PASS;

        struct bpf_lpm_trie_key_v4 key = {
            .prefixlen = 32,
            .ipv4_addr = iph->saddr,
        };
        __u8 *blocked = bpf_map_lookup_elem(&xdp_blacklist_v4, &key);
        if (blocked && *blocked == 1) {
            bump_stat(STAT_DROP);
            return XDP_DROP;
        }
    } else if (proto == ETH_P_IPV6) {
        struct ipv6hdr *ip6h = (void *)(eth + 1);
        if ((void *)(ip6h + 1) > data_end)
            return XDP_PASS;

        __u8 *blocked = bpf_map_lookup_elem(&xdp_blacklist_v6, &ip6h->saddr);
        if (blocked && *blocked == 1) {
            bump_stat(STAT_DROP);
            return XDP_DROP;
        }
    }

    bump_stat(STAT_PASS);
    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";
