#!/usr/bin/env bash
# Haftalik kanit tazeligi cron (Cuma 10:00)
#   bash scripts/install_weekly_operator_cron.sh
#   bash scripts/install_weekly_operator_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_WEEKLY_OPS_LOG:-$HOME/lg-weekly-operator.log}"
MARK="# log-guardian-weekly-operator"

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
  echo "[OK] weekly_operator cron kaldirildi"
  exit 0
fi

LINE="0 10 * * 5 cd \"$ROOT\" && bash scripts/weekly_operator_ritual.sh >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_weekly_operator_cron"
echo "  Cuma 10:00 — weekly_operator_ritual -> $LOG"
echo "  Tam PDF: LOCAL_PROOF=1 bash scripts/weekly_operator_ritual.sh"
echo "  Kaldir: bash scripts/install_weekly_operator_cron.sh --remove"
