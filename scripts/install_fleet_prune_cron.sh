#!/usr/bin/env bash
# Fleet pending komut temizligi — haftalik (Pazar 09:30)
#   bash scripts/install_fleet_prune_cron.sh
#   bash scripts/install_fleet_prune_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_FLEET_PRUNE_LOG:-$HOME/lg-fleet-prune.log}"
MARK="# log-guardian-fleet-prune"

crontab_for_user() {
  if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
    sudo -u "$SUDO_USER" crontab "$@"
  else
    crontab "$@"
  fi
}

crontab_list() {
  crontab_for_user -l 2>/dev/null || true
}

if [[ "${1:-}" == "--remove" ]]; then
  crontab_list | grep -v "$MARK" | crontab_for_user - 2>/dev/null || true
  echo "[OK] fleet_prune cron kaldirildi"
  exit 0
fi

LINE="30 9 * * 0 cd \"$ROOT\" && bash scripts/fleet_prune_pending_commands.sh >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_fleet_prune_cron"
echo "  Pazar 09:30 — fleet_prune_pending_commands -> $LOG"
echo "  Kaldir: bash scripts/install_fleet_prune_cron.sh --remove"
