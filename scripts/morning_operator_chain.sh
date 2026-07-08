#!/usr/bin/env bash
# Sprint 7+ P0 — sabah operatör zinciri (tek komut)
#   bash scripts/morning_operator_chain.sh
#   REFRESH=1 bash scripts/morning_operator_chain.sh
#   SKIP_DASHBOARD_REFRESH=1 bash scripts/morning_operator_chain.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export SKIP_WEBHOOK="${SKIP_WEBHOOK:-1}"

fail=0
step() {
  echo ""
  echo "=== $1 ==="
  if "$@"; then
    echo "[OK] $1"
  else
    echo "[FAIL] $1" >&2
    fail=$((fail + 1))
  fi
}

echo "=== morning_operator_chain (Sprint 7+) ==="

step bash "$ROOT/scripts/proof_freshness_check.sh"
step env REFRESH="${REFRESH:-0}" bash "$ROOT/scripts/morning_operator_gate.sh"
step bash "$ROOT/scripts/enterprise_e9_verify.sh"
step bash "$ROOT/scripts/quick_proof_refresh.sh"
step bash "$ROOT/scripts/fleet_prune_pending_commands.sh"
step bash "$ROOT/scripts/repair_active_bans_json.sh"
step bash "$ROOT/scripts/backup_operator_secrets.sh"
step bash "$ROOT/scripts/api_mutation_audit_e2e.sh"
step bash "$ROOT/scripts/dashboard_security_gates.sh"
step bash "$ROOT/scripts/dashboard_tests_parity_check.sh"
step bash "$ROOT/scripts/edge_protection_checklist.sh"
step bash "$ROOT/scripts/relay_lan_exposure_check.sh"
step bash "$ROOT/scripts/enterprise_soar_gate.sh"
step bash "$ROOT/scripts/fleet_offline_gate.sh"
step bash "$ROOT/scripts/validate_rules_conf.sh"
step bash "$ROOT/scripts/sync_dashboard_data.sh"

if [[ "${SKIP_DASHBOARD_REFRESH:-0}" != "1" ]]; then
  step bash "$ROOT/scripts/dashboard_refresh.sh"
else
  echo "[SKIP] dashboard_refresh — SKIP_DASHBOARD_REFRESH=1"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] morning_operator_chain — tamam"
  echo "  Dashboard: https://localhost:8443 — Ctrl+Shift+R"
  exit 0
fi
echo "[FAIL] morning_operator_chain — $fail adim basarisiz" >&2
exit 1
