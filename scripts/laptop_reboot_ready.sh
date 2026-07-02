#!/usr/bin/env bash
# Laptop reboot sonrasi tek komut — stack + filo + daemon env (VPS gerekmez)
#   bash scripts/laptop_reboot_ready.sh
#   sudo bash scripts/laptop_reboot_ready.sh   # daemon env icin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== laptop_reboot_ready ==="

if [[ "$(id -u)" -eq 0 ]]; then
  bash "$ROOT/scripts/ensure_daemon_env.sh" 2>/dev/null || true
  systemctl enable log-guardian-daemon.service log-guardian.service 2>/dev/null || true
  systemctl start log-guardian-daemon.service log-guardian.service 2>/dev/null || true
  echo "[OK] daemon env + systemd (root)"
else
  if [[ -f /etc/log-guardian/env ]] && grep -q '^LG_DISABLE_URING=1' /etc/log-guardian/env 2>/dev/null; then
    echo "[OK] LG_DISABLE_URING=1 (/etc/log-guardian/env)"
  else
    echo "[INFO] daemon env icin: sudo bash scripts/ensure_daemon_env.sh"
  fi
fi

bash "$ROOT/scripts/install_laptop_stack_boot.sh"
systemctl --user start log-guardian-laptop-stack.service 2>/dev/null || \
  bash "$ROOT/scripts/laptop_stack_boot.sh"

REAL_USER="${SUDO_USER:-$(id -un)}"
if [[ "$REAL_USER" != "root" ]]; then
  sudo -u "$REAL_USER" bash "$ROOT/scripts/host_fleet_agent_setup.sh" --install-user-service \
    2>/dev/null || bash "$ROOT/scripts/host_fleet_agent_setup.sh" --install-user-service
else
  bash "$ROOT/scripts/host_fleet_agent_setup.sh" --install-user-service
fi

echo ""
echo "[OK] laptop_reboot_ready"
echo "  Stack:  systemctl --user status log-guardian-laptop-stack"
echo "  Filo:   journalctl --user -u log-guardian-fleet-keepalive -f"
echo "  VM:     bash scripts/vm_fleet_agent_setup.sh --install-user-service  (VM icinde)"
echo "  Dogrula: bash scripts/laptop_excellence_gate.sh"
