#!/usr/bin/env bash
# Opsiyonel katman stub envanteri (Sprint E)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== Log Guardian stub / opsiyonel katman envanteri ==="
echo ""
echo "| Ozellik | Durum | Kanit / prod yolu |"
echo "|---------|-------|-------------------|"

wasm_mode="stub"
if [[ -f wasm-status.json ]]; then
  wasm_mode=$(python3 -c "import json; print(json.load(open('wasm-status.json')).get('mode','stub'))" 2>/dev/null || echo stub)
fi
echo "| Wasm plugins | ${wasm_mode} | bash scripts/wasm_release.sh |"

if grep -q 'HAVE_ZMQ=1' Makefile 2>/dev/null || pkg-config --exists libzmq 2>/dev/null; then
  echo "| Mesh ZMQ | native | libzmq kurulu |"
else
  echo "| Mesh ZMQ | stub | HAVE_ZMQ=0 (lg_stub.h) |"
fi

xdp="unknown"
if command -v log-guardian >/dev/null 2>&1; then
  xdp=$(log-guardian --status --quiet 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('xdp_mode','?'))" 2>/dev/null || echo "?")
fi
echo "| XDP ban | ${xdp} | prod NIC + log-guardian-daemon |"

echo "| Etcd mesh | config | rules.conf MESH_ETCD_ENDPOINTS |"
echo "| Dashboard TLS | docker | docker-compose.prod.yml + Caddy |"
echo ""
echo "Detay: lg_stub.h"
echo "[OK] stub_inventory"
