#!/usr/bin/env bash
# ipset log_analyzer_block_v4 tip uyumu (hash:net) — daemon ban IPC onarimi
#   sudo bash scripts/repair_ipset_v4.sh
#   sudo bash scripts/repair_ipset_v4.sh --no-restart
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/repair_ipset_v4.sh" >&2
  exit 1
fi

SET="${IPSET_NAME:-log_analyzer_block_v4}"
SET6="${IPSET_NAME_V6:-log_analyzer_block_v6}"
DB="${LG_DB:-/etc/log-guardian/events.db}"
NO_RESTART=0
[[ "${1:-}" == "--no-restart" ]] && NO_RESTART=1

ipset_type() {
  set +o pipefail
  ipset list "$1" 2>/dev/null | awk -F': ' '/^Type:/{print $2; exit}' || true
}

strip_fw_rules() {
  local set="$1"
  while iptables -D INPUT -m set --match-set "$set" src -j DROP 2>/dev/null; do :; done
  while ip6tables -D INPUT -m set --match-set "$set" src -j DROP 2>/dev/null; do :; done
}

recreate_set() {
  local set="$1" family="$2"
  local typ
  typ=$(ipset_type "$set" || true)
  if [[ "$typ" == "hash:net" ]]; then
    echo "[OK] $set zaten hash:net"
    return 0
  fi
  echo "[repair] $set -> hash:net (eski tip: ${typ:-yok})"
  strip_fw_rules "$set"
  ipset flush "$set" 2>/dev/null || true
  ipset destroy "$set" 2>/dev/null || true
  ipset create "$set" hash:net "family" "$family" maxelem 65536
  echo "[OK] $set hash:net olusturuldu"
}

echo "=== repair_ipset_v4 ==="
recreate_set "$SET" inet
recreate_set "$SET6" inet6

if ! iptables -C INPUT -m set --match-set "$SET" src -j DROP 2>/dev/null; then
  iptables -I INPUT -m set --match-set "$SET" src -j DROP
  echo "[OK] iptables DROP kurali eklendi"
fi
if ! ip6tables -C INPUT -m set --match-set "$SET6" src -j DROP 2>/dev/null; then
  ip6tables -I INPUT -m set --match-set "$SET6" src -j DROP 2>/dev/null || true
fi

restored=0
if [[ -f "$DB" ]] && command -v sqlite3 >/dev/null; then
  while IFS= read -r ip; do
    [[ -z "$ip" || "$ip" == "system" ]] && continue
    if ipset add "$SET" "$ip" -exist 2>/dev/null; then
      restored=$((restored + 1))
    fi
  done < <(sqlite3 -noheader "$DB" \
    "SELECT ip FROM ban_events WHERE action='BAN' AND ip != 'system' \
     AND reason NOT LIKE 'threat-intel%' GROUP BY ip ORDER BY MAX(ts) DESC LIMIT 500;" \
    2>/dev/null || true)
  echo "[OK] DB'den $restored dinamik ban geri yuklendi"
fi

# Hizli dogrulama
if ! ipset add "$SET" 203.0.113.254 -exist 2>/dev/null; then
  echo "[FAIL] ipset add testi basarisiz — tip hala uyumsuz olabilir" >&2
  exit 1
fi
ipset del "$SET" 203.0.113.254 2>/dev/null || true
echo "[OK] ipset add/del testi gecti"

if [[ "$NO_RESTART" -eq 0 ]]; then
  systemctl restart log-guardian-daemon log-guardian
  sleep 4
fi
echo "[OK] repair_ipset_v4 tamam"
echo "  dogrulama: sudo ipset list $SET | head -3"
echo "  (sudo olmadan 'Operation not permitted' normaldir)"
