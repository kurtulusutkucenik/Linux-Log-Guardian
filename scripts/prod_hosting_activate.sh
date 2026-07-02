#!/usr/bin/env bash
# TR hosting — sprint prod + inline consult tek akis (root)
#   sudo bash scripts/prod_hosting_activate.sh
# Laptop/VM demo: sprint harden + nginx consult + kanit JSON
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { echo "[prod_hosting_activate] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"

echo "=== prod_hosting_activate ==="
echo "  docs/HOSTING_RUNBOOK_TR.md"

if lg_is_vbox_guest 2>/dev/null; then
  echo "--- VM: yerel binary (sync binary tasimaz) ---"
  bash "$ROOT/scripts/vm_build_binary.sh"
  ok "vm_build_binary"
fi

bash "$ROOT/scripts/sprint_prod_activate.sh"
bash "$ROOT/scripts/sprint_harden_prod.sh"

if command -v nginx >/dev/null 2>&1; then
  echo "--- inline consult (nginx) ---"
  if bash "$ROOT/scripts/fix_nginx_inline_consult.sh" 2>/dev/null; then
    ok "fix_nginx_inline_consult"
  else
    echo "[WARN] inline consult kurulumu eksik — sudo bash scripts/fix_nginx_inline_consult.sh" >&2
  fi
  if bash "$ROOT/scripts/nginx_inline_consult_e2e.sh"; then
    ok "nginx_inline_consult_e2e"
  else
    echo "[WARN] nginx_inline_consult_e2e — site upstream kontrol" >&2
  fi
else
  echo "[INFO] nginx yok — inline consult atlandi"
fi

bash "$ROOT/scripts/sprint_prod_proof.sh"
ok "sprint_prod_proof"

echo ""
echo "[OK] prod_hosting_activate — RULES_VERIFY + STIX + mesh=none + kanit"
echo "  nginx log format: bash scripts/check_nginx_log_format.sh"
echo "  gunluk: sudo log-guardian --status"
echo "  demo:   bash scripts/demo_3min.sh"
