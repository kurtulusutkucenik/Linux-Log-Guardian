#!/usr/bin/env bash
# Dashboard veri sync + container rebuild (yeni test kartlari / API icin)
#   bash scripts/dashboard_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo dev-jwt-secret-min-32-chars!!)}"

echo "=== dashboard_refresh ==="
echo "[dashboard_refresh] Gate + status raporlari yenileniyor..."
# IPC/metrics hazir olsun — ops_gate oncesi (aksi halde post_install + live-pipeline kirmizi)
bash "$ROOT/scripts/guardian_status_export.sh"
bash "$ROOT/scripts/ops_gate_report.sh"
bash "$ROOT/scripts/website_preview_gate.sh" >/dev/null 2>&1 || true
python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
bash "$ROOT/scripts/sync_dashboard_data.sh"

echo "[dashboard_refresh] Dashboard image rebuild (--build zorunlu — kod degisince)"
docker compose -f docker-compose.prod.yml build dashboard

echo "[dashboard_refresh] Container yeniden baslatiliyor..."
docker compose -f docker-compose.prod.yml rm -sf dashboard 2>/dev/null || true
docker rm -f log-guardian-dashboard 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps dashboard

if [[ -f /etc/log-guardian/rules.conf ]]; then
  TOK=$(grep -E '^API_TOKEN=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$TOK" ]]; then
    export GUARDIAN_API_TOKEN="$TOK"
    docker compose -f docker-compose.prod.yml up -d ban-api-relay dashboard
    echo "[OK] GUARDIAN_API_TOKEN container'a verildi"
  fi
fi

if docker ps --format '{{.Names}}' | grep -qx log-guardian-caddy; then
  echo "[OK] Caddy ayakta — https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/tests"
else
  echo "[INFO] Caddy yok — bash scripts/tls_proxy_up.sh veya bash scripts/dashboard_stack.sh"
  echo "       Gecici: http://127.0.0.1:3000/tests"
fi

echo "[OK] dashboard_refresh tamam"
echo "  Hard refresh: Ctrl+Shift+R on /tests"
