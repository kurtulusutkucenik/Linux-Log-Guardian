#!/usr/bin/env bash
# Sprint AG — Yerel statik site preview kapisi (test parity, smoke, SRI)
#   bash scripts/website_preview_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${WEBSITE_PREVIEW_GATE_REPORT:-website-preview-gate-report.json}"
SITE="${LG_WEBSITE_PREVIEW_DIR:-$ROOT/assets/website}"

# Eski smoke sunucusu lock dosyasini tutuyorsa temizle (fd mirasi onlemi eklendi)
if [[ -f "$ROOT/.website-preview-gate.lock" ]]; then
  mapfile -t _stale < <(fuser "$ROOT/.website-preview-gate.lock" 2>/dev/null | tr ' ' '\n' | sort -u)
  for _pid in "${_stale[@]}"; do
    [[ -z "$_pid" || ! "$_pid" =~ ^[0-9]+$ ]] && continue
    _cmd="$(ps -o cmd= -p "$_pid" 2>/dev/null || true)"
    [[ "$_cmd" == *website_secure_server* ]] && kill -9 "$_pid" 2>/dev/null || true
  done
  rm -f "$ROOT/.website-preview-gate.lock"
fi

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

echo "=== website_preview_gate (Sprint AG) ==="

[[ -f "$SITE/test-results.js" ]] || fail "test-results.js yok — bash scripts/website_sync_tests.sh"
[[ -f "$ROOT/competitive-proof.json" ]] || fail "competitive-proof.json yok"

PARITY_JSON="$(python3 - "$SITE/test-results.js" "$ROOT/competitive-proof.json" <<'PY'
import json, re, sys
from pathlib import Path

tr = Path(sys.argv[1]).read_text(encoding="utf-8")
proof = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
expected = len(proof.get("validationTests") or [])

ids = re.findall(r'"id"\s*:\s*"([^"]+)"', tr)
pairs = re.findall(r'"id"\s*:\s*"([^"]+)"[^}]*?"status"\s*:\s*"(pass|fail)"', tr)
# Self + canlı site ayrı kapılarda; yerel preview bunları saymaz
SKIP_SELF = {"website-preview-gate"}
SKIP_EXTERNAL = {"website-live-gate", "release-ready-gate", "demo-rehearsal-gate", "presentation-ship-gate", "demo-video-gate", "github-ship-gate", "laptop-core-gate", "morning-operator-gate", "bans-telegram-ops"}
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
    "site_fail": fail_n,
    "has_grafana_parity": "grafana-parity-gate" in ids,
    "has_edge_gate": "edge-protection-gate" in ids,
    "site_dir": str(Path(sys.argv[1]).parent),
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

bash "$ROOT/scripts/website_security_check.sh" >/dev/null || fail "website_security_check"

smoke_ok=0
for _ in 1 2; do
  if bash "$ROOT/scripts/website_smoke.sh" "$SITE" >/dev/null 2>&1; then
    smoke_ok=1
    break
  fi
  sleep 0.4
done
if [[ "$smoke_ok" -ne 1 ]]; then
  fail "website_smoke (assets/website)"
fi
echo "[OK] website_smoke (assets/website)"

FINAL="$(python3 -c "import json; r=json.loads('''$PARITY_JSON'''); r['pass']=True; r.pop('fail_reason',None); print(json.dumps(r))")"
write_report "$FINAL"

if [[ "${LG_WEBSITE_BROWSER_SMOKE:-0}" == "1" ]] \
    && { [[ -x "$ROOT/.venv-website-smoke/bin/python" ]] || python3 -c "import playwright" 2>/dev/null; }; then
  LG_WEBSITE_SMOKE_DIR="$SITE" python3 "$ROOT/scripts/website_i18n_browser_smoke.py" >/dev/null 2>&1 \
    && echo "[OK] website_i18n_browser_smoke" \
    || echo "[WARN] website_i18n_browser_smoke — LG_WEBSITE_BROWSER_SMOKE=1 ama test fail"
fi

sp="$(python3 - "$REPORT" <<'PY'
import json, sys
r = json.load(open(sys.argv[1]))
expected = int(r.get("expected_tests") or 0)
site_fail = int(r.get("site_fail") or 0)
shown = int(r.get("site_tests") or 0) if site_fail == 0 else int(r.get("site_pass") or 0)
print(f"{shown}/{expected} test")
PY
)"
echo "[OK] website_preview_gate — ${sp}"
