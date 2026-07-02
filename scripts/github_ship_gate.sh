#!/usr/bin/env bash
# Sprint AS — GitHub push oncesi tam kapı (presentation_ship + security_closure + secret scan)
#   bash scripts/github_ship_gate.sh
#   LIVE_PUBLISH=1 WITH_FLEET=1 bash scripts/github_ship_gate.sh
#   SKIP_CLOSURE=1 bash scripts/github_ship_gate.sh   # hizli — closure atla
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"
export LIVE_WEBHOOK="${LIVE_WEBHOOK:-0}"

REPORT="${GITHUB_SHIP_GATE_REPORT:-github-ship-gate-report.json}"
SHIP_REPORT="${PRESENTATION_SHIP_GATE_REPORT:-presentation-ship-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/github_ship_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[github_ship_gate] FAIL: $*" >&2
  exit 1
}

echo "=== github_ship_gate (Sprint AS) ==="

ship_ok=false
closure_ok=false
closure_skip=false
secret_ok=false

set +e
LIVE_PUBLISH="${LIVE_PUBLISH:-0}" WITH_FLEET="${WITH_FLEET:-0}" \
  bash "$ROOT/scripts/presentation_ship_gate.sh" >/dev/null 2>&1
ship_rc=$?
set -e
if [[ "$ship_rc" -eq 0 ]]; then
  ship_ok=true
  echo "[OK] presentation_ship_gate"
else
  echo "[FAIL] presentation_ship_gate — LIVE_PUBLISH=1 WITH_FLEET=1 bash scripts/presentation_ship_gate.sh" >&2
fi

if [[ "${SKIP_CLOSURE:-0}" == "1" ]]; then
  closure_skip=true
  echo "[SKIP] security_closure_gate (SKIP_CLOSURE=1)"
else
  set +e
  SKIP_DOCKER=1 SKIP_SIEM_E2E=1 bash "$ROOT/scripts/security_closure_gate.sh" >/dev/null 2>&1
  closure_rc=$?
  set -e
  if [[ "$closure_rc" -eq 0 ]]; then
    closure_ok=true
    echo "[OK] security_closure_gate (SKIP_DOCKER=1)"
  else
    echo "[FAIL] security_closure_gate — SKIP_DOCKER=1 bash scripts/security_closure_gate.sh" >&2
  fi
fi

if bash "$ROOT/scripts/pre_push_secret_scan.sh" >/dev/null 2>&1; then
  secret_ok=true
  echo "[OK] pre_push_secret_scan"
else
  echo "[FAIL] pre_push_secret_scan" >&2
fi

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$SHIP_REPORT" \
  "$ship_ok" "$closure_ok" "$closure_skip" "$secret_ok" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
ship_path = Path(sys.argv[3])
ship_ok = sys.argv[4] == "true"
closure_ok = sys.argv[5] == "true"
closure_skip = sys.argv[6] == "true"
secret_ok = sys.argv[7] == "true"

ship = {}
if ship_path.is_file():
    ship = json.loads(ship_path.read_text(encoding="utf-8"))

proof_n = proof_pass = 0
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")

reasons = []
if not ship_ok:
    reasons.append("presentation_ship")
if not closure_skip and not closure_ok:
    reasons.append("security_closure")
if not secret_ok:
    reasons.append("pre_push_secret_scan")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "presentation_ship_ok": ship_ok,
    "security_closure_ok": closure_ok if not closure_skip else None,
    "security_closure_skipped": closure_skip,
    "secret_scan_ok": secret_ok,
    "website_live_ok": ship.get("website_live_ok"),
    "vm_fleet_ok": ship.get("vm_fleet_ok") if ship.get("vm_fleet_ok") is not None else None,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "dash_url": ship.get("dash_url") or "https://localhost:8443/tests",
    "site_url": ship.get("site_url") or "https://ceniklinuxlogguardian.org/tests",
    "script": "scripts/github_ship_gate.sh",
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
  echo "[OK] github_ship_gate — GitHub push hazir"
  gate_rc=0
else
  echo "[FAIL] github_ship_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  Tam paket: LIVE_PUBLISH=1 WITH_FLEET=1 bash scripts/github_ship_gate.sh"
echo "  Hizli: SKIP_CLOSURE=1 bash scripts/github_ship_gate.sh"
exit "$gate_rc"
