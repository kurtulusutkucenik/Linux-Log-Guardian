#!/usr/bin/env bash
# Sprint AT — Laptop Core operatör kapısı (edge + SOC + ban — VPS/GitHub yok)
#   bash scripts/laptop_core_gate.sh
#   SKIP_EDGE=1 bash scripts/laptop_core_gate.sh   # edge raporu yeterli
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"

REPORT="${LAPTOP_CORE_GATE_REPORT:-laptop-core-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/laptop_core_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[laptop_core_gate] FAIL: $*" >&2
  exit 1
}

echo "=== laptop_core_gate (Sprint AT) ==="

health_ok=false
edge_ok=false
edge_skip=false
soc_ok=false
ban_ok=false
dash_ok=false

LG="${LG_BIN:-$ROOT/log-guardian}"
[[ -x "$LG" ]] || LG="./log-guardian"
if [[ -x "$LG" ]] && "$LG" --health 2>/dev/null | grep -q 'daemon IPC: OK'; then
  health_ok=true
  echo "[OK] log-guardian --health (IPC)"
elif [[ -f "$ROOT/guardian-status.json" ]] \
    && [[ "$(python3 -c "import json;print(json.load(open('$ROOT/guardian-status.json')).get('ipc',''))" 2>/dev/null)" == "ok" ]]; then
  health_ok=true
  echo "[OK] guardian-status IPC"
else
  echo "[WARN] daemon IPC — sudo systemctl restart log-guardian-daemon"
fi

if [[ "${SKIP_EDGE:-0}" == "1" ]]; then
  edge_skip=true
  if [[ -f "$ROOT/edge-protection-gate-report.json" ]]; then
    ep="$(python3 -c "import json;print(json.load(open('$ROOT/edge-protection-gate-report.json')).get('pass'))" 2>/dev/null || echo "")"
    [[ "$ep" == "True" ]] && edge_ok=true && echo "[OK] edge_protection (rapor)"
  else
    echo "[SKIP] edge_protection (SKIP_EDGE=1)"
  fi
elif bash "$ROOT/scripts/edge_protection_gate.sh" >/dev/null 2>&1; then
  edge_ok=true
  echo "[OK] edge_protection_gate"
else
  echo "[WARN] edge_protection_gate — sudo bash scripts/prod_edge_setup.sh"
fi

if bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1; then
  soc_ok=true
  echo "[OK] telegram_soc_gate"
else
  echo "[WARN] telegram_soc_gate"
fi

if TEST_IP=203.0.113.198 bash "$ROOT/scripts/bans_telegram_ops_e2e.sh" >/dev/null 2>&1; then
  ban_ok=true
  echo "[OK] bans_telegram_ops"
elif [[ -f "$ROOT/dashboard-ban-api-report.json" ]] \
    && [[ "$(python3 -c "import json;print(json.load(open('$ROOT/dashboard-ban-api-report.json')).get('pass'))" 2>/dev/null)" == "True" ]]; then
  ban_ok=true
  echo "[OK] dashboard-ban-api (rapor)"
else
  echo "[WARN] bans_telegram_ops"
fi

if curl -skf --max-time 5 --resolve "localhost:8443:127.0.0.1" "https://localhost:8443/tests" -o /dev/null 2>/dev/null \
    && curl -skf --max-time 5 --resolve "localhost:8443:127.0.0.1" "https://localhost:8443/bans" -o /dev/null 2>/dev/null; then
  dash_ok=true
  echo "[OK] dashboard :8443/tests + /bans"
else
  echo "[WARN] dashboard — bash scripts/dashboard_refresh.sh"
fi

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$health_ok" "$edge_ok" "$edge_skip" "$soc_ok" "$ban_ok" "$dash_ok" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
health_ok = sys.argv[3] == "true"
edge_ok = sys.argv[4] == "true"
edge_skip = sys.argv[5] == "true"
soc_ok = sys.argv[6] == "true"
ban_ok = sys.argv[7] == "true"
dash_ok = sys.argv[8] == "true"

edge_rep = {}
ep = root_s / "edge-protection-gate-report.json"
if ep.is_file():
    edge_rep = json.loads(ep.read_text(encoding="utf-8"))

proof_n = proof_pass = 0
cp_pass = False
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")
    cp_pass = data.get("pass") is True

reasons = []
if not health_ok:
    reasons.append("daemon_ipc")
if not edge_skip and not edge_ok:
    reasons.append("edge_protection")
if not soc_ok:
    reasons.append("telegram_soc")
if not ban_ok:
    reasons.append("ban_ops")
if not dash_ok:
    reasons.append("dashboard_8443")
if not cp_pass:
    reasons.append("competitive_proof")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "health_ok": health_ok,
    "edge_protection_ok": edge_ok if not edge_skip else None,
    "edge_skipped": edge_skip,
    "telegram_soc_ok": soc_ok,
    "ban_ops_ok": ban_ok,
    "dashboard_ok": dash_ok,
    "xdp_mode": edge_rep.get("xdp_mode"),
    "ipc": edge_rep.get("ipc"),
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "dash_url": "https://localhost:8443/tests",
    "script": "scripts/laptop_core_gate.sh",
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
  echo "[OK] laptop_core_gate — Core operatör (edge + SOC + ban)"
  gate_rc=0
else
  echo "[FAIL] laptop_core_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  Sabah: bash scripts/morning_operator_gate.sh"
echo "  Hizli edge: SKIP_EDGE=1 bash scripts/laptop_core_gate.sh"
exit "$gate_rc"
