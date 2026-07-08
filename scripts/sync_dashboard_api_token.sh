#!/usr/bin/env bash
# Dashboard container'a GUARDIAN_API_TOKEN verir (ban API)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

[[ -f "$CONF" ]] || { echo "[sync_dashboard_api_token] FAIL: $CONF yok" >&2; exit 1; }
TOK=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-)
[[ -n "$TOK" ]] || { echo "[sync_dashboard_api_token] FAIL: API_TOKEN yok — sudo bash scripts/ensure_api_security.sh" >&2; exit 1; }
MUT=$(grep -E '^API_MUTATION_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
[[ -n "$MUT" ]] || MUT="$TOK"

export GUARDIAN_API_TOKEN="$TOK"
export GUARDIAN_API_MUTATION_TOKEN="$MUT"
cd "$ROOT"
docker compose -f docker-compose.prod.yml up -d ban-api-relay dashboard caddy
echo "[OK] ban-api-relay (18090) + dashboard — GUARDIAN_API_TOKEN verildi"
if [[ "$MUT" != "$TOK" ]]; then
  echo "[OK] API split — GUARDIAN_API_MUTATION_TOKEN (ban/consult POST)"
fi
