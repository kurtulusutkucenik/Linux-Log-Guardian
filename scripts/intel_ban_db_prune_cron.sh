#!/usr/bin/env bash
# Haftalik INTEL_BAN_DB prune — ban mantigina dokunmaz; sudo -n gerekir
#   bash scripts/intel_ban_db_prune_cron.sh
#   DRY_RUN=1 bash scripts/intel_ban_db_prune_cron.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

TTL_DAYS=$(lg_rules_kv "INTEL_BAN_DB_TTL_DAYS")
TTL_DAYS="${TTL_DAYS:-7}"
STALE_WARN="${INTEL_BAN_STALE_WARN_ROWS:-500}"
LAPTOP_PRUNE="${INTEL_BAN_STALE_LAPTOP_PRUNE:-10}"

if ! sudo -n true 2>/dev/null; then
  echo "[intel_ban_db_prune_cron] sudo -n yok — atlandi (NOPASSWD veya elle kos)" >&2
  exit 0
fi

WARN_ONLY=1 bash "$ROOT/scripts/intel_ban_db_ops_check.sh" || true

stale=0
if [[ -f "$ROOT/intel-ban-db-report.json" ]]; then
  stale=$(python3 -c "import json; print(json.load(open('$ROOT/intel-ban-db-report.json')).get('stale_rows',0))")
fi

if [[ "$stale" -lt "$STALE_WARN" && "$stale" -lt "$LAPTOP_PRUNE" ]]; then
  echo "[OK] intel_ban_db_prune_cron — stale=${stale} < laptop=${LAPTOP_PRUNE} / warn=${STALE_WARN}, prune atlandi"
  exit 0
fi

if [[ "$stale" -lt "$STALE_WARN" ]]; then
  echo "[intel_ban_db_prune_cron] laptop prune stale=${stale} (>=${LAPTOP_PRUNE})"
fi

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "[intel_ban_db_prune_cron] DRY_RUN stale=${stale} — sudo log-guardian ban-db-prune --ttl-days ${TTL_DAYS}"
  exit 0
fi

pruned=$(sudo -n log-guardian ban-db-prune --ttl-days "$TTL_DAYS" 2>/dev/null | tail -1 || echo 0)
echo "[OK] intel_ban_db_prune_cron — stale=${stale} pruned=${pruned} ttl=${TTL_DAYS}d"

WARN_ONLY=1 bash "$ROOT/scripts/intel_ban_db_ops_check.sh" || true
