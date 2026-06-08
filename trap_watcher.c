#define _GNU_SOURCE
#include "trap_watcher.h"
#include "webhook.h"
#include "tui.h"
#include "db.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <time.h>
#include <sys/inotify.h>
#include <stdatomic.h>
#include <limits.h>

/* ── Globals ─────────────────────────────────────────────────── */
char   g_trap_files[MAX_TRAP_FILES][4096];
int    g_trap_wds  [MAX_TRAP_FILES];
size_t g_trap_count = 0;

char   g_trap_urls [MAX_TRAP_URLS][512];
size_t g_trap_url_count = 0;

char g_watch_dir[4096]    = "";
int  g_watch_dir_wd       = -1;
int  g_upload_inotify_fd  = -1;

/* ── External globals from main.c ────────────────────────────── */
extern int       g_use_tui;
extern int       g_output_json;
extern int       g_db_enabled;
extern TuiStats  g_stats;
extern _Atomic long g_atomic_alerts;

/* ── Trap file API ───────────────────────────────────────────── */

void add_trap_file(const char *path) {
    if (!path || !*path || g_trap_count >= MAX_TRAP_FILES) return;
    size_t n = strlen(path);
    if (n >= 4096) n = 4095;
    memcpy(g_trap_files[g_trap_count], path, n);
    g_trap_files[g_trap_count][n] = '\0';
    g_trap_wds[g_trap_count] = -1;
    g_trap_count++;
}

void ensure_default_trap_files(void) {
    if (g_trap_count == 0) {
        add_trap_file("password.txt");
        add_trap_file("wallet.dat");
    }
}

int setup_trap_watchers(int trap_inotify_fd) {
    for (size_t i = 0; i < g_trap_count; i++) {
        int wd = inotify_add_watch(trap_inotify_fd, g_trap_files[i],
                                   IN_OPEN | IN_ACCESS | IN_CLOSE_NOWRITE | IN_CLOSE_WRITE);
        g_trap_wds[i] = wd;
        if (wd < 0 && !g_output_json)
            fprintf(stderr, "[TRAP] Izleme eklenemedi: %s\n", g_trap_files[i]);
    }
    return 0;
}

const char *trap_path_by_wd(int wd) {
    for (size_t i = 0; i < g_trap_count; i++)
        if (g_trap_wds[i] == wd) return g_trap_files[i];
    return NULL;
}

void process_trap_events(int trap_inotify_fd) {
    if (trap_inotify_fd < 0) return;
    char tbuf[4096] __attribute__((aligned(__alignof__(struct inotify_event))));
    ssize_t tbytes = read(trap_inotify_fd, tbuf, sizeof(tbuf));
    if (tbytes <= 0) return;

    const struct inotify_event *tev;
    for (char *bp = tbuf; bp < tbuf + tbytes;
         bp += sizeof(struct inotify_event) + tev->len) {
        tev = (const struct inotify_event *)bp;
        if (tev->mask & (IN_OPEN | IN_ACCESS | IN_CLOSE_NOWRITE | IN_CLOSE_WRITE)) {
            const char *trap_path = trap_path_by_wd(tev->wd);
            if (trap_path) {
                time_t now = time(NULL);
                Alert trap_alert;
                memset(&trap_alert, 0, sizeof(trap_alert));
                trap_alert.level = ALERT_CRIT;
                trap_alert.ts    = now;
                strncpy(trap_alert.ip, "LOCAL-FS", sizeof(trap_alert.ip) - 1);
                snprintf(trap_alert.message, sizeof(trap_alert.message),
                         "TUZAK DOSYA ACILDI: %s", trap_path);
                if (g_use_tui) tui_push_alert(&g_stats, &trap_alert);
                webhook_send_trap(trap_path, now);
                if (!g_output_json)
                    fprintf(stderr, "\n[TRAP] Kritik erisim: %s\n", trap_path);
            }
        }
    }
}

/* ── Upload / WebShell watcher API ──────────────────────────── */

void setup_upload_watcher(void) {
    if (g_watch_dir[0] == '\0') return;
    g_upload_inotify_fd = inotify_init1(IN_NONBLOCK);
    if (g_upload_inotify_fd < 0) {
        fprintf(stderr, "[UPLOAD] inotify baslatilamadi: %s\n", g_watch_dir);
        return;
    }
    g_watch_dir_wd = inotify_add_watch(g_upload_inotify_fd, g_watch_dir,
                                        IN_CREATE | IN_CLOSE_WRITE | IN_MOVED_TO);
    if (g_watch_dir_wd < 0) {
        fprintf(stderr, "[UPLOAD] Dizin izlenemedi: %s\n", g_watch_dir);
        close(g_upload_inotify_fd);
        g_upload_inotify_fd = -1;
        return;
    }
    fprintf(stderr, "[UPLOAD] WebShell izleme aktif: %s\n", g_watch_dir);
}

int file_is_webshell(const char *filepath) {
    FILE *fp = fopen(filepath, "rb");
    if (!fp) return 0;
    unsigned char hdr[8];
    size_t rd = fread(hdr, 1, sizeof(hdr), fp);
    fclose(fp);
    if (rd < 2) return 0;
    if (rd >= 5 && memcmp(hdr, "<?php", 5) == 0) return 1;
    if (rd >= 2 && hdr[0] == '<' && hdr[1] == '?')  return 1;
    if (rd >= 4 && hdr[0] == 0x7f && hdr[1] == 'E' && hdr[2] == 'L' && hdr[3] == 'F') return 1;
    if (rd >= 3 && hdr[0] == '<' && hdr[1] == '%') return 1;
    return 0;
}

void process_upload_events(void) {
    if (g_upload_inotify_fd < 0) return;
    char ubuf[4096] __attribute__((aligned(__alignof__(struct inotify_event))));
    ssize_t ubytes = read(g_upload_inotify_fd, ubuf, sizeof(ubuf));
    if (ubytes <= 0) return;

    const struct inotify_event *uev;
    for (char *bp = ubuf; bp < ubuf + ubytes;
         bp += sizeof(struct inotify_event) + uev->len) {
        uev = (const struct inotify_event *)bp;
        if (!(uev->mask & (IN_CREATE | IN_CLOSE_WRITE | IN_MOVED_TO))) continue;
        if (uev->len == 0) continue;

        char fpath[4096];
        snprintf(fpath, sizeof(fpath), "%s/%s", g_watch_dir, uev->name);
        if (!file_is_webshell(fpath)) continue;

        fprintf(stderr, "\n[WEBSHELL] ⚠️  Zararli dosya tespit edildi: %s\n", fpath);
        if (unlink(fpath) == 0)
            fprintf(stderr, "[WEBSHELL] Dosya silindi: %s\n", fpath);
        else
            fprintf(stderr, "[WEBSHELL] Silinemedi: %s (%s)\n", fpath, strerror(errno));

        Alert ws_alert = {0};
        ws_alert.level = ALERT_CRIT;
        ws_alert.ts    = time(NULL);
        strncpy(ws_alert.ip, "UPLOAD", sizeof(ws_alert.ip) - 1);
        snprintf(ws_alert.message, ALERT_MSG_LEN,
                 "WEBSHELL YUKLEME GIRISIMLERI! Dosya: %s", uev->name);

        if (g_use_tui) tui_push_alert(&g_stats, &ws_alert);
        webhook_send_alert(&ws_alert);
        if (g_db_enabled) db_log_alert(&ws_alert, NULL);
        atomic_fetch_add(&g_atomic_alerts, 1);
    }
}
