#!/usr/bin/env bash
# Grafana + Prometheus (host scrape 127.0.0.1:9091) — idempotent, otomatik provision
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_PORT="${GRAFANA_PORT:-3002}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
PROM_HOST="${PROM_HOST:-172.17.0.1}"

fail() { echo "[grafana_stack] FAIL: $*" >&2; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  fail "docker gerekli"
fi

if ! systemctl is-active log-guardian >/dev/null 2>&1; then
  echo "[grafana_stack] UYARI: log-guardian inactive — metrik bos olabilir"
fi

PROM_CFG="$ROOT/.cache/prometheus-lg.yml"
mkdir -p "$ROOT/.cache"
cat > "$PROM_CFG" <<'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: log-guardian
    static_configs:
      - targets: ['127.0.0.1:9091']
EOF

echo "[grafana_stack] eski container temizleniyor..."
docker rm -f prometheus-lg grafana-lg 2>/dev/null || true

echo "[grafana_stack] Prometheus (host network → 127.0.0.1:9091)..."
docker run -d --name prometheus-lg --network host \
  -v "$PROM_CFG:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus >/dev/null

echo "[grafana_stack] Grafana :${GRAFANA_PORT}..."
docker run -d --name grafana-lg -p "127.0.0.1:${GRAFANA_PORT}:3000" \
  --add-host=host.docker.internal:host-gateway \
  -e GF_SECURITY_ADMIN_USER="$GRAFANA_USER" \
  -e GF_SECURITY_ADMIN_PASSWORD="$GRAFANA_PASS" \
  grafana/grafana >/dev/null

echo "[grafana_stack] Grafana API bekleniyor..."
for _ in $(seq 1 40); do
  if curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASS}" "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -sf -u "${GRAFANA_USER}:${GRAFANA_PASS}" "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null \
  || fail "Grafana API ayakta degil"

scrape_ok() {
  curl -sfG "http://127.0.0.1:9090/api/v1/query" \
    --data-urlencode 'query=up{job="log-guardian"}' 2>/dev/null \
    | grep -q '"value":\[[^]]*,"1"\]'
}

for _ in $(seq 1 30); do
  if scrape_ok; then
    echo "[grafana_stack] Prometheus scrape OK"
    break
  fi
  sleep 1
done
scrape_ok || echo "[grafana_stack] UYARI: scrape henuz hazir degil (log-guardian ayakta mi?)"

export GRAFANA_URL="http://127.0.0.1:${GRAFANA_PORT}"
export GRAFANA_USER GRAFANA_PASS
export PROMETHEUS_URL="http://${PROM_HOST}:9090"
export GRAFANA_PROM_DS="Prometheus"

echo "[grafana_stack] dashboard + alert provision..."
bash "$ROOT/scripts/grafana_provision.sh"

echo ""
echo "[OK] grafana_stack"
echo "  Grafana:    ${GRAFANA_URL}  (${GRAFANA_USER}/${GRAFANA_PASS})"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Smoke:      bash scripts/grafana_smoke_test.sh"
echo "  Durdur:     docker rm -f prometheus-lg grafana-lg"
