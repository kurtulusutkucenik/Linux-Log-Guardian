#!/usr/bin/env bash
# VM icinde .deb kurulumu (paylasimdan) — VPS DEGIL, SSH gerekmez
#   sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true
#   sudo bash /mnt/lg/scripts/vm_install_deb.sh
#
# Zaten vm_demo_gate FAIL=0 ise GEREKMEZ — vm_refresh yeterli.
# vps_bootstrap.sh VM'de CALISTIRMA.
set -euo pipefail

# shellcheck source=scripts/lib/vm_paths.sh
_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/vm_paths.sh
source "$_root/scripts/lib/vm_paths.sh"

SHARE="${LG_VM_SYNC_SRC:-/mnt/lg}"
if [[ -d "$_root/scripts" && "$_root" != "$SHARE" ]]; then
  SHARE="$_root"
fi
DEST="$(lg_vm_dest_dir)"

fail() { echo "[vm_install_deb] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

lg_newest_deb() {
  local d f best="" best_t=0 t
  for d in "$@"; do
    [[ -d "$d" ]] || continue
    for f in "$d"/log-guardian_*.deb; do
      [[ -f "$f" ]] || continue
      t=$(stat -c %Y "$f" 2>/dev/null || echo 0)
      if (( t > best_t )); then best_t=$t; best=$f; fi
    done
  done
  echo "$best"
}

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli"

lg_is_vbox_guest() {
  command -v systemd-detect-virt >/dev/null 2>&1 \
    && [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  grep -qiE 'virtualbox|innotek' /sys/class/dmi/id/product_name 2>/dev/null && return 0
  [[ "${HOSTNAME:-}" == *VirtualBox* ]] && return 0
  return 1
}

if ! lg_is_vbox_guest 2>/dev/null; then
  echo "[vm_install_deb] WARN: VirtualBox guest degil gibi — yine de devam" >&2
fi

DEB="${LG_DEB:-}"
if [[ -z "$DEB" ]]; then
  DEB="$(lg_newest_deb "$DEST/dist" "$SHARE/dist" /mnt/lg/dist)"
fi
if [[ -z "$DEB" || ! -f "$DEB" ]]; then
  echo "[vm_install_deb] dist arandi:" >&2
  echo "    $DEST/dist" >&2
  echo "    $SHARE/dist" >&2
  echo "    /mnt/lg/dist" >&2
  fail ".deb yok — HOST: bash scripts/build_deb.sh && bash scripts/vm_sync_from_host.sh"
fi

INST="/usr/local/share/log-guardian/scripts"
[[ -d "$INST" ]] || INST="$SHARE/scripts"

echo "=== vm_install_deb ==="
echo "  deb: $(basename "$DEB")"
echo "  not: VM'de XDP yok — daemon kapali olabilir (ipset fallback normal)"
echo ""

echo "=== [1/4] dpkg -i ==="
if ! dpkg -i "$DEB"; then
  apt-get install -f -y
  dpkg -i "$DEB"
fi
ok "paket kuruldu"

lg_vm_build_root() {
  local d
  for d in "$DEST" "$_root" /mnt/lg; do
    [[ -f "$d/main.c" && -x "$d/scripts/vm_build_binary.sh" ]] && { echo "$d"; return 0; }
  done
  return 1
}

echo "=== [2/5] VM binary (host .deb yerine yerel derleme) ==="
BUILD_ROOT=""
if BUILD_ROOT="$(lg_vm_build_root)"; then
  echo "  kaynak: $BUILD_ROOT"
  (cd "$BUILD_ROOT" && bash scripts/vm_build_binary.sh)
  ok "vm_build_binary — /usr/local/bin/log-guardian VM'de derlendi"
else
  echo "[WARN] kaynak/main.c yok — host .deb binary ile devam" >&2
  echo "  cozum: sudo bash scripts/vm_sync_from_host.sh" >&2
fi

echo "=== [3/5] install_first_run (VM: FP warmup kapali) ==="
FIRST="$INST/install_first_run.sh"
[[ -f "$FIRST" ]] || FIRST="$SHARE/scripts/install_first_run.sh"
SKIP_FP_WARMUP=1 LG_QUIET_FLEET=1 LG_REPO="${DEST:-$_root}" bash "$FIRST"
ok "install_first_run"

echo "=== [4/5] stack onarim (kurulu scriptler) ==="
REPAIR="$INST/repair_no_xdp_stack.sh"
[[ -f "$REPAIR" ]] || REPAIR="$SHARE/scripts/repair_no_xdp_stack.sh"
export REPAIR_QUIET=0
bash "$REPAIR"
ok "repair_no_xdp_stack"

echo "=== [5/5] vm_demo_gate (verify) ==="
GATE="$INST/vm_demo_gate.sh"
[[ -f "$GATE" ]] || GATE="$SHARE/scripts/vm_demo_gate.sh"
bash "$GATE" --verify-only

echo ""
echo "[OK] vm_install_deb — .deb VM'de kuruldu"
echo "  VPS (gercek sunucu): VPS_HOST=root@IP bash scripts/vps_push_deb.sh (HOST'ta)"
