#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/compliance_export.sh

python3 - <<'PY'
import json
from pathlib import Path
p = Path("compliance-report.json")
d = json.loads(p.read_text())
assert d.get("securityControls"), "controls empty"
standards = {c["standard"] for c in d["securityControls"]}
for s in ("SOC2", "PCI-DSS", "KVKK"):
    assert s in standards, f"missing {s}"
kvkk = [c for c in d["securityControls"] if c["standard"] == "KVKK"]
assert len(kvkk) >= 3, f"KVKK controls {len(kvkk)}"
print(f"[OK] compliance_test {len(d['securityControls'])} controls KVKK={len(kvkk)}")
PY
