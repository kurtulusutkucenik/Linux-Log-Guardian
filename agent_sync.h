#ifndef AGENT_SYNC_H
#define AGENT_SYNC_H

#include <stdint.h>

typedef struct {
    int enabled;
    char url[256];
    char token[128];
    char agent_id[128];
    int interval_sec;
} AgentSyncConfig;

extern AgentSyncConfig g_agent_sync_config;

/* Başlatır */
void agent_sync_init(void);

/* Durdurur */
void agent_sync_stop(void);

#endif /* AGENT_SYNC_H */
