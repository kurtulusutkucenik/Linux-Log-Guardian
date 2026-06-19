/* ebpf_daemon.c — Ayrıcalıklı eBPF/XDP Yöneticisi (Daemon Prosesi)
 *
 * Bu proses YALNIZCA şunları yapar:
 *   1. XDP programını NIC'e yükler ve yönetir.
 *   2. Unix IPC socket'i dinler.
 *   3. Analyzer'dan gelen ban/unban mesajlarını XDP haritasına yazar.
 *
 * Dış dünya ile TEK teması: /run/log-guardian/ipc.sock (yerel UNIX)
 * Regex, curl, string parsing, DB: YOK.
 *
 * Derleme: Makefile tarafından ayrı binary olarak üretilir:
 *   log-guardian-daemon
 *
 * Kullanım: log-guardian-daemon --iface eth0 [--obj xdp_filter.o]
 *            [--map-v4-size N] [--map-v6-size N]
 */
#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <fcntl.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <grp.h>
#include <arpa/inet.h>
#include <syslog.h>
#include <stdarg.h>
#include <pthread.h>
#include <dlfcn.h>
#include <liburing.h>
#include <poll.h>

#include "daemon_ipc.h"
#include "daemon_stats.h"
#include "k8s_guard.h"
#include "attack_tree.h"
#include "ipc_auth.h"
#include "firewall.h"

#define ACTIVE_BANS_JSON "/run/log-guardian/active_bans.json"

int g_output_json = 0;
int g_ipc_fd = -1;
static volatile int g_bans_json_dirty = 0;

#define BANS_JSON_EXPORT_MAX 500

static void export_active_bans_json(void)
{
    char ips[BANS_JSON_EXPORT_MAX][64];
    int total = 0;
    int n = ipset_list_v4_members(ips, BANS_JSON_EXPORT_MAX, &total);
    if (n < 0)
        return;

    FILE *out = fopen(ACTIVE_BANS_JSON ".tmp", "w");
    if (!out)
        return;

    fprintf(out, "{\"ips\":[");
    for (int i = 0; i < n; i++) {
        if (i > 0)
            fputc(',', out);
        fprintf(out, "\"%s\"", ips[i]);
    }
    fprintf(out, "],\"total_count\":%d,\"truncated\":%s,\"source\":\"ipset\"}\n",
            total, (total > n) ? "true" : "false");
    fclose(out);
    rename(ACTIVE_BANS_JSON ".tmp", ACTIVE_BANS_JSON);
    chmod(ACTIVE_BANS_JSON, 0644);
    const char *grp_name = getenv("LOG_GUARDIAN_IPC_GROUP");
    if (!grp_name || !grp_name[0]) grp_name = "log-guardian";
    struct group *gr = getgrnam(grp_name);
    if (gr) chown(ACTIVE_BANS_JSON, 0, gr->gr_gid);
}

/* logger.c, bu değişkeni extern olarak bekler.
 * Daemon binary'de tenant kimliği kullanılmaz; boş bırakılır. */
char g_tenant_id[128] = "";

/* ── Bağımlılık yüklemesi: libsystemd opsiyonel ──────────────────── */
static int (*sd_notify_fn)(int, const char *) = NULL;

/* ── Durum bayrakları ─────────────────────────────────────────────── */
static volatile int g_running    = 1;
static int          g_server_fd  = -1;

static void *watchdog_thread_fn(void *arg)
{
    (void)arg;
    while (g_running) {
        sleep(5);
        if (!g_running) break;
        if (sd_notify_fn) sd_notify_fn(0, "WATCHDOG=1");
        if (g_bans_json_dirty) {
            export_active_bans_json();
            g_bans_json_dirty = 0;
        }
        daemon_stats_write_file();
    }
    return NULL;
}

static void start_watchdog_thread(void)
{
    pthread_t tid;
    pthread_attr_t attr;
    if (pthread_attr_init(&attr) != 0) return;
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    if (pthread_create(&tid, &attr, watchdog_thread_fn, NULL) == 0)
        syslog(LOG_INFO, "[DAEMON] Watchdog thread aktif (5s ping).");
    pthread_attr_destroy(&attr);
}

/* ── XDP libbpf arayüzü (HAVE_LIBBPF ile koşullu) ──────────────── */
#ifdef HAVE_LIBBPF
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
#include <net/if.h>
#include <linux/if_link.h>
#include <dirent.h>
#include <sys/inotify.h>
#include <elf.h>

static struct bpf_object *g_bpf_obj    = NULL;
static int                g_ifindex    = 0;
static int                g_map_v4_fd  = -1;
static int                g_map_v6_fd  = -1;
static int                g_xdp_active = 0;

/* ── Uprobe (TLS) ────────────────────────────────────────── */
static struct bpf_object  *g_uprobe_obj       = NULL;
static struct bpf_link    *g_link_ssl_read_e  = NULL;
static struct bpf_link    *g_link_ssl_read_r  = NULL;
static struct bpf_link    *g_link_ssl_write_e = NULL;
static struct ring_buffer *g_tls_ringbuf      = NULL;
static int                 g_uprobe_inotify   = -1;
static int                 g_map_tarpit_v4_fd = -1;
static int                 g_map_tarpit_v6_fd = -1;

/* ── Uprobe (execve / Zero Trust RCE) ───────────────────── */
static struct bpf_object  *g_execve_obj         = NULL;
static struct bpf_link    *g_link_execve        = NULL;
static struct ring_buffer *g_rce_ringbuf        = NULL;
static int                 g_map_cgroups_fd     = -1;  /* watched_cgroups BPF map */
static int                 g_map_xsk_fd         __attribute__((unused)) = -1;  /* AF_XDP xsk_map */

/* ── eBPF Lineage Probe (Attack Tree - Feature 3) ───────── */
static struct bpf_object  *g_lineage_obj        = NULL;
static struct bpf_link    *g_link_lin_openat    = NULL;
static struct bpf_link    *g_link_lin_execve    = NULL;
static struct bpf_link    *g_link_lin_connect   = NULL;
static struct bpf_link    *g_link_lin_write     = NULL;
static struct ring_buffer *g_lineage_ringbuf    = NULL;

/* ── eBPF HTTP L7 probe (kernel write() method sniff) ─────── */
static struct bpf_object  *g_l7_obj            = NULL;
static struct bpf_link    *g_link_l7_write     = NULL;
static struct ring_buffer *g_l7_ringbuf         = NULL;

struct l7_http_event_us {
    uint32_t pid;
    char     comm[16];
    char     method[8];
    uint64_t ts_ns;
};

static int l7_ringbuf_cb(void *ctx, void *data, size_t size)
{
    (void)ctx;
    if (size < sizeof(struct l7_http_event_us)) return 0;
    const struct l7_http_event_us *ev = data;
    daemon_stats_note_l7_http(ev->method);
    return 0;
}

/* Ring buffer + attack tree export (io_uring timeout ve fallback döngüsü) */
static void daemon_export_attack_tree(void)
{
    char *json_buf = malloc((size_t)ATTACK_TREE_JSON_BUF * 4);
    if (!json_buf) return;
    int len = attack_tree_all_json(json_buf, ATTACK_TREE_JSON_BUF * 4);
    if (len > 2) {
        FILE *f = fopen("/run/log-guardian/attack_tree.json", "w");
        if (f) {
            fwrite(json_buf, 1, (size_t)len, f);
            fclose(f);
        }
    }
    free(json_buf);
}

static void daemon_poll_ringbufs(void)
{
    if (g_tls_ringbuf)     ring_buffer__poll(g_tls_ringbuf, 0);
    if (g_lineage_ringbuf) ring_buffer__poll(g_lineage_ringbuf, 0);
    if (g_rce_ringbuf)     ring_buffer__poll(g_rce_ringbuf, 0);
    if (g_l7_ringbuf)      ring_buffer__poll(g_l7_ringbuf, 0);
}

static void http_l7_probe_init(const char *obj_path)
{
    if (!obj_path) return;

    g_l7_obj = bpf_object__open_file(obj_path, NULL);
    if (!g_l7_obj || libbpf_get_error(g_l7_obj)) {
        syslog(LOG_WARNING, "[L7-PROBE] BPF acilamadi: %s", obj_path);
        g_l7_obj = NULL;
        return;
    }
    if (bpf_object__load(g_l7_obj) != 0) {
        syslog(LOG_WARNING, "[L7-PROBE] BPF yukleme hatasi");
        bpf_object__close(g_l7_obj);
        g_l7_obj = NULL;
        return;
    }

    struct bpf_map *rb = bpf_object__find_map_by_name(g_l7_obj, "l7_http_events");
    if (rb)
        g_l7_ringbuf = ring_buffer__new(bpf_map__fd(rb), l7_ringbuf_cb, NULL, NULL);

    struct bpf_program *p = bpf_object__find_program_by_name(g_l7_obj, "trace_l7_http_write");
    if (p)
        g_link_l7_write = bpf_program__attach(p);

    if (g_l7_ringbuf)
        syslog(LOG_INFO, "[L7-PROBE] HTTP method izleyici aktif.");
    else
        syslog(LOG_WARNING, "[L7-PROBE] ringbuf baslatilamadi");
}

static int http_l7_probe_active(void)
{
    return g_l7_ringbuf != NULL;
}

static void http_l7_probe_cleanup(void)
{
    if (g_link_l7_write) { bpf_link__destroy(g_link_l7_write); g_link_l7_write = NULL; }
    if (g_l7_ringbuf)    { ring_buffer__free(g_l7_ringbuf);    g_l7_ringbuf    = NULL; }
    if (g_l7_obj)        { bpf_object__close(g_l7_obj);        g_l7_obj        = NULL; }
}

struct lpm_key_v4 { uint32_t prefixlen; uint32_t ipv4_addr; };

static int xdp_init(const char *obj_path, const char *ifname,
                    int map_v4_size, int map_v6_size) {
    g_ifindex = (int)if_nametoindex(ifname);
    if (g_ifindex == 0) {
        syslog(LOG_ERR, "[DAEMON] Arayuz bulunamadi: %s", ifname);
        return -1;
    }

    g_bpf_obj = bpf_object__open_file(obj_path, NULL);
    if (!g_bpf_obj || libbpf_get_error(g_bpf_obj)) {
        syslog(LOG_ERR, "[DAEMON] BPF nesne acilamadi: %s", obj_path);
        return -1;
    }

    /* Dinamik harita boyutlandırması */
    if (map_v4_size > 0) {
        struct bpf_map *m = bpf_object__find_map_by_name(g_bpf_obj, "xdp_blacklist_v4");
        if (m) bpf_map__set_max_entries(m, (unsigned int)map_v4_size);
    }
    if (map_v6_size > 0) {
        struct bpf_map *m = bpf_object__find_map_by_name(g_bpf_obj, "xdp_blacklist_v6");
        if (m) bpf_map__set_max_entries(m, (unsigned int)map_v6_size);
    }

    if (bpf_object__load(g_bpf_obj) != 0) {
        syslog(LOG_ERR, "[DAEMON] BPF yukleme hatasi (kernel uyumsuzlugu?)");
        bpf_object__close(g_bpf_obj);
        g_bpf_obj = NULL;
        return -1;
    }

    struct bpf_program *prog = bpf_object__find_program_by_name(g_bpf_obj, "xdp_waf_filter");
    if (!prog) {
        syslog(LOG_ERR, "[DAEMON] xdp_waf_filter programi bulunamadi");
        bpf_object__close(g_bpf_obj);
        g_bpf_obj = NULL;
        return -1;
    }

    int prog_fd = bpf_program__fd(prog);

    /* BPF haritalarını pinja: threat_intel.sh doğrudan güncelleyebilsin */
    mkdir("/sys/fs/bpf/loganalyzer", 0755);
    bpf_object__pin_maps(g_bpf_obj, "/sys/fs/bpf/loganalyzer");

    /* Driver modu, aksi halde generic */
    if (bpf_xdp_attach(g_ifindex, prog_fd, XDP_FLAGS_DRV_MODE, NULL) < 0) {
        if (bpf_xdp_attach(g_ifindex, prog_fd, XDP_FLAGS_SKB_MODE, NULL) < 0) {
            syslog(LOG_ERR, "[DAEMON] XDP attach basarisiz: %s", strerror(errno));
            bpf_object__close(g_bpf_obj);
            g_bpf_obj = NULL;
            return -1;
        }
        syslog(LOG_WARNING, "[DAEMON] Generic (SKB) modunda eklendi: %s", ifname);
    } else {
        syslog(LOG_INFO, "[DAEMON] Driver modunda eklendi: %s (ifindex=%d)", ifname, g_ifindex);
    }

    struct bpf_map *m4 = bpf_object__find_map_by_name(g_bpf_obj, "xdp_blacklist_v4");
    struct bpf_map *m6 = bpf_object__find_map_by_name(g_bpf_obj, "xdp_blacklist_v6");
    struct bpf_map *m_tarpit = bpf_object__find_map_by_name(g_bpf_obj, "xdp_tarpit_v4");
    struct bpf_map *m_tarpit_v6 = bpf_object__find_map_by_name(g_bpf_obj, "xdp_tarpit_v6");
    
    g_map_v4_fd = m4 ? bpf_map__fd(m4) : -1;
    g_map_v6_fd = m6 ? bpf_map__fd(m6) : -1;
    g_map_tarpit_v4_fd = m_tarpit ? bpf_map__fd(m_tarpit) : -1;
    g_map_tarpit_v6_fd = m_tarpit_v6 ? bpf_map__fd(m_tarpit_v6) : -1;
    g_xdp_active = 1;
    return 0;
}

static void xdp_cleanup(void) {
    if (g_xdp_active && g_ifindex > 0) {
        bpf_xdp_detach(g_ifindex, XDP_FLAGS_DRV_MODE, NULL);
        bpf_xdp_detach(g_ifindex, XDP_FLAGS_SKB_MODE, NULL);
    }
    if (g_bpf_obj) {
        bpf_object__unpin_maps(g_bpf_obj, "/sys/fs/bpf/loganalyzer");
        bpf_object__close(g_bpf_obj);
        g_bpf_obj = NULL;
    }
    g_xdp_active = 0;
}

static int do_ban_v4(const char *ip, uint8_t prefix) {
    int rc = -1;
    if (g_map_v4_fd >= 0) {
        struct in_addr addr;
        if (inet_pton(AF_INET, ip, &addr) != 1) return -1;
        struct lpm_key_v4 key = { .prefixlen = prefix, .ipv4_addr = addr.s_addr };
        uint8_t val = 1;
        rc = bpf_map_update_elem(g_map_v4_fd, &key, &val, BPF_ANY);
    }
    if (rc != 0) {
        int iprc = run_ipset_ip("add", g_ipset_v4, ip);
        if (iprc != 0)
            syslog(LOG_WARNING, "[DAEMON] ipset add %s -> exit %d", ip, iprc);
        rc = iprc;
    }
    return rc;
}

static int do_tarpit_v4(const char *ip, uint8_t prefix, uint8_t prob) {
    if (g_map_tarpit_v4_fd < 0) return -1;
    struct in_addr addr;
    if (inet_pton(AF_INET, ip, &addr) != 1) return -1;
    struct lpm_key_v4 key = { .prefixlen = prefix, .ipv4_addr = addr.s_addr };
    return bpf_map_update_elem(g_map_tarpit_v4_fd, &key, &prob, BPF_ANY);
}

static int do_unban_v4(const char *ip, uint8_t prefix) {
    if (g_map_v4_fd >= 0) {
        struct in_addr addr;
        if (inet_pton(AF_INET, ip, &addr) == 1) {
            struct lpm_key_v4 key = { .prefixlen = prefix, .ipv4_addr = addr.s_addr };
            bpf_map_delete_elem(g_map_v4_fd, &key);
        }
    }
    if (run_ipset_ip("del", g_ipset_v4, ip) == 0)
        return 0;
    if (run_ipset_ip("test", g_ipset_v4, ip) != 0)
        return 0;
    return -1;
}

static int do_ban_v6(const char *ip) {
    int rc = -1;
    if (g_map_v6_fd >= 0) {
        struct in6_addr addr;
        if (inet_pton(AF_INET6, ip, &addr) != 1) return -1;
        uint8_t val = 1;
        rc = bpf_map_update_elem(g_map_v6_fd, addr.s6_addr, &val, BPF_ANY);
    }
    if (rc != 0) {
        int iprc = run_ipset_ip("add", g_ipset_v6, ip);
        if (iprc != 0)
            syslog(LOG_WARNING, "[DAEMON] ipset v6 add %s -> exit %d", ip, iprc);
        rc = iprc;
    }
    return rc;
}

static int do_tarpit_v6(const char *ip, uint8_t prob) {
    if (g_map_tarpit_v6_fd < 0) return -1;
    struct in6_addr addr;
    if (inet_pton(AF_INET6, ip, &addr) != 1) return -1;
    return bpf_map_update_elem(g_map_tarpit_v6_fd, addr.s6_addr, &prob, BPF_ANY);
}

static int do_unban_v6(const char *ip) {
    if (g_map_v6_fd >= 0) {
        struct in6_addr addr;
        if (inet_pton(AF_INET6, ip, &addr) == 1)
            bpf_map_delete_elem(g_map_v6_fd, addr.s6_addr);
    }
    if (run_ipset_ip("del", g_ipset_v6, ip) == 0)
        return 0;
    if (run_ipset_ip("test", g_ipset_v6, ip) != 0)
        return 0;
    return -1;
}


/* ── Uprobe Hybrid Loader (Dinamik + Statik OpenSSL) ───────── */

static const char *resolve_nm_bin(void)
{
    static const char *cands[] = { "/usr/bin/nm", "/bin/nm", NULL };
    for (int i = 0; cands[i]; i++)
        if (access(cands[i], X_OK) == 0)
            return cands[i];
    return "/usr/bin/nm";
}

static unsigned long nm_lookup_sym(const char *elf, const char *sym, int dynamic)
{
    int pipefd[2];
    if (!elf || !elf[0] || !sym || pipe(pipefd) < 0)
        return 0;

    const char *nm = resolve_nm_bin();
    pid_t pid = fork();
    if (pid < 0) {
        close(pipefd[0]);
        close(pipefd[1]);
        return 0;
    }
    if (pid == 0) {
        close(pipefd[0]);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[1]);
        int dn = open("/dev/null", O_WRONLY);
        if (dn >= 0) {
            dup2(dn, STDERR_FILENO);
            close(dn);
        }
        if (dynamic) {
            char *const av[] = { (char *)nm, "-D", (char *)elf, NULL };
            execve(nm, av, (char *[]){ NULL });
        } else {
            char *const av[] = { (char *)nm, (char *)elf, NULL };
            execve(nm, av, (char *[]){ NULL });
        }
        _exit(127);
    }

    close(pipefd[1]);
    char buf[8192];
    ssize_t total = 0;
    while (total < (ssize_t)(sizeof(buf) - 1)) {
        ssize_t r = read(pipefd[0], buf + total, sizeof(buf) - 1 - (size_t)total);
        if (r <= 0)
            break;
        total += r;
    }
    close(pipefd[0]);
    waitpid(pid, NULL, 0);
    buf[total] = '\0';

    for (char *line = buf; line && *line; ) {
        char *nl = strchr(line, '\n');
        if (nl)
            *nl = '\0';
        unsigned long addr = 0;
        char typ[8], name[64];
        if (sscanf(line, "%lx %7s %63s", &addr, typ, name) == 3 &&
            strcmp(name, sym) == 0) {
            return addr;
        }
        line = nl ? nl + 1 : NULL;
    }
    return 0;
}

/*
 * ssl_find_binary:
 *   PID'in /proc/PID/maps dosyasından libssl.so yolunu bulur (dinamik).
 *   Bulamazsa, binary'nin kendisinde SSL_read sembolü ara (statik).
 *   target_path'e bulunan yol, *offset'e sembol file offset yazılır.
 *   Dönüş: 0=dinamik, 1=statik, -1=bulunamadı
 */
static int ssl_find_binary(pid_t pid, char *target_path, size_t path_len,
                            unsigned long *offset_read,
                            unsigned long *offset_write) {
    char maps_path[256];
    snprintf(maps_path, sizeof(maps_path), "/proc/%d/maps", (int)pid);
    FILE *fp = fopen(maps_path, "r");
    if (!fp) return -1;

    char line[512];
    char libssl_path[PATH_MAX] = {0};
    unsigned long map_base = 0;
    while (fgets(line, sizeof(line), fp)) {
        if (strstr(line, "libssl.so") && strstr(line, "r-xp")) {
            /* Sayfa başını ve yolu çıkar */
            unsigned long addr_lo, addr_hi, file_off;
            char perms[8], dev[8], pathname[PATH_MAX];
            int inode;
            if (sscanf(line, "%lx-%lx %s %lx %s %d %s",
                       &addr_lo, &addr_hi, perms, &file_off,
                       dev, &inode, pathname) == 7) {
                strncpy(libssl_path, pathname, PATH_MAX - 1);
                map_base = addr_lo - file_off;
                break;
            }
        }
    }
    fclose(fp);

    /* Dinamik: libssl.so bulundu */
    if (libssl_path[0] != '\0') {
        strncpy(target_path, libssl_path, path_len - 1);
        target_path[path_len - 1] = '\0';
        *offset_read  = 0;
        *offset_write = 0;
        *offset_read  = nm_lookup_sym(libssl_path, "SSL_read", 1);
        *offset_write = nm_lookup_sym(libssl_path, "SSL_write", 1);
        (void)map_base;
        return (*offset_read > 0) ? 0 : -1;
    }

    /* Statik fallback: binary'nin kendisini tara */
    char exe_path[PATH_MAX];
    snprintf(maps_path, sizeof(maps_path), "/proc/%d/exe", (int)pid);
    ssize_t r = readlink(maps_path, exe_path, sizeof(exe_path) - 1);
    if (r <= 0) return -1;
    exe_path[r] = '\0';
    strncpy(target_path, exe_path, path_len - 1);
    target_path[path_len - 1] = '\0';

    *offset_read  = nm_lookup_sym(exe_path, "SSL_read", 0);
    *offset_write = nm_lookup_sym(exe_path, "SSL_write", 0);
    return (*offset_read > 0) ? 1 : -1;  /* 1=statik */
}

/* TLS ring buffer callback: userspace'de plaintext event'lerini logla */
static int tls_ringbuf_cb(void *ctx, void *data, size_t size) {
    (void)ctx;
    if (size < 16) return 0;
    struct { uint64_t pid_tgid; uint32_t fd; uint32_t data_len;
             uint8_t direction; uint8_t truncated; uint8_t _pad[6];
             uint8_t data[1024]; } *evt = data;
    pid_t pid = (pid_t)(evt->pid_tgid >> 32);
    const char *dir = (evt->direction == 2) ? "WRITE(exfil?)" : "READ";
    syslog(LOG_INFO,
           "[TLS-UPROBE] PID=%d Dir=%s Len=%u%s",
           (int)pid, dir, evt->data_len,
           evt->truncated ? " [TRUNCATED]" : "");
    /* Buyuk giden veri = potansiyel exfil */
    if (evt->direction == 2 && evt->data_len >= 512) {
        syslog(LOG_WARNING,
               "[TLS-UPROBE] BUYUK GIDEN TLS VERISI: PID=%d %u byte — "
               "Data Exfiltration suphesi!", (int)pid, evt->data_len);
    }
    return 0;
}

/* uprobe_init: hedef servislerde SSL_read/SSL_write'a hook atar */
static void uprobe_init(const char *uprobe_obj_path) {
    if (!uprobe_obj_path) return;

    g_uprobe_obj = bpf_object__open_file(uprobe_obj_path, NULL);
    if (!g_uprobe_obj || libbpf_get_error(g_uprobe_obj)) {
        syslog(LOG_WARNING, "[UPROBE] BPF nesne acilamadi: %s", uprobe_obj_path);
        g_uprobe_obj = NULL;
        return;
    }
    if (bpf_object__load(g_uprobe_obj) != 0) {
        syslog(LOG_WARNING, "[UPROBE] BPF yukleme hatasi");
        bpf_object__close(g_uprobe_obj); g_uprobe_obj = NULL;
        return;
    }

    /* Ring buffer fd'yi al */
    struct bpf_map *rb_map =
        bpf_object__find_map_by_name(g_uprobe_obj, "tls_ringbuf");
    if (rb_map) {
        g_tls_ringbuf = ring_buffer__new(bpf_map__fd(rb_map),
                                          tls_ringbuf_cb, NULL, NULL);
    }

    /* /proc altindaki hedef servisleri tara */
    DIR *proc = opendir("/proc");
    if (!proc) return;
    struct dirent *de;
    while ((de = readdir(proc)) != NULL) {
        pid_t pid = (pid_t)atoi(de->d_name);
        if (pid <= 1) continue;

        char target[PATH_MAX];
        unsigned long off_read = 0, off_write = 0;
        int kind = ssl_find_binary(pid, target, sizeof(target),
                                   &off_read, &off_write);
        if (kind < 0 || off_read == 0) continue;

        /* Programlari bul */
        struct bpf_program *p_read_e =
            bpf_object__find_program_by_name(g_uprobe_obj, "uprobe_ssl_read_entry");
        struct bpf_program *p_read_r =
            bpf_object__find_program_by_name(g_uprobe_obj, "uretprobe_ssl_read_return");
        struct bpf_program *p_write_e =
            bpf_object__find_program_by_name(g_uprobe_obj, "uprobe_ssl_write_entry");

        if (!p_read_e || !p_read_r || !p_write_e) continue;

        /* Attach: uprobe SSL_read entry */
        if (!g_link_ssl_read_e) {
            g_link_ssl_read_e = bpf_program__attach_uprobe(
                p_read_e, false, pid, target, off_read);
            if (libbpf_get_error(g_link_ssl_read_e))
                g_link_ssl_read_e = NULL;
        }
        /* uretprobe SSL_read return */
        if (!g_link_ssl_read_r) {
            g_link_ssl_read_r = bpf_program__attach_uprobe(
                p_read_r, true, pid, target, off_read);
            if (libbpf_get_error(g_link_ssl_read_r))
                g_link_ssl_read_r = NULL;
        }
        /* uprobe SSL_write entry */
        if (off_write > 0 && !g_link_ssl_write_e) {
            g_link_ssl_write_e = bpf_program__attach_uprobe(
                p_write_e, false, pid, target, off_write);
            if (libbpf_get_error(g_link_ssl_write_e))
                g_link_ssl_write_e = NULL;
        }

        if (g_link_ssl_read_e) {
            syslog(LOG_INFO,
                   "[UPROBE] SSL_read hook eklendi: PID=%d %s=%s offset=%lx",
                   (int)pid, kind==0?"libssl":"binary", target, off_read);
            break; /* ilk basarili attach yeterli */
        }
    }
    closedir(proc);

    /* inotify: libssl guncellenmesi veya yeniden baslatilmasi icin */
    g_uprobe_inotify = inotify_init1(IN_NONBLOCK | IN_CLOEXEC);
    if (g_uprobe_inotify >= 0)
        inotify_add_watch(g_uprobe_inotify, "/usr/lib",
                          IN_CLOSE_WRITE | IN_MOVED_TO);
}

static void uprobe_cleanup(void) {
    if (g_link_ssl_read_e)  { bpf_link__destroy(g_link_ssl_read_e);  g_link_ssl_read_e  = NULL; }
    if (g_link_ssl_read_r)  { bpf_link__destroy(g_link_ssl_read_r);  g_link_ssl_read_r  = NULL; }
    if (g_link_ssl_write_e) { bpf_link__destroy(g_link_ssl_write_e); g_link_ssl_write_e = NULL; }
    if (g_tls_ringbuf)      { ring_buffer__free(g_tls_ringbuf);       g_tls_ringbuf      = NULL; }
    if (g_uprobe_obj)       { bpf_object__close(g_uprobe_obj);        g_uprobe_obj       = NULL; }
    if (g_uprobe_inotify >= 0) { close(g_uprobe_inotify); g_uprobe_inotify = -1; }
}

/* ── execve RCE Ring Buffer Callback ────────────────────────────────── */
/* Bu yapı syscall_uprobe.c'deki rce_event ile birebir eşleşmeli */
struct rce_event_wire {
    uint32_t pid;
    uint32_t ppid;
    uint64_t cgroup_id;
    uint64_t timestamp_ns;
    char     comm[16];
    char     filename[64];
    char     argv1[64];
};

static int rce_ringbuf_cb(void *ctx, void *data, size_t size)
{
    (void)ctx;
    if (size < sizeof(struct rce_event_wire)) return 0;

    struct rce_event_wire *kev = (struct rce_event_wire *)data;

    syslog(LOG_CRIT,
           "[RCE-PROBE] EXECVE TESPIT! PID=%u Comm=%.16s "
           "File=%.64s Arg=%.64s CgroupID=%lu",
           kev->pid, kev->comm, kev->filename, kev->argv1,
           (unsigned long)kev->cgroup_id);

    /* k8s_guard: container bilgisini çöz ve SIGKILL gönder */
    RceEvent rev;
    memset(&rev, 0, sizeof(rev));
    rev.pid            = (pid_t)kev->pid;
    rev.timestamp_ns   = kev->timestamp_ns;
    strncpy(rev.filename,    kev->filename, sizeof(rev.filename)-1);
    strncpy(rev.argv1,       kev->argv1,    sizeof(rev.argv1)-1);
    strncpy(rev.parent_comm, kev->comm,     sizeof(rev.parent_comm)-1);

    k8s_guard_resolve_pid((pid_t)kev->pid, &rev.container);
    int killed = (k8s_guard_kill_process(&rev) == 0);
    daemon_stats_note_rce(kev->comm,
                          rev.container.container_id[0] ? rev.container.container_id
                                                        : NULL,
                          killed);

    /* Konteyneri izleme listesine ekle (tekrar eden spawn'ları yakala) */
    if (rev.container.cgroup_id)
        k8s_guard_watch_cgroup(rev.container.cgroup_id);

    return 0;
}

/* ── execve Probe Init ────────────────────────────────────────────── */
static void execve_probe_init(const char *obj_path) {
    if (!obj_path) return;

    g_execve_obj = bpf_object__open_file(obj_path, NULL);
    if (!g_execve_obj || libbpf_get_error(g_execve_obj)) {
        syslog(LOG_WARNING, "[EXECVE-PROBE] BPF nesne acilamadi: %s", obj_path);
        g_execve_obj = NULL;
        return;
    }
    if (bpf_object__load(g_execve_obj) != 0) {
        syslog(LOG_WARNING, "[EXECVE-PROBE] BPF yukleme hatasi");
        bpf_object__close(g_execve_obj); g_execve_obj = NULL;
        return;
    }

    /* cgroup watchlist map fd al — k8s_guard'a ver */
    struct bpf_map *cg_map =
        bpf_object__find_map_by_name(g_execve_obj, "watched_cgroups");
    if (cg_map) {
        g_map_cgroups_fd = bpf_map__fd(cg_map);
        k8s_guard_init(g_map_cgroups_fd);
    }

    /* Ring buffer: RCE event'leri al */
    struct bpf_map *rb_map =
        bpf_object__find_map_by_name(g_execve_obj, "rce_ringbuf");
    if (rb_map) {
        g_rce_ringbuf = ring_buffer__new(bpf_map__fd(rb_map),
                                         rce_ringbuf_cb, NULL, NULL);
    }

    /* Tracepoint attach */
    struct bpf_program *prog =
        bpf_object__find_program_by_name(g_execve_obj, "trace_execve");
    if (prog) {
        g_link_execve = bpf_program__attach(prog);
        if (libbpf_get_error(g_link_execve)) {
            syslog(LOG_WARNING, "[EXECVE-PROBE] Tracepoint attach basarisiz");
            g_link_execve = NULL;
        } else {
            syslog(LOG_INFO,
                   "[EXECVE-PROBE] sys_enter_execve hook aktif. "
                   "Web prosesler korunuyor.");
        }
    }
}

static int execve_probe_active(void)
{
    return g_link_execve != NULL;
}

static void execve_probe_cleanup(void) {
    if (g_link_execve) { bpf_link__destroy(g_link_execve); g_link_execve = NULL; }
    if (g_rce_ringbuf) { ring_buffer__free(g_rce_ringbuf); g_rce_ringbuf = NULL; }
    if (g_execve_obj)  { bpf_object__close(g_execve_obj);  g_execve_obj  = NULL; }
    k8s_guard_stop();
}

/* ── Lineage Probe (Attack Tree) ──────────────────────────────────── */

/* Birebir lineage_probe.c'deki yapi */
struct lineage_event_wire {
    uint32_t type;
    uint32_t pid;
    uint32_t ppid;
    uint32_t uid;
    char     comm[16];
    char     detail[128];
    uint64_t ts_ns;
};

static int lineage_ringbuf_cb(void *ctx, void *data, size_t size) {
    (void)ctx;
    if (size < sizeof(struct lineage_event_wire)) return 0;
    struct lineage_event_wire *w = data;

    LineageEvent ev;
    memset(&ev, 0, sizeof(ev));
    ev.type = (LineageEventType)w->type;
    ev.pid  = w->pid;
    strncpy(ev.comm, w->comm, sizeof(ev.comm)-1);
    strncpy(ev.detail, w->detail, sizeof(ev.detail)-1);
    ev.ts = w->ts_ns / 1000000000ULL; /* nanosaniyeden saniyeye */

    attack_tree_submit(&ev);
    daemon_stats_note_lineage();
    if (w->type == 2) /* LINEAGE_CONNECT */
        daemon_stats_note_lineage_connect();
    return 0;
}

static void lineage_probe_init(const char *obj_path) {
    if (!obj_path) return;
    
    attack_tree_init();

    g_lineage_obj = bpf_object__open_file(obj_path, NULL);
    if (!g_lineage_obj || libbpf_get_error(g_lineage_obj)) {
        syslog(LOG_WARNING, "[LINEAGE-PROBE] BPF acilamadi: %s", obj_path);
        g_lineage_obj = NULL;
        return;
    }
    if (bpf_object__load(g_lineage_obj) != 0) {
        syslog(LOG_WARNING, "[LINEAGE-PROBE] BPF yukleme hatasi");
        bpf_object__close(g_lineage_obj); g_lineage_obj = NULL;
        return;
    }

    struct bpf_map *rb = bpf_object__find_map_by_name(g_lineage_obj, "lineage_events");
    if (rb) {
        g_lineage_ringbuf = ring_buffer__new(bpf_map__fd(rb), lineage_ringbuf_cb, NULL, NULL);
    }

    struct bpf_program *p_openat  = bpf_object__find_program_by_name(g_lineage_obj, "trace_openat");
    struct bpf_program *p_execve  = bpf_object__find_program_by_name(g_lineage_obj, "trace_execve");
    struct bpf_program *p_connect = bpf_object__find_program_by_name(g_lineage_obj, "trace_connect");
    struct bpf_program *p_write   = bpf_object__find_program_by_name(g_lineage_obj, "trace_write");

    if (p_openat)  g_link_lin_openat  = bpf_program__attach(p_openat);
    if (p_execve)  g_link_lin_execve  = bpf_program__attach(p_execve);
    if (p_connect) g_link_lin_connect = bpf_program__attach(p_connect);
    if (p_write)   g_link_lin_write   = bpf_program__attach(p_write);

    syslog(LOG_INFO, "[LINEAGE-PROBE] Attack tree izleyici kancalari yuklendi.");
}

static int lineage_probe_active(void)
{
    return g_lineage_ringbuf != NULL;
}

static void lineage_probe_cleanup(void) {
    if (g_link_lin_openat)  { bpf_link__destroy(g_link_lin_openat);  g_link_lin_openat  = NULL; }
    if (g_link_lin_execve)  { bpf_link__destroy(g_link_lin_execve);  g_link_lin_execve  = NULL; }
    if (g_link_lin_connect) { bpf_link__destroy(g_link_lin_connect); g_link_lin_connect = NULL; }
    if (g_link_lin_write)   { bpf_link__destroy(g_link_lin_write);   g_link_lin_write   = NULL; }
    if (g_lineage_ringbuf)  { ring_buffer__free(g_lineage_ringbuf);  g_lineage_ringbuf  = NULL; }
    if (g_lineage_obj)      { bpf_object__close(g_lineage_obj);      g_lineage_obj      = NULL; }
}

#else /* HAVE_LIBBPF yok */
static int  xdp_init(const char *o,const char *i,int s4,int s6){(void)o;(void)i;(void)s4;(void)s6;syslog(LOG_WARNING,"[DAEMON] libbpf yok");return -1;}
static void xdp_cleanup(void){}
static int  do_ban_v4(const char *ip,uint8_t p){(void)ip;(void)p;return -1;}
static int  do_unban_v4(const char *ip,uint8_t p){(void)ip;(void)p;return -1;}
static int  do_ban_v6(const char *ip){(void)ip;return -1;}
static int  do_unban_v6(const char *ip){(void)ip;return -1;}
static int  do_tarpit_v4(const char *ip,uint8_t p,uint8_t pr){(void)ip;(void)p;(void)pr;return -1;}
static int  do_tarpit_v6(const char *ip,uint8_t pr){(void)ip;(void)pr;return -1;}
static void uprobe_init(const char *o){(void)o;}
static void uprobe_cleanup(void){}
static void execve_probe_init(const char *o){(void)o;}
static void execve_probe_cleanup(void){}
static int execve_probe_active(void){return 0;}
static void lineage_probe_init(const char *o){(void)o;}
static void lineage_probe_cleanup(void){}
static int lineage_probe_active(void){return 0;}
static void http_l7_probe_init(const char *o){(void)o;}
static void http_l7_probe_cleanup(void){}
static int http_l7_probe_active(void){return 0;}
#endif /* HAVE_LIBBPF */

/* ── IPC sunucusu ──────────────────────────────────────────────────── */

static int setup_ipc_server(void) {
    const char *grp_name = getenv("LOG_GUARDIAN_IPC_GROUP");
    if (!grp_name || !grp_name[0])
        grp_name = "log-guardian";
    struct group *gr = getgrnam(grp_name);
    gid_t ipc_gid = gr ? gr->gr_gid : (gid_t)-1;

    /* RuntimeDirectory systemd tarafindan da olusturulabilir */
    if (mkdir("/run/log-guardian", 0750) < 0 && errno != EEXIST) {
        syslog(LOG_ERR, "[DAEMON] /run/log-guardian olusturulamadi: %s", strerror(errno));
        return -1;
    }
    if (ipc_gid != (gid_t)-1)
        chown("/run/log-guardian", 0, ipc_gid);
    chmod("/run/log-guardian", 0750);

    int fd = socket(AF_UNIX, SOCK_SEQPACKET | SOCK_CLOEXEC, 0);
    if (fd < 0) {
        syslog(LOG_ERR, "[DAEMON] socket() hatasi: %s", strerror(errno));
        return -1;
    }

    unlink(DAEMON_IPC_SOCK_PATH);

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, DAEMON_IPC_SOCK_PATH, sizeof(addr.sun_path) - 1);

    /* bind oncesi egid → soket log-guardian grubunda olusur (sandbox chown fail) */
    gid_t saved_egid = getegid();
    if (ipc_gid != (gid_t)-1)
        setegid(ipc_gid);

    if (bind(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        if (ipc_gid != (gid_t)-1)
            setegid(saved_egid);
        syslog(LOG_ERR, "[DAEMON] bind() hatasi: %s", strerror(errno));
        close(fd);
        return -1;
    }

    if (ipc_gid != (gid_t)-1)
        setegid(saved_egid);

    if (ipc_gid != (gid_t)-1) {
        if (chown(DAEMON_IPC_SOCK_PATH, 0, ipc_gid) != 0)
            syslog(LOG_DEBUG, "[DAEMON] chown sock (ExecStartPost yedek): %s", strerror(errno));
    } else {
        syslog(LOG_WARNING, "[DAEMON] grup yok: %s (bash scripts/fix_ipc_perms.sh)",
               grp_name);
    }
    chmod(DAEMON_IPC_SOCK_PATH, 0660);

    if (listen(fd, DAEMON_IPC_BACKLOG) < 0) {
        syslog(LOG_ERR, "[DAEMON] listen() hatasi: %s", strerror(errno));
        close(fd);
        return -1;
    }

    return fd;
}

static void handle_client(int client_fd) {
    IpcMessage  msg;
    IpcResponse resp;
    uid_t peer_uid = (uid_t)-1;
    gid_t peer_gid = (uid_t)-1;

#ifdef SO_PEERCRED
    struct ucred cred;
    socklen_t clen = sizeof(cred);
    if (getsockopt(client_fd, SOL_SOCKET, SO_PEERCRED, &cred, &clen) == 0) {
        peer_uid = cred.uid;
        peer_gid = cred.gid;
    }
#endif

    ssize_t n = recv(client_fd, &msg, sizeof(msg), 0);
    if (n != (ssize_t)sizeof(msg)) {
        close(client_fd);
        return;
    }

    memset(&resp, 0, sizeof(resp));

    if (msg.cmd != IPC_CMD_PING && ipc_auth_required()) {
        int peer_ok = (peer_uid != (uid_t)-1) &&
                      ipc_auth_peer_allowed(peer_uid, peer_gid);
        int tok_ok = ipc_auth_validate_message(msg.auth_token);
        if (!peer_ok && !tok_ok) {
            resp.ok = -1;
            strncpy(resp.errmsg, "IPC auth denied", sizeof(resp.errmsg) - 1);
            send(client_fd, &resp, sizeof(resp), MSG_NOSIGNAL);
            close(client_fd);
            syslog(LOG_WARNING, "[DAEMON] IPC auth reddedildi uid=%u", (unsigned)peer_uid);
            return;
        }
        if (msg.cmd != IPC_CMD_PING && !tok_ok) {
            resp.ok = -1;
            strncpy(resp.errmsg, "IPC token invalid", sizeof(resp.errmsg) - 1);
            send(client_fd, &resp, sizeof(resp), MSG_NOSIGNAL);
            close(client_fd);
            return;
        }
    }

    int rc = 0;
    msg.ip[sizeof(msg.ip) - 1] = '\0';
    uint8_t v4_prefix = msg.prefix ? msg.prefix : 32;

    switch (msg.cmd) {
        case IPC_CMD_BAN_V4:
            if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid ban v4", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_ban_v4(msg.ip, v4_prefix);
            }
            syslog(LOG_INFO, "[DAEMON] BAN v4 %s/%u: %s",
                   msg.ip, (unsigned)v4_prefix, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_BAN_V6:
            if (ipc_validate_ban_ipv6(msg.ip) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid ban v6", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_ban_v6(msg.ip);
            }
            syslog(LOG_INFO, "[DAEMON] BAN v6 %s: %s",
                   msg.ip, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_UNBAN_V4:
            if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid unban v4", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_unban_v4(msg.ip, v4_prefix);
            }
            syslog(LOG_INFO, "[DAEMON] UNBAN v4 %s/%u: %s",
                   msg.ip, (unsigned)v4_prefix, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_UNBAN_V6:
            if (ipc_validate_ban_ipv6(msg.ip) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid unban v6", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_unban_v6(msg.ip);
            }
            syslog(LOG_INFO, "[DAEMON] UNBAN v6 %s: %s",
                   msg.ip, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_PING:
            rc = 0;
            break;

        case IPC_CMD_TARPIT_V4:
            if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid tarpit v4", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_tarpit_v4(msg.ip, v4_prefix, msg.prob);
            }
            syslog(LOG_INFO, "[DAEMON] TARPIT v4 %s/%u prob=%u: %s",
                   msg.ip, (unsigned)v4_prefix, msg.prob, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_TARPIT_V6:
            if (ipc_validate_ban_ipv6(msg.ip) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid tarpit v6", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_tarpit_v6(msg.ip, msg.prob);
            }
            syslog(LOG_INFO, "[DAEMON] TARPIT v6 %s prob=%u: %s",
                   msg.ip, msg.prob, rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_SHUTDOWN:
            if (!ipc_auth_shutdown_allowed(peer_uid, msg.auth_token)) {
                rc = -1;
                strncpy(resp.errmsg, "shutdown denied", sizeof(resp.errmsg) - 1);
                syslog(LOG_WARNING, "[DAEMON] Kapatma reddedildi uid=%u",
                       (unsigned)peer_uid);
                break;
            }
            syslog(LOG_INFO, "[DAEMON] Kapatma komutu alindi.");
            g_running = 0;
            rc = 0;
            break;

        case IPC_CMD_RCE_ALERT:
            /* Analyzer prosesten gelen RCE uyarısı (ikincil yol) */
            syslog(LOG_CRIT,
                   "[DAEMON] RCE ALERT: PID=%u Cmd=%.64s IP=%s",
                   msg.pid, msg.cmdline, msg.ip);
            if (msg.ip[0] != '\0') {
                if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0)
                    rc = -1;
                else
                    rc = do_ban_v4(msg.ip, v4_prefix);
            } else {
                rc = 0;
            }
            break;

        case IPC_CMD_TARPIT_START:
            if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid tarpit start", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_tarpit_v4(msg.ip, v4_prefix, msg.prob);
            }
            syslog(LOG_INFO, "[DAEMON] TARPIT_START %s/%u prob=%u: %s",
                   msg.ip, (unsigned)v4_prefix, msg.prob,
                   rc == 0 ? "OK" : "FAIL");
            break;

        case IPC_CMD_TARPIT_STOP:
            if (ipc_validate_ban_ipv4(msg.ip, &v4_prefix) != 0) {
                rc = -1;
                strncpy(resp.errmsg, "invalid tarpit stop", sizeof(resp.errmsg) - 1);
            } else {
                rc = do_unban_v4(msg.ip, v4_prefix);
            }
            syslog(LOG_INFO, "[DAEMON] TARPIT_STOP %s/%u: %s",
                   msg.ip, (unsigned)v4_prefix, rc == 0 ? "OK" : "FAIL");
            break;

        default:
            syslog(LOG_WARNING, "[DAEMON] Bilinmeyen komut: %d", (int)msg.cmd);
            rc = -1;
            snprintf(resp.errmsg, sizeof(resp.errmsg), "Bilinmeyen komut");
            break;
    }

    resp.ok = (int8_t)(rc == 0 ? 0 : -1);
    if (rc != 0 && resp.errmsg[0] == '\0') {
        snprintf(resp.errmsg, sizeof(resp.errmsg),
                 "Ban/ipset hatasi: %s", strerror(errno));
    }

    send(client_fd, &resp, sizeof(resp), MSG_NOSIGNAL);
    if (rc == 0 && (msg.cmd == IPC_CMD_BAN_V4 || msg.cmd == IPC_CMD_UNBAN_V4
                    || msg.cmd == IPC_CMD_BAN_V6 || msg.cmd == IPC_CMD_UNBAN_V6))
        g_bans_json_dirty = 1;
    close(client_fd);
}

static void *ipc_client_worker(void *arg)
{
    handle_client((int)(intptr_t)arg);
    return NULL;
}

static void handle_term(int sig) { (void)sig; g_running = 0; }

static void usage_daemon(const char *prog) {
    fprintf(stderr,
            "Kullanim: %s --iface <iface> [--obj <xdp_filter.o>]\n"
            "             [--map-v4-size N] [--map-v6-size N]\n"
            "  Bu daemon root ile calistirilmali ve analyzer'dan once baslamalidir.\n",
            prog);
}

/* ── io_uring Kabul Döngüsü ──────────────────────────────────────── */

#define URING_QUEUE_DEPTH 64
#define URING_ACCEPT_USER_DATA  0x1000UL
#define URING_POLL_TLS_UD       0x2000UL
#define URING_POLL_LINEAGE_UD   0x3000UL
#define URING_POLL_RCE_UD       0x4000UL
#define URING_POLL_L7_UD        0x5000UL

/* IPC accept ayri thread — io_uring ringbuf yogunlugunda ping/ban gecikmesin */
static void *ipc_accept_thread(void *arg)
{
    (void)arg;
    syslog(LOG_INFO, "[DAEMON] IPC accept thread aktif.");
    while (g_running) {
        struct pollfd pfd = { .fd = g_server_fd, .events = POLLIN };
        int pr = poll(&pfd, 1, 200);
        if (pr < 0) {
            if (errno == EINTR) continue;
            syslog(LOG_ERR, "[DAEMON] IPC poll() hatasi: %s", strerror(errno));
            break;
        }
        if (pr == 0) continue;
        if (!(pfd.revents & POLLIN)) continue;

        struct sockaddr_un caddr;
        socklen_t clen = sizeof(caddr);
        int client = accept(g_server_fd, (struct sockaddr *)&caddr, &clen);
        if (client < 0) {
            if (errno == EINTR) continue;
            if (g_running)
                syslog(LOG_ERR, "[DAEMON] IPC accept() hatasi: %s", strerror(errno));
            continue;
        }
        pthread_t th;
        if (pthread_create(&th, NULL, ipc_client_worker, (void *)(intptr_t)client) != 0)
            handle_client(client);
        else
            pthread_detach(th);
    }
    return NULL;
}

static void start_ipc_accept_thread(void)
{
    pthread_t th;
    pthread_attr_t attr;
    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);
    if (pthread_create(&th, &attr, ipc_accept_thread, NULL) != 0)
        syslog(LOG_ERR, "[DAEMON] IPC accept thread baslatilamadi");
    pthread_attr_destroy(&attr);
}

static void io_uring_accept_loop(void) {
    struct io_uring ring;
    struct io_uring_params params;
    memset(&params, 0, sizeof(params));

    if (io_uring_queue_init_params(URING_QUEUE_DEPTH, &ring, &params) < 0) {
        syslog(LOG_WARNING,
               "[DAEMON] io_uring init basarisiz, klasik accept() kullaniliyor.");
        goto fallback;
    }

    syslog(LOG_INFO, "[DAEMON] io_uring ringbuf loop aktif (queue_depth=%d).",
           URING_QUEUE_DEPTH);

    /* TLS ring buffer poll SQE (varsa) */
    if (g_tls_ringbuf) {
        int rb_fd = ring_buffer__epoll_fd(g_tls_ringbuf);
        if (rb_fd >= 0) {
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
            io_uring_sqe_set_data64(sqe, URING_POLL_TLS_UD);
            io_uring_submit(&ring);
        }
    }
    
    /* Lineage ring buffer poll SQE (varsa) */
    if (g_lineage_ringbuf) {
        int rb_fd = ring_buffer__epoll_fd(g_lineage_ringbuf);
        if (rb_fd >= 0) {
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
            io_uring_sqe_set_data64(sqe, URING_POLL_LINEAGE_UD);
            io_uring_submit(&ring);
        }
    }
    if (g_rce_ringbuf) {
        int rb_fd = ring_buffer__epoll_fd(g_rce_ringbuf);
        if (rb_fd >= 0) {
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
            io_uring_sqe_set_data64(sqe, URING_POLL_RCE_UD);
            io_uring_submit(&ring);
        }
    }
    if (g_l7_ringbuf) {
        int rb_fd = ring_buffer__epoll_fd(g_l7_ringbuf);
        if (rb_fd >= 0) {
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
            io_uring_sqe_set_data64(sqe, URING_POLL_L7_UD);
            io_uring_submit(&ring);
        }
    }

    while (g_running) {
        struct io_uring_cqe *cqe;
        struct __kernel_timespec ts = { .tv_sec = 1, .tv_nsec = 0 };
        int ret = io_uring_wait_cqe_timeout(&ring, &cqe, &ts);

        /* Watchdog ping ve attack tree JSON export */
        static time_t last_wd = 0;
        time_t now = time(NULL);
        if (now - last_wd >= 5) {
            if (sd_notify_fn) sd_notify_fn(0, "WATCHDOG=1");
            if (g_bans_json_dirty) {
                export_active_bans_json();
                g_bans_json_dirty = 0;
            }
            daemon_export_attack_tree();
            daemon_stats_write_file();
            last_wd = now;
        }

        if (ret == -ETIME) {
            daemon_poll_ringbufs();
            continue;
        }
        if (ret < 0) {
            if (errno == EINTR) continue;
            syslog(LOG_ERR, "[DAEMON] io_uring_wait_cqe: %s", strerror(-ret));
            break;
        }

        uint64_t ud = (uint64_t)io_uring_cqe_get_data64(cqe);
        io_uring_cqe_seen(&ring, cqe);

        if (ud == URING_POLL_TLS_UD) {
            /* TLS ring buffer'dan olayları tüket */
            if (g_tls_ringbuf) ring_buffer__poll(g_tls_ringbuf, 0);

            /* Poll'u yeniden kuyruğa al */
            int rb_fd = ring_buffer__epoll_fd(g_tls_ringbuf);
            if (rb_fd >= 0) {
                struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
                io_uring_sqe_set_data64(sqe, URING_POLL_TLS_UD);
                io_uring_submit(&ring);
            }
        } else if (ud == URING_POLL_LINEAGE_UD) {
            if (g_lineage_ringbuf) ring_buffer__poll(g_lineage_ringbuf, 0);
            
            int rb_fd = ring_buffer__epoll_fd(g_lineage_ringbuf);
            if (rb_fd >= 0) {
                struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
                io_uring_sqe_set_data64(sqe, URING_POLL_LINEAGE_UD);
                io_uring_submit(&ring);
            }
        } else if (ud == URING_POLL_RCE_UD) {
            if (g_rce_ringbuf) ring_buffer__poll(g_rce_ringbuf, 0);

            int rb_fd = ring_buffer__epoll_fd(g_rce_ringbuf);
            if (rb_fd >= 0) {
                struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
                io_uring_sqe_set_data64(sqe, URING_POLL_RCE_UD);
                io_uring_submit(&ring);
            }
        } else if (ud == URING_POLL_L7_UD) {
            if (g_l7_ringbuf) ring_buffer__poll(g_l7_ringbuf, 0);

            int rb_fd = ring_buffer__epoll_fd(g_l7_ringbuf);
            if (rb_fd >= 0) {
                struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                io_uring_prep_poll_add(sqe, rb_fd, POLLIN);
                io_uring_sqe_set_data64(sqe, URING_POLL_L7_UD);
                io_uring_submit(&ring);
            }
        }
    }

    io_uring_queue_exit(&ring);
    return;

fallback:
    /* io_uring yok — ringbuf poll (IPC accept ayri thread'de) */
    syslog(LOG_INFO, "[DAEMON] Klasik ringbuf poll dongusu.");
    while (g_running) {
        static time_t last_wd2 = 0;
        time_t now2 = time(NULL);
        if (now2 - last_wd2 >= 5) {
            if (sd_notify_fn) sd_notify_fn(0, "WATCHDOG=1");
            if (g_bans_json_dirty) {
                export_active_bans_json();
                g_bans_json_dirty = 0;
            }
            daemon_export_attack_tree();
            daemon_stats_write_file();
            last_wd2 = now2;
        }
        daemon_poll_ringbufs();
        usleep(200000);
    }
}

int main(int argc, char *argv[]) {
    openlog("log-guardian-daemon", LOG_PID | LOG_NDELAY, LOG_DAEMON);
    ipc_auth_load_env_file("/etc/log-guardian/env");
    ipc_auth_init();

    const char *iface       = NULL;
    const char *obj_path    = "xdp_filter.o";
    int         map_v4_size = 0;
    int         map_v6_size = 0;

    for (int i = 1; i < argc; i++) {
        if      (strcmp(argv[i], "--iface") == 0 && i + 1 < argc) iface = argv[++i];
        else if (strcmp(argv[i], "--obj")   == 0 && i + 1 < argc) obj_path = argv[++i];
        else if (strcmp(argv[i], "--map-v4-size") == 0 && i + 1 < argc)
            map_v4_size = atoi(argv[++i]);
        else if (strcmp(argv[i], "--map-v6-size") == 0 && i + 1 < argc)
            map_v6_size = atoi(argv[++i]);
        else if (strcmp(argv[i], "--help") == 0 || strcmp(argv[i], "-h") == 0) {
            usage_daemon(argv[0]);
            return 0;
        }
    }

    if (!iface) {
        usage_daemon(argv[0]);
        return 1;
    }

    /* systemd bildirim (opsiyonel) */
    void *libsd = dlopen("libsystemd.so.0", RTLD_NOW | RTLD_NODELETE);
    if (libsd) {
        /* POSIX: dlsym() void*'dan function pointer'a union ile aktar
         * (-Wpedantic uyarısından kacınmak icin). */
        union { void *p; int (*fn)(int, const char *); } u;
        u.p = dlsym(libsd, "sd_notify");
        sd_notify_fn = u.fn;
    }

    /* Sinyal kurulumu */
    struct sigaction sa = {0};
    sa.sa_handler = handle_term;
    sigaction(SIGTERM, &sa, NULL);
    sigaction(SIGINT,  &sa, NULL);
    signal(SIGPIPE, SIG_IGN);

    /* XDP, TLS uprobe ve execve (Zero Trust RCE) yükle */
    daemon_stats_init_clock();
    syslog(LOG_INFO, "[DAEMON] Baslatiliyor: iface=%s obj=%s", iface, obj_path);
    int xdp_ok = (xdp_init(obj_path, iface, map_v4_size, map_v6_size) == 0);
    if (!xdp_ok) {
        syslog(LOG_WARNING,
               "[DAEMON] XDP devre disi — ban IPC + ipset ile devam (Wi-Fi/generic NIC normal).");
        fprintf(stderr,
                "[DAEMON] XDP: OFF — kernel ban map yok; ipset/iptables kullanilacak.\n");
    }
    uprobe_init("tls_uprobe.o");
    execve_probe_init("syscall_uprobe.o");
    lineage_probe_init("lineage_probe.o");
    http_l7_probe_init("http_l7_probe.o");

    int execve_ok = execve_probe_active();
    int lineage_ok = lineage_probe_active();
    int l7_ok = http_l7_probe_active();
    daemon_stats_set_caps(xdp_ok, execve_ok, lineage_ok, l7_ok);
    fprintf(stderr,
            "[DAEMON] BPF: XDP=%s | execve=%s | lineage=%s | l7=%s | IPC ban=aktif\n",
            xdp_ok ? "ON" : "OFF",
            execve_ok ? "ON" : "OFF",
            lineage_ok ? "ON" : "OFF",
            l7_ok ? "ON" : "OFF");

    /* IPC sunucu soket */
    g_server_fd = setup_ipc_server();
    if (g_server_fd < 0) {
        syslog(LOG_ERR, "[DAEMON] IPC sunucu baslatılamadı!");
        uprobe_cleanup();
        xdp_cleanup();
        return 1;
    }

    ensure_ipset_ready();
    export_active_bans_json();
    daemon_stats_write_file();

    syslog(LOG_INFO, "[DAEMON] Hazir. IPC: %s", DAEMON_IPC_SOCK_PATH);

    start_watchdog_thread();
    start_ipc_accept_thread();

    /* systemd'ye hazır olduğumuzu bildir */
    if (sd_notify_fn) sd_notify_fn(0, "READY=1");

    /* io_uring ringbuf loop (IPC accept ayri thread) */
    io_uring_accept_loop();

    syslog(LOG_INFO, "[DAEMON] Kapatiliyor...");
    if (sd_notify_fn) sd_notify_fn(0, "STOPPING=1");
    close(g_server_fd);
    unlink(DAEMON_IPC_SOCK_PATH);
    lineage_probe_cleanup();
    http_l7_probe_cleanup();
    execve_probe_cleanup();
    uprobe_cleanup();
    xdp_cleanup();
    closelog();
    return 0;
}
