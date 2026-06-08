#ifndef IPC_AUTH_H
#define IPC_AUTH_H

#include <stdint.h>
#include <sys/types.h>

#ifdef __cplusplus
extern "C" {
#endif

void     ipc_auth_init(void);
void     ipc_auth_load_env_file(const char *path);
uint32_t ipc_auth_token_for_message(void);
int      ipc_auth_required(void);
int      ipc_auth_validate_message(uint32_t token);
int      ipc_auth_peer_allowed(uid_t uid, gid_t gid);
int      ipc_auth_shutdown_allowed(uid_t uid, uint32_t token);

#ifdef __cplusplus
}
#endif

#endif /* IPC_AUTH_H */
