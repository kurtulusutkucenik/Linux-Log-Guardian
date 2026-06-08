#!/usr/bin/env bash
# TLS prod stack baslat (dashboard + Caddy)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${JWT_SECRET:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    export JWT_SECRET
    JWT_SECRET=$(openssl rand -hex 32)
    echo "[tls_proxy_up] JWT_SECRET uretildi (bu shell icin export edildi)"
  else
    echo "[tls_proxy_up] JWT_SECRET gerekli (min 32 karakter)" >&2
    exit 1
  fi
fi

export DOMAIN="${DOMAIN:-localhost}"
export LOG_GUARDIAN_TIER="${LOG_GUARDIAN_TIER:-pro}"

echo "[tls_proxy_up] DOMAIN=$DOMAIN"

COMPOSE=(docker compose -f docker-compose.prod.yml)

# Eski/orphan container (isim cakismasi) — once temizle
"${COMPOSE[@]}" down --remove-orphans 2>/dev/null || true
for c in log-guardian-caddy log-guardian-dashboard; do
  if docker ps -a --format '{{.Names}}' | grep -qx "$c"; then
    echo "[tls_proxy_up] eski container kaldiriliyor: $c"
    docker rm -f "$c" >/dev/null 2>&1 || true
  fi
done

"${COMPOSE[@]}" up -d --build --force-recreate

echo ""
echo "HTTPS: https://${DOMAIN}:${HTTPS_PORT:-8443}/"
echo "Tier API: curl -k https://${DOMAIN}:${HTTPS_PORT:-8443}/api/tier"
echo "Durdurmak: docker compose -f docker-compose.prod.yml down"
