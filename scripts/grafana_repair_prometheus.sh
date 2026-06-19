#!/usr/bin/env bash
# Grafana Prometheus datasource URL onarimi (172.17.0.1 timeout → host.docker.internal)
#   bash scripts/grafana_repair_prometheus.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3002}"
export GRAFANA_USER="${GRAFANA_USER:-admin}"
export GRAFANA_PASS="${GRAFANA_PASS:-admin}"
export PROMETHEUS_URL="${PROMETHEUS_URL:-http://host.docker.internal:9090}"

if ! curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASS}" "${GRAFANA_URL}/api/health" >/dev/null 2>&1; then
  echo "[grafana_repair] Grafana yok — once: bash scripts/grafana_stack.sh" >&2
  exit 1
fi

echo "[grafana_repair] datasource → ${PROMETHEUS_URL}"
bash "$ROOT/scripts/grafana_provision.sh"

if docker ps --format '{{.Names}}' | grep -qx grafana-lg; then
  echo "[grafana_repair] Grafana container icinden probe..."
  docker exec grafana-lg wget -qO- --timeout=5 "${PROMETHEUS_URL}/api/v1/query?query=up" 2>/dev/null \
    | grep -q '"status":"success"' \
    && echo "[OK] Grafana → Prometheus erisimi" \
    || echo "[WARN] Probe basarisiz — prometheus-lg ayakta mi? curl http://127.0.0.1:9090/-/healthy"
fi

echo "[OK] Grafana datasource guncellendi — Telegram'daki Error alarmlari bir sure sonra normale doner"
