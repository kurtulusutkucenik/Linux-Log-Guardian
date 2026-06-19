#!/usr/bin/env bash
# Dashboard JWT_SECRET kalici .env — her restart'ta oturum dusmesin
#   bash scripts/laptop_jwt_setup.sh
#   DASHBOARD_ADMIN_PASSWORD='YeniParola' bash scripts/laptop_jwt_setup.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# .deb kurulumu: docker-compose repo'da kalir
REPO_ROOT="$ROOT"
if [[ ! -f "$REPO_ROOT/docker-compose.prod.yml" ]]; then
  for try in "${LG_REPO:-}" "$HOME/Masaüstü/Linux Log Guardian"; do
    [[ -n "$try" && -f "$try/docker-compose.prod.yml" ]] && REPO_ROOT="$try" && break
  done
fi
ENV_FILE="$REPO_ROOT/.env"

cd "$REPO_ROOT"

if [[ -f "$ENV_FILE" ]] && grep -qE '^JWT_SECRET=[a-f0-9]{32,}' "$ENV_FILE" 2>/dev/null; then
  JWT_SECRET=$(grep -E '^JWT_SECRET=' "$ENV_FILE" | tail -1 | cut -d= -f2-)
  echo "[laptop_jwt_setup] mevcut JWT_SECRET kullaniliyor (.env)"
else
  JWT_SECRET=$(openssl rand -hex 32)
  touch "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  if grep -q '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$ENV_FILE"
  else
    echo "JWT_SECRET=${JWT_SECRET}" >> "$ENV_FILE"
  fi
  echo "[OK] JWT_SECRET uretildi -> $ENV_FILE"
fi

if [[ -n "${DASHBOARD_ADMIN_PASSWORD:-}" ]]; then
  if grep -q '^DASHBOARD_ADMIN_PASSWORD=' "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^DASHBOARD_ADMIN_PASSWORD=.*|DASHBOARD_ADMIN_PASSWORD=${DASHBOARD_ADMIN_PASSWORD}|" "$ENV_FILE"
  else
    echo "DASHBOARD_ADMIN_PASSWORD=${DASHBOARD_ADMIN_PASSWORD}" >> "$ENV_FILE"
  fi
  echo "[OK] DASHBOARD_ADMIN_PASSWORD .env'e yazildi"
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
export JWT_SECRET

echo "[laptop_jwt_setup] dashboard yeniden baslatiliyor..."
docker compose -f docker-compose.prod.yml up -d --build dashboard caddy ban-api-relay metrics-relay 2>/dev/null \
  || bash "$REPO_ROOT/scripts/tls_proxy_up.sh"

echo ""
echo "[OK] laptop_jwt_setup"
echo "  JWT: .env (gitignore — commit etmeyin)"
echo "  Giris: admin / .env icindeki DASHBOARD_ADMIN_PASSWORD (yoksa ChangeMeOnFirstLogin!)"
echo "  Kontrol: bash scripts/laptop_harden_check.sh"
