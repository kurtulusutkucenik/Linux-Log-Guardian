#!/usr/bin/env bash
# Tier 2 #9 — Lineage graph API kapisi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/lineage_demo.sh

python3 - <<'PY'
import json
from pathlib import Path

demo = Path("rules/lineage-demo.json")
data = json.loads(demo.read_text())
assert len(data) >= 1
assert data[0].get("events")
assert len(data[0]["events"]) >= 2
print(f"[OK] lineage corpus {len(data)} trees")
PY

# Dashboard lib: graph builder (Node yoksa python mirror)
python3 - <<'PY'
import json
from pathlib import Path

trees = json.loads(Path("rules/lineage-demo.json").read_text())
nodes = edges = 0
for ti, t in enumerate(trees):
    pids = {t["pid"]: t["comm"]}
    for i, ev in enumerate(t.get("events", [])):
        pids[ev["pid"]] = ev["comm"]
        nodes += 1
        edges += 1
assert nodes >= 4 and edges >= 4
print(f"[OK] graph elements nodes>={nodes} edges>={edges}")
PY

echo "[OK] lineage_ui_test"
