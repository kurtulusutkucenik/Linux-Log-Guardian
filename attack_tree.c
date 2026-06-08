/* attack_tree.c — eBPF Process & Network Lineage Engine (Feature 3) */
#include "attack_tree.h"
#include "falco_host_rules.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <pthread.h>
#include <time.h>
#include <arpa/inet.h>

static AttackTree    g_trees[ATTACK_TREE_MAX_PIDS];
static pthread_mutex_t g_lock = PTHREAD_MUTEX_INITIALIZER;
static atomic_uint_fast64_t g_total_events  = 0;
static atomic_uint_fast64_t g_high_risk_cnt = 0;

void attack_tree_init(void) {
    memset(g_trees, 0, sizeof(g_trees));
}

/* PID'e karşılık gelen slot — basit linear probe */
static AttackTree *find_or_create(pid_t pid) {
    int empty = -1;
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++) {
        if (g_trees[i].active && g_trees[i].root_pid == pid) return &g_trees[i];
        if (!g_trees[i].active && empty < 0) empty = i;
    }
    if (empty < 0) {
        /* En eski ağacı bul ve üzerine yaz */
        time_t oldest = g_trees[0].last_seen;
        empty = 0;
        for (int i = 1; i < ATTACK_TREE_MAX_PIDS; i++) {
            if (g_trees[i].last_seen < oldest) { oldest = g_trees[i].last_seen; empty = i; }
        }
        memset(&g_trees[empty], 0, sizeof(g_trees[empty]));
    }
    g_trees[empty].root_pid = pid;
    g_trees[empty].active   = 1;
    g_trees[empty].first_seen = time(NULL);
    return &g_trees[empty];
}

/* ── Risk skoru hesaplama ───────────────────────────────────────── */
static double calc_risk(const AttackTree *t) {
    double score = 0.0;
    int has_execve = 0, has_connect = 0, has_sensitive = 0, has_write_tmp = 0;

    for (int i = 0; i < t->count; i++) {
        const LineageEvent *e = &t->events[i];
        switch (e->type) {
        case LINEAGE_EXECVE:
            has_execve = 1;
            score += ATREE_RISK_EXECVE_FROM_WEB;
            break;
        case LINEAGE_CONNECT:
            has_connect = 1;
            score += ATREE_RISK_EXTERNAL_CONNECT;
            break;
        case LINEAGE_OPENAT:
            if (strstr(e->detail, "/etc/passwd") || strstr(e->detail, "/etc/shadow") ||
                strstr(e->detail, "id_rsa") || strstr(e->detail, ".ssh/")) {
                has_sensitive = 1;
                score += ATREE_RISK_SENSITIVE_FILE;
            }
            break;
        case LINEAGE_WRITE:
            if (strstr(e->detail, "/tmp/") || strstr(e->detail, "/var/tmp/")) {
                has_write_tmp = 1;
                score += ATREE_RISK_WRITE_TMP;
            }
            break;
        default: break;
        }
    }

    /* Kombo bonus: tam saldırı zinciri */
    if (has_execve && has_connect) score += 15.0;
    if (has_sensitive && has_connect) score += 10.0;
    if (has_execve && has_sensitive && has_connect) score += 20.0;
    if (has_write_tmp && has_execve) score += 10.0;

    return score > 100.0 ? 100.0 : score;
}

void attack_tree_submit(const LineageEvent *ev) {
    if (!ev) return;
    atomic_fetch_add(&g_total_events, 1);

    pthread_mutex_lock(&g_lock);
    AttackTree *t = find_or_create(ev->pid);
    if (t->count < ATTACK_TREE_MAX_EVENTS) {
        t->events[t->count++] = *ev;
        if (t->root_comm[0] == '\0' && ev->comm[0])
            strncpy(t->root_comm, ev->comm, 15);
    }
    t->last_seen  = ev->ts ? ev->ts : time(NULL);
    t->risk_score = calc_risk(t);
    {
        char frule[FALCO_RULE_NAME_LEN];
        uint32_t sig = 0;
        if (falco_host_rules_match(ev, frule, sizeof(frule), &sig)) {
            t->risk_score += 18.0;
            if (t->risk_score > 100.0) t->risk_score = 100.0;
        }
    }
    if (t->risk_score >= ATREE_RISK_THRESHOLD_ALERT)
        atomic_fetch_add(&g_high_risk_cnt, 1);
    pthread_mutex_unlock(&g_lock);
}

const AttackTree *attack_tree_get(pid_t pid) {
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++)
        if (g_trees[i].active && g_trees[i].root_pid == pid)
            return &g_trees[i];
    return NULL;
}

const char *lineage_type_str(LineageEventType t) {
    switch (t) {
        case LINEAGE_OPENAT:  return "FILE_READ";
        case LINEAGE_EXECVE:  return "EXEC_SHELL";
        case LINEAGE_CONNECT: return "NET_CONNECT";
        case LINEAGE_WRITE:   return "FILE_WRITE";
        case LINEAGE_RECV:    return "NET_RECV";
        default:              return "UNKNOWN";
    }
}

int attack_tree_to_json(pid_t pid, char *buf, size_t bufsz) {
    pthread_mutex_lock(&g_lock);
    const AttackTree *t = NULL;
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++)
        if (g_trees[i].active && g_trees[i].root_pid == pid) { t = &g_trees[i]; break; }

    if (!t) { pthread_mutex_unlock(&g_lock); return snprintf(buf, bufsz, "null"); }

    int n = snprintf(buf, bufsz,
        "{\"pid\":%d,\"comm\":\"%s\",\"risk\":%.1f,"
        "\"firstSeen\":%ld,\"lastSeen\":%ld,\"events\":[",
        (int)t->root_pid, t->root_comm, t->risk_score,
        (long)t->first_seen, (long)t->last_seen);

    for (int i = 0; i < t->count && n < (int)bufsz - 64; i++) {
        const LineageEvent *e = &t->events[i];
        char detail_esc[ATTACK_TREE_MAX_DETAIL * 2];
        /* Basit JSON kaçış */
        int di = 0;
        for (const char *p = e->detail; *p && di < (int)sizeof(detail_esc)-2; p++) {
            if (*p == '"' || *p == '\\') detail_esc[di++] = '\\';
            detail_esc[di++] = *p;
        }
        detail_esc[di] = '\0';

        n += snprintf(buf + n, bufsz - (size_t)n,
            "%s{\"type\":\"%s\",\"pid\":%d,\"ppid\":%d,\"comm\":\"%s\",\"detail\":\"%s\",\"ts\":%ld}",
            i ? "," : "",
            lineage_type_str(e->type), (int)e->pid, (int)e->ppid, e->comm, detail_esc, (long)e->ts);
    }
    n += snprintf(buf + n, bufsz - (size_t)n, "]}");
    pthread_mutex_unlock(&g_lock);
    return n;
}

int attack_tree_all_json(char *buf, size_t bufsz) {
    pthread_mutex_lock(&g_lock);
    int n = snprintf(buf, bufsz, "[");
    int first = 1;
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++) {
        if (!g_trees[i].active) continue;
        char tmp[ATTACK_TREE_JSON_BUF];
        pthread_mutex_unlock(&g_lock);
        int len = attack_tree_to_json(g_trees[i].root_pid, tmp, sizeof(tmp));
        pthread_mutex_lock(&g_lock);
        if (len > 4 && n + len + 2 < (int)bufsz) {
            if (!first) buf[n++] = ',';
            memcpy(buf + n, tmp, (size_t)len);
            n += len;
            first = 0;
        }
    }
    n += snprintf(buf + n, bufsz - (size_t)n, "]");
    pthread_mutex_unlock(&g_lock);
    return n;
}

int attack_tree_high_risk(pid_t *out_pids, int max_count, double threshold) {
    int found = 0;
    pthread_mutex_lock(&g_lock);
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS && found < max_count; i++) {
        if (g_trees[i].active && g_trees[i].risk_score >= threshold)
            out_pids[found++] = g_trees[i].root_pid;
    }
    pthread_mutex_unlock(&g_lock);
    return found;
}

void attack_tree_gc(int ttl_sec) {
    time_t cutoff = time(NULL) - ttl_sec;
    pthread_mutex_lock(&g_lock);
    for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++) {
        if (g_trees[i].active && g_trees[i].last_seen < cutoff) {
            memset(&g_trees[i], 0, sizeof(g_trees[i]));
        }
    }
    pthread_mutex_unlock(&g_lock);
}

void attack_tree_stats(uint64_t *total_events, uint64_t *active_trees,
                       uint64_t *high_risk_count) {
    if (total_events) *total_events = atomic_load(&g_total_events);
    if (high_risk_count) *high_risk_count = atomic_load(&g_high_risk_cnt);
    if (active_trees) {
        uint64_t cnt = 0;
        pthread_mutex_lock(&g_lock);
        for (int i = 0; i < ATTACK_TREE_MAX_PIDS; i++)
            if (g_trees[i].active) cnt++;
        pthread_mutex_unlock(&g_lock);
        *active_trees = cnt;
    }
}
