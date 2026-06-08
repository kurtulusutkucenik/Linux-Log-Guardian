#!/usr/bin/env bash
# CI kapisi: Wasmtime C API + Rust plugin + HAVE_WASM=1 smoke test
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

WASMTIME_ROOT="${WASMTIME_ROOT:-$ROOT/vendor/wasmtime}"
export LD_LIBRARY_PATH="${WASMTIME_ROOT}/lib:${LD_LIBRARY_PATH:-}"

bash scripts/install_wasmtime_dev.sh
bash scripts/build_wasm_plugin.sh

MIN_BYTES="${WASM_PLUGIN_MIN_BYTES:-256}"
SZ=$(stat -c%s "$ROOT/examples/plugins/block-sqli.wasm" 2>/dev/null || stat -f%z "$ROOT/examples/plugins/block-sqli.wasm")
if [[ "${SZ:-0}" -lt "$MIN_BYTES" ]]; then
  echo "[wasm_gate] FAIL: block-sqli.wasm ${SZ:-0} bytes (min $MIN_BYTES) — cargo ile derleyin" >&2
  exit 1
fi

if ! pkg-config --exists wasmtime 2>/dev/null && \
   [[ ! -f "$WASMTIME_ROOT/lib/libwasmtime.so" && ! -f "$WASMTIME_ROOT/lib/libwasmtime.a" ]]; then
  echo "[wasm_gate] FAIL: Wasmtime C API bulunamadi" >&2
  exit 1
fi

make clean
make -j"$(nproc 2>/dev/null || echo 2)" HAVE_WASM=1 WASMTIME_ROOT="$WASMTIME_ROOT" \
  log-guardian log-guardian-daemon

export WASM_BIN="$ROOT/log-guardian"
export WASM_GATE_MODE=native
export WASM_PROD_STRICT=1
bash scripts/wasm_smoke_test.sh

echo "[wasm_gate] OK HAVE_WASM=1"
