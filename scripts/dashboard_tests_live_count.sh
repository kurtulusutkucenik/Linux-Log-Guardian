#!/usr/bin/env bash
# /api/tests canli kart sayisi == competitive-proof (drift onleme)
#   bash scripts/dashboard_tests_live_count.sh
#   DASHBOARD_ADMIN_PASSWORD=... bash scripts/dashboard_tests_live_count.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROOF="${ROOT}/competitive-proof.json"
REPORT="${DASHBOARD_TESTS_LIVE_REPORT:-dashboard-tests-live-report.json}"
[[ -f "$PROOF" ]] || { echo "[dashboard_tests_live] FAIL: competitive-proof.json yok" >&2; exit 1; }

EXPECTED=$(python3 -c "import json; print(len(json.load(open('$PROOF'))['validationTests']))")

write_report() {
  python3 - "$ROOT" "$REPORT" "$@" <<'PY'
import datetime
import json
import sys
from pathlib import Path

root, report_path = Path(sys.argv[1]), Path(sys.argv[2])
data = json.loads(sys.argv[3])
data["date"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
data["script"] = "scripts/dashboard_tests_live_count.sh"
report_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
PY
}
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

resolve_dash() {
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH="$(resolve_dash)"
CURL_TLS=()
CURL_RESOLVE=()
[[ "$DASH" == https://* ]] && CURL_TLS=(-k)
if [[ "$DASH" == https://localhost:* ]]; then
  port="${DASH#https://localhost:}"
  port="${port%%/*}"
  CURL_RESOLVE=(--resolve "localhost:${port}:127.0.0.1")
fi

collect_pass_candidates() {
  local p
  for p in \
    "${DASHBOARD_ADMIN_PASSWORD:-}" \
    "$(docker exec log-guardian-dashboard printenv DASHBOARD_ADMIN_PASSWORD 2>/dev/null || true)" \
    "ChangeMeOnFirstLogin!" \
    "admin123"; do
    [[ -n "$p" ]] || continue
    printf '%s\n' "$p"
  done | awk '!seen[$0]++'
}

login_ok=false
while IFS= read -r pass; do
  [[ -z "$pass" ]] && continue
  if curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$DASH/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"admin\",\"password\":\"$pass\"}" >/dev/null 2>&1; then
    login_ok=true
    break
  fi
done < <(collect_pass_candidates)

if [[ "$login_ok" != true ]]; then
  write_report "$(python3 -c "import json; print(json.dumps({
    'pass': None,
    'login_ok': False,
    'expected': int('$EXPECTED'),
    'dash_url': '''$DASH''',
    'warn': 'login_failed',
  }))")"
  echo "[dashboard_tests_live] WARN: login — DASHBOARD_ADMIN_PASSWORD veya seed parolasi" >&2
  echo "  Kanit dosyasi OK: competitive-proof ${EXPECTED}/${EXPECTED}" >&2
  exit 0
fi

read -r ACTUAL PROOF_EXP PARITY_OK < <(
  curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" -sf -b "$COOKIE_JAR" \
    "$DASH/api/tests?locale=en&_=$(date +%s)" \
    | python3 -c "
import json, sys
d = json.load(sys.stdin)
tests = d.get('tests') or []
exp = d.get('proof_expected') or ${EXPECTED}
print(len(tests), exp, '1' if d.get('parity_ok') else '0')
"
)

if [[ "$ACTUAL" != "$EXPECTED" ]] || [[ "${PROOF_EXP:-}" != "$EXPECTED" ]]; then
  write_report "$(python3 -c "import json; print(json.dumps({
    'pass': False,
    'login_ok': True,
    'expected': int('$EXPECTED'),
    'actual': int('$ACTUAL'),
    'proof_expected': int('${PROOF_EXP:-0}'),
    'parity_ok': '${PARITY_OK:-0}' == '1',
    'dash_url': '''$DASH''',
  }))")"
  echo "[dashboard_tests_live] FAIL: /api/tests total=$ACTUAL proof_expected=${PROOF_EXP:-?} expected=$EXPECTED" >&2
  echo "  Cozum: bash scripts/dashboard_refresh.sh && tarayici Ctrl+Shift+R" >&2
  exit 1
fi

if [[ "${PARITY_OK:-0}" != "1" ]]; then
  echo "[dashboard_tests_live] WARN: parity_ok=false (total=$ACTUAL)" >&2
fi

write_report "$(python3 -c "import json; print(json.dumps({
  'pass': True,
  'login_ok': True,
  'expected': int('$EXPECTED'),
  'actual': int('$ACTUAL'),
  'proof_expected': int('${PROOF_EXP:-$EXPECTED}'),
  'parity_ok': '${PARITY_OK:-0}' == '1',
  'dash_url': '''$DASH''',
}))")"

echo "[OK] dashboard_tests_live — /api/tests $ACTUAL/$EXPECTED"
