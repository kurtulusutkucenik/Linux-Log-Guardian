#!/usr/bin/env bash
# Bozuk log-guardian-daemon.service (ExecStartPost) duzelt
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "sudo gerekli: sudo bash scripts/fix_systemd_units.sh"; exit 1; }

UNIT=/etc/systemd/system/log-guardian-daemon.service
if [[ ! -f "$UNIT" ]]; then
  echo "[ERR] $UNIT yok — once: sudo bash scripts/install_steps.sh 3-install"
  exit 1
fi

if grep -q '^ExecStartPost=/bin/sh' "$UNIT"; then
  sed -i '/^ExecStartPost=\/bin\/sh/d' "$UNIT"
  echo "[OK] Bozuk ExecStartPost satiri kaldirildi"
else
  echo "[OK] ExecStartPost zaten yok"
fi

systemctl daemon-reload
systemctl reset-failed log-guardian-daemon log-guardian 2>/dev/null || true
systemctl restart log-guardian-daemon
sleep 2
systemctl restart log-guardian || true

echo "---"
systemctl is-active log-guardian-daemon log-guardian || true
systemctl status log-guardian-daemon log-guardian --no-pager -l 2>&1 | head -25
