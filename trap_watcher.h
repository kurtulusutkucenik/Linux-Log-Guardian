/* trap_watcher.h — Honey-token trap file & upload-dir inotify watchers.
 * Extracted from main.c to reduce god-node coupling.
 */
#pragma once
#include <stddef.h>

/* ── Configuration limits ───────────────────────────────────── */
#define MAX_TRAP_FILES 16
#define MAX_TRAP_URLS  32

/* ── Globals owned by this module (defined in trap_watcher.c) ─ */
extern char   g_trap_files[MAX_TRAP_FILES][4096]; /* PATH_MAX */
extern int    g_trap_wds  [MAX_TRAP_FILES];
extern size_t g_trap_count;

extern char   g_trap_urls [MAX_TRAP_URLS][512];
extern size_t g_trap_url_count;

/* Upload dir watch state */
extern char g_watch_dir[4096];       /* set via rules.conf WATCH_DIR */
extern int  g_watch_dir_wd;
extern int  g_upload_inotify_fd;

/* ── Trap file API ──────────────────────────────────────────── */
void        add_trap_file           (const char *path);
void        ensure_default_trap_files(void);
int         setup_trap_watchers     (int trap_inotify_fd);
const char *trap_path_by_wd         (int wd);

/* Process inotify events on the trap-file fd.
 * Calls webhook_send_trap() and tui_push_alert() internally. */
void process_trap_events(int trap_inotify_fd);

/* ── Upload / WebShell watcher API ─────────────────────────── */
void setup_upload_watcher(void);

/* Returns 1 if file header looks like a web-shell or ELF binary. */
int  file_is_webshell(const char *filepath);

/* Process inotify events on g_upload_inotify_fd.
 * Deletes detected web-shells and fires alerts. */
void process_upload_events(void);
