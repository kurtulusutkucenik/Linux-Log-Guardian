#!/usr/bin/env bash
# Tier 2 #8 — OpenAPI strict v2 (body + header + rate limit)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian

CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
RULES="$CACHE/openapi_v2_rules.conf"
pwd_kdf="pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504"

cat > "$RULES" <<EOF
ACCESS_PASSWORD_KDF=${pwd_kdf}
OPENAPI_SCHEMA=examples/openapi-v2.json
OPENAPI_STRICT=1
WAF_ENABLED=1
WAF_SCORE_BAN_THRESHOLD=5
AUTO_BAN=0
DB_ENABLED=0
METRICS_PORT=0
WASM_ENABLED=0
SQLI_SCORE=99
EOF
chmod 600 "$RULES"

fail() { echo "[FAIL] $*" >&2; exit 1; }

# 1) Unknown endpoint → BLOCK (strict)
out=$(./log-guardian schema-check --rules "$RULES" \
  --method GET --path /api/unknown-endpoint 2>/dev/null) || true
echo "$out" | grep -q '"status":"BLOCK"' || fail "unknown endpoint strict: $out"

# 2) Missing header → BLOCK
out=$(./log-guardian schema-check --rules "$RULES" \
  --method POST --path /api/login \
  --body '{"username":"u","password":"p"}' 2>/dev/null) || true
echo "$out" | grep -q '"status":"BLOCK"' || fail "missing header"

# 3) Valid headers + body → PASS
out=$(./log-guardian schema-check --rules "$RULES" \
  --method POST --path /api/login \
  --body '{"username":"u","password":"p"}' \
  --headers '{"X-API-Key":"k","Content-Type":"application/json"}' 2>/dev/null) || true
echo "$out" | grep -q '"status":"PASS"' || fail "valid request: $out"

# 4) Unknown body field → BLOCK
out=$(./log-guardian schema-check --rules "$RULES" \
  --method POST --path /api/login \
  --body '{"username":"u","password":"p","injected":true}' \
  --headers '{"X-API-Key":"k","Content-Type":"application/json"}' 2>/dev/null) || true
echo "$out" | grep -q '"status":"BLOCK"' || fail "unknown body field"

# 5) Rate limit (5 rpm on /api/login) — tek process burst
out=$(./log-guardian schema-check --rules "$RULES" \
  --method POST --path /api/login \
  --body '{"username":"u","password":"p"}' \
  --headers '{"X-API-Key":"k","Content-Type":"application/json"}' \
  --ip "10.9.0.1" --burst 7 2>/dev/null) || true
echo "$out" | grep -q 'Rate limit' || fail "rate limit: $out"

# 6) Log replay — schema violation alarm
LOG="$CACHE/openapi_v2_attack.log"
cat > "$LOG" <<'LOGEOF'
10.9.0.2 - - [02/Jun/2026:10:00:01 +0300] "POST /api/login HTTP/1.1" 400 100 "-" "curl/7" "-" "{\"username\":\"a\",\"password\":\"b\",\"evil\":1}" "X-API-Key=secret; Content-Type=application/json" "api.local"
LOGEOF

alarms=$(./log-guardian "$LOG" --no-tui --no-ban --no-db --rules "$RULES" -t 2 2>&1 | grep -c ALARM || true)
[[ "$alarms" -ge 1 ]] || fail "log replay alerts=$alarms"

echo "[OK] openapi_v2_test endpoints=$(./log-guardian schema-check --rules "$RULES" --stats 2>/dev/null | grep -o '[0-9]*' | head -1 || echo '?')"
