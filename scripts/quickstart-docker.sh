#!/usr/bin/env bash
# Dashboard tek komut — dev (HTTP) veya prod TLS
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-dev}"

if [[ "$MODE" == "prod" || "$MODE" == "tls" ]]; then
  bash scripts/laptop_jwt_setup.sh
  exec bash scripts/tls_proxy_up.sh
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
if [[ -z "${JWT_SECRET:-}" ]]; then
  export JWT_SECRET
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  echo "[quickstart] JWT_SECRET uretildi (dev shell — kalici: bash scripts/laptop_jwt_setup.sh)"
fi

echo "[1/2] Dashboard image build..."
docker compose build dashboard

echo "[2/2] Dashboard: http://localhost:3000"
echo "      Ilk kurulum icin:"
echo "        cd dashboard && DASHBOARD_SEED=1 DASHBOARD_ADMIN_PASSWORD='ChangeMeOnFirstLogin!' node prisma/seed.mjs"
echo "      Prod TLS: bash scripts/quickstart-docker.sh prod"
docker compose up dashboard
