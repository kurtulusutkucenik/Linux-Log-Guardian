#!/usr/bin/env bash
# Parser deterministik fuzz — crash/segfault yok
#   bash scripts/parser_fuzz_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/parser-fuzz-report.json"

fail() { echo "[parser_fuzz_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== parser_fuzz_e2e ==="

make -s parser.o firewall.xff.o 2>/dev/null || make -s parser.o
make -s fuzz-test || fail "fuzz-test build/run"

runs="$(./tests/parser_fuzz_test 2>&1 | sed -n 's/.*runs=\([0-9]*\).*/\1/p' | tail -1)"
[[ -n "${runs:-}" && "${runs:-0}" -ge 500 ]] || fail "beklenen >=500 parse denemesi (got ${runs:-0})"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "deterministic",
    "parse_runs": int("${runs:-0}"),
    "mutations": 512,
    "corpus_lines": 18,
    "binary": "tests/parser_fuzz_test",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "parser_fuzz_e2e (runs=${runs})"
echo "[OK] parser_fuzz_e2e"
