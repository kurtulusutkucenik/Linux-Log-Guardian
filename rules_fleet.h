/* rules_fleet.h — Merkezi fleet PUSH_CONFIG + overlay dosyasi */
#ifndef RULES_FLEET_H
#define RULES_FLEET_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

void rules_fleet_set_rules_path(const char *rules_path);

/* fleet.override.conf tam yolunu yazar */
int rules_fleet_overlay_path(char *out, size_t out_sz);

/* KEY=VALUE veya "KEY VALUE" — overlay'e yazar ve canli uygular */
int rules_fleet_apply_kv(const char *payload);

/* Overlay dosyasini tekrar uygula (SIGHUP sonrasi) */
void rules_fleet_reload_overlay(void);

#ifdef __cplusplus
}
#endif

#endif /* RULES_FLEET_H */
