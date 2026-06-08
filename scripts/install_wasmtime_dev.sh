#!/usr/bin/env bash
# Wasmtime C API — vendor/wasmtime (CI + yerel HAVE_WASM=1)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${WASMTIME_ROOT:-$ROOT/vendor/wasmtime}"
VERSION="${WASMTIME_VERSION:-v27.0.0}"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64)  TRIPLET="x86_64-linux" ;;
  aarch64) TRIPLET="aarch64-linux" ;;
  *) echo "[install_wasmtime] desteklenmeyen arch: $ARCH" >&2; exit 1 ;;
esac

if [[ -f "$DEST/lib/libwasmtime.so" || -f "$DEST/lib/libwasmtime.a" ]]; then
  echo "[install_wasmtime] zaten kurulu: $DEST"
  exit 0
fi

if pkg-config --exists wasmtime 2>/dev/null; then
  echo "[install_wasmtime] sistem pkg-config wasmtime mevcut"
  exit 0
fi

TARBALL="wasmtime-${VERSION}-${TRIPLET}-c-api.tar.xz"
URL="https://github.com/bytecodealliance/wasmtime/releases/download/${VERSION}/${TARBALL}"
TMP="$ROOT/.cache/wasmtime"
mkdir -p "$TMP"
ARCHIVE="$TMP/$TARBALL"

echo "[install_wasmtime] indiriliyor: $URL"
curl -fsSL "$URL" -o "$ARCHIVE"
rm -rf "$DEST"
mkdir -p "$DEST"
tar -xJf "$ARCHIVE" -C "$DEST" --strip-components=1
echo "[OK] Wasmtime C API -> $DEST"
