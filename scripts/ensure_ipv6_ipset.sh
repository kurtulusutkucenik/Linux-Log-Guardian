#!/usr/bin/env bash
# IPv6 ipset + ip6tables — laptop / VPS (root)
#   sudo bash scripts/ensure_ipv6_ipset.sh
set -euo pipefail

IPSET_V6="${IPSET_V6_NAME:-log_analyzer_block_v6}"

[[ "$(id -u)" -eq 0 ]] || { echo "[ensure_ipv6_ipset] sudo gerekli" >&2; exit 1; }
command -v ipset >/dev/null 2>&1 || { echo "[ensure_ipv6_ipset] ipset yok" >&2; exit 1; }

IPSET_BIN="$(command -v ipset)"

"$IPSET_BIN" create "$IPSET_V6" hash:net family inet6 maxelem 65536 -exist
echo "[OK] ipset $IPSET_V6 (inet6 hash:net)"

if command -v ip6tables >/dev/null 2>&1; then
  if ! ip6tables -C INPUT -m set --match-set "$IPSET_V6" src -j DROP 2>/dev/null; then
    ip6tables -I INPUT -m set --match-set "$IPSET_V6" src -j DROP
    echo "[OK] ip6tables INPUT drop kurali eklendi"
  else
    echo "[OK] ip6tables kurali mevcut"
  fi
else
  echo "[WARN] ip6tables yok — ipset test yine calisir, paket drop olmaz" >&2
fi
