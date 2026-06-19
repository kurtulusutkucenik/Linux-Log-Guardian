#!/usr/bin/env bash
# Laptop derleme izinleri — root/nobody sahipli .o dosyalari make'i kirer
#   bash scripts/fix_laptop_build.sh
#   sudo bash scripts/fix_laptop_build.sh   # repo root:root ise
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGET_USER="${SUDO_USER:-${USER:-}}"
[[ -n "$TARGET_USER" ]] || { echo "[fix_laptop_build] FAIL: USER belirlenemedi" >&2; exit 1; }

OWNER=$(stat -c '%U' "$ROOT" 2>/dev/null || echo "?")
if [[ "$OWNER" != "$TARGET_USER" ]]; then
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "[fix_laptop_build] Repo sahibi $OWNER — sudo ile yeniden calistiriliyor..."
    exec sudo bash "$0" "$@"
  fi
  echo "[fix_laptop_build] chown -R ${TARGET_USER}:${TARGET_USER} $ROOT"
  chown -R "${TARGET_USER}:${TARGET_USER}" "$ROOT"
fi

echo "[fix_laptop_build] eski object dosyalari temizleniyor..."
make clean 2>/dev/null || rm -f "$ROOT"/*.o "$ROOT"/*.daemon.o 2>/dev/null || true

echo "[fix_laptop_build] derleme..."
make -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon

echo "[OK] fix_laptop_build — ./log-guardian hazir"
echo "  Metrikler: bash scripts/metrics_reload.sh  (opsiyonel: sudo make install)"
