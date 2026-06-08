#!/usr/bin/env bash
# Grafana + Prometheus smoke (grafana_stack sonrasi)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_PORT="${GRAFANA_PORT:-3002}"
GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:${GRAFANA_PORT}}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
AUTH=(-u "${GRAFANA_USER}:${GRAFANA_PASS}")

fail() { echo "[grafana_smoke] FAIL: $*" >&2; exit 1; }

echo "=== grafana_smoke_test ==="

if ! docker ps --format '{{.Names}}' | grep -qx prometheus-lg; then
  echo "[grafana_smoke] Stack yok — baslatiliyor..."
  bash "$ROOT/scripts/grafana_stack.sh"
fi

curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/health" >/dev/null \
  || fail "Grafana health"

scrape_ok() {
  curl -sfG "http://127.0.0.1:9090/api/v1/query" \
    --data-urlencode 'query=up{job="log-guardian"}' 2>/dev/null \
    | grep -q '"value":\[[^]]*,"1"\]'
}

for _ in $(seq 1 30); do
  scrape_ok && break
  sleep 1
done
scrape_ok || fail "Prometheus scrape (log-guardian job)"

ds=$(curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/datasources/name/Prometheus" 2>/dev/null) \
  || fail "Prometheus datasource yok — bash scripts/grafana_provision.sh"

echo "$ds" | grep -q '"type":"prometheus"' || fail "datasource tipi"

dash=$(curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/dashboards/uid/log-guardian-01" 2>/dev/null) \
  || fail "dashboard uid=log-guardian-01 yok"

echo "$dash" | grep -q 'Log Guardian' || echo "$dash" | grep -q 'log-guardian' \
  || fail "dashboard icerigi"

if curl -sf "http://127.0.0.1:9091/metrics" | grep -q '^loganalyzer_'; then
  echo "[OK] analyzer /metrics erisilebilir"
else
  echo "[grafana_smoke] UYARI: /metrics:9091 bos veya erisilemiyor"
fi

echo "[OK] grafana_smoke_test — ${GRAFANA_URL}"
