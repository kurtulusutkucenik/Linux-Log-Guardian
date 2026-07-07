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
WARN_LABELS=()
warn() { echo "[WARN] $*" >&2; fail=$((fail + 1)); WARN_LABELS+=("$1"); }
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

echo "--- [4] landing sync + export + parity ---"
python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 \
  || echo "[WARN] competitive_proof_build (landing oncesi) — mevcut JSON kullaniliyor" >&2
python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" && ok "sync_landing_tests" || warn "sync_landing_tests"
bash "$ROOT/scripts/website_landing_export.sh" && ok "website_landing_export" || warn "website_landing_export"
bash "$ROOT/scripts/website_preview_gate.sh" && ok "website_preview_gate" || warn "website_preview_gate"

if [[ "${PUBLISH:-0}" == "1" ]]; then
  echo "[SKIP] erken website_publish — kanit sonrasi [6b] tek deploy"
else
  echo "[SKIP] website_publish — PUBLISH=1 ile canli site (#dogrusinir + /tests parity)"
fi

echo "--- [4b] competitive proof + gate rapor hizasi ---"
bash "$ROOT/scripts/ops_gate_report.sh" && ok "ops_gate_report" || warn "ops_gate_report"
if [[ "${PUBLISH:-0}" == "1" ]]; then
  echo "[SKIP] website_live_gate — publish sonrasi [6b]"
else
  echo "[SKIP] website_live_gate — PUBLISH=1 yok (canli site bayat kalabilir)"
fi
python3 "$ROOT/scripts/competitive_proof_build.py" && ok "competitive_proof_build" || warn "competitive_proof_build"
bash "$ROOT/scripts/proof_meta_gates_refresh.sh" && ok "proof_meta_gates_refresh" || warn "proof_meta_gates_refresh"
python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" && ok "sync_landing_tests_mid" || warn "sync_landing_tests_mid"

echo "--- [6] dashboard_refresh (:8443) ---"
bash "$ROOT/scripts/dashboard_refresh.sh" && ok "dashboard_refresh" || warn "dashboard_refresh"

echo "--- [6b] morning operator (publish + refresh sonrasi) ---"
if [[ "${PUBLISH:-0}" != "1" ]]; then
  export SKIP_LIVE_BLOCK=1
fi
bash "$ROOT/scripts/morning_operator_gate.sh" && ok "morning_operator_gate" || warn "morning_operator_gate"
python3 "$ROOT/scripts/competitive_proof_build.py" && ok "competitive_proof_build_final" || warn "competitive_proof_build_final"
python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" && ok "sync_landing_tests_final" || warn "sync_landing_tests_final"
bash "$ROOT/scripts/website_landing_export.sh" && ok "website_landing_export_final" || warn "website_landing_export_final"
if [[ "${PUBLISH:-0}" == "1" ]]; then
  WEBSITE_PUBLISH_SKIP_LIVE_GATE=1 bash "$ROOT/scripts/website_publish.sh" \
    && ok "website_publish_final" || warn "website_publish_final"
  bash "$ROOT/scripts/website_live_gate.sh" && ok "website_live_gate" || warn "website_live_gate"
fi
bash "$ROOT/scripts/sync_dashboard_data.sh" && ok "sync_dashboard_data" || warn "sync_dashboard_data"

echo ""
SUMMARY_JSON="${LG_LAST_VITRIN_JSON:-$HOME/lg-last-vitrin.json}"
WARN_JSON=""
if [[ ${#WARN_LABELS[@]} -gt 0 ]]; then
  WARN_JSON="$(python3 -c "import json,sys; print(json.dumps(sys.argv[1:]))" "${WARN_LABELS[@]}")"
fi
SUMMARY_ARGS=(
  --root "$ROOT"
  --out "$SUMMARY_JSON"
  --source "scripts/finish_vitrin_plan.sh"
  --warn-count "$fail"
)
[[ -n "$WARN_JSON" ]] && SUMMARY_ARGS+=(--warn-labels "$WARN_JSON")
[[ "${PUBLISH:-0}" == "1" ]] && SUMMARY_ARGS+=(--published)
SUMMARY_ARGS+=(--print-summary --title "=== finish_vitrin_plan ozet ===")
python3 "$ROOT/scripts/lg_last_vitrin_summary.py" "${SUMMARY_ARGS[@]}"

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
if [[ ${#WARN_LABELS[@]} -gt 0 ]]; then
  echo "  Uyarilar: ${WARN_LABELS[*]}" >&2
fi
exit 0
