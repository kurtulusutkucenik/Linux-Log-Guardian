/* firewall.h — ipset/iptables/XDP ban+unban helpers.
 * Extracted from main.c to reduce god-node coupling.
 */
#pragma once

/* ── IP validation ──────────────────────────────────────────── */
int         is_valid_ip    (const char *ip);
int         is_ipv6_addr   (const char *ip);

/* ── ipset set names (configurable) ────────────────────────── */
extern const char *g_ipset_v4;   /* default: "log_analyzer_block_v4" */
extern const char *g_ipset_v6;   /* default: "log_analyzer_block_v6" */

const char *ipset_name_for_ip (const char *ip);

/* ── Low-level execve wrappers ──────────────────────────────── */
int run_ipset_create (const char *set_name, const char *family);
int run_fw_rule      (const char *bin, const char *op, const char *set_name);
int ensure_fw_rule   (const char *bin, const char *set_name);
int run_ipset_ip     (const char *op,  const char *set_name, const char *ip);

/* ── High-level API ─────────────────────────────────────────── */
/* Creates ipset sets and ensures iptables/ip6tables DROP rules exist. */
int  ensure_ipset_ready (void);

/* ban_ip / unban_ip: try IPC daemon → direct XDP → ipset fallback.
 * Returns 0 on success, -1 on failure. */
int  ban_ip   (const char *ip);
int  ban_ip_with_reason(const char *ip, const char *reason);
int  unban_ip (const char *ip);

/* Desktop notify-send (non-blocking fork). */
void send_desktop_notification(const char *ip);
