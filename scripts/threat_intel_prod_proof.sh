#!/usr/bin/env bash
# Threat intel prod kaniti — timer + TTL + ipset + sync
#   sudo bash scripts/threat_intel_prod_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${THREAT_INTEL_PROD_REPORT:-threat-intel-prod-report.json}"

fail() { echo "[threat_intel_prod] FAIL: $*" >&2; exit 1; }

echo "=== threat_intel_prod_proof ==="

RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"

ttl_ok=0 prod_marker=0 timer_enabled=0 timer_active=0
ipset_type_ok=0 ipset_count=0

if [[ -f "$RULES" ]]; then
  ttl=$(grep -E '^INTEL_BAN_DB_TTL_DAYS=' "$RULES" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r' || true)
  [[ "$ttl" == "7" ]] && ttl_ok=1
  grep -qE '^THREAT_INTEL_PROD=1' "$RULES" 2>/dev/null && prod_marker=1
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl is-enabled log-guardian-threatintel.timer &>/dev/null && timer_enabled=1
  systemctl is-active log-guardian-threatintel.timer &>/dev/null && timer_active=1
fi

ipset_header_val() {
  local field="$1"
  set +o pipefail
  ipset list log_analyzer_block_v4 2>/dev/null | awk -v want="$field" '
    want == "type" && /^Type:/ { print $2; exit }
    want == "entries" && /^Number of entries:/ { print $4; exit }
  ' || true
}

if command -v ipset >/dev/null 2>&1 && ipset list log_analyzer_block_v4 &>/dev/null; then
  typ=$(ipset_header_val type)
  [[ "$typ" == "hash:net" ]] && ipset_type_ok=1
  ipset_count=$(ipset_header_val entries)
  ipset_count=${ipset_count:-0}
fi

echo "  INTEL_BAN_DB_TTL_DAYS=7 : $([[ $ttl_ok -eq 1 ]] && echo OK || echo YOK)"
echo "  THREAT_INTEL_PROD=1     : $([[ $prod_marker -eq 1 ]] && echo OK || echo YOK)"
echo "  timer enabled/active    : $timer_enabled/$timer_active"
echo "  ipset hash:net          : $([[ $ipset_type_ok -eq 1 ]] && echo OK || echo YOK) (entries=$ipset_count)"

sync_pass=0
MIN_LIVE_IPSET="${THREAT_INTEL_MIN_LIVE_IPSET:-100}"
if [[ "$(id -u)" -eq 0 ]]; then
  if [[ "${ipset_count:-0}" -ge "$MIN_LIVE_IPSET" ]]; then
    sync_pass=1
    echo "[threat_intel_prod] canli ipset sync kabul (entries=${ipset_count})"
  else
    FIXTURE="${THREAT_INTEL_FIXTURE:-$ROOT/corpus/fixtures/firehol_sample.netset}"
    if THREAT_INTEL_FIXTURE="$FIXTURE" bash "$ROOT/scripts/threat_intel_sync_proof.sh"; then
      sync_pass=1
    fi
  fi
else
  echo "[WARN] sync kaniti icin sudo gerekli" >&2
fi

db_summary=0
DB="/etc/log-guardian/events.db"
[[ -f "$DB" ]] || DB="$ROOT/events.db"
if command -v sqlite3 >/dev/null 2>&1 && [[ -f "$DB" ]]; then
  db_summary=$(sqlite3 -noheader "$DB" \
    "SELECT COUNT(*) FROM ban_events WHERE reason LIKE 'threat-intel-summary:%';" 2>/dev/null || echo 0)
fi

threat_intel_prod_enabled=0
if [[ $ttl_ok -eq 1 && $prod_marker -eq 1 && $timer_enabled -eq 1 && $ipset_type_ok -eq 1 && $sync_pass -eq 1 ]]; then
  threat_intel_prod_enabled=1
fi

pass=$threat_intel_prod_enabled

python3 - "$REPORT" "$ttl_ok" "$prod_marker" "$timer_enabled" "$timer_active" \
  "$ipset_type_ok" "$ipset_count" "$sync_pass" "$db_summary" \
  "$threat_intel_prod_enabled" "$pass" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report = Path(sys.argv[1])
vals = [int(x) for x in sys.argv[2:12]]
ttl_ok, prod, t_en, t_act, ipset_ok, ipset_n, sync_ok, db_sum, prod_en, passed = vals

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": "threat_intel_prod",
    "checks": {
        "intel_ban_db_ttl_days_7": bool(ttl_ok),
        "threat_intel_prod_marker": bool(prod),
        "timer_enabled": bool(t_en),
        "timer_active": bool(t_act),
        "ipset_hash_net": bool(ipset_ok),
        "ipset_entries": ipset_n,
        "sync_pass": bool(sync_ok),
        "db_summary_rows": db_sum,
        "threat_intel_prod_enabled": bool(prod_en),
    },
    "threat_feed_enabled": bool(prod_en),
    "pass": bool(passed),
    "note": "bash threat_intel.sh + timer; THREAT_FEED_ENABLED C modulu ayri opsiyonel katman",
}
report.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[threat_intel_prod] prod_enabled={prod_en} ipset={ipset_n} sync={sync_ok} pass={passed}")
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true

[[ "$pass" -eq 1 ]] || fail "eksik (ttl=$ttl_ok prod=$prod_marker timer=$timer_enabled ipset=$ipset_type_ok sync=$sync_pass)"
echo "[OK] threat_intel_prod_proof -> $REPORT"
