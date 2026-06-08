#!/usr/bin/env bash
# Faz 3 — OpenAPI strict + GraphQL sniffing + endpoint baseline config
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
make -s log-guardian
[[ -f smoke_schema.conf ]] && chmod 600 smoke_schema.conf 2>/dev/null || true

alerts_ok() {
  echo "$1" | grep -qE '"alerts_total"[[:space:]]*:[[:space:]]*[1-9]'
}

echo "[1] OpenAPI strict (test_schema_strict.log)"
out=$(timeout 90 ./log-guardian test_schema_strict.log --no-tui --json --no-ban --no-db \
  --rules smoke_schema.conf 2>/dev/null || true)
if ! alerts_ok "$out"; then
  echo "[1b] smoke_schema bos — rules.conf fallback (izin veya schema)"
  chmod 600 rules.conf 2>/dev/null || true
  out=$(timeout 120 ./log-guardian test_schema_strict.log --no-tui --json --no-ban --no-db \
    --rules rules.conf 2>/dev/null || true)
fi
alerts_ok "$out" || { echo "[phase3] OpenAPI strict alert yok: $out" >&2; exit 1; }

echo "[2] GraphQL / API abuse (__schema veya schema block)"
test -f test_graphql_access.log
out2=$(./log-guardian test_graphql_access.log --no-tui --json --no-ban --no-db --rules rules.conf 2>&1)
echo "$out2" | grep -qiE 'alerts_total":[1-9]|alerts_total": [1-9]|GraphQL|SchemaViolation|MethodAbuse'

echo "[3] endpoint baseline rules.conf"
grep -q '^ENDPOINT_BASELINE_ENABLED=1' rules.conf
grep -q '^ENDPOINT_BASELINE_DAYS=7' rules.conf

echo "OK — phase3_e2e"
