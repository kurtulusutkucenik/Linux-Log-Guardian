/* ja3_cluster.h — Ayni UA/JA3 fingerprint → coklu IP cluster ban */
#ifndef JA3_CLUSTER_H
#define JA3_CLUSTER_H

#include <stdint.h>
#include <time.h>

void ja3_cluster_config(int enabled, int min_ips);
void ja3_cluster_init(void);
int  ja3_cluster_enabled(void);

/* fingerprint: "ua:..." veya "ja3:..." on ekli anahtar */
int ja3_cluster_track(const char *ip, const char *fingerprint, time_t ts);

void ja3_cluster_fingerprint_ua(const char *ua, size_t ua_len,
                                char *out, size_t out_cap);
void ja3_cluster_fingerprint_ja3(const char *ja3_hash,
                                   char *out, size_t out_cap);

void ja3_cluster_get_stats(uint64_t *clusters_active, uint64_t *cluster_bans);

#endif /* JA3_CLUSTER_H */
