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

echo "--- [3/4] L7 + guardian-status ---"
bash scripts/l7_prod_e2e.sh

echo "--- [4/4] Caddy ban API mTLS (opsiyonel) ---"
if [[ -f deploy/mtls.d/.enabled ]]; then
  bash scripts/caddy_api_mtls_e2e.sh || echo "[WARN] caddy_api_mtls_e2e — scripts/caddy_mtls_setup.sh status"
else
  echo "[SKIP] caddy mTLS kapali (enable: bash scripts/caddy_mtls_setup.sh enable)"
fi

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

OUT="${ROOT}/prod-stack-e2e-report.json"
python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

root = Path(sys.argv[1]).resolve().parent
out = Path(sys.argv[1])

def load(name):
    p = root / name
    return json.loads(p.read_text()) if p.is_file() else {}

wasm = load("wasm-status.json")
lineage = load("lineage-live-report.json")
status = load("guardian-status.json")
daemon = status.get("daemon") or {}
l7 = status.get("l7_http") or {}

wasm_ok = wasm.get("pass") and wasm.get("mode") == "native"
lineage_ok = lineage.get("pass") is True
l7_ok = l7.get("probe_active") is True or daemon.get("l7_probe") is True
ipc = status.get("ipc", "?")
xdp_mode = status.get("xdp_mode", "?")

out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": wasm_ok and lineage_ok and l7_ok,
    "wasm_mode": wasm.get("mode"),
    "wasm_plugins_native": wasm.get("plugins_native", 0),
    "lineage_risk": lineage.get("chain_risk") or lineage.get("max_risk"),
    "lineage_resolver": lineage.get("resolver_source"),
    "l7_probe_active": l7_ok,
    "ipc": ipc,
    "xdp_mode": xdp_mode,
    "lineage_probe": daemon.get("lineage_probe"),
    "script": "scripts/prod_stack_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
print(f"[OK] report -> {out.name}")
PY

echo ""
echo "[prod_stack_e2e] Tamam. Canli eBPF icin:"
echo "  sudo log-guardian-daemon --iface eth0   # veya wlo1 (Wi-Fi'de XDP OFF beklenir)"
echo "  bash scripts/guardian_status_export.sh"
echo "  # xdp_mode=kernel-xdp | lineage_probe/l7_probe true (NIC destekliyorsa)"
