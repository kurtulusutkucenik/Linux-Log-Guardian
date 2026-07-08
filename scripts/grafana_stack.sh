#!/usr/bin/env bash
# Grafana + Prometheus (host scrape 127.0.0.1:9091) — idempotent, otomatik provision
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_PORT="${GRAFANA_PORT:-3002}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
# Grafana container → host'taki Prometheus (host network :9090)
PROM_HOST="${PROM_HOST:-host.docker.internal}"

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
  # Filo heartbeat — dashboard Prisma telemetry (P2 #22)
  - job_name: log-guardian-fleet
    metrics_path: /api/metrics/fleet
    static_configs:
      - targets: ['127.0.0.1:3000']
EOF

echo "[grafana_stack] eski container temizleniyor..."
docker rm -f prometheus-lg grafana-lg 2>/dev/null || true

echo "[grafana_stack] Prometheus (host network → 127.0.0.1:9091)..."
docker run -d --name prometheus-lg --network host --restart unless-stopped \
  -v "$PROM_CFG:/etc/prometheus/prometheus.yml:ro" \
  prom/prometheus >/dev/null

echo "[grafana_stack] Grafana :${GRAFANA_PORT}..."
docker run -d --name grafana-lg --restart unless-stopped \
  -p "127.0.0.1:${GRAFANA_PORT}:3000" \
  --add-host=host.docker.internal:host-gateway \
  -e GF_SECURITY_ADMIN_USER="$GRAFANA_USER" \
  -e GF_SECURITY_ADMIN_PASSWORD="$GRAFANA_PASS" \
  -e GF_SERVER_ROOT_URL="http://127.0.0.1:${GRAFANA_PORT}/" \
  grafana/grafana >/dev/null

echo "[grafana_stack] Grafana API bekleniyor..."
grafana_up=0
for i in $(seq 1 90); do
  if curl -sf --max-time 3 -u "${GRAFANA_USER}:${GRAFANA_PASS}" \
      "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null 2>&1; then
    grafana_up=1
    break
  fi
  if (( i % 10 == 0 )); then
    echo "[grafana_stack]   ... ${i}s (docker logs: docker logs grafana-lg --tail 5)"
  fi
  sleep 1
done
if [[ "$grafana_up" -ne 1 ]]; then
  echo "[grafana_stack] grafana-lg son log:" >&2
  docker logs grafana-lg --tail 20 2>&1 || true
  fail "Grafana API ayakta degil (${GRAFANA_PORT}) — docker ps; bellek/disk kontrol"
fi

scrape_ok() {
  curl -sf --max-time 3 -G "http://127.0.0.1:9090/api/v1/query" \
    --data-urlencode 'query=up{job="log-guardian"}' 2>/dev/null \
    | grep -q '"value":\[[^]]*,"1"\]'
}

for i in $(seq 1 45); do
  if scrape_ok; then
    echo "[grafana_stack] Prometheus scrape OK"
    break
  fi
  sleep 1
done
scrape_ok || {
  if ! curl -sf --max-time 3 http://127.0.0.1:9091/metrics 2>/dev/null \
      | grep -q 'loganalyzer_api_auth_fail_total{tenant_id='; then
    echo "[grafana_stack] UYARI: :9091 metrics bozuk — sudo bash scripts/install_binaries_systemd.sh" >&2
  else
    echo "[grafana_stack] UYARI: scrape henuz hazir degil (log-guardian ayakta mi?)" >&2
  fi
}

export GRAFANA_URL="http://127.0.0.1:${GRAFANA_PORT}"
export GRAFANA_USER GRAFANA_PASS
export PROMETHEUS_URL="http://${PROM_HOST}:9090"
export GRAFANA_PROM_DS="Prometheus"

echo "[grafana_stack] dashboard + alert provision..."
bash "$ROOT/scripts/grafana_provision.sh"

if [[ -f /etc/log-guardian/webhook.env || -f "$ROOT/.env.grafana.telegram.local" ]]; then
  echo "[grafana_stack] Telegram contact (#30)..."
  bash "$ROOT/scripts/grafana_telegram_contact.sh" --from-webhook-warn 2>/dev/null \
    || echo "[grafana_stack] UYARI: contact atlandi — bash scripts/grafana_telegram_contact.sh --from-webhook-warn"
fi

echo ""
echo "[OK] grafana_stack"
echo "  Grafana:    ${GRAFANA_URL}  (${GRAFANA_USER}/${GRAFANA_PASS})"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Smoke:      bash scripts/grafana_smoke_test.sh"
echo "  Alert E2E:  bash scripts/grafana_alert_e2e.sh"
echo "  Durdur:     docker rm -f prometheus-lg grafana-lg"
