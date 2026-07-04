/* api_server.h — io_uring based minimal HTTP REST API for Log Guardian
 * Provides endpoints for the SaaS Dashboard to fetch real-time metrics.
 */
#pragma once

#include <stdint.h>

/* API Server configuration */
#define API_DEFAULT_PORT 8080
#define API_MAX_CONNECTIONS 128
#define API_BUFFER_SIZE 4096

/* Starts the API server thread. 
 * Returns 0 on success (thread created), -1 on error. 
 * port: port to listen on (e.g. 8080).
 */
int api_server_start(uint16_t port);

/* Signals the API server thread to stop and cleans up resources. */
void api_server_stop(void);

typedef struct {
    uint64_t requests_total;
    uint64_t auth_fail_total;
    uint64_t rate_limited_total;
} ApiServerStats;

void api_server_get_stats(ApiServerStats *out);

/* Inline consult sonuc cache — ayni ip+path flood'unda WAF yukunu azaltir (0=kapali). */
void api_server_set_consult_cache_ttl(int sec);
