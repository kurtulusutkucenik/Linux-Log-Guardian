#define _GNU_SOURCE
#include "tenant_db.h"
#include <stdio.h>
#include <string.h>
#include <ctype.h>

static void sanitize_tenant(const char *in, char *out, size_t out_sz)
{
    size_t j = 0;
    if (!in || !out || out_sz < 2) return;
    for (size_t i = 0; in[i] && j < out_sz - 1; i++) {
        unsigned char c = (unsigned char)in[i];
        if (isalnum(c) || c == '_' || c == '-')
            out[j++] = (char)c;
    }
    out[j] = '\0';
    if (!out[0]) strncpy(out, "default", out_sz - 1);
}

int tenant_db_apply_path(const char *tenant_id, int multi_tenant,
                         char *db_buf, size_t db_sz,
                         const char *rules_dir_hint)
{
    if (!multi_tenant || !tenant_id || !db_buf || db_sz < 16)
        return 0;

    char safe[64];
    sanitize_tenant(tenant_id, safe, sizeof(safe));

    if (rules_dir_hint && rules_dir_hint[0]) {
        snprintf(db_buf, db_sz, "%s/events-%s.db", rules_dir_hint, safe);
    } else {
        snprintf(db_buf, db_sz, "events-%s.db", safe);
    }
    return 1;
}
