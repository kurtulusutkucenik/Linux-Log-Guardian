#!/usr/bin/env bash
# Demo oncesi kapı — GitHub haric tum yerel + paylasim paketi dogrulama
#   bash scripts/fresh_install_gate.sh
#   SKIP_PHASE100=1 bash scripts/fresh_install_gate.sh   # hizli (~10 dk)
#   ZIP=1 bash scripts/fresh_install_gate.sh             # VM zip de uret
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }
warn() { echo "[WARN] $*"; }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — fresh install gate (demo 08:00)    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

run_step() {
  local name="$1"
  shift
  echo "=== $name ==="
  if "$@"; then
    ok "$name"
  else
    bad "$name"
  fi
  echo ""
}

if [[ "${SKIP_PHASE100:-0}" != "1" ]]; then
  echo "=== phase100 (tam, SKIP degil) — ~25-60 dk ==="
  if bash scripts/phase100.sh; then
    ok "phase100 tam"
  else
    bad "phase100"
  fi
  echo ""
else
  warn "phase100 atlandi (SKIP_PHASE100=1)"
  echo ""
fi

run_step "security_closure_gate" bash scripts/security_closure_gate.sh

run_step "security_profile_e2e" bash scripts/security_profile_e2e.sh
run_step "website_live_css_check" bash scripts/website_live_css_check.sh
run_step "demo_3min" bash scripts/demo_3min.sh
run_step "test_deb_local" bash scripts/test_deb_local.sh

if bash scripts/website_deploy_gate.sh >/dev/null 2>&1; then
  ok "website_deploy_gate"
else
  warn "website_deploy_gate — site degismediyse OK"
fi
echo ""

DEB=$(ls -1t "$ROOT"/dist/log-guardian_*.deb 2>/dev/null | head -1 || true)
if [[ -n "$DEB" ]]; then
  ok ".deb: $(basename "$DEB")"
else
  bad ".deb yok"
fi

if [[ "${ZIP:-0}" == "1" ]]; then
  echo "=== zip_for_vm ==="
  OUT="${OUT:-$ROOT/dist/log-guardian-vm.zip}"
  if OUT="$OUT" bash scripts/zip_for_vm.sh; then
    ok "zip_for_vm -> $(basename "$OUT")"
  else
    bad "zip_for_vm"
  fi
  echo ""
fi

echo "=== sifirdan kurulum (VM / temiz makine) ==="
echo ""
echo "A) .deb ile:"
echo "  scp dist/log-guardian_*.deb user@vm:~/"
echo "  ssh user@vm"
echo "  sudo dpkg -i log-guardian_*.deb"
echo "  sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh"
echo "  newgrp log-guardian && bash /usr/local/share/log-guardian/scripts/post_install_verify.sh"
echo ""
echo "B) Kaynak / zip:"
echo "  unzip log-guardian-vm.zip -d ~/Linux-Log-Guardian && cd ~/Linux-Log-Guardian"
echo "  sudo bash install.sh --no-xdp"
echo "  sudo bash scripts/install_first_run.sh"
echo "  sudo bash scripts/repair_no_xdp_stack.sh   # servis FAIL ise"
echo "  newgrp log-guardian && bash scripts/post_install_verify.sh"
echo ""
echo "C) Demo dogrulama (kurulum sonrasi):"
echo "  bash scripts/demo_3min.sh"
echo "  sudo bash scripts/webhook_prod_e2e.sh      # Telegram aciksa"
echo "  bash scripts/grafana_alert_e2e.sh          # Grafana aciksa"
echo ""
echo "D) Laptop → VM sync (gelistirme):"
echo "  bash scripts/vm_host_checklist.sh"
echo "  bash /mnt/lg/scripts/vm_sync_from_host.sh"
echo "  sudo bash scripts/vm_build_binary.sh"
echo "  sudo bash scripts/vm_demo_gate.sh"
echo ""

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] fresh_install_gate — demo paketi hazir (GitHub push ayri)"
  exit 0
fi
echo "[FAIL] fresh_install_gate — $fail madde" >&2
exit 1
