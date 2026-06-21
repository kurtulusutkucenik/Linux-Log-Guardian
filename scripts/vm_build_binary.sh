#!/usr/bin/env bash
# VM: kaynak sync sonrasi binary guncelle (BPF vmlinux.h cakismasi onlenir)
#   bash /mnt/lg/scripts/vm_sync_from_host.sh
#   sudo bash scripts/vm_build_binary.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

[[ "${EUID:-$(id -u)}" -eq 0 ]] || { echo "[vm_build_binary] sudo gerekli" >&2; exit 1; }

# Laptop vmlinux.h VM'de typedef cakismasi yapar — yerel uret veya fallback
if [[ -f vmlinux.h ]]; then
  sz=$(wc -c < vmlinux.h 2>/dev/null || echo 0)
  if [[ "$sz" -gt 4096 ]]; then
    echo "[vm_build_binary] vmlinux.h yenileniyor (VM BTF)..."
    rm -f vmlinux.h
  fi
fi

if [[ ! -f vmlinux.h ]] || [[ $(wc -c < vmlinux.h) -le 4096 ]]; then
  make vmlinux.h 2>/dev/null || rm -f vmlinux.h
fi

bash "$ROOT/scripts/upgrade_log_guardian_binary.sh"
echo ""
echo "[OK] vm_build_binary — binary kuruldu"
echo "  bash scripts/vm_demo_gate.sh --verify-only"
