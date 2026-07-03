/* mesh_intel.c — Global Mesh Tehdit İstihbaratı (ZeroMQ PUB/SUB)
 *
 * Dağıtık ban paylaşımı: Sunucu A bir APT keşfedince IP'yi ZeroMQ PUB socket'e
 * yayınlar. Dünyanın her yerindeki Log Guardian ajanları SUB socket ile
 * alıp daemon_ipc_ban_*() → XDP map'e milisaniyeler içinde yazar.
 */
#define _GNU_SOURCE
#include "mesh_intel.h"
#include "daemon_ipc.h"
#include "logger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <stdatomic.h>
#include <syslog.h>
#include <time.h>
#include <arpa/inet.h>

#ifdef HAVE_ZMQ
#include <zmq.h>
#endif

/* ── Global durum ─────────────────────────────────────────────────── */
#ifdef HAVE_ZMQ
static void         *g_zmq_ctx     = NULL;
static void         *g_pub_sock    = NULL;
static void         *g_sub_sock    = NULL;
#endif

static pthread_t     g_sub_thread;
static volatile int  g_sub_running = 0;
static int           g_sub_thread_started = 0;

static _Atomic uint64_t g_stat_pub_sent   = 0;
static _Atomic uint64_t g_stat_sub_recv   = 0;
static _Atomic uint64_t g_stat_sub_apply  = 0;
static _Atomic uint64_t g_stat_sub_errors = 0;

#ifdef HAVE_ZMQ
/* ── Subscriber arka plan thread'i ─────────────────────────────────── */
static void *sub_thread_func(void *arg)
{
    (void)arg;

    if (!g_sub_sock) return NULL;

    syslog(LOG_INFO, "[MESH] Subscriber thread basladi.");

    while (g_sub_running) {
        /* ZeroMQ non-blocking recv ile 100ms poll */
        zmq_msg_t msg;
        zmq_msg_init(&msg);

        int rc = zmq_msg_recv(&msg, g_sub_sock, ZMQ_DONTWAIT);
        if (rc < 0) {
            if (errno == EAGAIN) {
                /* Mesaj yok — kısa bekle */
                usleep(10000);  /* 10ms */
                zmq_msg_close(&msg);
                continue;
            }
            if (errno == ETERM) break;  /* Context kapatıldı */
            syslog(LOG_WARNING, "[MESH] SUB recv hatasi: %s", zmq_strerror(errno));
            zmq_msg_close(&msg);
            atomic_fetch_add(&g_stat_sub_errors, 1);
            continue;
        }

        size_t msg_size = zmq_msg_size(&msg);

        /* Topic frame kontrolü (PUB/SUB envelope) */
        if (msg_size == strlen(MESH_TOPIC) &&
            memcmp(zmq_msg_data(&msg), MESH_TOPIC, msg_size) == 0) {
            zmq_msg_close(&msg);
            /* Asıl veri frame'ini al */
            zmq_msg_init(&msg);
            rc = zmq_msg_recv(&msg, g_sub_sock, 0);
            if (rc < 0) { zmq_msg_close(&msg); continue; }
            msg_size = zmq_msg_size(&msg);
        }

        if (msg_size != sizeof(MeshThreatEvent)) {
            syslog(LOG_WARNING,
                   "[MESH] Yanlis event boyutu: %zu (beklenen %zu)",
                   msg_size, sizeof(MeshThreatEvent));
            zmq_msg_close(&msg);
            atomic_fetch_add(&g_stat_sub_errors, 1);
            continue;
        }

        MeshThreatEvent ev;
        memcpy(&ev, zmq_msg_data(&msg), sizeof(ev));
        zmq_msg_close(&msg);

        atomic_fetch_add(&g_stat_sub_recv, 1);

        /* IP'yi XDP map'e yaz */
        int ban_rc = -1;
        switch (ev.action) {
        case 0: /* ban */
            if (strchr(ev.ip, ':'))
                ban_rc = daemon_ipc_ban_ipv6(ev.ip);
            else
                ban_rc = daemon_ipc_ban_ipv4(ev.ip);
            break;
        case 1: /* tarpit */
            if (!strchr(ev.ip, ':'))
                ban_rc = daemon_ipc_tarpit_ipv4(ev.ip, 60);
            break;
        case 3: /* unban */
            if (strchr(ev.ip, ':'))
                ban_rc = daemon_ipc_unban_ipv6(ev.ip);
            else
                ban_rc = daemon_ipc_unban_ipv4(ev.ip);
            break;
        default:
            ban_rc = 0;
        }

        if (ban_rc == 0) {
            atomic_fetch_add(&g_stat_sub_apply, 1);
            syslog(LOG_INFO,
                   "[MESH] Uzak IOC uyguland: IP=%s/%u Score=%u "
                   "From=%s Tactic=%s Reason=%.40s",
                   ev.ip, ev.prefix, ev.threat_score,
                   ev.source_agent, ev.mitre_tactic, ev.reason);
        } else {
            atomic_fetch_add(&g_stat_sub_errors, 1);
        }
    }

    syslog(LOG_INFO, "[MESH] Subscriber thread durdu.");
    return NULL;
}
#endif

/* ── Publisher API ─────────────────────────────────────────────────── */
int mesh_intel_init_pub(const char *bind_addr)
{
#ifdef HAVE_ZMQ
    if (!bind_addr) return -1;

    if (!g_zmq_ctx) {
        g_zmq_ctx = zmq_ctx_new();
        if (!g_zmq_ctx) return -1;
        zmq_ctx_set(g_zmq_ctx, ZMQ_IO_THREADS, 1);
    }

    g_pub_sock = zmq_socket(g_zmq_ctx, ZMQ_PUB);
    if (!g_pub_sock) return -1;

    /* High-water mark: 100k mesaj buffer */
    int hwm = 100000;
    zmq_setsockopt(g_pub_sock, ZMQ_SNDHWM, &hwm, sizeof(hwm));
    /* Bağlantı kesilirse beklemeden devam et */
    int linger = 0;
    zmq_setsockopt(g_pub_sock, ZMQ_LINGER, &linger, sizeof(linger));

    if (zmq_bind(g_pub_sock, bind_addr) < 0) {
        syslog(LOG_ERR, "[MESH] PUB bind hatasi %s: %s",
               bind_addr, zmq_strerror(errno));
        zmq_close(g_pub_sock); g_pub_sock = NULL;
        return -1;
    }

    syslog(LOG_INFO, "[MESH] PUB socket aktif: %s", bind_addr);
    return 0;
#else
    (void)bind_addr;
    syslog(LOG_WARNING, "[MESH] ZeroMQ yok, PUB devre disi.");
    return -1;
#endif
}

void mesh_intel_publish(const MeshThreatEvent *ev)
{
#ifdef HAVE_ZMQ
    if (!g_pub_sock || !ev) return;

    /* Frame 1: topic */
    zmq_send(g_pub_sock, MESH_TOPIC, strlen(MESH_TOPIC), ZMQ_SNDMORE | ZMQ_DONTWAIT);
    /* Frame 2: payload */
    int rc = zmq_send(g_pub_sock, ev, sizeof(*ev), ZMQ_DONTWAIT);
    if (rc < 0 && errno != EAGAIN) {
        syslog(LOG_WARNING, "[MESH] Publish hatasi: %s", zmq_strerror(errno));
        return;
    }
    atomic_fetch_add(&g_stat_pub_sent, 1);
#else
    (void)ev;
#endif
}

void mesh_intel_pub_stop(void)
{
#ifdef HAVE_ZMQ
    if (g_pub_sock) { zmq_close(g_pub_sock); g_pub_sock = NULL; }
    if (g_zmq_ctx && !g_sub_sock) {
        zmq_ctx_destroy(g_zmq_ctx); g_zmq_ctx = NULL;
    }
#endif
}

/* ── Subscriber API ────────────────────────────────────────────────── */
int mesh_intel_init_sub(const char *connect_addr)
{
#ifdef HAVE_ZMQ
    if (!connect_addr) return -1;

    if (!g_zmq_ctx) {
        g_zmq_ctx = zmq_ctx_new();
        if (!g_zmq_ctx) return -1;
        zmq_ctx_set(g_zmq_ctx, ZMQ_IO_THREADS, 1);
    }

    g_sub_sock = zmq_socket(g_zmq_ctx, ZMQ_SUB);
    if (!g_sub_sock) return -1;

    /* Topic filtresi */
    zmq_setsockopt(g_sub_sock, ZMQ_SUBSCRIBE, MESH_TOPIC, strlen(MESH_TOPIC));

    int linger = 0;
    zmq_setsockopt(g_sub_sock, ZMQ_LINGER, &linger, sizeof(linger));
    /* Reconnect: 100ms → 5s arasında üstel geri çekilme */
    int reconnect_ivl = 100;
    zmq_setsockopt(g_sub_sock, ZMQ_RECONNECT_IVL, &reconnect_ivl, sizeof(reconnect_ivl));
    int reconnect_max = 5000;
    zmq_setsockopt(g_sub_sock, ZMQ_RECONNECT_IVL_MAX, &reconnect_max, sizeof(reconnect_max));

    if (zmq_connect(g_sub_sock, connect_addr) < 0) {
        syslog(LOG_ERR, "[MESH] SUB connect hatasi %s: %s",
               connect_addr, zmq_strerror(errno));
        zmq_close(g_sub_sock); g_sub_sock = NULL;
        return -1;
    }

    g_sub_running = 1;
    if (pthread_create(&g_sub_thread, NULL, sub_thread_func, NULL) != 0) {
        g_sub_running = 0;
        zmq_close(g_sub_sock); g_sub_sock = NULL;
        return -1;
    }
    g_sub_thread_started = 1;
    syslog(LOG_INFO, "[MESH] SUB baglandi: %s", connect_addr);
    return 0;
#else
    (void)connect_addr;
    return -1;
#endif
}

void mesh_intel_sub_stop(void)
{
    if (!g_sub_running && !g_sub_thread_started) return;
    g_sub_running = 0;
#ifdef HAVE_ZMQ
    if (g_sub_sock) { zmq_close(g_sub_sock); g_sub_sock = NULL; }
    if (g_zmq_ctx && !g_pub_sock) {
        zmq_ctx_destroy(g_zmq_ctx);
        g_zmq_ctx = NULL;
    }
#endif
    if (g_sub_thread_started) {
        pthread_join(g_sub_thread, NULL);
        g_sub_thread_started = 0;
    }
}

/* ── Yardımcı ──────────────────────────────────────────────────────── */
void mesh_intel_fill_from_ip(MeshThreatEvent *ev,
                             const char *ip, uint8_t prefix,
                             uint32_t threat_score,
                             const char *mitre_tactic,
                             const char *reason)
{
    memset(ev, 0, sizeof(*ev));
    strncpy(ev->ip, ip, sizeof(ev->ip) - 1);
    ev->prefix       = prefix;
    ev->action       = 0; /* ban */
    ev->threat_score = threat_score;
    if (mitre_tactic) strncpy(ev->mitre_tactic, mitre_tactic, sizeof(ev->mitre_tactic)-1);
    if (reason)       strncpy(ev->reason, reason, sizeof(ev->reason)-1);

    struct timespec ts; clock_gettime(CLOCK_REALTIME, &ts);
    ev->timestamp_ns = (uint64_t)ts.tv_sec * 1000000000ULL + ts.tv_nsec;

    /* source_agent: hostname */
    gethostname(ev->source_agent, sizeof(ev->source_agent) - 1);
}

void mesh_intel_get_stats(MeshStats *out)
{
    if (!out) return;
    out->pub_sent        = atomic_load(&g_stat_pub_sent);
    out->sub_received    = atomic_load(&g_stat_sub_recv);
    out->sub_applied     = atomic_load(&g_stat_sub_apply);
    out->sub_errors      = atomic_load(&g_stat_sub_errors);
    out->connected_peers = 0; /* ZeroMQ XPUB ile genişletilebilir */
}
