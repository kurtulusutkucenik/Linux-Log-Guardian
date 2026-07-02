#!/usr/bin/env bash
# Sprint AK — Dokumantasyon tutarliligi kapisi (/tests 65. kart)
#   bash scripts/docs_consistency_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${DOCS_CONSISTENCY_GATE_REPORT:-docs-consistency-gate-report.json}"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'script': 'scripts/docs_consistency_gate.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[docs_consistency_gate] FAIL: $*" >&2
  exit 1
}

echo "=== docs_consistency_gate (Sprint AK) ==="

[[ -f "$ROOT/scripts/docs_consistency_check.sh" ]] || fail "docs_consistency_check.sh yok"

check_out=/tmp/docs_consistency_gate.$$.out
set +e
bash "$ROOT/scripts/docs_consistency_check.sh" >"$check_out" 2>&1
check_rc=$?
set -e

python3 - "$REPORT" "$ROOT" "$check_out" "$check_rc" <<'PY'
import json, datetime, re, sys
from pathlib import Path

report_path, root_s, out_path, check_rc_s = sys.argv[1:5]
root = Path(root_s)
check_rc = int(check_rc_s)
out_text = Path(out_path).read_text(encoding="utf-8", errors="replace")

ok_n = len(re.findall(r"^\[OK\]", out_text, re.M))
fail_n = len(re.findall(r"^\[docs_check\] FAIL:", out_text, re.M))

proof_path = root / "competitive-proof.json"
proof = json.loads(proof_path.read_text(encoding="utf-8")) if proof_path.is_file() else {}
tests = proof.get("validationTests") or []
proof_n = len(tests)
proof_pass = sum(1 for t in tests if t.get("status") == "pass")

hosting = (root / "docs/HOSTING_RUNBOOK_TR.md").read_text(encoding="utf-8") if (root / "docs/HOSTING_RUNBOOK_TR.md").is_file() else ""
esc = (root / "docs/ENTERPRISE_ESCALATION.md").read_text(encoding="utf-8") if (root / "docs/ENTERPRISE_ESCALATION.md").is_file() else ""

hosting_8b = bool(re.search(r"8b\.\s*Telegram|§8b", hosting)) and "telegram_soc_gate" in hosting
esc_hosting_link = "HOSTING_RUNBOOK_TR.md" in esc and bool(re.search(r"§8b|8b", esc))
support_64 = "75 kart" in (root / "docs/ENTERPRISE_SUPPORT.md").read_text(encoding="utf-8", errors="replace") if (root / "docs/ENTERPRISE_SUPPORT.md").is_file() else False

reasons = []
if check_rc != 0:
    reasons.append(f"docs_check_fail={fail_n}")
if proof_n < 64:
    reasons.append(f"proof_tests={proof_n}")
if not hosting_8b:
    reasons.append("hosting_8b_missing")
if not esc_hosting_link:
    reasons.append("escalation_hosting_link")
if not support_64:
    reasons.append("support_64_missing")

ok = len(reasons) == 0
out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": ok,
    "checks_ok": ok_n,
    "checks_fail": fail_n,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "hosting_8b": hosting_8b,
    "escalation_hosting_link": esc_hosting_link,
    "support_64_kart": support_64,
    "script": "scripts/docs_consistency_gate.sh",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2))
if not ok:
    sys.exit(1)
PY

cat "$check_out"
rm -f "$check_out"

echo "[OK] docs_consistency_gate — checks OK proof=$(python3 -c "import json; d=json.load(open('$REPORT')); print(f\"{d['proof_pass']}/{d['proof_tests']}\")")"
