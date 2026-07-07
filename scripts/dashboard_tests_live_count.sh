#!/usr/bin/env bash
# /api/tests canli kart sayisi == competitive-proof (88 drift onleme)
#   bash scripts/dashboard_tests_live_count.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROOF="${ROOT}/competitive-proof.json"
[[ -f "$PROOF" ]] || { echo "[dashboard_tests_live] FAIL: competitive-proof.json yok" >&2; exit 1; }

EXPECTED=$(python3 -c "import json; print(len(json.load(open('$PROOF'))['validationTests']))")
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-ChangeMeOnFirstLogin!}"
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

curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$DASH/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"$ADMIN_PASS\"}" >/dev/null \
  || { echo "[dashboard_tests_live] FAIL: login" >&2; exit 1; }

ACTUAL=$(curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" -sf -b "$COOKIE_JAR" \
  "$DASH/api/tests?locale=en&_=$(date +%s)" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('summary',{}).get('total',0))")

if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "[dashboard_tests_live] FAIL: /api/tests total=$ACTUAL expected=$EXPECTED" >&2
  echo "  Cozum: bash scripts/dashboard_refresh.sh && tarayici Ctrl+Shift+R" >&2
  exit 1
fi

echo "[OK] dashboard_tests_live — /api/tests $ACTUAL/$EXPECTED"
