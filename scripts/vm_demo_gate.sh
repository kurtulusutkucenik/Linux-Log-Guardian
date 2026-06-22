#!/usr/bin/env bash
# VM/VPS sunum kapisi — post_install_verify 0 FAIL (dis demo oncesi)
#   sudo bash scripts/vm_demo_gate.sh
#   bash scripts/vm_demo_gate.sh --verify-only   # onarim atla
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERIFY_ONLY=0
[[ "${1:-}" == "--verify-only" ]] && VERIFY_ONLY=1

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — VM demo gate (post_install 0 FAIL) ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

run_verify() {
  local as_user="${1:-}"
  echo "=== post_install_verify ==="
  if [[ $EUID -eq 0 && -n "$as_user" && "$as_user" != root ]] && id "$as_user" >/dev/null 2>&1; then
    echo "  (kullanici: $as_user + sg log-guardian)"
    if runuser -u "$as_user" -- sg log-guardian -c "bash \"$ROOT/scripts/post_install_verify.sh\""; then
      return 0
    fi
    return 1
  fi
  bash "$ROOT/scripts/post_install_verify.sh"
}

if [[ "$VERIFY_ONLY" -eq 0 ]]; then
  if [[ $EUID -ne 0 ]]; then
    echo "[vm_demo_gate] onarim icin: sudo bash scripts/vm_demo_gate.sh" >&2
    exit 1
  fi
  echo "=== stack onarim ==="
  export REPAIR_QUIET="${VM_GATE_QUIET:-1}"
  bash "$ROOT/scripts/repair_no_xdp_stack.sh"
  echo ""
fi

INVOKER="${SUDO_USER:-${USER:-}}"
if [[ "$VERIFY_ONLY" -eq 1 && $EUID -ne 0 ]]; then
  INVOKER="$USER"
fi

if run_verify "$INVOKER"; then
  echo ""
  echo "[OK] vm_demo_gate — sunuma hazir (FAIL=0)"
  echo "  Opsiyonel: bash scripts/grafana_alert_e2e.sh"
  echo "             sudo bash scripts/webhook_prod_e2e.sh"
  exit 0
fi

echo "" >&2
echo "[FAIL] vm_demo_gate — post_install_verify kirmizi" >&2
echo "  sudo bash scripts/repair_no_xdp_stack.sh" >&2
echo "  bash scripts/vm_demo_gate.sh --verify-only" >&2
echo "  (grup yeni eklendiyse: newgrp log-guardian)" >&2
exit 1
