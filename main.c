#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <sys/inotify.h>
#include <pthread.h>
#include <signal.h>
#include <termios.h>
#include <time.h>
#include <ctype.h>
#include <errno.h>
#include <stdint.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <stdatomic.h>
#include <limits.h>
#include <pwd.h>
#include <grp.h>
#include <poll.h>
#include <emmintrin.h>   /* _mm_pause() — lock-free spin-wait */

#include "memory_pool.h"
#include "parser.h"
#include "ip_map.h"
#include "min_heap.h"
#include "anomaly.h"
#include "tui.h"
#include "db.h"
#include "webhook.h"
#include "telegram_bot.h"
#include "pcre_engine.h"
#include "xdp_loader.h"
#include "metrics.h"
#include "siem_fsm.h"
#include "pkt_inspector.h"
#include "logger.h"
#include "daemon_ipc.h"
#include "ipc_auth.h"
#include "daemon_stats.h"
#include "ban_pipeline.h"
#include "mesh_backend.h"
#include "incident_engine.h"
#include "rules_fleet.h"
#include "endpoint_baseline.h"
#include "geoip_feed.h"
#include "geoip_lookup.h"
#include "falco_host_rules.h"
#include "fp_trust.h"
#include "ban_policy.h"
#include "tenant_db.h"
#include "tenant_policy.h"
#include "l7_telemetry.h"
#include "attack_tree.h"
#include "attack_tree_snapshot.h"
#include "schema_validator.h"
#include "wasm_runtime.h"
#include "k8s_webhook.h"
#include "adaptive_threshold.h"
#include "ja3_engine.h"
#include "ja3_cluster.h"
#include "threat_feed.h"
#include "crypto_utils.h"
#include "auth.h"
#include "firewall.h"
#include "trap_watcher.h"
#include "api_server.h"
#include "tarpit_server.h"
#include "deception.h"
#include "covert_ch.h"
#include "mesh_intel.h"
#include "etcd_mesh.h"
#include "agent_sync.h"
#include "siem_forwarder.h"
#include <dlfcn.h>
#include <liburing.h>

#ifdef HAVE_LIBBPF
#include <bpf/libbpf.h>
#include <bpf/bpf.h>
static struct ring_buffer *g_ringbuf = NULL;
#endif

static volatile int g_running = 1;

/* Systemd notification function pointer */
static int (*sd_notify_ptr)(int, const char *) = NULL;
static volatile int g_paused  = 0;
int g_use_tui = 1;

int g_allow_ban = 1;
int g_operator_quiet = 0;
int g_output_json = 0;
static int g_follow = 0;
static const char *g_rules_path = NULL;
char g_access_password_hash[65] = "";
char g_access_password_kdf[256] = "";
char g_password_file_path[256] = "";
static char g_db_path_buf[256] = "events.db";
static const char *g_db_path = g_db_path_buf;
static int  g_db_path_cli = 0;  /* --db verildiyse rules.conf DB_PATH ezmesin */
static int  g_multi_tenant_db = 0;
int g_db_enabled = 1;
static int g_db_cli_off = 0;
static int g_ban_cli_off = 0;
static int g_webhook_cli_off = 0;
static int g_ban_ttl_sec = 600;
static int g_intel_ban_db_ttl_days = 30;
int g_auth_max_attempts = 3;
int g_drop_privs = 0;
static int g_metrics_port   = 9091;  /* Prometheus endpoint portu (0=devre disi) */
static int g_api_port       = API_DEFAULT_PORT;
static char g_api_bind[64]  = "127.0.0.1";
static char g_api_token[128] = "";
static int g_xdp_map_v4_sz  = 0;     /* 0 = varsayilan (65536) */
static int g_xdp_map_v6_sz  = 0;     /* 0 = varsayilan (16384) */

/* Phase 5: SaaS Multi-Tenancy & Etcd Mesh */
char g_tenant_id[128] = "default_tenant";
char g_mesh_etcd_endpoints[512] = "";
static char g_mesh_backend_cfg[16] = "etcd";
static int  g_openapi_strict = 0;

/* Honey-token Trap URL'leri */
#define MAX_TRAP_URLS 32



/* SIGHUP: kuralları yeniden yükle (hot-reload) */
static volatile int g_sighup_pending = 0;

/* XDP/eBPF modu: ağ arayüzü adı (örn: "eth0"). NULL = devre dışı */
static const char *g_xdp_iface = NULL;

/* Upload dizini izleme: WebShell tespiti */




/* Bellek havuzu GC thread */
static pthread_t g_gc_thread;
static int g_gc_thread_started = 0;

/* Privilege separation: daemon IPC soket bağlantısı */
int g_ipc_fd = -1;  /* -1 = daemon modu değil, direkt XDP */

#define MAX_TRAP_FILES 16




#define MAX_WHITELIST_IPS 256
static char g_whitelist_ips[MAX_WHITELIST_IPS][IP_STR_LEN];
static size_t g_whitelist_count = 0;
static pthread_mutex_t g_whitelist_mutex = PTHREAD_MUTEX_INITIALIZER;

static char g_crs_rules_path[512] = "rules/crs-bundle.rules";
static char g_falco_host_rules_path[512] = "";
static int  g_crs_enabled = 1;
static char g_openapi_schema_path[512] = "";
static int  g_lineage_auto_alert = 1;
static int  g_wasm_enabled = 1;
static char g_wasm_plugin_dir[256] = WASM_PLUGIN_DIR_DEFAULT;

IpMap g_ipmap;
MinHeap g_top10;
TuiStats g_stats;   /* mutex altinda guncellenir */

struct timeval t_start, t_now;

/* Worker thread'lerden lock-free guncellenen ham sayaclar */
_Atomic long g_atomic_lines  = 0;
_Atomic long g_atomic_errors = 0;
static _Atomic long g_atomic_bytes  = 0;
_Atomic long g_atomic_alerts = 0;
_Atomic long g_atomic_ban_attempts = 0;
_Atomic long g_atomic_ban_success  = 0;
_Atomic long g_atomic_ban_fail     = 0;
static _Atomic long g_cnt_get    = 0;
static _Atomic long g_cnt_post   = 0;
static _Atomic long g_cnt_put    = 0;
static _Atomic long g_cnt_delete = 0;
static _Atomic long g_cnt_other  = 0;
static _Atomic long g_cnt_2xx    = 0;
static _Atomic long g_cnt_3xx    = 0;
static _Atomic long g_cnt_4xx    = 0;
static _Atomic long g_cnt_5xx    = 0;

/*
 * atexit_cleanup - program herhangi bir yoldan cikarsa (normal, assert,
 * abort) terminali temiz birakir. SIGSEGV / SIGTERM gibi sinyallerde
 * signal handler bu fonksiyonu tetikler.
 */
/* Forward declaration - tanim asagida */
static void restore_kbd(void);

static void atexit_cleanup(void) {
    if (g_ipc_fd >= 0) {
        daemon_ipc_close(g_ipc_fd);
        g_ipc_fd = -1;
    }
    webhook_shutdown();
    if (g_use_tui) {
        restore_kbd();
        tui_cleanup();
    }
    if (g_db_enabled) db_close();
    pcre_engine_destroy();
    xdp_loader_destroy();
    if (g_pool.base || g_pool.overflow)
        pool_destroy(&g_pool);
}

#define CHUNK_SIZE (4 * 1024)   /* follow modunda kucuk chunk: her satir aninda islenir */

typedef struct {
    const char *start;
    const char *end;
} WorkChunk;

/*
 * SpMcQueue — Lock-free Single-Producer / Multi-Consumer halka tamponu.
 *
 * Üretici (main thread): head'i atomik artırır, CAS gerekmez.
 * Tüketiciler (worker'lar): tail'i CAS ile atomik artırır.
 * power-of-2 boyut: modül işlemi yerine bit-AND maskeleme.
 */
#define QUEUE_SIZE 2048u           /* 2^11 — güç-ikisi zorunlu */
#define QUEUE_MASK (QUEUE_SIZE - 1u)

typedef struct {
    WorkChunk        slots[QUEUE_SIZE];   /* veri yuvalar */
    char             _pad0[64];           /* false sharing engeli */
    _Atomic uint64_t head;               /* üretici yazar (sadece main thread) */
    char             _pad1[56];           /* cache satırı dolgusu */
    _Atomic uint64_t tail;               /* tüketiciler CAS ile alır */
    char             _pad2[56];
    _Atomic int      done;               /* 1 = üretici bitti */
} SpMcQueue;

static SpMcQueue g_queue;
static pthread_t *g_workers;
static int g_num_workers = 4;
static _Atomic long g_batch_lines = 0;
pthread_mutex_t g_tui_mutex = PTHREAD_MUTEX_INITIALIZER;

static void handle_sigint(int sig) {
    (void)sig;
    g_running = 0;
}

/*
 * handle_fatal - SIGSEGV / SIGBUS gibi olumcul sinyallerde terminali
 * temiz birakip varsayilan isleyiciyi yeniden devreye alir.
 * (Sonsuz donguden kacmak icin SA_RESETHAND kullaniyoruz.)
 */
static void handle_fatal(int sig) {
    /* Kucuk, async-signal-safe islemler */
    if (g_use_tui) {
        /* ANSI: imleci goster, ekrani sifirla.
         * Signal handler icinde printf guvensiz; write() async-signal-safe.
         * Donus degeri bilerek yoksayilir (baska yapacak bir sey yok). */
        const char restore[] = "\x1b[?25h\x1b[0m\n";
        ssize_t __attribute__((unused)) _wr =
            write(STDERR_FILENO, restore, sizeof(restore) - 1);
    }
    /* Varsayilan isleyiciyi tetikle - core dump / cikis */
    raise(sig);
}

static void handle_sigwinch(int sig) {
    (void)sig;
}

static void handle_sighup(int sig) {
    (void)sig;
    g_sighup_pending = 1;  /* async-signal-safe: sadece flag set et */
}

/* is_valid_ip, trim_ws, secure_equals, secure_zero → firewall.c / crypto_utils.c */

static char *trim_ws(char *s) {
    while (*s && isspace((unsigned char)*s)) s++;
    if (*s == '\0') return s;
    char *end = s + strlen(s) - 1;
    while (end > s && isspace((unsigned char)*end)) {
        *end = '\0';
        end--;
    }
    return s;
}

/* ── Moved to separate modules ────────────────────────────────────────────
 * crypto_utils.c : Sha256Ctx, sha256_*, hmac_sha256, pbkdf2_sha256_hex,
 *                  validate_kdf_and_verify, is_hex_64, hex_decode,
 *                  secure_equals, secure_zero
 * auth.c         : is_secure_file, prompt_hidden_input, read_password_file,
 *                  enforce_startup_auth, maybe_drop_privileges, setup_seccomp
 * firewall.c     : is_valid_ip, is_ipv6_addr, ipset_name_for_ip,
 *                  run_ipset_create, run_fw_rule, ensure_fw_rule,
 *                  run_ipset_ip, ensure_ipset_ready, ban_ip, unban_ip,
 *                  send_desktop_notification
 * trap_watcher.c : add_trap_file, ensure_default_trap_files,
 *                  setup_trap_watchers, trap_path_by_wd, process_trap_events,
 *                  setup_upload_watcher, file_is_webshell, process_upload_events
 * ──────────────────────────────────────────────────────────────────────── */



static int is_whitelisted_ip(const char *ip) {
    for (size_t i = 0; i < g_whitelist_count; i++) {
        if (strcmp(g_whitelist_ips[i], ip) == 0) return 1;
    }
    return 0;
}

static int lg_add_whitelist_ip(const char *ip)
{
    if (!ip || !is_valid_ip(ip))
        return -1;
    pthread_mutex_lock(&g_whitelist_mutex);
    if (is_whitelisted_ip(ip)) {
        pthread_mutex_unlock(&g_whitelist_mutex);
        return 0;
    }
    if (g_whitelist_count >= MAX_WHITELIST_IPS) {
        pthread_mutex_unlock(&g_whitelist_mutex);
        return -1;
    }
    strncpy(g_whitelist_ips[g_whitelist_count], ip, IP_STR_LEN - 1);
    g_whitelist_ips[g_whitelist_count][IP_STR_LEN - 1] = '\0';
    g_whitelist_count++;
    pthread_mutex_unlock(&g_whitelist_mutex);
    fprintf(stderr, "[WHITELIST] runtime eklendi: %s\n", ip);
    return 0;
}

static void fp_trust_promote_whitelist_cb(const char *ip)
{
    if (ip && ip[0])
        (void)lg_add_whitelist_ip(ip);
}

static void load_rules_file(const char *path);
static void resolve_path_from_rules(const char *rules_path, char *inout, size_t inout_sz);
static void operator_load_rules(void);
static int is_known_operator_cmd(const char *cmd)
{
    return strcmp(cmd, "--health") == 0 || strcmp(cmd, "--status") == 0 ||
           strcmp(cmd, "ban") == 0 || strcmp(cmd, "unban") == 0 ||
           strcmp(cmd, "crs-stats") == 0 || strcmp(cmd, "lineage-stats") == 0 ||
           strcmp(cmd, "incident-sim") == 0 ||
           strcmp(cmd, "threat-feed-sync") == 0 ||
           strcmp(cmd, "ban-db-prune") == 0 ||
           strcmp(cmd, "webhook-test") == 0 ||
           strcmp(cmd, "webhook-metrics-reset") == 0 ||
           strcmp(cmd, "daily-summary") == 0 ||
           strcmp(cmd, "weekly-summary") == 0 ||
           strcmp(cmd, "schema-check") == 0;
}

/* --rules oncesi/sonrasi: log-guardian --rules FILE webhook-metrics-reset */
static int operator_cmd_index(int argc, char **argv)
{
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--rules") == 0 || strcmp(argv[i], "--db") == 0) {
            i++;
            continue;
        }
        if (is_known_operator_cmd(argv[i]))
            return i;
        if (argv[i][0] == '-')
            continue;
    }
    return -1;
}

static int is_operator_cli(int argc, char **argv)
{
    return operator_cmd_index(argc, argv) >= 0;
}

static int whitelist_check_cb(const char *ip)
{
    return is_whitelisted_ip(ip);
}

static const char *ban_path_label(BanPath p)
{
    switch (p) {
    case BAN_PATH_IPC_XDP:       return "ipc-xdp";
    case BAN_PATH_XDP_DIRECT:    return "xdp";
    case BAN_PATH_IPSET:         return "ipset";
    case BAN_PATH_WHITELIST_SKIP: return "whitelist-skip";
    case BAN_PATH_INVALID_IP:    return "invalid";
    default:                     return "failed";
    }
}

static void operator_ipc_init(void)
{
    ipc_auth_load_env_file("/etc/log-guardian/env");
    ipc_auth_init();
}

static int cmd_operator_ban(int argc, char **argv)
{
    const char *ip = argv[2];
    const char *reason = "operator-cli";
    for (int i = 3; i + 1 < argc; i++) {
        if (strcmp(argv[i], "--reason") == 0) reason = argv[++i];
    }
    if (!is_valid_ip(ip)) {
        fprintf(stderr, "[ERR] Gecersiz IP: %s\n", ip);
        return 1;
    }
    operator_ipc_init();
    const char *rules = g_rules_path ? g_rules_path : "rules.conf";
    if (access(rules, F_OK) == 0) load_rules_file(rules);
    ban_pipeline_set_whitelist_fn(whitelist_check_cb);
    /* Operator CLI: ipset hazirligi (IPC basarisizsa dogrudan ipset yolu) */
    if (g_allow_ban && geteuid() == 0)
        ensure_ipset_ready();
    BanPath path = BAN_PATH_FAILED;
    int rc = ban_pipeline_ban(ip, reason, &path);
    if (rc == 0)
        printf("[OK] %s banlandi (yol=%s)\n", ip, ban_path_label(path));
    else
        fprintf(stderr, "[ERR] Ban basarisiz: %s\n", ip);
    return rc == 0 ? 0 : 1;
}

static void operator_db_log_ban(const char *ip, const char *action,
                                const char *reason)
{
    if (!ip || !action || !reason)
        return;
    operator_load_rules();
    if (!g_db_enabled || !g_db_path)
        return;
    if (db_init(g_db_path) != 0)
        return;
    db_log_ban_event(ip, action, reason, time(NULL));
    db_close();
}

static int cmd_operator_unban(int argc, char **argv)
{
    (void)argc;
    const char *ip = argv[2];
    if (!is_valid_ip(ip)) {
        fprintf(stderr, "[ERR] Gecersiz IP: %s\n", ip);
        return 1;
    }
    operator_ipc_init();
    ban_pipeline_set_whitelist_fn(NULL);
    int rc = ban_pipeline_unban(ip);
    if (rc == 0) {
        operator_db_log_ban(ip, "UNBAN", "operator-cli");
        printf("[OK] %s unban\n", ip);
    } else {
        fprintf(stderr, "[ERR] unban %s (ipset hala dolu olabilir — sudo ipset del log_analyzer_block_v4 %s)\n",
                ip, ip);
    }
    return rc == 0 ? 0 : 1;
}

static int cmd_incident_sim(void)
{
    operator_load_rules();
    incident_engine_init();
    const char *ip = "10.0.0.99";
    incident_engine_note_signal(ip, INC_SIG_LOG_SQLI);
    incident_engine_note_host_signal(INC_SIG_EBPF_EXECVE);
    Alert a = {0};
    a.level = ALERT_CRIT;
    a.ts = time(NULL);
    strncpy(a.ip, ip, sizeof(a.ip) - 1);
    snprintf(a.message, sizeof(a.message), "SQLi + execve correlation test");
    incident_engine_attach_alert(&a, ip);
    uint64_t active = 0, corr = 0;
    incident_engine_get_stats(&active, &corr);
    printf("{\"ip\":\"%s\",\"incident_id\":\"%s\",\"active\":%lu,\"correlated_total\":%lu}\n",
           ip, a.incident_id, (unsigned long)active, (unsigned long)corr);
    return a.incident_id[0] ? 0 : 1;
}

static int cmd_lineage_stats(int argc, char **argv)
{
    int demo = 0;
    int path_arg = 0;
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--path") == 0 && i + 1 < argc) {
            attack_tree_set_json_path(argv[++i]);
            path_arg = 1;
        } else if (strcmp(argv[i], "--demo") == 0) {
            demo = 1;
        }
    }

    if (demo) {
        int wrote = 0;
        if (path_arg && attack_tree_get_json_path()[0]) {
            if (attack_tree_write_demo_snapshot(attack_tree_get_json_path()) == 0) {
                fprintf(stderr, "[LINEAGE] Onizleme snapshot: %s\n",
                        attack_tree_get_json_path());
                wrote = 1;
            }
        } else {
            const char *home = getenv("HOME");
            char demo_path[512];
            const char *candidates[3];
            int nc = 0;
            candidates[nc++] = "./attack_tree.json";
            if (home && home[0]) {
                snprintf(demo_path, sizeof(demo_path),
                         "%s/.local/share/log-guardian/attack_tree.json", home);
                candidates[nc++] = demo_path;
            }
            for (int i = 0; i < nc && !wrote; i++) {
                if (attack_tree_write_demo_snapshot(candidates[i]) == 0) {
                    fprintf(stderr, "[LINEAGE] Onizleme snapshot: %s\n", candidates[i]);
                    wrote = 1;
                }
            }
        }
        if (!wrote) {
            fprintf(stderr, "[LINEAGE] Onizleme snapshot yazilamadi\n");
            return 1;
        }
    }

    AttackTreeSnapshot snap;
    if (attack_tree_snapshot_read(&snap, ATREE_RISK_THRESHOLD_ALERT) != 0) {
        printf("{\"error\":\"attack_tree.json_missing\",\"path\":\"%s\","
               "\"hint\":\"sudo ./log-guardian-daemon (canli) veya lineage-stats --demo (sadece onizleme)\"}\n",
               attack_tree_get_json_path());
        return 1;
    }
    printf("{\"path\":\"%s\",\"active_trees\":%lu,\"high_risk_trees\":%lu,"
           "\"total_events\":%lu,\"max_risk\":%.1f,"
           "\"top_comm\":\"%s\",\"top_pid\":%d}\n",
           attack_tree_get_json_path(),
           (unsigned long)snap.active_trees,
           (unsigned long)snap.high_risk_trees,
           (unsigned long)snap.total_events,
           snap.max_risk,
           snap.top_comm,
           (int)snap.top_pid);
    return 0;
}

static int cmd_crs_stats(void)
{
    const char *rules = g_rules_path ? g_rules_path : "rules.conf";
    if (access(rules, F_OK) == 0) {
        load_rules_file(rules);
        if (g_crs_rules_path[0])
            resolve_path_from_rules(rules, g_crs_rules_path, sizeof(g_crs_rules_path));
    }
    pcre_engine_init(rules);
    if (g_crs_enabled && g_crs_rules_path[0])
        pcre_engine_load_crs(g_crs_rules_path);
    if (g_falco_host_rules_path[0]) {
        resolve_path_from_rules(rules, g_falco_host_rules_path, sizeof(g_falco_host_rules_path));
        falco_host_rules_load_file(g_falco_host_rules_path);
    }
    BanPipelineStats bs;
    ban_pipeline_get_stats(&bs);
    printf("{\"pcre_total\":%d,\"pcre_crs\":%d,\"crs_file\":\"%s\","
           "\"ban_ipc\":%lu,\"ban_xdp\":%lu,\"ban_ipset\":%lu}\n",
           pcre_engine_pattern_count(),
           pcre_engine_crs_pattern_count(),
           g_crs_rules_path,
           (unsigned long)bs.via_ipc,
           (unsigned long)bs.via_xdp,
           (unsigned long)bs.via_ipset);
    pcre_engine_destroy();
    return 0;
}


static void json_escape_str(const char *in, char *out, size_t out_sz)
{
    if (!out || out_sz == 0) return;
    if (!in) { out[0] = '\0'; return; }
    size_t j = 0;
    for (size_t i = 0; in[i] && j + 2 < out_sz; i++) {
        char c = in[i];
        if (c == '"' || c == '\\') {
            if (j + 2 >= out_sz) break;
            out[j++] = '\\';
            out[j++] = c;
        } else if ((unsigned char)c < 0x20) {
            if (j + 6 >= out_sz) break;
            j += (size_t)snprintf(out + j, out_sz - j, "\\u%04x", (unsigned char)c);
        } else {
            out[j++] = c;
        }
    }
    out[j] = '\0';
}

static const char *prometheus_metric_value(const char *body, const char *name)
{
    if (!body || !name) return NULL;
    const char *p = strstr(body, name);
    if (!p) return NULL;
    p += strlen(name);
    if (*p == '{') {
        p = strchr(p, '}');
        if (!p) return NULL;
        p++;
    }
    while (*p == ' ') p++;
    return (*p == '\0' || *p == '\r' || *p == '\n') ? NULL : p;
}

static int probe_metrics_http(int port, double *eps_out, long *alerts_out, long *lines_out)
{
    if (port <= 0 || port >= 65536) return -1;
    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) return -1;

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons((uint16_t)port);
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);

    struct timeval tv = { .tv_sec = 2, .tv_usec = 0 };
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));

    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
        close(fd);
        return -1;
    }

    const char *req =
        "GET /metrics HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";
    if (send(fd, req, strlen(req), 0) < 0) {
        close(fd);
        return -1;
    }

    char buf[8192];
    ssize_t n = recv(fd, buf, sizeof(buf) - 1, 0);
    close(fd);
    if (n <= 0) return -1;
    buf[n] = '\0';

    const char *body = strstr(buf, "\r\n\r\n");
    if (body) body += 4;
    else body = buf;

    if (eps_out) {
        const char *p = prometheus_metric_value(body, "loganalyzer_eps");
        *eps_out = p ? atof(p) : 0.0;
    }
    if (alerts_out) {
        const char *p = prometheus_metric_value(body, "loganalyzer_alerts_total");
        *alerts_out = p ? strtol(p, NULL, 10) : 0;
    }
    if (lines_out) {
        const char *p = prometheus_metric_value(body, "loganalyzer_lines_total");
        *lines_out = p ? strtol(p, NULL, 10) : 0;
    }
    return 0;
}

static const char *operator_rules_path(void)
{
    if (g_rules_path)
        return g_rules_path;
    if (access("/etc/log-guardian/rules.conf", R_OK) == 0)
        return "/etc/log-guardian/rules.conf";
    return "rules.conf";
}

static void operator_apply_db_path(void)
{
    const char *rules;

    if (g_db_path_cli)
        return;
    if (strcmp(g_db_path_buf, "events.db") != 0)
        return;
    rules = operator_rules_path();
    if (strncmp(rules, "/etc/log-guardian/", 18) != 0)
        return;
    if (access("/etc/log-guardian/events.db", R_OK) == 0) {
        strncpy(g_db_path_buf, "/etc/log-guardian/events.db",
                sizeof(g_db_path_buf) - 1);
        g_db_path_buf[sizeof(g_db_path_buf) - 1] = '\0';
        g_db_path = g_db_path_buf;
    }
}

static void operator_load_threat_feed_env(void)
{
    const char *path = "/etc/log-guardian/threat-feed.env";
    FILE *f;

    if (access(path, R_OK) != 0)
        return;
    f = fopen(path, "r");
    if (!f)
        return;

    char line[512];
    while (fgets(line, sizeof(line), f)) {
        char *p = line;
        while (*p == ' ' || *p == '\t')
            p++;
        if (*p == '#' || *p == '\n')
            continue;
        char *nl = strchr(p, '\n');
        if (nl)
            *nl = '\0';
        char *eq = strchr(p, '=');
        if (!eq)
            continue;
        *eq = '\0';
        char *key = p;
        char *val = eq + 1;
        while (*val == ' ' || *val == '\t')
            val++;
        if (!key[0] || !val[0])
            continue;
        if (strncmp(key, "THREAT_FEED_", 12) != 0 &&
            strcmp(key, "ABUSEIPDB_API_KEY") != 0 &&
            strcmp(key, "OTX_API_KEY") != 0)
            continue;
        if (getenv(key))
            continue;
        setenv(key, val, 0);
    }
    fclose(f);
}

static void threat_feed_apply_env_keys(void)
{
    if (!g_threat_config.api_key[0]) {
        const char *k = getenv("THREAT_FEED_API_KEY");
        if (!k || !*k)
            k = getenv("ABUSEIPDB_API_KEY");
        if (k && *k) {
            size_t n = strlen(k);
            if (n >= sizeof(g_threat_config.api_key))
                n = sizeof(g_threat_config.api_key) - 1;
            memcpy(g_threat_config.api_key, k, n);
            g_threat_config.api_key[n] = '\0';
        }
    }
    if (!g_threat_config.otx_api_key[0]) {
        const char *k = getenv("OTX_API_KEY");
        if (k && *k) {
            size_t n = strlen(k);
            if (n >= sizeof(g_threat_config.otx_api_key))
                n = sizeof(g_threat_config.otx_api_key) - 1;
            memcpy(g_threat_config.otx_api_key, k, n);
            g_threat_config.otx_api_key[n] = '\0';
        }
    }
}

static void operator_load_webhook_env(void)
{
    const char *path = "/etc/log-guardian/webhook.env";
    FILE *f;

    if (access(path, R_OK) != 0)
        return;
    f = fopen(path, "r");
    if (!f)
        return;

    char line[512];
    while (fgets(line, sizeof(line), f)) {
        char *p = line;
        while (*p == ' ' || *p == '\t')
            p++;
        if (*p == '#' || *p == '\n')
            continue;
        char *nl = strchr(p, '\n');
        if (nl)
            *nl = '\0';
        char *eq = strchr(p, '=');
        if (!eq)
            continue;
        *eq = '\0';
        char *key = p;
        char *val = eq + 1;
        while (*val == ' ' || *val == '\t')
            val++;
        if (!key[0] || !val[0])
            continue;
        if (strncmp(key, "LOGANALYZER_", 12) != 0 &&
            strncmp(key, "WEBHOOK_", 8) != 0)
            continue;
        /* Ortamda zaten set edilmisse (dry-run test, override) dosyayi ezme */
        if (getenv(key))
            continue;
        setenv(key, val, 0);
    }
    fclose(f);
}

static void apply_siem_env_overrides(void)
{
    const char *v = getenv("SIEM_FORWARDER_ENABLED");
    if (v && v[0])
        g_siem_config.enabled = (atoi(v) != 0);
    v = getenv("SIEM_HOST");
    if (v && v[0]) {
        size_t n = strlen(v);
        if (n >= sizeof(g_siem_config.host))
            n = sizeof(g_siem_config.host) - 1;
        memcpy(g_siem_config.host, v, n);
        g_siem_config.host[n] = '\0';
    }
    v = getenv("SIEM_PORT");
    if (v && v[0]) {
        int p = atoi(v);
        if (p > 0 && p < 65536)
            g_siem_config.port = p;
    }
}

static void operator_load_rules(void)
{
    operator_load_webhook_env();
    operator_load_threat_feed_env();
    const char *rules = operator_rules_path();
    if (access(rules, F_OK) == 0)
        load_rules_file(rules);
    operator_apply_db_path();
    if (g_openapi_schema_path[0]) {
        char sp[512];
        strncpy(sp, g_openapi_schema_path, sizeof(sp) - 1);
        sp[sizeof(sp) - 1] = '\0';
        resolve_path_from_rules(rules, sp, sizeof(sp));
        if (access(sp, R_OK) != 0 && access(g_openapi_schema_path, R_OK) == 0)
            strncpy(sp, g_openapi_schema_path, sizeof(sp) - 1);
        schema_load(sp);
    }
}

#define HEALTH_LOG(...) do { if (!g_operator_quiet) fprintf(stderr, __VA_ARGS__); } while (0)

static int cmd_health_check(void)
{
    operator_ipc_init();
    operator_load_rules();
    int rc = 0;

    DaemonStatsSnapshot snap;
    int have_stats = (daemon_stats_read(&snap) == 0);

    if (daemon_ipc_ping() != 0) {
        fprintf(stderr, "[HEALTH] daemon IPC: FAIL (%s)\n", DAEMON_IPC_SOCK_PATH);
        if (have_stats && snap.uptime_sec > 0) {
            HEALTH_LOG(
                    "[HEALTH] not: daemon ayakta (uptime=%lus) — ping yogunlukta gecikti; "
                    "ban hatti calisiyor olabilir\n",
                    (unsigned long)snap.uptime_sec);
        } else {
            HEALTH_LOG("[HEALTH] IPC ipucu: sudo systemctl restart log-guardian-daemon && "
                    "sudo bash scripts/fix_ipc_perms.sh\n");
        }
        rc = 1;
    } else {
        HEALTH_LOG("[HEALTH] daemon IPC: OK\n");
    }

    if (!have_stats) {
        fprintf(stderr, "[HEALTH] daemon_stats.json: yok (daemon calisiyor mu?)\n");
        rc = 1;
    } else {
        HEALTH_LOG(
                "[HEALTH] RCE det=%lu kill=%lu lineage=%lu connect=%lu uptime=%lus comm=%s cid=%s\n",
                (unsigned long)snap.rce_detections,
                (unsigned long)snap.rce_kills,
                (unsigned long)snap.lineage_events,
                (unsigned long)snap.lineage_connects,
                (unsigned long)snap.uptime_sec,
                snap.rce_last_comm[0] ? snap.rce_last_comm : "-",
                snap.rce_last_cid[0] ? snap.rce_last_cid : "-");
        HEALTH_LOG(
                "[HEALTH] BPF xdp=%s execve=%s lineage=%s\n",
                snap.xdp_active ? "ON" : "OFF",
                snap.execve_probe ? "ON" : "OFF",
                snap.lineage_probe ? "ON" : "OFF");
    }

    if (g_metrics_port > 0) {
        double eps = 0.0;
        long alerts_m = 0, lines_m = 0;
        if (probe_metrics_http(g_metrics_port, &eps, &alerts_m, &lines_m) != 0) {
            fprintf(stderr,
                    "[HEALTH] /metrics:%d FAIL (analyzer systemd aktif mi?)\n",
                    g_metrics_port);
            rc = 1;
        } else {
            HEALTH_LOG(
                    "[HEALTH] /metrics:%d OK eps=%.1f alerts=%ld lines=%ld\n",
                    g_metrics_port, eps, alerts_m, lines_m);
        }
    } else {
        HEALTH_LOG("[HEALTH] METRICS_PORT=0 (atlandi)\n");
    }

    return rc;
}

static int cmd_ban_db_prune(int argc, char **argv)
{
    int ttl_days = g_intel_ban_db_ttl_days;
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--all") == 0)
            ttl_days = 0;
    }
    operator_load_rules();
    int pruned = db_prune_intel_ban_events(g_db_path, ttl_days);
    if (pruned < 0) {
        fprintf(stderr, "[ERR] ban-db-prune: %s acilamadi\n", g_db_path);
        return 1;
    }
    printf("{\"pruned\":%d,\"db\":\"%s\",\"ttl_days\":%d,\"mode\":\"%s\"}\n",
           pruned, g_db_path, ttl_days, ttl_days <= 0 ? "all-intel" : "ttl");
    return 0;
}

static int cmd_webhook_metrics_reset(int argc, char **argv)
{
    int fail_only = 1;
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--all") == 0)
            fail_only = 0;
    }
    operator_load_rules();
    webhook_metrics_reset(fail_only);
    long sent = 0, fail = 0, drops = 0;
    webhook_metrics_snapshot(&sent, &fail, &drops, NULL);
    printf("{\"reset\":true,\"fail_only\":%s,\"sent\":%ld,\"fail\":%ld,\"drops\":%ld,"
           "\"store\":\"%s\"}\n",
           fail_only ? "true" : "false", sent, fail, drops,
           getenv("LOGANALYZER_WEBHOOK_METRICS_FILE") ?:
               "/var/lib/log-guardian/webhook.metrics");
    return 0;
}

static int cmd_webhook_test(int argc, char **argv)
{
    const char *kind = "alert";
    for (int i = 2; i < argc; i++) {
        if (argv[i][0] == '-') continue;
        if (strcmp(argv[i], "alert") == 0 || strcmp(argv[i], "crit") == 0 ||
            strcmp(argv[i], "crit-chain") == 0 ||
            strcmp(argv[i], "ban") == 0 ||
            strcmp(argv[i], "trap") == 0 || strcmp(argv[i], "batch") == 0)
            kind = argv[i];
    }

    operator_load_rules();
    apply_siem_env_overrides();
    if (g_siem_config.enabled && g_siem_config.host[0] != '\0')
        siem_forwarder_init();
    if (!g_webhook.enabled) {
        fprintf(stderr,
                "[ERR] WEBHOOK_ENABLED=0 (/etc/log-guardian/rules.conf)\n"
                "      Hizli test: WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=1 \\\n"
                "        LOGANALYZER_TELEGRAM_TOKEN=FAKE:TOKEN \\\n"
                "        LOGANALYZER_TELEGRAM_CHAT_ID=-1001 \\\n"
                "        ./log-guardian webhook-test %s\n"
                "      veya: bash scripts/webhook_dev.sh\n", kind);
        return 1;
    }
    if (webhook_destinations_configured() < 1) {
        fprintf(stderr, "[ERR] webhook kanali yok (TELEGRAM veya GENERIC)\n");
        return 1;
    }
    webhook_init();
    if (webhook_send_test(kind) != 0) {
        webhook_shutdown();
        fprintf(stderr, "[ERR] gecersiz tur: %s (alert|crit|ban|trap|batch)\n", kind);
        return 1;
    }
    if (strcmp(kind, "batch") == 0)
        usleep(800000);
    if (strcmp(kind, "ban") == 0 || strcmp(kind, "alert") == 0)
        usleep(300000);
    WebhookDeliveryStats st;
    webhook_delivery_stats(&st);
    int rc = st.fail > 0 ? 1 : 0;
    webhook_shutdown();
    siem_forwarder_stop();
    if (rc != 0) return rc;
    printf("{\"sent\":true,\"kind\":\"%s\",\"dry_run\":%s,\"destinations\":%d,"
           "\"ok\":%d,\"fail\":%d}\n",
           kind,
           webhook_is_dry_run() ? "true" : "false",
           webhook_destinations_configured(),
           st.ok, st.fail);
    return 0;
}

static int cmd_daily_summary(int argc, char **argv)
{
    int force = 0;
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--force") == 0)
            force = 1;
    }

    operator_load_rules();
    if (!g_webhook.enabled) {
        fprintf(stderr, "[ERR] WEBHOOK_ENABLED=0\n");
        return 1;
    }
    if (webhook_destinations_configured() < 1) {
        fprintf(stderr, "[ERR] webhook kanali yok\n");
        return 1;
    }
    webhook_init();
    int rc = webhook_send_daily_summary(g_db_path, force);
    webhook_shutdown();
    if (rc != 0) {
        fprintf(stderr, "[ERR] gunluk ozet gonderilemedi\n");
        return 1;
    }
    printf("{\"ok\":true,\"daily_summary\":true,\"force\":%s}\n",
           force ? "true" : "false");
    return 0;
}

static int cmd_weekly_summary(int argc, char **argv)
{
    int force = 0;
    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--force") == 0)
            force = 1;
    }

    operator_load_rules();
    if (!g_webhook.enabled) {
        fprintf(stderr, "[ERR] WEBHOOK_ENABLED=0\n");
        return 1;
    }
    if (webhook_destinations_configured() < 1) {
        fprintf(stderr, "[ERR] webhook kanali yok\n");
        return 1;
    }
    webhook_init();
    int rc = webhook_send_weekly_summary(g_db_path, force);
    webhook_shutdown();
    if (rc != 0) {
        fprintf(stderr, "[ERR] haftalik ozet gonderilemedi\n");
        return 1;
    }
    printf("{\"ok\":true,\"weekly_summary\":true,\"force\":%s}\n",
           force ? "true" : "false");
    return 0;
}

static int cmd_threat_feed_sync(void)
{
    operator_load_rules();
    ban_pipeline_set_whitelist_fn(whitelist_check_cb);
    if (threat_feed_run_once() != 0) {
        fprintf(stderr, "[ERR] THREAT_FEED_ENABLED=0 veya kaynak tanimli degil\n");
        return 1;
    }
    ThreatFeedStats tf;
    threat_feed_get_stats(&tf);
    printf("{\"applied\":%lu,\"skipped_whitelist\":%lu,\"failed\":%lu,"
           "\"total_iocs\":%lu,\"last_sync_ts\":%ld}\n",
           (unsigned long)tf.last_applied, (unsigned long)tf.last_skipped_whitelist,
           (unsigned long)tf.last_failed, (unsigned long)tf.total_iocs,
           (long)tf.last_sync_ts);
    return 0;
}

static int cmd_schema_check(int argc, char **argv)
{
    operator_load_rules();
    const char *method = "GET";
    const char *paths[32];
    int npaths = 0;
    const char *body = NULL;
    const char *headers = NULL;
    const char *ip = "127.0.0.1";
    int stats_only = 0;
    int burst = 1;

    for (int i = 2; i < argc; i++) {
        if (strcmp(argv[i], "--stats") == 0) stats_only = 1;
        else if (strcmp(argv[i], "--method") == 0 && i + 1 < argc) method = argv[++i];
        else if (strcmp(argv[i], "--path") == 0 && i + 1 < argc) {
            if (npaths < 32) paths[npaths++] = argv[++i];
        }
        else if (strcmp(argv[i], "--body") == 0 && i + 1 < argc) body = argv[++i];
        else if (strcmp(argv[i], "--headers") == 0 && i + 1 < argc) headers = argv[++i];
        else if (strcmp(argv[i], "--ip") == 0 && i + 1 < argc) ip = argv[++i];
        else if (strcmp(argv[i], "--burst") == 0 && i + 1 < argc) burst = atoi(argv[++i]);
    }
    if (npaths == 0) {
        paths[0] = "/";
        npaths = 1;
    }

    if (stats_only) {
        printf("{\"loaded\":%s,\"endpoints\":%d,\"strict\":%s}\n",
               schema_is_loaded() ? "true" : "false",
               schema_endpoint_count(),
               schema_strict_mode() ? "true" : "false");
        return 0;
    }

    if (!schema_is_loaded()) {
        fprintf(stderr, "[ERR] OpenAPI schema yuklu degil (OPENAPI_SCHEMA)\n");
        return 1;
    }

    size_t body_len = body ? strlen(body) : 0;
    size_t hdr_len = headers ? strlen(headers) : 0;
    SchemaValidationResult r = {0};
    if (burst < 1) burst = 1;
    if (npaths > 1) {
        for (int pi = 0; pi < npaths; pi++)
            r = schema_validate_request_v2(
                method, paths[pi], body, body_len, ip, headers, hdr_len);
    } else {
        for (int b = 0; b < burst; b++)
            r = schema_validate_request_v2(
                method, paths[0], body, body_len, ip, headers, hdr_len);
    }

    char reason_esc[SCHEMA_MAX_REASON_LEN * 2];
    json_escape_str(r.reason, reason_esc, sizeof(reason_esc));
    printf("{\"status\":\"%s\",\"violations\":%d,\"idor_score\":%d,"
           "\"field\":\"%s\",\"reason\":\"%s\"}\n",
           schema_status_str(r.status), r.violation_count, r.idor_score,
           r.field_name, reason_esc);
    return r.status == SCHEMA_BLOCK ? 1 : 0;
}

static int cmd_status_dump(void)
{
    operator_ipc_init();
    operator_load_rules();
    ban_pipeline_set_whitelist_fn(whitelist_check_cb);

    int ipc_ok = (daemon_ipc_ping() == 0);
    DaemonStatsSnapshot dsnap;
    int have_daemon = (daemon_stats_read(&dsnap) == 0);

    double eps = 0.0;
    long metrics_alerts = 0, metrics_lines = 0;
    int metrics_ok = 0;
    if (g_metrics_port > 0 &&
        probe_metrics_http(g_metrics_port, &eps, &metrics_alerts, &metrics_lines) == 0)
        metrics_ok = 1;

    DbStatusSnapshot db;
    int have_db = (access(g_db_path, R_OK) == 0 &&
                   db_status_snapshot(g_db_path, &db) == 0);

    BanPipelineStats bs;
    ban_pipeline_get_stats(&bs);

    printf("{");
    printf("\"ipc\":\"%s\",", ipc_ok ? "ok" : "fail");
    printf("\"metrics\":{\"port\":%d,\"reachable\":%s",
           g_metrics_port, metrics_ok ? "true" : "false");
    if (metrics_ok)
        printf(",\"eps\":%.2f,\"alerts_total\":%ld,\"lines_total\":%ld",
               eps, metrics_alerts, metrics_lines);
    printf("},");

    printf("\"daemon\":");
    if (have_daemon) {
        printf("{\"rce_detections\":%lu,\"rce_kills\":%lu,"
               "\"rce_last_comm\":\"%s\",\"rce_last_cid\":\"%s\","
               "\"lineage_events\":%lu,\"lineage_connects\":%lu,\"uptime_sec\":%lu,"
               "\"xdp_active\":%s,\"execve_probe\":%s,\"lineage_probe\":%s,"
               "\"l7_probe\":%s,\"l7_http_hits\":%lu,"
               "\"l7_http_get\":%lu,\"l7_http_post\":%lu},",
               (unsigned long)dsnap.rce_detections,
               (unsigned long)dsnap.rce_kills,
               dsnap.rce_last_comm,
               dsnap.rce_last_cid,
               (unsigned long)dsnap.lineage_events,
               (unsigned long)dsnap.lineage_connects,
               (unsigned long)dsnap.uptime_sec,
               dsnap.xdp_active ? "true" : "false",
               dsnap.execve_probe ? "true" : "false",
               dsnap.lineage_probe ? "true" : "false",
               dsnap.l7_probe ? "true" : "false",
               (unsigned long)dsnap.l7_http_hits,
               (unsigned long)dsnap.l7_http_get,
               (unsigned long)dsnap.l7_http_post);
    } else {
        printf("null,");
    }

    printf("\"db\":{\"path\":\"%s\",\"available\":%s",
           g_db_path, have_db ? "true" : "false");
    if (have_db)
        printf(",\"alerts_total\":%ld,\"bans_active\":%ld",
               db.alerts_total, db.bans_active);
    printf("},");

    const char *xdp_mode = "unknown";
    if (have_daemon) {
        xdp_mode = dsnap.xdp_active ? "kernel-xdp" : "ipset-fallback";
    } else if (ipc_ok) {
        xdp_mode = "ipset-fallback";
    }
    printf("\"xdp_mode\":\"%s\",", xdp_mode);
    printf("\"ban_pipeline\":{\"ipc\":%lu,\"xdp\":%lu,\"ipset\":%lu,\"failed\":%lu},",
           (unsigned long)bs.via_ipc, (unsigned long)bs.via_xdp,
           (unsigned long)bs.via_ipset, (unsigned long)bs.failed);

    uint64_t inc_active = 0, inc_corr = 0;
    incident_engine_get_stats(&inc_active, &inc_corr);
    if (have_db) {
        char seen[DB_STATUS_MAX_ALERTS][24];
        int seen_n = 0;
        for (int i = 0; i < db.recent_count; i++) {
            if (!db.recent[i].incident_id[0]) continue;
            int dup = 0;
            for (int j = 0; j < seen_n; j++) {
                if (strcmp(seen[j], db.recent[i].incident_id) == 0) {
                    dup = 1;
                    break;
                }
            }
            if (!dup && seen_n < DB_STATUS_MAX_ALERTS) {
                strncpy(seen[seen_n], db.recent[i].incident_id,
                        sizeof(seen[0]) - 1);
                seen[seen_n][sizeof(seen[0]) - 1] = '\0';
                seen_n++;
            }
        }
        if ((uint64_t)seen_n > inc_active) inc_active = (uint64_t)seen_n;
        if ((uint64_t)seen_n > inc_corr)   inc_corr   = (uint64_t)seen_n;
    }
    printf("\"incidents\":{\"active\":%lu,\"correlated_total\":%lu},",
           (unsigned long)inc_active, (unsigned long)inc_corr);

    printf("\"recent_alerts\":[");
    if (have_db) {
        for (int i = 0; i < db.recent_count; i++) {
            char esc[ALERT_MSG_LEN * 2];
            json_escape_str(db.recent[i].message, esc, sizeof(esc));
            if (i) printf(",");
            char inc_esc[48];
            json_escape_str(db.recent[i].incident_id, inc_esc, sizeof(inc_esc));
            printf("{\"ts\":%ld,\"ip\":\"%s\",\"level\":%d,\"message\":\"%s\","
                   "\"incident_id\":\"%s\"}",
                   (long)db.recent[i].ts, db.recent[i].ip,
                   db.recent[i].level, esc, inc_esc);
        }
    }
    printf("],\"recent_bans\":[");
    if (have_db) {
        for (int i = 0; i < db.recent_ban_count; i++) {
            char rsn[256];
            json_escape_str(db.recent_bans[i].reason, rsn, sizeof(rsn));
            if (i) printf(",");
            printf("{\"ts\":%ld,\"ip\":\"%s\",\"action\":\"%s\",\"reason\":\"%s\"}",
                   (long)db.recent_bans[i].ts, db.recent_bans[i].ip,
                   db.recent_bans[i].action, rsn);
        }
    }
    printf("],");
    {
        uint64_t st_total = 0, st_block = 0, st_warn = 0, st_idor = 0, st_rate = 0;
        schema_get_stats(&st_total, &st_block, &st_warn, &st_idor, &st_rate);
        printf("\"openapi\":{\"loaded\":%s,\"strict\":%s,\"endpoints\":%d,"
               "\"checks\":%lu,\"blocked\":%lu,\"warned\":%lu,\"rate_limited\":%lu},",
               schema_is_loaded() ? "true" : "false",
               schema_strict_mode() ? "true" : "false",
               schema_endpoint_count(),
               (unsigned long)st_total, (unsigned long)st_block,
               (unsigned long)st_warn, (unsigned long)st_rate);
    }
    {
        uint64_t wc = 0, wb = 0;
        int wplugins = 0, wnative = 0;
        if (g_wasm_enabled) {
            wasm_runtime_set_plugin_dir(g_wasm_plugin_dir);
            if (wasm_runtime_init() == 0) {
                wasm_runtime_stats(&wc, &wb, &wplugins);
                wnative = wasm_runtime_count_native_plugins();
                wasm_runtime_destroy();
            }
        }
        printf("\"wasm\":{\"native\":%s,\"enabled\":%s,\"plugins_active\":%d,"
               "\"plugins_native\":%d,\"calls\":%lu,\"blocks\":%lu},",
               wasm_runtime_is_native() ? "true" : "false",
               g_wasm_enabled ? "true" : "false",
               wplugins, wnative, (unsigned long)wc, (unsigned long)wb);
    }
    {
        ThreatFeedStats tf;
        threat_feed_get_stats(&tf);
        char tf_err[256];
        json_escape_str(tf.last_error, tf_err, sizeof(tf_err));
        printf("\"threat_feed\":{\"enabled\":%s,\"sources\":\"%s\","
               "\"total_iocs\":%lu,\"last_applied\":%lu,"
               "\"last_skipped_whitelist\":%lu,\"last_failed\":%lu,"
               "\"last_sync_ts\":%ld,\"use_ban_pipeline\":%s,\"last_error\":\"%s\"},",
               g_threat_config.enabled ? "true" : "false",
               g_threat_config.sources[0] ? g_threat_config.sources : "auto",
               (unsigned long)tf.total_iocs, (unsigned long)tf.last_applied,
               (unsigned long)tf.last_skipped_whitelist, (unsigned long)tf.last_failed,
               (long)tf.last_sync_ts,
               g_threat_config.use_ban_pipeline ? "true" : "false",
               tf_err);
    }
    {
        uint64_t l7_in = 0, l7_blk = 0, l7_ebpf = 0, l7_get = 0, l7_post = 0;
        l7_telemetry_get_stats(&l7_in, &l7_blk, &l7_ebpf, &l7_get, &l7_post);
        if (have_daemon && dsnap.l7_http_hits > l7_ebpf)
            l7_ebpf = dsnap.l7_http_hits;
        if (have_daemon && dsnap.l7_http_get > l7_get)
            l7_get = dsnap.l7_http_get;
        if (have_daemon && dsnap.l7_http_post > l7_post)
            l7_post = dsnap.l7_http_post;
        printf("\"l7_http\":{\"inspected\":%lu,\"blocked\":%lu,\"ebpf_hits\":%lu,"
               "\"get\":%lu,\"post\":%lu,\"probe\":\"http_l7_probe.o\","
               "\"probe_active\":%s},",
               (unsigned long)l7_in, (unsigned long)l7_blk, (unsigned long)l7_ebpf,
               (unsigned long)l7_get, (unsigned long)l7_post,
               (have_daemon && dsnap.l7_probe) ? "true" : "false");
    }
    {
        webhook_status_json(stdout);
        printf(",");
    }
    {
        const TenantIsolationInfo *ti = tenant_policy_info();
        char tid_esc[160];
        json_escape_str(ti && ti->tenant_id[0] ? ti->tenant_id : g_tenant_id,
                        tid_esc, sizeof(tid_esc));
        printf("\"tenant\":{\"id\":\"%s\",\"safe_id\":\"%s\","
               "\"multi_tenant_db\":%s,\"db_path\":\"%s\","
               "\"ban_audit\":\"%s\",\"threat_audit\":\"%s\","
               "\"fp_store\":\"%s\",\"data_dir\":\"%s\","
               "\"policy_overlay\":%s,\"auto_ban_min_risk\":%.1f,\"ban_ttl_sec\":%d}",
               tid_esc,
               ti && ti->safe_id[0] ? ti->safe_id : "default",
               (ti && ti->multi_tenant) ? "true" : "false",
               g_db_path,
               ti && ti->ban_audit_path[0] ? ti->ban_audit_path : "data/ban-policy-audit.jsonl",
               ti && ti->threat_audit_path[0] ? ti->threat_audit_path
                                              : "data/threat-feed-audit.jsonl",
               ti && ti->fp_store_path[0] ? ti->fp_store_path : "data/fp-trust.lst",
               ti && ti->data_dir[0] ? ti->data_dir : "data",
               (ti && ti->overlay_loaded) ? "true" : "false",
               ti && ti->auto_ban_min_risk >= 0.0 ? ti->auto_ban_min_risk : 60.0,
               ti && ti->ban_ttl_sec > 0 ? ti->ban_ttl_sec : g_ban_ttl_sec);
    }
    printf("}\n");
    return 0;
}

static void lg_telegram_ops_status(char *buf, size_t cap) {
    if (!buf || cap == 0) return;
    long ws = 0, wf = 0, wd = 0, qd = 0;
    webhook_metrics_snapshot(&ws, &wf, &wd, &qd);

    long ack_24h = 0;
    long unacked_24h = 0;
    if (g_db_path && g_db_path[0]) {
        time_t since = time(NULL) - 86400;
        (void)db_telegram_ack_count_path(g_db_path, since, &ack_24h);
        (void)db_unacked_count_path(g_db_path, since, &unacked_24h);
    }

    double eps = g_stats.eps;
    long alerts = (long)atomic_load(&g_atomic_alerts);
    long lines = (long)atomic_load(&g_atomic_lines);
    long ban_ok = (long)atomic_load(&g_atomic_ban_success);
    long ban_fail = (long)atomic_load(&g_atomic_ban_fail);

    if (g_metrics_port > 0) {
        double meps = 0.0;
        long malerts = 0, mlines = 0;
        if (probe_metrics_http(g_metrics_port, &meps, &malerts, &mlines) == 0) {
            if (meps > eps)
                eps = meps;
            if (malerts > alerts)
                alerts = malerts;
            if (mlines > lines)
                lines = mlines;
        }
    }

    char quiet_line[40] = "OFF";
    if (webhook_quiet_hours_enabled()) {
        snprintf(quiet_line, sizeof(quiet_line), "%s (%s)",
                 webhook_quiet_hours_active() ? "ACTIVE" : "off",
                 webhook_quiet_hours_spec());
    }

    char topics_line[64] = "";
    webhook_telegram_topics_line(topics_line, sizeof(topics_line));
    char topics_fmt[72] = "";
    if (topics_line[0])
        snprintf(topics_fmt, sizeof(topics_fmt), "%s\n", topics_line);

    char rich_fmt[48] = "";
    if (webhook_telegram_rich_card_enabled()) {
        const char *db = webhook_dashboard_base_url();
        if (db && db[0])
            snprintf(rich_fmt, sizeof(rich_fmt), "Rich: ON (%s)\n", db);
        else
            snprintf(rich_fmt, sizeof(rich_fmt), "Rich: ON\n");
    }

    char geo_fmt[24] = "";
    if (webhook_telegram_geoip_enabled())
        snprintf(geo_fmt, sizeof(geo_fmt), "GeoIP: ON\n");

    char pin_fmt[24] = "";
    if (webhook_telegram_pin_crit_enabled())
        snprintf(pin_fmt, sizeof(pin_fmt), "Pin CRIT: ON\n");

    char preview_fmt[28] = "";
    if (webhook_telegram_disable_preview_enabled())
        snprintf(preview_fmt, sizeof(preview_fmt), "Preview: OFF\n");

    char chain_fmt[40] = "";
    if (webhook_telegram_reply_chain_enabled())
        snprintf(chain_fmt, sizeof(chain_fmt), "Reply chain: ON (%ds)\n",
                 g_webhook.telegram_reply_chain_sec);

    char mirror_fmt[32] = "";
    if (webhook_telegram_mirror_warn_enabled())
        snprintf(mirror_fmt, sizeof(mirror_fmt),
                 "Mirror WARN: ON (#%d)\n", g_webhook.telegram_topic_warn);

    const char *bot_mode = "OFF";
    if (g_webhook.telegram_bot_enabled) {
        bot_mode = webhook_telegram_webhook_enabled() ? "WEBHOOK" : "POLL";
    }

    snprintf(buf, cap,
             "EPS: %.2f\n"
             "Alerts: %ld | Lines: %ld\n"
             "Ban OK: %ld | Fail: %ld\n"
             "Route: %s | batch: %ds\n"
             "Telegram CRIT×%d WARN×%d\n"
             "%s"
             "%s"
             "%s"
             "%s"
             "%s"
             "%s"
             "%s"
             "Quiet: %s\n"
             "Daily: %s\n"
             "Weekly: %s\n"
             "Webhook sent: %ld | fail: %ld\n"
             "Ack (24h): %ld | Unacked: %ld\n"
             "Queue depth: %ld | drops: %ld\n"
             "Bot: %s | targets: %d",
             eps, alerts, lines, ban_ok, ban_fail,
             g_webhook.telegram_route_by_level ? "ON" : "OFF",
             g_webhook.telegram_batch_sec,
             g_webhook.telegram_chat_crit_count,
             g_webhook.telegram_chat_warn_count,
             topics_fmt,
             rich_fmt,
             geo_fmt,
             pin_fmt,
             preview_fmt,
             chain_fmt,
             mirror_fmt,
             quiet_line,
             webhook_daily_summary_enabled() ? webhook_daily_summary_spec() : "OFF",
             webhook_weekly_summary_enabled() ? webhook_weekly_summary_spec() : "OFF",
             ws, wf, ack_24h, unacked_24h, qd, wd,
             bot_mode,
             webhook_telegram_target_count());
}

static int lg_telegram_ack(const char *chat_id, const char *ack_key,
                           const char *operator_id, const char *operator_name)
{
    if (!chat_id || !ack_key || !ack_key[0])
        return -1;
    const char *inc = NULL;
    if (strncmp(ack_key, "INC-", 4) == 0 || strncmp(ack_key, "BATCH-", 6) == 0)
        inc = ack_key;
    if (g_db_path && g_db_path[0])
        return db_telegram_ack_register_path(
            g_db_path, chat_id, ack_key, inc, operator_id, operator_name);
    if (g_db_enabled) {
        db_log_telegram_ack(chat_id, ack_key, inc);
        return 0;
    }
    return -1;
}

static void lg_telegram_inline(const char *chat_id, const char *verb,
                               const char *arg)
{
    (void)chat_id;
    if (!verb || !arg || !arg[0] || !is_valid_ip(arg))
        return;

    if (strcmp(verb, "mute") == 0) {
        webhook_operator_mute_ip(arg, 0);
        fprintf(stderr, "[TELEGRAM] inline sessiz: %s (%ds)\n",
                arg, webhook_operator_mute_sec());
    } else if (strcmp(verb, "wl") == 0) {
        (void)lg_add_whitelist_ip(arg);
    } else if (strcmp(verb, "ub") == 0) {
        if (unban_ip(arg) == 0)
            fprintf(stderr, "[TELEGRAM] inline unban: %s\n", arg);
        else
            fprintf(stderr, "[TELEGRAM] inline unban basarisiz: %s\n", arg);
    }
}

static const char *alert_level_tag(int level)
{
    switch (level) {
    case ALERT_CRIT: return "CRIT";
    case ALERT_WARN: return "WARN";
    case ALERT_INFO: return "INFO";
    default:         return "?";
    }
}

static void lg_telegram_last(char *buf, size_t cap)
{
    if (!buf || cap == 0)
        return;
    buf[0] = '\0';

    DbStatusSnapshot snap;
    if (db_status_snapshot(g_db_path, &snap) != 0) {
        snprintf(buf, cap, "events.db okunamadi (%s).", g_db_path);
        return;
    }
    if (snap.recent_count == 0) {
        snprintf(buf, cap, "Kayit yok.");
        return;
    }

    size_t pos = 0;
    for (int i = 0; i < snap.recent_count && pos + 64 < cap; i++) {
        const DbRecentAlert *a = &snap.recent[i];
        struct tm *tm_info = localtime(&a->ts);
        char tsbuf[24] = "?";
        if (tm_info)
            strftime(tsbuf, sizeof(tsbuf), "%d.%m %H:%M", tm_info);

        char msg_short[48];
        strncpy(msg_short, a->message, sizeof(msg_short) - 1);
        msg_short[sizeof(msg_short) - 1] = '\0';
        for (char *s = msg_short; *s; s++) {
            if (*s == '\n' || *s == '\r') {
                *s = ' ';
                break;
            }
        }

        pos += (size_t)snprintf(buf + pos, cap - pos,
                                "%s <code>%s</code> %s · %s",
                                alert_level_tag(a->level), a->ip, tsbuf, msg_short);
        if (a->incident_id[0])
            pos += (size_t)snprintf(buf + pos, cap - pos,
                                    " · <code>%s</code>", a->incident_id);
        if (pos + 2 < cap) {
            buf[pos++] = '\n';
            buf[pos] = '\0';
        }
    }
}

static void lg_telegram_unacked(char *buf, size_t cap)
{
    if (!buf || cap == 0)
        return;
    if (!g_db_path || !g_db_path[0]) {
        snprintf(buf, cap, "DB yolu yok.");
        return;
    }
    time_t since = time(NULL) - 86400;
    (void)db_unacked_format_path(g_db_path, since, buf, cap);
}

static void lg_telegram_incident(const char *incident_id, char *buf, size_t cap)
{
    if (!buf || cap == 0)
        return;
    if (!incident_id || !incident_id[0]) {
        snprintf(buf, cap, "Incident ID gerekli.");
        return;
    }
    if (!g_db_path || !g_db_path[0]) {
        snprintf(buf, cap, "DB yolu yok.");
        return;
    }
    (void)db_incident_format_path(g_db_path, incident_id, buf, cap);
}

static void load_rules_file(const char *path) {
    FILE *fp = fopen(path, "r");
    if (!fp) return;

    parser_clear_proxy_cidrs();
    parser_set_trust_xff(0);

    int low_slow_req = 0, brute_err = 0, ddos_rps = 0, slow_ms = 0;
    int sqli_score = 0, slow_hit_cnt = 0, cooldown = 0;
    int waf_en = 1, waf_ban_thr = 10;
    int waf_lfi = 1, waf_ssrf = 1, waf_xxe = 1, waf_xss = 1, waf_scan = 1, waf_shell = 1;
    int adapt_en = 1;
    double adapt_alpha = 0.15, adapt_warn = 3.0, adapt_ban = 5.0;
    int adapt_warmup = ADAPTIVE_WARMUP_SAMPLES;
    int fp_learn = 0, fp_trust_days = 30, fp_min_samples = 100;
    int fp_auto_whitelist = 0;
    int ja3_cluster_en = 0, ja3_cluster_min = 3;
    char fp_store_path[512] = "data/fp-trust.lst";
    int auto_ban_policy = 1;
    double auto_ban_min_risk = 60.0;
    char ban_audit_path[512] = "data/ban-policy-audit.jsonl";
    anomaly_get_thresholds(&low_slow_req, &brute_err, &ddos_rps, &slow_ms,
                           &sqli_score, &slow_hit_cnt, &cooldown);

    char line[512];
    int ln = 0;
    while (fgets(line, sizeof(line), fp)) {
        ln++;
        char *p = trim_ws(line);
        if (*p == '\0' || *p == '#') continue;

        char *eq = strchr(p, '=');
        if (!eq) continue;
        *eq = '\0';

        char *key = trim_ws(p);
        char *val = trim_ws(eq + 1);
        if (*key == '\0' || *val == '\0') continue;

        errno = 0;
        char *endptr = NULL;
        long parsed = strtol(val, &endptr, 10);
        int is_number = (errno == 0 && endptr && *trim_ws(endptr) == '\0');

        if (strcmp(key, "LOW_SLOW_REQ") == 0 && is_number) low_slow_req = (int)parsed;
        else if (strcmp(key, "BRUTE_FORCE_ERR") == 0 && is_number) brute_err = (int)parsed;
        else if (strcmp(key, "DDOS_RPS") == 0 && is_number) ddos_rps = (int)parsed;
        else if (strcmp(key, "SLOW_RESP_MS") == 0 && is_number) slow_ms = (int)parsed;
        else if (strcmp(key, "SQLI_SCORE") == 0 && is_number) sqli_score = (int)parsed;
        else if (strcmp(key, "SLOW_HIT_COUNT") == 0 && is_number) slow_hit_cnt = (int)parsed;
        else if (strcmp(key, "ALERT_COOLDOWN_SEC") == 0 && is_number) cooldown = (int)parsed;
        else if (strcmp(key, "BAN_TTL_SEC") == 0 && is_number) g_ban_ttl_sec = (int)parsed;
        else if (strcmp(key, "TENANT_ID") == 0) {
            strncpy(g_tenant_id, val, sizeof(g_tenant_id)-1);
            g_tenant_id[sizeof(g_tenant_id)-1] = '\0';
        }
        else if (strcmp(key, "MULTI_TENANT_DB") == 0 && is_number)
            g_multi_tenant_db = (int)parsed != 0;
        else if (strcmp(key, "MESH_ETCD_ENDPOINTS") == 0) {
            strncpy(g_mesh_etcd_endpoints, val, sizeof(g_mesh_etcd_endpoints)-1);
            g_mesh_etcd_endpoints[sizeof(g_mesh_etcd_endpoints)-1] = '\0';
        }
        else if (strcmp(key, "DB_ENABLED") == 0 && is_number) g_db_enabled = (int)parsed != 0;
        else if (strcmp(key, "DB_PATH") == 0 && !g_db_path_cli) {
            size_t n = strlen(val);
            if (n >= sizeof(g_db_path_buf)) n = sizeof(g_db_path_buf) - 1;
            memcpy(g_db_path_buf, val, n);
            g_db_path_buf[n] = '\0';
            g_db_path = g_db_path_buf;
        }
        else if (strcmp(key, "ANOMALY_THRESHOLD_LIMIT") == 0) {
            char *sp = strchr(val, ' ');
            if (sp) {
                *sp = '\0';
                int limit = atoi(sp + 1);
                anomaly_add_endpoint_limit(val, limit);
            }
        }
        else if (strcmp(key, "ACCESS_PASSWORD") == 0) {
            if (!g_output_json) {
                fprintf(stderr, "[ERISIM] ACCESS_PASSWORD devre disi. HASH/KDF kullanin.\n");
            }
        }
        else if (strcmp(key, "ACCESS_PASSWORD_HASH") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_access_password_hash)) n = sizeof(g_access_password_hash) - 1;
            memcpy(g_access_password_hash, val, n);
            g_access_password_hash[n] = '\0';
            for (size_t i = 0; i < n; i++) {
                g_access_password_hash[i] =
                    (char)tolower((unsigned char)g_access_password_hash[i]);
            }
        }
        else if (strcmp(key, "ACCESS_PASSWORD_KDF") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_access_password_kdf)) n = sizeof(g_access_password_kdf) - 1;
            memcpy(g_access_password_kdf, val, n);
            g_access_password_kdf[n] = '\0';
        }
        else if (strcmp(key, "TELEGRAM_TOKEN") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_webhook.token)) n = sizeof(g_webhook.token) - 1;
            memcpy(g_webhook.token, val, n);
            g_webhook.token[n] = '\0';
        }
        else if (strcmp(key, "TELEGRAM_CHAT_ID") == 0) {
            webhook_set_telegram_chat_csv(val);
        }
        else if (strcmp(key, "TELEGRAM_CHAT_CRIT") == 0) {
            webhook_set_telegram_chat_crit_csv(val);
        }
        else if (strcmp(key, "TELEGRAM_CHAT_WARN") == 0) {
            webhook_set_telegram_chat_warn_csv(val);
        }
        else if (strcmp(key, "GENERIC_WEBHOOK_URL") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_webhook.generic_url)) n = sizeof(g_webhook.generic_url) - 1;
            memcpy(g_webhook.generic_url, val, n);
            g_webhook.generic_url[n] = '\0';
        }
        else if (strcmp(key, "WEBHOOK_ENABLED")     == 0 && is_number) g_webhook.enabled      = (int)parsed;
        else if (strcmp(key, "WEBHOOK_MIN_LEVEL")   == 0 && is_number) g_webhook.min_level    = (int)parsed;
        else if (strcmp(key, "WEBHOOK_COOLDOWN_SEC")== 0 && is_number) g_webhook.cooldown_sec = (int)parsed;
        else if (strcmp(key, "WEBHOOK_OPERATOR_MUTE_SEC") == 0 && is_number)
            g_webhook.operator_mute_sec = (int)parsed;
        else if (strcmp(key, "WEBHOOK_ASYNC")       == 0 && is_number) g_webhook.async_enabled = (int)parsed;
        else if (strcmp(key, "WEBHOOK_SILENT_INFO")  == 0 && is_number) g_webhook.silent_info   = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_BOT") == 0 && is_number)
            g_webhook.telegram_bot_enabled = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_ROUTE") == 0 && is_number)
            g_webhook.telegram_route_by_level = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_BATCH_SEC") == 0 && is_number)
            g_webhook.telegram_batch_sec = (int)parsed;
        else if (strcmp(key, "WEBHOOK_QUIET_HOURS") == 0)
            webhook_set_quiet_hours(val);
        else if (strcmp(key, "WEBHOOK_DAILY_SUMMARY") == 0)
            webhook_set_daily_summary(val);
        else if (strcmp(key, "WEBHOOK_WEEKLY_SUMMARY") == 0)
            webhook_set_weekly_summary(val);
        else if (strcmp(key, "WEBHOOK_TELEGRAM_ALERT_FMT") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_webhook.telegram_alert_fmt))
                n = sizeof(g_webhook.telegram_alert_fmt) - 1;
            memcpy(g_webhook.telegram_alert_fmt, val, n);
            g_webhook.telegram_alert_fmt[n] = '\0';
        }
        else if ((strcmp(key, "TELEGRAM_TOPIC_WAF") == 0 ||
                  strcmp(key, "WEBHOOK_TELEGRAM_TOPIC_WAF") == 0) &&
                 is_number && parsed > 0)
            g_webhook.telegram_topic_waf = (int)parsed;
        else if ((strcmp(key, "TELEGRAM_TOPIC_BAN") == 0 ||
                  strcmp(key, "WEBHOOK_TELEGRAM_TOPIC_BAN") == 0) &&
                 is_number && parsed > 0)
            g_webhook.telegram_topic_ban = (int)parsed;
        else if ((strcmp(key, "TELEGRAM_TOPIC_TRAP") == 0 ||
                  strcmp(key, "WEBHOOK_TELEGRAM_TOPIC_TRAP") == 0) &&
                 is_number && parsed > 0)
            g_webhook.telegram_topic_trap = (int)parsed;
        else if ((strcmp(key, "TELEGRAM_TOPIC_WARN") == 0 ||
                  strcmp(key, "WEBHOOK_TELEGRAM_TOPIC_WARN") == 0) &&
                 is_number && parsed > 0) {
            g_webhook.telegram_topic_warn = (int)parsed;
            g_webhook.telegram_mirror_warn = 1;
        }
        else if (strcmp(key, "WEBHOOK_TELEGRAM_MIRROR_WARN") == 0 && is_number)
            g_webhook.telegram_mirror_warn = (int)parsed;
        else if (strcmp(key, "DASHBOARD_BASE_URL") == 0)
            webhook_set_dashboard_base_url(val);
        else if (strcmp(key, "WEBHOOK_TELEGRAM_CARD_PHOTO_URL") == 0)
            webhook_set_telegram_card_photo_url(val);
        else if (strcmp(key, "WEBHOOK_TELEGRAM_RICH_CARD") == 0 && is_number)
            g_webhook.telegram_rich_card = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_DISABLE_PREVIEW") == 0 && is_number)
            g_webhook.telegram_disable_preview = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_REPLY_CHAIN") == 0 && is_number)
            g_webhook.telegram_reply_chain = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_REPLY_CHAIN_SEC") == 0 && is_number)
            g_webhook.telegram_reply_chain_sec = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_GEOIP") == 0 && is_number)
            g_webhook.telegram_geoip = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_PIN_CRIT") == 0 && is_number)
            g_webhook.telegram_pin_crit = (int)parsed;
        else if (strcmp(key, "WEBHOOK_TELEGRAM_WEBHOOK_URL") == 0)
            webhook_set_telegram_webhook_url(val);
        else if (strcmp(key, "WEBHOOK_TELEGRAM_WEBHOOK_SECRET") == 0)
            webhook_set_telegram_webhook_secret(val);
        else if (strcmp(key, "TRAP_FILE") == 0) {
            add_trap_file(val);
        }
        else if (strcmp(key, "WHITELIST_IP") == 0) {
            if (g_whitelist_count < MAX_WHITELIST_IPS && is_valid_ip(val)) {
                size_t len = strlen(val);
                if (len >= IP_STR_LEN) len = IP_STR_LEN - 1;
                memcpy(g_whitelist_ips[g_whitelist_count], val, len);
                g_whitelist_ips[g_whitelist_count][len] = '\0';
                g_whitelist_count++;
            } else if (!g_output_json) {
                fprintf(stderr, "[RULES] Gecersiz WHITELIST_IP satir %d: %s\n", ln, val);
            }
        }
        else if (strcmp(key, "TRUST_XFF") == 0 && is_number)
            parser_set_trust_xff((int)parsed != 0);
        else if (strcmp(key, "TRUST_PROXY_CIDRS") == 0 ||
                 strcmp(key, "TRUST_PROXY_CIDR") == 0)
            parser_add_proxy_cidr(val);
        else if (strcmp(key, "WATCH_DIR") == 0) {
            size_t n = strlen(val);
            if (n >= PATH_MAX) n = PATH_MAX - 1;
            memcpy(g_watch_dir, val, n);
            g_watch_dir[n] = '\0';
        }
        else if (strcmp(key, "METRICS_PORT") == 0 && is_number) {
            if (parsed >= 0 && parsed < 65536) g_metrics_port = (int)parsed;
        }
        else if (strcmp(key, "API_PORT") == 0 && is_number) {
            if (parsed >= 0 && parsed < 65536) g_api_port = (int)parsed;
        }
        else if (strcmp(key, "API_BIND") == 0 && val[0]) {
            size_t n = strlen(val);
            if (n >= sizeof(g_api_bind)) n = sizeof(g_api_bind) - 1;
            memcpy(g_api_bind, val, n);
            g_api_bind[n] = '\0';
        }
        else if (strcmp(key, "API_TOKEN") == 0 && val[0]) {
            size_t n = strlen(val);
            if (n >= sizeof(g_api_token)) n = sizeof(g_api_token) - 1;
            memcpy(g_api_token, val, n);
            g_api_token[n] = '\0';
        }
        else if (strcmp(key, "XDP_MAP_V4_SIZE") == 0 && is_number && parsed > 0)
            g_xdp_map_v4_sz = (int)parsed;
        else if (strcmp(key, "XDP_MAP_V6_SIZE") == 0 && is_number && parsed > 0)
            g_xdp_map_v6_sz = (int)parsed;
        else if (strcmp(key, "TRAP_URL") == 0) {
            if (g_trap_url_count < MAX_TRAP_URLS) {
                size_t vn = strlen(val);
                if (vn >= 512) vn = 511;
                memcpy(g_trap_urls[g_trap_url_count], val, vn);
                g_trap_urls[g_trap_url_count][vn] = '\0';
                g_trap_url_count++;
            }
        }
        else if (strcmp(key, "JA3_CUSTOM_SIG") == 0) {
            /* Format: <32hex>:<tool_name>:<confidence> */
            char *colon1 = strchr(val, ':');
            if (colon1) {
                *colon1 = '\0';
                char *hash = trim_ws(val);
                char *tool_part = colon1 + 1;
                char *colon2 = strchr(tool_part, ':');
                if (colon2) {
                    *colon2 = '\0';
                    char *tool = trim_ws(tool_part);
                    int conf = atoi(trim_ws(colon2 + 1));
                    ja3_load_custom_sig(hash, tool, conf);
                }
            }
        }
        else if (strcmp(key, "JA3_CLUSTER_BAN") == 0 && is_number)
            ja3_cluster_en = (int)parsed != 0;
        else if (strcmp(key, "JA3_CLUSTER_MIN_IPS") == 0 && is_number && parsed >= 2)
            ja3_cluster_min = (int)parsed;
        else if (strcmp(key, "THREAT_FEED_ENABLED") == 0 && is_number)
            g_threat_config.enabled = (int)parsed;
        else if (strcmp(key, "THREAT_FEED_INTERVAL_SEC") == 0 && is_number && parsed > 0)
            g_threat_config.update_interval_sec = (int)parsed;
        else if (strcmp(key, "THREAT_FEED_API_KEY") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.api_key)) n = sizeof(g_threat_config.api_key) - 1;
            memcpy(g_threat_config.api_key, val, n);
            g_threat_config.api_key[n] = '\0';
        }
        else if (strcmp(key, "THREAT_FEED_URL") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.feed_url))
                n = sizeof(g_threat_config.feed_url) - 1;
            memcpy(g_threat_config.feed_url, val, n);
            g_threat_config.feed_url[n] = '\0';
        }
        else if (strcmp(key, "THREAT_FEED_SOURCES") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.sources)) n = sizeof(g_threat_config.sources) - 1;
            memcpy(g_threat_config.sources, val, n);
            g_threat_config.sources[n] = '\0';
        }
        else if (strcmp(key, "OTX_API_KEY") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.otx_api_key)) n = sizeof(g_threat_config.otx_api_key) - 1;
            memcpy(g_threat_config.otx_api_key, val, n);
            g_threat_config.otx_api_key[n] = '\0';
        }
        else if (strcmp(key, "STIX_URL") == 0 || strcmp(key, "THREAT_FEED_STIX_URL") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.stix_url)) n = sizeof(g_threat_config.stix_url) - 1;
            memcpy(g_threat_config.stix_url, val, n);
            g_threat_config.stix_url[n] = '\0';
        }
        else if (strcmp(key, "THREAT_FEED_USE_BAN_PIPELINE") == 0 && is_number)
            g_threat_config.use_ban_pipeline = (int)parsed != 0;
        else if (strcmp(key, "THREAT_FEED_MIN_SCORE") == 0 && is_number)
            g_threat_config.min_score = (int)parsed;
        else if (strcmp(key, "THREAT_FEED_MAX_IPS") == 0 && is_number && parsed > 0)
            g_threat_config.max_ips_per_cycle = (int)parsed;
        else if (strcmp(key, "THREAT_FEED_AUDIT") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.audit_path)) n = sizeof(g_threat_config.audit_path) - 1;
            memcpy(g_threat_config.audit_path, val, n);
            g_threat_config.audit_path[n] = '\0';
        }
        else if (strcmp(key, "WAF_ENABLED") == 0 && is_number)
            waf_en = (int)parsed != 0;
        else if (strcmp(key, "WAF_SCORE_BAN_THRESHOLD") == 0 && is_number && parsed > 0)
            waf_ban_thr = (int)parsed;
        else if (strcmp(key, "WAF_LFI") == 0 && is_number)
            waf_lfi = (int)parsed != 0;
        else if (strcmp(key, "WAF_SSRF") == 0 && is_number)
            waf_ssrf = (int)parsed != 0;
        else if (strcmp(key, "WAF_XXE") == 0 && is_number)
            waf_xxe = (int)parsed != 0;
        else if (strcmp(key, "WAF_XSS") == 0 && is_number)
            waf_xss = (int)parsed != 0;
        else if (strcmp(key, "WAF_SCANNER_DETECT") == 0 && is_number)
            waf_scan = (int)parsed != 0;
        else if (strcmp(key, "WAF_SHELLCMD") == 0 && is_number)
            waf_shell = (int)parsed != 0;
        else if (strcmp(key, "ADAPTIVE_THRESHOLD") == 0 && is_number)
            adapt_en = (int)parsed != 0;
        else if (strcmp(key, "EMA_ALPHA") == 0) {
            char *ep = NULL;
            double d = strtod(val, &ep);
            if (ep && ep != val && d > 0.0 && d < 1.0) adapt_alpha = d;
        }
        else if (strcmp(key, "ADAPTIVE_WARN_MULTIPLIER") == 0) {
            char *ep = NULL;
            double d = strtod(val, &ep);
            if (ep && ep != val && d > 1.0) adapt_warn = d;
        }
        else if (strcmp(key, "ADAPTIVE_BAN_MULTIPLIER") == 0) {
            char *ep = NULL;
            double d = strtod(val, &ep);
            if (ep && ep != val && d > 1.0) adapt_ban = d;
        }
        else if (strcmp(key, "ADAPTIVE_WARMUP_SAMPLES") == 0 && is_number && parsed > 0)
            adapt_warmup = (int)parsed;
        else if (strcmp(key, "MESH_PUB_ENABLED") == 0 && is_number)
            g_threat_config.mesh_pub_enabled = (int)parsed != 0;
        else if (strcmp(key, "MESH_PUB_ADDR") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.mesh_pub_addr))
                n = sizeof(g_threat_config.mesh_pub_addr) - 1;
            memcpy(g_threat_config.mesh_pub_addr, val, n);
            g_threat_config.mesh_pub_addr[n] = '\0';
        }
        else if (strcmp(key, "MESH_SUB_ENABLED") == 0 && is_number)
            g_threat_config.mesh_sub_enabled = (int)parsed != 0;
        else if (strcmp(key, "MESH_SUB_ADDR") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_threat_config.mesh_sub_addr))
                n = sizeof(g_threat_config.mesh_sub_addr) - 1;
            memcpy(g_threat_config.mesh_sub_addr, val, n);
            g_threat_config.mesh_sub_addr[n] = '\0';
        }
        else if (strcmp(key, "SAAS_ENABLED") == 0 && is_number)
            g_agent_sync_config.enabled = (int)parsed != 0;
        else if (strcmp(key, "SAAS_URL") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_agent_sync_config.url))
                n = sizeof(g_agent_sync_config.url) - 1;
            memcpy(g_agent_sync_config.url, val, n);
            g_agent_sync_config.url[n] = '\0';
        }
        else if (strcmp(key, "SAAS_TOKEN") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_agent_sync_config.token))
                n = sizeof(g_agent_sync_config.token) - 1;
            memcpy(g_agent_sync_config.token, val, n);
            g_agent_sync_config.token[n] = '\0';
        }
        else if (strcmp(key, "AGENT_ID") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_agent_sync_config.agent_id))
                n = sizeof(g_agent_sync_config.agent_id) - 1;
            memcpy(g_agent_sync_config.agent_id, val, n);
            g_agent_sync_config.agent_id[n] = '\0';
        }
        else if (strcmp(key, "SIEM_FORWARDER_ENABLED") == 0 && is_number)
            g_siem_config.enabled = (int)parsed != 0;
        else if (strcmp(key, "SIEM_HOST") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_siem_config.host))
                n = sizeof(g_siem_config.host) - 1;
            memcpy(g_siem_config.host, val, n);
            g_siem_config.host[n] = '\0';
        }
        else if (strcmp(key, "SIEM_PORT") == 0 && is_number && parsed > 0 && parsed < 65536)
            g_siem_config.port = (int)parsed;
        else if (strcmp(key, "K8S_WEBHOOK_ENABLED") == 0 && is_number)
            g_k8s_webhook_config.enabled = (int)parsed != 0;
        else if (strcmp(key, "K8S_OPERATOR_URL") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_k8s_webhook_config.endpoint))
                n = sizeof(g_k8s_webhook_config.endpoint) - 1;
            memcpy(g_k8s_webhook_config.endpoint, val, n);
            g_k8s_webhook_config.endpoint[n] = '\0';
        }
        else if (strcmp(key, "CRS_ENABLED") == 0 && is_number)
            g_crs_enabled = (int)parsed != 0;
        else if (strcmp(key, "CRS_RULES") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_crs_rules_path)) n = sizeof(g_crs_rules_path) - 1;
            memcpy(g_crs_rules_path, val, n);
            g_crs_rules_path[n] = '\0';
        }
        else if (strcmp(key, "OPENAPI_SCHEMA") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_openapi_schema_path))
                n = sizeof(g_openapi_schema_path) - 1;
            memcpy(g_openapi_schema_path, val, n);
            g_openapi_schema_path[n] = '\0';
        }
        else if (strcmp(key, "OPENAPI_STRICT") == 0 && is_number)
            g_openapi_strict = (int)parsed != 0;
        else if (strcmp(key, "INCIDENT_WINDOW_SEC") == 0 && is_number && parsed >= 60)
            incident_engine_set_window_sec((int)parsed);
        else if (strcmp(key, "INCIDENT_MIN_LOG_HITS") == 0 && is_number && parsed >= 1)
            incident_engine_set_min_log_hits((int)parsed);
        else if (strcmp(key, "FALCO_HOST_RULES") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_falco_host_rules_path))
                n = sizeof(g_falco_host_rules_path) - 1;
            memcpy(g_falco_host_rules_path, val, n);
            g_falco_host_rules_path[n] = '\0';
        }
        else if (strcmp(key, "FP_TRUST_DAYS") == 0 && is_number && parsed >= 0)
            fp_trust_days = (int)parsed;
        else if (strcmp(key, "FP_LEARN") == 0 && is_number)
            fp_learn = (int)parsed != 0;
        else if (strcmp(key, "FP_TRUST_MIN_SAMPLES") == 0 && is_number && parsed >= 1)
            fp_min_samples = (int)parsed;
        else if (strcmp(key, "FP_TRUST_STORE") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(fp_store_path)) n = sizeof(fp_store_path) - 1;
            memcpy(fp_store_path, val, n);
            fp_store_path[n] = '\0';
        }
        else if (strcmp(key, "FP_TRUST_AUTO_WHITELIST") == 0 && is_number)
            fp_auto_whitelist = (int)parsed != 0;
        else if (strcmp(key, "AUTO_BAN") == 0 && is_number)
            auto_ban_policy = (int)parsed != 0;
        else if (strcmp(key, "AUTO_BAN_MIN_RISK") == 0) {
            char *ep = NULL;
            double d = strtod(val, &ep);
            if (ep && *trim_ws(ep) == '\0' && d >= 0.0 && d <= 100.0)
                auto_ban_min_risk = d;
        }
        else if (strcmp(key, "BAN_POLICY_AUDIT") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(ban_audit_path)) n = sizeof(ban_audit_path) - 1;
            memcpy(ban_audit_path, val, n);
            ban_audit_path[n] = '\0';
        }
        else if (strcmp(key, "MESH_BACKEND") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_mesh_backend_cfg))
                n = sizeof(g_mesh_backend_cfg) - 1;
            memcpy(g_mesh_backend_cfg, val, n);
            g_mesh_backend_cfg[n] = '\0';
        }
        else if (strcmp(key, "LINEAGE_AUTO_ALERT") == 0 && is_number)
            g_lineage_auto_alert = (int)parsed != 0;
        else if (strcmp(key, "ENDPOINT_BASELINE_ENABLED") == 0 && is_number)
            endpoint_baseline_set_enabled((int)parsed);
        else if (strcmp(key, "ENDPOINT_BASELINE_DAYS") == 0 && is_number && parsed >= 1)
            endpoint_baseline_set_window_days((int)parsed);
        else if (strcmp(key, "GEOIP_REFRESH_HOURS") == 0 && is_number && parsed >= 1)
            geoip_feed_set_interval_hours((int)parsed);
        else if (strcmp(key, "INTEL_BAN_DB_TTL_DAYS") == 0 && is_number && parsed >= 0)
            g_intel_ban_db_ttl_days = (int)parsed;
        else if (strcmp(key, "WASM_ENABLED") == 0 && is_number)
            g_wasm_enabled = (int)parsed != 0;
        else if (strcmp(key, "WASM_PLUGIN_DIR") == 0) {
            size_t n = strlen(val);
            if (n >= sizeof(g_wasm_plugin_dir)) n = sizeof(g_wasm_plugin_dir) - 1;
            memcpy(g_wasm_plugin_dir, val, n);
            g_wasm_plugin_dir[n] = '\0';
        }
    }
    fclose(fp);

    rules_fleet_reload_overlay();

    if (g_multi_tenant_db && !g_db_path_cli) {
        char dir[256] = ".";
        const char *slash = strrchr(path, '/');
        if (slash) {
            size_t dlen = (size_t)(slash - path);
            if (dlen < sizeof(dir)) {
                memcpy(dir, path, dlen);
                dir[dlen] = '\0';
            }
        }
        tenant_policy_apply(g_tenant_id, 1, dir, g_db_path_buf,
                            sizeof(g_db_path_buf), g_db_path_cli);
        tenant_policy_load_overlay(dir);
        if (g_db_path_buf[0]) {
            g_db_path = g_db_path_buf;
        }
    } else {
        tenant_policy_apply(g_tenant_id, g_multi_tenant_db, ".",
                            g_db_path_buf, sizeof(g_db_path_buf), g_db_path_cli);
    }

    schema_set_strict_mode(g_openapi_strict);
    metrics_set_tenant_id(g_tenant_id);
    mesh_backend_configure(g_mesh_backend_cfg, g_mesh_etcd_endpoints,
                           g_threat_config.mesh_pub_enabled,
                           g_threat_config.mesh_sub_enabled);

    anomaly_load_waf_config(waf_en, waf_ban_thr, waf_lfi, waf_ssrf, waf_xxe,
                            waf_xss, waf_scan, waf_shell);
    anomaly_load_adaptive_config(adapt_en, adapt_alpha, adapt_warn, adapt_ban,
                                 adapt_warmup);
    resolve_path_from_rules(path, fp_store_path, sizeof(fp_store_path));
    resolve_path_from_rules(path, ban_audit_path, sizeof(ban_audit_path));
    fp_trust_config(fp_learn, fp_trust_days, fp_min_samples, fp_store_path);
    fp_trust_set_tenant(g_tenant_id);
    fp_trust_init();
    if (fp_learn && fp_auto_whitelist)
        fp_trust_register_promote_fn(fp_trust_promote_whitelist_cb);
    else
        fp_trust_register_promote_fn(NULL);
    ban_policy_init();
    {
        const TenantIsolationInfo *ti = tenant_policy_info();
        if (ti && ti->multi_tenant) {
            if (ti->ban_audit_path[0]) {
                strncpy(ban_audit_path, ti->ban_audit_path, sizeof(ban_audit_path) - 1);
                ban_audit_path[sizeof(ban_audit_path) - 1] = '\0';
            }
            if (ti->fp_store_path[0]) {
                char tenant_fp[512];
                strncpy(tenant_fp, ti->fp_store_path, sizeof(tenant_fp) - 1);
                tenant_fp[sizeof(tenant_fp) - 1] = '\0';
                resolve_path_from_rules(path, tenant_fp, sizeof(tenant_fp));
                fp_trust_config(fp_learn, fp_trust_days, fp_min_samples, tenant_fp);
                fp_trust_init();
            }
            if (ti->threat_audit_path[0]) {
                strncpy(g_threat_config.audit_path, ti->threat_audit_path,
                        sizeof(g_threat_config.audit_path) - 1);
                g_threat_config.audit_path[sizeof(g_threat_config.audit_path) - 1] = '\0';
            }
            if (ti->auto_ban_min_risk >= 0.0)
                auto_ban_min_risk = ti->auto_ban_min_risk;
            if (ti->ban_ttl_sec > 0)
                g_ban_ttl_sec = ti->ban_ttl_sec;
        }
    }
    ban_policy_config(auto_ban_policy, auto_ban_min_risk, ban_audit_path);
    ban_policy_set_tenant(g_tenant_id);
    ja3_cluster_config(ja3_cluster_en, ja3_cluster_min);

    const char *env_token = getenv("LOGANALYZER_TELEGRAM_TOKEN");
    if (env_token && *env_token) {
        size_t n = strlen(env_token);
        if (n >= sizeof(g_webhook.token)) n = sizeof(g_webhook.token) - 1;
        memcpy(g_webhook.token, env_token, n);
        g_webhook.token[n] = '\0';
    }
    const char *env_chat = getenv("LOGANALYZER_TELEGRAM_CHAT_ID");
    if (env_chat && *env_chat)
        webhook_set_telegram_chat_csv(env_chat);
    const char *env_chats = getenv("LOGANALYZER_TELEGRAM_CHAT_IDS");
    if (env_chats && *env_chats)
        webhook_set_telegram_chat_csv(env_chats);
    const char *env_chat_crit = getenv("LOGANALYZER_TELEGRAM_CHAT_CRIT");
    if (env_chat_crit && *env_chat_crit)
        webhook_set_telegram_chat_crit_csv(env_chat_crit);
    const char *env_chat_warn = getenv("LOGANALYZER_TELEGRAM_CHAT_WARN");
    if (env_chat_warn && *env_chat_warn)
        webhook_set_telegram_chat_warn_csv(env_chat_warn);
    const char *env_generic = getenv("LOGANALYZER_GENERIC_WEBHOOK_URL");
    if (env_generic && *env_generic) {
        size_t n = strlen(env_generic);
        if (n >= sizeof(g_webhook.generic_url)) n = sizeof(g_webhook.generic_url) - 1;
        memcpy(g_webhook.generic_url, env_generic, n);
        g_webhook.generic_url[n] = '\0';
    }
    {
        const char *env_wh = getenv("WEBHOOK_ENABLED");
        if (env_wh && env_wh[0])
            g_webhook.enabled = (env_wh[0] == '1' || env_wh[0] == 'y' || env_wh[0] == 'Y') ? 1 : 0;
        const char *env_min = getenv("WEBHOOK_MIN_LEVEL");
        if (env_min && env_min[0]) {
            char *end = NULL;
            long v = strtol(env_min, &end, 10);
            if (end != env_min && v >= 1 && v <= 3)
                g_webhook.min_level = (int)v;
        }
        const char *env_cd = getenv("WEBHOOK_COOLDOWN_SEC");
        if (env_cd && env_cd[0]) {
            char *end = NULL;
            long v = strtol(env_cd, &end, 10);
            if (end != env_cd && v >= 1)
                g_webhook.cooldown_sec = (int)v;
        }
        const char *env_async = getenv("WEBHOOK_ASYNC");
        if (env_async && env_async[0])
            g_webhook.async_enabled =
                (env_async[0] == '1' || env_async[0] == 'y' || env_async[0] == 'Y') ? 1 : 0;
        const char *env_si = getenv("WEBHOOK_SILENT_INFO");
        if (env_si && env_si[0])
            g_webhook.silent_info =
                (env_si[0] == '1' || env_si[0] == 'y' || env_si[0] == 'Y') ? 1 : 0;
        const char *env_bot = getenv("WEBHOOK_TELEGRAM_BOT");
        if (env_bot && env_bot[0])
            g_webhook.telegram_bot_enabled =
                (env_bot[0] == '1' || env_bot[0] == 'y' || env_bot[0] == 'Y') ? 1 : 0;
        const char *env_route = getenv("WEBHOOK_TELEGRAM_ROUTE");
        if (env_route && env_route[0])
            g_webhook.telegram_route_by_level =
                (env_route[0] == '1' || env_route[0] == 'y' || env_route[0] == 'Y') ? 1 : 0;
        const char *env_batch = getenv("WEBHOOK_TELEGRAM_BATCH_SEC");
        if (env_batch && env_batch[0]) {
            char *end = NULL;
            long v = strtol(env_batch, &end, 10);
            if (end != env_batch && v >= 0 && v <= 300)
                g_webhook.telegram_batch_sec = (int)v;
        }
        const char *env_quiet = getenv("WEBHOOK_QUIET_HOURS");
        if (env_quiet && env_quiet[0])
            webhook_set_quiet_hours(env_quiet);
        const char *env_daily = getenv("WEBHOOK_DAILY_SUMMARY");
        if (env_daily && env_daily[0])
            webhook_set_daily_summary(env_daily);
        const char *env_weekly = getenv("WEBHOOK_WEEKLY_SUMMARY");
        if (env_weekly && env_weekly[0])
            webhook_set_weekly_summary(env_weekly);
        const char *env_fmt = getenv("WEBHOOK_TELEGRAM_ALERT_FMT");
        if (env_fmt && env_fmt[0]) {
            size_t n = strlen(env_fmt);
            if (n >= sizeof(g_webhook.telegram_alert_fmt))
                n = sizeof(g_webhook.telegram_alert_fmt) - 1;
            memcpy(g_webhook.telegram_alert_fmt, env_fmt, n);
            g_webhook.telegram_alert_fmt[n] = '\0';
        }
        {
            int tw = g_webhook.telegram_topic_waf;
            int tb = g_webhook.telegram_topic_ban;
            int tt = g_webhook.telegram_topic_trap;
            int twn = g_webhook.telegram_topic_warn;
            const char *env_tw = getenv("WEBHOOK_TELEGRAM_TOPIC_WAF");
            const char *env_tb = getenv("WEBHOOK_TELEGRAM_TOPIC_BAN");
            const char *env_tt = getenv("WEBHOOK_TELEGRAM_TOPIC_TRAP");
            const char *env_twn = getenv("WEBHOOK_TELEGRAM_TOPIC_WARN");
            if (env_tw && env_tw[0]) {
                char *end = NULL;
                long v = strtol(env_tw, &end, 10);
                if (end != env_tw && v > 0)
                    tw = (int)v;
            }
            if (env_tb && env_tb[0]) {
                char *end = NULL;
                long v = strtol(env_tb, &end, 10);
                if (end != env_tb && v > 0)
                    tb = (int)v;
            }
            if (env_tt && env_tt[0]) {
                char *end = NULL;
                long v = strtol(env_tt, &end, 10);
                if (end != env_tt && v > 0)
                    tt = (int)v;
            }
            if (env_twn && env_twn[0]) {
                char *end = NULL;
                long v = strtol(env_twn, &end, 10);
                if (end != env_twn && v > 0)
                    twn = (int)v;
            }
            webhook_set_telegram_topics(tw, tb, tt, twn);
            const char *env_mw = getenv("WEBHOOK_TELEGRAM_MIRROR_WARN");
            if (env_mw && env_mw[0])
                g_webhook.telegram_mirror_warn =
                    (env_mw[0] == '1' || env_mw[0] == 'y' || env_mw[0] == 'Y') ? 1 : 0;
            else if (g_webhook.telegram_topic_warn > 0)
                g_webhook.telegram_mirror_warn = 1;
        }
        const char *env_dash = getenv("WEBHOOK_DASHBOARD_BASE_URL");
        if (!env_dash || !env_dash[0])
            env_dash = getenv("DASHBOARD_BASE_URL");
        if (env_dash && env_dash[0])
            webhook_set_dashboard_base_url(env_dash);
        const char *env_photo = getenv("WEBHOOK_TELEGRAM_CARD_PHOTO_URL");
        if (env_photo && env_photo[0])
            webhook_set_telegram_card_photo_url(env_photo);
        const char *env_rich = getenv("WEBHOOK_TELEGRAM_RICH_CARD");
        if (env_rich && env_rich[0])
            g_webhook.telegram_rich_card =
                (env_rich[0] == '1' || env_rich[0] == 'y' || env_rich[0] == 'Y') ? 1 : 0;
        const char *env_prev = getenv("WEBHOOK_TELEGRAM_DISABLE_PREVIEW");
        if (env_prev && env_prev[0])
            g_webhook.telegram_disable_preview =
                (env_prev[0] == '1' || env_prev[0] == 'y' || env_prev[0] == 'Y') ? 1 : 0;
        const char *env_chain = getenv("WEBHOOK_TELEGRAM_REPLY_CHAIN");
        if (env_chain && env_chain[0])
            g_webhook.telegram_reply_chain =
                (env_chain[0] == '1' || env_chain[0] == 'y' || env_chain[0] == 'Y') ? 1 : 0;
        const char *env_chain_sec = getenv("WEBHOOK_TELEGRAM_REPLY_CHAIN_SEC");
        if (env_chain_sec && env_chain_sec[0]) {
            long v = strtol(env_chain_sec, NULL, 10);
            if (v >= 60 && v < 86400 * 30)
                g_webhook.telegram_reply_chain_sec = (int)v;
        }
        const char *env_geo = getenv("WEBHOOK_TELEGRAM_GEOIP");
        if (env_geo && env_geo[0])
            g_webhook.telegram_geoip =
                (env_geo[0] == '1' || env_geo[0] == 'y' || env_geo[0] == 'Y') ? 1 : 0;
        const char *env_pin = getenv("WEBHOOK_TELEGRAM_PIN_CRIT");
        if (env_pin && env_pin[0])
            g_webhook.telegram_pin_crit =
                (env_pin[0] == '1' || env_pin[0] == 'y' || env_pin[0] == 'Y') ? 1 : 0;
        geoip_lookup_set_enabled(g_webhook.telegram_geoip);
        const char *env_twh = getenv("WEBHOOK_TELEGRAM_WEBHOOK_URL");
        if (env_twh && env_twh[0])
            webhook_set_telegram_webhook_url(env_twh);
        const char *env_tws = getenv("WEBHOOK_TELEGRAM_WEBHOOK_SECRET");
        if (env_tws && env_tws[0])
            webhook_set_telegram_webhook_secret(env_tws);
    }
    if (g_webhook.cooldown_sec < 1) g_webhook.cooldown_sec = 1;
    if (g_webhook.min_level < 1) g_webhook.min_level = 1;
    if (g_webhook.min_level > 3) g_webhook.min_level = 3;

    threat_feed_apply_env_keys();
    if (g_threat_config.audit_path[0])
        resolve_path_from_rules(path, g_threat_config.audit_path,
                                sizeof(g_threat_config.audit_path));

    anomaly_set_thresholds(low_slow_req, brute_err, ddos_rps, slow_ms,
                           sqli_score, slow_hit_cnt, cooldown);

    if (!g_output_json && !g_operator_quiet) {
        fprintf(stderr, "[RULES] Yuklendi: %s (whitelist=%zu)\n",
                path, g_whitelist_count);
    }
}

/*
 * ban_ip - system() YASAK; execve() ile guvenli parametre gecisi.
 *
 * system("ipset add <set> <ip>") yontemi Command Injection acigina
 * davetiye cikarabilir; shell yorumlama asamasinda ozel karakterler
 * calisabilir. is_valid_ip() koruma saglasa da defence in depth icin
 * kabuk hic devreye girmemeli.
 *
 * execve() cagrisinda argumanlar dizisi dogrudan kernel'e verilir;
 * /bin/sh acilmaz, interpolasyon yoktur.
 */





/* ipset, ban, unban moved to firewall.c */

#ifdef HAVE_LIBBPF
static int handle_xdp_packet(void *ctx, void *data, size_t data_sz) {
    (void)ctx;
    if (data_sz < sizeof(struct pkt_event)) return 0;
    
    struct pkt_event *evt = (struct pkt_event *)data;
    if (evt->payload_len == 0 || evt->payload_len > PKT_PAYLOAD_SIZE) return 0;

    /* IPv4 network-byte-order'dan string'e cevir */
    struct in_addr in;
    in.s_addr = evt->src_ip;
    char ip_str[INET_ADDRSTRLEN];
    if (!inet_ntop(AF_INET, &in, ip_str, INET_ADDRSTRLEN)) return 0;

    /* TLS Client Hello (JA3) tespiti */
    if (evt->is_tls_hello) {
        Alert alert;
        if (anomaly_process_ja3_event(evt->payload, evt->payload_len, ip_str, &alert)) {
            StrView ip_sv = { ip_str, strlen(ip_str) };
            IpRecord *rec = ipmap_get_or_create(&g_ipmap, ip_sv);
            if (rec && !atomic_load(&rec->banned)) {
                ban_ip(ip_str);
                atomic_store(&rec->banned, 1);
                atomic_store(&rec->ban_until_ts, time(NULL) + g_ban_ttl_sec);
                atomic_fetch_add(&g_atomic_ban_attempts, 1);
                
                if (g_use_tui) tui_push_alert(&g_stats, &alert);
                else if (!g_output_json) {
                    fprintf(stderr, "\n[ALARM] %s\n", alert.message);
                }
            }
        }
        return 0; /* PCRE'ye gerek yok */
    }

    /* Null terminate payload string view for PCRE */
    StrView sv = { (const char *)evt->payload, evt->payload_len };
    if (pcre_engine_match(sv)) {
        /* Zararli payload tespit edildi! Hemen IP_MAP'e ekle ve banla */
        StrView ip_sv = { ip_str, strlen(ip_str) };
        IpRecord *rec = ipmap_get_or_create(&g_ipmap, ip_sv);
        if (rec) {
            atomic_fetch_add(&rec->cnt.sqli_hits, 1);
            if (!atomic_load(&rec->banned)) {
                ban_ip(ip_str);
                atomic_store(&rec->banned, 1);
                atomic_store(&rec->ban_until_ts, time(NULL) + g_ban_ttl_sec);
                atomic_fetch_add(&g_atomic_ban_attempts, 1);
                atomic_fetch_add(&g_atomic_ban_success, 1);
                
                if (g_db_enabled) {
                    Alert arc = {0};
                    arc.level = ALERT_CRIT;
                    strncpy(arc.ip, ip_str, IP_STR_LEN - 1);
                    snprintf(arc.message, ALERT_MSG_LEN, "XDP Payload Sniffing tespiti (WAF)");
                    arc.ts = time(NULL);
                    db_log_alert(&arc, rec);
                }
            }
        }
    }
    return 0;
}
#endif

static double elapsed_sec(struct timeval *start, struct timeval *end) {
    return (double)(end->tv_sec  - start->tv_sec)
         + (double)(end->tv_usec - start->tv_usec) * 1e-6;
}

typedef struct {
    const char *data;
    size_t      size;
    int         fd;
} MmapFile;

static int mmap_open(const char *path, MmapFile *mf) {
    mf->fd = open(path, O_RDONLY);
    if (mf->fd < 0) { perror("open"); return -1; }
    struct stat st;
    if (fstat(mf->fd, &st) < 0) { perror("fstat"); close(mf->fd); return -1; }
    mf->size = (size_t)st.st_size;
    if (mf->size == 0) {
        if (!g_follow) {
            fprintf(stderr, "[HATA] Dosya bos: %s\n", path);
            close(mf->fd);
            return -1;
        } else {
            mf->data = NULL;
            return 0;
        }
    }
    mf->data = mmap(NULL, mf->size, PROT_READ, MAP_PRIVATE, mf->fd, 0);
    if (mf->data == MAP_FAILED) { perror("mmap file"); close(mf->fd); return -1; }
    madvise((void*)mf->data, mf->size, MADV_SEQUENTIAL);
    return 0;
}

static void mmap_close(MmapFile *mf) {
    if (mf->data && mf->data != MAP_FAILED) munmap((void*)mf->data, mf->size);
    if (mf->fd >= 0) close(mf->fd);
}

static struct termios g_orig_tio;

static void setup_raw_kbd(void) {
    tcgetattr(STDIN_FILENO, &g_orig_tio);
    struct termios raw = g_orig_tio;
    raw.c_lflag &= (tcflag_t)~(ICANON | ECHO);
    raw.c_cc[VMIN]  = 0;
    raw.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSANOW, &raw);
    int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
    fcntl(STDIN_FILENO, F_SETFL, flags | O_NONBLOCK);
}

static void restore_kbd(void) {
    tcsetattr(STDIN_FILENO, TCSANOW, &g_orig_tio);
    int flags = fcntl(STDIN_FILENO, F_GETFL, 0);
    fcntl(STDIN_FILENO, F_SETFL, flags & ~O_NONBLOCK);
}

static void manual_ban_top_ip(void) {
    if (!g_allow_ban) return;

    MinHeap tmp = g_top10;
    IpRecord *sorted[HEAP_K] = {NULL};
    heap_sort_desc(&tmp, sorted);
    IpRecord *rec = sorted[0];
    if (!rec || rec->ip[0] == '\0' || atomic_load(&rec->banned)) return;

    pthread_mutex_lock(&g_tui_mutex);
    if (!atomic_load(&rec->banned)) {
        atomic_fetch_add(&g_atomic_ban_attempts, 1);
        if (ban_ip(rec->ip) == 0) {
            atomic_fetch_add(&g_atomic_ban_success, 1);
            time_t now = time(NULL);
            atomic_store(&rec->banned, 1);
            atomic_store(&rec->ban_until_ts, now + g_ban_ttl_sec);
            tui_push_ban(&g_stats, rec->ip, now);
            if (g_db_enabled) {
                db_log_ban_event(rec->ip, "BAN", "manual-tui", now);
            }
        } else {
            atomic_fetch_add(&g_atomic_ban_fail, 1);
        }
    }
    pthread_mutex_unlock(&g_tui_mutex);
}

static void manual_mesh_publish(void) {
    MinHeap tmp = g_top10;
    IpRecord *sorted[HEAP_K] = {NULL};
    heap_sort_desc(&tmp, sorted);
    IpRecord *rec = sorted[0];
    if (!rec || rec->ip[0] == '\0') return;

    MeshThreatEvent ev = {0};
    if (mesh_backend_use_zmq()) {
        mesh_intel_fill_from_ip(&ev, rec->ip, 32, 800, "T1190", "Manual TUI publish");
        mesh_intel_publish(&ev);
    }
    if (mesh_backend_use_etcd() && etcd_mesh_active())
        etcd_mesh_publish(rec->ip, 800, "T1190", "Manual TUI publish");
}

static void process_keyboard(void) {
    char c;
    ssize_t n = read(STDIN_FILENO, &c, 1);
    if (n <= 0) return;
    if (c == 'q' || c == 'Q') g_running = 0;
    else if (c == ' ') g_paused = !g_paused;
    else if (c == 'b' || c == 'B') manual_ban_top_ip();
    else if (c == 'm' || c == 'M') manual_mesh_publish();
}

/* rules.conf dizinine gore goreli OPENAPI_SCHEMA yolunu coz */
static void resolve_path_from_rules(const char *rules_path, char *inout, size_t inout_sz)
{
    if (!inout || inout_sz == 0 || !inout[0]) return;
    if (inout[0] == '/') return;

    char dir[512] = ".";
    if (rules_path) {
        const char *slash = strrchr(rules_path, '/');
        if (slash && slash > rules_path) {
            size_t dlen = (size_t)(slash - rules_path);
            if (dlen >= sizeof(dir)) dlen = sizeof(dir) - 1;
            memcpy(dir, rules_path, dlen);
            dir[dlen] = '\0';
        }
    }

    char resolved[512];
    snprintf(resolved, sizeof(resolved), "%s/%s", dir, inout);
    strncpy(inout, resolved, inout_sz - 1);
    inout[inout_sz - 1] = '\0';
}

static void usage(const char *prog) {
    fprintf(stderr,
            "\nKullanim: %s <log_dosyasi> [secenekler]\n\n"
            "  Secenekler:\n"
            "    --no-tui      TUI olmadan calis (pipe icin)\n"
            "    --no-ban      ipset ban ozelligini devre disi birak\n"
            "    --pool-mb N   Bellek havuzu boyutu (varsayilan: 512 MB)\n"
            "    --rules FILE  Kural dosyasi (esikler + whitelist)\n"
            "    --password-file FILE  Parolayi dosyadan oku (non-interactive)\n"
            "    --db FILE     SQLite olay veritabani yolu (varsayilan: events.db)\n"
            "    --no-db       SQLite kaydini kapat\n"
            "    --drop-privs  Ban kapaliyken root yetkisini dusur\n"
            "    --ban-ttl-sec N  BAN suresi (sn), sure dolunca otomatik unban\n"
            "    -f, --follow  Dosya sonuna gelinse bile bekle ve yeni satirlari oku (tail -f)\n"
            "    --json        Cikista raporu JSON formatinda bas\n"
            "    -t N          Worker thread sayisi (varsayilan: 4)\n"
            "    --health      IPC + daemon_stats + GET /metrics saglik kontrolu\n"
            "    --status      SOC ozeti JSON (son 10 alarm, ban, EPS, daemon)\n"
            "    --quiet, -q   --health/--status: RULES/MESH stderr sustur (JSON pipe)\n"
            "    --db FILE     --status icin SQLite yolu (rules.conf DB_PATH)\n\n"
            "  Operator (log dosyasi gerekmez):\n"
            "    %s ban <IP> [--reason METIN]   Kernel/ipset ban (pipeline)\n"
            "    %s unban <IP>                  Ban kaldir\n"
            "    %s crs-stats                   PCRE/CRS yukleme istatistigi\n"
            "    %s lineage-stats [--demo] [--path FILE]  Attack tree ozeti\n"
            "    %s ban-db-prune [--db FILE] [--all]  threat-intel DB kirp\n"
            "    %s webhook-test [alert|crit|crit-chain|ban|trap|batch]  Bildirim testi\n"
            "    %s webhook-metrics-reset [--all]  webhook.metrics sifirla (varsayilan: fail)\n"
            "    %s daily-summary [--force]  Gunluk ozet Telegram DM (operator)\n"
            "    %s weekly-summary [--force] Haftalik ozet Telegram DM (operator)\n\n"
            "  EriSim:\n"
            "    rules.conf: ACCESS_PASSWORD_KDF=pbkdf2$iter$salt_hex$hash_hex\n"
            "    Legacy: ACCESS_PASSWORD_HASH=<sha256-hex>\n"
            "    Opsiyonel non-interactive: LOGANALYZER_PASSWORD ortam degiskeni\n"
            "    3 hatali denemede oturum sonlandirilir.\n"
            "  Tuzak:\n"
            "    rules.conf: TRAP_FILE=password.txt (tekrar edilebilir)\n"
            "    rules.conf: CRS_RULES=rules/crs-core.rules  (OWASP CRS cekirdek)\n\n",
            prog, prog, prog, prog, prog, prog, prog, prog, prog, prog);
}

/* maybe_drop_privileges moved to auth.c */
/* ─────────────────────────────────────────────────────────────────────
 * Bellek havuzu GC thread'i (Garbage Collection / LRU Eviction)
 * Her 60 saniyede bir havuz doluluk oranını kontrol eder.
 * %85 eşiği aşılırsa lru_seq değeri en düşük olan kayıtları bulup evict eder.
 * ───────────────────────────────────────────────────────────────────── */
static int ban_expire_cb(const char *ip, void *ctx)
{
    (void)ctx;
    if (unban_ip(ip) != 0) return -1;
    if (g_db_enabled)
        db_log_ban_event(ip, "UNBAN", "ttl-expired-bg", time(NULL));
    return 0;
}

static void *pool_gc_thread(void *arg) {
    (void)arg;
    int ban_gc_loops = 0;

    while (g_running) {
        /* Normal bekleme: 5 saniye, ama acil flag gelirse aninda uyani */
        for (int i = 0; i < 50 && g_running; i++) {
            usleep(100000);  /* 100ms parcalar halinde bekle */
            if (atomic_load(&g_janitor_evict_needed)) break;
        }
        if (!g_running) break;

        if (g_allow_ban && ++ban_gc_loops >= 12) {
            ban_gc_loops = 0;
            size_t un = ipmap_expire_bans(&g_ipmap, time(NULL), ban_expire_cb, NULL);
            if (un > 0 && !g_output_json)
                log_rl(LOG_INFO, "[BAN] TTL: %zu IP otomatik unban", un);
        }

        double usage  = pool_usage_ratio(&g_pool);
        int    urgent = atomic_exchange(&g_janitor_evict_needed, 0);

        if (usage < POOL_GC_THRESHOLD && !urgent) continue;

        log_rl(LOG_WARNING,
               "[JANITOR] Harita dolulugu kritik (%.1f%%)%s. LRU Eviction baslatiliyor...",
               usage * 100.0,
               urgent ? " [ACIL]" : "");

        /* Evict edilecek kayit sayisi: mevcut kayitlarin %10'u, min 10, max 5000 */
        size_t map_sz  = ipmap_size(&g_ipmap);
        size_t evict_n = map_sz > 100 ? (size_t)((double)map_sz * 0.10) : map_sz;
        if (evict_n < 10)   evict_n = 10;
        if (evict_n > 5000) evict_n = 5000;

        size_t evicted   = ipmap_evict_lru(&g_ipmap, evict_n);
        double new_usage = pool_usage_ratio(&g_pool);

        if (evicted > 0) {
            log_rl(LOG_INFO,
                   "[JANITOR] %zu IP kaydi evict edildi. Yeni doluluk: %.1f%%",
                   evicted, new_usage * 100.0);
        } else {
            log_rl(LOG_WARNING,
                   "[JANITOR] Eviction 0 kayit sildi (tum adaylar korumali). Doluluk: %.1f%%",
                   new_usage * 100.0);
        }

        /* Hala kritik seviyede: bir sonraki donguyu aninda tetikle */
        if (new_usage > POOL_GC_THRESHOLD + 0.05) {
            atomic_store(&g_janitor_evict_needed, 1);
        }
    }
    return NULL;
}

/* ─────────────────────────────────────────────────────────────────────
 * Upload dizini inotify kurulumu ve WebShell tespiti
 * ───────────────────────────────────────────────────────────────────── */

/*
 * spmc_enqueue — Üretici (main thread) bir chunk ekler.
 * Geri baskı: kuyruk doluysa spin-wait (lock-free, mutex yok).
 */
static void spmc_enqueue(const WorkChunk *chunk) {
    uint64_t h = atomic_load_explicit(&g_queue.head, memory_order_relaxed);

    /* Kuyruk doluysa tüketicilerin boşaltmasını bekle */
    while (h - atomic_load_explicit(&g_queue.tail, memory_order_acquire) >= QUEUE_SIZE) {
        _mm_pause();  /* CPU'ya hint: spin-wait döngüsü */
    }

    g_queue.slots[h & QUEUE_MASK] = *chunk;
    /* Release: veriyi tampon yuvasına yazdıktan sonra head'i artır */
    atomic_store_explicit(&g_queue.head, h + 1, memory_order_release);
}

/*
 * worker_loop — Lock-free SPMC: CAS ile tail slot'u alır.
 */
static void *worker_loop(void *arg) {
    (void)arg;
    unsigned int spin_count = 0;

    while (1) {
        uint64_t t = atomic_load_explicit(&g_queue.tail, memory_order_relaxed);
        uint64_t h = atomic_load_explicit(&g_queue.head, memory_order_acquire);

        if (t >= h) {
            /* Kuyruk boş: done flag'ı kontrol et */
            if (atomic_load_explicit(&g_queue.done, memory_order_acquire)) break;
            /* Adaptive spin-wait: önce CPU hint, sonra yield */
            if (++spin_count < 128) { _mm_pause(); }
            else { spin_count = 0; sched_yield(); }
            continue;
        }
        spin_count = 0;

        /* CAS ile bu slot'u sahiplen */
        if (!atomic_compare_exchange_weak_explicit(
                &g_queue.tail, &t, t + 1,
                memory_order_acquire, memory_order_relaxed)) {
            continue;  /* Başka worker aldı, yeniden dene */
        }

        WorkChunk chunk = g_queue.slots[t & QUEUE_MASK];

        const char *p = chunk.start;
        const char *end = chunk.end;
        long lines_processed = 0;
        unsigned int local_insert_ctr = 0;   /* heap throttle sayaci */
        IpRecord *last_heap_rec = NULL;

        while (p < end) {
            if (g_paused && g_running) {
                usleep(50000);
                continue;
            }

            const char *line_start = p;
            p = find_newline_avx2(p, end);
            size_t line_len = (size_t)(p - line_start);
            if (p < end) p++;

            if (line_len == 0) continue;

            LogEntry entry;
            if (parse_log_line(line_start, line_len, &entry) < 0) {
                atomic_fetch_add(&g_atomic_errors, 1);
                continue;
            }
            {
                char ip_chk[IP_STR_LEN];
                size_t ip_n = entry.ip.len;
                if (ip_n >= sizeof(ip_chk)) ip_n = sizeof(ip_chk) - 1;
                memcpy(ip_chk, entry.ip.ptr, ip_n);
                ip_chk[ip_n] = '\0';
                if (!is_valid_ip(ip_chk)) {
                    atomic_fetch_add(&g_atomic_errors, 1);
                    continue;
                }
            }
            atomic_fetch_add(&g_atomic_lines, 1);
            atomic_fetch_add(&g_atomic_bytes, (long)line_len);
            lines_processed++;

            /* HTTP Method sayaclari */
            if      (entry.method.len == 3 && entry.method.ptr[0]=='G') atomic_fetch_add(&g_cnt_get, 1);
            else if (entry.method.len == 4 && entry.method.ptr[0]=='P' && entry.method.ptr[1]=='O') atomic_fetch_add(&g_cnt_post, 1);
            else if (entry.method.len == 3 && entry.method.ptr[0]=='P') atomic_fetch_add(&g_cnt_put, 1);
            else if (entry.method.len == 6) atomic_fetch_add(&g_cnt_delete, 1);
            else    atomic_fetch_add(&g_cnt_other, 1);

            /* HTTP Status dagilimi */
            if      (entry.status >= 200 && entry.status < 300) atomic_fetch_add(&g_cnt_2xx, 1);
            else if (entry.status >= 300 && entry.status < 400) atomic_fetch_add(&g_cnt_3xx, 1);
            else if (entry.status >= 400 && entry.status < 500) atomic_fetch_add(&g_cnt_4xx, 1);
            else if (entry.status >= 500)                        atomic_fetch_add(&g_cnt_5xx, 1);

            IpRecord *rec = ipmap_get_or_create(&g_ipmap, entry.ip);
            if (!rec) continue;

            ipmap_update(rec, &entry);
            fp_trust_observe(rec->ip, &entry);

            if (g_allow_ban && atomic_load(&rec->banned)) {
                time_t until = atomic_load(&rec->ban_until_ts);
                if (until > 0 && entry.ts >= until) {
                    if (unban_ip(rec->ip) == 0) {
                        atomic_store(&rec->banned, 0);
                        atomic_store(&rec->ban_until_ts, 0);
                        if (g_db_enabled) {
                            db_log_ban_event(rec->ip, "UNBAN", "ttl-expired", entry.ts);
                        }
                    }
                }
            }

            /*
             * MinHeap guncelleme - Kilit Cakismasi (Lock Contention) azaltma.
             *
             * heap_try_insert() icinde tek bir pthread_mutex var. 4 worker
             * thread her satirda bu kilide yarissirsa throughput dusar.
             * Cozum: heap'i her satirda degil, her ~1000 satirda bir guncelle.
             * Her thread kendi yerel sayacini tutar; 1000 satirda bir
             * (tipik hizda ~100 ms) heap'e yazar.
             */
            last_heap_rec = rec;
            if (++local_insert_ctr >= 100) {
                heap_try_insert(&g_top10, rec);
                local_insert_ctr = 0;
            }

            if (is_whitelisted_ip(rec->ip)) {
                continue;
            }

            /* Honey-token Trap URL kontrolu: eslesme = aninda kalici ban */
            if (entry.url.ptr && entry.url.len > 0) {
                for (size_t ti = 0; ti < g_trap_url_count; ti++) {
                    size_t tlen = strlen(g_trap_urls[ti]);
                    if (tlen > 0 && entry.url.len >= tlen &&
                        memcmp(entry.url.ptr, g_trap_urls[ti], tlen) == 0) {
                        /* Tuzaga dusuruldu! */
                        if (!atomic_load(&rec->banned)) {
                            atomic_store(&rec->threat_stage, 4); /* FSM_PERSISTENT */
                            if (ban_ip(rec->ip) == 0) {
                                atomic_store(&rec->banned, 1);
                                atomic_store(&rec->ban_until_ts, (time_t)2147483647); /* INT_MAX */
                                atomic_fetch_add(&g_atomic_ban_success, 1);
                                Alert trap_a = {0};
                                trap_a.level = ALERT_CRIT;
                                trap_a.ts    = entry.ts;
                                strncpy(trap_a.ip, rec->ip, IP_STR_LEN - 1);
                                snprintf(trap_a.message, ALERT_MSG_LEN,
                                         "HONEY-TOKEN TRAP! URL: %s — Kalici ban uygulandi.",
                                         g_trap_urls[ti]);
                                if (g_use_tui) tui_push_alert(&g_stats, &trap_a);
                                if (g_db_enabled) {
                                    db_log_alert(&trap_a, rec);
                                    db_log_ban_event(rec->ip, "BAN", "honey-token-trap", entry.ts);
                                }
                                webhook_send_alert(&trap_a);
                                /* Phase 2: Real-time SIEM akışı — Honey-Token trap */
                                siem_forwarder_publish(&trap_a, "honey-token");
                                atomic_fetch_add(&g_atomic_alerts, 1);
                            }
                        }
                        break;
                    }
                }
            }

            Alert alert;
            if (anomaly_check(rec, &entry, &alert)) {
                if (g_db_enabled) db_log_alert(&alert, rec);
                webhook_send_alert(&alert);
                /* JSON formatinda logla (SIEM icin) - HMAC imzali */
                log_alert_json_signed(&alert, "/var/log/linux-log-guardian-alerts.json");
                /* CEF (Common Event Format) formatında logla (ArcSight vb. için) */
                log_alert_cef(&alert, "/var/log/linux-log-guardian-alerts.cef");
                /* Phase 2: Real-time TCP SIEM stream (Logstash/Datadog/Elastic) */
                siem_forwarder_publish(&alert, "anomaly-engine");
                
                if (g_use_tui) {
                    tui_push_alert(&g_stats, &alert);
                } else if (!g_output_json) {
                    fprintf(stderr, "[ALARM %d] %s - %s\n", alert.level, alert.ip, alert.message);
                }
                atomic_fetch_add(&g_atomic_alerts, 1);

                if (alert.level == ALERT_CRIT) {
                    /* DB/RAM stale: unban sonrasi ipset temiz ama rec->banned=1 kalabilir */
                    if (atomic_load(&rec->banned) && !ip_is_blocked(rec->ip))
                        atomic_store(&rec->banned, 0);

                    BanPolicyVerdict pol;
                    int may_ban = ban_policy_should_auto_ban(rec->ip, &alert, &pol);
                    if (!g_allow_ban || !may_ban) {
                        ban_policy_audit(rec->ip, &alert, &pol, 0);
                    }
                    if (g_allow_ban && may_ban &&
                        !atomic_load(&rec->banned)) {
                    pthread_mutex_lock(&g_tui_mutex);
                    if (!atomic_load(&rec->banned)) {
                        atomic_fetch_add(&g_atomic_ban_attempts, 1);
                        int effective_ttl = siem_update(rec, &alert, g_ban_ttl_sec);
                        const char *ban_reason = alert.message[0]
                            ? alert.message : "auto-alert";
                        if (ban_ip_with_reason(rec->ip, ban_reason) == 0) {
                            atomic_fetch_add(&g_atomic_ban_success, 1);
                            time_t now = time(NULL);
                            atomic_store(&rec->banned, 1);
                            if (effective_ttl < 0) {
                                atomic_store(&rec->ban_until_ts, (time_t)2147483647);
                            } else {
                                atomic_store(&rec->ban_until_ts, now + effective_ttl);
                            }
                            if (g_use_tui) {
                                tui_push_ban(&g_stats, rec->ip, now);
                            }
                            send_desktop_notification(rec->ip);
                            /* ban_webhook_dedup_check cift mesaji engeller */
                            webhook_send_ban(rec->ip, now, ban_reason,
                                             pol.risk_score, pol.decision);
                            ban_policy_audit(rec->ip, &alert, &pol, 1);
                            if (g_db_enabled) {
                                db_log_ban_event_ex(rec->ip, "BAN", ban_reason, now,
                                                      pol.risk_score, pol.decision);
                            }
                        } else {
                            atomic_fetch_add(&g_atomic_ban_fail, 1);
                            ban_policy_audit(rec->ip, &alert, &pol, 0);
                            if (!g_output_json) {
                                fprintf(stderr, "\n[BAN] Basarisiz: %s\n", rec->ip);
                            }
                        }
                    }
                    pthread_mutex_unlock(&g_tui_mutex);
                    }
                }
                /* JA3 cluster ban'dan sonra: force_waf #ban webhook onceligi */
                if (entry.user_agent.ptr && entry.user_agent.len > 0) {
                    char fp[72];
                    ja3_cluster_fingerprint_ua(entry.user_agent.ptr,
                                             entry.user_agent.len,
                                             fp, sizeof(fp));
                    if (fp[0])
                        ja3_cluster_track(rec->ip, fp, entry.ts);
                }
            }
        }
        if (last_heap_rec && local_insert_ctr > 0) {
            /* Kisa chunk'larda da Top-10 guncel kalsin. */
            heap_try_insert(&g_top10, last_heap_rec);
        }
        atomic_fetch_add(&g_batch_lines, lines_processed);
    }
    return NULL;
}

static void print_json_report(double elapsed) {
    printf("{\n");
    printf("  \"db_active\": %s,\n", g_db_enabled ? "true" : "false");
    printf("  \"db_path\": \"%s\",\n", g_db_path ? g_db_path : "");
    printf("  \"total_lines\": %ld,\n", atomic_load(&g_atomic_lines));
    printf("  \"parse_errors\": %ld,\n", atomic_load(&g_atomic_errors));
    printf("  \"unique_ips\": %zu,\n", ipmap_size(&g_ipmap));
    printf("  \"alerts_total\": %ld,\n", atomic_load(&g_atomic_alerts));
    printf("  \"ban_attempts\": %ld,\n", atomic_load(&g_atomic_ban_attempts));
    printf("  \"ban_success\": %ld,\n", atomic_load(&g_atomic_ban_success));
    printf("  \"ban_fail\": %ld,\n", atomic_load(&g_atomic_ban_fail));
    printf("  \"elapsed_sec\": %.3f,\n", elapsed);
    if (elapsed > 0)
        printf("  \"eps\": %.1f,\n", (double)atomic_load(&g_atomic_lines) / elapsed);
    else
        printf("  \"eps\": 0.0,\n");
    printf("  \"top_10\": [\n");

    MinHeap tmp = g_top10;
    IpRecord *sorted[HEAP_K] = {NULL};
    heap_sort_desc(&tmp, sorted);

    int first = 1;
    for (int i = 0; i < HEAP_K; i++) {
        IpRecord *rec = sorted[i];
        if (!rec || rec->ip[0] == '\0') break;
        if (!first) printf(",\n");
        printf("    {\n");
        printf("      \"ip\": \"%s\",\n", rec->ip);
        printf("      \"total_requests\": %ld,\n", atomic_load(&rec->cnt.total_requests));
        printf("      \"error_4xx\": %ld,\n", atomic_load(&rec->cnt.error_4xx));
        printf("      \"sqli_hits\": %ld,\n", atomic_load(&rec->cnt.sqli_hits));
        printf("      \"banned\": %s\n",
               atomic_load(&rec->banned) ? "true" : "false");
        printf("    }");
        first = 0;
    }
    printf("\n  ],\n");
    AttackTreeSnapshot lsnap;
    if (attack_tree_snapshot_read(&lsnap, ATREE_RISK_THRESHOLD_ALERT) == 0) {
        printf("  \"lineage\": {\n");
        printf("    \"active_trees\": %lu,\n", (unsigned long)lsnap.active_trees);
        printf("    \"high_risk_trees\": %lu,\n", (unsigned long)lsnap.high_risk_trees);
        printf("    \"total_events\": %lu,\n", (unsigned long)lsnap.total_events);
        printf("    \"max_risk\": %.1f,\n", lsnap.max_risk);
        printf("    \"top_comm\": \"%s\",\n", lsnap.top_comm);
        printf("    \"top_pid\": %d\n", (int)lsnap.top_pid);
        printf("  }\n");
    } else {
        printf("  \"lineage\": null\n");
    }
    printf("}\n");
    fflush(stdout);
}

#include <seccomp.h>

/* setup_seccomp moved to auth.c */
    /* Whitelist essential syscalls */

int main(int argc, char *argv[]) {
    log_rl_init();

    /* Tum alt komutlar icin gecerli bayraklar (log analiz dongusunden once) */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--rules") == 0 && i + 1 < argc)
            g_rules_path = argv[++i];
        else if (strcmp(argv[i], "--db") == 0 && i + 1 < argc) {
            size_t n = strlen(argv[++i]);
            if (n >= sizeof(g_db_path_buf)) n = sizeof(g_db_path_buf) - 1;
            memcpy(g_db_path_buf, argv[i], n);
            g_db_path_buf[n] = '\0';
            g_db_path = g_db_path_buf;
            g_db_path_cli = 1;
        }
        else if (strcmp(argv[i], "--no-ban") == 0) {
            g_allow_ban = 0;
            g_ban_cli_off = 1;
        }
        else if (strcmp(argv[i], "--quiet") == 0 || strcmp(argv[i], "-q") == 0)
            g_operator_quiet = 1;
    }

    if (argc >= 2 && is_operator_cli(argc, argv)) {
        int oi = operator_cmd_index(argc, argv);
        const char *op = argv[oi];
        if (strcmp(op, "--health") == 0)
            return cmd_health_check();
        if (strcmp(op, "--status") == 0)
            return cmd_status_dump();
        if (strcmp(op, "ban-db-prune") == 0)
            return cmd_ban_db_prune(argc, argv);
        if (strcmp(op, "webhook-test") == 0)
            return cmd_webhook_test(argc, argv);
        if (strcmp(op, "webhook-metrics-reset") == 0)
            return cmd_webhook_metrics_reset(argc, argv);
        if (strcmp(op, "daily-summary") == 0)
            return cmd_daily_summary(argc, argv);
        if (strcmp(op, "weekly-summary") == 0)
            return cmd_weekly_summary(argc, argv);
        if (oi + 1 < argc && strcmp(op, "ban") == 0)
            return cmd_operator_ban(argc, argv);
        if (oi + 1 < argc && strcmp(op, "unban") == 0)
            return cmd_operator_unban(argc, argv);
        if (strcmp(op, "crs-stats") == 0)
            return cmd_crs_stats();
        if (strcmp(op, "lineage-stats") == 0)
            return cmd_lineage_stats(argc, argv);
        if (strcmp(op, "incident-sim") == 0)
            return cmd_incident_sim();
        if (strcmp(op, "schema-check") == 0)
            return cmd_schema_check(argc, argv);
        if (strcmp(op, "threat-feed-sync") == 0)
            return cmd_threat_feed_sync();
    }

    const char *env_hmac = getenv("LOGANALYZER_HMAC_KEY");
    if (env_hmac && strlen(env_hmac) >= 16) {
        log_set_hmac_key((const unsigned char *)env_hmac, strlen(env_hmac));
    } else {
        char default_key[32];
        snprintf(default_key, sizeof(default_key), "log-guardian-hmac-%d-%ld",
                 getpid(), time(NULL));
        log_set_hmac_key((const unsigned char *)default_key, strlen(default_key));
    }

    deception_init();
    apt_graph_init();
    incident_engine_init();
    covert_ch_init();
    ipc_auth_load_env_file("/etc/log-guardian/env");
    ipc_auth_init();

    {
        const char *skip_ipc = getenv("LOG_GUARDIAN_SKIP_IPC");
        if (!skip_ipc || strcmp(skip_ipc, "1") != 0) {
            int global_ipc = daemon_ipc_connect();
            if (global_ipc >= 0) {
                g_ipc_fd = global_ipc;
                anomaly_set_ipc_fd(global_ipc);
            }
        }
    }

    void *libsystemd = dlopen("libsystemd.so.0", RTLD_NOW | RTLD_NODELETE);
    if (libsystemd) {
        union { void *p; int (*fn)(int, const char *); } u;
        u.p = dlsym(libsystemd, "sd_notify");
        sd_notify_ptr = u.fn;
    }

    if (argc < 2) {
        usage(argv[0]);
        return 1;
    }

    const char *log_path = NULL;
    size_t pool_mb = 512;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--no-tui") == 0)   g_use_tui   = 0;
        else if (strcmp(argv[i], "--no-ban")     == 0) { g_allow_ban = 0; g_ban_cli_off = 1; }
        else if (strcmp(argv[i], "--no-webhook") == 0) {
            g_webhook.enabled = 0;
            g_webhook_cli_off = 1;
        }
        else if (strcmp(argv[i], "--json") == 0) {
            g_output_json = 1;
            g_use_tui = 0; /* JSON ciktisi: no-tui */
        }
        else if (strcmp(argv[i], "-f") == 0 || strcmp(argv[i], "--follow") == 0) g_follow = 1;
        else if (strcmp(argv[i], "--pool-mb") == 0 && i + 1 < argc) {
            pool_mb = (size_t)atol(argv[++i]);
        }
        else if (strcmp(argv[i], "--drop-privs") == 0) {
            g_drop_privs = 1;
        }
        else if (strcmp(argv[i], "--xdp") == 0 && i + 1 < argc) {
            g_xdp_iface = argv[++i];
        }
        else if (strcmp(argv[i], "--rules") == 0 && i + 1 < argc) {
            g_rules_path = argv[++i];
        }
        else if (strcmp(argv[i], "--password-file") == 0 && i + 1 < argc) {
            size_t n = strlen(argv[++i]);
            if (n >= sizeof(g_password_file_path)) n = sizeof(g_password_file_path) - 1;
            memcpy(g_password_file_path, argv[i], n);
            g_password_file_path[n] = '\0';
        }
        else if (strcmp(argv[i], "--password") == 0) {
            fprintf(stderr,
                    "[ERISIM] --password guvenlik nedeniyle devre disi. "
                    "--password-file veya LOGANALYZER_PASSWORD kullanin.\n");
            return 1;
        }
        else if (strcmp(argv[i], "--ban-cidr") == 0 && i + 1 < argc) {
            const char *ip_cidr = argv[++i];
            int map_fd = bpf_obj_get("/sys/fs/bpf/loganalyzer/xdp_blacklist_v4");
            if (map_fd < 0) {
                fprintf(stderr, "[ERR] Harita bulunamadi. Daemon calisiyor mu?\n");
                return 1;
            }
            
            char ip_buf[64];
            strncpy(ip_buf, ip_cidr, sizeof(ip_buf) - 1);
            ip_buf[sizeof(ip_buf)-1] = '\0';
            
            uint32_t prefix = 32;
            char *slash = strchr(ip_buf, '/');
            if (slash) {
                *slash = '\0';
                prefix = (uint32_t)atoi(slash + 1);
                if (prefix > 32) prefix = 32;
            }

            struct in_addr addr;
            if (inet_pton(AF_INET, ip_buf, &addr) != 1) {
                fprintf(stderr, "[ERR] Gecersiz IP formati: %s\n", ip_buf);
                return 1;
            }
            
            struct {
                uint32_t prefixlen;
                uint32_t ipv4_addr;
            } key = { prefix, addr.s_addr };
            
            uint8_t val = 1;
            if (bpf_map_update_elem(map_fd, &key, &val, BPF_ANY) == 0) {
                printf("[OK] BPF Haritasi guncellendi: %s/%u\n", ip_buf, prefix);
                return 0;
            } else {
                fprintf(stderr, "[ERR] BPF guncelleme basarisiz!\n");
                return 1;
            }
        }
        else if (strcmp(argv[i], "--db") == 0 && i + 1 < argc) {
            size_t n = strlen(argv[++i]);
            if (n >= sizeof(g_db_path_buf)) n = sizeof(g_db_path_buf) - 1;
            memcpy(g_db_path_buf, argv[i], n);
            g_db_path_buf[n] = '\0';
            g_db_path = g_db_path_buf;
            g_db_path_cli = 1;
            g_db_enabled = 1;
        }
        else if (strcmp(argv[i], "--no-db") == 0) {
            g_db_enabled = 0;
            g_db_cli_off = 1;
        }
        else if (strcmp(argv[i], "--ban-ttl-sec") == 0 && i + 1 < argc) {
            g_ban_ttl_sec = atoi(argv[++i]);
        }
        else if (strcmp(argv[i], "-t") == 0 && i + 1 < argc) {
            g_num_workers = atoi(argv[++i]);
        }
        else {
            log_path = argv[i];
        }
    }

    if (!log_path) {
        fprintf(stderr, "[HATA] Log dosyasi belirtilmedi.\n");
        usage(argv[0]);
        return 1;
    }

    if (!g_rules_path) g_rules_path = "rules.conf";
    rules_fleet_set_rules_path(g_rules_path);
    geoip_feed_set_rules_path(g_rules_path);
    if (access(g_rules_path, F_OK) == 0) {
        if (is_secure_file(g_rules_path, 0) != 0) {
            fprintf(stderr, "[ERISIM] Guvensiz rules dosya izinleri: %s\n", g_rules_path);
            return 1;
        }
        operator_load_webhook_env();
        operator_load_threat_feed_env();
        load_rules_file(g_rules_path);
        pcre_engine_set_quiet(g_output_json);
        pcre_engine_init(g_rules_path);
        if (g_crs_enabled && g_crs_rules_path[0]) {
            resolve_path_from_rules(g_rules_path, g_crs_rules_path,
                                    sizeof(g_crs_rules_path));
            if (access(g_crs_rules_path, F_OK) == 0)
                pcre_engine_load_crs(g_crs_rules_path);
            else if (!g_output_json)
                fprintf(stderr,
                        "[CRS] %s yok — scripts/import_crs.py veya rules/crs-core.rules\n",
                        g_crs_rules_path);
        }
        if (g_falco_host_rules_path[0]) {
            resolve_path_from_rules(g_rules_path, g_falco_host_rules_path,
                                    sizeof(g_falco_host_rules_path));
            int nf = falco_host_rules_load_file(g_falco_host_rules_path);
            if (nf > 0 && !g_output_json)
                fprintf(stderr, "[FALCO] %d host rule yuklendi: %s\n",
                        nf, g_falco_host_rules_path);
        }
        ban_pipeline_set_whitelist_fn(whitelist_check_cb);
        anomaly_set_whitelist_fn(whitelist_check_cb);
        if (g_openapi_schema_path[0]) {
            resolve_path_from_rules(g_rules_path, g_openapi_schema_path,
                                    sizeof(g_openapi_schema_path));
            if (access(g_openapi_schema_path, R_OK) == 0) {
                if (schema_load(g_openapi_schema_path) == 0 && !g_output_json)
                    fprintf(stderr, "[SCHEMA] OpenAPI yuklendi: %s\n",
                            g_openapi_schema_path);
            } else if (!g_output_json) {
                fprintf(stderr, "[SCHEMA] Dosya okunamadi: %s\n",
                        g_openapi_schema_path);
            }
        }
        if (g_wasm_enabled) {
            resolve_path_from_rules(g_rules_path, g_wasm_plugin_dir,
                                    sizeof(g_wasm_plugin_dir));
            wasm_runtime_set_plugin_dir(g_wasm_plugin_dir);
            if (wasm_runtime_init() == 0 && !g_output_json)
                fprintf(stderr, "[WASM] Plugin dizini: %s\n", g_wasm_plugin_dir);
        }
    } else if (!g_output_json) {
        fprintf(stderr, "[RULES] Dosya bulunamadi: %s (varsayilan esikler kullanilacak)\n",
                g_rules_path);
    }
    ensure_default_trap_files();

    /* CLI bayraklari rules.conf'tan sonra da gecerli kalsin */
    if (g_db_cli_off)  g_db_enabled = 0;
    else if (g_db_path_cli) g_db_enabled = 1;  /* --db, test_rules DB_ENABLED=0 olsa bile */
    if (g_ban_cli_off) g_allow_ban = 0;
    if (g_webhook_cli_off) g_webhook.enabled = 0;

    if (enforce_startup_auth() != 0) {
        return 1;
    }

    if (g_db_enabled) {
        if (db_init(g_db_path) < 0) {
            fprintf(stderr, "[DB] Veritabani baslatilamadi, db devre disi.\n");
            g_db_enabled = 0;
        } else {
            fprintf(stderr, "[DB] Aktif: %s\n", g_db_path);
        }
    }


    signal(SIGINT,   handle_sigint);
    signal(SIGTERM,  handle_sigint);
    signal(SIGWINCH, handle_sigwinch);

    struct sigaction sa_hup = {0};
    sa_hup.sa_handler = handle_sighup;
    sigaction(SIGHUP, &sa_hup, NULL);

    /* Olumcul sinyallerde terminal temizleme (SA_RESETHAND = tek seferlik) */
    struct sigaction sa_fatal = {0};
    sa_fatal.sa_handler = handle_fatal;
    sa_fatal.sa_flags   = (int)SA_RESETHAND;
    sigaction(SIGSEGV, &sa_fatal, NULL);
    sigaction(SIGBUS,  &sa_fatal, NULL);
    sigaction(SIGABRT, &sa_fatal, NULL);

    /* Normal cikislarda da terminali temizle */
    atexit(atexit_cleanup);

    telegram_bot_set_ops_status(lg_telegram_ops_status);
    telegram_bot_set_ack_db_path(g_db_path);
    telegram_bot_set_ack_hook(lg_telegram_ack);
    telegram_bot_set_inline_hook(lg_telegram_inline);
    telegram_bot_set_last_hook(lg_telegram_last);
    telegram_bot_set_unacked_hook(lg_telegram_unacked);
    telegram_bot_set_incident_hook(lg_telegram_incident);
    webhook_init();
    telegram_bot_start();

    if (g_allow_ban) {
        if (g_xdp_iface) {
            if (xdp_loader_init("xdp_filter.o", g_xdp_iface,
                                g_xdp_map_v4_sz, g_xdp_map_v6_sz) == 0) {
                /* Boot-sync: veritabanindaki banlari kernel XDP map'ine yukle */
                if (g_db_enabled) db_sync_xdp_bans();
                
#ifdef HAVE_LIBBPF
                int rb_fd = xdp_loader_get_ringbuf_fd();
                if (rb_fd >= 0) {
                    g_ringbuf = ring_buffer__new(rb_fd, handle_xdp_packet, NULL, NULL);
                    if (!g_ringbuf) {
                        fprintf(stderr, "[XDP] BPF Ring Buffer userspace'te baslatilamadi.\n");
                    } else if (!g_output_json) {
                        fprintf(stderr, "[XDP] DPI Ring Buffer dinleniyor...\n");
                    }
                }
#endif
            } else {
                fprintf(stderr, "[XDP] Devre disi kaldi, iptables/ipset kullanilacak.\n");
            }
        }
        /* ipset hazirligi root/daemon — log-guardian kullanicisi destroy edemez/edememeli */
        if (geteuid() == 0)
            ensure_ipset_ready();
    }
    maybe_drop_privileges();
    /* Ban acikken seccomp uygulanmaz: fork+execve(/sbin/ipset) child filtre miras alir.
     * Wasm aktifken de atla: Wasmtime JIT ek syscall (memfd/mremap) kullanir. */
    if (!g_output_json && !g_allow_ban && !g_wasm_enabled) {
        setup_seccomp();
    } else if (!g_output_json && !g_allow_ban && g_wasm_enabled) {
        fprintf(stderr, "[SECCOMP] wasm aktif — Wasmtime JIT icin profil atlandi.\n");
    } else if (!g_output_json && g_allow_ban) {
        fprintf(stderr, "[SECCOMP] ban aktif — ipset/ipc icin profil atlandi.\n");
    }

    /* Native Threat Intelligence Feed — AbuseIPDB veya benzeri feed'den IoC çek */
    ja3_cluster_init();
    threat_feed_init();
    falco_host_rules_init();
    endpoint_baseline_init();
    geoip_feed_init();

    /* Prometheus /metrics endpoint */
    if (g_metrics_port > 0 && !g_output_json) {
        metrics_server_start(g_metrics_port);
        {
            FpTrustStats fpts;
            fp_trust_get_stats(&fpts);
            metrics_refresh_fp_trust((long)fpts.trusted_ips, (long)fpts.partial_ips,
                                     fpts.enabled ? 1L : 0L,
                                     (long)fpts.suppressed_total);
        }
    }

    if (!g_output_json) fprintf(stderr, "[BASLAT] Bellek havuzu: %zu MB rezerve ediliyor...\n", pool_mb);
    if (pool_init(&g_pool, pool_mb * 1024 * 1024) < 0) {
        fprintf(stderr, "[HATA] Bellek havuzu baslatilamadi.\n");
        return 1;
    }

    if (ipmap_init(&g_ipmap) < 0) {
        fprintf(stderr, "[HATA] IP haritasi baslatilamadi.\n");
        pool_destroy(&g_pool);
        return 1;
    }
    
    if (g_db_enabled) {
        db_load_previous_bans(&g_ipmap);
    }
    heap_init(&g_top10);
    memset(&g_stats, 0, sizeof(g_stats));

    if (!g_output_json) fprintf(stderr, "[BASLAT] Log dosyasi aciliyor: %s\n", log_path);
    MmapFile mf;
    if (mmap_open(log_path, &mf) < 0) {
        pool_destroy(&g_pool);
        return 1;
    }

    if (g_use_tui) {
        tui_init();
        setup_raw_kbd();
    }

    /* REST API ve Fleet sync yalnizca interaktif/TUI modunda */
    if (!g_output_json) {
        setenv("GUARDIAN_API_BIND", g_api_bind, 1);
        if (g_api_token[0])
            setenv("GUARDIAN_API_TOKEN", g_api_token, 1);
        else
            unsetenv("GUARDIAN_API_TOKEN");
        api_server_start((uint16_t)g_api_port);
        if (telegram_bot_webhook_mode())
            (void)telegram_bot_register_webhook();
        agent_sync_init();
    }
    
    if (g_siem_config.enabled && g_siem_config.host[0] != '\0') {
        apply_siem_env_overrides();
        siem_forwarder_init();
    }

    /* Etcd mesh — production (MESH_BACKEND=etcd); ZMQ devre disi */
    if (mesh_backend_use_etcd() && g_mesh_etcd_endpoints[0] != '\0') {
        static EtcdMeshConfig etcd_cfg;
        memset(&etcd_cfg, 0, sizeof(etcd_cfg));
        strncpy(etcd_cfg.endpoints, g_mesh_etcd_endpoints,
                sizeof(etcd_cfg.endpoints) - 1);
        strncpy(etcd_cfg.tenant_id, g_tenant_id,
                sizeof(etcd_cfg.tenant_id) - 1);
        etcd_cfg.ttl_sec          = g_ban_ttl_sec;
        etcd_cfg.mode             = 0;  /* pub + watch */
        etcd_cfg.min_threat_score = 10; /* Dusuk skorlu olayları yayinlama */
        if (etcd_mesh_init(&etcd_cfg) == 0) {
            log_rl(LOG_INFO,
                   "[ETCD_MESH] Etcd Mesh aktif: %s (tenant=%s)",
                   g_mesh_etcd_endpoints, g_tenant_id);
        } else {
            log_rl(LOG_WARNING,
                   "[ETCD_MESH] Etcd Mesh baslatilamadi (endpoint/HAVE_ETCD).");
        }
    }

    /* Lock-free SPMC kuyruk başlat */
    atomic_store(&g_queue.head, 0);
    atomic_store(&g_queue.tail, 0);
    atomic_store(&g_queue.done, 0);

    g_workers = malloc((size_t)g_num_workers * sizeof(pthread_t));
    for (int i = 0; i < g_num_workers; i++) {
        pthread_create(&g_workers[i], NULL, worker_loop, NULL);
    }

    log_rl(LOG_INFO, "[BASLAT] %d parser thread calisiyor.", g_num_workers);

    if (sd_notify_ptr)
        sd_notify_ptr(0, "READY=1");

    /* GC thread başlat */
    if (pthread_create(&g_gc_thread, NULL, pool_gc_thread, NULL) == 0) {
        g_gc_thread_started = 1;
    }

    /* WebShell inotify — batch/JSON modunda atla */
    if (!g_output_json)
        setup_upload_watcher();

    /* io_uring init for event loop multiplexing */
    struct io_uring ring;
    int uring_active = 0;
    if (io_uring_queue_init(32, &ring, 0) == 0) {
        uring_active = 1;
        log_rl(LOG_INFO, "[IO_URING] Asenkron I/O multiplexer aktif.");
    } else {
        log_rl(LOG_WARNING, "[IO_URING] Baslatilamadi, select() fallback kullanilacak.");
    }

    int poll_inotify_armed = 0;
    int poll_trap_armed = 0;
    int poll_tui_armed = 0;

    /* inotify setup for tail -f */
    int inotify_fd = -1;
    int watch_fd = -1;
    int trap_inotify_fd = -1;
    if (!g_output_json) {
        trap_inotify_fd = inotify_init1(IN_NONBLOCK);
        if (trap_inotify_fd >= 0) {
            setup_trap_watchers(trap_inotify_fd);
        } else {
            fprintf(stderr, "[TRAP] inotify baslatilamadi.\n");
        }
    }
    if (g_follow) {
        inotify_fd = inotify_init1(IN_NONBLOCK);
        if (inotify_fd >= 0) {
            /*
             * Log Rotation (TOCTOU) korumasi:
             *   logrotate gece dosyayi yeniden adlandirir (IN_MOVED_FROM)
             *   ve yerine bos bir tane acar (IN_CREATE). Sadece IN_MODIFY
             *   dinlersek yeni dosyayi kacirip sessizce korlesiriz.
             *   IN_MOVED_FROM | IN_CREATE eventleri gelince eski mmap'i
             *   kapatip yeni dosyayi hot-swap ile baslatiriz.
             */
            watch_fd = inotify_add_watch(inotify_fd, log_path,
                                         IN_MODIFY | IN_MOVED_FROM | IN_CREATE);
        }
    }
    struct timeval t_last_draw, t_batch_start;
    gettimeofday(&t_start, NULL);
    t_last_draw = t_start;
    t_batch_start = t_start;

    const char *p = mf.data;
    size_t processed_bytes = 0;
    if (g_follow && mf.data && mf.size > 0) {
        p = mf.data + mf.size;
        processed_bytes = mf.size;
        log_rl(LOG_INFO, "[FOLLOW] Log sonundan baslaniyor (%zu byte atlandi).",
               mf.size);
    }

    while (g_running) {
        if (g_sighup_pending) {
            g_sighup_pending = 0;
            if (g_rules_path && access(g_rules_path, F_OK) == 0) {
                ja3_clear_custom_sigs();
                operator_load_webhook_env();
                load_rules_file(g_rules_path);
                pcre_engine_reload(g_rules_path);
                if (g_openapi_schema_path[0]) {
                    char sp[512];
                    strncpy(sp, g_openapi_schema_path, sizeof(sp) - 1);
                    resolve_path_from_rules(g_rules_path, sp, sizeof(sp));
                    if (access(sp, R_OK) == 0)
                        schema_load(sp);
                }
                wasm_runtime_scan_plugins();
            }
        }

        if (trap_inotify_fd >= 0)
            process_trap_events(trap_inotify_fd);
        if (!g_output_json)
            process_upload_events();
#ifdef HAVE_LIBBPF
        if (g_ringbuf) ring_buffer__poll(g_ringbuf, 0);
#endif
        if (g_paused) {
            usleep(50000);
            if (g_use_tui) process_keyboard();
            continue;
        }

        if (mf.data == NULL || processed_bytes >= mf.size) {
            if (!g_follow) break;
            
            struct stat st;
            if (fstat(mf.fd, &st) == 0 && (size_t)st.st_size > mf.size) {
                size_t new_size = (size_t)st.st_size;

                /*
                 * DoS korumasi: Disk doluysa veya saldirgan milyarlarca
                 * byte log yazarsa mremap sirasinda bellek tukenip SIGSEGV
                 * alinabilir. Yeni boyutu pool kapasitesinin 2 katiyla
                 * sinirlandiriyoruz; makul bir ust limit.
                 */
                const size_t MAX_MMAP_SIZE = g_pool.capacity * 2;
                if (new_size > MAX_MMAP_SIZE) {
                    if (!g_output_json)
                        fprintf(stderr,
                            "[UYARI] Log dosyasi cok buyudu "
                            "(%zu MB > limit %zu MB). "
                            "Yeni veriler islenmeyecek.\n",
                            new_size / (1024*1024),
                            MAX_MMAP_SIZE / (1024*1024));
                    /* follow modunda sonraki guncellemeye kadar bekle */
                    usleep(500000);
                } else {
                    void *new_data;
                    if (mf.data == NULL) {
                        new_data = mmap(NULL, new_size, PROT_READ, MAP_PRIVATE, mf.fd, 0);
                    } else {
                        new_data = mremap((void*)mf.data, mf.size, new_size, MREMAP_MAYMOVE);
                    }
                    if (new_data != MAP_FAILED) {
                        mf.data = new_data;
                        mf.size = new_size;
                        p = mf.data + processed_bytes;
                    } else {
                        perror("[HATA] mremap");
                    }
                }
            } else if (inotify_fd >= 0 || trap_inotify_fd >= 0) {
                int has_inotify = 0, has_trap = 0, has_tui = 0;

                if (uring_active) {
                    if (inotify_fd >= 0 && !poll_inotify_armed) {
                        struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                        io_uring_prep_poll_add(sqe, inotify_fd, POLLIN);
                        io_uring_sqe_set_data(sqe, (void*)1);
                        poll_inotify_armed = 1;
                    }
                    if (trap_inotify_fd >= 0 && !poll_trap_armed) {
                        struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                        io_uring_prep_poll_add(sqe, trap_inotify_fd, POLLIN);
                        io_uring_sqe_set_data(sqe, (void*)2);
                        poll_trap_armed = 1;
                    }
                    if (g_use_tui && !poll_tui_armed) {
                        struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                        io_uring_prep_poll_add(sqe, STDIN_FILENO, POLLIN);
                        io_uring_sqe_set_data(sqe, (void*)3);
                        poll_tui_armed = 1;
                    }

                    io_uring_submit(&ring);

                    struct __kernel_timespec ts = { .tv_sec = 0, .tv_nsec = 100000000 }; /* 100ms */
                    struct io_uring_cqe *cqe = NULL;
                    int ret = io_uring_wait_cqe_timeout(&ring, &cqe, &ts);

                    if (ret == 0 || ret == -ETIME) {
                        unsigned head;
                        int count = 0;
                        io_uring_for_each_cqe(&ring, head, cqe) {
                            long type = (long)io_uring_cqe_get_data(cqe);
                            if (cqe->res >= 0) {
                                if (type == 1) { has_inotify = 1; poll_inotify_armed = 0; }
                                else if (type == 2) { has_trap = 1; poll_trap_armed = 0; }
                                else if (type == 3) { has_tui = 1; poll_tui_armed = 0; }
                            }
                            count++;
                        }
                        io_uring_cq_advance(&ring, (unsigned)count);
                    }
                } else {
                    /* Fallback: select() */
                    struct timeval tv = {0, 100000};
                    fd_set rfds;
                    FD_ZERO(&rfds);
                    if (inotify_fd >= 0) FD_SET(inotify_fd, &rfds);
                    if (trap_inotify_fd >= 0) FD_SET(trap_inotify_fd, &rfds);
                    if (g_use_tui) FD_SET(STDIN_FILENO, &rfds);
                    
                    int max_fd = STDIN_FILENO;
                    if (inotify_fd > max_fd) max_fd = inotify_fd;
                    if (trap_inotify_fd > max_fd) max_fd = trap_inotify_fd;
                    select(max_fd + 1, &rfds, NULL, NULL, &tv);

                    if (g_use_tui && FD_ISSET(STDIN_FILENO, &rfds)) has_tui = 1;
                    if (inotify_fd >= 0 && FD_ISSET(inotify_fd, &rfds)) has_inotify = 1;
                    if (trap_inotify_fd >= 0 && FD_ISSET(trap_inotify_fd, &rfds)) has_trap = 1;
                }

                if (has_tui) {
                    process_keyboard();
                }

                if (has_inotify) {
                    char ibuf[4096] __attribute__((aligned(__alignof__(struct inotify_event))));
                    ssize_t ibytes = read(inotify_fd, ibuf, sizeof(ibuf));
                    if (ibytes > 0) {
                        const struct inotify_event *iev;
                        for (char *bp = ibuf; bp < ibuf + ibytes;
                             bp += sizeof(struct inotify_event) + iev->len) {
                            iev = (const struct inotify_event *)bp;

                            /*
                             * Log Rotation hot-swap:
                             * logrotate dosyayi tasiyip (IN_MOVED_FROM) yeni
                             * bir tane actiginda (IN_CREATE) eski mmap'i
                             * munmap edip yeni dosyayi yeniden baslatiriz.
                             */
                            if (iev->mask & (IN_MOVED_FROM | IN_CREATE)) {
                                if (!g_output_json)
                                    fprintf(stderr,
                                        "\n[IZLE] Log rotation tespit edildi, "
                                        "dosya yeniden baglaniyor: %s\n",
                                        log_path);

                                /* Eski eslemeyi kapat */
                                mmap_close(&mf);

                                /* Yeni dosyayi ac */
                                if (mmap_open(log_path, &mf) == 0) {
                                    p = mf.data;
                                    processed_bytes = 0;
                                    /* Watch'i guncelle */
                                    if (watch_fd >= 0)
                                        inotify_rm_watch(inotify_fd, watch_fd);
                                    watch_fd = inotify_add_watch(
                                        inotify_fd, log_path,
                                        IN_MODIFY | IN_MOVED_FROM | IN_CREATE);
                                } else {
                                    /* Yeni dosya henuz olusmamis, biraz bekle */
                                    usleep(200000);
                                }
                            }
                        }
                    }
                }
                if (has_trap) {
                    process_trap_events(trap_inotify_fd);
                }
            } else {
                usleep(100000);
            }
        }

        if (mf.data != NULL) {
            const char *end = mf.data + mf.size;
            while (p < end) {
                const char *chunk_end = p + CHUNK_SIZE;
                if (chunk_end > end) chunk_end = end;

                if (chunk_end < end) {
                    while (chunk_end < end && *chunk_end != '\n') chunk_end++;
                    if (chunk_end < end) chunk_end++;
                }

                if (p == chunk_end) break;

                /* Lock-free enqueue — geri baskı spin içinde */
                WorkChunk wc = { .start = p, .end = chunk_end };
                spmc_enqueue(&wc);

                p = chunk_end;
                processed_bytes = (size_t)(p - mf.data);
            }
        }

        gettimeofday(&t_now, NULL);
        double draw_elapsed = elapsed_sec(&t_last_draw, &t_now);

        if (draw_elapsed >= 0.1) {
            double batch_elapsed = elapsed_sec(&t_batch_start, &t_now);
            long blines = atomic_exchange(&g_batch_lines, 0);
            if (batch_elapsed > 0)
                g_stats.eps = (double)blines / batch_elapsed;

            if (g_stats.eps_hist_idx < EPS_HISTORY_LEN) {
                g_stats.eps_history[g_stats.eps_hist_idx++] = g_stats.eps;
            } else {
                memmove(&g_stats.eps_history[0], &g_stats.eps_history[1],
                        (EPS_HISTORY_LEN - 1) * sizeof(double));
                g_stats.eps_history[EPS_HISTORY_LEN - 1] = g_stats.eps;
            }

            g_stats.unique_ips   = ipmap_size(&g_ipmap);
            /* Atomic sayaclari TuiStats'a kopyala (mutex altinda) */
            g_stats.total_lines  = atomic_load(&g_atomic_lines);
            g_stats.parse_errors = atomic_load(&g_atomic_errors);
            g_stats.total_bytes  = atomic_load(&g_atomic_bytes);
            g_stats.alerts_total = atomic_load(&g_atomic_alerts);
            g_stats.ban_attempts = atomic_load(&g_atomic_ban_attempts);
            g_stats.ban_success  = atomic_load(&g_atomic_ban_success);
            g_stats.ban_fail     = atomic_load(&g_atomic_ban_fail);
            g_stats.cnt_get      = atomic_load(&g_cnt_get);
            g_stats.cnt_post     = atomic_load(&g_cnt_post);
            g_stats.cnt_put      = atomic_load(&g_cnt_put);
            g_stats.cnt_delete   = atomic_load(&g_cnt_delete);
            g_stats.cnt_other    = atomic_load(&g_cnt_other);
            g_stats.cnt_2xx      = atomic_load(&g_cnt_2xx);
            g_stats.cnt_3xx      = atomic_load(&g_cnt_3xx);
            g_stats.cnt_4xx      = atomic_load(&g_cnt_4xx);
            g_stats.cnt_5xx      = atomic_load(&g_cnt_5xx);

            /* Intelligence Stats */
            anomaly_intel_stats(&g_stats.ja3_total, &g_stats.ja3_c2,
                                &g_stats.apt_clusters, &g_stats.apt_detections,
                                &g_stats.covert_hits, &g_stats.honey_traps);

            {
                MeshStats ms = {0};
                mesh_intel_get_stats(&ms);
                g_stats.mesh_pub_sent    = ms.pub_sent;
                g_stats.mesh_sub_recv    = ms.sub_received;
                g_stats.mesh_sub_applied = ms.sub_applied;
                g_stats.mesh_peers       = ms.connected_peers;
#ifdef HAVE_ETCD
                if (etcd_mesh_active()) {
                    EtcdMeshStats es = {0};
                    etcd_mesh_get_stats(&es);
                    g_stats.mesh_pub_sent    += es.pub_sent;
                    g_stats.mesh_sub_recv    += es.watch_recv;
                    g_stats.mesh_sub_applied += es.watch_applied;
                }
#endif
            }
            tarpit_server_get_stats(&g_stats.tarpit_active_conns,
                                    &g_stats.tarpit_total_trapped,
                                    &g_stats.tarpit_bytes_sent);
            {
                static uint64_t last_rce_det = 0, last_lin_ev = 0, last_lin_conn = 0;
                DaemonStatsSnapshot ds;
                if (daemon_stats_read(&ds) == 0) {
                    if (ds.rce_detections > last_rce_det) {
                        incident_engine_note_host_signal(INC_SIG_EBPF_EXECVE);
                        last_rce_det = ds.rce_detections;
                    }
                    if (ds.lineage_events > last_lin_ev) {
                        incident_engine_note_host_signal(INC_SIG_EBPF_LINEAGE);
                        last_lin_ev = ds.lineage_events;
                    }
                    if (ds.lineage_connects > last_lin_conn) {
                        incident_engine_note_host_signal(INC_SIG_EBPF_OUTBOUND);
                        last_lin_conn = ds.lineage_connects;
                    }
                }
            }
            daemon_stats_apply_tui(&g_stats);
            attack_tree_snapshot_apply_tui(&g_stats, ATREE_RISK_THRESHOLD_ALERT);
            if (g_lineage_auto_alert && g_stats.lineage_max_risk >= ATREE_RISK_THRESHOLD_BLOCK
                && !g_output_json) {
                static time_t last_lin_alert = 0;
                time_t now_lin = time(NULL);
                if (now_lin - last_lin_alert >= 30) {
                    Alert la = {0};
                    la.level = ALERT_CRIT;
                    la.ts    = now_lin;
                    const char *corr = incident_engine_best_ip();
                    if (corr)
                        strncpy(la.ip, corr, IP_STR_LEN - 1);
                    else
                        strncpy(la.ip, "lineage", IP_STR_LEN - 1);
                    snprintf(la.message, ALERT_MSG_LEN,
                             "Attack tree risk %.0f PID %d comm=%.16s",
                             g_stats.lineage_max_risk,
                             (int)g_stats.lineage_top_pid,
                             g_stats.lineage_top_comm[0] ? g_stats.lineage_top_comm : "?");
                    incident_engine_note_signal(la.ip, INC_SIG_EBPF_LINEAGE);
                    incident_engine_attach_alert(&la, la.ip);
                    if (g_use_tui) tui_push_alert(&g_stats, &la);
                    if (g_db_enabled) {
                        IpRecord *prec = ipmap_get_or_create(&g_ipmap,
                            (StrView){ la.ip, strlen(la.ip) });
                        if (prec) db_log_alert(&la, prec);
                    }
                    last_lin_alert = now_lin;
                }
            }

            uint64_t ring_drops = 0;
            xdp_loader_get_stats(5, &ring_drops); /* STAT_RINGBUF_DROP = 5 */
            g_stats.ringbuf_drops = (long)ring_drops;

            /* Prometheus metriklerini guncelle */
            {
                MetricsSnapshot msnap = {0};
                msnap.total_lines  = g_stats.total_lines;
                msnap.parse_errors = g_stats.parse_errors;
                msnap.total_bytes  = g_stats.total_bytes;
                msnap.alerts_total = g_stats.alerts_total;
                msnap.ban_success  = g_stats.ban_success;
                msnap.ban_fail     = g_stats.ban_fail;
                msnap.unique_ips   = (long)g_stats.unique_ips;
                msnap.eps          = g_stats.eps;
                msnap.cnt_get      = g_stats.cnt_get;
                msnap.cnt_post     = g_stats.cnt_post;
                msnap.cnt_put      = g_stats.cnt_put;
                msnap.cnt_delete   = g_stats.cnt_delete;
                msnap.cnt_other    = g_stats.cnt_other;
                msnap.cnt_2xx      = g_stats.cnt_2xx;
                msnap.cnt_3xx      = g_stats.cnt_3xx;
                msnap.cnt_4xx      = g_stats.cnt_4xx;
                msnap.cnt_5xx      = g_stats.cnt_5xx;
                msnap.xdp_active     = (long)xdp_loader_active();
                msnap.ringbuf_drops  = g_stats.ringbuf_drops;
                /* Intelligence Engine metrikleri */
                msnap.ja3_total      = (long)g_stats.ja3_total;
                msnap.ja3_c2         = (long)g_stats.ja3_c2;
                msnap.apt_clusters   = (long)g_stats.apt_clusters;
                msnap.apt_detections = (long)g_stats.apt_detections;
                msnap.covert_hits    = (long)g_stats.covert_hits;
                msnap.honey_traps    = (long)g_stats.honey_traps;
                {
                    ThreatFeedStats tf;
                    threat_feed_get_stats(&tf);
                    msnap.threat_last_sync_ts  = (long)tf.last_sync_ts;
                    msnap.threat_total_iocs    = (long)tf.total_iocs;
                    msnap.threat_last_applied  = (long)tf.last_applied;
                    msnap.threat_last_failed   = (long)tf.last_failed;
                    msnap.threat_feed_enabled  = g_threat_config.enabled ? 1L : 0L;
                }
                {
                    FpTrustStats fpts;
                    fp_trust_get_stats(&fpts);
                    msnap.fp_trusted_ips       = (long)fpts.trusted_ips;
                    msnap.fp_partial_ips       = (long)fpts.partial_ips;
                    msnap.fp_learn_enabled     = fpts.enabled ? 1L : 0L;
                    msnap.fp_suppressed_total  = (long)fpts.suppressed_total;
                }
                {
                    BanPipelineStats bps;
                    ban_pipeline_get_stats(&bps);
                    msnap.ban_pipeline_ipc     = (long)bps.via_ipc;
                    msnap.ban_pipeline_xdp     = (long)bps.via_xdp;
                    msnap.ban_pipeline_ipset   = (long)bps.via_ipset;
                    msnap.ban_pipeline_failed  = (long)bps.failed;
                }
                {
                    uint64_t jc_active = 0, jc_bans = 0;
                    ja3_cluster_get_stats(&jc_active, &jc_bans);
                    msnap.ja3_clusters_active   = (long)jc_active;
                    msnap.ja3_cluster_bans_total  = (long)jc_bans;
                }
                webhook_metrics_snapshot(&msnap.webhook_sent, &msnap.webhook_fail,
                                         &msnap.webhook_queue_drops, &msnap.webhook_queue_depth);
                webhook_config_metrics(&msnap.webhook_telegram_route,
                                       &msnap.webhook_telegram_batch_sec);
                msnap.webhook_quiet_enabled = webhook_quiet_hours_enabled() ? 1L : 0L;
                msnap.webhook_quiet_active  = webhook_quiet_hours_active() ? 1L : 0L;
                {
                    ApiServerStats apis;
                    api_server_get_stats(&apis);
                    msnap.api_requests_total     = (long)apis.requests_total;
                    msnap.api_auth_fail_total    = (long)apis.auth_fail_total;
                    msnap.api_rate_limited_total = (long)apis.rate_limited_total;
                }
                if (g_db_path && g_db_path[0]) {
                    time_t since = time(NULL) - 86400;
                    (void)db_telegram_ack_count_path(g_db_path, since,
                                                     &msnap.telegram_ack_24h);
                    (void)db_unacked_count_path(g_db_path, since,
                                                &msnap.telegram_unacked_24h);
                }
                metrics_update(&msnap);
            }

            /* Gunluk / haftalik ozet */
            {
                static time_t last_summary_tick = 0;
                if (t_now.tv_sec - last_summary_tick >= 60) {
                    last_summary_tick = t_now.tv_sec;
                    webhook_daily_summary_tick(g_db_path);
                    webhook_weekly_summary_tick(g_db_path);
                }
            }

            /* Self-monitoring: havuz doluluk alarmı */
            {
                double pool_ratio = pool_usage_ratio(&g_pool);
                if (pool_ratio > 0.90) {
                    static time_t last_pool_warn = 0;
                    time_t now_w = time(NULL);
                    if (now_w - last_pool_warn > 60) {
                        last_pool_warn = now_w;
                        Alert pa = {0};
                        pa.level = ALERT_CRIT;
                        pa.ts    = now_w;
                        strncpy(pa.ip, "SYSTEM", IP_STR_LEN - 1);
                        snprintf(pa.message, ALERT_MSG_LEN,
                                 "[SELF-MON] Bellek havuzu kritik doluluk: %.1f%%"
                                 " — GC devreye girmeli!", pool_ratio * 100.0);
                        if (g_use_tui) tui_push_alert(&g_stats, &pa);
                        fprintf(stderr, "%s\n", pa.message);
                    }
                }
            }

            if (g_use_tui) {
                pthread_mutex_lock(&g_tui_mutex);
                tui_draw(&g_stats, &g_top10);
                pthread_mutex_unlock(&g_tui_mutex);
                process_keyboard();
            }

            /* Systemd Watchdog notification */
            static time_t last_watchdog = 0;
            if (sd_notify_ptr && t_now.tv_sec - last_watchdog >= 5) {
                sd_notify_ptr(0, "WATCHDOG=1");
                last_watchdog = t_now.tv_sec;
            }

            t_last_draw   = t_now;
            t_batch_start = t_now;
        }
    }

    /* Lock-free shutdown: worker + GC thread'leri uyandir */
    g_running = 0;
    atomic_store_explicit(&g_queue.done, 1, memory_order_release);

    for (int i = 0; i < g_num_workers; i++) {
        pthread_join(g_workers[i], NULL);
    }
    free(g_workers);

    /* JSON: raporu yavas servis kapatmadan once yaz */
    if (g_output_json) {
        gettimeofday(&t_now, NULL);
        double elapsed_early = elapsed_sec(&t_start, &t_now);
        print_json_report(elapsed_early);
    }

    /* Threat feed thread'ini durdur */
    threat_feed_stop();
    geoip_feed_stop();
    endpoint_baseline_persist();
    fp_trust_persist();
    fp_trust_export_json("fp-trust.json");
    etcd_mesh_stop();

    if (uring_active) {
        io_uring_queue_exit(&ring);
    }

    if (g_gc_thread_started) {
        pthread_join(g_gc_thread, NULL);
    }

    if (g_upload_inotify_fd >= 0) {
        if (g_watch_dir_wd >= 0) inotify_rm_watch(g_upload_inotify_fd, g_watch_dir_wd);
        close(g_upload_inotify_fd);
    }

    if (inotify_fd >= 0) {
        if (watch_fd >= 0) inotify_rm_watch(inotify_fd, watch_fd);
        close(inotify_fd);
    }
    if (trap_inotify_fd >= 0) {
        for (size_t i = 0; i < g_trap_count; i++) {
            if (g_trap_wds[i] >= 0) inotify_rm_watch(trap_inotify_fd, g_trap_wds[i]);
        }
        close(trap_inotify_fd);
    }

    if (g_use_tui) {
        g_stats.unique_ips   = ipmap_size(&g_ipmap);
        g_stats.total_lines  = atomic_load(&g_atomic_lines);
        g_stats.parse_errors = atomic_load(&g_atomic_errors);
        g_stats.total_bytes  = atomic_load(&g_atomic_bytes);
        g_stats.alerts_total = atomic_load(&g_atomic_alerts);
        g_stats.ban_attempts = atomic_load(&g_atomic_ban_attempts);
        g_stats.ban_success  = atomic_load(&g_atomic_ban_success);
        g_stats.ban_fail     = atomic_load(&g_atomic_ban_fail);
        g_stats.cnt_get      = atomic_load(&g_cnt_get);
        g_stats.cnt_post     = atomic_load(&g_cnt_post);
        g_stats.cnt_put      = atomic_load(&g_cnt_put);
        g_stats.cnt_delete   = atomic_load(&g_cnt_delete);
        g_stats.cnt_other    = atomic_load(&g_cnt_other);
        g_stats.cnt_2xx      = atomic_load(&g_cnt_2xx);
        g_stats.cnt_3xx      = atomic_load(&g_cnt_3xx);
        g_stats.cnt_4xx      = atomic_load(&g_cnt_4xx);
        g_stats.cnt_5xx      = atomic_load(&g_cnt_5xx);

        gettimeofday(&t_now, NULL);
        double total_elapsed = elapsed_sec(&t_start, &t_now);
        if (total_elapsed > 0)
            g_stats.eps = (double)g_stats.total_lines / total_elapsed;

        daemon_stats_apply_tui(&g_stats);
        attack_tree_snapshot_apply_tui(&g_stats, ATREE_RISK_THRESHOLD_ALERT);
        pthread_mutex_lock(&g_tui_mutex);
        tui_draw(&g_stats, &g_top10);
        pthread_mutex_unlock(&g_tui_mutex);

        /* --follow olmayan modda sonuclari kullaniciya goster.
         * Alt satira mesaj yaz, herhangi bir tusa basilana dek bekle. */
        if (!g_follow) {
            printf("\x1b[40;2H\x1b[2m  Analiz tamamlandi. Cikis: [Q] veya herhangi bir tus... \x1b[K\x1b[0m");
            fflush(stdout);
            for (int _w = 0; _w < 30; _w++) {
                char _ch;
                if (read(STDIN_FILENO, &_ch, 1) > 0) break;
                usleep(100000);
            }
        }
    }

    gettimeofday(&t_now, NULL);
    double elapsed = elapsed_sec(&t_start, &t_now);

    /* Temizlik ve Kapanış */
    if (!g_output_json) {
        agent_sync_stop();
        api_server_stop();
        metrics_server_stop();
        if (g_db_enabled) db_close();
    }
    siem_forwarder_stop();
    schema_unload();
    wasm_runtime_destroy();

#ifdef HAVE_LIBBPF
    if (g_ringbuf) ring_buffer__free(g_ringbuf);
#endif

    if (g_use_tui) {
        restore_kbd();
        tui_cleanup();
    }

    if (!g_output_json) {
        printf("\n");
        printf("*==========================================*\n");
        printf("|         LOG ANALIZ RAPORU                |\n");
        printf("*==========================================*\n");
        printf("|  Toplam satir    : %-22ld|\n", atomic_load(&g_atomic_lines));
        printf("|  Parse hatasi    : %-22ld|\n", atomic_load(&g_atomic_errors));
        printf("|  Benzersiz IP    : %-22zu|\n", ipmap_size(&g_ipmap));
        printf("|  Toplam alarm    : %-22ld|\n", atomic_load(&g_atomic_alerts));
        printf("|  Gecen sure      : %-19.3f sn|\n", elapsed);
        if (elapsed > 0)
            printf("|  Ort. EPS        : %-22.1f|\n", (double)atomic_load(&g_atomic_lines) / elapsed);
        printf("|  Bellek kullanimi: %-18.1f MB|\n", (double)g_pool.offset / (1024.0 * 1024.0));
        printf("*==========================================*\n");

        printf("\n[ TOP-10 TEHDIT SKORU ]\n");
        printf("%-5s %-39s %-10s %-8s %-8s\n", "#", "IP", "TOPLAM", "4xx", "SQLi");
        printf("-------------------------------------------------------------------\n");

        MinHeap tmp = g_top10;
        IpRecord *sorted[HEAP_K] = {NULL};
        heap_sort_desc(&tmp, sorted);

        for (int i = 0; i < HEAP_K; i++) {
            IpRecord *rec = sorted[i];
            if (!rec || rec->ip[0] == '\0') break;
            printf("%-5d %-39s %-10ld %-8ld %-8ld%s\n",
                   i + 1, rec->ip, atomic_load(&rec->cnt.total_requests),
                   atomic_load(&rec->cnt.error_4xx), atomic_load(&rec->cnt.sqli_hits),
                   atomic_load(&rec->banned) ? "  [BANLI]" : "");
        }
        printf("\n");
    }

    mmap_close(&mf);
    pool_destroy(&g_pool);
    g_pool.base = NULL;
    g_pool.overflow = NULL;

    return 0;
}