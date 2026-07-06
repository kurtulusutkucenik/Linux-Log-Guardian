#!/usr/bin/env bash
# Günlük sabah kapısı + haftalık core kanıt yenileme cron
#   bash scripts/install_operator_cron.sh
#   bash scripts/install_operator_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_MORNING="${LG_MORNING_GATE_LOG:-$HOME/lg-morning-operator-gate.log}"
LOG_CORE="${LG_CORE_PROOF_LOG:-$HOME/lg-core-proof-refresh.log}"

MARK_MORNING="# log-guardian-morning-operator-gate"
MARK_CORE="# log-guardian-core-proof-refresh"

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
  crontab_list | grep -v "$MARK_MORNING" | grep -v "$MARK_CORE" | crontab_for_user - 2>/dev/null || true
  echo "[OK] operator cron kaldirildi"
  exit 0
fi

LINE_MORNING="0 8 * * * cd \"$ROOT\" && bash scripts/morning_operator_gate.sh >>\"$LOG_MORNING\" 2>&1 $MARK_MORNING"
LINE_CORE="0 3 * * 0 cd \"$ROOT\" && bash scripts/core_proof_refresh.sh >>\"$LOG_CORE\" 2>&1 $MARK_CORE"

( crontab_list | grep -v "$MARK_MORNING" | grep -v "$MARK_CORE" || true
  echo "$LINE_MORNING"
  echo "$LINE_CORE"
) | crontab_for_user -

echo "[OK] install_operator_cron"
echo "  Her gun 08:00 — morning_operator_gate -> $LOG_MORNING"
echo "  Pazar 03:00 — core_proof_refresh -> $LOG_CORE"
echo "  Kaldir: bash scripts/install_operator_cron.sh --remove"
echo "  Manuel: bash scripts/morning_operator_gate.sh"
echo "          bash scripts/core_proof_refresh.sh"
