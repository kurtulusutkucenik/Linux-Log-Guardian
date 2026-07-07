#!/usr/bin/env bash
# Landing site preview parity kapisi — landing/lib/tests.ts <-> competitive-proof.json
#   bash scripts/website_preview_gate.sh
# Not: canli site kontrolu website_live_gate.sh; bu kapi yerel test-kart parity'sini dogrular.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${WEBSITE_PREVIEW_GATE_REPORT:-website-preview-gate-report.json}"
TESTS_SRC="${LG_WEBSITE_PREVIEW_TESTS:-$ROOT/landing/lib/tests.ts}"

write_report() {
  python3 - "$REPORT" "$@" <<'PY'
import json, datetime, sys
from pathlib import Path
p = Path(sys.argv[1])
data = json.loads(sys.argv[2])
data["date"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
data["script"] = "scripts/website_preview_gate.sh"
p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
PY
}

fail() {
  local reason="$1"
  local snap="{}"
  if [[ -f "$REPORT" ]]; then
    snap="$(python3 -c "import json; print(json.dumps(json.load(open('$REPORT'))))" 2>/dev/null || echo '{}')"
  fi
  write_report "$(python3 -c "
import json
r = json.loads('''$snap''')
r['pass'] = False
r['fail_reason'] = '''$reason'''
print(json.dumps(r))
")"
  echo "[website_preview_gate] FAIL: $reason" >&2
  exit 1
}

echo "=== website_preview_gate (landing parity) ==="

[[ -f "$TESTS_SRC" ]] || fail "landing/lib/tests.ts yok"
[[ -f "$ROOT/competitive-proof.json" ]] || fail "competitive-proof.json yok — python3 scripts/competitive_proof_build.py"

PARITY_JSON="$(python3 - "$TESTS_SRC" "$ROOT/competitive-proof.json" <<'PY'
import json, re, sys
from pathlib import Path

src = Path(sys.argv[1]).read_text(encoding="utf-8")
proof = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
expected = len(proof.get("validationTests") or [])

ids = re.findall(r'"id"\s*:\s*"([^"]+)"', src)
pairs = re.findall(r'"id"\s*:\s*"([^"]+)"[^}]*?"status"\s*:\s*"(pass|fail)"', src)
# Self + canli site ayri kapilarda; yerel preview bunlari saymaz
SKIP_SELF = {"website-preview-gate"}
SKIP_EXTERNAL = {"website-live-gate", "release-ready-gate", "demo-rehearsal-gate", "presentation-ship-gate", "demo-video-gate", "github-ship-gate", "laptop-core-gate", "morning-operator-gate", "bans-telegram-ops"}
pass_all = sum(1 for _, s in pairs if s == "pass")
pass_n = sum(1 for i, s in pairs if s == "pass" and i not in SKIP_SELF)
fail_n = sum(1 for i, s in pairs if s == "fail" and i not in SKIP_SELF | SKIP_EXTERNAL)
min_pass = expected - len(SKIP_SELF) - len(SKIP_EXTERNAL)

reasons = []
if len(ids) != expected:
    reasons.append(f"count_mismatch:site={len(ids)} proof={expected}")
if fail_n > 0:
    reasons.append(f"site_fail={fail_n}")
if pass_n < min_pass:
    reasons.append(f"site_pass={pass_n}")

ok = len(reasons) == 0
out = {
    "pass": ok,
    "expected_tests": expected,
    "site_tests": len(ids),
    "site_pass": pass_n,
    "site_pass_all": pass_all,
    "site_fail": fail_n,
    "has_grafana_parity": "grafana-parity-gate" in ids,
    "has_edge_gate": "edge-protection-gate" in ids,
    "site_dir": "landing/lib",
}
if not ok:
    out["fail_reason"] = "; ".join(reasons)
print(json.dumps(out))
if not ok:
    raise SystemExit(1)
PY
)" || {
  echo "$PARITY_JSON" 2>/dev/null || true
  fail "parity check"
}

echo "$PARITY_JSON"

# Landing static export ciktisi varsa dogrula (export edilmemisse parity yeterli)
if [[ -d "$ROOT/landing/out" ]]; then
  [[ -f "$ROOT/landing/out/index.html" ]] || fail "landing/out/index.html yok (export bozuk — bash scripts/website_landing_export.sh)"
  echo "[OK] landing/out export mevcut"
else
  echo "[SKIP] landing/out yok — parity yeterli (export: bash scripts/website_landing_export.sh)"
fi

FINAL="$(python3 -c "import json; r=json.loads('''$PARITY_JSON'''); r['pass']=True; r.pop('fail_reason',None); print(json.dumps(r))")"
write_report "$FINAL"

sp="$(python3 - "$REPORT" <<'PY'
import json, sys
r = json.load(open(sys.argv[1]))
expected = int(r.get("expected_tests") or 0)
site_fail = int(r.get("site_fail") or 0)
shown = int(r.get("site_pass_all") or r.get("site_tests") or 0)
if site_fail > 0:
    shown = int(r.get("site_pass_all") or r.get("site_pass") or 0)
print(f"{shown}/{expected} test")
PY
)"
echo "[OK] website_preview_gate — ${sp}"
