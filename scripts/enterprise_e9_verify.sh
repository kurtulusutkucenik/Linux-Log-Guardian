#!/usr/bin/env bash
# E9 Enterprise runbook — tek kapı (dok + operatör zinciri)
#   bash scripts/enterprise_e9_verify.sh
#   SKIP_MORNING=1 bash scripts/enterprise_e9_verify.sh   # sabah gate atla (~30sn tasarruf)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${E9_VERIFY_REPORT:-enterprise-e9-verify-report.json}"

fail=0
note() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); }

echo "=== enterprise_e9_verify (E9) ==="

if bash "$ROOT/scripts/enterprise_escalation_gate.sh"; then
  note "enterprise_escalation_gate"
else
  warn "enterprise_escalation_gate"
fi

if bash "$ROOT/scripts/edge_protection_checklist.sh" >/dev/null 2>&1; then
  summary=$(python3 -c "import json; s=json.load(open('$ROOT/edge-protection-checklist-report.json')).get('summary',{}); print(f\"{s.get('pass',0)}/{s.get('total',0)}\")" 2>/dev/null || echo "?")
  note "edge_protection_checklist ($summary)"
else
  warn "edge_protection_checklist"
fi

if bash "$ROOT/scripts/relay_lan_exposure_check.sh" >/dev/null 2>&1; then
  note "relay_lan_exposure_check"
else
  warn "relay_lan_exposure_check"
fi

if [[ "${SKIP_MORNING:-0}" == "1" ]]; then
  echo "[SKIP] morning_operator_gate — SKIP_MORNING=1"
elif bash "$ROOT/scripts/morning_operator_gate.sh" >/dev/null 2>&1; then
  note "morning_operator_gate"
else
  warn "morning_operator_gate"
fi

# EPS smoke — bilgilendirici (E9 fail saymaz; operatör kanıtı)
if [[ -f "$ROOT/webhook-eps-smoke-report.json" ]]; then
  if python3 -c "
import json, datetime
from pathlib import Path
p = Path('$ROOT/webhook-eps-smoke-report.json')
d = json.loads(p.read_text(encoding='utf-8'))
peak = float(d.get('peak_eps') or 0)
lines = int(d.get('lines_delta') or 0)
derived = float(d.get('derived_eps') or 0)
ok = d.get('pass') is True and lines >= 1 and (peak > 0 or derived > 0.5)
raw = d.get('date') or ''
age_ok = True
if raw:
    dt = datetime.datetime.fromisoformat(raw.replace('Z', '+00:00'))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=datetime.timezone.utc)
    age_ok = (datetime.datetime.now(datetime.timezone.utc) - dt).total_seconds() / 3600.0 <= 24
raise SystemExit(0 if ok and age_ok else 1)
" 2>/dev/null; then
    peak=$(python3 -c "import json; print(json.load(open('$ROOT/webhook-eps-smoke-report.json')).get('peak_eps',0))")
    note "eps_smoke (peak=${peak}, ≤24h) — bilgilendirici"
  else
    echo "[INFO] eps_smoke — bayat/eksik (opsiyonel): sudo bash scripts/webhook_nginx_eps_smoke.sh"
  fi
else
  echo "[INFO] eps_smoke — rapor yok (opsiyonel): sudo bash scripts/webhook_nginx_eps_smoke.sh"
fi

if bash "$ROOT/scripts/docs_consistency_gate.sh" >/dev/null 2>&1; then
  note "docs_consistency_gate"
else
  warn "docs_consistency_gate"
fi

if bash "$ROOT/scripts/vps_prep_gate.sh" >/dev/null 2>&1; then
  note "vps_prep_gate (laptop hazirlik — VPS yok)"
else
  warn "vps_prep_gate"
fi

ENV_FILE="${VPS_ENV:-$ROOT/.cache/vps-production.env}"
if [[ -f "$ENV_FILE" ]] || [[ -n "${VPS_HOST:-}" ]] || [[ -n "${VPS_IP:-}" ]]; then
  if bash "$ROOT/scripts/vps_remote_status.sh" >/dev/null 2>&1; then
    note "vps_remote_status"
  else
    echo "[INFO] vps_remote_status — VPS ulasilamadi (beklenen laptop modu)"
  fi
fi

if [[ "${ENTERPRISE_SOAR:-0}" == "1" ]]; then
  if bash "$ROOT/scripts/enterprise_soar_gate.sh" >/dev/null 2>&1; then
    note "enterprise_soar_gate"
  else
    warn "enterprise_soar_gate"
  fi
fi

python3 - "$ROOT" "$REPORT" "$fail" <<'PY'
import datetime
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
report_path = Path(sys.argv[2])
fail_n = int(sys.argv[3])

def load_json(name):
    p = root / name
    if p.is_file():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}

proof = load_json("competitive-proof.json")
tests = proof.get("validationTests") or []
pn = sum(1 for t in tests if t.get("status") == "pass")
n = len(tests)

eps = load_json("webhook-eps-smoke-report.json")
eps_peak = float(eps.get("peak_eps") or 0)
eps_lines = int(eps.get("lines_delta") or 0)
eps_derived = float(eps.get("derived_eps") or 0)
eps_ok = (
    eps.get("pass") is True
    and eps_lines >= 1
    and (eps_peak > 0 or eps_derived > 0.5)
)

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": fail_n == 0,
    "fail_count": fail_n,
    "competitive_proof": f"{pn}/{n}",
    "enterprise_escalation": load_json("enterprise-escalation-gate-report.json").get("pass"),
    "edge_checklist": load_json("edge-protection-checklist-report.json").get("pass"),
    "relay_lan_exposure": load_json("relay-lan-exposure-report.json").get("pass"),
    "morning_operator": load_json("morning-operator-gate-report.json").get("pass"),
    "eps_smoke": eps_ok,
    "eps_smoke_peak": eps_peak if eps_peak > 0 else None,
    "docs_consistency": load_json("docs-consistency-gate-report.json").get("pass"),
    "vps_prep": load_json("vps-prep-gate-report.json").get("pass"),
    "vps_remote": load_json("vps-remote-status-report.json").get("reachable"),
    "script": "scripts/enterprise_e9_verify.sh",
    "doc": "docs/ENTERPRISE_SUPPORT.md",
}
report_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
sys.exit(0 if fail_n == 0 else 1)
PY

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] enterprise_e9_verify — E9 runbook zinciri"
  exit 0
fi
echo "[WARN] enterprise_e9_verify — $fail adim" >&2
exit 1
