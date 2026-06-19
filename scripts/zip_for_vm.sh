#!/usr/bin/env bash
# VM/VPS zip paketi — WhatsApp veya scp ile tasima
#   bash scripts/zip_for_vm.sh                    # soak VPS profili (~100M)
#   ZIP_PROFILE=full bash scripts/zip_for_vm.sh   # dashboard dahil
#   OUT=~/lg-vm.zip bash scripts/zip_for_vm.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="${OUT:-$ROOT/../log-guardian-vm.zip}"
ZIP_PROFILE="${ZIP_PROFILE:-vm}"

echo "=== zip_for_vm ==="
echo "  profil: $ZIP_PROFILE (vm=soak/VPS, full=dashboard dahil)"
echo "  kaynak: $ROOT"
echo "  cikti:  $OUT"

excludes=(
  -x '.git/*'
  -x '*/.git/*'
  -x '*/node_modules/*'
  -x '*/.cache/*'
  -x '*/dashboard/.next/*'
  -x '*/dist/deb-stage/*'
  -x '*.o'
  -x '*.daemon.o'
  -x '*/__pycache__/*'
  -x '*/.cursor/*'
  -x '*/graphify-out/*'
  -x 'data-room.zip'
)
if [[ "$ZIP_PROFILE" == "vm" ]]; then
  excludes+=(-x 'dashboard/*')
fi

rm -f "$OUT"
set +e
zip -r "$OUT" . "${excludes[@]}"
zec=$?
set -e
# zip: 0=ok, 1=warning, >1=hata (18=bazi dosyalar okunamadi)
if [[ ! -f "$OUT" ]]; then
  echo "[zip_for_vm] FAIL: zip olusturulamadi (exit=$zec)" >&2
  exit 1
fi
if [[ "$zec" -gt 1 ]]; then
  echo "[zip_for_vm] WARN: zip exit=$zec (kismi okuma — paket yine de olustu)" >&2
fi

sz=$(du -h "$OUT" | awk '{print $1}')
echo "[OK] zip_for_vm -> $OUT ($sz)"
echo ""
echo "VM'de:"
echo "  unzip log-guardian-vm.zip -d ~/Linux-Log-Guardian"
echo "  cd ~/Linux-Log-Guardian"
echo "  sudo bash install.sh --no-xdp"
echo "  sudo bash scripts/install_first_run.sh"
echo "  # servis FAIL ise: sudo bash scripts/repair_no_xdp_stack.sh"
echo "  newgrp log-guardian && bash scripts/post_install_verify.sh"
