#!/usr/bin/env bash
# Sprint AR — Demo video hazirlik kapisi (04:00 kayit oncesi, interaktif degil)
#   bash scripts/demo_video_gate.sh
#   LIVE_WEBHOOK=1 bash scripts/demo_video_gate.sh   # gercek Telegram provasi
#   SKIP_SIEM=1 bash scripts/demo_video_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"
export LIVE_WEBHOOK="${LIVE_WEBHOOK:-0}"

REPORT="${DEMO_VIDEO_GATE_REPORT:-demo-video-gate-report.json}"
SITE_URL="${DEMO_SITE_URL:-https://ceniklinuxlogguardian.org}"
DASH_URL="${DASH_URL:-https://localhost:8443}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/demo_video_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[demo_video_gate] FAIL: $*" >&2
  exit 1
}

echo "=== demo_video_gate (Sprint AR) ==="

script_ok=false
pdf_ok=false
dash_ok=false
ship_ok=false
siem_ok=false
siem_skip=false
webhook_ok=false
webhook_skip=true
soc_ok=false

VIDEO="$ROOT/scripts/demo_video.sh"
[[ -f "$VIDEO" ]] || fail "demo_video.sh yok"
if grep -q "webhook_prod_e2e" "$VIDEO" && grep -q "siem_capture" "$VIDEO"; then
  script_ok=true
  echo "[OK] demo_video.sh (SIEM + webhook adimlari)"
else
  echo "[FAIL] demo_video.sh eksik adim" >&2
fi

for pdf in "$ROOT/competitive-proof.pdf" "$ROOT/docs/evidence/competitive-proof.pdf"; do
  if [[ -f "$pdf" ]]; then
    pdf_ok=true
    echo "[OK] kanit PDF ($(basename "$(dirname "$pdf")")/$(basename "$pdf"))"
    break
  fi
done
[[ "$pdf_ok" == true ]] || echo "[FAIL] competitive-proof.pdf yok" >&2

if curl -skf --max-time 5 --resolve "localhost:8443:127.0.0.1" "${DASH_URL}/tests" -o /dev/null 2>/dev/null; then
  dash_ok=true
  echo "[OK] dashboard ${DASH_URL}/tests"
else
  echo "[WARN] dashboard erisilemiyor"
fi

SHIP_REPORT="$ROOT/presentation-ship-gate-report.json"
DEMO_REPORT="$ROOT/demo-rehearsal-gate-report.json"
RELEASE_REPORT="$ROOT/release-ready-gate-report.json"
ship_ok=false
if [[ -f "$SHIP_REPORT" ]]; then
  ship_pass="$(python3 -c "import json; print(json.load(open('$SHIP_REPORT')).get('pass'))" 2>/dev/null || echo "")"
  if [[ "$ship_pass" == "True" ]]; then
    ship_ok=true
    echo "[OK] presentation_ship_gate (rapor)"
  fi
fi
if [[ "$ship_ok" != true ]]; then
  demo_pass=false
  release_pass=false
  if [[ -f "$DEMO_REPORT" ]]; then
    dp="$(python3 -c "import json;d=json.load(open('$DEMO_REPORT'));print(d.get('demo_3min_ok') and d.get('dashboard_ok') and d.get('pdf_ok'))" 2>/dev/null || echo False)"
    [[ "$dp" == "True" ]] && demo_pass=true
  fi
  if [[ -f "$RELEASE_REPORT" ]]; then
    rp="$(python3 -c "import json; print(json.load(open('$RELEASE_REPORT')).get('pass'))" 2>/dev/null || echo "")"
    [[ "$rp" == "True" ]] && release_pass=true
  fi
  if [[ "$demo_pass" == true && "$release_pass" == true ]]; then
    ship_ok=true
    echo "[OK] presentation_ship (demo + release raporlari)"
  else
    echo "[WARN] presentation_ship_gate pass=False — bash scripts/presentation_ship_gate.sh"
  fi
fi

if [[ "${SKIP_SIEM:-0}" == "1" ]]; then
  siem_skip=true
  echo "[SKIP] siem_export (SKIP_SIEM=1)"
elif [[ -f "$ROOT/siem-export-report.json" ]]; then
  siem_pass="$(python3 -c "import json; print(json.load(open('$ROOT/siem-export-report.json')).get('pass'))" 2>/dev/null || echo "")"
  if [[ "$siem_pass" == "True" ]]; then
    siem_ok=true
    echo "[OK] siem_export (rapor)"
  else
    echo "[WARN] siem-export-report pass=False"
  fi
elif [[ -f "$ROOT/scripts/siem_export_e2e.sh" ]]; then
  if SIEM_CAPTURE_PORT=15045 bash "$ROOT/scripts/siem_export_e2e.sh" >/dev/null 2>&1; then
    siem_ok=true
    echo "[OK] siem_export_e2e"
  else
    echo "[WARN] siem_export_e2e"
  fi
else
  echo "[WARN] siem_export_e2e.sh yok"
fi

[[ -f "$ROOT/scripts/siem_capture.py" ]] && echo "[OK] siem_capture.py" || echo "[WARN] siem_capture.py yok"

if [[ "${LIVE_WEBHOOK:-0}" == "1" ]]; then
  webhook_skip=false
  if LIVE_WEBHOOK=1 bash "$ROOT/scripts/webhook_prod_e2e.sh" >/dev/null 2>&1; then
    webhook_ok=true
    echo "[OK] webhook_prod_e2e (gercek Telegram)"
  else
    echo "[WARN] webhook_prod_e2e"
  fi
elif [[ -f "$ROOT/webhook-route-proof-report.json" ]]; then
  wh_pass="$(python3 -c "import json; print(json.load(open('$ROOT/webhook-route-proof-report.json')).get('pass'))" 2>/dev/null || echo "")"
  if [[ "$wh_pass" == "True" ]]; then
    webhook_ok=true
    echo "[OK] webhook_route (rapor)"
  else
    echo "[WARN] webhook-route-proof pass=False"
  fi
else
  echo "[SKIP] webhook — LIVE_WEBHOOK=1 veya webhook_route raporu"
fi

if bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1; then
  soc_ok=true
  echo "[OK] telegram_soc_gate"
else
  echo "[WARN] telegram_soc_gate"
fi

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$script_ok" "$pdf_ok" "$dash_ok" "$ship_ok" \
  "$siem_ok" "$siem_skip" "$webhook_ok" "$webhook_skip" "$soc_ok" "$SITE_URL" "$DASH_URL" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
script_ok = sys.argv[3] == "true"
pdf_ok = sys.argv[4] == "true"
dash_ok = sys.argv[5] == "true"
ship_ok = sys.argv[6] == "true"
siem_ok = sys.argv[7] == "true"
siem_skip = sys.argv[8] == "true"
webhook_ok = sys.argv[9] == "true"
webhook_skip = sys.argv[10] == "true"
soc_ok = sys.argv[11] == "true"
site_url, dash_url = sys.argv[12], sys.argv[13]

proof_n = proof_pass = 0
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")

reasons = []
if not script_ok:
    reasons.append("demo_video_script")
if not pdf_ok:
    reasons.append("pdf_missing")
if not dash_ok:
    reasons.append("dashboard_8443")
if not ship_ok:
    reasons.append("presentation_ship")
if not siem_skip and not siem_ok:
    reasons.append("siem_export")
if not webhook_skip and not webhook_ok:
    reasons.append("webhook_prod")
if not soc_ok:
    reasons.append("telegram_soc")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "demo_video_script_ok": script_ok,
    "pdf_ok": pdf_ok,
    "dashboard_ok": dash_ok,
    "presentation_ship_ok": ship_ok,
    "siem_export_ok": siem_ok if not siem_skip else None,
    "siem_skipped": siem_skip,
    "webhook_ok": webhook_ok if not webhook_skip else None,
    "webhook_skipped": webhook_skip,
    "telegram_soc_ok": soc_ok,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "site_url": f"{site_url}/tests",
    "dash_url": f"{dash_url}/tests",
    "video_script": "scripts/demo_video.sh",
    "script": "scripts/demo_video_gate.sh",
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
  echo "[OK] demo_video_gate — 04:00 kayda hazir (bash scripts/demo_video.sh)"
  gate_rc=0
else
  echo "[FAIL] demo_video_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  Interaktif kayit: bash scripts/demo_video.sh"
echo "  Gercek Telegram: LIVE_WEBHOOK=1 bash scripts/demo_video_gate.sh"
exit "$gate_rc"
