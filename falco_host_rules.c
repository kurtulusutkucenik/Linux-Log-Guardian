/* falco_host_rules.c — Lineage/execve olaylarinda Falco-benzeri esleme */
#define _GNU_SOURCE
#include "falco_host_rules.h"
#include "incident_engine.h"
#include <stdio.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>

#define FALCO_DYN_MAX 512

typedef struct {
    LineageEventType type;   /* -1 = any */
    const char      *comm_sub;
    const char      *detail_sub;
    uint32_t         inc_sig;
    const char      *name;
} FalcoHostRule;

typedef struct {
    LineageEventType type;
    char             comm_sub[32];
    char             detail_sub[96];
    uint32_t         inc_sig;
    char             name[128];
} FalcoDynRule;

static FalcoDynRule g_dyn[FALCO_DYN_MAX];
static size_t       g_dyn_n;

static LineageEventType parse_lineage_type(const char *s)
{
    if (!s) return (LineageEventType)-1;
    if (strcmp(s, "execve") == 0)  return LINEAGE_EXECVE;
    if (strcmp(s, "openat") == 0) return LINEAGE_OPENAT;
    if (strcmp(s, "write") == 0)   return LINEAGE_WRITE;
    if (strcmp(s, "connect") == 0) return LINEAGE_CONNECT;
    return (LineageEventType)-1;
}

static uint32_t parse_inc_sig(const char *s)
{
    if (!s) return INC_SIG_EBPF_LINEAGE;
    if (strstr(s, "EXECVE"))   return INC_SIG_EBPF_EXECVE;
    if (strstr(s, "OUTBOUND")) return INC_SIG_EBPF_OUTBOUND;
    if (strstr(s, "LINEAGE"))  return INC_SIG_EBPF_LINEAGE;
    return INC_SIG_EBPF_LINEAGE;
}

int falco_host_rules_load_file(const char *path)
{
    if (!path || !path[0]) return -1;
    FILE *f = fopen(path, "r");
    if (!f) return -1;
    char line[512];
    g_dyn_n = 0;
    while (fgets(line, sizeof(line), f) && g_dyn_n < FALCO_DYN_MAX) {
        if (line[0] == '#' || line[0] == '\n') continue;
        char type_s[16], comm[32], detail[96], name[128], sig[48];
        type_s[0] = comm[0] = detail[0] = name[0] = sig[0] = '\0';
        int n = sscanf(line, "%15[^|]|%31[^|]|%95[^|]|%127[^|]|%47s",
                       type_s, comm, detail, name, sig);
        if (n < 4) continue;
        FalcoDynRule *d = &g_dyn[g_dyn_n++];
        d->type = parse_lineage_type(type_s);
        strncpy(d->comm_sub, comm, sizeof(d->comm_sub) - 1);
        strncpy(d->detail_sub, detail, sizeof(d->detail_sub) - 1);
        strncpy(d->name, name, sizeof(d->name) - 1);
        d->inc_sig = parse_inc_sig(sig);
    }
    fclose(f);
    return (int)g_dyn_n;
}

static const FalcoHostRule g_rules[] = {
    { LINEAGE_EXECVE,  "sh",      NULL,           INC_SIG_EBPF_EXECVE,    "Terminal shell spawned" },
    { LINEAGE_EXECVE,  "bash",    NULL,           INC_SIG_EBPF_EXECVE,    "Terminal shell spawned" },
    { LINEAGE_EXECVE,  "dash",    NULL,           INC_SIG_EBPF_EXECVE,    "Terminal shell spawned" },
    { LINEAGE_EXECVE,  "zsh",     NULL,           INC_SIG_EBPF_EXECVE,    "Terminal shell spawned" },
    { LINEAGE_EXECVE,  "nc",      NULL,           INC_SIG_EBPF_EXECVE,    "Netcat execution" },
    { LINEAGE_EXECVE,  "ncat",    NULL,           INC_SIG_EBPF_EXECVE,    "Netcat execution" },
    { LINEAGE_EXECVE,  "python",  "-c",           INC_SIG_EBPF_EXECVE,    "Python one-liner" },
    { LINEAGE_EXECVE,  "perl",    "-e",           INC_SIG_EBPF_EXECVE,    "Perl one-liner" },
    { LINEAGE_EXECVE,  "curl",    NULL,           INC_SIG_EBPF_EXECVE,    "Curl exec from web" },
    { LINEAGE_EXECVE,  "wget",    NULL,           INC_SIG_EBPF_EXECVE,    "Wget exec from web" },
    { LINEAGE_OPENAT,  NULL,      "/etc/passwd",  INC_SIG_EBPF_LINEAGE,   "Read sensitive file" },
    { LINEAGE_OPENAT,  NULL,      "/etc/shadow",  INC_SIG_EBPF_LINEAGE,   "Read sensitive file" },
    { LINEAGE_OPENAT,  NULL,      ".ssh/",        INC_SIG_EBPF_LINEAGE,   "SSH key access" },
    { LINEAGE_OPENAT,  NULL,      "id_rsa",       INC_SIG_EBPF_LINEAGE,   "SSH key access" },
    { LINEAGE_OPENAT,  NULL,      "/proc/self",   INC_SIG_EBPF_LINEAGE,   "Proc enumeration" },
    { LINEAGE_WRITE,   NULL,      "/etc/",        INC_SIG_EBPF_LINEAGE,   "Write below etc" },
    { LINEAGE_WRITE,   NULL,      "crontab",      INC_SIG_EBPF_LINEAGE,   "Cron persistence" },
    { LINEAGE_WRITE,   NULL,      ".bashrc",      INC_SIG_EBPF_LINEAGE,   "Shell profile write" },
    { LINEAGE_WRITE,   NULL,      "webshell",     INC_SIG_EBPF_LINEAGE,   "Webshell drop" },
    { LINEAGE_WRITE,   NULL,      ".php",         INC_SIG_EBPF_LINEAGE,   "PHP file write" },
    { LINEAGE_CONNECT, NULL,      ":4444",        INC_SIG_EBPF_OUTBOUND,  "Suspicious outbound" },
    { LINEAGE_CONNECT, NULL,      ":1337",        INC_SIG_EBPF_OUTBOUND,  "Suspicious outbound" },
    { LINEAGE_CONNECT, NULL,      "tor",          INC_SIG_EBPF_OUTBOUND,  "Tor-like connect" },
    { LINEAGE_CONNECT, NULL,      "pastebin",     INC_SIG_EBPF_OUTBOUND,  "C2-like host" },
    { LINEAGE_CONNECT, NULL,      "ngrok",        INC_SIG_EBPF_OUTBOUND,  "Tunnel egress" },
    { -1,              NULL,      "memfd",        INC_SIG_EBPF_EXECVE,    "Memfd execution" },
};

static int ci_contains(const char *hay, const char *needle)
{
    if (!hay || !needle || !needle[0]) return 0;
    size_t nlen = strlen(needle);
    size_t hlen = strlen(hay);
    if (nlen > hlen) return 0;
    for (size_t i = 0; i <= hlen - nlen; i++) {
        size_t j;
        for (j = 0; j < nlen; j++) {
            char a = hay[i + j], b = needle[j];
            if (a >= 'A' && a <= 'Z') a = (char)(a + 32);
            if (b >= 'A' && b <= 'Z') b = (char)(b + 32);
            if (a != b) break;
        }
        if (j == nlen) return 1;
    }
    return 0;
}

void falco_host_rules_init(void) {}

static int match_one(LineageEventType rule_type,
                     const char *comm_sub, const char *detail_sub,
                     uint32_t inc_sig, const char *rule_name,
                     const LineageEvent *ev,
                     char *rule_name_out, size_t name_sz,
                     uint32_t *incident_signal_out)
{
    if (rule_type >= 0 && (int)ev->type != (int)rule_type) return 0;
    if (comm_sub && comm_sub[0] && !ci_contains(ev->comm, comm_sub)) return 0;
    if (detail_sub && detail_sub[0] && !ci_contains(ev->detail, detail_sub)) return 0;
    if (rule_name_out && name_sz > 0) {
        strncpy(rule_name_out, rule_name, name_sz - 1);
        rule_name_out[name_sz - 1] = '\0';
    }
    if (incident_signal_out) *incident_signal_out = inc_sig;
    return 1;
}

int falco_host_rules_match(const LineageEvent *ev,
                           char *rule_name, size_t name_sz,
                           uint32_t *incident_signal_out)
{
    if (!ev) return 0;
    for (size_t i = 0; i < g_dyn_n; i++) {
        FalcoDynRule *d = &g_dyn[i];
        if (match_one(d->type,
                      d->comm_sub[0] ? d->comm_sub : NULL,
                      d->detail_sub[0] ? d->detail_sub : NULL,
                      d->inc_sig, d->name, ev,
                      rule_name, name_sz, incident_signal_out))
            return 1;
    }
    for (size_t i = 0; i < sizeof(g_rules) / sizeof(g_rules[0]); i++) {
        const FalcoHostRule *r = &g_rules[i];
        if (match_one(r->type, r->comm_sub, r->detail_sub,
                      r->inc_sig, r->name, ev,
                      rule_name, name_sz, incident_signal_out))
            return 1;
    }
    return 0;
}
