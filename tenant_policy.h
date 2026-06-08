#ifndef TENANT_POLICY_H
#define TENANT_POLICY_H

#include <stddef.h>

typedef struct {
    char tenant_id[128];
    char safe_id[64];
    char db_path[256];
    char ban_audit_path[512];
    char threat_audit_path[512];
    char fp_store_path[512];
    char data_dir[256];
    char overlay_path[512];
    int  multi_tenant;
    int  overlay_loaded;
    double auto_ban_min_risk; /* <0 = overlay yok, base kullan */
    int  ban_ttl_sec;         /* <0 = overlay yok */
} TenantIsolationInfo;

void tenant_policy_init(void);

/** MULTI_TENANT_DB=1: DB + audit + FP store yollarini kiraci bazli ayarlar. */
int tenant_policy_apply(const char *tenant_id, int multi_tenant,
                        const char *rules_dir,
                        char *db_buf, size_t db_sz,
                        int db_path_cli_set);

/** rules/tenants/<safe_id>.conf — AUTO_BAN_MIN_RISK, BAN_TTL_SEC overlay */
int tenant_policy_load_overlay(const char *rules_dir);

const TenantIsolationInfo *tenant_policy_info(void);

#endif
