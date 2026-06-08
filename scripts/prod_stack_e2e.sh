#!/usr/bin/env bash
# Oncelik-1 prod stack: Wasm native + lineage canli + L7 status zinciri
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[prod_stack_e2e] FAIL: $*" >&2; exit 1; }

echo "=== prod_stack_e2e (stub→prod) ==="

echo "--- [1/3] Wasm native ---"
if [[ "${SKIP_WASM_GATE:-0}" == "1" ]]; then
  echo "[WARN] SKIP_WASM_GATE=1 — wasm atlandi"
elif [[ "${SKIP_WASM_REBUILD:-0}" == "1" && -f wasm-status.json ]]; then
  python3 -c "
import json
d=json.load(open('wasm-status.json'))
assert d.get('pass') and d.get('mode')=='native', d
print('[OK] wasm cache — SKIP_WASM_REBUILD=1 plugins_native='+str(d.get('plugins_native',0)))
" 2>/dev/null || {
    echo "[WARN] wasm-status gecersiz — tam gate calisacak"
    bash scripts/wasm_release.sh 2>/dev/null || bash scripts/wasm_gate.sh
  }
elif ! command -v cargo >/dev/null 2>&1; then
  echo "[WARN] cargo/rust yok — Wasm atlandi (sonra: curl https://sh.rustup.rs -sSf | sh -s -- -y && bash scripts/build_wasm_plugin.sh)"
elif [[ ! -s examples/plugins/block-sqli.wasm ]]; then
  echo "[WARN] block-sqli.wasm bos/yok — bash scripts/build_wasm_plugin.sh"
else
  bash scripts/wasm_release.sh 2>/dev/null || bash scripts/wasm_gate.sh
  python3 -c "
import json
d=json.load(open('wasm-status.json'))
assert d.get('mode')=='native' and d.get('pass'), d
assert d.get('plugins_native',0)>=1, 'plugins_native=0 — analyze export yok'
print('[OK] wasm native plugins_native='+str(d['plugins_native']))
"
fi

echo "--- [2/3] Lineage canli (demo kapali) ---"
bash scripts/lineage_live_e2e.sh

echo "--- [3/3] L7 + guardian-status ---"
bash scripts/l7_prod_e2e.sh

if [[ -f guardian-status.json ]]; then
  python3 -c "
import json,sys
d=json.load(open('guardian-status.json'))
assert 'l7_http' in d, 'l7_http eksik'
bp=d.get('ban_pipeline') or {}
for k in ('ipc','xdp','ipset','failed'):
    assert k in bp, f'ban_pipeline.{k} eksik'
mode=d.get('xdp_mode','?')
daemon=d.get('daemon')
xdp_on=daemon and daemon.get('xdp_active') is True
ipc=d.get('ipc','fail')
print('[OK] guardian-status ipc='+ipc+
      ' xdp_mode='+mode+
      ' lineage_probe='+str((daemon or {}).get('lineage_probe'))+
      ' l7_probe='+str((daemon or {}).get('l7_probe')))
if ipc=='ok' and not xdp_on:
    print('[OK] XDP OFF — ipset-fallback normal (Wi-Fi/generic NIC)')
elif ipc=='fail':
    print('[WARN] daemon IPC yok — stub mod; canli: sudo systemctl start log-guardian-daemon')
"
fi

echo ""
echo "[prod_stack_e2e] Tamam. Canli eBPF icin:"
echo "  sudo log-guardian-daemon --iface eth0   # veya wlo1 (Wi-Fi'de XDP OFF beklenir)"
echo "  bash scripts/guardian_status_export.sh"
echo "  # xdp_mode=kernel-xdp | lineage_probe/l7_probe true (NIC destekliyorsa)"
