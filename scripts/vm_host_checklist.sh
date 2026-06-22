#!/usr/bin/env bash
# Laptop (host) — VM demo oncesi kontrol listesi
#   bash scripts/vm_host_checklist.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0
ok() { echo "  [OK] $*"; }
warn() { echo "  [WARN] $*"; }
bad() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }

echo "=== vm_host_checklist ==="
echo "  Repo: ${ROOT}"
echo ""

echo "[1] Derleme + binary"
if make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon 2>/dev/null \
  && [[ -x "$ROOT/log-guardian" ]]; then
  ok "make log-guardian"
else
  bad "make log-guardian"
fi

echo "[2] Kurulum kapisi (host)"
if bash "$ROOT/scripts/post_install_verify.sh" >/dev/null 2>&1; then
  ok "post_install_verify FAIL=0"
else
  warn "post_install_verify — VM oncesi host'ta duzelt"
fi

echo "[3] .deb paketi"
if ls "$ROOT"/dist/log-guardian_*.deb >/dev/null 2>&1; then
  deb=$(ls -1t "$ROOT"/dist/log-guardian_*.deb | head -1)
  ok "deb mevcut: $(basename "$deb")"
else
  warn "deb yok — bash scripts/build_deb.sh"
fi

echo "[4] Webhook P2 (dry-run)"
if bash "$ROOT/scripts/webhook_route_proof.sh" >/dev/null 2>&1; then
  ok "webhook_route_proof"
else
  warn "webhook_route_proof FAIL — batch/route kontrol"
fi

echo "[5] VirtualBox paylasim (opsiyonel)"
share="${LG_VM_SYNC_SRC:-/mnt/lg}"
if [[ -d "$share" ]]; then
  ok "paylasim mount: $share"
else
  warn "paylasim yok ($share) — VM icinde: sudo mount -t vboxsf lg /mnt/lg"
fi

echo ""
echo "=== VM icinde (paylasim mount sonrasi) ==="
echo "  cd ~/Linux-Log-Guardian"
echo "  bash /mnt/lg/scripts/vm_sync_from_host.sh"
echo "  sudo bash scripts/vm_build_binary.sh    # .c degistiysen (sessiz varsayilan)"
echo "  sudo bash scripts/vm_demo_gate.sh       # FAIL=0 hedef"
echo "  LG_VERBOSE_BUILD=1 sudo bash scripts/vm_build_binary.sh  # tam make ciktisi"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "[OK] vm_host_checklist — VM sync icin hazir"
  exit 0
fi
echo "[FAIL] vm_host_checklist ($FAIL kritik)" >&2
exit 1
