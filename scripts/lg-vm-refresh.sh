#!/usr/bin/env bash
# VM kisa yol: sync + build + demo gate (vm_refresh_from_host wrapper)
#
#   cd ~/Linux-Log-Guardian
#   sudo bash scripts/lg-vm-refresh.sh
#
# Ilk kurulum / script yoksa (host'tan):
#   sudo mount -t vboxsf lg /mnt/lg
#   sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/scripts/vm_refresh_from_host.sh"

if [[ ! -f "$TARGET" ]]; then
  echo "[lg-vm-refresh] FAIL: $TARGET yok" >&2
  echo "  Host'ta kod guncel mi? Once laptop'ta commit/sync, sonra VM:" >&2
  echo "    sudo mount -t vboxsf lg /mnt/lg" >&2
  echo "    sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  exit 1
fi

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  exec sudo bash "$0" "$@"
fi

# ozet kutusu vm_refresh_from_host.sh sonunda (host kodu guncel olmali)
exec bash "$TARGET" "$@"
