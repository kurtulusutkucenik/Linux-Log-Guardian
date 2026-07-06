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

out="$(./tests/parser_fuzz_test 2>&1 | tail -1)"
runs="$(printf '%s\n' "$out" | sed -n 's/.*runs=\([0-9]*\).*/\1/p')"
corpus="$(printf '%s\n' "$out" | sed -n 's/.*corpus=\([0-9]*\).*/\1/p')"
file_samples="$(printf '%s\n' "$out" | sed -n 's/.*file=\([0-9]*\).*/\1/p')"
mutations="$(printf '%s\n' "$out" | sed -n 's/.*mutations=\([0-9]*\).*/\1/p')"

[[ -n "${runs:-}" && "${runs:-0}" -ge 500 ]] || fail "beklenen >=500 parse denemesi (got ${runs:-0})"
[[ -n "${corpus:-}" && "${corpus:-0}" -ge 18 ]] || fail "corpus satiri yetersiz (got ${corpus:-0})"
[[ -n "${mutations:-}" && "${mutations:-0}" -ge 512 ]] || fail "mutasyon yetersiz (got ${mutations:-0})"

python3 - <<PY
import json
from datetime import datetime, timezone
from pathlib import Path
report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "mode": "deterministic",
    "parse_runs": int("${runs:-0}"),
    "mutations": int("${mutations:-512}"),
    "corpus_lines": int("${corpus:-0}"),
    "file_samples": int("${file_samples:-0}"),
    "binary": "tests/parser_fuzz_test",
}
Path("${REPORT}").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY

ok "parser_fuzz_e2e (runs=${runs}, corpus=${corpus}, file=${file_samples:-0})"
echo "[OK] parser_fuzz_e2e"
