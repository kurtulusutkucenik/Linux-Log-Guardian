#define _GNU_SOURCE
#include "ban_pipeline.h"
#include "firewall.h"
#include "daemon_ipc.h"
#include "ipc_auth.h"
#include "xdp_loader.h"
#include "logger.h"

extern int g_ipc_fd;

#include <string.h>
#include <unistd.h>
#include <stdatomic.h>

static BanWhitelistFn       g_whitelist_fn = NULL;
static _Atomic uint64_t     g_stat_ipc     = 0;
static _Atomic uint64_t     g_stat_xdp     = 0;
static _Atomic uint64_t     g_stat_ipset   = 0;
static _Atomic uint64_t     g_stat_skip_wl = 0;
static _Atomic uint64_t     g_stat_fail    = 0;
static _Atomic uint64_t     g_stat_unban   = 0;

#define BAN_IPC_RETRIES 3
#define BAN_IPC_RETRY_US 5000

void ban_pipeline_set_whitelist_fn(BanWhitelistFn fn)
{
    g_whitelist_fn = fn;
}

void ban_pipeline_get_stats(BanPipelineStats *out)
{
    if (!out) return;
    out->via_ipc            = atomic_load(&g_stat_ipc);
    out->via_xdp            = atomic_load(&g_stat_xdp);
    out->via_ipset          = atomic_load(&g_stat_ipset);
    out->skipped_whitelist  = atomic_load(&g_stat_skip_wl);
    out->failed             = atomic_load(&g_stat_fail);
    out->unban_ok           = atomic_load(&g_stat_unban);
}

static int try_ipc_ban(const char *ip)
{
    /* Kalici IPC baglantisi varsa once onu dene */
    if (g_ipc_fd >= 0) {
        IpcMessage msg;
        IpcResponse resp;
        memset(&msg, 0, sizeof(msg));
        msg.cmd = is_ipv6_addr(ip) ? IPC_CMD_BAN_V6 : IPC_CMD_BAN_V4;
        msg.prefix = is_ipv6_addr(ip) ? 128 : 32;
        strncpy(msg.ip, ip, sizeof(msg.ip) - 1);
        daemon_ipc_fill_auth(&msg);
        if (daemon_ipc_send(g_ipc_fd, &msg, &resp) == 0)
            return 0;
    }

    for (int attempt = 0; attempt < BAN_IPC_RETRIES; attempt++) {
        int rc = is_ipv6_addr(ip) ? daemon_ipc_ban_ipv6(ip)
                                  : daemon_ipc_ban_ipv4(ip);
        if (rc == 0) return 0;
        if (attempt + 1 < BAN_IPC_RETRIES)
            usleep(BAN_IPC_RETRY_US * (unsigned)(attempt + 1));
    }
    return -1;
}

static int try_ipset_ban(const char *ip)
{
    const char *set_name = ipset_name_for_ip(ip);
    return run_ipset_ip("add", set_name, ip);
}

int ban_pipeline_ban(const char *ip, const char *reason, BanPath *path_out)
{
    BanPath path = BAN_PATH_FAILED;
    if (reason && reason[0])
        log_rl(LOG_INFO, "[BAN-PIPE] %s (%s)", ip ? ip : "?", reason);

    if (!ip || !is_valid_ip(ip)) {
        path = BAN_PATH_INVALID_IP;
        atomic_fetch_add(&g_stat_fail, 1);
        if (path_out) *path_out = path;
        return -1;
    }

    if (g_whitelist_fn && g_whitelist_fn(ip)) {
        path = BAN_PATH_WHITELIST_SKIP;
        atomic_fetch_add(&g_stat_skip_wl, 1);
        if (path_out) *path_out = path;
        return 0;
    }

    if (try_ipc_ban(ip) == 0) {
        path = BAN_PATH_IPC_XDP;
        atomic_fetch_add(&g_stat_ipc, 1);
        if (path_out) *path_out = path;
        return 0;
    }

    if (xdp_loader_active()) {
        int rc = is_ipv6_addr(ip) ? xdp_ban_ipv6(ip) : xdp_ban_ipv4(ip);
        if (rc == 0) {
            path = BAN_PATH_XDP_DIRECT;
            atomic_fetch_add(&g_stat_xdp, 1);
            if (path_out) *path_out = path;
            return 0;
        }
    }

    if (try_ipset_ban(ip) == 0) {
        path = BAN_PATH_IPSET;
        atomic_fetch_add(&g_stat_ipset, 1);
        if (path_out) *path_out = path;
        return 0;
    }

    atomic_fetch_add(&g_stat_fail, 1);
    log_rl(LOG_WARNING, "[BAN-PIPE] Tum yollar basarisiz: %s", ip);
    if (path_out) *path_out = BAN_PATH_FAILED;
    return -1;
}

int ban_pipeline_unban(const char *ip)
{
    if (!ip || !is_valid_ip(ip)) return -1;

    if (daemon_ipc_ping() == 0) {
        int rc = is_ipv6_addr(ip) ? daemon_ipc_unban_ipv6(ip)
                                  : daemon_ipc_unban_ipv4(ip);
        if (rc == 0) {
            atomic_fetch_add(&g_stat_unban, 1);
            return 0;
        }
    }

    if (xdp_loader_active()) {
        int rc = is_ipv6_addr(ip) ? xdp_unban_ipv6(ip) : xdp_unban_ipv4(ip);
        if (rc == 0) {
            atomic_fetch_add(&g_stat_unban, 1);
            return 0;
        }
    }

    const char *set_name = ipset_name_for_ip(ip);
    if (run_ipset_ip("del", set_name, ip) == 0) {
        atomic_fetch_add(&g_stat_unban, 1);
        return 0;
    }
    if (run_ipset_ip("test", set_name, ip) != 0) {
        atomic_fetch_add(&g_stat_unban, 1);
        return 0;
    }
    return -1;
}
