#define _GNU_SOURCE
#include "geoip_feed.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <time.h>

static pthread_t g_thread;
static volatile int g_running = 0;
static int g_interval_hours = 24;
static char g_script_path[512] = "/usr/local/bin/log-guardian-threatintel";
static char g_rules_conf[512] = "/etc/log-guardian/rules.conf";

void geoip_feed_set_interval_hours(int hours)
{
    if (hours >= 1 && hours <= 168) g_interval_hours = hours;
}

void geoip_feed_set_rules_path(const char *path)
{
    if (path && path[0])
        strncpy(g_rules_conf, path, sizeof(g_rules_conf) - 1);
}

static int rules_has_block_countries(void)
{
    FILE *f = fopen(g_rules_conf, "r");
    if (!f) {
        f = fopen("rules.conf", "r");
        if (!f) return 0;
        strncpy(g_rules_conf, "rules.conf", sizeof(g_rules_conf) - 1);
    }
    char line[256];
    int found = 0;
    while (fgets(line, sizeof(line), f)) {
        if (strncmp(line, "BLOCK_COUNTRIES=", 16) == 0) {
            char *v = line + 16;
            while (*v == ' ' || *v == '\t') v++;
            if (*v && *v != '\n') found = 1;
            break;
        }
    }
    fclose(f);
    return found;
}

static void *geoip_thread(void *arg)
{
    (void)arg;
    while (g_running) {
        if (rules_has_block_countries()) {
            if (access(g_script_path, X_OK) == 0) {
                pid_t pid = fork();
                if (pid == 0) {
                    execl(g_script_path, g_script_path, (char *)NULL);
                    _exit(127);
                }
            }
        }
        for (int i = 0; i < g_interval_hours * 360 && g_running; i++)
            sleep(10);
    }
    return NULL;
}

void geoip_feed_init(void)
{
    const char *local = "./threat_intel.sh";
    if (access(local, X_OK) == 0)
        strncpy(g_script_path, local, sizeof(g_script_path) - 1);
    if (!rules_has_block_countries()) return;
    if (g_running) return;
    g_running = 1;
    pthread_create(&g_thread, NULL, geoip_thread, NULL);
}

void geoip_feed_stop(void)
{
    if (!g_running) return;
    g_running = 0;
    pthread_join(g_thread, NULL);
}
