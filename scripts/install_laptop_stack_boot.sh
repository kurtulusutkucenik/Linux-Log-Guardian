#!/usr/bin/env bash
# Laptop reboot sonrasi dashboard + Grafana otomatik (user systemd + linger)
#   bash scripts/install_laptop_stack_boot.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT_SRC="$ROOT/deploy/log-guardian-laptop-stack.service"
UNIT_DST="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/log-guardian-laptop-stack.service"
WORKDIR="${LG_STACK_WORKDIR:-$ROOT}"

if [[ ! -f "$UNIT_SRC" ]]; then
  echo "[install_laptop_stack_boot] FAIL: $UNIT_SRC yok" >&2
  exit 1
fi

mkdir -p "$(dirname "$UNIT_DST")"
# Yol bosluk/Unicode icerebilir — systemd biriminde tirnak zorunlu
esc_workdir="${WORKDIR//\"/\\\"}"
sed "s|@LG_STACK_WORKDIR@|${esc_workdir}|g" "$UNIT_SRC" > "$UNIT_DST"
chmod +x "$ROOT/scripts/laptop_stack_boot.sh"

systemctl --user daemon-reload
systemctl --user enable log-guardian-laptop-stack.service

if loginctl show-user "$(id -un)" -p Linger 2>/dev/null | grep -q 'Linger=no'; then
  echo "[install_laptop_stack_boot] linger aciliyor (oturum acmadan boot icin)..."
  sudo loginctl enable-linger "$(id -un)" || {
    echo "[install_laptop_stack_boot] UYARI: linger acilamadi — giris yaptiktan sonra stack ayaga kalkar"
  }
fi

echo "[OK] install_laptop_stack_boot"
echo "  Unit: $UNIT_DST"
echo "  Simdi:  systemctl --user start log-guardian-laptop-stack.service"
echo "  Durum:  systemctl --user status log-guardian-laptop-stack.service"
echo "  Kaldir: systemctl --user disable --now log-guardian-laptop-stack.service"
