#!/usr/bin/env bash
# VM sprint prod + demo kapisi — host kodu sync sonrasi (VirtualBox)
#   sudo mount -t vboxsf lg /mnt/lg    # gerekirse
#   cd ~/Linux-Log-Guardian
#   sudo bash scripts/vm_prod_gate.sh
#   sudo bash scripts/vm_prod_gate.sh --verify-only
#
# Tam sprint harden (SIEM E2E + RULES_VERIFY): once veya ayrica
#   sudo bash scripts/prod_hosting_activate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERIFY_ONLY=0
SKIP_SYNC=0
RUN_HARDEN=0
for arg in "$@"; do
  case "$arg" in
    --verify-only) VERIFY_ONLY=1 ;;
    --skip-sync) SKIP_SYNC=1 ;;
    --harden) RUN_HARDEN=1 ;;
    -h|--help)
      echo "Kullanim: sudo bash $0 [--verify-only] [--skip-sync] [--harden]"
      exit 0
      ;;
  esac
done

fail() { echo "[vm_prod_gate] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli (VM icinde)"

echo "=== vm_prod_gate ==="

if [[ "$VERIFY_ONLY" -eq 0 ]]; then
  if [[ "$SKIP_SYNC" -eq 0 ]]; then
    bash "$ROOT/scripts/vm_sync_from_host.sh"
    ok "vm_sync_from_host"
  fi
  bash "$ROOT/scripts/vm_build_binary.sh"
  ok "vm_build_binary"
  bash "$ROOT/scripts/sprint_prod_activate.sh"
  ok "sprint_prod_activate"
  if [[ "$RUN_HARDEN" -eq 1 ]]; then
    bash "$ROOT/scripts/sprint_harden_prod.sh"
    ok "sprint_harden_prod"
  else
    REPAIR_QUIET=1 bash "$ROOT/scripts/repair_no_xdp_stack.sh"
    ok "repair_no_xdp_stack"
  fi
  bash "$ROOT/scripts/vm_disable_telegram_poll.sh" 2>/dev/null || true
fi

bash "$ROOT/scripts/post_install_verify.sh"
ok "post_install_verify"
bash "$ROOT/scripts/sprint_prod_proof.sh"
ok "sprint_prod_proof"
bash "$ROOT/scripts/vm_demo_gate.sh" --verify-only

echo ""
echo "[OK] vm_prod_gate — VM sprint prod + demo hazir"
