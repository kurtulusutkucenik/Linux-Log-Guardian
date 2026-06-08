#!/usr/bin/env bash
# Prod release: Wasmtime C API + Rust plugin + HAVE_WASM=1 binary
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

bash scripts/wasm_gate.sh

python3 <<'PY'
import json
from pathlib import Path
d = json.loads(Path("wasm-status.json").read_text(encoding="utf-8"))
if d.get("mode") != "native" or not d.get("pass"):
    raise SystemExit("[wasm_release] wasm-status.json native/pass degil")
print(f"[wasm_release] OK mode={d['mode']} alerts={d.get('alerts_on_sqli')}")
PY

echo "[wasm_release] Sonraki: bash scripts/competitive_suite.sh (REQUIRE_WASM_NATIVE=1)"
