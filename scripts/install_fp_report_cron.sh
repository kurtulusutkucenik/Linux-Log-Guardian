#!/usr/bin/env bash
# Haftalik FP raporu — gercek trafik / corpus kaniti
#   bash scripts/install_fp_report_cron.sh
#   bash scripts/install_fp_report_cron.sh --remove
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG="${LG_FP_REPORT_LOG:-$HOME/lg-fp-report.log}"
MARK="# log-guardian-fp-report"

if [[ "${1:-}" == "--remove" ]]; then
  crontab -l 2>/dev/null | grep -v "$MARK" | crontab - 2>/dev/null || true
  echo "[OK] fp report cron kaldirildi"
  exit 0
fi

LINE="0 8 * * 1 cd \"$ROOT\" && bash scripts/fp_report.sh >>\"$LOG\" 2>&1; cp -f fp-report.json .cache/dashboard-live/fp-report.json 2>/dev/null || true $MARK"

( crontab -l 2>/dev/null | grep -v "$MARK" || true
  echo "$LINE"
) | crontab -

echo "[OK] install_fp_report_cron"
echo "  Pazartesi 08:00 — fp_report.sh -> $LOG"
echo "  Kaldir: bash scripts/install_fp_report_cron.sh --remove"
