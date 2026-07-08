#!/usr/bin/env bash
# ban-db-prune haftalik — intel TTL / DB sisme onleme
#   sudo bash scripts/install_ban_db_prune_cron.sh
#   sudo bash scripts/install_ban_db_prune_cron.sh --remove
# Oncesi: sudo cp scripts/sudoers-ban-db-prune.example /etc/sudoers.d/log-guardian-ban-db-prune
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TTL="${INTEL_BAN_DB_TTL_DAYS:-7}"
LOG="${LG_BAN_DB_PRUNE_LOG:-/var/log/log-guardian-ban-db-prune.log}"
MARK="# log-guardian-ban-db-prune"
CRON_FILE="/etc/cron.d/log-guardian-ban-db-prune"

if [[ "${1:-}" == "--remove" ]]; then
  rm -f "$CRON_FILE"
  echo "[OK] ban_db_prune cron kaldirildi"
  exit 0
fi

[[ "$(id -u)" -eq 0 ]] || { echo "sudo gerekli" >&2; exit 1; }

install -d -m 755 "$(dirname "$LOG")"
touch "$LOG"
chmod 640 "$LOG" 2>/dev/null || true

cat >"$CRON_FILE" <<EOF
# Log Guardian — threat-intel ban_events TTL prune (ban mantigi degismez)
15 4 * * 1 root log-guardian ban-db-prune --ttl-days ${TTL} >>${LOG} 2>&1 ${MARK}
EOF
chmod 644 "$CRON_FILE"

echo "[OK] install_ban_db_prune_cron"
echo "  Pazartesi 04:15 — ban-db-prune --ttl-days ${TTL}"
echo "  Log: $LOG"
echo "  sudoers: scripts/sudoers-ban-db-prune.example"
echo "  Kaldir: sudo bash scripts/install_ban_db_prune_cron.sh --remove"
