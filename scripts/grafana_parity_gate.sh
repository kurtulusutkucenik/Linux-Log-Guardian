#!/usr/bin/env bash
# Sprint AF — grafanaPanels.ts <-> grafana-dashboard.json metrik parity
#   bash scripts/grafana_parity_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${GRAFANA_PARITY_GATE_REPORT:-grafana-parity-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/grafana_parity_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[grafana_parity_gate] FAIL: $*" >&2
  exit 1
}

echo "=== grafana_parity_gate (Sprint AF) ==="

python3 - "$REPORT" "$ROOT/dashboard/src/lib/grafanaPanels.ts" "$ROOT/grafana-dashboard.json" <<'PY'
import json, datetime, re, sys
from pathlib import Path

report_path, panels_ts, dash_json = sys.argv[1:4]
panels_src = Path(panels_ts).read_text(encoding="utf-8")
dash = json.loads(Path(dash_json).read_text(encoding="utf-8"))

def panel_metrics(text: str) -> set[str]:
    return set(re.findall(r"loganalyzer_[a-z0-9_]+", text))

def dash_metrics(obj) -> set[str]:
    out: set[str] = set()
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "expr" and isinstance(v, str):
                out |= panel_metrics(v)
            else:
                out |= dash_metrics(v)
    elif isinstance(obj, list):
        for x in obj:
            out |= dash_metrics(x)
    return out

pm = panel_metrics(panels_src)
dm = dash_metrics(dash)

missing_in_dash = sorted(pm - dm)
missing_in_panels = sorted(
    m for m in dm
    if m.startswith("loganalyzer_")
    and m not in pm
    and not m.endswith("_total{")  # guard noise
)

# Core dashboard stat metrics must be mirrored in panels.ts
core = {
    "loganalyzer_api_auth_fail_total",
    "loganalyzer_api_rate_limited_total",
    "loganalyzer_api_requests_total",
    "loganalyzer_webhook_sent_total",
    "loganalyzer_webhook_fail_total",
    "loganalyzer_webhook_queue_drops_total",
    "loganalyzer_threat_last_sync_ts",
    "loganalyzer_threat_last_applied",
    "loganalyzer_threat_last_failed",
    "loganalyzer_fp_learn_enabled",
    "loganalyzer_fp_suppressed_total",
    "loganalyzer_ban_pipeline_ipc",
    "loganalyzer_ban_pipeline_xdp",
}
core_missing = sorted(core - pm)

reasons = []
if core_missing:
    reasons.append("core_missing:" + ",".join(core_missing))
if missing_in_dash:
    reasons.append("panels_not_in_dash:" + ",".join(missing_in_dash[:8]))
if len(missing_in_dash) > 8:
    reasons[-1] += f"+{len(missing_in_dash)-8}"

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "panel_metrics": len(pm),
    "dashboard_metrics": len(dm),
    "missing_in_dashboard": missing_in_dash,
    "missing_in_panels": missing_in_panels[:20],
    "core_missing": core_missing,
    "script": "scripts/grafana_parity_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)

Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

echo "[OK] grafana_parity_gate — panel_metrics=$(python3 -c "import json; print(json.load(open('$REPORT'))['panel_metrics'])")"
