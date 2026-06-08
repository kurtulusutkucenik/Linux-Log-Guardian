/* threat_feed.h — Threat Intelligence Feed (AbuseIPDB / OTX / STIX → ban pipeline) */
#ifndef THREAT_FEED_H
#define THREAT_FEED_H

#include <stdint.h>
#include <time.h>

#define TF_SRC_ABUSEIPDB  (1u << 0)
#define TF_SRC_OTX        (1u << 1)
#define TF_SRC_STIX       (1u << 2)
#define TF_SRC_URL        (1u << 3)

typedef struct {
    char api_key[128];           /* AbuseIPDB Key: header */
    char feed_url[512];          /* Plain list / custom JSON URL */
    char otx_api_key[128];
    char stix_url[512];
    char sources[128];             /* abuseipdb,otx,stix,url */
    char audit_path[512];
    int  update_interval_sec;
    int  enabled;
    int  use_ban_pipeline;       /* 1=IPC→XDP→ipset (ban_pipeline_ban) */
    int  min_score;                /* AbuseIPDB abuseConfidenceScore min */
    int  max_ips_per_cycle;
    /* Mesh (ZeroMQ) */
    int  mesh_pub_enabled;
    char mesh_pub_addr[128];
    int  mesh_sub_enabled;
    char mesh_sub_addr[128];
} ThreatFeedConfig;

typedef struct {
    uint64_t total_iocs;
    uint64_t last_applied;
    uint64_t last_skipped_whitelist;
    uint64_t last_failed;
    time_t   last_sync_ts;
    char     last_error[128];
} ThreatFeedStats;

extern ThreatFeedConfig g_threat_config;

void threat_feed_init(void);
void threat_feed_stop(void);

uint64_t threat_feed_get_total_iocs(void);
void threat_feed_get_stats(ThreatFeedStats *out);
unsigned threat_feed_sources_mask(void);

/* Tek döngü (CLI / test) */
int threat_feed_run_once(void);

#endif /* THREAT_FEED_H */
