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

bash "$ROOT/scripts/laptop_jwt_setup.sh"
echo "[dashboard_stack] TLS dashboard..."
bash "$ROOT/scripts/tls_proxy_up.sh"

if ! systemctl --user is-enabled log-guardian-laptop-stack.service &>/dev/null 2>&1; then
  echo "[dashboard_stack] Reboot kaliciligi..."
  bash "$ROOT/scripts/install_laptop_stack_boot.sh" 2>/dev/null || true
fi

echo "[dashboard_stack] Filo telemetri..."
bash "$ROOT/scripts/fleet_prune_stale_agents.sh" 2>/dev/null || true
bash "$ROOT/scripts/fleet_telemetry_push.sh" 2>/dev/null || true
bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg 2>/dev/null || true

saas_on=""
if [[ -r /etc/log-guardian/rules.conf ]]; then
  saas_on=$(grep -E '^SAAS_ENABLED=' /etc/log-guardian/rules.conf 2>/dev/null | cut -d= -f2 || true)
fi
if [[ "$saas_on" != "1" ]]; then
  echo "[dashboard_stack] UYARI: SAAS_ENABLED=0 — filo yalnizca keepalive ile Online kalir."
  echo "  Kalici cozum: sudo bash scripts/fix_fleet_telemetry.sh"
fi

echo ""
echo "[OK] dashboard_stack"
echo "  Dashboard:  https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/  (admin — parola: .env DASHBOARD_ADMIN_PASSWORD veya ChangeMeOnFirstLogin!)"
echo "  Grafana:    http://127.0.0.1:${GRAFANA_PORT:-3002}  (admin/admin)"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Metrikler:  curl http://127.0.0.1:9091/metrics  (relay :19091 Docker icin)"
echo ""
echo "  Smoke: bash scripts/grafana_smoke_test.sh"
echo "  Reboot: bash scripts/install_laptop_stack_boot.sh"
echo "  Durdur:"
echo "    docker compose -f docker-compose.prod.yml down"
echo "    docker rm -f prometheus-lg grafana-lg"
