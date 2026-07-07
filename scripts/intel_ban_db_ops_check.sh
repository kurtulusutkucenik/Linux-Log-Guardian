#!/usr/bin/env bash
# INTEL_BAN_DB TTL + ban_events boyut kontrolu — ban mantigina dokunmaz
#   bash scripts/intel_ban_db_ops_check.sh
#   WARN_ONLY=1 bash scripts/intel_ban_db_ops_check.sh   # exit 0 (sabah gate icin)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${INTEL_BAN_DB_REPORT:-intel-ban-db-report.json}"
WARN_ONLY="${WARN_ONLY:-0}"
MAX_TOTAL="${INTEL_BAN_DB_MAX_ROWS:-50000}"

# shellcheck source=scripts/lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

CONF=$(lg_rules_conf_path)
DB_REL=$(lg_rules_kv "DB_PATH")
DB_REL="${DB_REL:-data/events.db}"
if [[ "$DB_REL" == /* ]]; then
  DB="$DB_REL"
else
  DB="$(dirname "$CONF")/$DB_REL"
fi
[[ -f "$DB" ]] || DB="/etc/log-guardian/events.db"

TTL_DAYS=$(lg_rules_kv "INTEL_BAN_DB_TTL_DAYS")
TTL_DAYS="${TTL_DAYS:-7}"

fail_reason=""
ban_total=0
intel_legacy=0
intel_summary=0
stale_rows=0
db_bytes=0

if [[ -f "$DB" ]] && command -v sqlite3 >/dev/null 2>&1; then
  ban_total=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ban_events;" 2>/dev/null || echo 0)
  intel_legacy=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ban_events WHERE reason='threat-intel' AND ip != 'system';" 2>/dev/null || echo 0)
  intel_summary=$(sqlite3 "$DB" "SELECT COUNT(*) FROM ban_events WHERE ip='system' AND reason LIKE 'threat-intel-summary:%';" 2>/dev/null || echo 0)
  stale_cutoff=$(( $(date +%s) - TTL_DAYS * 86400 ))
  stale_rows=$(sqlite3 "$DB" \
    "SELECT COUNT(*) FROM ban_events WHERE (reason = 'threat-intel' OR reason LIKE 'threat-intel%' OR reason LIKE 'geoip%' OR reason IN ('url','stix','abuseipdb','otx')) AND ts < $stale_cutoff;" \
    2>/dev/null || echo 0)
  db_bytes=$(stat -c '%s' "$DB" 2>/dev/null || stat -f '%z' "$DB" 2>/dev/null || echo 0)
else
  fail_reason="db_unreadable"
fi

notes=()
[[ "$ban_total" -gt "$MAX_TOTAL" ]] && notes+=("ban_events_total=${ban_total} > ${MAX_TOTAL}")
[[ "$intel_legacy" -gt 0 ]] && notes+=("intel_legacy_rows=${intel_legacy} (beklenen 0 — threat-intel ozet modu)")
[[ "$stale_rows" -gt "$MAX_TOTAL" ]] && notes+=("intel_stale_rows_${TTL_DAYS}d=${stale_rows}")

pass=true
[[ -n "$fail_reason" ]] && pass=false
[[ ${#notes[@]} -gt 0 ]] && pass=false

python3 - "$REPORT" "$pass" "$fail_reason" "$DB" "$TTL_DAYS" "$ban_total" \
  "$intel_legacy" "$intel_summary" "$stale_rows" "$db_bytes" "$MAX_TOTAL" "${notes[*]:-}" <<'PY'
import json, datetime, sys
from pathlib import Path

report, pass_s, fail_reason, db, ttl = sys.argv[1:6]
ban_total, intel_legacy, intel_summary, stale_rows, db_bytes, max_total = map(int, sys.argv[6:12])
notes_raw = sys.argv[12] if len(sys.argv) > 12 else ""
notes = [n for n in notes_raw.split() if n] if notes_raw else []

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": pass_s == "true",
    "db_path": db,
    "intel_ban_db_ttl_days": int(ttl),
    "ban_events_total": ban_total,
    "intel_legacy_rows": intel_legacy,
    "intel_summary_rows": intel_summary,
    "stale_rows": stale_rows,
    "db_bytes": db_bytes,
    "max_total_rows": max_total,
    "script": "scripts/intel_ban_db_ops_check.sh",
}
if fail_reason:
    out["fail_reason"] = fail_reason
if notes:
    out["notes"] = notes
    out["remediation"] = (
        "sudo log-guardian ban-db-prune --ttl-days "
        + ttl
        + " · docs/EDGE_PROTECTION.md INTEL_BAN_DB_TTL_DAYS"
    )
Path(report).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
PY

if [[ "$pass" == "true" ]]; then
  echo "[OK] intel_ban_db_ops_check — total=${ban_total} ttl=${TTL_DAYS}d db=${db_bytes}B"
  exit 0
fi

echo "[WARN] intel_ban_db_ops_check — ${notes[*]:-$fail_reason}" >&2
echo "  Prune: sudo log-guardian ban-db-prune --ttl-days ${TTL_DAYS}" >&2
echo "  Rehber: docs/EDGE_PROTECTION.md" >&2
[[ "$WARN_ONLY" == "1" ]] && exit 0
exit 1
