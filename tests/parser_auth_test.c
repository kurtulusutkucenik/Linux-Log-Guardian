/* parser_auth_test.c — auth.log / journald sshd satirlari */
#include "parser.h"
#include <stdio.h>
#include <string.h>

int g_output_json = 1;
int g_ipc_fd = -1;

static int g_fail;

static void expect(int cond, const char *msg)
{
    if (!cond) {
        fprintf(stderr, "[FAIL] %s\n", msg);
        g_fail++;
    }
}

static void ip_from_entry(const LogEntry *e, char *out, size_t cap)
{
    size_t n = e->ip.len;
    if (n >= cap)
        n = cap - 1;
    memcpy(out, e->ip.ptr, n);
    out[n] = '\0';
}

static void sv_from_entry(const char *label, StrView sv, const char *want)
{
    char buf[256];
    size_t n = sv.len;
    if (n >= sizeof(buf))
        n = sizeof(buf) - 1;
    memcpy(buf, sv.ptr, n);
    buf[n] = '\0';
    expect(strcmp(buf, want) == 0, label);
}

int main(void)
{
    const char *fail_line =
        "2026-06-22T02:40:01+03:00 kurtulus sshd[44001]: "
        "Failed password for invalid user admin from 203.0.113.220 port 22 ssh2";
    const char *ok_line =
        "Jun 22 02:40:04 kurtulus sshd[44002]: "
        "Accepted publickey for deploy from 192.168.1.50 port 22 ssh2";

    LogEntry e;
    char ip[64];

    expect(parse_log_line(fail_line, strlen(fail_line), &e) == 0, "parse sshd failed-password");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.220") == 0, "failed-password IP");
    expect(e.status == 401, "failed-password status 401");
    sv_from_entry("failed-password path", e.url, "/sshd/failed-password");
    sv_from_entry("ssh method", e.method, "SSH");

    expect(parse_log_line(ok_line, strlen(ok_line), &e) == 0, "parse sshd accepted");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "192.168.1.50") == 0, "accepted IP");
    expect(e.status == 200, "accepted status 200");
    sv_from_entry("accepted path", e.url, "/sshd/accepted");

    const char *closed_line =
        "2026-06-22T02:40:05+03:00 host sshd[1]: "
        "Connection closed by 203.0.113.221 port 22 [preauth]";
    const char *disc_line =
        "2026-06-22T02:40:06+03:00 host sshd[2]: "
        "Received disconnect from 203.0.113.222 port 22:11: Bye [preauth]";
    const char *auth_disc_line =
        "2026-06-22T02:40:07+03:00 host sshd[3]: "
        "Disconnected from authenticating user root 203.0.113.223 port 22 [preauth]";

    expect(parse_log_line(closed_line, strlen(closed_line), &e) == 0, "parse connection closed");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.221") == 0, "connection closed IP");
    sv_from_entry("connection closed path", e.url, "/sshd/disconnect");

    expect(parse_log_line(disc_line, strlen(disc_line), &e) == 0, "parse received disconnect");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.222") == 0, "received disconnect IP");

    expect(parse_log_line(auth_disc_line, strlen(auth_disc_line), &e) == 0, "parse auth disconnect");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.223") == 0, "auth disconnect IP");

    const char *sudo_line =
        "2026-06-22T02:41:01+03:00 kurtulus sudo[45001]: "
        "pam_unix(sudo:auth): authentication failure; rhost=203.0.113.225 user=root";
    expect(parse_log_line(sudo_line, strlen(sudo_line), &e) == 0, "parse sudo rhost");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.225") == 0, "sudo rhost IP");
    sv_from_entry("sudo path", e.url, "/sudo/auth-failure");

    const char *usec_line =
        "2026-06-22T02:40:01.123456+03:00 kurtulus sshd[44001]: "
        "Failed password for root from 203.0.113.224 port 22 ssh2";
    expect(parse_log_line(usec_line, strlen(usec_line), &e) == 0, "parse journald usec timestamp");
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.224") == 0, "usec line IP");

    if (g_fail == 0)
        fprintf(stderr, "[OK] parser_auth_test\n");
    else
        fprintf(stderr, "[FAIL] parser_auth_test (%d)\n", g_fail);
    return g_fail ? 1 : 0;
}
