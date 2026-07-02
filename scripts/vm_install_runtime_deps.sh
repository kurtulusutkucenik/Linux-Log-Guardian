#!/usr/bin/env bash
# VM binary sonrasi eksik runtime: Wasmtime .so, eBPF .o, plugin .wasm
#   sudo bash scripts/vm_install_runtime_deps.sh
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "[vm_install_runtime_deps] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PREFIX="${LG_PREFIX:-/usr/local}"
CONF_DIR="${LG_CONF:-/etc/log-guardian}"
LIBDIR="$PREFIX/lib/log-guardian"

install -d -m 0755 "$LIBDIR"
if [[ -f "$ROOT/vendor/wasmtime/lib/libwasmtime.so" ]]; then
  install -m 755 "$ROOT/vendor/wasmtime/lib/libwasmtime.so" "$LIBDIR/"
  echo "[OK] libwasmtime.so -> $LIBDIR"
elif ldd "$PREFIX/bin/log-guardian" 2>/dev/null | grep -q 'libwasmtime.so => not found'; then
  echo "[FAIL] libwasmtime.so yok — host: bash scripts/install_wasmtime_dev.sh" >&2
  exit 1
else
  echo "[OK] libwasmtime (vendor yok — sistem veya statik link)"
fi

install -d -m 0755 "$CONF_DIR/examples/plugins"
if compgen -G "$ROOT/examples/plugins/*.wasm" >/dev/null; then
  install -m 644 "$ROOT/examples/plugins/"*.wasm "$CONF_DIR/examples/plugins/" 2>/dev/null || true
  echo "[OK] wasm plugins -> $CONF_DIR/examples/plugins"
fi

for f in xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o; do
  if [[ -f "$ROOT/$f" ]]; then
    install -m 755 "$ROOT/$f" "$CONF_DIR/$f"
  fi
done
echo "[OK] eBPF objects -> $CONF_DIR/*.o"

RULES="${LG_RULES:-$CONF_DIR/rules.conf}"
if [[ -f "$RULES" ]]; then
  if grep -qE '^METRICS_PORT=0' "$RULES" 2>/dev/null; then
    sed -i 's/^METRICS_PORT=0/METRICS_PORT=9091/' "$RULES"
    echo "[OK] METRICS_PORT=9091 (onceki 0)"
  elif ! grep -qE '^METRICS_PORT=' "$RULES" 2>/dev/null; then
    echo "METRICS_PORT=9091" >>"$RULES"
    echo "[OK] METRICS_PORT=9091 eklendi"
  fi
fi

if [[ -x "$ROOT/scripts/sync_service_password.sh" ]]; then
  bash "$ROOT/scripts/sync_service_password.sh" || true
fi
if [[ -x "$ROOT/scripts/fix_rules_conf_perms.sh" ]]; then
  bash "$ROOT/scripts/fix_rules_conf_perms.sh"
fi

if [[ -x "$PREFIX/bin/log-guardian" ]]; then
  if ! ldd "$PREFIX/bin/log-guardian" 2>/dev/null | grep -q 'not found'; then
    echo "[OK] ldd log-guardian — tum kutuphaneler cozuldu"
  else
    echo "[WARN] ldd eksik kutuphane:" >&2
    ldd "$PREFIX/bin/log-guardian" 2>&1 | grep 'not found' >&2 || true
  fi
fi

echo "[OK] vm_install_runtime_deps tamam"
