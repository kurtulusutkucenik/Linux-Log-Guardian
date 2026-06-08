/* attack_tree_snapshot.h — Daemon attack_tree.json → analyzer/TUI */
#ifndef ATTACK_TREE_SNAPSHOT_H
#define ATTACK_TREE_SNAPSHOT_H

#include "tui.h"

#define ATTACK_TREE_JSON_PATH_DEFAULT "/run/log-guardian/attack_tree.json"

typedef struct {
    uint64_t active_trees;
    uint64_t high_risk_trees;   /* risk >= threshold */
    uint64_t total_events;      /* events[] elemanlari (yaklasik) */
    double   max_risk;
    char     top_comm[16];
    pid_t    top_pid;
} AttackTreeSnapshot;

#ifdef __cplusplus
extern "C" {
#endif

/* Oncelik: --path / ATTACK_TREE_JSON_PATH / varsayilan / ~/.local/share / ./ */
void attack_tree_set_json_path(const char *path);
const char *attack_tree_get_json_path(void);
int attack_tree_resolve_file(char *out, size_t out_sz);
int attack_tree_snapshot_read(AttackTreeSnapshot *out, double risk_threshold);
void attack_tree_snapshot_apply_tui(TuiStats *stats, double risk_threshold);
int attack_tree_write_demo_snapshot(const char *path);

#ifdef __cplusplus
}
#endif

#endif /* ATTACK_TREE_SNAPSHOT_H */
