#!/usr/bin/env bash
# Host analyzer + daemon baslat (soak test oncesi)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $EUID -ne 0 ]]; then
  echo "[start_prod_host] root gerekli — calistirin:"
  echo "  sudo bash scripts/start_prod_host.sh"
  exit 1
fi

IFACE="${IFACE:-$(ip route show default 2>/dev/null | awk '{print $5; exit}' || echo eth0)}"
echo "[start_prod_host] IFACE=$IFACE"

if [[ ! -f /etc/log-guardian/env ]]; then
  echo "[start_prod_host] install.sh calistirilmamis — once: sudo bash install.sh"
  exit 1
fi

systemctl enable log-guardian-daemon log-guardian 2>/dev/null || true
systemctl start log-guardian-daemon
sleep 2
systemctl start log-guardian

echo ""
systemctl is-active log-guardian-daemon log-guardian
./log-guardian --health || true
echo ""
echo "[OK] Host stack ayakta. Soak: SOAK_SHORT=1 bash scripts/soak_test.sh"
