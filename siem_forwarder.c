#define _GNU_SOURCE
#include "siem_forwarder.h"
#include "logger.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <fcntl.h>
#include <errno.h>

extern char g_tenant_id[128];

SiemForwarderConfig g_siem_config = {
    .enabled = 0,
    .host = "127.0.0.1",
    .port = 5044
};

#define SIEM_QUEUE_SIZE 4096

typedef struct {
    Alert alert;
    char sensor_type[32];
} SiemEvent;

static SiemEvent g_siem_queue[SIEM_QUEUE_SIZE];
static int g_queue_head = 0;
static int g_queue_tail = 0;
static int g_queue_count = 0;

static pthread_mutex_t g_siem_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_siem_cond = PTHREAD_COND_INITIALIZER;

static pthread_t g_siem_thread;
static volatile int g_siem_running = 0;
static int g_siem_thread_started = 0;

/* TCP soket üzerinden JSON verisi gönderir. */
static int send_to_siem(int sock, const SiemEvent *ev) {
    char payload[2048];
    const char *lvl_str = (ev->alert.level == ALERT_CRIT) ? "CRITICAL" : "WARNING";
    
    int len = snprintf(payload, sizeof(payload),
        "{\"tenant_id\":\"%s\",\"timestamp\":%ld,\"sensor\":\"%s\",\"level\":\"%s\",\"ip\":\"%s\",\"mitre\":\"%s\",\"message\":\"%s\"}\n",
        g_tenant_id,
        (long)ev->alert.ts,
        ev->sensor_type,
        lvl_str,
        ev->alert.ip,
        ev->alert.mitre_id[0] ? ev->alert.mitre_id : "Unknown",
        ev->alert.message);
        
    if (len <= 0 || len >= (int)sizeof(payload)) return -1;
    
    ssize_t sent = send(sock, payload, len, MSG_NOSIGNAL);
    return (sent == len) ? 0 : -1;
}

static void *siem_thread_func(void *arg) {
    (void)arg;
    int sock = -1;
    struct sockaddr_in server_addr;
    
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(g_siem_config.port);
    inet_pton(AF_INET, g_siem_config.host, &server_addr.sin_addr);

    while (g_siem_running) {
        pthread_mutex_lock(&g_siem_mutex);
        while (g_queue_count == 0 && g_siem_running) {
            struct timespec ts;
            clock_gettime(CLOCK_REALTIME, &ts);
            ts.tv_sec += 1; /* Wake up every second to check running status and reconnects */
            pthread_cond_timedwait(&g_siem_cond, &g_siem_mutex, &ts);
        }
        
        if (!g_siem_running) {
            pthread_mutex_unlock(&g_siem_mutex);
            break;
        }
        
        SiemEvent ev = g_siem_queue[g_queue_tail];
        g_queue_tail = (g_queue_tail + 1) % SIEM_QUEUE_SIZE;
        g_queue_count--;
        pthread_mutex_unlock(&g_siem_mutex);

        /* Soket baglantisi yoksa baglanmaya calis */
        if (sock < 0) {
            sock = socket(AF_INET, SOCK_STREAM, 0);
            if (sock >= 0) {
                /* Non-blocking connect */
                int flags = fcntl(sock, F_GETFL, 0);
                fcntl(sock, F_SETFL, flags | O_NONBLOCK);
                
                connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr));
                /* Connect will be in progress, we can wait a bit or let send() fail and retry */
                usleep(50000); /* 50ms wait for connect */
            }
        }
        
        if (sock >= 0) {
            if (send_to_siem(sock, &ev) < 0) {
                close(sock);
                sock = -1;
                /* Basarisiz olursa paketi dusuruyoruz (DDoS altinda kuyruk birikmesin diye) */
            }
        }
    }

    if (sock >= 0) close(sock);
    log_rl(LOG_INFO, "SIEM Forwarder thread durdu.");
    return NULL;
}

void siem_forwarder_init(void) {
    if (!g_siem_config.enabled || g_siem_config.host[0] == '\0') return;
    
    if (g_siem_running) return;
    g_siem_running = 1;
    if (pthread_create(&g_siem_thread, NULL, siem_thread_func, NULL) == 0)
        g_siem_thread_started = 1;
    else
        g_siem_running = 0;
    log_rl(LOG_INFO, "SIEM Forwarder basladi -> %s:%d", g_siem_config.host, g_siem_config.port);
}

void siem_forwarder_publish(const Alert *alert, const char *sensor_type) {
    if (!g_siem_running) return;
    
    pthread_mutex_lock(&g_siem_mutex);
    if (g_queue_count < SIEM_QUEUE_SIZE) {
        g_siem_queue[g_queue_head].alert = *alert;
        strncpy(g_siem_queue[g_queue_head].sensor_type, sensor_type, 31);
        g_siem_queue[g_queue_head].sensor_type[31] = '\0';
        
        g_queue_head = (g_queue_head + 1) % SIEM_QUEUE_SIZE;
        g_queue_count++;
        pthread_cond_signal(&g_siem_cond);
    }
    /* Kuyruk doluysa paketi drop ediyoruz. (SIEM backpressure korumasi) */
    pthread_mutex_unlock(&g_siem_mutex);
}

void siem_forwarder_stop(void) {
    if (!g_siem_running && !g_siem_thread_started) return;
    g_siem_running = 0;

    pthread_mutex_lock(&g_siem_mutex);
    pthread_cond_broadcast(&g_siem_cond);
    pthread_mutex_unlock(&g_siem_mutex);

    if (g_siem_thread_started) {
        pthread_join(g_siem_thread, NULL);
        g_siem_thread_started = 0;
    }
}
