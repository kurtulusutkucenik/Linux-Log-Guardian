#!/usr/bin/env bash
# VM: VirtualBox paylasim klasoru (/mnt/lg) -> yerel klon
#   bash scripts/vm_sync_from_host.sh
#   sudo bash scripts/vm_demo_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/vm_paths.sh
source "$ROOT/scripts/lib/vm_paths.sh"

SRC="${LG_VM_SYNC_SRC:-/mnt/lg}"
DEST="$(lg_vm_dest_dir)"

if [[ ! -d "$SRC" ]]; then
  echo "[vm_sync_from_host] FAIL: $SRC yok" >&2
  if ! grep -qiE 'virtualbox|innotek|oracle' \
      /sys/class/dmi/id/product_name \
      /sys/class/dmi/id/sys_vendor 2>/dev/null; then
    echo "  Bu komut VM icindir — laptop HOST'ta calistirdin." >&2
    echo "  HOST: bash scripts/vm_host_refresh.sh" >&2
    echo "  VM:   sudo mount -t vboxsf lg /mnt/lg && sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  else
    echo "  VirtualBox: paylasim 'lg' mount: sudo mount -t vboxsf lg /mnt/lg" >&2
    echo "  veya: sudo bash scripts/vm_refresh_from_host.sh  (yerel klon varsa)" >&2
  fi
  exit 1
fi

mkdir -p "$DEST"

# Hassas / root / runtime dosyalar haric — rsync code 23 onlenir
# vboxsf: host root:600 deploy/mtls/*.key okunamaz (Operation not permitted)
rsync -a \
  --exclude='.git/' \
  --exclude='.cache/' \
  --exclude='.venv*/' \
  --exclude='node_modules/' \
  --exclude='dashboard/.next/' \
  --exclude='dashboard/node_modules/' \
  --exclude='dashboard/.env.local' \
  --exclude='data/' \
  --exclude='dist/deb-stage/' \
  --exclude='dist/log-guardian-vm.zip' \
  --exclude='dist/*.zip' \
  --exclude='graphify-out/' \
  --exclude='dist/' \
  --exclude='deploy/mtls/*.key' \
  --exclude='__pycache__/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='rules/fp-bench.conf' \
  --exclude='rules/*.local' \
  --exclude='test_rules.conf' \
  --include='tests/fixtures/***' \
  --include='test_*.log' \
  --exclude='*.log' \
  --exclude='*.db' \
  --exclude='*.db-*' \
  --exclude='*.o' \
  --exclude='log-guardian' \
  --exclude='log-guardian-daemon' \
  --exclude='tester' \
  --exclude='vmlinux.h' \
  --exclude='.wrangler/' \
  "$SRC/" "$DEST/"

REAL_USER="$(lg_vm_real_user)"
if [[ "$(id -u)" -eq 0 && -n "$REAL_USER" && "$REAL_USER" != root ]]; then
  chown -R "$REAL_USER:$REAL_USER" "$DEST"
  ok_chown=1
fi

echo "[OK] vm_sync_from_host -> $DEST"
echo "  Host prep: bash scripts/vm_host_prep_gate.sh  (69+ test kaniti)"
if deb="$(ls -1t "$DEST"/dist/log-guardian_*.deb 2>/dev/null | head -1)"; then
  echo "  .deb: $(basename "$deb") (dist/ — VM: sudo bash scripts/vm_install_deb.sh)"
else
  echo "  .deb: yok — HOST: bash scripts/build_deb.sh, sonra tekrar sync"
fi
[[ "${ok_chown:-0}" -eq 1 ]] && echo "  sahiplik: $REAL_USER (sudo sync sonrasi)"
echo "  Tek komut (onerilen): sudo bash scripts/vm_refresh_from_host.sh"
echo "  veya paylasimdan:     sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh"
echo "  Adim adim:"
echo "    sudo bash scripts/vm_build_binary.sh"
echo "    sudo bash scripts/vm_disable_telegram_poll.sh"
echo "    sudo bash scripts/vm_demo_gate.sh"
echo "  fleet keepalive (VM): bash scripts/vm_fleet_agent_setup.sh --install-user-service"
echo "  fleet dogrulama (host): bash scripts/vm_fleet_gate.sh"
