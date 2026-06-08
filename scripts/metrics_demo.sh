#!/usr/bin/env bash
# Grafana/Prometheus'a ornek metrik akisi — kisa saldiri + anlik sorgu
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROM="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
GRAFANA="${GRAFANA_URL:-http://127.0.0.1:3002}"
TENANT="${METRICS_TENANT:-default}"

fail() { echo "[metrics_demo] FAIL: $*" >&2; exit 1; }

query_metric() {
  local expr="$1"
  curl -sfG "${PROM}/api/v1/query" --data-urlencode "query=${expr}" 2>/dev/null \
    | python3 -c "
import json, sys
d = json.load(sys.stdin)
r = d.get('data', {}).get('result', [])
print(r[0]['value'][1] if r else '0')
" 2>/dev/null || echo "?"
}

echo "=== metrics_demo ==="
echo "tenant=${TENANT} prometheus=${PROM}"

if ! curl -sf --max-time 3 "${PROM}/-/ready" >/dev/null 2>&1; then
  echo "[WARN] Prometheus erisilemiyor — bash scripts/grafana_stack.sh"
fi

HOST="${ATTACK_HOST:-127.0.0.1}"
if [[ "${METRICS_DEMO_FULL:-0}" == "1" ]]; then
  echo "--- nginx saldiri (tam test) ---"
  ATTACK_DURATION="${ATTACK_DURATION:-4}" ATTACK_RPS="${ATTACK_RPS:-20}" \
    bash "$ROOT/scripts/nginx_attack_test.sh" || echo "[WARN] nginx_attack_test kismi basarisiz"
else
  echo "--- kisa traffic (curl x20) ---"
  for _ in $(seq 1 20); do
    curl -sf --max-time 2 "http://${HOST}/" -o /dev/null 2>/dev/null || true
  done
  sleep 3
fi

echo "--- Prometheus anlik ---"
for m in loganalyzer_lines_total loganalyzer_alerts_total loganalyzer_eps \
         loganalyzer_bans_success loganalyzer_unique_ips loganalyzer_xdp_active; do
  v=$(query_metric "${m}{tenant_id=\"${TENANT}\"}")
  printf "  %-30s %s\n" "${m}:" "$v"
done

echo ""
echo "[OK] metrics_demo"
echo "  Grafana: ${GRAFANA}/d/log-guardian-01/linux-log-guardian?var-tenant=${TENANT}"
echo "  Tekrar:  bash scripts/metrics_demo.sh"
