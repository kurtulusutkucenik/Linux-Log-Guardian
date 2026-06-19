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

/* ── CIDR matching (IPv4 + basit IPv6 ::1/128) ─────────────── */

static int ipv4_to_host32(const char *ip, uint32_t *host_out)
{
    struct in_addr a;
    if (inet_pton(AF_INET, ip, &a) != 1)
        return -1;
    *host_out = ntohl(a.s_addr);
    return 0;
}

int ip_matches_cidr(const char *ip, const char *cidr)
{
    if (!ip || !cidr || !*ip || !*cidr)
        return 0;

    char buf[80];
    size_t n = strlen(cidr);
    if (n >= sizeof(buf))
        n = sizeof(buf) - 1;
    memcpy(buf, cidr, n);
    buf[n] = '\0';

    char *slash = strchr(buf, '/');
    int plen = 32;
    if (slash) {
        *slash = '\0';
        plen = atoi(slash + 1);
        if (plen < 0 || plen > 32)
            return 0;
    }

    if (strcmp(buf, "::1") == 0 && strcmp(ip, "::1") == 0)
        return (plen >= 128 || plen == 0);

    uint32_t addr, net;
    if (ipv4_to_host32(ip, &addr) != 0 || ipv4_to_host32(buf, &net) != 0)
        return 0;

    uint32_t mask = (plen == 0) ? 0u : (0xFFFFFFFFu << (32 - plen));
    return (addr & mask) == (net & mask);
}

int ip_matches_cidr_list(const char *ip, const char cidrs[][64], int count)
{
    if (!ip || !cidrs || count <= 0)
        return 0;
    for (int i = 0; i < count; i++) {
        if (cidrs[i][0] && ip_matches_cidr(ip, cidrs[i]))
            return 1;
    }
    return 0;
}

int ipc_clamp_v4_prefix(uint8_t prefix)
{
    if (prefix == 0)
        return 32;
    if (prefix > 32)
        return 32;
    return (int)prefix;
}

int ipc_validate_ban_ipv4(const char *ip, uint8_t *prefix_io)
{
    if (!ip || !is_valid_ip(ip) || is_ipv6_addr(ip))
        return -1;
    struct in_addr a;
    if (inet_pton(AF_INET, ip, &a) != 1)
        return -1;
    if (prefix_io)
        *prefix_io = (uint8_t)ipc_clamp_v4_prefix(*prefix_io);
    return 0;
}

int ipc_validate_ban_ipv6(const char *ip)
{
    if (!ip || !is_valid_ip(ip) || !is_ipv6_addr(ip))
        return -1;
    struct in6_addr a;
    return inet_pton(AF_INET6, ip, &a) == 1 ? 0 : -1;
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

static int run_ipset_destroy(const char *set_name)
{
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), "destroy", (char *)set_name, NULL
        };
        char *const envp[] = { NULL };
        execve(ipset_bin(), argv_exec, envp);
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

/* threat_intel.sh hash:net kullanir; eski hash:ip seti create -exist ile kalir ve add FAIL olur */
static int ipset_read_type(const char *set_name, char *typ, size_t typ_sz)
{
    int pipefd[2];
    if (pipe(pipefd) < 0)
        return -1;

    pid_t pid = fork();
    if (pid < 0) {
        close(pipefd[0]);
        close(pipefd[1]);
        return -1;
    }
    if (pid == 0) {
        close(pipefd[0]);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[1]);
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), "list", (char *)set_name, NULL
        };
        char *const envp[] = { NULL };
        execve(ipset_bin(), argv_exec, envp);
        _exit(127);
    }

    close(pipefd[1]);
    typ[0] = '\0';
    char line[256];
    ssize_t total = 0;
    while (total < (ssize_t)(sizeof(line) - 1)) {
        ssize_t r = read(pipefd[0], line + total, sizeof(line) - 1 - (size_t)total);
        if (r <= 0)
            break;
        total += r;
    }
    close(pipefd[0]);
    int status = 0;
    waitpid(pid, &status, 0);
    if (total <= 0 || !WIFEXITED(status) || WEXITSTATUS(status) != 0)
        return -1;
    line[total] = '\0';

    const char *pfx = "Type: ";
    char *hit = strstr(line, pfx);
    if (!hit)
        return -1;
    hit += strlen(pfx);
    char *nl = strchr(hit, '\n');
    size_t n = nl ? (size_t)(nl - hit) : strlen(hit);
    if (n >= typ_sz)
        n = typ_sz - 1;
    memcpy(typ, hit, n);
    typ[n] = '\0';
    while (n > 0 && (typ[n - 1] == '\r' || typ[n - 1] == ' '))
        typ[--n] = '\0';
    return 0;
}

static int ipset_family_type_ok(const char *set_name, const char *want_type)
{
    char typ[48] = {0};
    if (ipset_read_type(set_name, typ, sizeof(typ)) != 0)
        return 0;
    return strcmp(typ, want_type) == 0;
}

int run_ipset_create(const char *set_name, const char *family) {
    pid_t pid = fork();
    if (pid < 0) return -1;
    if (pid == 0) {
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), "create", (char *)set_name,
            "hash:net", "family", (char *)family, "maxelem", "65536", "-exist", NULL
        };
        char *const envp[] = { NULL };
        execve(ipset_bin(), argv_exec, envp);
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

static void strip_fw_rules(const char *bin, const char *set_name)
{
    while (run_fw_rule(bin, "-D", set_name) == 0)
        ;
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
        execve(ipset_bin(), argv_exec, envp);
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}

int ipset_list_v4_members(char ips[][64], int max_ips, int *total_in_set)
{
    if (total_in_set)
        *total_in_set = 0;
    if (!ips || max_ips <= 0)
        return 0;

    int pipefd[2];
    if (pipe(pipefd) < 0)
        return -1;

    pid_t pid = fork();
    if (pid < 0) {
        close(pipefd[0]);
        close(pipefd[1]);
        return -1;
    }
    if (pid == 0) {
        close(pipefd[0]);
        dup2(pipefd[1], STDOUT_FILENO);
        close(pipefd[1]);
        child_suppress_stderr();
        char *const argv_exec[] = {
            (char *)ipset_bin(), "list", (char *)g_ipset_v4, "-o", "plain", NULL
        };
        char *const envp[] = { NULL };
        execve(ipset_bin(), argv_exec, envp);
        _exit(127);
    }

    close(pipefd[1]);
    int written = 0;
    int total = 0;
    char line[256];
    FILE *fp = fdopen(pipefd[0], "r");
    if (!fp) {
        close(pipefd[0]);
        waitpid(pid, NULL, 0);
        return -1;
    }
    while (fgets(line, sizeof(line), fp)) {
        char ip[64] = {0};
        if (sscanf(line, "%63s", ip) != 1)
            continue;
        if (strchr(ip, '.') == NULL)
            continue;
        total++;
        if (written < max_ips) {
            strncpy(ips[written], ip, 63);
            ips[written][63] = '\0';
            written++;
        }
    }
    fclose(fp);
    waitpid(pid, NULL, 0);
    if (total_in_set)
        *total_in_set = total;
    return written;
}

/* ── High-level API ──────────────────────────────────────────── */

int ensure_ipset_ready(void) {
    if (!ipset_family_type_ok(g_ipset_v4, "hash:net")) {
        if (!g_output_json)
            fprintf(stderr,
                    "[IPSET] %s uyumsuz/eksik — hash:net olarak yeniden olusturuluyor\n",
                    g_ipset_v4);
        strip_fw_rules("/sbin/iptables", g_ipset_v4);
        run_ipset_destroy(g_ipset_v4);
    }
    if (!ipset_family_type_ok(g_ipset_v6, "hash:net")) {
        strip_fw_rules("/sbin/ip6tables", g_ipset_v6);
        run_ipset_destroy(g_ipset_v6);
    }
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
int ip_is_blocked(const char *ip) { (void)ip; return 0; }
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

int ip_is_blocked(const char *ip)
{
    if (!ip || !is_valid_ip(ip))
        return 0;
    return run_ipset_ip("test", ipset_name_for_ip(ip), ip) == 0;
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
