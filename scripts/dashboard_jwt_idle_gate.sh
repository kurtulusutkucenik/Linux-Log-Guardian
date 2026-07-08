#!/usr/bin/env bash
# Dashboard JWT idle timeout — kaynak + opsiyonel env dogrulama (isleyisi bozmaz)
#   bash scripts/dashboard_jwt_idle_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${DASHBOARD_JWT_IDLE_GATE_REPORT:-dashboard-jwt-idle-gate-report.json}"

fail_reason=""
pass=true

echo "=== dashboard_jwt_idle_gate ==="

grep -q 'DASHBOARD_JWT_IDLE_MIN' "$ROOT/dashboard/src/middleware.ts" \
  || { pass=false; fail_reason="middleware idle yok"; }

grep -q 'payload.iat' "$ROOT/dashboard/src/middleware.ts" \
  || { pass=false; fail_reason="middleware iat kontrolu yok"; }

idle_min="${DASHBOARD_JWT_IDLE_MIN:-}"
if [[ -z "$idle_min" ]] && docker inspect log-guardian-dashboard >/dev/null 2>&1; then
  idle_min=$(docker inspect log-guardian-dashboard 2>/dev/null \
    | python3 -c "import json,sys; d=json.load(sys.stdin)[0]; print(next((e.split('=',1)[1] for e in d.get('Config',{}).get('Env',[]) if e.startswith('DASHBOARD_JWT_IDLE_MIN=')), '0'))" 2>/dev/null || echo "0")
fi
idle_min="${idle_min:-0}"

if [[ "$idle_min" == "0" ]]; then
  echo "[OK] JWT idle kapali (demo/laptop — DASHBOARD_JWT_IDLE_MIN=0)"
  mode="off"
elif [[ "$idle_min" -gt 0 ]] 2>/dev/null; then
  echo "[OK] JWT idle=${idle_min}dk (internet-facing onerilir)"
  mode="on"
else
  pass=false
  fail_reason="gecersiz DASHBOARD_JWT_IDLE_MIN=$idle_min"
  mode="invalid"
fi

python3 - "$REPORT" "$pass" "$fail_reason" "$idle_min" "$mode" <<'PY'
import json, datetime, sys
from pathlib import Path

report = Path(sys.argv[1])
doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": sys.argv[2] == "true",
    "fail_reason": sys.argv[3] or None,
    "idle_min": int(sys.argv[4]) if sys.argv[4].isdigit() else sys.argv[4],
    "mode": sys.argv[5],
    "hint": "internet-facing: DASHBOARD_JWT_IDLE_MIN=480 docker compose up -d dashboard",
    "script": "scripts/dashboard_jwt_idle_gate.sh",
}
report.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$pass" == true ]]; then
  echo "[OK] dashboard_jwt_idle_gate"
  exit 0
fi
echo "[FAIL] dashboard_jwt_idle_gate — $fail_reason" >&2
exit 1
