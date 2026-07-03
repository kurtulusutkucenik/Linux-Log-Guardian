#!/usr/bin/env bash
# Sprint AU — Sabah operatör kapisi (hizli — mevcut gate'leri bozmaz)
#   bash scripts/morning_operator_gate.sh
#   REFRESH=1 bash scripts/morning_operator_gate.sh   # laptop_core yeniden kos
# VPS/GitHub/video yok — rapor-oncelikli, demo_3min kosmaz
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"

REPORT="${MORNING_OPERATOR_GATE_REPORT:-morning-operator-gate-report.json}"
CORE_REPORT="${LAPTOP_CORE_GATE_REPORT:-laptop-core-gate-report.json}"
SHIP_REPORT="${PRESENTATION_SHIP_GATE_REPORT:-presentation-ship-gate-report.json}"
DEMO_REPORT="${DEMO_REHEARSAL_GATE_REPORT:-demo-rehearsal-gate-report.json}"
MAX_CORE_AGE_H="${MORNING_CORE_MAX_AGE_H:-6}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/morning_operator_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[morning_operator_gate] FAIL: $*" >&2
  exit 1
}

report_fresh_pass() {
  local path="$1" max_h="$2"
  python3 - "$path" "$max_h" <<'PY'
import json, sys, datetime
from pathlib import Path

p, max_h = Path(sys.argv[1]), float(sys.argv[2])
if not p.is_file():
    sys.exit(1)
d = json.loads(p.read_text(encoding="utf-8"))
if d.get("pass") is not True:
    sys.exit(1)
raw = d.get("date") or ""
if not raw:
    sys.exit(0)
try:
    dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    age_h = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 3600.0
    sys.exit(0 if age_h <= max_h else 1)
except ValueError:
    sys.exit(0)
PY
}

echo "=== morning_operator_gate (Sprint AU) ==="

core_ok=false
core_refreshed=false
ship_ok=false
dash_ok=false

if [[ "${REFRESH:-0}" == "1" ]] || ! report_fresh_pass "$ROOT/$CORE_REPORT" "$MAX_CORE_AGE_H"; then
  if SKIP_EDGE=1 bash "$ROOT/scripts/laptop_core_gate.sh" >/dev/null 2>&1; then
    core_ok=true
    core_refreshed=true
    echo "[OK] laptop_core_gate (yenilendi)"
  else
    echo "[FAIL] laptop_core_gate" >&2
  fi
elif report_fresh_pass "$ROOT/$CORE_REPORT" "$MAX_CORE_AGE_H"; then
  core_ok=true
  echo "[OK] laptop_core (rapor ≤${MAX_CORE_AGE_H}h)"
else
  echo "[FAIL] laptop_core raporu bayat/eksik — REFRESH=1 bash scripts/morning_operator_gate.sh" >&2
fi

if report_fresh_pass "$ROOT/$SHIP_REPORT" 48; then
  ship_ok=true
  echo "[OK] presentation_ship (rapor)"
elif report_fresh_pass "$ROOT/$DEMO_REPORT" 48; then
  ship_ok=true
  echo "[OK] demo_rehearsal (rapor)"
else
  echo "[WARN] ship/rehearsal raporu yok — bash scripts/presentation_ship_gate.sh"
fi

if curl -skf --max-time 5 --resolve "localhost:8443:127.0.0.1" "https://localhost:8443/tests" -o /dev/null 2>/dev/null; then
  dash_ok=true
  echo "[OK] dashboard :8443/tests"
else
  echo "[WARN] dashboard erisilemiyor"
fi

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$core_ok" "$core_refreshed" "$ship_ok" "$dash_ok" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
core_ok = sys.argv[3] == "true"
core_refreshed = sys.argv[4] == "true"
ship_ok = sys.argv[5] == "true"
dash_ok = sys.argv[6] == "true"

proof_n = proof_pass = 0
cp_pass = False
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")
    # "warn" laptop'ta bekleniyor (ör. k8s-admission kind cluster yok -> skip);
    # morning-operator karti bu gate'in kendi ciktisidir (self-reference) -
    # ikisini de bloklayici sayma. Kalan tek bir "fail" bile gate'i dusurur.
    blocking = [
        t for t in tests
        if t.get("status") not in ("pass", "warn")
        and t.get("id") != "morning-operator-gate"
    ]
    cp_pass = data.get("pass") is not False and not blocking

reasons = []
if not core_ok:
    reasons.append("laptop_core")
if not ship_ok:
    reasons.append("presentation_ship")
if not dash_ok:
    reasons.append("dashboard_8443")
if not cp_pass:
    reasons.append("competitive_proof")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "laptop_core_ok": core_ok,
    "laptop_core_refreshed": core_refreshed,
    "presentation_ship_ok": ship_ok,
    "dashboard_ok": dash_ok,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "dash_url": "https://localhost:8443/tests",
    "script": "scripts/morning_operator_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print("GATE_OK" if ok else "GATE_FAIL")
PY
)

python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true

gate_json=$(python3 - "$REPORT" "$ROOT" "$gate_ok_flag" <<'PY'
import json, sys
from pathlib import Path

report_path, root_s, gate_flag = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
out = json.loads(Path(report_path).read_text(encoding="utf-8"))
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    out["proof_tests"] = len(tests)
    out["proof_pass"] = sum(1 for t in tests if t.get("status") == "pass")
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
PY
)

echo "$gate_json"

LG_SYNC_NO_SUDO=1 bash "$ROOT/scripts/sync_dashboard_data.sh" >/dev/null 2>&1 || true

if [[ "$gate_ok_flag" == "GATE_OK" ]]; then
  echo "[OK] morning_operator_gate — sabah hazir (rapor-oncelikli, demo_3min yok)"
  gate_rc=0
else
  echo "[FAIL] morning_operator_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  Yenile: REFRESH=1 bash scripts/morning_operator_gate.sh"
exit "$gate_rc"
