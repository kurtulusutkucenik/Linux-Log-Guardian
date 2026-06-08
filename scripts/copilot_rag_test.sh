#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian 2>/dev/null || true
./log-guardian fixtures/tenant-sqli.lines --no-tui --json --no-ban --rules rules.conf 2>/dev/null || true

python3 scripts/copilot_rag_collect.py -o copilot-rag-context.json

python3 - <<'PY'
import json
from pathlib import Path
d = json.loads(Path("copilot-rag-context.json").read_text())
assert "evidence_lines" in d
assert "stats" in d
print(f"[OK] copilot_rag_test trees={d['stats'].get('tree_count')} alerts={d['stats'].get('alert_count')}")
PY
