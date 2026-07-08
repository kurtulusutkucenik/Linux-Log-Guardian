#!/usr/bin/env bash
# docs/evidence/ otomatik sync — sprint sonu / haftalik
#   bash scripts/install_evidence_sync_cron.sh
#   bash scripts/install_evidence_sync_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_EVIDENCE_SYNC_LOG:-$HOME/lg-evidence-sync.log}"
MARK="# log-guardian-evidence-sync"

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
  echo "[OK] evidence_sync cron kaldirildi"
  exit 0
fi

LINE="15 10 * * 5 cd \"$ROOT\" && bash scripts/sync_evidence_pack.sh >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_evidence_sync_cron"
echo "  Cuma 10:15 — sync_evidence_pack -> $LOG"
echo "  Kaldir: bash scripts/install_evidence_sync_cron.sh --remove"
