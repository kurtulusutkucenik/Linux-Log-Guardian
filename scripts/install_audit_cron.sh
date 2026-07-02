#!/usr/bin/env bash
# Haftalik guvenlik denetimi cron (ayri scriptler)
#   bash scripts/install_audit_cron.sh
#   bash scripts/install_audit_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_SEC="${LG_AUDIT_LOG:-$HOME/lg-security-audit.log}"
LOG_DOCS="${LG_DOCS_CHECK_LOG:-$HOME/lg-docs-check.log}"

MARK_SEC="# log-guardian-security-audit"
MARK_DOCS="# log-guardian-docs-check"

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
  crontab_list | grep -v "$MARK_SEC" | grep -v "$MARK_DOCS" | crontab_for_user - 2>/dev/null || true
  echo "[OK] audit cron kaldirildi"
  exit 0
fi

LINE_SEC="0 9 * * 1 cd \"$ROOT\" && bash scripts/local_security_audit.sh >>\"$LOG_SEC\" 2>&1 $MARK_SEC"
LINE_DOCS="15 9 * * 1 cd \"$ROOT\" && bash scripts/docs_consistency_check.sh >>\"$LOG_DOCS\" 2>&1 $MARK_DOCS"

( crontab_list | grep -v "$MARK_SEC" | grep -v "$MARK_DOCS" || true
  echo "$LINE_SEC"
  echo "$LINE_DOCS"
) | crontab_for_user -

echo "[OK] install_audit_cron"
echo "  Pazartesi 09:00 — local_security_audit -> $LOG_SEC"
echo "  Pazartesi 09:15 — docs_consistency_check -> $LOG_DOCS"
echo "  Kaldir: bash scripts/install_audit_cron.sh --remove"
