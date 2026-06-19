/* parser_xff_test.c — XFF spoof / trust proxy regression */
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

int main(void)
{
    const char *line =
        "203.0.113.50 - - [15/Jun/2026:10:00:00 +0000] "
        "\"GET /x HTTP/1.1\" 404 0 \"-\" \"curl\" \"1.2.3.4\" \"-\"";

    parser_clear_proxy_cidrs();
    parser_set_trust_xff(0);

    LogEntry e;
    expect(parse_log_line(line, strlen(line), &e) == 0, "parse with xff off");
    char ip[64];
    ip_from_entry(&e, ip, sizeof(ip));
    expect(strcmp(ip, "203.0.113.50") == 0,
           "TRUST_XFF=0 must keep $remote_addr (spoof blocked)");

    parser_set_trust_xff(1);
    parser_add_proxy_cidr("203.0.113.0/24");

    LogEntry e2;
    expect(parse_log_line(line, strlen(line), &e2) == 0, "parse with trusted proxy");
    ip_from_entry(&e2, ip, sizeof(ip));
    expect(strcmp(ip, "1.2.3.4") == 0,
           "TRUST_XFF=1 + proxy CIDR must use XFF client IP");

    if (g_fail == 0)
        fprintf(stderr, "[OK] parser_xff_test\n");
    else
        fprintf(stderr, "[FAIL] parser_xff_test (%d)\n", g_fail);
    return g_fail ? 1 : 0;
}
