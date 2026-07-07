#!/usr/bin/env bash
# Gate raporlarindaki proof_tests/proof_pass -> competitive-proof.json ile hizala
#   bash scripts/proof_meta_gates_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

python3 - "$ROOT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
proof_path = root / "competitive-proof.json"
if not proof_path.is_file():
    print("[proof_meta_gates_refresh] competitive-proof.json yok — atlandi")
    raise SystemExit(0)

tests = json.loads(proof_path.read_text(encoding="utf-8")).get("validationTests") or []
if not tests:
    raise SystemExit(0)

n = len(tests)
pn = sum(1 for t in tests if t.get("status") == "pass")

gates = sorted(root.glob("*-gate-report.json"))
gates += [root / "vm-sprint-proof.json"] if (root / "vm-sprint-proof.json").is_file() else []

max_old_pass = 0
for path in gates:
    if not path.is_file():
        continue
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        continue
    if "proof_pass" in data:
        max_old_pass = max(max_old_pass, int(data.get("proof_pass") or 0))

import os

if max_old_pass > pn and os.environ.get("FORCE_PROOF_META_SYNC") != "1":
    print(
        f"[FAIL] proof_meta_gates_refresh — competitive-proof {pn}/{n}, "
        f"gate raporlarinda max {max_old_pass}/{n} (dusurme engellendi)",
        file=sys.stderr,
    )
    print(
        "  Once: bash scripts/ops_gate_report.sh && python3 scripts/competitive_proof_build.py",
        file=sys.stderr,
    )
    print(
        "  Zorla: FORCE_PROOF_META_SYNC=1 bash scripts/proof_meta_gates_refresh.sh",
        file=sys.stderr,
    )
    raise SystemExit(1)

updated = 0
for path in gates:
    if not path.is_file():
        continue
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        continue
    if "proof_tests" not in data and "proof_pass" not in data:
        continue
    old = (data.get("proof_pass"), data.get("proof_tests"))
    data["proof_pass"] = pn
    data["proof_tests"] = n
    if old != (pn, n):
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"[proof_meta_gates_refresh] {path.name} {old[0]}/{old[1]} -> {pn}/{n}")
        updated += 1

print(f"[OK] proof_meta_gates_refresh — {updated} rapor guncellendi ({pn}/{n})")
PY
