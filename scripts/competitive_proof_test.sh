#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/competitive_proof.sh

python3 - <<'PY'
import json
from pathlib import Path

p = Path("competitive-proof.json")
d = json.loads(p.read_text())
assert d.get("scorecard"), "scorecard bos"
assert d["sections"].get("codeStats"), "codeStats yok"
print(f"[OK] competitive_proof_test pass={d.get('pass')} rows={len(d['scorecard'])}")
PY

if [[ -f competitive-proof.pdf ]]; then
  sz=$(wc -c < competitive-proof.pdf)
  echo "[OK] competitive-proof.pdf ${sz} bytes"
fi
