#!/usr/bin/env bash
# mTLS cert suresi — haftalik (Pazartesi 09:30) — Plan B2
#   bash scripts/install_mtls_cert_expiry_cron.sh
#   bash scripts/install_mtls_cert_expiry_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_MTLS_EXPIRY_LOG:-$HOME/lg-mtls-cert-expiry.log}"
MARK="# log-guardian-mtls-cert-expiry"

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
  echo "[OK] mtls_cert_expiry cron kaldirildi"
  exit 0
fi

LINE="30 9 * * 1 cd \"$ROOT\" && bash scripts/mtls_cert_expiry_check.sh >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_mtls_cert_expiry_cron"
echo "  Pazartesi 09:30 — mtls_cert_expiry_check -> $LOG"
echo "  Manuel: bash scripts/mtls_cert_expiry_check.sh"
echo "  Doc: docs/MTLS_ROTATION_RUNBOOK.md"
echo "  Kaldir: bash scripts/install_mtls_cert_expiry_cron.sh --remove"
