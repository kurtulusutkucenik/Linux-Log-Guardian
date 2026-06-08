/* ban_pipeline.h — Tek giriş noktası: log → kernel ban (IPC → XDP → ipset) */
#ifndef BAN_PIPELINE_H
#define BAN_PIPELINE_H

#include <stdint.h>

typedef enum {
    BAN_PATH_NONE          = 0,
    BAN_PATH_WHITELIST_SKIP,
    BAN_PATH_INVALID_IP,
    BAN_PATH_IPC_XDP       = 10,
    BAN_PATH_XDP_DIRECT    = 20,
    BAN_PATH_IPSET         = 30,
    BAN_PATH_FAILED        = 99,
} BanPath;

typedef struct {
    uint64_t via_ipc;
    uint64_t via_xdp;
    uint64_t via_ipset;
    uint64_t skipped_whitelist;
    uint64_t failed;
    uint64_t unban_ok;
} BanPipelineStats;

typedef int (*BanWhitelistFn)(const char *ip);

void ban_pipeline_set_whitelist_fn(BanWhitelistFn fn);
void ban_pipeline_get_stats(BanPipelineStats *out);

/* reason: audit / db / SIEM (opsiyonel, NULL olabilir) */
int ban_pipeline_ban(const char *ip, const char *reason, BanPath *path_out);
int ban_pipeline_unban(const char *ip);

#endif /* BAN_PIPELINE_H */
