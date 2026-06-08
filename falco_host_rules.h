/* falco_host_rules.h — Falco-benzeri host/lineage kurallari (Faz 2.4 MVP) */
#ifndef FALCO_HOST_RULES_H
#define FALCO_HOST_RULES_H

#include "attack_tree.h"
#include <stdint.h>

#define FALCO_RULE_NAME_LEN 48

void falco_host_rules_init(void);
/** scripts/falco_import.py -> rules/generated-falco-host.lst */
int falco_host_rules_load_file(const char *path);

/* Lineage olayina karsi ~25 kritik kural; eslesirse kural adi yazar */
int falco_host_rules_match(const LineageEvent *ev,
                           char *rule_name, size_t name_sz,
                           uint32_t *incident_signal_out);

#endif /* FALCO_HOST_RULES_H */
