/* parser_fuzz_test.c — deterministik malformed corpus + mutasyon (crash/UB yok) */
#include "parser.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

int g_output_json = 1;
int g_ipc_fd = -1;

static unsigned g_runs;
static unsigned g_crash;
static unsigned g_corpus_static;
static unsigned g_file_samples;

static void run_one(const char *line, size_t len)
{
    LogEntry e;
    char path[512];
    (void)parse_log_line(line, len, &e);
    (void)url_path_only(line, len > 256 ? 256 : len, path, sizeof(path));
    g_runs++;
}

static void run_corpus(void)
{
    static const char *corpus[] = {
        "",
        " ",
        "\n",
        "\x00\x01\x02",
        "not-a-log-line-at-all",
        "203.0.113.1",
        "203.0.113.1 - -",
        "203.0.113.1 - - [broken",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\"",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 999",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0 \"-\" \"ua\"",
        "[::1] - - [10/Oct/2023:13:55:36 +0000] \"POST /api?id=1 HTTP/1.1\" 201 42 \"-\" \"bot\"",
        "192.168.1.1 - user [10/Oct/2023:13:55:36 +0000] \"GET /path?a=b HTTP/1.1\" 404 0 \"-\" "
        "\"Mozilla\" \"203.0.113.50\" \"body={\" \"host.com\"",
        "sshd[1]: Failed password for root from 1.2.3.4 port 22",
        "sshd[999999]: Accepted publickey for u from not-an-ip port 22",
        "sudo[1]: pam_unix(sudo:auth): authentication failure; user=root ; tty=pts/0 ; "
        "rhost=203.0.113.77",
        "Jun 22 02:40:04 host sshd[1]: Connection closed by 203.0.113.1 port 22 [preauth]",
        "2001:db8::5 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0 \"-\" \"ua\"",
        "[::ffff:203.0.113.1] - - [10/Oct/2023:13:55:36 +0000] \"GET /v6 HTTP/1.1\" 200 0 \"-\" \"ua\"",
        "[::1]:443 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0 \"-\" \"ua\"",
        "10.0.0.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0 \"-\" \"ua\" "
        "\"203.0.113.50, 198.51.100.1\"",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0 \"-\" \"ua\" "
        "\"203.0.113.50\" \"evil.com\"",
        "2026-06-22T02:40:01.123456+03:00 host sshd[1]: Failed password for invalid user "
        "admin from 203.0.113.1 port 22 ssh2",
        "2026-06-22T02:40:01+03:00 host sudo[1]: pam_unix(sudo:auth): authentication failure",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"CONNECT evil.com:443 HTTP/1.1\" 400 0",
        "203.0.113.1 - - [broken ts] \"GET / HTTP/1.1\" 200 0",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET /arama?kelime=%C3%B6rnek HTTP/1.1\" "
        "200 512 \"-\" \"Mozilla/5.0\"",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"POST /giris HTTP/1.1\" 401 128 \"-\" "
        "\"Mozilla/5.0\" \"-\" \"kullanici=admin&parola=x\"",
        "999.999.999.999 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 0",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" -1 0",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET / HTTP/1.1\" 200 999999999999",
        "203.0.113.1\t-\t-\t[10/Oct/2023:13:55:36 +0000]\t\"GET / HTTP/1.1\"\t200",
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"DELETE /api/users/1 HTTP/1.1\" 204 0",
    };
    for (size_t i = 0; i < sizeof(corpus) / sizeof(corpus[0]); i++) {
        run_one(corpus[i], strlen(corpus[i]));
        g_corpus_static++;
    }

    /* uzun satir */
    char long_line[8192];
    memset(long_line, 'A', sizeof(long_line) - 1);
    long_line[sizeof(long_line) - 1] = '\0';
    memcpy(long_line, "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET /", 48);
    run_one(long_line, strlen(long_line));
    g_corpus_static++;

    /* tam nginx ornegi */
    const char *ok =
        "203.0.113.77 - - [10/Oct/2023:13:55:36 +0000] \"GET /admin?id=1 HTTP/1.1\" 200 512 "
        "\"-\" \"scanner/1.0\"";
    run_one(ok, strlen(ok));
    g_corpus_static++;
}

static void run_file_corpus(const char *path, unsigned max_lines)
{
    FILE *f = fopen(path, "r");
    if (!f)
        return;

    char buf[8192];
    unsigned n = 0;
    while (n < max_lines && fgets(buf, sizeof(buf), f)) {
        size_t len = strlen(buf);
        while (len > 0 && (buf[len - 1] == '\n' || buf[len - 1] == '\r'))
            buf[--len] = '\0';
        if (len == 0)
            continue;
        run_one(buf, len);
        g_file_samples++;
        n++;
    }
    fclose(f);
}

static void run_mutations(unsigned rounds)
{
    char buf[512];
    const char seed[] =
        "203.0.113.1 - - [10/Oct/2023:13:55:36 +0000] \"GET /x HTTP/1.1\" 200 0 \"-\" \"ua\"";
    size_t seed_len = strlen(seed);

    for (unsigned r = 0; r < rounds; r++) {
        size_t n = seed_len;
        if (n >= sizeof(buf))
            n = sizeof(buf) - 1;
        memcpy(buf, seed, n);
        unsigned op = (r * 1103515245u + 12345u) & 7u;
        unsigned pos = r % (unsigned)n;
        switch (op) {
        case 0:
            buf[pos] = '\0';
            n = pos;
            break;
        case 1:
            buf[pos] = (char)(r & 0xff);
            break;
        case 2:
            buf[pos] = '"';
            break;
        case 3:
            buf[pos] = '[';
            break;
        case 4:
            n = (pos > 0) ? pos : 1;
            break;
        case 5:
            if (n + 1 < sizeof(buf))
                buf[n++] = (char)('\n' + (r % 3));
            break;
        case 6:
            parser_set_trust_xff((int)(r & 1));
            if (r & 2)
                parser_add_proxy_cidr("10.0.0.0/8,192.168.0.0/16");
            else
                parser_clear_proxy_cidrs();
            break;
        default:
            break;
        }
        run_one(buf, n);
    }
    parser_set_trust_xff(0);
    parser_clear_proxy_cidrs();
}

static void run_timestamp_fuzz(void)
{
    static const char *ts[] = {
        "10/Oct/2023:13:55:36 +0000",
        "bad",
        "99/Foo/2023:99:99:99 +9999",
        "2026-06-22T02:40:01.123456+03:00",
        "",
    };
    for (size_t i = 0; i < sizeof(ts) / sizeof(ts[0]); i++) {
        StrView sv = { ts[i], strlen(ts[i]) };
        (void)parse_timestamp(sv);
        g_runs++;
    }
}

int main(void)
{
    run_corpus();
    run_file_corpus("corpus/bench_mixed.access", 16);
    run_file_corpus("corpus/tr_hosting_corpus.access", 16);
    run_file_corpus("corpus/benign_corpus.access", 8);
    run_mutations(512);
    run_timestamp_fuzz();

    if (g_crash > 0) {
        fprintf(stderr, "[FAIL] parser_fuzz_test — crash=%u runs=%u\n", g_crash, g_runs);
        return 1;
    }
    printf("[OK] parser_fuzz_test — runs=%u corpus=%u file=%u mutations=512\n",
           g_runs, g_corpus_static, g_file_samples);
    return 0;
}
