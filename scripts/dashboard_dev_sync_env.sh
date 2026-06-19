#!/usr/bin/env bash
# npm run dev oncesi: kok .env -> dashboard/.env.local + admin seed
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DASH="$ROOT/dashboard"
LOCAL="$DASH/.env.local"

[[ -f "$ROOT/.env" ]] && set -a && source "$ROOT/.env" && set +a

JWT="${JWT_SECRET:-}"
ADMIN_PASS="${DASHBOARD_ADMIN_PASSWORD:-}"

{
  echo "# dashboard_dev_sync_env.sh — otomatik, commit etmeyin"
  echo "DATABASE_URL=\"file:./dev.db\""
  echo "GUARDIAN_API_URL=http://127.0.0.1:8080"
  echo "LOG_GUARDIAN_TIER=pro"
  echo "PROMETHEUS_URL=http://127.0.0.1:9090"
  echo "GUARDIAN_METRICS_URL=http://127.0.0.1:9091/metrics"
  echo "NEXT_PUBLIC_GRAFANA_EMBED_URL=http://127.0.0.1:3002/d/log-guardian-01/linux-log-guardian?orgId=1&refresh=15s&kiosk&theme=dark&var-tenant=default"
  if [[ -n "$JWT" && ${#JWT} -ge 32 ]]; then
    echo "JWT_SECRET=$JWT"
  fi
  if [[ -n "$ADMIN_PASS" ]]; then
    echo "DASHBOARD_ADMIN_PASSWORD=$ADMIN_PASS"
    echo "NEXT_PUBLIC_DASHBOARD_DEV_PASS_HINT=.env DASHBOARD_ADMIN_PASSWORD"
  else
    echo "NEXT_PUBLIC_DASHBOARD_DEV_PASS_HINT=ChangeMeOnFirstLogin!"
  fi
} >"$LOCAL"

chmod 600 "$LOCAL" 2>/dev/null || true

if [[ -d "$DASH/prisma" ]]; then
  (
    cd "$DASH"
    npx prisma db push --skip-generate >/dev/null 2>&1 || true
    if [[ -n "$ADMIN_PASS" ]]; then
      DASHBOARD_SEED=1 DASHBOARD_ADMIN_PASSWORD="$ADMIN_PASS" node prisma/seed.mjs
    else
      DASHBOARD_SEED=1 node prisma/seed.mjs
    fi
  ) || true
fi

echo "[dashboard_dev_sync] .env.local guncellendi (port ${DASHBOARD_DEV_PORT:-3001})"
