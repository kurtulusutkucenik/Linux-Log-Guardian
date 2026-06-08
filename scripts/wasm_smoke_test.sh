#!/usr/bin/env bash
# Wasm plugin entegrasyon — HAVE_WASM=1 binary ile SQLi blok testi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

BIN="${WASM_BIN:-./log-guardian}"
WASMTIME_ROOT="${WASMTIME_ROOT:-$ROOT/vendor/wasmtime}"
export LD_LIBRARY_PATH="${WASMTIME_ROOT}/lib:${LD_LIBRARY_PATH:-}"

test -x "$BIN" || { echo "[wasm_smoke] binary yok: $BIN" >&2; exit 1; }
test -f examples/plugins/block-sqli.wasm || bash scripts/build_wasm_plugin.sh

ATTACK_LOG="$ROOT/.cache/wasm_smoke_attack.log"
mkdir -p "$ROOT/.cache"
cat > "$ATTACK_LOG" <<'LOG'
10.0.0.99 - - [02/Jun/2026:10:00:01 +0300] "GET /search?q=1%27+UNION+SELECT+null HTTP/1.1" 200 100 "-" "Mozilla/5.0"
LOG

RULES="$ROOT/.cache/wasm_smoke_rules.conf"
cat > "$RULES" <<RC
ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
WAF_ENABLED=1
WASM_ENABLED=1
WASM_PLUGIN_DIR=$ROOT/examples/plugins
CRS_ENABLED=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
SIEM_FORWARDER_ENABLED=0
MESH_PUB_ENABLED=0
MESH_SUB_ENABLED=0
RC
chmod 600 "$RULES"

out=$("$BIN" "$ATTACK_LOG" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)
alerts=$(echo "$out" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)

python3 <<PY
import json, subprocess, os, sys
from pathlib import Path

root = Path("$ROOT")
wasm_json = root / "wasm-status.json"
mode = "stub"
if os.environ.get("WASM_GATE_MODE"):
    mode = os.environ["WASM_GATE_MODE"]
else:
    try:
        import subprocess
        st = subprocess.check_output(
            ["$BIN", "--status"], stderr=subprocess.DEVNULL, text=True, timeout=30
        )
        if '"native":true' in st.replace(" ", ""):
            mode = "native"
    except Exception:
        try:
            ldd = subprocess.check_output(["ldd", "$BIN"], stderr=subprocess.DEVNULL, text=True)
            if "wasmtime" in ldd:
                mode = "native"
        except Exception:
            pass

# strings guvenilir degil; compile flag icin log-guardian calistir
plugin_path = root / "examples/plugins/block-sqli.wasm"
plugin_bytes = plugin_path.stat().st_size if plugin_path.is_file() else 0
min_bytes = int(os.environ.get("WASM_PLUGIN_MIN_BYTES", "256"))
mode = os.environ.get("WASM_GATE_MODE", mode)
plugins_native = 0
try:
    import re
    st = subprocess.check_output(
        ["$BIN", "--status"], stderr=subprocess.DEVNULL, text=True, timeout=30
    )
    m = re.search(r'"plugins_native"\s*:\s*(\d+)', st)
    if m:
        plugins_native = int(m.group(1))
except Exception:
    pass
obj = {
    "mode": mode,
    "alerts_on_sqli": int("$alerts"),
    "plugins_native": plugins_native,
    "plugin_path": str(plugin_path),
    "plugin_bytes": plugin_bytes,
    "pass": int("$alerts") >= 1 and plugin_bytes >= min_bytes and mode == "native"
        and plugins_native >= 1,
}
wasm_json.write_text(json.dumps(obj, indent=2), encoding="utf-8")
print(f"[wasm_smoke] alerts={obj['alerts_on_sqli']} plugin_bytes={obj['plugin_bytes']}")
if not obj["pass"]:
    if obj["alerts_on_sqli"] < 1:
        print("[wasm_smoke] FAIL: SQLi alarm yok", file=sys.stderr)
    elif plugin_bytes < min_bytes:
        print(f"[wasm_smoke] FAIL: plugin {plugin_bytes}B < {min_bytes}B (cargo build?)", file=sys.stderr)
    elif mode != "native":
        print("[wasm_smoke] FAIL: mode stub — make HAVE_WASM=1", file=sys.stderr)
    sys.exit(1)
print("[OK] wasm smoke — native plugin, SQLi alarm, plugin_bytes=%d" % plugin_bytes)
PY
