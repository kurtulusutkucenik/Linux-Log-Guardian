#!/usr/bin/env bash
# ban-policy-audit.jsonl — policy karar izi + schema
#   bash scripts/ban_policy_audit_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${ROOT}/ban-policy-audit-report.json"

fail() { echo "[ban_policy_audit_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== ban_policy_audit_e2e ==="

out="$(bash "$ROOT/scripts/ban_policy_test.sh" 2>&1)" || fail "ban_policy_test"
echo "$out"
echo "$out" | grep -q '\[OK\] ban_policy_test' || fail "ban_policy_test OK yok"

AUDIT="$ROOT/.cache/ban-policy-audit.jsonl"
[[ -f "$AUDIT" ]] || fail "audit dosyasi yok: $AUDIT"

python3 - "$AUDIT" "$REPORT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

audit_path, report_path = sys.argv[1], sys.argv[2]
lines = [json.loads(x) for x in Path(audit_path).read_text(encoding="utf-8").splitlines() if x.strip()]
if not lines:
    raise SystemExit("audit jsonl bos")

required = {"ts", "ip", "decision", "risk_score"}
for i, row in enumerate(lines):
    missing = required - set(row.keys())
    if missing:
        raise SystemExit(f"satir {i} eksik alan: {missing}")

last = lines[-1]
decision = last.get("decision", "")
allowed = {
    "ban", "force_crit", "force_waf", "force_apt",
    "skip_risk", "skip_fp_trust", "policy_off",
}
if decision not in allowed:
    raise SystemExit(f"gecersiz decision: {decision}")

report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": True,
    "audit_lines": len(lines),
    "last_decision": decision,
    "last_risk": last.get("risk_score"),
    "audit_path": audit_path,
    "openapi_strict_checked": False,
}
Path(report_path).write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"decision={decision} lines={len(lines)}")
PY

strict_out="$(bash "$ROOT/scripts/openapi_strict_profile_check.sh" 2>&1)" || true
echo "$strict_out"
if echo "$strict_out" | grep -q '\[OK\] openapi_strict_profile_check'; then
  python3 - "$REPORT" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
d = json.loads(p.read_text())
d["openapi_strict_checked"] = True
p.write_text(json.dumps(d, indent=2) + "\n")
PY
fi

ok "ban_policy_audit_e2e (decision=$(python3 -c "import json; print(json.load(open('$REPORT'))['last_decision'])"))"
echo "[OK] ban_policy_audit_e2e"
