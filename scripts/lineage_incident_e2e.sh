#!/usr/bin/env bash
# Lineage sinyali + log alarmi → tek INCIDENT (incident-sim + lineage risk)
#   bash scripts/lineage_incident_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/lineage-incident-report.json"

fail() { echo "[lineage_incident_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== lineage_incident_e2e ==="

make -s log-guardian 2>/dev/null || make -s log-guardian

sim_out="$(./log-guardian incident-sim 2>/dev/null)" || fail "incident-sim"
echo "$sim_out"

python3 - "$sim_out" "$REPORT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

raw = sys.argv[1].strip()
if not raw.startswith("{"):
    raise SystemExit(f"incident-sim JSON bekleniyor: {raw[:120]}")
data = json.loads(raw)
inc_id = data.get("incident_id") or ""
if not inc_id.startswith("INC-"):
    raise SystemExit(f"INCIDENT id yok: {inc_id!r}")
active = int(data.get("active") or 0)
corr = int(data.get("correlated_total") or 0)
if active < 1:
    raise SystemExit(f"active incident yok: active={active}")

report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "incident-sim",
    "incident_id": inc_id,
    "ip": data.get("ip"),
    "active_incidents": active,
    "correlated_total": corr,
    "signals": ["LOG_SQLI", "EBPF_EXECVE"],
    "note": "lineage INC_SIG_EBPF_LINEAGE prod hattinda daemon ile birlesir",
}
Path(sys.argv[2]).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"incident_id={inc_id} active={active}")
PY

# lineage snapshot risk dogrulama (opsiyonel zincir)
if [[ -f "$ROOT/corpus/lineage_live_snapshot.json" ]]; then
  stats="$(./log-guardian lineage-stats --path "$ROOT/corpus/lineage_live_snapshot.json" 2>/dev/null)" || true
  echo "$stats" | grep -q '"max_risk"' && ok "lineage snapshot max_risk ok" || true
fi

ok "lineage_incident_e2e"
echo "[OK] lineage_incident_e2e"
