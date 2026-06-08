#!/usr/bin/env bash
# BOLA/IDOR + GraphQL depth — OpenAPI strict v2 E2E
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

make -s log-guardian

CACHE="$ROOT/.cache"
mkdir -p "$CACHE"
RULES="$CACHE/bola_idor_rules.conf"
LOG="$ROOT/corpus/bola_idor.access"
pwd_kdf="pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504"

cat > "$RULES" <<EOF
ACCESS_PASSWORD_KDF=${pwd_kdf}
OPENAPI_SCHEMA=$ROOT/examples/openapi-v2.json
OPENAPI_STRICT=1
WAF_ENABLED=1
WAF_SCORE_BAN_THRESHOLD=5
AUTO_BAN=0
DB_ENABLED=0
METRICS_PORT=0
WEBHOOK_ENABLED=0
WASM_ENABLED=0
SQLI_SCORE=99
EOF
chmod 600 "$RULES"

fail() { echo "[bola_idor_e2e] FAIL: $*" >&2; exit 1; }

echo "[1] Path param ID traversal (same session token) — idor_score >= 80"
out=$(./log-guardian schema-check --rules "$RULES" --method GET --ip 10.8.0.50 \
  --path "/api/users/1?token=sess-bola-a" \
  --path "/api/users/2?token=sess-bola-a" \
  --path "/api/users/3?token=sess-bola-a" \
  --path "/api/users/4?token=sess-bola-a" \
  --path "/api/users/5?token=sess-bola-a" 2>/dev/null) || true
echo "$out" | grep -q '"idor_score":' || fail "schema-check cikti yok"
score=$(echo "$out" | python3 -c "import json,sys; print(json.load(sys.stdin).get('idor_score',0))" 2>/dev/null || echo 0)
[[ "$score" -ge 80 ]] || fail "idor_score=$score (beklenen >= 80)"

echo "[2] Farkli oturum — dusuk skor (ayni IP, farkli token)"
out2=$(./log-guardian schema-check --rules "$RULES" --method GET --ip 10.8.0.50 \
  --path "/api/users/10?token=sess-other-1" \
  --path "/api/users/11?token=sess-other-2" 2>/dev/null) || true
score2=$(echo "$out2" | python3 -c "import json,sys; print(json.load(sys.stdin).get('idor_score',0))" 2>/dev/null || echo 0)
[[ "$score2" -lt 80 ]] || fail "cross-session izolasyon: score=$score2"

echo "[3] Log replay — ardışık /api/users/N"
test -f "$LOG" || fail "corpus/bola_idor.access yok"
alerts=$(./log-guardian "$LOG" --no-tui --no-ban --no-db --rules "$RULES" -t 2 2>&1 | grep -cE 'ALARM|SchemaViolation|IDOR|BOLA' || true)
[[ "$alerts" -ge 1 ]] || fail "log replay alerts=$alerts"

echo "[4] GraphQL depth limit (WAF)"
GQL_LOG="$CACHE/graphql_depth.log"
python3 - "$GQL_LOG" <<'PY'
import sys
depth = "query {" + " user { " * 14 + " id }" * 14 + " }"
body = depth.replace("\\", "\\\\").replace('"', '\\"')
with open(sys.argv[1], "w", encoding="utf-8") as f:
    f.write(
        '10.8.0.60 - - [02/Jun/2026:10:00:01 +0300] "POST /graphql HTTP/1.1" 200 100 "-" "gql-abuse" "-" "'
        + body
        + '" "-" "api.local"\n'
    )
PY
out_g=$(./log-guardian "$GQL_LOG" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)
echo "$out_g" | grep -qE '"alerts_total"[[:space:]]*:[[:space:]]*[1-9]' || \
  ./log-guardian "$CACHE/graphql_depth.log" --no-tui --no-ban --no-db --rules "$RULES" 2>&1 | grep -qiE 'GraphQL|MethodAbuse|depth' || \
  fail "GraphQL depth alarm yok"

echo "[5] GraphQL introspection (__schema)"
echo '10.8.0.61 - - [02/Jun/2026:10:00:02 +0300] "POST /graphql HTTP/1.1" 200 50 "-" "curl" "-" "{\"query\":\"{ __schema { types { name } } }\"}" "-" "api.local"' > "$CACHE/graphql_intro.log"
out_i=$(./log-guardian "$CACHE/graphql_intro.log" --no-tui --json --no-ban --no-db --rules "$RULES" 2>/dev/null || true)
echo "$out_i" | grep -qE '"alerts_total"[[:space:]]*:[[:space:]]*[1-9]' || \
  fail "GraphQL introspection alarm yok"

echo "[OK] bola_idor_e2e idor_score=$score replay_alerts=$alerts"
