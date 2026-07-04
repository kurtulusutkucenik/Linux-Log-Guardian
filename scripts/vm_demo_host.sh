#!/usr/bin/env bash
# VM demo — HOST (laptop): VM ac + paylasim + host filo + fleet gate bekle
#   bash scripts/vm_demo_host.sh
#   bash scripts/vm_demo_host.sh --exec     # ~/.config/log-guardian/vm-guest.pass varsa otomatik
#   bash scripts/vm_demo_host.sh --no-wait  # sadece hazirlik, bekleme yok
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WAIT=1
EXEC=0
TIMEOUT="${VM_DEMO_WAIT_SEC:-900}"
for arg in "$@"; do
  case "$arg" in
    --no-wait) WAIT=0 ;;
    --exec) EXEC=1 ;;
    -h|--help)
      echo "Kullanim: bash $0 [--exec] [--no-wait]"
      echo "  VM icinde (tek komut):"
      echo "    sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true"
      echo "    sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh"
      exit 0
      ;;
  esac
done

fail() { echo "[vm_demo_host] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

lg_is_vbox_guest() {
  if command -v systemd-detect-virt >/dev/null 2>&1; then
    [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  fi
  grep -qiE 'virtualbox|innotek|oracle' \
    /sys/class/dmi/id/product_name \
    /sys/class/dmi/id/sys_vendor 2>/dev/null && return 0
  return 1
}

if lg_is_vbox_guest; then
  echo "[vm_demo_host] VM icindesin — host script degil." >&2
  echo "  sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true" >&2
  echo "  sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  exit 1
fi

echo "=== vm_demo_host (HOST laptop) ==="

if ! curl -sfk --max-time 4 --resolve 'localhost:8443:127.0.0.1' \
    "https://localhost:8443/api/tier" >/dev/null 2>&1; then
  fail "dashboard :8443 yok — docker compose -f docker-compose.prod.yml up -d"
fi
ok "dashboard :8443"

bash "$ROOT/scripts/host_fleet_agent_setup.sh" --install-user-service
ok "host fleet keepalive (node-kurtulus-01)"

if [[ "$EXEC" -eq 1 ]] || [[ -f "${LG_VM_GUEST_PASSWORD_FILE:-$HOME/.config/log-guardian/vm-guest.pass}" ]]; then
  bash "$ROOT/scripts/vm_host_refresh.sh" --exec && EXEC_OK=1 || EXEC_OK=0
  if [[ "${EXEC_OK:-0}" -eq 1 ]]; then
    ok "VM guest refresh (otomatik)"
  else
    echo "[WARN] --exec basarisiz — VM penceresinde manuel komut gerekli" >&2
  fi
else
  bash "$ROOT/scripts/vm_host_refresh.sh"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  VM penceresinde (VirtualBox konsol) — TEK KOMUT:            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "  sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true"
echo "  sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh"
echo ""
echo "Otomasyon icin (bir kez):"
echo "  mkdir -p ~/.config/log-guardian"
echo "  echo 'VM_PAROLASI' > ~/.config/log-guardian/vm-guest.pass && chmod 600 ~/.config/log-guardian/vm-guest.pass"
echo "  bash scripts/vm_demo_host.sh --exec"
echo ""

if [[ "$WAIT" -eq 0 ]]; then
  echo "[OK] vm_demo_host — host hazir (--no-wait)"
  exit 0
fi

echo "[vm_demo_host] node-vm-02 ONLINE bekleniyor (max ${TIMEOUT}s)..."
FLEET_REPORT="$ROOT/vm-fleet-gate-report.json"
deadline=$((SECONDS + TIMEOUT))
while [[ $SECONDS -lt $deadline ]]; do
  if WITH_FLEET=1 bash "$ROOT/scripts/vm_fleet_gate.sh" >/dev/null; then
    ok "vm_fleet_gate — node-vm-02 Online"
    if [[ -f "$FLEET_REPORT" ]]; then
      python3 - "$FLEET_REPORT" <<'PY'
import json, sys
print(json.dumps(json.load(open(sys.argv[1], encoding="utf-8")), indent=2))
PY
    fi
    echo ""
    echo "[OK] vm_demo_host — filo demo hazir"
    echo "  https://localhost:8443/fleet  (Ctrl+Shift+R)"
    echo "  bash scripts/fleet_multi_node_e2e.sh  (opsiyonel dispatch kaniti)"
    exit 0
  fi
  sleep 12
done

echo "[WARN] vm_fleet_gate zaman asimi — VM refresh calisti mi?" >&2
echo "  VM icinde: journalctl --user -u log-guardian-fleet-keepalive -f" >&2
bash "$ROOT/scripts/vm_fleet_gate.sh" 2>&1 || true
exit 1
