#!/usr/bin/env bash
# Dashboard UI + Prometheus + Grafana — tek komut (Canli operasyon grafikleri icin)
#   bash scripts/dashboard_stack.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if ! systemctl is-active log-guardian >/dev/null 2>&1; then
  echo "[dashboard_stack] UYARI: log-guardian inactive — metrikler bos olabilir"
  echo "  sudo systemctl start log-guardian log-guardian-daemon"
fi

echo "=== dashboard_stack ==="

bash "$ROOT/scripts/sync_dashboard_data.sh"

echo "[dashboard_stack] Prometheus + Grafana..."
bash "$ROOT/scripts/grafana_stack.sh"

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
echo "[dashboard_stack] TLS dashboard..."
bash "$ROOT/scripts/tls_proxy_up.sh"

echo ""
echo "[OK] dashboard_stack"
echo "  Dashboard:  https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/  (admin / ChangeMeOnFirstLogin!)"
echo "  Grafana:    http://127.0.0.1:${GRAFANA_PORT:-3002}  (admin/admin)"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Metrikler:  curl http://127.0.0.1:9091/metrics  (relay :19091 Docker icin)"
echo ""
echo "  Smoke: bash scripts/grafana_smoke_test.sh"
echo "  Durdur:"
echo "    docker compose -f docker-compose.prod.yml down"
echo "    docker rm -f prometheus-lg grafana-lg"
