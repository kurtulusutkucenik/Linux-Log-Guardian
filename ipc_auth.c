#define _GNU_SOURCE
#include "ipc_auth.h"
#include <grp.h>
#include <pwd.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static uint32_t g_ipc_token_hash;
static int      g_ipc_token_loaded;

static uint32_t fnv1a32(const char *s)
{
    uint32_t h = 2166136261u;
    while (s && *s) {
        h ^= (unsigned char)*s++;
        h *= 16777619u;
    }
    return h;
}

void ipc_auth_init(void)
{
    const char *tok = getenv("LOG_GUARDIAN_IPC_TOKEN");
    g_ipc_token_hash = (tok && tok[0]) ? fnv1a32(tok) : 0;
    g_ipc_token_loaded = 1;
}

void ipc_auth_load_env_file(const char *path)
{
    if (!path || !path[0])
        return;
    FILE *f = fopen(path, "r");
    if (!f)
        return;
    char line[512];
    while (fgets(line, sizeof(line), f)) {
        char *p = line;
        while (*p == ' ' || *p == '\t') p++;
        if (*p == '#' || *p == '\n') continue;
        char *nl = strchr(p, '\n');
        if (nl) *nl = '\0';
        char *eq = strchr(p, '=');
        if (!eq) continue;
        *eq = '\0';
        char *key = p;
        char *val = eq + 1;
        while (*val == ' ' || *val == '\t') val++;
        if (!key[0] || !val[0]) continue;
        if (strncmp(key, "LOG_GUARDIAN_", 13) == 0 ||
            strncmp(key, "LOGANALYZER_", 12) == 0)
            setenv(key, val, 1);
    }
    fclose(f);
    g_ipc_token_loaded = 0;
}

uint32_t ipc_auth_token_for_message(void)
{
    if (!g_ipc_token_loaded)
        ipc_auth_init();
    return g_ipc_token_hash;
}

int ipc_auth_required(void)
{
    if (!g_ipc_token_loaded)
        ipc_auth_init();
    const char *prod = getenv("LOG_GUARDIAN_PROD");
    if (prod && (prod[0] == '1' || prod[0] == 'y' || prod[0] == 'Y'))
        return 1;
    return g_ipc_token_hash != 0;
}

int ipc_auth_validate_message(uint32_t token)
{
    if (!ipc_auth_required())
        return 1;
    return token != 0 && token == g_ipc_token_hash;
}

int ipc_auth_peer_allowed(uid_t uid, gid_t gid)
{
    if (uid == 0)
        return 1;

    const char *grp_name = getenv("LOG_GUARDIAN_IPC_GROUP");
    if (!grp_name || !grp_name[0])
        grp_name = "log-guardian";

    struct group *gr = getgrnam(grp_name);
    if (!gr)
        return 0;
    if (gr->gr_gid == gid)
        return 1;

    struct passwd *pw = getpwuid(uid);
    if (!pw)
        return 0;
    int ng = 32;
    gid_t groups[32];
    if (getgrouplist(pw->pw_name, gid, groups, &ng) == -1)
        return 0;
    for (int i = 0; i < ng; i++) {
        if (groups[i] == gr->gr_gid)
            return 1;
    }
    return 0;
}

int ipc_auth_shutdown_allowed(uid_t uid, uint32_t token)
{
    return uid == 0 && ipc_auth_validate_message(token);
}
