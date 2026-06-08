/* ban_policy.h — risk tabanli otomatik ban politikasi */
#pragma once
#ifndef BAN_POLICY_H
#define BAN_POLICY_H

#include "anomaly.h"
#include <stddef.h>

typedef struct {
    double risk_score;
    double min_risk;
    int    allow_ban;
    char   decision[24]; /* ban | skip_risk | policy_off | force_crit */
} BanPolicyVerdict;

void ban_policy_init(void);
void ban_policy_config(int enabled, double min_risk, const char *audit_path);
void ban_policy_set_tenant(const char *tenant_id);

/** 1 = ban uygula, 0 = atla (audit yazilir) */
int ban_policy_should_auto_ban(const char *ip, const Alert *alert,
                               BanPolicyVerdict *out);

void ban_policy_audit(const char *ip, const Alert *alert,
                      const BanPolicyVerdict *v, int banned);

void ban_policy_get_stats(uint64_t *allowed, uint64_t *skipped);

#endif /* BAN_POLICY_H */
