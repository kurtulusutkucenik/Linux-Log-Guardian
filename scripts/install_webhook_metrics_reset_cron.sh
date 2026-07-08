#!/usr/bin/env bash
# Grafana webhook fail stale alarm onleme — haftalik reset (Pazar 08:00)
#   bash scripts/install_webhook_metrics_reset_cron.sh
#   bash scripts/install_webhook_metrics_reset_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_WEBHOOK_RESET_LOG:-$HOME/lg-webhook-metrics-reset.log}"
MARK="# log-guardian-webhook-metrics-reset"

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
  echo "[OK] webhook_metrics_reset cron kaldirildi"
  exit 0
fi

LINE="0 8 * * 0 cd \"$ROOT\" && bash scripts/webhook_metrics_reset.sh >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_webhook_metrics_reset_cron"
echo "  Pazar 08:00 — webhook_metrics_reset -> $LOG"
echo "  Manuel: bash scripts/webhook_metrics_reset.sh"
echo "  Kaldir: bash scripts/install_webhook_metrics_reset_cron.sh --remove"
