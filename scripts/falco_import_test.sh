#!/usr/bin/env bash
# Falco import v2 gate — macro expansion, min rule count
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MIN="${FALCO_MIN_GUARDIAN_RULES:-100}"
OUT="${FALCO_OUT:-rules/generated-falco-host.json}"

python3 -c "import yaml" 2>/dev/null || {
  echo "[ERR] PyYAML gerekli: pip install pyyaml" >&2
  exit 1
}

INPUTS=(rules/falco/)
[[ -d vendor/falco-rules/rules ]] && INPUTS+=(vendor/falco-rules/rules)

python3 scripts/falco_import.py "${INPUTS[@]}" -o "$OUT" --max 512 --verbose

count=$(python3 -c "import json; print(json.load(open('$OUT'))['count'])")
stats=$(python3 -c "import json; d=json.load(open('$OUT')); print(d.get('stats',{}))")

echo "[falco_import_test] count=$count stats=$stats"

if [[ "$count" -lt "$MIN" ]]; then
  echo "[FAIL] $count < $MIN guardian rules" >&2
  exit 1
fi

echo "[OK] falco_import v2 — $count rules (>=$MIN)"
