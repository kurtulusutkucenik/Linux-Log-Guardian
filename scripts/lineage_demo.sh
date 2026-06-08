#!/usr/bin/env bash
# Lineage UI demo — attack_tree.json + lineage-demo kopyasi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DEST="${LINEAGE_DEMO_PATH:-attack_tree.json}"
SRC="rules/lineage-demo.json"

if [[ ! -f "$SRC" ]]; then
  echo "[ERR] $SRC yok" >&2
  exit 1
fi

cp "$SRC" "$DEST"
echo "[lineage_demo] -> $DEST ($(python3 -c "import json; print(len(json.load(open('$DEST'))))") trees)"

make -s log-guardian 2>/dev/null || true
./log-guardian lineage-stats --path "$DEST" 2>/dev/null | head -1 || true
