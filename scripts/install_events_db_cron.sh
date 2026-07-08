#!/usr/bin/env bash
# events.db bakim — VACUUM haftalik (TUI/rapor performansi)
#   bash scripts/install_events_db_cron.sh
#   bash scripts/install_events_db_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${LG_EVENTS_DB:-/var/lib/log-guardian/events.db}"
LOG="${LG_EVENTS_DB_LOG:-$HOME/lg-events-db-maint.log}"
MARK="# log-guardian-events-db-maint"

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
  echo "[OK] events_db cron kaldirildi"
  exit 0
fi

LINE="30 3 * * 0 sqlite3 \"$DB\" 'PRAGMA optimize; VACUUM;' >>\"$LOG\" 2>&1 $MARK"

( crontab_list | grep -v "$MARK" || true
  echo "$LINE"
) | crontab_for_user -

echo "[OK] install_events_db_cron"
echo "  Pazar 03:30 — sqlite3 VACUUM -> $LOG"
echo "  DB: $DB (yoksa cron sessizce atlar)"
echo "  Kaldir: bash scripts/install_events_db_cron.sh --remove"
