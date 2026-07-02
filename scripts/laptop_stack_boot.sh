#!/usr/bin/env bash
# Laptop acilisinda dashboard + Prometheus/Grafana — idempotent, sudo gerektirmez
#   bash scripts/laptop_stack_boot.sh
# Kalici: bash scripts/install_laptop_stack_boot.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

wait_docker() {
  for _ in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "[laptop_stack_boot] FAIL: docker hazir degil" >&2
  exit 1
}

need_grafana_stack() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg || return 0
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx grafana-lg || return 0
  return 1
}

need_tls_stack() {
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-dashboard || return 0
  docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy || return 0
  return 1
}

echo "[laptop_stack_boot] docker bekleniyor..."
wait_docker

if ! systemctl is-active log-guardian >/dev/null 2>&1; then
  echo "[laptop_stack_boot] UYARI: log-guardian inactive — sudo systemctl start log-guardian log-guardian-daemon"
fi

if need_grafana_stack; then
  echo "[laptop_stack_boot] Prometheus + Grafana baslatiliyor..."
  bash "$ROOT/scripts/grafana_stack.sh"
else
  echo "[laptop_stack_boot] prometheus-lg + grafana-lg ayakta"
fi

if [[ ! -f "$ROOT/.env" ]] || ! grep -q '^JWT_SECRET=' "$ROOT/.env" 2>/dev/null; then
  echo "[laptop_stack_boot] JWT yok — laptop_jwt_setup..."
  bash "$ROOT/scripts/laptop_jwt_setup.sh"
fi

if need_tls_stack; then
  echo "[laptop_stack_boot] TLS dashboard baslatiliyor..."
  bash "$ROOT/scripts/tls_proxy_up.sh"
else
  echo "[laptop_stack_boot] log-guardian-dashboard + caddy ayakta"
fi

if systemctl --user is-enabled log-guardian-fleet-keepalive.service &>/dev/null; then
  systemctl --user start log-guardian-fleet-keepalive.service 2>/dev/null \
    && echo "[laptop_stack_boot] fleet keepalive (user systemd)" \
    || echo "[laptop_stack_boot] UYARI: fleet keepalive baslatilamadi"
elif [[ -f "$ROOT/.cache/fleet-host.env" ]]; then
  bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg 2>/dev/null \
    && echo "[laptop_stack_boot] fleet keepalive (nohup)" \
    || true
fi

echo ""
echo "[OK] laptop_stack_boot"
echo "  Dashboard: https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/"
echo "  Grafana:   http://127.0.0.1:${GRAFANA_PORT:-3002}/"
echo "  Smoke:     bash scripts/grafana_smoke_test.sh"
