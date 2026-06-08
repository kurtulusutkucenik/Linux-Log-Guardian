#define _GNU_SOURCE
#include "firewall.h"
#ifndef LOG_GUARDIAN_DAEMON
#include "ban_pipeline.h"
#endif
#include "logger.h"
#ifndef LOG_GUARDIAN_DAEMON
#include "daemon_ipc.h"
#include "xdp_loader.h"
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <arpa/inet.h>
#include <sys/wait.h>

/* ── External globals from main.c ────────────────────────────── */
extern int g_output_json;
extern int g_ipc_fd;

/* ── ipset set names ─────────────────────────────────────────── */
const char *g_ipset_v4 = "log_analyzer_block_v4";
const char *g_ipset_v6 = "log_analyzer_block_v6";

/* ── IP validation ───────────────────────────────────────────── */

int is_valid_ip(const char *ip) {
    if (!ip || !*ip) return 0;
    unsigned char v4[4], v6[16];
    if (inet_pton(AF_INET,  ip, v4) == 1) return 1;
    if (inet_pton(AF_INET6, ip, v6) == 1) return 1;
    return 0;
}

int is_ipv6_addr(const char *ip) {
    return strchr(ip, ':') != NULL;
}

const char *ipset_name_for_ip(const char *ip) {
    return is_ipv6_addr(ip) ? g_ipset_v6 : g_ipset_v4;
}

/* ── Low-level execve wrappers ───────────────────────────────── */

/* Helper: open /dev/null and redirect stderr to it in child. */
static void child_suppress_stderr(void) {
    int devnull = open("/dev/null", O_WRONLY);
    if (devnull >= 0) { dup2(devnull, STDERR_FILENO); close(devnull); }
}

static const char *resolve_bin(const char *name, const char *fallback)
{
    static char path_us[48];
    static char path_s[48];
    const char *candidates[4];
    size_t n = 0;
    if (fallback && fallback[0])
        candidates[n++] = fallback;
    snprintf(path_us, sizeof(path_us), "/usr/sbin/%s", name);
    candidates[n++] = path_us;
    snprintf(path_s, sizeof(path_s), "/sbin/%s", name);
    candidates[n++] = path_s;
    candidates[n++] = name;
    for (size_t i = 0; i < n; i++) {
        if (access(candidates[i], X_OK) == 0)
            return candidates[i];
    }
    return name;
}

static const char *ipset_bin(void) { return resolve_bin("ipset", "/sbin/ipset"); }

int run_ipset_create(const char *set_name, const char *family) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), "create", (char *)set_name,
            "hash:ip", "family", (char *)family, "-exist", NULL
        };
        char *const envp[] = { NULL };
        execve("/sbin/ipset", argv_exec, envp);
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

int run_fw_rule(const char *bin, const char *op, const char *set_name) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)bin, (char *)op, "INPUT",
            "-m", "set", "--match-set", (char *)set_name, "src",
            "-j", "DROP", NULL
        };
        char *const envp[] = { NULL };
        execve(bin, argv_exec, envp);
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

int ensure_fw_rule(const char *bin, const char *set_name) {
    if (run_fw_rule(bin, "-C", set_name) == 0) return 0;
    return run_fw_rule(bin, "-I", set_name);
}

int run_ipset_ip(const char *op, const char *set_name, const char *ip) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), (char *)op, (char *)set_name, (char *)ip, "-exist", NULL
        };
        char *const envp[] = { NULL };
        execve("/sbin/ipset", argv_exec, envp);
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

/* ── High-level API ──────────────────────────────────────────── */

int ensure_ipset_ready(void) {
    int rc_v4 = run_ipset_create(g_ipset_v4, "inet");
    int rc_v6 = run_ipset_create(g_ipset_v6, "inet6");
    int fw4   = ensure_fw_rule("/sbin/iptables",  g_ipset_v4);
    int fw6   = ensure_fw_rule("/sbin/ip6tables", g_ipset_v6);
    if (rc_v4 == 0 && rc_v6 == 0 && fw4 == 0 && fw6 == 0) return 0;
    if (!g_output_json)
        fprintf(stderr,
                "[UYARI] ipset/firewall hazirlama basarisiz "
                "(set_v4=%d set_v6=%d fw_v4=%d fw_v6=%d). "
                "Root yetkisi ve ilgili binaryler gerekli.\n",
                rc_v4, rc_v6, fw4, fw6);
    return -1;
}

#ifdef LOG_GUARDIAN_DAEMON
int ban_ip(const char *ip) { (void)ip; return -1; }
int ban_ip_with_reason(const char *ip, const char *reason) { (void)ip; (void)reason; return -1; }
int unban_ip(const char *ip) { (void)ip; return -1; }
#else
int ban_ip(const char *ip)
{
    return ban_pipeline_ban(ip, NULL, NULL);
}

int ban_ip_with_reason(const char *ip, const char *reason)
{
    if (reason && reason[0])
        log_rl(LOG_INFO, "[BAN] %s — %s", ip, reason);
    return ban_pipeline_ban(ip, reason, NULL);
}

int unban_ip(const char *ip)
{
    return ban_pipeline_unban(ip);
}
#endif

void send_desktop_notification(const char *ip) {
    pid_t pid = fork();
    if (pid == 0) {
        char *const argv_exec[] = {
            "/usr/bin/notify-send", "-u", "critical",
            "Saldiri engellendi", (char *)ip, NULL
        };
        char *const envp[] = {
            "DISPLAY=:0",
            "DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus",
            NULL
        };
        execve("/usr/bin/notify-send", argv_exec, envp);
        _exit(127);
    }
    /* Non-blocking: parent continues; SIGCHLD handles reaping. */
}
