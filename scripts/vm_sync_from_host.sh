#!/usr/bin/env bash
# VM: VirtualBox paylasim klasoru (/mnt/lg) -> yerel klon
#   bash scripts/vm_sync_from_host.sh
#   sudo bash scripts/vm_demo_gate.sh
set -euo pipefail

SRC="${LG_VM_SYNC_SRC:-/mnt/lg}"
DEST="${LG_VM_SYNC_DEST:-$HOME/Linux-Log-Guardian}"

if [[ ! -d "$SRC" ]]; then
  echo "[vm_sync_from_host] FAIL: $SRC yok" >&2
  echo "  VirtualBox: paylasim 'lg' mount: sudo mount -t vboxsf lg /mnt/lg" >&2
  exit 1
fi

mkdir -p "$DEST"

# Hassas / root / runtime dosyalar haric — rsync code 23 onlenir
rsync -a \
  --exclude='.git/' \
  --exclude='.cache/' \
  --exclude='.venv*/' \
  --exclude='node_modules/' \
  --exclude='dashboard/.next/' \
  --exclude='dashboard/node_modules/' \
  --exclude='dashboard/.env.local' \
  --exclude='data/' \
  --exclude='dist/' \
  --exclude='graphify-out/' \
  --exclude='assets/website-deploy/' \
  --exclude='__pycache__/' \
  --exclude='.env' \
  --exclude='.env.*' \
  --exclude='rules.conf' \
  --exclude='test_rules.conf' \
  --exclude='*.db' \
  --exclude='*.db-*' \
  --exclude='*.log' \
  --exclude='*.o' \
  --exclude='log-guardian' \
  --exclude='log-guardian-daemon' \
  --exclude='tester' \
  --exclude='vmlinux.h' \
  --exclude='.wrangler/' \
  "$SRC/" "$DEST/"

echo "[OK] vm_sync_from_host -> $DEST"
echo "  Binary guncelle: sudo bash scripts/vm_build_binary.sh"
echo "  Demo kapisi:     sudo bash scripts/vm_demo_gate.sh"
