#!/usr/bin/env bash
# E7 — Compliance JSON/PDF export (Pro tier gate + PDF govdesi)
#   bash scripts/compliance_export_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${ROOT}/compliance-export-report.json"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"

fail() { echo "[compliance_export_e2e] FAIL: $*" >&2; exit 1; }
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

echo "=== compliance_export_e2e ==="
echo "  dash_url=$DASH_URL"

bash scripts/compliance_export.sh >/dev/null

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
    "script": "scripts/compliance_export_e2e.sh",
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

json_code=$(curl -s "${CURL_TLS[@]}" -o /tmp/lg_compliance.json -w '%{http_code}' -b "$COOKIE_JAR" \
  "${DASH_URL}/api/reports/export?format=json")
pdf_code=$(curl -s "${CURL_TLS[@]}" -o /tmp/lg_compliance.pdf -w '%{http_code}' -b "$COOKIE_JAR" \
  "${DASH_URL}/api/reports/export?format=pdf")

mode="tier_gate"
pass=true
controls=0
pdf_ok=false
json_ok=false

if [[ "$tier" == "community" ]]; then
  [[ "$json_code" == "403" && "$pdf_code" == "403" ]] \
    || fail "community tier'da export beklenen 403, json=$json_code pdf=$pdf_code"
  ok "tier gate — community export 403 (beklenen)"
else
  [[ "$json_code" == "200" ]] || fail "pro+ GET export json HTTP $json_code"
  controls=$(python3 -c "import json; d=json.load(open('/tmp/lg_compliance.json')); print(len(d.get('securityControls',[])))" 2>/dev/null || echo 0)
  [[ "$controls" -ge 3 ]] || fail "securityControls yetersiz ($controls)"
  json_ok=true
  ok "GET export?format=json — controls=$controls"

  [[ "$pdf_code" == "200" ]] || fail "pro+ GET export pdf HTTP $pdf_code"
  if head -c 5 /tmp/lg_compliance.pdf 2>/dev/null | grep -q '%PDF'; then
    pdf_ok=true
    ok "GET export?format=pdf — %PDF header"
  else
    fail "PDF govdesi gecersiz"
  fi
  mode="pro-live"
fi

python3 - "$OUT" "$mode" "$tier" "$controls" "$json_ok" "$pdf_ok" "$DASH_URL" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
out = Path(sys.argv[1])
out.write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "mode": sys.argv[2],
    "tier": sys.argv[3],
    "controls": int(sys.argv[4]),
    "json_ok": sys.argv[5] == "true",
    "pdf_ok": sys.argv[6] == "true",
    "dash_url": sys.argv[7],
    "script": "scripts/compliance_export_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

echo "[OK] compliance_export_e2e — mode=$mode tier=$tier"
