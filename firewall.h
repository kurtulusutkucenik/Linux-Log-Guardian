/* firewall.h — ipset/iptables/XDP ban+unban helpers.
 * Extracted from main.c to reduce god-node coupling.
 */
#pragma once
#include <stdint.h>

/* ── IP validation ──────────────────────────────────────────── */
int         is_valid_ip    (const char *ip);
int         is_ipv6_addr   (const char *ip);

/* CIDR / proxy trust (parser XFF) */
int         ip_matches_cidr     (const char *ip, const char *cidr);
int         ip_matches_cidr_list(const char *ip,
                                const char cidrs[][64], int count);

/* IPC daemon: gelen ban mesajlarini dogrula */
int         ipc_clamp_v4_prefix (uint8_t prefix);
int         ipc_validate_ban_ipv4(const char *ip, uint8_t *prefix_io);
int         ipc_validate_ban_ipv6(const char *ip);

/* ── ipset set names (configurable) ────────────────────────── */
extern const char *g_ipset_v4;   /* default: "log_analyzer_block_v4" */
extern const char *g_ipset_v6;   /* default: "log_analyzer_block_v6" */

const char *ipset_name_for_ip (const char *ip);

/* ── Low-level execve wrappers ──────────────────────────────── */
int run_ipset_create (const char *set_name, const char *family);
int run_fw_rule      (const char *bin, const char *op, const char *set_name);
int ensure_fw_rule   (const char *bin, const char *set_name);
int run_ipset_ip     (const char *op,  const char *set_name, const char *ip);

/* ipset list -o plain: IPv4 uye listesi (execve, kabuk yok) */
int ipset_list_v4_members(char ips[][64], int max_ips, int *total_in_set);

/* ── High-level API ─────────────────────────────────────────── */
/* Creates ipset sets and ensures iptables/ip6tables DROP rules exist. */
int  ensure_ipset_ready (void);

/* ban_ip / unban_ip: try IPC daemon → direct XDP → ipset fallback.
 * Returns 0 on success, -1 on failure. */
int  ban_ip   (const char *ip);
int  ban_ip_with_reason(const char *ip, const char *reason);
int  unban_ip (const char *ip);

/* ipset/XDP'te zaten banli mi (yeni ban webhook onleme) */
int  ip_is_blocked(const char *ip);

/* Desktop notify-send (non-blocking fork). */
void send_desktop_notification(const char *ip);
