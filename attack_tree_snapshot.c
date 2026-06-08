#define _GNU_SOURCE
#include "attack_tree_snapshot.h"
#include "attack_tree.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/stat.h>
#include <errno.h>

static char g_attack_tree_path[512] = ATTACK_TREE_JSON_PATH_DEFAULT;

void attack_tree_set_json_path(const char *path)
{
    if (!path || !path[0]) return;
    strncpy(g_attack_tree_path, path, sizeof(g_attack_tree_path) - 1);
    g_attack_tree_path[sizeof(g_attack_tree_path) - 1] = '\0';
}

const char *attack_tree_get_json_path(void)
{
    return g_attack_tree_path;
}

static int path_readable(const char *path)
{
    return path && path[0] && access(path, R_OK) == 0;
}

int attack_tree_resolve_file(char *out, size_t out_sz)
{
    const char *candidates[8];
    int n = 0;

    if (path_readable(g_attack_tree_path))
        candidates[n++] = g_attack_tree_path;

    const char *env = getenv("ATTACK_TREE_JSON_PATH");
    if (env && env[0] && strcmp(env, g_attack_tree_path) != 0)
        candidates[n++] = env;

    if (strcmp(g_attack_tree_path, ATTACK_TREE_JSON_PATH_DEFAULT) != 0)
        candidates[n++] = ATTACK_TREE_JSON_PATH_DEFAULT;

    candidates[n++] = "/var/lib/log-guardian/attack_tree.json";

    const char *home = getenv("HOME");
    static char user_path[512];
    if (home && home[0]) {
        snprintf(user_path, sizeof(user_path),
                 "%s/.local/share/log-guardian/attack_tree.json", home);
        candidates[n++] = user_path;
    }
    candidates[n++] = "./attack_tree.json";

    for (int i = 0; i < n; i++) {
        if (path_readable(candidates[i])) {
            strncpy(out, candidates[i], out_sz - 1);
            out[out_sz - 1] = '\0';
            return 0;
        }
    }
    strncpy(out, g_attack_tree_path, out_sz - 1);
    out[out_sz - 1] = '\0';
    return -1;
}

int attack_tree_write_demo_snapshot(const char *path)
{
    const char *demo =
        "[{\"pid\":4821,\"comm\":\"php-fpm\",\"risk\":88.5,\"firstSeen\":1,\"lastSeen\":60,"
        "\"events\":[{\"type\":\"FILE_READ\",\"pid\":4821,\"ppid\":1200,\"comm\":\"php-fpm\","
        "\"detail\":\"/etc/passwd\",\"ts\":1},{\"type\":\"EXEC_SHELL\",\"pid\":4822,"
        "\"ppid\":4821,\"comm\":\"sh\",\"detail\":\"/bin/sh\",\"ts\":10},"
        "{\"type\":\"NET_CONNECT\",\"pid\":4823,\"ppid\":4822,\"comm\":\"curl\","
        "\"detail\":\"203.0.113.99:443\",\"ts\":20}]}]";
    const char *target = path && path[0] ? path : g_attack_tree_path;

    char dir[512];
    strncpy(dir, target, sizeof(dir) - 1);
    dir[sizeof(dir) - 1] = '\0';
    char *slash = strrchr(dir, '/');
    if (slash) {
        *slash = '\0';
        for (char *q = dir + 1; *q; q++) {
            if (*q == '/') {
                *q = '\0';
                mkdir(dir, 0755);
                *q = '/';
            }
        }
        if (dir[0]) mkdir(dir, 0755);
    }

    FILE *f = fopen(target, "w");
    if (!f) return -1;
    fputs(demo, f);
    fclose(f);
    attack_tree_set_json_path(target);
    return 0;
}

static int json_string_after_key(const char *obj, const char *key,
                                 char *out, size_t out_sz)
{
    const char *kp = strstr(obj, key);
    if (!kp) return -1;
    const char *colon = strchr(kp, ':');
    if (!colon) return -1;
    const char *q1 = strchr(colon, '"');
    if (!q1) return -1;
    const char *start = q1 + 1;
    const char *end = strchr(start, '"');
    if (!end) return -1;
    size_t len = (size_t)(end - start);
    if (len >= out_sz) len = out_sz - 1;
    memcpy(out, start, len);
    out[len] = '\0';
    return 0;
}

static pid_t json_int_after_key(const char *obj, const char *key)
{
    const char *kp = strstr(obj, key);
    if (!kp) return 0;
    const char *colon = strchr(kp, ':');
    if (!colon) return 0;
    return (pid_t)strtol(colon + 1, NULL, 10);
}

int attack_tree_snapshot_read(AttackTreeSnapshot *out, double risk_threshold)
{
    if (!out) return -1;
    memset(out, 0, sizeof(*out));

    char resolved[512];
    if (attack_tree_resolve_file(resolved, sizeof(resolved)) != 0)
        return -1;

    FILE *f = fopen(resolved, "r");
    if (!f) return -1;

    char buf[ATTACK_TREE_JSON_BUF * 4];
    size_t n = fread(buf, 1, sizeof(buf) - 1, f);
    fclose(f);
    if (n == 0) return -1;
    buf[n] = '\0';

    if (buf[0] != '[') return -1;

    uint64_t trees = 0;
    uint64_t events = 0;
    uint64_t high = 0;
    double max_risk = 0.0;
    char top_comm[16] = "";
    pid_t top_pid = 0;

    const char *p = buf;
    while ((p = strstr(p, "\"risk\"")) != NULL) {
        const char *colon = strchr(p, ':');
        if (!colon) break;
        double risk = strtod(colon + 1, NULL);
        trees++;
        if (risk > max_risk) max_risk = risk;
        if (risk >= risk_threshold) high++;

        const char *obj_start = p;
        for (int back = 0; back < 512 && obj_start >= buf + 7; back++, obj_start--) {
            if (strncmp(obj_start, "{\"pid\":", 7) == 0 ||
                strncmp(obj_start, "{\"pid\"", 6) == 0)
                break;
        }

        char comm[16] = {0};
        json_string_after_key(obj_start, "\"comm\"", comm, sizeof(comm));
        pid_t pid = json_int_after_key(obj_start, "\"pid\"");

        if (risk >= max_risk - 0.01) {
            if (comm[0]) {
                strncpy(top_comm, comm, sizeof(top_comm) - 1);
                top_pid = pid;
            }
        }
        p++;
    }

    for (p = buf; (p = strstr(p, "\"type\"")) != NULL; events++, p++);

    out->active_trees    = trees;
    out->high_risk_trees = high;
    out->total_events    = events;
    out->max_risk        = max_risk;
    out->top_pid         = top_pid;
    strncpy(out->top_comm, top_comm, sizeof(out->top_comm) - 1);
    return 0;
}

void attack_tree_snapshot_apply_tui(TuiStats *stats, double risk_threshold)
{
    if (!stats) return;
    AttackTreeSnapshot snap;
    if (attack_tree_snapshot_read(&snap, risk_threshold) != 0) return;
    stats->lineage_active_trees = snap.active_trees;
    stats->lineage_high_risk    = snap.high_risk_trees;
    stats->lineage_events       = snap.total_events;
    stats->lineage_max_risk     = snap.max_risk;
    strncpy(stats->lineage_top_comm, snap.top_comm, sizeof(stats->lineage_top_comm) - 1);
    stats->lineage_top_pid = snap.top_pid;
}
