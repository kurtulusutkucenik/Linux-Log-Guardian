#include "xdp_loader.h"
#include "logger.h"
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <arpa/inet.h>
#include <sys/stat.h>
#include <sys/types.h>

#ifdef HAVE_LIBBPF
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include <net/if.h>
#include <linux/if_link.h>

static struct bpf_object *g_obj        = NULL;
static int                g_prog_fd    = -1;
static int                g_ifindex    = 0;
static int                g_map_v4_fd  = -1;
static int                g_map_v6_fd  = -1;
static int                g_stats_fd   = -1;
static int                g_active     = 0;

static int                g_ringbuf_fd = -1;

int xdp_loader_init(const char *obj_path, const char *ifname,
                    int map_v4_size, int map_v6_size) {
    g_ifindex = (int)if_nametoindex(ifname);
    if (g_ifindex == 0) {
        log_rl(LOG_ERR, "[XDP] Arayuz bulunamadi: %s", ifname);
        return -1;
    }

    g_obj = bpf_object__open_file(obj_path, NULL);
    if (!g_obj || libbpf_get_error(g_obj)) {
        log_rl(LOG_ERR, "[XDP] BPF nesne acilamadi: %s", obj_path);
        return -1;
    }

    /* Dinamik map boyutlandirma — rules.conf'dan gelen degerler uygulanir */
    if (map_v4_size > 0) {
        struct bpf_map *m = bpf_object__find_map_by_name(g_obj, "xdp_blacklist_v4");
        if (m) bpf_map__set_max_entries(m, (unsigned int)map_v4_size);
    }
    if (map_v6_size > 0) {
        struct bpf_map *m = bpf_object__find_map_by_name(g_obj, "xdp_blacklist_v6");
        if (m) bpf_map__set_max_entries(m, (unsigned int)map_v6_size);
    }

    if (bpf_object__load(g_obj) != 0) {
        log_rl(LOG_ERR, "[XDP] BPF yukleme hatasi (kernel/BTF uyumsuzlugu?)");
        bpf_object__close(g_obj);
        g_obj = NULL;
        return -1;
    }

    struct bpf_program *prog = bpf_object__find_program_by_name(g_obj, "xdp_waf_filter");
    if (!prog) {
        log_rl(LOG_ERR, "[XDP] xdp_waf_filter programi bulunamadi");
        bpf_object__close(g_obj);
        g_obj = NULL;
        return -1;
    }

    g_prog_fd = bpf_program__fd(prog);

    /* Pin maps so external tools (threat_intel.sh) can update them directly */
    mkdir("/sys/fs/bpf/loganalyzer", 0755);
    bpf_object__pin_maps(g_obj, "/sys/fs/bpf/loganalyzer");

    if (bpf_xdp_attach(g_ifindex, g_prog_fd, XDP_FLAGS_DRV_MODE, NULL) < 0) {
        /* Driver modu desteklenmiyorsa generic moda geri don */
        if (bpf_xdp_attach(g_ifindex, g_prog_fd, XDP_FLAGS_SKB_MODE, NULL) < 0) {
            log_rl(LOG_ERR, "[XDP] XDP attach basarisiz: %s", strerror(errno));
            bpf_object__close(g_obj);
            g_obj = NULL;
            return -1;
        }
        log_rl(LOG_WARNING, "[XDP] Generic (SKB) modunda eklendi: %s", ifname);
    } else {
        log_rl(LOG_INFO, "[XDP] Driver modunda eklendi: %s", ifname);
    }

    struct bpf_map *map_v4 = bpf_object__find_map_by_name(g_obj, "xdp_blacklist_v4");
    struct bpf_map *map_v6 = bpf_object__find_map_by_name(g_obj, "xdp_blacklist_v6");
    struct bpf_map *map_rb = bpf_object__find_map_by_name(g_obj, "xdp_ringbuf");
    struct bpf_map *map_st = bpf_object__find_map_by_name(g_obj, "xdp_stats");
    
    g_map_v4_fd = map_v4 ? bpf_map__fd(map_v4) : -1;
    g_map_v6_fd = map_v6 ? bpf_map__fd(map_v6) : -1;
    g_ringbuf_fd = map_rb ? bpf_map__fd(map_rb) : -1;
    g_stats_fd = map_st ? bpf_map__fd(map_st) : -1;

    g_active = 1;
    log_rl(LOG_INFO, "[XDP] Aktif: %s (ifindex=%d, ringbuf=%d)", ifname, g_ifindex, g_ringbuf_fd);
    return 0;
}

struct bpf_lpm_trie_key_v4 {
    uint32_t prefixlen;
    uint32_t ipv4_addr;
};

int xdp_ban_ipv4(const char *ip_str) {
    if (!g_active || g_map_v4_fd < 0) return -1;
    
    char ip_buf[64];
    strncpy(ip_buf, ip_str, sizeof(ip_buf) - 1);
    ip_buf[sizeof(ip_buf)-1] = '\0';
    
    uint32_t prefix = 32;
    char *slash = strchr(ip_buf, '/');
    if (slash) {
        *slash = '\0';
        prefix = (uint32_t)atoi(slash + 1);
        if (prefix > 32) prefix = 32;
    }

    struct in_addr addr;
    if (inet_pton(AF_INET, ip_buf, &addr) != 1) return -1;
    
    struct bpf_lpm_trie_key_v4 key = {
        .prefixlen = prefix,
        .ipv4_addr = addr.s_addr
    };
    
    uint8_t val = 1;
    return bpf_map_update_elem(g_map_v4_fd, &key, &val, BPF_ANY);
}

int xdp_ban_ipv6(const char *ip_str) {
    if (!g_active || g_map_v6_fd < 0) return -1;
    struct in6_addr addr;
    if (inet_pton(AF_INET6, ip_str, &addr) != 1) return -1;
    uint8_t val = 1;
    return bpf_map_update_elem(g_map_v6_fd, &addr.s6_addr, &val, BPF_ANY);
}

int xdp_unban_ipv4(const char *ip_str) {
    if (!g_active || g_map_v4_fd < 0) return -1;
    
    char ip_buf[64];
    strncpy(ip_buf, ip_str, sizeof(ip_buf) - 1);
    ip_buf[sizeof(ip_buf)-1] = '\0';
    
    uint32_t prefix = 32;
    char *slash = strchr(ip_buf, '/');
    if (slash) {
        *slash = '\0';
        prefix = (uint32_t)atoi(slash + 1);
        if (prefix > 32) prefix = 32;
    }

    struct in_addr addr;
    if (inet_pton(AF_INET, ip_buf, &addr) != 1) return -1;
    
    struct bpf_lpm_trie_key_v4 key = {
        .prefixlen = prefix,
        .ipv4_addr = addr.s_addr
    };
    
    return bpf_map_delete_elem(g_map_v4_fd, &key);
}

int xdp_unban_ipv6(const char *ip_str) {
    if (!g_active || g_map_v6_fd < 0) return -1;
    struct in6_addr addr;
    if (inet_pton(AF_INET6, ip_str, &addr) != 1) return -1;
    return bpf_map_delete_elem(g_map_v6_fd, &addr.s6_addr);
}

void xdp_loader_destroy(void) {
    if (g_active && g_ifindex > 0) {
        bpf_xdp_detach(g_ifindex, XDP_FLAGS_DRV_MODE, NULL);
        bpf_xdp_detach(g_ifindex, XDP_FLAGS_SKB_MODE, NULL);
    }
    if (g_obj) {
        bpf_object__unpin_maps(g_obj, "/sys/fs/bpf/loganalyzer");
        bpf_object__close(g_obj);
        g_obj = NULL;
    }
    g_active = 0;
}

int xdp_loader_active(void) { return g_active; }

int xdp_loader_get_ringbuf_fd(void) { return g_ringbuf_fd; }

int xdp_loader_get_stats(uint32_t stat_idx, uint64_t *stat_out) {
    if (!g_active || g_stats_fd < 0 || !stat_out) return -1;
    
    int num_cpus = libbpf_num_possible_cpus();
    if (num_cpus <= 0) num_cpus = 1;
    
    uint64_t *values = calloc(num_cpus, sizeof(uint64_t));
    if (!values) return -1;
    
    if (bpf_map_lookup_elem(g_stats_fd, &stat_idx, values) != 0) {
        free(values);
        return -1;
    }
    
    uint64_t total = 0;
    for (int i = 0; i < num_cpus; i++) {
        total += values[i];
    }
    *stat_out = total;
    free(values);
    return 0;
}

#else /* HAVE_LIBBPF yoksa stub implementasyonu */

int  xdp_loader_init(const char *o, const char *i, int s4, int s6) {
    (void)o; (void)i; (void)s4; (void)s6;
    log_rl(LOG_WARNING, "[XDP] libbpf mevcut degil. XDP devre disi.");
    return -1;
}
int  xdp_ban_ipv4(const char *ip)   { (void)ip; return -1; }
int  xdp_ban_ipv6(const char *ip)   { (void)ip; return -1; }
int  xdp_unban_ipv4(const char *ip) { (void)ip; return -1; }
int  xdp_unban_ipv6(const char *ip) { (void)ip; return -1; }
void xdp_loader_destroy(void)        {}
int  xdp_loader_active(void)         { return 0; }
int  xdp_loader_get_ringbuf_fd(void) { return -1; }
int  xdp_loader_get_stats(uint32_t idx, uint64_t *out) { (void)idx; (void)out; return -1; }

#endif /* HAVE_LIBBPF */
