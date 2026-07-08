#!/usr/bin/env bash
# Haftalık operatör ritmi — Plan A2 (kanıt tazeliği, evidence pack)
#   bash scripts/weekly_operator_ritual.sh
#   LOCAL_PROOF=1 bash scripts/weekly_operator_ritual.sh   # + PDF/ZIP (~15 dk)
#   STRICT=1 bash scripts/weekly_operator_ritual.sh          # bayat rapor = FAIL
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

echo "=== weekly_operator_ritual (Plan A2) ==="

step bash "$ROOT/scripts/quick_proof_refresh.sh"
step bash "$ROOT/scripts/sync_evidence_pack.sh"
step env STRICT="${STRICT:-0}" bash "$ROOT/scripts/proof_freshness_check.sh"
step bash "$ROOT/scripts/fleet_prune_pending_commands.sh"
step bash "$ROOT/scripts/mtls_cert_expiry_check.sh"
step bash "$ROOT/scripts/fleet_offline_gate.sh"

if [[ "${LOCAL_PROOF:-0}" == "1" ]]; then
  step bash "$ROOT/scripts/local_proof_refresh.sh"
else
  echo "[SKIP] local_proof_refresh — LOCAL_PROOF=1 ile tam PDF/ZIP"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] weekly_operator_ritual — haftalik kanit taze"
  exit 0
fi
echo "[FAIL] weekly_operator_ritual — $fail adim" >&2
exit 1
