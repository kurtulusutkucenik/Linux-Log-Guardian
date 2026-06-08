/* tarpit_server.c — io_uring Aktif Tarpit Sunucusu
 *
 * Saldırganın TCP bağlantısını asla kapatmaz; 100ms'de 1 byte HTTP
 * fragment göndererek scanner'ları sonsuz döngüye sokar.
 *
 * AF_XDP xsk_map entegrasyonu: XDP programı saldırgan IP paketlerini
 * xsk_map üzerinden bu sunucunun socket'ine yönlendirir.
 */
#define _GNU_SOURCE
#include "tarpit_server.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <fcntl.h>
#include <syslog.h>
#include <time.h>
#include <pthread.h>
#include <stdatomic.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <liburing.h>

#ifdef HAVE_LIBBPF
#include <bpf/bpf.h>
/* AF_XDP: xsk_map yapısı — sadece tarpit yönlendirme için key gerekli */
struct lpm_key_v4 { uint32_t prefixlen; uint32_t ipv4_addr; };
#endif

/* ── HTTP Tarpit Fragment Dizisi ─────────────────────────────────────── */
/* Saldırgan gerçek bir yanıt alıyor sanır: asla tamamlanmayan HTTP/1.1 */
static const char * const TARPIT_FRAGS[] = {
    "H", "T", "T", "P", "/", "1", ".", "1",
    " ", "2", "0", "0", " ", "O", "K", "\r",
};
#define TARPIT_FRAG_COUNT 16

/* ── io_uring user_data etiketleri ─────────────────────────────────────── */
#define UD_ACCEPT   0x1000000000000000ULL
#define UD_TIMEOUT  0x2000000000000000ULL
#define UD_SEND     0x3000000000000000ULL
#define UD_CONN_IDX_MASK 0x00FFFFFFFFFFFFFFULL

/* ── Global durum ────────────────────────────────────────────────────── */
static TarpitConn    g_conns[TARPIT_MAX_CONNS];
static int           g_server_fd  = -1;
static int           g_xsk_map_fd = -1;
static uint16_t      g_port       = TARPIT_DEFAULT_PORT;
static volatile int  g_running    = 0;
static pthread_t     g_thread;

static _Atomic uint64_t g_stat_active  = 0;
static _Atomic uint64_t g_stat_total   = 0;
static _Atomic uint64_t g_stat_bytes   = 0;

/* ── Yardımcı: boş slot bul ────────────────────────────────────────── */
static int alloc_conn_slot(void)
{
    for (int i = 0; i < TARPIT_MAX_CONNS; i++) {
        if (g_conns[i].fd < 0) return i;
    }
    return -1;
}

/* ── Bağlantıyı temizle ─────────────────────────────────────────────── */
static void free_conn(int idx)
{
    if (idx < 0 || idx >= TARPIT_MAX_CONNS) return;
    TarpitConn *c = &g_conns[idx];
    if (c->fd >= 0) { close(c->fd); c->fd = -1; }
    atomic_fetch_sub(&g_stat_active, 1);
}

/* ── Sonraki gönderim zamanını hesapla (monotonic ns) ──────────────── */
static uint64_t now_ns(void)
{
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + (uint64_t)ts.tv_nsec;
}

/* ── io_uring tarpit döngüsü ─────────────────────────────────────────── */
static void *tarpit_thread(void *arg)
{
    (void)arg;
    struct io_uring ring;

    if (io_uring_queue_init(256, &ring, 0) < 0) {
        syslog(LOG_ERR, "[TARPIT] io_uring_queue_init basarisiz: %s",
               strerror(errno));
        /* Fallback: basit blocking loop */
        while (g_running) {
            struct sockaddr_in caddr;
            socklen_t clen = sizeof(caddr);
            int cfd = accept(g_server_fd, (struct sockaddr *)&caddr, &clen);
            if (cfd < 0) { if (errno == EINTR) continue; break; }
            int slot = alloc_conn_slot();
            if (slot < 0) { close(cfd); continue; }
            inet_ntop(AF_INET, &caddr.sin_addr,
                      g_conns[slot].peer_ip, sizeof(g_conns[slot].peer_ip));
            g_conns[slot].fd = cfd;
            g_conns[slot].phase = 0;
            atomic_fetch_add(&g_stat_active, 1);
            atomic_fetch_add(&g_stat_total, 1);
            /* Basit tarpit: her 100ms'de 1 byte gönder */
            while (g_running && g_conns[slot].fd >= 0) {
                usleep(TARPIT_BYTE_INTERVAL_MS * 1000);
                char b = TARPIT_FRAGS[g_conns[slot].phase % TARPIT_FRAG_COUNT][0];
                ssize_t r = send(g_conns[slot].fd, &b, 1, MSG_NOSIGNAL);
                if (r <= 0) { free_conn(slot); break; }
                g_conns[slot].phase++;
                atomic_fetch_add(&g_stat_bytes, 1);
            }
        }
        return NULL;
    }

    syslog(LOG_INFO, "[TARPIT] io_uring tarpit aktif port=%u", g_port);

    /* İlk ACCEPT SQE */
    {
        struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
        struct sockaddr_in caddr; socklen_t clen = sizeof(caddr);
        io_uring_prep_accept(sqe, g_server_fd,
                             (struct sockaddr *)&caddr, &clen, SOCK_CLOEXEC);
        io_uring_sqe_set_data64(sqe, UD_ACCEPT);
        io_uring_submit(&ring);
    }

    while (g_running) {
        struct io_uring_cqe *cqe;
        struct __kernel_timespec ts = { .tv_sec = 1, .tv_nsec = 0 };
        int ret = io_uring_wait_cqe_timeout(&ring, &cqe, &ts);
        if (ret == -ETIME) {
            /* Timeout event'leri: hangi bağlantı gönderim zamanına geldi? */
            uint64_t now = now_ns();
            for (int i = 0; i < TARPIT_MAX_CONNS; i++) {
                if (g_conns[i].fd < 0) continue;
                if (now < g_conns[i].next_send_ns) continue;
                /* Gönder */
                char b = TARPIT_FRAGS[g_conns[i].phase % TARPIT_FRAG_COUNT][0];
                struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
                if (!sqe) { free_conn(i); continue; }
                io_uring_prep_send(sqe, g_conns[i].fd, &b, 1, MSG_NOSIGNAL);
                io_uring_sqe_set_data64(sqe, UD_SEND | (uint64_t)i);
                g_conns[i].next_send_ns = now + (uint64_t)TARPIT_BYTE_INTERVAL_MS * 1000000ULL;
                g_conns[i].phase++;
            }
            io_uring_submit(&ring);
            continue;
        }
        if (ret < 0) { if (errno == EINTR) continue; break; }

        uint64_t ud  = (uint64_t)io_uring_cqe_get_data64(cqe);
        int      res = cqe->res;
        io_uring_cqe_seen(&ring, cqe);

        if ((ud & ~UD_CONN_IDX_MASK) == UD_ACCEPT) {
            if (res >= 0) {
                int slot = alloc_conn_slot();
                if (slot >= 0) {
                    g_conns[slot].fd = res;
                    g_conns[slot].phase = 0;
                    g_conns[slot].bytes_sent = 0;
                    g_conns[slot].connected_at_ns = now_ns();
                    g_conns[slot].next_send_ns =
                        g_conns[slot].connected_at_ns +
                        (uint64_t)TARPIT_BYTE_INTERVAL_MS * 1000000ULL;
                    atomic_fetch_add(&g_stat_active, 1);
                    atomic_fetch_add(&g_stat_total, 1);
                    syslog(LOG_INFO, "[TARPIT] Yeni kurban: fd=%d slot=%d",
                           res, slot);
                } else {
                    close(res); /* Masa dolu */
                }
            }
            /* Yeni ACCEPT */
            struct io_uring_sqe *sqe = io_uring_get_sqe(&ring);
            struct sockaddr_in caddr; socklen_t clen = sizeof(caddr);
            io_uring_prep_accept(sqe, g_server_fd,
                                 (struct sockaddr *)&caddr, &clen, SOCK_CLOEXEC);
            io_uring_sqe_set_data64(sqe, UD_ACCEPT);
            io_uring_submit(&ring);

        } else if ((ud & ~UD_CONN_IDX_MASK) == UD_SEND) {
            int idx = (int)(ud & UD_CONN_IDX_MASK);
            if (res > 0) {
                g_conns[idx].bytes_sent++;
                atomic_fetch_add(&g_stat_bytes, 1);
            } else {
                free_conn(idx); /* Saldırgan bağlantıyı kesti */
            }
        }
    }

    io_uring_queue_exit(&ring);
    return NULL;
}

/* ── Public API ─────────────────────────────────────────────────────── */
int tarpit_server_start(uint16_t port, int xsk_map_fd)
{
    if (g_running) return 0;

    g_port       = port ? port : TARPIT_DEFAULT_PORT;
    g_xsk_map_fd = xsk_map_fd;

    /* Tüm slotları kapat */
    for (int i = 0; i < TARPIT_MAX_CONNS; i++) g_conns[i].fd = -1;

    /* TCP listener */
    g_server_fd = socket(AF_INET, SOCK_STREAM | SOCK_CLOEXEC, 0);
    if (g_server_fd < 0) return -1;

    int yes = 1;
    setsockopt(g_server_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(yes));
    setsockopt(g_server_fd, SOL_SOCKET, SO_REUSEPORT, &yes, sizeof(yes));
    /* TCP keepalive kapalı: bağlantıyı biz sonlandırmıyoruz */
    setsockopt(g_server_fd, IPPROTO_TCP, TCP_NODELAY, &yes, sizeof(yes));

    struct sockaddr_in addr = {
        .sin_family      = AF_INET,
        .sin_port        = htons(g_port),
        .sin_addr.s_addr = INADDR_ANY,
    };
    if (bind(g_server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0 ||
        listen(g_server_fd, 4096) < 0) {
        close(g_server_fd); g_server_fd = -1;
        return -1;
    }

    g_running = 1;
    pthread_create(&g_thread, NULL, tarpit_thread, NULL);
    syslog(LOG_INFO, "[TARPIT] Basladi port=%u xsk_map_fd=%d", g_port, xsk_map_fd);
    return 0;
}

void tarpit_server_stop(void)
{
    g_running = 0;
    if (g_server_fd >= 0) { close(g_server_fd); g_server_fd = -1; }
    pthread_join(g_thread, NULL);
    for (int i = 0; i < TARPIT_MAX_CONNS; i++) free_conn(i);
}

int tarpit_server_redirect(const char *ip, uint8_t prefix)
{
#ifdef HAVE_LIBBPF
    if (g_xsk_map_fd < 0) return -1;
    struct in_addr addr;
    if (inet_pton(AF_INET, ip, &addr) != 1) return -1;
    struct lpm_key_v4 key = {
        .prefixlen  = prefix ? prefix : 32,
        .ipv4_addr  = addr.s_addr,
    };
    /* value = tarpit socket fd (xsk_map key 0'da kayıtlı) */
    uint32_t xsk_idx = 0;
    return bpf_map_update_elem(g_xsk_map_fd, &key, &xsk_idx, BPF_ANY);
#else
    (void)ip; (void)prefix; return -1;
#endif
}

int tarpit_server_unredirect(const char *ip, uint8_t prefix)
{
#ifdef HAVE_LIBBPF
    if (g_xsk_map_fd < 0) return -1;
    struct in_addr addr;
    if (inet_pton(AF_INET, ip, &addr) != 1) return -1;
    struct lpm_key_v4 key = { .prefixlen = prefix ? prefix : 32,
                              .ipv4_addr = addr.s_addr };
    return bpf_map_delete_elem(g_xsk_map_fd, &key);
#else
    (void)ip; (void)prefix; return -1;
#endif
}

void tarpit_server_get_stats(uint64_t *active_conns,
                             uint64_t *total_trapped,
                             uint64_t *total_bytes)
{
    if (active_conns)  *active_conns  = atomic_load(&g_stat_active);
    if (total_trapped) *total_trapped = atomic_load(&g_stat_total);
    if (total_bytes)   *total_bytes   = atomic_load(&g_stat_bytes);
}
