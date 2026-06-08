#!/usr/bin/env bash
# Wasm plugin derle (wasm32-unknown-unknown oncelikli) — HAVE_WASM=1 icin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="$ROOT/examples/plugins/rust-plugin"
OUT_SQLI="$ROOT/examples/plugins/block-sqli.wasm"
OUT_SCAN="$ROOT/examples/plugins/block-scanner.wasm"

MIN_BYTES="${WASM_PLUGIN_MIN_BYTES:-256}"
plugin_ok() {
  [[ -f "$OUT_SQLI" ]] && [[ "$(stat -c%s "$OUT_SQLI" 2>/dev/null || stat -f%z "$OUT_SQLI")" -ge "$MIN_BYTES" ]]
}

if ! command -v cargo >/dev/null 2>&1; then
  if plugin_ok; then
    echo "[build_wasm] cargo yok — mevcut plugin OK ($(stat -c%s "$OUT_SQLI" 2>/dev/null || stat -f%z "$OUT_SQLI") bytes)"
    exit 0
  fi
  echo "[build_wasm] FAIL: cargo gerekli (rustup + stable). Plugin yok veya cok kucuk." >&2
  exit 1
fi

cd "$PLUGIN_DIR"
export CARGO_TARGET_DIR="$PLUGIN_DIR/target"
TARGET=""
for t in wasm32-unknown-unknown wasm32-wasip1 wasm32-wasi; do
  if rustup target add "$t" 2>/dev/null; then
    TARGET="$t"
    break
  fi
done
[[ -n "$TARGET" ]] || { echo "[build_wasm] wasm target eklenemedi" >&2; exit 1; }

cargo build --release --target "$TARGET"
WASM="target/$TARGET/release/lg_plugin_sqli.wasm"
if [[ ! -f "$WASM" ]]; then
  WASM="target/$TARGET/release/deps/lg_plugin_sqli.wasm"
fi
[[ -f "$WASM" ]] || { echo "[build_wasm] cikti yok: lg_plugin_sqli.wasm" >&2; exit 1; }

cp "$WASM" "$OUT_SQLI"
cp "$WASM" "$OUT_SCAN"
SZ=$(stat -c%s "$OUT_SQLI" 2>/dev/null || stat -f%z "$OUT_SQLI")
echo "[OK] $OUT_SQLI ($SZ bytes, target=$TARGET) — make HAVE_WASM=1"
