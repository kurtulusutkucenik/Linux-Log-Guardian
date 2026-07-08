#!/usr/bin/env bash
# Dashboard guvenlik kapilari — salt okunur / :3000 probe (isleyisi bozmaz)
#   bash scripts/dashboard_security_gates.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
run() {
  local name="$1"
  shift
  echo ""
  echo "=== $name ==="
  if "$@"; then
    echo "[OK] $name"
  else
    echo "[FAIL] $name" >&2
    fail=$((fail + 1))
  fi
}

echo "=== dashboard_security_gates ==="

run hardening_rollback_gate bash "$ROOT/scripts/hardening_rollback_gate.sh"
run dashboard_jwt_idle_gate bash "$ROOT/scripts/dashboard_jwt_idle_gate.sh"
run mtls_cert_expiry_check bash "$ROOT/scripts/mtls_cert_expiry_check.sh"

if curl -sf --max-time 2 http://127.0.0.1:3000/api/tier >/dev/null 2>&1; then
  run dashboard_login_rate_limit_e2e bash "$ROOT/scripts/dashboard_login_rate_limit_e2e.sh"
  echo ""
  echo "=== telegram_soc_gate (rapor tazeleme) ==="
  if bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1; then
    echo "[OK] telegram_soc_gate"
  else
    echo "[WARN] telegram_soc_gate — login 429? dashboard_gate_auth kontrol" >&2
  fi
else
  echo ""
  echo "[SKIP] dashboard_login_rate_limit_e2e — :3000 kapali"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] dashboard_security_gates — tamam"
  exit 0
fi
echo "[FAIL] dashboard_security_gates — $fail adim" >&2
exit 1
