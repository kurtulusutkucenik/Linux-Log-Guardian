#!/usr/bin/env bash
# Laptop vitrin plani — GIF + VPS haric (git commit ayri)
#   bash scripts/finish_vitrin_plan.sh
#   PUBLISH=1 bash scripts/finish_vitrin_plan.sh   # Cloudflare landing yayini
#   SKIP_CORE=1 bash scripts/finish_vitrin_plan.sh # yalniz landing + dashboard
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail=0
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); }
ok() { echo "[OK] $*"; }

echo "=== finish_vitrin_plan (GIF/VPS/commit haric) ==="

echo "--- [1] operator + audit cron ---"
bash "$ROOT/scripts/install_operator_cron.sh" && ok "install_operator_cron" || warn "install_operator_cron"
bash "$ROOT/scripts/install_audit_cron.sh" && ok "install_audit_cron" || warn "install_audit_cron"

if [[ "${SKIP_CORE:-0}" != "1" ]]; then
  echo "--- [2] core_proof_refresh (Track A) ---"
  bash "$ROOT/scripts/core_proof_refresh.sh" && ok "core_proof_refresh" || warn "core_proof_refresh"
else
  echo "[SKIP] core_proof_refresh — SKIP_CORE=1"
fi

echo "--- [3] local_security_audit ---"
bash "$ROOT/scripts/local_security_audit.sh" && ok "local_security_audit" || warn "local_security_audit"

echo "--- [4] landing export + parity ---"
bash "$ROOT/scripts/website_landing_export.sh" && ok "website_landing_export" || warn "website_landing_export"
python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" && ok "sync_landing_tests" || warn "sync_landing_tests"
bash "$ROOT/scripts/website_preview_gate.sh" && ok "website_preview_gate" || warn "website_preview_gate"

if [[ "${PUBLISH:-0}" == "1" ]]; then
  echo "--- [5] canli site publish ---"
  bash "$ROOT/scripts/website_publish.sh" && ok "website_publish" || warn "website_publish"
else
  echo "[SKIP] website_publish — PUBLISH=1 ile canli site"
fi

echo "--- [6] dashboard_refresh (:8443) ---"
bash "$ROOT/scripts/dashboard_refresh.sh" && ok "dashboard_refresh" || warn "dashboard_refresh"

echo ""
python3 - "$ROOT" <<'PY'
import json
from pathlib import Path
root = Path(__import__("sys").argv[1])
lines = []
for name, key in [
    ("competitive-proof.json", "validationTests"),
    ("website-preview-gate-report.json", None),
    ("morning-operator-gate-report.json", None),
]:
    p = root / name
    if not p.is_file():
        continue
    d = json.loads(p.read_text(encoding="utf-8"))
    if name == "competitive-proof.json":
        t = d.get("validationTests") or []
        p_n = sum(1 for x in t if x.get("status") == "pass")
        lines.append(f"  competitive_proof: {p_n}/{len(t)} pass")
    elif name == "website-preview-gate-report.json":
        sf = int(d.get("site_fail") or 0)
        shown = int(d.get("site_tests") or 0) if sf == 0 else int(d.get("site_pass") or 0)
        exp = int(d.get("expected_tests") or 0)
        lines.append(f"  website_preview: {shown}/{exp} pass")
    elif d.get("pass") is True:
        lines.append(f"  morning_operator: pass")
    else:
        lines.append(f"  morning_operator: WARN")
if lines:
    print("=== finish_vitrin_plan ozet ===")
    for ln in lines:
        print(ln)
PY

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] finish_vitrin_plan tamam"
  echo "  Dashboard: https://localhost:8443/tests  (Ctrl+Shift+R)"
  echo "  Landing:   https://ceniklinuxlogguardian.org/testler"
  [[ "${PUBLISH:-0}" == "1" ]] || echo "  Canli site: PUBLISH=1 bash scripts/finish_vitrin_plan.sh"
  echo "  GIF/VPS:   bilincli ertelendi"
  echo "  Commit:    en son (manuel)"
  exit 0
fi
echo "[WARN] finish_vitrin_plan — $fail uyari (loglari kontrol et)" >&2
exit 0
