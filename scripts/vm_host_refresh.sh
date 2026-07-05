#!/usr/bin/env bash
# Host (laptop): VirtualBox VM ac + paylasim dogrula + VM icinde refresh talimati
#   bash scripts/vm_host_refresh.sh
#   bash scripts/vm_host_refresh.sh --start-only
#   LG_VM_NAME="ubuntu 24.04" LG_VM_GUEST_PASSWORD='...' bash scripts/vm_host_refresh.sh --exec
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VM_NAME="${LG_VM_NAME:-ubuntu 24.04}"
MODE="${1:-}"

fail() { echo "[vm_host_refresh] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
info() { echo "[INFO] $*"; }

lg_is_vbox_guest() {
  if command -v systemd-detect-virt >/dev/null 2>&1; then
    [[ "$(systemd-detect-virt 2>/dev/null)" == "oracle" ]] && return 0
  fi
  if grep -qiE 'virtualbox|innotek|oracle' \
      /sys/class/dmi/id/product_name \
      /sys/class/dmi/id/sys_vendor \
      /sys/class/dmi/id/bios_vendor 2>/dev/null; then
    return 0
  fi
  [[ "${HOSTNAME:-}" == *VirtualBox* || "${HOSTNAME:-}" == *virtualbox* ]] && return 0
  return 1
}

if lg_is_vbox_guest; then
  echo "[vm_host_refresh] Bu script HOST (laptop) icindir — VM icinde VBoxManage yok, bu normal." >&2
  echo "" >&2
  echo "  VM'de kullan:" >&2
  echo "    sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true" >&2
  echo "    sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh" >&2
  echo "" >&2
  if [[ -x "$ROOT/scripts/vm_refresh_from_host.sh" ]]; then
    echo "  veya yerel klon:" >&2
    echo "    sudo bash $ROOT/scripts/vm_refresh_from_host.sh" >&2
  fi
  echo "" >&2
  echo "  ~/.config/log-guardian/vm-guest.pass yalnizca HOST'ta (--exec otomasyonu icin)." >&2
  exit 1
fi

command -v VBoxManage >/dev/null 2>&1 || fail "VBoxManage yok — bu komutu laptop HOST'ta calistir (VM icinde degil)"

state="$(VBoxManage showvminfo "$VM_NAME" --machinereadable 2>/dev/null | sed -n 's/^VMState="\(.*\)"/\1/p' | head -1 || true)"
[[ -n "$state" ]] || fail "VM bulunamadi: $VM_NAME (VBoxManage list vms)"

share_ok=0
if VBoxManage showvminfo "$VM_NAME" 2>/dev/null | grep -q "Host path: '$ROOT'"; then
  share_ok=1
  ok "VBox paylasim 'lg' -> $ROOT"
else
  info "Paylasim yok veya farkli yol — ekleniyor..."
  VBoxManage sharedfolder remove "$VM_NAME" --name lg 2>/dev/null || true
  if VBoxManage sharedfolder add "$VM_NAME" --name lg --hostpath "$ROOT" --automount; then
    share_ok=1
    ok "paylasim eklendi: lg -> $ROOT"
  else
    fail "paylasim eklenemedi — VirtualBox GUI: Devices > Shared Folders > lg"
  fi
fi

if [[ "$state" == "running" ]]; then
  ok "VM zaten calisiyor"
elif [[ "$state" == "poweroff" || "$state" == "aborted" ]]; then
  info "VM baslatiliyor (headless)..."
  VBoxManage startvm "$VM_NAME" --type headless
  ok "VM baslatildi"
else
  info "VM durumu: $state — bekleniyor..."
  for _ in $(seq 1 30); do
    sleep 2
    state="$(VBoxManage showvminfo "$VM_NAME" --machinereadable | sed -n 's/^VMState="\(.*\)"/\1/p' | head -1)"
    [[ "$state" == "running" ]] && break
  done
  [[ "$state" == "running" ]] || fail "VM running degil: $state"
fi

if [[ "$MODE" == "--start-only" ]]; then
  echo ""
  echo "VM acik. Icinde tek komut:"
  echo "  sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true"
  echo "  sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh"
  exit 0
fi

# Guest Additions ag hazir mi?
for i in $(seq 1 36); do
  if VBoxManage guestproperty get "$VM_NAME" "/VirtualBox/GuestInfo/Net/0/Status" 2>/dev/null \
      | grep -qi 'Up'; then
    ok "Guest Additions ag hazir (${i}x5s)"
    break
  fi
  [[ $i -eq 36 ]] && info "Guest Additions yavas — VM icinde manuel devam"
  sleep 5
done

run_guest_refresh() {
  local pass="${LG_VM_GUEST_PASSWORD:-}"
  local pass_file="${LG_VM_GUEST_PASSWORD_FILE:-$HOME/.config/log-guardian/vm-guest.pass}"
  local pass_args=()
  local pass_content=""
  if [[ -n "$pass" ]]; then
    pass_args=(--password "$pass")
    pass_content="$pass"
  elif [[ -f "$pass_file" ]]; then
    pass_args=(--passwordfile "$pass_file")
    pass_content="$(tr -d '\r\n' < "$pass_file")"
  else
    return 1
  fi
  [[ -n "$pass_content" ]] || return 1
  # guestcontrol TTY yok — sudo -S ile VM parolasi (vm-guest.pass = VBox + sudo)
  # Tek sudo oturumu: mount + refresh root olarak (NOPASSWD sudoers gerekmez)
  local inner='/usr/bin/mount -t vboxsf lg /mnt/lg 2>/dev/null || true; bash /mnt/lg/scripts/vm_refresh_from_host.sh'
  local cmd=""
  printf -v cmd "printf '%%s\\n' %q | sudo -S -p '' bash -lc %q" "$pass_content" "$inner"
  VBoxManage guestcontrol "$VM_NAME" run \
    --exe /bin/bash \
    --username "${LG_VM_GUEST_USER:-kurtulus}" \
    "${pass_args[@]}" \
    --wait-stdout --wait-stderr --timeout 3600000 \
    -- -lc "$cmd"
}

if [[ "$MODE" == "--exec" ]]; then
  if run_guest_refresh; then
    ok "vm_host_refresh — VM guncellendi (guestcontrol)"
    exit 0
  fi
  fail "--exec basarisiz — ~/.config/log-guardian/vm-guest.pass (VM sudo parolasi) + VM'de oturum acik mi?"
fi

if run_guest_refresh 2>/dev/null; then
  ok "vm_host_refresh — VM guncellendi (guestcontrol)"
  exit 0
fi

echo ""
echo "=== VM icinde (tek komut) ==="
echo "  sudo mount -t vboxsf lg /mnt/lg 2>/dev/null || true"
echo "  sudo bash /mnt/lg/scripts/vm_refresh_from_host.sh"
echo ""
echo "Otomatik (yalnizca HOST laptop'ta — VM parolasi dosyaya):"
echo "  mkdir -p ~/.config/log-guardian"
echo "  echo 'VM_KULLANICI_PAROLASI' > ~/.config/log-guardian/vm-guest.pass"
echo "  chmod 600 ~/.config/log-guardian/vm-guest.pass"
echo "  bash scripts/vm_host_refresh.sh --exec"
echo ""
info "Host hazir — vm_demo_gate FAIL=0 hedef"
