#ifndef TENANT_DB_H
#define TENANT_DB_H

#include <stddef.h>

/* MULTI_TENANT_DB=1 iken events-<tenant>.db yolu uretir */
int tenant_db_apply_path(const char *tenant_id, int multi_tenant,
                         char *db_buf, size_t db_sz,
                         const char *rules_dir_hint);

#endif
