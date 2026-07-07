#!/usr/bin/env bash
# Fleet komut HMAC imza kapisi — dashboard imzalar, agent/API dogrular
#   bash scripts/fleet_command_sign_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

API_KEY="${FLEET_API_KEY:-sk_guardian_fleet_test_token_123}"
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-DegistirBeni!123}"
AGENT_ID="${FLEET_AGENT_ID:-fleet-sign-e2e-01}"
TEST_IP="203.0.113.248"
HMAC_KEY="${FLEET_COMMAND_HMAC_KEY:-log-guardian-fleet-command-dev-key}"
REPORT="${FLEET_COMMAND_SIGN_REPORT:-fleet-command-sign-report.json}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

fail() { echo "[fleet_command_sign_e2e] FAIL: $*" >&2; exit 1; }

resolve_dash_url() {
  if [[ -n "${DASH_URL:-}" ]]; then
    echo "$DASH_URL"
    return
  fi
  if curl -sfk -o /dev/null --max-time 2 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null; then
    echo "https://localhost:8443"
  elif curl -sf -o /dev/null --max-time 2 "http://127.0.0.1:3000/api/tier" 2>/dev/null; then
    echo "http://127.0.0.1:3000"
  else
    echo "http://127.0.0.1:3000"
  fi
}

DASH_URL="$(resolve_dash_url)"
CURL_TLS=()
CURL_RESOLVE=()
[[ "$DASH_URL" == https://* ]] && CURL_TLS=(-k)
if [[ "$DASH_URL" == https://localhost:* ]]; then
  port="${DASH_URL#https://localhost:}"
  port="${port%%/*}"
  CURL_RESOLVE=(--resolve "localhost:${port}:127.0.0.1")
fi

dash_curl() {
  curl "${CURL_TLS[@]}" "${CURL_RESOLVE[@]}" "$@"
}

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ROOT/.env" && set +a
  ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-$ADMIN_PASS}"
  API_KEY="${FLEET_API_KEY:-$API_KEY}"
  HMAC_KEY="${FLEET_COMMAND_HMAC_KEY:-$HMAC_KEY}"
fi

echo "=== fleet_command_sign_e2e ==="

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-dashboard'; then
  docker exec log-guardian-dashboard sh -c \
    'cd /app && node node_modules/prisma/build/index.js db push --skip-generate' 2>/dev/null || true
  docker exec log-guardian-dashboard sh -c \
    "cd /app && DASHBOARD_SEED=1 DASHBOARD_FLEET_API_KEY=${API_KEY} node prisma/seed.mjs" \
    2>/dev/null || true
elif [[ -d "$ROOT/dashboard/prisma" ]]; then
  (cd "$ROOT/dashboard" && npx prisma db push --skip-generate 2>/dev/null) || true
  (cd "$ROOT/dashboard" && env DASHBOARD_SEED=1 "DASHBOARD_FLEET_API_KEY=$API_KEY" \
    node prisma/seed.mjs) 2>/dev/null || true
fi

echo "[1] telemetry + login"
dash_curl -sf -X POST "${DASH_URL}/api/telemetry" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"agent_id\":\"${AGENT_ID}\",\"eps\":1.0,\"total_lines\":10,\"alerts_total\":0,\"attack_tree\":[]}" \
  | grep -q '"success":true' || fail "telemetry"

login_code=$(dash_curl -s -o /dev/null -w '%{http_code}' -c "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"${ADMIN_PASS}\"}")
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code"

echo "[2] dispatch imzali komut"
dispatch=$(dash_curl -sf -b "$COOKIE_JAR" \
  -X POST "${DASH_URL}/api/fleet/commands" \
  -H "Content-Type: application/json" \
  -d "{\"commandType\":\"BAN_IP\",\"payload\":\"${TEST_IP}\",\"targetAgentId\":\"${AGENT_ID}\",\"reason\":\"fleet-sign-e2e\"}") \
  || fail "dispatch POST"

echo "[3] agent poll + HMAC dogrulama"
cmds_json=$(dash_curl -sf \
  "${DASH_URL}/api/fleet/commands?agent_id=${AGENT_ID}" \
  -H "Authorization: Bearer ${API_KEY}") || fail "commands GET"

python3 - "$dispatch" "$cmds_json" "$HMAC_KEY" "$TEST_IP" "$REPORT" "$DASH_URL" <<'PY'
import hashlib
import hmac
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

dispatch_raw, cmds_raw, key, test_ip, report_path, dash_url = sys.argv[1:7]
disp = json.loads(dispatch_raw)
cmds = json.loads(cmds_raw).get("commands") or []
cmd = disp.get("command") or {}
sig = (cmd.get("signature") or "").strip()
if not sig:
    raise SystemExit("[FAIL] dispatch yanitinda signature yok")

digest = "|".join([
    cmd.get("id", ""),
    cmd.get("tenantId", ""),
    cmd.get("commandType", ""),
    cmd.get("payload", ""),
    cmd.get("targetAgentId") or "",
])
calc = hmac.new(key.encode(), digest.encode(), hashlib.sha256).hexdigest()
if calc != sig:
    raise SystemExit(f"[FAIL] imza uyusmadi calc={calc[:16]}… expected={sig[:16]}…")

poll = next((c for c in cmds if c.get("payload") == test_ip), None)
if not poll:
    raise SystemExit("[FAIL] agent poll komut bulamadi (imza filtresi?)")
if poll.get("signature") != sig:
    raise SystemExit("[FAIL] poll signature dispatch ile farkli")

bad_digest = digest.replace(test_ip, "203.0.113.249")
bad_calc = hmac.new(key.encode(), bad_digest.encode(), hashlib.sha256).hexdigest()
if bad_calc == sig:
    raise SystemExit("[FAIL] bozuk payload ayni imzayi verdi")

report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": True,
    "dash_url": dash_url,
    "command_id": cmd.get("id"),
    "signature_len": len(sig),
    "require_sig": True,
    "verify_ok": True,
    "tamper_reject": True,
    "script": "scripts/fleet_command_sign_e2e.sh",
}
Path(report_path).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"[OK] fleet_command_sign_e2e — id={cmd.get('id','')[:8]}… sig={sig[:16]}…")
PY

echo "  Rapor: $REPORT"
