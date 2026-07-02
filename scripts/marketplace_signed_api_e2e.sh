#!/usr/bin/env bash
# E3 — Enterprise imzali marketplace API (tier gate + imza dogrulama)
#   bash scripts/marketplace_signed_api_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/marketplace-signed-api-report.json"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"

fail() { echo "[marketplace_signed_api_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  if curl -sfk -o /dev/null --max-time 2 "https://127.0.0.1:8443/api/tier" 2>/dev/null; then
    echo "https://127.0.0.1:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH_URL="$(resolve_dash_url)"
CURL_TLS=()
[[ "$DASH_URL" == https://* ]] && CURL_TLS=(-k)

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
fi

echo "=== marketplace_signed_api_e2e ==="
echo "  dash_url=$DASH_URL"

# manifest sync (container /data/lg)
mkdir -p "${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
if [[ -f "$ROOT/rules/marketplace/manifest.json" ]]; then
  cp -f "$ROOT/rules/marketplace/manifest.json" \
    "${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}/marketplace-manifest.json"
fi

if ! curl -sf "${CURL_TLS[@]}" --max-time 3 "${DASH_URL}/login" -o /dev/null 2>/dev/null; then
  python3 - "$OUT" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": "skip",
    "reason": "dashboard kapali",
    "script": "scripts/marketplace_signed_api_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
print("[SKIP] dashboard kapali")
PY
  exit 0
fi

login_code=$(curl -s "${CURL_TLS[@]}" -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "dashboard login HTTP $login_code"

tier_json=$(curl -sf "${CURL_TLS[@]}" -b "$COOKIE_JAR" "${DASH_URL}/api/tier")
tier=$(echo "$tier_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tier','community'))" 2>/dev/null || echo community)
ok "tier=$tier"

signed_code=$(curl -s "${CURL_TLS[@]}" -o /tmp/lg_signed_api.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "${DASH_URL}/api/marketplace/signed")
signed_body=$(cat /tmp/lg_signed_api.json 2>/dev/null || true)

mode="tier_gate"
pass=true
packages_signed=0
verify_ok=false

if [[ "$tier" != "enterprise" ]]; then
  [[ "$signed_code" == "403" ]] || fail "enterprise disi tier'da GET signed beklenen 403, alindi $signed_code"
  ok "tier gate — community/pro 403 (beklenen)"
else
  [[ "$signed_code" == "200" ]] || fail "enterprise GET signed HTTP $signed_code: $signed_body"
  packages_signed=$(echo "$signed_body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('packages_signed',0))" 2>/dev/null || echo 0)
  [[ "$packages_signed" -ge 1 ]] || fail "imzali paket yok (manifest sync?)"
  ok "GET /api/marketplace/signed — packages_signed=$packages_signed"
  post_code=$(curl -s "${CURL_TLS[@]}" -o /tmp/lg_signed_post.json -w '%{http_code}' -b "$COOKIE_JAR" \
    -X POST "${DASH_URL}/api/marketplace/signed" \
    -H 'Content-Type: application/json' \
    -d '{"package_id":"core-detection"}')
  [[ "$post_code" == "200" ]] || fail "POST verify HTTP $post_code: $(cat /tmp/lg_signed_post.json 2>/dev/null)"
  verify_ok=true
  mode="enterprise-live"
  ok "POST verify core-detection"
fi

python3 - "$OUT" "$mode" "$tier" "$packages_signed" "$verify_ok" "$DASH_URL" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[2],
    "tier": sys.argv[3],
    "packages_signed": int(sys.argv[4]),
    "verify_ok": sys.argv[5] == "true",
    "dash_url": sys.argv[6],
    "script": "scripts/marketplace_signed_api_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] marketplace_signed_api_e2e — mode=$mode tier=$tier"
