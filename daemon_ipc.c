/* daemon_ipc.c — IPC Client Stub
 *
 * Analyzer (yetkisiz proses) tarafından kullanılır.
 * Tüm XDP ban/unban isteklerini root daemon'a iletir.
 */
#define _GNU_SOURCE
#include "daemon_ipc.h"
#include "ipc_auth.h"
#include "logger.h"

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <unistd.h>
#include <errno.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <arpa/inet.h>

void daemon_ipc_fill_auth(IpcMessage *msg)
{
    if (!msg)
        return;
    msg->auth_token = ipc_auth_token_for_message();
}

static void ipc_fill_auth(IpcMessage *msg)
{
    daemon_ipc_fill_auth(msg);
}

int daemon_ipc_connect(void) {
    int fd = socket(AF_UNIX, SOCK_SEQPACKET | SOCK_CLOEXEC, 0);
    if (fd < 0) {
        log_rl(LOG_ERR, "[IPC] socket() hatasi: %s", strerror(errno));
        return -1;
    }

    struct timeval conn_tv = { .tv_sec = 2, .tv_usec = 0 };
    struct timeval recv_tv = { .tv_sec = 2, .tv_usec = 0 };
    setsockopt(fd, SOL_SOCKET, SO_SNDTIMEO, &conn_tv, sizeof(conn_tv));
    setsockopt(fd, SOL_SOCKET, SO_RCVTIMEO, &recv_tv, sizeof(recv_tv));

    struct sockaddr_un addr;
    memset(&addr, 0, sizeof(addr));
    addr.sun_family = AF_UNIX;
    strncpy(addr.sun_path, DAEMON_IPC_SOCK_PATH, sizeof(addr.sun_path) - 1);

    if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        log_rl(LOG_WARNING, "[IPC] Daemon'a baglanamadi (%s): %s",
               DAEMON_IPC_SOCK_PATH, strerror(errno));
        close(fd);
        return -1;
    }
    return fd;
}

int daemon_ipc_send(int fd, const IpcMessage *msg, IpcResponse *resp) {
    ssize_t n = send(fd, msg, sizeof(*msg), MSG_NOSIGNAL);
    if (n != (ssize_t)sizeof(*msg)) {
        log_rl(LOG_ERR, "[IPC] send() hatasi: %s", strerror(errno));
        return -1;
    }

    if (!resp) return 0;

    n = recv(fd, resp, sizeof(*resp), 0);
    if (n != (ssize_t)sizeof(*resp)) {
        log_rl(LOG_ERR, "[IPC] recv() hatasi: %s", strerror(errno));
        return -1;
    }
    return resp->ok == 0 ? 0 : -1;
}

void daemon_ipc_close(int fd) {
    if (fd >= 0) close(fd);
}

/* ── Kolaylık sarmalayıcılar ────────────────────────────────── */

static int _ipc_one_shot(IpcCmd cmd, const char *ip, uint8_t prefix) {
    int fd = daemon_ipc_connect();
    if (fd < 0) return -1;

    IpcMessage msg;
    memset(&msg, 0, sizeof(msg));
    msg.cmd    = cmd;
    msg.prefix = prefix;
    strncpy(msg.ip, ip, sizeof(msg.ip) - 1);
    ipc_fill_auth(&msg);

    IpcResponse resp;
    int rc = daemon_ipc_send(fd, &msg, &resp);
    daemon_ipc_close(fd);

    if (rc != 0) {
        log_rl(LOG_WARNING, "[IPC] Komut basarisiz: %s — %s", ip, resp.errmsg);
    }
    return rc;
}

static int _ipc_one_shot_prob(IpcCmd cmd, const char *ip, uint8_t prefix, uint8_t prob) {
    int fd = daemon_ipc_connect();
    if (fd < 0) return -1;

    IpcMessage msg;
    memset(&msg, 0, sizeof(msg));
    msg.cmd    = cmd;
    msg.prefix = prefix;
    msg.prob   = prob;
    strncpy(msg.ip, ip, sizeof(msg.ip) - 1);
    ipc_fill_auth(&msg);

    IpcResponse resp;
    int rc = daemon_ipc_send(fd, &msg, &resp);
    daemon_ipc_close(fd);

    if (rc != 0) {
        log_rl(LOG_WARNING, "[IPC] Komut basarisiz: %s — %s", ip, resp.errmsg);
    }
    return rc;
}

int daemon_ipc_ban_ipv4(const char *ip_cidr) {
    if (!ip_cidr) return -1;
    char ip_buf[46];
    strncpy(ip_buf, ip_cidr, sizeof(ip_buf) - 1);
    ip_buf[sizeof(ip_buf) - 1] = '\0';

    uint8_t prefix = 32;
    char *slash = strchr(ip_buf, '/');
    if (slash) {
        *slash = '\0';
        long p = strtol(slash + 1, NULL, 10);
        prefix = (p > 0 && p <= 32) ? (uint8_t)p : 32;
    }
    return _ipc_one_shot(IPC_CMD_BAN_V4, ip_buf, prefix);
}

int daemon_ipc_ban_ipv6(const char *ip) {
    return _ipc_one_shot(IPC_CMD_BAN_V6, ip ? ip : "", 128);
}

int daemon_ipc_unban_ipv4(const char *ip_cidr) {
    if (!ip_cidr) return -1;
    char ip_buf[46];
    strncpy(ip_buf, ip_cidr, sizeof(ip_buf) - 1);
    ip_buf[sizeof(ip_buf) - 1] = '\0';

    uint8_t prefix = 32;
    char *slash = strchr(ip_buf, '/');
    if (slash) {
        *slash = '\0';
        long p = strtol(slash + 1, NULL, 10);
        prefix = (p > 0 && p <= 32) ? (uint8_t)p : 32;
    }
    return _ipc_one_shot(IPC_CMD_UNBAN_V4, ip_buf, prefix);
}

int daemon_ipc_unban_ipv6(const char *ip) {
    return _ipc_one_shot(IPC_CMD_UNBAN_V6, ip ? ip : "", 128);
}

int daemon_ipc_tarpit_ipv4(const char *ip_cidr, uint8_t probability) {
    if (!ip_cidr) return -1;
    char ip_buf[46];
    strncpy(ip_buf, ip_cidr, sizeof(ip_buf) - 1);
    ip_buf[sizeof(ip_buf) - 1] = '\0';

    uint8_t prefix = 32;
    char *slash = strchr(ip_buf, '/');
    if (slash) {
        *slash = '\0';
        long p = strtol(slash + 1, NULL, 10);
        prefix = (p > 0 && p <= 32) ? (uint8_t)p : 32;
    }
    return _ipc_one_shot_prob(IPC_CMD_TARPIT_V4, ip_buf, prefix, probability);
}

int daemon_ipc_tarpit_ipv6(const char *ip, uint8_t probability) {
    if (!ip) return -1;
    return _ipc_one_shot_prob(IPC_CMD_TARPIT_V6, ip, 128, probability);
}
int daemon_ipc_ping(void) {
    IpcMessage msg;
    memset(&msg, 0, sizeof(msg));
    msg.cmd = IPC_CMD_PING;
    ipc_fill_auth(&msg);

    for (int attempt = 0; attempt < 3; attempt++) {
        int fd = daemon_ipc_connect();
        if (fd < 0) {
            if (attempt < 2) {
                usleep(200000);
                continue;
            }
            return -1;
        }
        IpcResponse resp;
        int rc = daemon_ipc_send(fd, &msg, &resp);
        daemon_ipc_close(fd);
        if (rc == 0)
            return 0;
        if (attempt < 2)
            usleep(200000);
    }
    return -1;
}
