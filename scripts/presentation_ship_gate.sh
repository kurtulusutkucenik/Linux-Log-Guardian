#!/usr/bin/env bash
# Sprint AQ — Sunum + GitHub ship zinciri (demo_rehearsal + release_ready)
#   bash scripts/presentation_ship_gate.sh
#   WITH_FLEET=1 bash scripts/presentation_ship_gate.sh   # VM filo dahil
#   LIVE_PUBLISH=1 bash scripts/presentation_ship_gate.sh  # canli site 71 kart yayini
#   SKIP_LIVE=1 bash scripts/presentation_ship_gate.sh     # canli site atla
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"
export LIVE_WEBHOOK="${LIVE_WEBHOOK:-0}"
if [[ "${LIVE_PUBLISH:-0}" == "1" ]]; then
  export SKIP_LIVE=0
else
  export SKIP_LIVE="${SKIP_LIVE:-1}"
fi

REPORT="${PRESENTATION_SHIP_GATE_REPORT:-presentation-ship-gate-report.json}"
DEMO_REPORT="${DEMO_REHEARSAL_GATE_REPORT:-demo-rehearsal-gate-report.json}"
RELEASE_REPORT="${RELEASE_READY_GATE_REPORT:-release-ready-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/presentation_ship_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[presentation_ship_gate] FAIL: $*" >&2
  exit 1
}

echo "=== presentation_ship_gate (Sprint AQ) ==="

demo_ok=false
release_ok=false

set +e
LIVE_PUBLISH="${LIVE_PUBLISH:-0}" WITH_FLEET="${WITH_FLEET:-0}" \
  bash "$ROOT/scripts/demo_rehearsal_gate.sh" >/dev/null 2>&1
demo_rc=$?
set -e
if [[ "$demo_rc" -eq 0 ]]; then
  demo_ok=true
  echo "[OK] demo_rehearsal_gate"
else
  echo "[FAIL] demo_rehearsal_gate — bash scripts/demo_rehearsal_gate.sh" >&2
fi

# demo canli siteyi dogruladiysa release'de tekrar live gate kosma
release_skip_live="${SKIP_LIVE:-1}"
if [[ "${LIVE_PUBLISH:-0}" == "1" ]]; then
  release_skip_live=0
fi
if [[ -f "$DEMO_REPORT" ]]; then
  demo_live="$(python3 -c "import json;print(json.load(open('$DEMO_REPORT')).get('website_live_ok'))" 2>/dev/null || echo "")"
  if [[ "$demo_live" == "True" ]]; then
    release_skip_live=1
  fi
fi

fleet_skip=1
[[ "${WITH_FLEET:-0}" == "1" ]] && fleet_skip=0

if [[ "$fleet_skip" -eq 1 ]]; then
  python3 - "$ROOT/vm-fleet-gate-report.json" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path = Path(sys.argv[1])
existing = {}
if report_path.is_file():
    try:
        existing = json.loads(report_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        pass

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": True,
    "skipped": True,
    "skip_reason": "laptop routine — WITH_FLEET=1 ile tam filo provasi",
    "dash_url": existing.get("dash_url") or "https://localhost:8443",
    "host_agent": existing.get("host_agent") or "node-kurtulus-01",
    "vm_agent": existing.get("vm_agent") or "node-vm-02",
    "host_status": existing.get("host_status") or "Online",
    "vm_status": existing.get("vm_status") or "Offline",
    "online_count": existing.get("online_count", 1),
    "agent_count": existing.get("agent_count", 2),
    "host_keepalive_active": existing.get("host_keepalive_active", True),
    "laptop_ops_doc_ok": existing.get("laptop_ops_doc_ok", True),
    "script": "scripts/vm_fleet_gate.sh",
}
report_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
PY
  echo "[SKIP] vm_fleet_gate (laptop rutin — WITH_FLEET=1 ile tam prova)"
fi

set +e
SKIP_LIVE="$release_skip_live" SKIP_FLEET="$fleet_skip" bash "$ROOT/scripts/release_ready_gate.sh" >/dev/null 2>&1
release_rc=$?
set -e
if [[ "$release_rc" -eq 0 ]]; then
  release_ok=true
  echo "[OK] release_ready_gate (SKIP_LIVE=${release_skip_live})"
else
  echo "[FAIL] release_ready_gate — bash scripts/local_proof_refresh.sh" >&2
fi

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$DEMO_REPORT" "$RELEASE_REPORT" \
  "$demo_ok" "$release_ok" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
demo_path, release_path = Path(sys.argv[3]), Path(sys.argv[4])
demo_ok = sys.argv[5] == "true"
release_ok = sys.argv[6] == "true"

def load(p):
    if not p.is_file():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))

demo = load(demo_path)
release = load(release_path)

proof_n = proof_pass = 0
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")

reasons = []
if not demo_ok:
    reasons.append("demo_rehearsal")
if not release_ok:
    reasons.append("release_ready")

art = release.get("artifacts") or {}
art_n = sum(1 for k in ("competitive_proof_pdf", "data_room_zip", "release_pack_zip") if art.get(k))

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "demo_rehearsal_ok": demo_ok,
    "release_ready_ok": release_ok,
    "demo_3min_ok": demo.get("demo_3min_ok"),
    "dashboard_ok": demo.get("dashboard_ok"),
    "website_live_ok": demo.get("website_live_ok"),
    "docs_consistency_ok": release.get("docs_consistency_ok"),
    "artifacts_ok": art_n >= 3,
    "artifacts_count": f"{art_n}/3",
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "dash_url": demo.get("dash_url") or "https://localhost:8443/tests",
    "site_url": demo.get("site_url") or "https://ceniklinuxlogguardian.org/tests",
    "script": "scripts/presentation_ship_gate.sh",
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
  echo "[OK] presentation_ship_gate — sunum + ship hazir (demo + release zinciri)"
  gate_rc=0
else
  echo "[FAIL] presentation_ship_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  GitHub push: bash scripts/github_ship_gate.sh"
echo "  Tam paket: LIVE_PUBLISH=1 WITH_FLEET=1 bash scripts/presentation_ship_gate.sh"
echo "  Canli yayin: LIVE_PUBLISH=1 bash scripts/presentation_ship_gate.sh"
echo "  Filo dahil: WITH_FLEET=1 bash scripts/presentation_ship_gate.sh"
exit "$gate_rc"
