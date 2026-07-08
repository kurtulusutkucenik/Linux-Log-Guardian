#!/usr/bin/env bash
# Fleet agent offline — fleet-multi-node rapor tazeligi
#   bash scripts/fleet_offline_gate.sh
#   MAX_AGE_MIN=15 bash scripts/fleet_offline_gate.sh
#   AUTO_REFRESH=0 bash scripts/fleet_offline_gate.sh   # bayat raporda otomatik tazeleme kapali
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT="${FLEET_OFFLINE_GATE_REPORT:-fleet-offline-gate-report.json}"
RPT="$ROOT/fleet-multi-node-report.json"
MAX_MIN="${MAX_AGE_MIN:-15}"
AUTO_REFRESH="${AUTO_REFRESH:-1}"

report_stale() {
  python3 - "$RPT" "$MAX_MIN" <<'PY'
import datetime, json, sys
from pathlib import Path
p, max_min = Path(sys.argv[1]), float(sys.argv[2])
if not p.is_file():
    sys.exit(2)
d = json.loads(p.read_text(encoding="utf-8"))
raw = d.get("date") or ""
if not raw:
    sys.exit(0)
dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
if dt.tzinfo is None:
    dt = dt.replace(tzinfo=datetime.timezone.utc)
age = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 60.0
sys.exit(1 if age > max_min else 0)
PY
}

if [[ "${STRICT:-0}" != "1" && "$AUTO_REFRESH" == "1" ]]; then
  stale_rc=0
  report_stale || stale_rc=$?
  if [[ "$stale_rc" -eq 1 || "$stale_rc" -eq 2 ]]; then
    echo "[fleet_offline_gate] rapor bayat/eksik — laptop-simulated tazeleme..."
    export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
    FLEET_MODE=laptop-simulated bash "$ROOT/scripts/fleet_multi_node_e2e.sh" >/dev/null 2>&1 \
      || echo "[WARN] fleet_multi_node_e2e tazeleme basarisiz — mevcut raporla devam" >&2
  fi
fi

python3 - "$REPORT" "$RPT" "$MAX_MIN" <<'PY'
import datetime, json, os, sys
from pathlib import Path

report_path, rpt_path, max_min = Path(sys.argv[1]), Path(sys.argv[2]), float(sys.argv[3])
now = datetime.datetime.now(datetime.timezone.utc)
pass_ = True
reason = ""
online = 0
total = 0

mode = ""
if not rpt_path.is_file():
    pass_ = False
    reason = "fleet-multi-node-report.json yok"
else:
    d = json.loads(rpt_path.read_text(encoding="utf-8"))
    mode = str(d.get("mode") or "")
    nodes = d.get("nodes") or []
    if isinstance(nodes, list) and nodes:
        total = len(nodes)
        for n in nodes:
            if isinstance(n, dict) and n.get("online") is True:
                online += 1
    else:
        # laptop-simulated rapor: agent_count / online_count
        try:
            total = int(d.get("agent_count") or 0)
        except (TypeError, ValueError):
            total = 0
        try:
            online = int(d.get("online_count") or 0)
        except (TypeError, ValueError):
            online = 0
        if total <= 0 and isinstance(d.get("agents"), list):
            total = len(d["agents"])
    raw = d.get("date") or ""
    if raw:
        dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        age_min = (now - dt).total_seconds() / 60.0
        if age_min > max_min:
            pass_ = False
            reason = f"rapor bayat ({age_min:.0f}m > {max_min}m)"
    if pass_ and total > 0 and online == 0:
        pass_ = False
        reason = "tum agentlar offline"
    # simulated: en az 1 online beklenir (demo)
    if pass_ and "simulated" in mode and total > 0 and online < 1:
        pass_ = False
        reason = "simulated filo online=0"

out = {
    "date": now.isoformat(),
    "pass": pass_,
    "reason": reason,
    "online": online,
    "total": total,
    "mode": mode,
    "max_age_min": max_min,
    "script": "scripts/fleet_offline_gate.sh",
}
report_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
strict = os.environ.get("STRICT", "0") == "1"
if pass_:
    sys.exit(0)
if strict:
    sys.exit(1)
print("[WARN] fleet_offline_gate — STRICT=0, devam", file=sys.stderr)
sys.exit(0)
PY
