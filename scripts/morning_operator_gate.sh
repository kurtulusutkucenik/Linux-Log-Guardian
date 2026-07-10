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

bash "$ROOT/scripts/proof_freshness_check.sh" 2>/dev/null || echo "[WARN] proof_freshness_check — STRICT=0 devam"

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
  if bash "$ROOT/scripts/dashboard_tests_live_count.sh" 2>/dev/null; then
    echo "[OK] dashboard_tests_live (/api/tests parity)"
  else
    echo "[WARN] dashboard_tests_live — bash scripts/dashboard_refresh.sh && Ctrl+Shift+R" >&2
  fi
else
  echo "[WARN] dashboard erisilemiyor"
fi

attack_ok=false
if report_fresh_pass "$ROOT/attack-map-report.json" 12; then
  if python3 -c "
import json
d=json.load(open('$ROOT/attack-map-report.json'))
raise SystemExit(0 if d.get('pass') and d.get('nav_parity_ok') else 1)
"; then
    attack_ok=true
    nav_n=$(python3 -c "import json; print(json.load(open('$ROOT/attack-map-report.json')).get('nav_ban_count',0))")
    echo "[OK] attack_map nav parity (nav=${nav_n}, ≤12h)"
  else
    echo "[WARN] attack_map nav parity FAIL — bash scripts/dashboard_refresh.sh" >&2
  fi
else
  echo "[WARN] attack_map raporu bayat/eksik (≤12h) — dashboard_refresh" >&2
fi

soc_ok=false
if report_fresh_pass "$ROOT/telegram-soc-gate-report.json" 12; then
  if python3 -c "
import json
d=json.load(open('$ROOT/telegram-soc-gate-report.json'))
raise SystemExit(0 if d.get('pass') else 1)
"; then
    soc_ok=true
    soc_n=$(python3 -c "import json; print(json.load(open('$ROOT/telegram-soc-gate-report.json')).get('soc_entries',0))")
    echo "[OK] telegram_soc (soc=${soc_n}, ≤12h)"
  else
    echo "[WARN] telegram_soc raporu FAIL — bash scripts/dashboard_refresh.sh" >&2
  fi
else
  echo "[WARN] telegram_soc raporu bayat/eksik (≤12h) — dashboard_refresh" >&2
fi

eps_smoke_ok=false
eps_smoke_peak="0"
eps_smoke_lines="0"
if report_fresh_pass "$ROOT/webhook-eps-smoke-report.json" 24; then
  read -r eps_smoke_ok eps_smoke_peak eps_smoke_lines <<<"$(python3 -c "
import json
d=json.load(open('$ROOT/webhook-eps-smoke-report.json'))
peak=float(d.get('peak_eps') or 0)
lines=int(d.get('lines_delta') or 0)
derived=float(d.get('derived_eps') or 0)
ok=d.get('pass') is True and lines >= 1 and (peak > 0 or derived > 0.5)
print('true' if ok else 'false', peak, lines)
")"
  if [[ "$eps_smoke_ok" == "true" ]]; then
    echo "[OK] eps_smoke (peak=${eps_smoke_peak}, lines+${eps_smoke_lines}, ≤24h)"
  else
    echo "[WARN] eps_smoke raporu gecersiz — sudo bash scripts/webhook_nginx_eps_smoke.sh" >&2
  fi
else
  echo "[WARN] eps_smoke raporu bayat/eksik (≤24h) — sudo bash scripts/webhook_nginx_eps_smoke.sh" >&2
fi

# Gate raporlari + proof meta hizala — competitive_proof okumadan once
bash "$ROOT/scripts/proof_meta_gates_refresh.sh" >/dev/null 2>&1 || true
python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true

gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$core_ok" "$core_refreshed" "$ship_ok" "$dash_ok" "$attack_ok" "$soc_ok" "$eps_smoke_ok" "$eps_smoke_peak" "$eps_smoke_lines" <<'PY' | tail -1
import json, datetime, os, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
core_ok = sys.argv[3] == "true"
core_refreshed = sys.argv[4] == "true"
ship_ok = sys.argv[5] == "true"
dash_ok = sys.argv[6] == "true"
attack_ok = sys.argv[7] == "true"
soc_ok = sys.argv[8] == "true"
eps_smoke_ok = sys.argv[9] == "true"
eps_smoke_peak = float(sys.argv[10] or 0)
eps_smoke_lines = int(sys.argv[11] or 0)

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
        and not (os.environ.get("SKIP_LIVE_BLOCK") == "1" and t.get("id") == "website-live-gate")
    ]
    cp_pass = data.get("pass") is not False and not blocking

reasons = []
if not core_ok:
    reasons.append("laptop_core")
if not ship_ok:
    reasons.append("presentation_ship")
if not dash_ok:
    reasons.append("dashboard_8443")
if dash_ok and not attack_ok:
    reasons.append("attack_map_parity")
if dash_ok and not soc_ok:
    reasons.append("telegram_soc")
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
    "attack_map_parity_ok": attack_ok,
    "telegram_soc_ok": soc_ok,
    "eps_smoke_ok": eps_smoke_ok,
    "eps_smoke_peak": eps_smoke_peak if eps_smoke_peak > 0 else None,
    "eps_smoke_lines_delta": eps_smoke_lines if eps_smoke_lines > 0 else None,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "dash_url": "https://localhost:8443/tests",
    "script": "scripts/morning_operator_gate.sh",
    "chain_script": "scripts/morning_operator_chain.sh",
}
pf = root_s / "proof-freshness-report.json"
if pf.is_file():
    try:
        pfd = json.loads(pf.read_text(encoding="utf-8"))
        out["proof_freshness_ok"] = pfd.get("pass") is True
        out["proof_stale_ids"] = pfd.get("stale_ids") or []
    except (json.JSONDecodeError, OSError):
        pass
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print("GATE_OK" if ok else "GATE_FAIL")
PY
)

python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true

# dashboard-ban-api bayat ise once smoke (relay 18090 / docker path)
if [[ "$gate_ok_flag" == "GATE_FAIL" ]]; then
  if python3 - "$ROOT" <<'PY' 2>/dev/null; then
import json, subprocess, sys
from pathlib import Path
root = Path(sys.argv[1])
cp = root / "competitive-proof.json"
if not cp.is_file():
    raise SystemExit(1)
tests = json.loads(cp.read_text(encoding="utf-8")).get("validationTests") or []
blocking = [t for t in tests if t.get("status") not in ("pass", "warn")
            and t.get("id") not in ("morning-operator-gate",)]
if not (len(blocking) == 1 and blocking[0].get("id") == "dashboard-ban-api"):
    raise SystemExit(1)
subprocess.run(
    ["bash", str(root / "scripts/sync_dashboard_api_token.sh")],
    cwd=str(root), timeout=30, check=False,
)
r = subprocess.run(
    ["bash", str(root / "scripts/dashboard_ban_smoke.sh")],
    cwd=str(root), timeout=90, capture_output=True, check=False,
)
raise SystemExit(0 if r.returncode == 0 else 1)
PY
    echo "[OK] morning_operator — dashboard_ban_smoke recovery"
    python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
  fi
fi

# Ikinci build sonrasi yalnizca competitive_proof nedeniyle dusen gate'i toparla
if [[ "$gate_ok_flag" == "GATE_FAIL" ]]; then
  gate_ok_flag=$(python3 - "$REPORT" "$ROOT" "$gate_ok_flag" <<'PY' | tail -1
import json, os, sys
from pathlib import Path

report_path, root_s = Path(sys.argv[1]), Path(sys.argv[2])
prev = sys.argv[3]

if prev != "GATE_FAIL":
    print(prev)
    raise SystemExit(0)

out = json.loads(report_path.read_text(encoding="utf-8"))
reasons = [r.strip() for r in (out.get("fail_reason") or "").split(";") if r.strip()]
if reasons != ["competitive_proof"]:
    print(prev)
    raise SystemExit(0)

cp = root_s / "competitive-proof.json"
if not cp.is_file():
    print(prev)
    raise SystemExit(0)

data = json.loads(cp.read_text(encoding="utf-8"))
tests = data.get("validationTests") or []
blocking = [
    t for t in tests
    if t.get("status") not in ("pass", "warn")
    and t.get("id") != "morning-operator-gate"
    and not (os.environ.get("SKIP_LIVE_BLOCK") == "1" and t.get("id") == "website-live-gate")
]
if blocking:
    print(prev)
    raise SystemExit(0)

out["pass"] = True
out.pop("fail_reason", None)
out["proof_tests"] = len(tests)
out["proof_pass"] = sum(1 for t in tests if t.get("status") == "pass")
out["recovered_from"] = "competitive_proof"
report_path.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print("GATE_OK")
PY
  )
  if [[ "$gate_ok_flag" == "GATE_OK" ]]; then
    echo "[OK] morning_operator_gate — competitive_proof recovery (ikinci build)"
  fi
fi

if python3 -c "
import json
from pathlib import Path
p = Path('$ROOT/competitive-proof.json')
if not p.is_file():
    raise SystemExit(1)
t = json.loads(p.read_text())['validationTests']
raise SystemExit(0 if len(t) and all(x.get('status')=='pass' for x in t) else 1)
" 2>/dev/null; then
  proof_n="$(python3 -c "import json;from pathlib import Path;t=json.loads(Path('$ROOT/competitive-proof.json').read_text())['validationTests'];print(len(t))" 2>/dev/null || echo '?')"
  python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" >/dev/null 2>&1 \
    && echo "[OK] sync_landing_tests (${proof_n}/${proof_n})" \
    || echo "[WARN] sync_landing_tests — atlandi" >&2
fi

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

# JWT yasi + Telegram operator ozeti (ban hattina dokunmaz)
python3 - "$REPORT" "$ROOT" "$gate_rc" <<'PY' || true
import json, os, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path

report_path, root_s, gate_rc = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
out = json.loads(report_path.read_text(encoding="utf-8"))
notes = []

jwt_candidates = [
    root_s / "dashboard" / ".env.local",
    root_s / "dashboard" / ".env",
    root_s / ".env",
]
for p in jwt_candidates:
    if p.is_file():
        age_d = (time.time() - p.stat().st_mtime) / 86400.0
        if age_d > 90:
            notes.append(f"JWT/env {p.name} ~{int(age_d)}g — docs/JWT_ROTATION.md")
        break

proof_n = int(out.get("proof_tests") or 0)
proof_p = int(out.get("proof_pass") or 0)
if proof_n and proof_p < proof_n:
    notes.append(f"competitive_proof {proof_p}/{proof_n} — bash scripts/proof_gate_recovery.sh")

intel = root_s / "intel-ban-db-report.json"
subprocess.run(
    ["bash", str(root_s / "scripts/intel_ban_db_ops_check.sh")],
    cwd=str(root_s),
    env={**os.environ, "WARN_ONLY": "1"},
    timeout=15,
    capture_output=True,
    check=False,
)
if intel.is_file():
    idata = json.loads(intel.read_text(encoding="utf-8"))
    if idata.get("pass") is False:
        hint = idata.get("notes") or [idata.get("fail_reason", "intel_ban_db")]
        notes.append(f"intel_ban_db: {'; '.join(hint)}")
    else:
        stale = int(idata.get("stale_rows") or 0)
        warn_stale = int(os.environ.get("INTEL_BAN_STALE_WARN_ROWS", "500"))
        if stale >= warn_stale:
            ttl_d = idata.get("intel_ban_db_ttl_days", 7)
            notes.append(
                f"intel_ban_db stale={stale} (TTL {ttl_d}g) "
                f"— sudo log-guardian ban-db-prune --ttl-days {ttl_d}"
            )

if gate_rc != 0:
    reason = out.get("fail_reason") or "morning_operator_gate"
    notes.insert(0, f"morning_operator FAIL: {reason}")
elif out.get("recovered_from") and os.environ.get("TELEGRAM_RECOVERY", "1") != "0":
    notes.insert(
        0,
        f"morning_operator RECOVERED: {out['recovered_from']} ({proof_p}/{proof_n})",
    )

if not notes:
    sys.exit(0)

msg = "\n".join(notes)
msg += f"\nhttps://localhost:8443/tests#test-morning-operator-gate"
env = os.environ.copy()
env.setdefault("TELEGRAM_NOTIFY", "1")
subprocess.run(
    ["bash", str(root_s / "scripts/operator_telegram_notify.sh"), msg],
    cwd=str(root_s),
    env=env,
    timeout=25,
    check=False,
)
PY

echo "  Yenile: REFRESH=1 bash scripts/morning_operator_gate.sh"
exit "$gate_rc"
