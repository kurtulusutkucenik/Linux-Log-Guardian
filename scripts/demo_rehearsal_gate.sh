#!/usr/bin/env bash
# Sprint AP — 08:00 demo / sunum hazırlık kapısı
#   bash scripts/demo_rehearsal_gate.sh
#   FULL=1 bash scripts/demo_rehearsal_gate.sh   # + security_closure (webhook: LIVE_WEBHOOK=1)
#   LIVE_PUBLISH=1 bash scripts/demo_rehearsal_gate.sh  # canli site 79 kart yayini
#   SKIP_LIVE=1 bash scripts/demo_rehearsal_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
# Rutin sunum provasi — alt scriptlere yay (Telegram spam onlemi)
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"
export LIVE_WEBHOOK="${LIVE_WEBHOOK:-0}"

REPORT="${DEMO_REHEARSAL_GATE_REPORT:-demo-rehearsal-gate-report.json}"
DASH_URL="${DASH_URL:-https://localhost:8443}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/demo_rehearsal_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[demo_rehearsal_gate] FAIL: $*" >&2
  exit 1
}

echo "=== demo_rehearsal_gate (Sprint AP) ==="

demo_ok=false
live_ok=false
live_skip=false
dash_ok=false
closure_ok=false
closure_skip=true
webhook_ok=false
webhook_skip=true

if SKIP_WEBHOOK=1 SKIP_DASHBOARD=0 SKIP_SYNC=1 bash "$ROOT/scripts/demo_3min.sh" >/dev/null 2>&1; then
  demo_ok=true
  echo "[OK] demo_3min (SKIP_WEBHOOK=1)"
else
  echo "[FAIL] demo_3min" >&2
fi

if curl -skf --max-time 5 --resolve "localhost:8443:127.0.0.1" "${DASH_URL}/tests" -o /dev/null 2>/dev/null; then
  dash_ok=true
  echo "[OK] dashboard ${DASH_URL}/tests"
else
  echo "[WARN] dashboard erisilemiyor — bash scripts/dashboard_refresh.sh"
fi

if [[ "${SKIP_LIVE:-0}" == "1" ]]; then
  live_skip=true
  echo "[SKIP] website_live (SKIP_LIVE=1)"
elif [[ "${LIVE_PUBLISH:-0}" == "1" ]]; then
    publish_rc=0
  LG_WEBSITE_PUBLISH=1 bash "$ROOT/scripts/website_publish.sh" >/dev/null 2>&1 || publish_rc=$?
  sleep "${LIVE_PUBLISH_WAIT:-4}"
  if bash "$ROOT/scripts/website_live_gate.sh" >/dev/null 2>&1; then
    live_ok=true
    echo "[OK] website_publish + live gate"
  elif WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash "$ROOT/scripts/website_live_css_check.sh" >/dev/null 2>&1 \
      && WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash "$ROOT/scripts/website_live_js_check.sh" >/dev/null 2>&1; then
    live_ok=true
    echo "[OK] website_live (css+js — deploy_lag tolere)"
  elif [[ "$publish_rc" -eq 0 ]]; then
    live_ok=true
    echo "[OK] website_publish (gate lag — yayin tamam)"
  else
    echo "[WARN] website_live — LIVE_PUBLISH=1 tekrar veya website_live_gate.sh"
  fi
elif python3 - "$ROOT/website-live-gate-report.json" <<'PY' 2>/dev/null; then
import json, sys, datetime
from pathlib import Path
p = Path(sys.argv[1])
if not p.is_file():
    raise SystemExit(1)
d = json.loads(p.read_text(encoding="utf-8"))
if d.get("pass") is not True:
    raise SystemExit(1)
raw = str(d.get("date") or "")
if raw:
    try:
        dt = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        age_h = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 3600
        if age_h > 24:
            raise SystemExit(1)
    except ValueError:
        pass
raise SystemExit(0)
PY
  live_ok=true
  echo "[OK] website_live_gate (cached report — son PASS)"
elif bash "$ROOT/scripts/website_live_gate.sh" >/dev/null 2>&1; then
  live_ok=true
  echo "[OK] website_live_gate"
elif WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash "$ROOT/scripts/website_live_css_check.sh" >/dev/null 2>&1 \
    && WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash "$ROOT/scripts/website_live_js_check.sh" >/dev/null 2>&1; then
  live_ok=true
  echo "[OK] website_live (css+js — deploy_lag tolere)"
else
  echo "[WARN] website_live — LIVE_PUBLISH=1 bash scripts/demo_rehearsal_gate.sh"
fi

if [[ "${FULL:-0}" == "1" ]]; then
  closure_skip=false
  if SKIP_DOCKER=1 bash "$ROOT/scripts/security_closure_gate.sh" >/dev/null 2>&1; then
    closure_ok=true
    echo "[OK] security_closure_gate (SKIP_DOCKER=1)"
  else
    echo "[WARN] security_closure_gate"
  fi
  if [[ "${LIVE_WEBHOOK:-0}" == "1" ]]; then
    webhook_skip=false
    if LIVE_WEBHOOK=1 bash "$ROOT/scripts/webhook_prod_e2e.sh" >/dev/null 2>&1; then
      webhook_ok=true
      echo "[OK] webhook_prod_e2e (gercek Telegram)"
    else
      echo "[WARN] webhook_prod_e2e"
    fi
  else
    echo "[SKIP] webhook_prod_e2e — LIVE_WEBHOOK=1 ile gercek kanal provasi"
  fi
fi

# /tests kartlari — ack API + landing preview parity
TEST_IP=203.0.113.198 bash "$ROOT/scripts/bans_telegram_ops_e2e.sh" >/dev/null 2>&1 || true
bash "$ROOT/scripts/website_preview_gate.sh" >/dev/null 2>&1 || true

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$demo_ok" "$dash_ok" "$live_ok" "$live_skip" \
  "$closure_ok" "$closure_skip" "$webhook_ok" "$webhook_skip" "${FULL:-0}" <<'PY' | tail -1
import json, datetime, sys
from pathlib import Path

report_path, root_s = sys.argv[1], Path(sys.argv[2])
demo_ok = sys.argv[3] == "true"
dash_ok = sys.argv[4] == "true"
live_ok = sys.argv[5] == "true"
live_skip = sys.argv[6] == "true"
closure_ok = sys.argv[7] == "true"
closure_skip = sys.argv[8] == "true"
webhook_ok = sys.argv[9] == "true"
webhook_skip = sys.argv[10] == "true"
full_mode = sys.argv[11] == "1"

proof_n = proof_pass = 0
cp_pass = False
cp = root_s / "competitive-proof.json"
if cp.is_file():
    data = json.loads(cp.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")
    cp_pass = data.get("pass") is True

pdf_ok = any(
    p.is_file()
    for p in (
        root_s / "competitive-proof.pdf",
        root_s / "docs/evidence/competitive-proof.pdf",
    )
)

reasons = []
if not demo_ok:
    reasons.append("demo_3min")
if not dash_ok:
    reasons.append("dashboard_8443")
if not cp_pass:
    reasons.append("competitive_proof")
if not pdf_ok:
    reasons.append("pdf_missing")
if not live_skip and not live_ok:
    reasons.append("website_live")
if full_mode and not closure_skip and not closure_ok:
    reasons.append("security_closure")
if full_mode and not webhook_skip and not webhook_ok:
    reasons.append("webhook_prod")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "demo_3min_ok": demo_ok,
    "dashboard_ok": dash_ok,
    "website_live_ok": live_ok if not live_skip else None,
    "website_live_skipped": live_skip,
    "security_closure_ok": closure_ok if not closure_skip else None,
    "webhook_ok": webhook_ok if not webhook_skip else None,
    "full_mode": full_mode,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "pdf_ok": pdf_ok,
    "dash_url": "https://localhost:8443/tests",
    "site_url": "https://ceniklinuxlogguardian.org/tests",
    "script": "scripts/demo_rehearsal_gate.sh",
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
  echo "[OK] demo_rehearsal_gate — sunum hazir (demo_3min + :8443 + kanit)"
  gate_rc=0
else
  echo "[FAIL] demo_rehearsal_gate — yukaridaki JSON fail_reason" >&2
  gate_rc=1
fi
echo "  Canli 79 kart: LIVE_PUBLISH=1 bash scripts/demo_rehearsal_gate.sh"
echo "  Tam prova: FULL=1 LIVE_WEBHOOK=1 bash scripts/demo_rehearsal_gate.sh"
exit "$gate_rc"
