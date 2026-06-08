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
