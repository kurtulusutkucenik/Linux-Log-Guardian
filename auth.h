/* auth.h — Startup authentication, privilege drop, seccomp sandbox.
 * Extracted from main.c to break the god-node coupling.
 */
#pragma once
#include <stddef.h>

/* External config state that auth.c needs (provided by main.c globals).
 * These are declared extern so auth.c can access them without redefining. */
extern char g_access_password_hash[65];
extern char g_access_password_kdf[256];
extern char g_password_file_path[256];
extern int  g_auth_max_attempts;
extern int  g_output_json;
extern int  g_allow_ban;
extern int  g_drop_privs;

/* ── File security ──────────────────────────────────────────── */
/* Returns 0 if file is safe, -1 otherwise.
 * strict_owner_only=1: no group/other permissions at all. */
int is_secure_file(const char *path, int strict_owner_only);

/* ── Startup authentication ─────────────────────────────────── */
/* Reads password from file, env, or TTY prompt; verifies KDF/hash.
 * Returns 0 on success, -1 on failure (too many attempts or config error). */
int enforce_startup_auth(void);

/* ── Privilege drop ─────────────────────────────────────────── */
/* Drops root privileges using SUDO_UID/SUDO_GID if --drop-privs is set
 * and ban is disabled. Safe to call if not root. */
void maybe_drop_privileges(void);

/* ── Seccomp BPF sandbox ────────────────────────────────────── */
/* Applies a syscall whitelist using libseccomp.
 * Exits the process with code 1 if seccomp fails to initialise. */
void setup_seccomp(void);
