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
#include <strings.h>
#include <errno.h>
#include <sys/select.h>

extern char g_tenant_id[128];

SiemForwarderConfig g_siem_config = {
    .enabled = 0,
    .host = "127.0.0.1",
    .port = 5044,
    .format = "json"
};

#define SIEM_QUEUE_SIZE 4096

typedef struct {
    Alert alert;
    char sensor_type[32];
    char event_type[16];
    double risk_score;
    char policy[64];
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

/* TCP soket üzerinden JSON veya STIX 2.1 indicator */
static int send_to_siem(int sock, const SiemEvent *ev) {
    char payload[8192];
    char esc_msg[ALERT_MSG_LEN * 2];
    const char *lvl_str = (ev->alert.level == ALERT_CRIT) ? "CRITICAL" : "WARNING";
    const char *evt = ev->event_type[0] ? ev->event_type : "alert";
    size_t ei = 0;

    for (const char *p = ev->alert.message; *p && ei + 2 < sizeof(esc_msg); p++) {
        if (*p == '"' || *p == '\\' || *p == '\n') esc_msg[ei++] = '\\';
        esc_msg[ei++] = *p;
    }
    esc_msg[ei] = '\0';

    int len;
    if (strcasecmp(g_siem_config.format, "stix") == 0) {
        const char *mitre = ev->alert.mitre_id[0] ? ev->alert.mitre_id : "T1190";
        len = snprintf(payload, sizeof(payload),
            "{\"type\":\"bundle\",\"id\":\"bundle--lg-%ld\",\"objects\":[{\"type\":\"indicator\","
            "\"spec_version\":\"2.1\",\"id\":\"indicator--lg-%ld-%s\",\"created\":\"1970-01-01T00:00:00.000Z\","
            "\"modified\":\"1970-01-01T00:00:00.000Z\",\"name\":\"Log Guardian %s\","
            "\"pattern\":\"[ipv4-addr:value = '%s']\",\"pattern_type\":\"stix\","
            "\"valid_from\":\"1970-01-01T00:00:00.000Z\","
            "\"labels\":[\"malicious-activity\"],"
            "\"external_references\":[{\"source_name\":\"mitre-attack\",\"external_id\":\"%s\"}],"
            "\"x_lg_tenant\":\"%s\",\"x_lg_sensor\":\"%s\",\"x_lg_level\":\"%s\","
            "\"x_lg_message\":\"%s\",\"x_lg_risk\":%.1f,\"x_lg_policy\":\"%s\"}]}\n",
            (long)ev->alert.ts, (long)ev->alert.ts, ev->alert.ip, evt,
            ev->alert.ip, mitre, g_tenant_id, ev->sensor_type, lvl_str,
            esc_msg,
            ev->risk_score >= 0.0 ? ev->risk_score : 0.0,
            ev->policy[0] ? ev->policy : "");
    } else {
        len = snprintf(payload, sizeof(payload),
            "{\"event_type\":\"%s\",\"tenant_id\":\"%s\",\"timestamp\":%ld,"
            "\"sensor\":\"%s\",\"level\":\"%s\",\"ip\":\"%s\",\"mitre\":\"%s\","
            "\"message\":\"%s\",\"risk_score\":%.1f,\"policy\":\"%s\"}\n",
            evt,
            g_tenant_id,
            (long)ev->alert.ts,
            ev->sensor_type,
            lvl_str,
            ev->alert.ip,
            ev->alert.mitre_id[0] ? ev->alert.mitre_id : "Unknown",
            esc_msg,
            ev->risk_score >= 0.0 ? ev->risk_score : 0.0,
            ev->policy[0] ? ev->policy : "");
    }

    if (len <= 0 || len >= (int)sizeof(payload)) return -1;

    ssize_t sent = send(sock, payload, (size_t)len, MSG_NOSIGNAL);
    return (sent == len) ? 0 : -1;
}

static int siem_tcp_connect(const struct sockaddr_in *addr)
{
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock < 0)
        return -1;

    int flags = fcntl(sock, F_GETFL, 0);
    if (flags < 0) {
        close(sock);
        return -1;
    }
    (void)fcntl(sock, F_SETFL, flags | O_NONBLOCK);

    int rc = connect(sock, (const struct sockaddr *)addr, sizeof(*addr));
    if (rc == 0) {
        (void)fcntl(sock, F_SETFL, flags);
        return sock;
    }
    if (errno != EINPROGRESS) {
        close(sock);
        return -1;
    }

    fd_set wfds;
    FD_ZERO(&wfds);
    FD_SET(sock, &wfds);
    struct timeval tv = { .tv_sec = 3, .tv_usec = 0 };
    rc = select(sock + 1, NULL, &wfds, NULL, &tv);
    if (rc <= 0) {
        close(sock);
        return -1;
    }
    int so_err = 0;
    socklen_t elen = sizeof(so_err);
    if (getsockopt(sock, SOL_SOCKET, SO_ERROR, &so_err, &elen) != 0 || so_err != 0) {
        close(sock);
        return -1;
    }
    (void)fcntl(sock, F_SETFL, flags);
    return sock;
}

static int siem_send_event(int *sock, const struct sockaddr_in *addr, const SiemEvent *ev)
{
    for (int attempt = 0; attempt < 4; attempt++) {
        if (*sock < 0)
            *sock = siem_tcp_connect(addr);
        if (*sock < 0) {
            usleep(150000);
            continue;
        }
        if (send_to_siem(*sock, ev) == 0)
            return 0;
        close(*sock);
        *sock = -1;
        usleep(150000);
    }
    return -1;
}

static int siem_sync_mode(void)
{
    const char *v = getenv("SIEM_SYNC_SEND");
    return (v && v[0] && strcmp(v, "0") != 0);
}

static void siem_dispatch_now(const SiemEvent *ev)
{
    if (!g_siem_config.enabled || !g_siem_config.host[0] || !ev)
        return;
    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons(g_siem_config.port);
    inet_pton(AF_INET, g_siem_config.host, &addr.sin_addr);
    int rounds = siem_sync_mode() ? 8 : 1;
    for (int r = 0; r < rounds; r++) {
        int sock = -1;
        if (siem_send_event(&sock, &addr, ev) == 0) {
            if (sock >= 0)
                close(sock);
            return;
        }
        if (sock >= 0)
            close(sock);
        if (r + 1 < rounds)
            usleep(250000);
    }
    if (getenv("SIEM_E2E_DEBUG") || siem_sync_mode())
        fprintf(stderr, "[SIEM_SYNC] send fail fmt=%s port=%d\n",
                g_siem_config.format, g_siem_config.port);
}

static void siem_enqueue_event(const SiemEvent *ev)
{
    pthread_mutex_lock(&g_siem_mutex);
    if (g_queue_count < SIEM_QUEUE_SIZE) {
        g_siem_queue[g_queue_head] = *ev;
        g_queue_head = (g_queue_head + 1) % SIEM_QUEUE_SIZE;
        g_queue_count++;
        pthread_cond_signal(&g_siem_cond);
    }
    pthread_mutex_unlock(&g_siem_mutex);
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

        if (siem_send_event(&sock, &server_addr, &ev) < 0) {
            /* Basarisiz olursa paketi dusuruyoruz (DDoS altinda kuyruk birikmesin diye) */
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
    if (!alert)
        return;
    if (!siem_sync_mode() && !g_siem_running)
        return;

    SiemEvent ev = {0};
    ev.alert = *alert;
    strncpy(ev.sensor_type, sensor_type ? sensor_type : "sensor", 31);
    ev.sensor_type[31] = '\0';
    strncpy(ev.event_type, "alert", sizeof(ev.event_type) - 1);
    ev.risk_score = -1.0;
    ev.policy[0] = '\0';

    if (siem_sync_mode()) {
        siem_dispatch_now(&ev);
        return;
    }
    siem_enqueue_event(&ev);
}

void siem_forwarder_publish_ban(const char *ip, time_t ts, const char *reason,
                                double risk_score, const char *policy) {
    if (!ip || !ip[0])
        return;
    if (!siem_sync_mode() && !g_siem_running)
        return;

    SiemEvent ev = {0};
    ev.alert.level = ALERT_CRIT;
    ev.alert.ts = ts > 0 ? ts : time(NULL);
    strncpy(ev.alert.ip, ip, sizeof(ev.alert.ip) - 1);
    snprintf(ev.alert.message, sizeof(ev.alert.message), "%s",
             (reason && reason[0]) ? reason : "kernel-ban");
    strncpy(ev.alert.mitre_id, MITRE_T1190, sizeof(ev.alert.mitre_id) - 1);
    strncpy(ev.alert.mitre_tactic, "Response", sizeof(ev.alert.mitre_tactic) - 1);
    strncpy(ev.sensor_type, "ban-pipeline", 31);
    ev.sensor_type[31] = '\0';
    strncpy(ev.event_type, "ban", sizeof(ev.event_type) - 1);
    ev.risk_score = risk_score;
    if (policy && policy[0])
        strncpy(ev.policy, policy, sizeof(ev.policy) - 1);

    if (siem_sync_mode()) {
        siem_dispatch_now(&ev);
        return;
    }
    siem_enqueue_event(&ev);
}

void siem_forwarder_stop(void) {
    if (!g_siem_running && !g_siem_thread_started) return;

    /* Kuyruktaki olaylarin gonderilmesi icin drain (max ~5s) */
    for (int i = 0; i < 100; i++) {
        pthread_mutex_lock(&g_siem_mutex);
        int pending = g_queue_count;
        pthread_mutex_unlock(&g_siem_mutex);
        if (pending == 0)
            break;
        usleep(50000);
    }

    g_siem_running = 0;

    pthread_mutex_lock(&g_siem_mutex);
    pthread_cond_broadcast(&g_siem_cond);
    pthread_mutex_unlock(&g_siem_mutex);

    if (g_siem_thread_started) {
        pthread_join(g_siem_thread, NULL);
        g_siem_thread_started = 0;
    }
}
