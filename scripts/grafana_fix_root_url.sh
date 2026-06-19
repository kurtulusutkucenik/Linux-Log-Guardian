#!/usr/bin/env bash
# Grafana alert Source/Silence linkleri :3002 olmali (:3000 = Next.js dashboard → 404).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_PORT="${GRAFANA_PORT:-3002}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
GRAFANA_ROOT_URL="${GRAFANA_ROOT_URL:-http://127.0.0.1:${GRAFANA_PORT}}"

fail() { echo "[grafana_fix_root_url] FAIL: $*" >&2; exit 1; }

command -v docker >/dev/null || fail "docker gerekli"

if ! docker ps -a --format '{{.Names}}' | grep -qx grafana-lg; then
  echo "[grafana_fix_root_url] grafana-lg yok — bash scripts/grafana_stack.sh"
  exit 0
fi

echo "[grafana_fix_root_url] grafana-lg yeniden olusturuluyor (ROOT_URL=${GRAFANA_ROOT_URL})..."
docker rm -f grafana-lg >/dev/null

docker run -d --name grafana-lg -p "127.0.0.1:${GRAFANA_PORT}:3000" \
  --add-host=host.docker.internal:host-gateway \
  -e GF_SECURITY_ADMIN_USER="$GRAFANA_USER" \
  -e GF_SECURITY_ADMIN_PASSWORD="$GRAFANA_PASS" \
  -e GF_SERVER_ROOT_URL="${GRAFANA_ROOT_URL}/" \
  grafana/grafana >/dev/null

for _ in $(seq 1 90); do
  if curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASS}" \
      "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASS}" \
  "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null \
  || fail "Grafana API ayakta degil"

export GRAFANA_URL="http://127.0.0.1:${GRAFANA_PORT}"
export GRAFANA_USER GRAFANA_PASS
export PROMETHEUS_URL="${PROMETHEUS_URL:-http://host.docker.internal:9090}"

echo "[grafana_fix_root_url] dashboard + alert yeniden yukleniyor..."
bash "$ROOT/scripts/grafana_provision.sh"

echo "[OK] Grafana alert linkleri artik ${GRAFANA_ROOT_URL}/alerting/... olmali"
echo "     Eski Telegram mesajlarindaki :3000 linkleri icin dashboard redirect:"
echo "     docker compose -f docker-compose.prod.yml up -d --build dashboard"
