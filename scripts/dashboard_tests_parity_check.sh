#!/usr/bin/env bash
# competitive-proof validationTests id'leri <-> dashboard (static out.push + ops-gate dinamik)
#   bash scripts/dashboard_tests_parity_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROOF="${ROOT}/competitive-proof.json"
DASH="${ROOT}/dashboard/src/lib/validationTests.ts"
OPS="${ROOT}/ops-gate-report.json"

[[ -f "$PROOF" ]] || { echo "[dashboard_tests_parity] FAIL: competitive-proof.json yok" >&2; exit 1; }
[[ -f "$DASH" ]] || { echo "[dashboard_tests_parity] FAIL: validationTests.ts yok" >&2; exit 1; }

python3 - "$PROOF" "$DASH" "$OPS" <<'PY'
import json, re, sys
from pathlib import Path

proof = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
proof_ids = [t.get("id") for t in (proof.get("validationTests") or []) if t.get("id")]
proof_set = set(proof_ids)

dash = Path(sys.argv[2]).read_text(encoding="utf-8")
static_ids = set(re.findall(r'out\.push\(\{\s*\n\s*id:\s*\"([^\"]+)\"', dash))

# ops-gate-report.json gates[] — competitive-proof + alignTestsToProof (evaluateValidationTests ops dongusu kaldirildi)
ops_path = Path(sys.argv[3])
ops_ids: set[str] = set()
if ops_path.is_file():
    ops = json.loads(ops_path.read_text(encoding="utf-8"))
    ops_ids = {str(g["id"]) for g in (ops.get("gates") or []) if g.get("id")}

dash_set = static_ids | ops_ids

missing_in_dash = sorted(proof_set - dash_set)
extra_in_dash = sorted(dash_set - proof_set)

fail = False
if missing_in_dash:
    fail = True
    print("[dashboard_tests_parity] FAIL: competitive-proof'ta var, dashboard'da yok:", ", ".join(missing_in_dash))
if extra_in_dash:
    fail = True
    print("[dashboard_tests_parity] FAIL: dashboard'da var, competitive-proof'ta yok:", ", ".join(extra_in_dash))

if fail:
    print("[dashboard_tests_parity] Cozum: validationTests.ts out.push veya ops-gate-report gates[]")
    sys.exit(1)

print(
    f"[OK] dashboard_tests_parity — {len(proof_set)} id "
    f"(static={len(static_ids)} ops={len(ops_ids)})"
)
PY
