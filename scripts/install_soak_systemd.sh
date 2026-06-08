#!/usr/bin/env bash
# VPS: 72h soak icin systemd unit (reboot'ta yeniden baslatmak icin enable + start)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_SRC="$ROOT/deploy/log-guardian-soak.service"
UNIT_DST="/etc/systemd/system/log-guardian-soak.service"
WORKDIR="${LG_SOAK_WORKDIR:-$ROOT}"

if [[ $EUID -ne 0 ]]; then
  echo "[install_soak_systemd] sudo gerekli: sudo bash scripts/install_soak_systemd.sh"
  exit 1
fi

if [[ ! -f "$UNIT_SRC" ]]; then
  echo "[ERR] $UNIT_SRC yok"
  exit 1
fi

sed "s|@LG_SOAK_WORKDIR@|${WORKDIR//|/\\|}|g" "$UNIT_SRC" > "$UNIT_DST"
systemctl daemon-reload
echo "[OK] $UNIT_DST (WORKDIR=$WORKDIR)"
echo ""
echo "  sudo systemctl enable --now log-guardian-soak"
echo "  bash scripts/soak_status.sh"
echo ""
echo "  Not: Reboot soak'u keser — VPS 72h acik kalmali veya reboot sonrasi tekrar start."
