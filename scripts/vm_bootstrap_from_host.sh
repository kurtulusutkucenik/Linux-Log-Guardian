#!/usr/bin/env bash
# VM: paylasim klasorunden yeni scriptleri al (ilk kurulum / script yok)
#   bash scripts/vm_bootstrap_from_host.sh
set -euo pipefail

SRC="${LG_VM_SYNC_SRC:-/mnt/lg}"
DEST="${LG_VM_SYNC_DEST:-$HOME/Linux-Log-Guardian}"

if [[ ! -d "$SRC/scripts" ]]; then
  echo "[vm_bootstrap_from_host] FAIL: $SRC/scripts yok" >&2
  echo "  VirtualBox paylasim: sudo mount -t vboxsf lg /mnt/lg" >&2
  exit 1
fi

mkdir -p "$DEST/scripts"
for f in vm_sync_from_host.sh vm_demo_gate.sh vm_build_binary.sh vm_bootstrap_from_host.sh; do
  if [[ -f "$SRC/scripts/$f" ]]; then
    cp -f "$SRC/scripts/$f" "$DEST/scripts/$f"
    chmod +x "$DEST/scripts/$f"
    echo "[OK] scripts/$f"
  fi
done

echo ""
echo "[OK] vm_bootstrap_from_host — scriptler kopyalandi"
echo "  Tam senkron:  bash scripts/vm_sync_from_host.sh"
echo "  Binary:       sudo bash scripts/vm_build_binary.sh"
echo "  Demo kapisi:  sudo bash scripts/vm_demo_gate.sh"
