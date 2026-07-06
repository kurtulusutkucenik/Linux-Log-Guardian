#!/usr/bin/env bash
# Laptop dashboard + Prometheus/Grafana saglik kontrolu
#   bash scripts/laptop_observability_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_PORT="${GRAFANA_PORT:-3002}"
HTTPS_PORT="${HTTPS_PORT:-8443}"
DOMAIN="${DOMAIN:-localhost}"
fail=0

check() {
  local label="$1" rc="$2"
  if [[ "$rc" -eq 0 ]]; then
    echo "[OK] $label"
  else
    echo "[FAIL] $label" >&2
    fail=$((fail + 1))
  fi
}

echo "=== laptop_observability_check ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "[FAIL] docker yok" >&2
  exit 1
fi

docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg \
  && check "prometheus-lg ayakta" 0 || check "prometheus-lg ayakta (bash scripts/grafana_stack.sh)" 1

docker ps --format '{{.Names}}' 2>/dev/null | grep -qx grafana-lg \
  && check "grafana-lg ayakta" 0 || check "grafana-lg ayakta" 1

docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-dashboard \
  && check "log-guardian-dashboard ayakta" 0 || check "log-guardian-dashboard ayakta (bash scripts/tls_proxy_up.sh)" 1

curl -sf --max-time 3 http://127.0.0.1:9090/-/ready >/dev/null 2>&1 \
  && check "Prometheus API :9090" 0 || check "Prometheus API :9090" 1

curl -sf --max-time 3 -u admin:admin "http://127.0.0.1:${GRAFANA_PORT}/api/health" >/dev/null 2>&1 \
  && check "Grafana API :${GRAFANA_PORT}" 0 || check "Grafana API :${GRAFANA_PORT}" 1

curl -sf --max-time 3 http://127.0.0.1:9091/metrics >/dev/null 2>&1 \
  && check "Analyzer metrikleri :9091" 0 || check "Analyzer metrikleri :9091" 1

metrics_fmt_ok=0
if curl -sf --max-time 3 http://127.0.0.1:9091/metrics 2>/dev/null \
    | grep -q 'loganalyzer_api_auth_fail_total{tenant_id='; then
  metrics_fmt_ok=1
  check "Analyzer metrics format (dist_risk uyumlu)" 0
else
  check "Analyzer metrics bozuk/eski binary — sudo bash scripts/install_binaries_systemd.sh" 1
fi

if curl -sfG --max-time 3 "http://127.0.0.1:9090/api/v1/query" \
  --data-urlencode 'query=up{job="log-guardian"}' 2>/dev/null | grep -q '"value":\[[^]]*,"1"\]'; then
  check "Prometheus scrape log-guardian" 0
elif [[ "$metrics_fmt_ok" -eq 0 ]]; then
  check "Prometheus scrape (metrics parse hatasi — binary yenile)" 1
else
  check "Prometheus scrape log-guardian (bash scripts/grafana_stack.sh)" 1
fi

if curl -sfG --max-time 3 "http://127.0.0.1:9090/api/v1/query" \
  --data-urlencode 'query=loganalyzer_threat_feed_enabled{tenant_id="default"}' 2>/dev/null \
  | grep -q '"value":\[[^]]*,"1"\]'; then
  applied=$(curl -sfG --max-time 3 "http://127.0.0.1:9090/api/v1/query" \
    --data-urlencode 'query=loganalyzer_threat_last_applied{tenant_id="default"}' 2>/dev/null \
    | python3 -c "import sys,json; r=json.load(sys.stdin)['data']['result']; print(r[0]['value'][1] if r else '0')" 2>/dev/null || echo 0)
  check "Threat feed metrik (applied=${applied})" 0
else
  check "Threat feed metrik (THREAT_FEED kapali veya scrape yok)" 0
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-dashboard; then
  docker exec log-guardian-dashboard node -e \
    "fetch(process.env.PROMETHEUS_URL+'/-/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" \
    >/dev/null 2>&1 \
    && check "Dashboard → Prometheus erisimi" 0 || check "Dashboard → Prometheus erisimi" 1
fi

curl -sfk --max-time 4 "https://${DOMAIN}:${HTTPS_PORT}/api/tier" >/dev/null 2>&1 \
  && check "TLS dashboard https://${DOMAIN}:${HTTPS_PORT}" 0 \
  || check "TLS dashboard https://${DOMAIN}:${HTTPS_PORT}" 1

if [[ -f "$ROOT/attack-map-report.json" ]]; then
  if python3 -c "
import json
d=json.load(open('$ROOT/attack-map-report.json'))
raise SystemExit(0 if d.get('pass') and d.get('nav_parity_ok') else 1)
" 2>/dev/null; then
    parity=$(python3 -c "import json; d=json.load(open('$ROOT/attack-map-report.json')); print(f\"nav={d.get('nav_ban_count',0)} ban={d.get('ban_markers',0)}\")")
    check "Attack map nav parity ($parity)" 0
  else
    check "Attack map nav parity (bash scripts/dashboard_refresh.sh)" 1
  fi
fi

if systemctl --user is-enabled log-guardian-laptop-stack.service &>/dev/null; then
  check "Boot unit enabled (user systemd)" 0
else
  echo "[WARN] Boot unit yok — bash scripts/install_laptop_stack_boot.sh" >&2
fi

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] laptop_observability_check — Filo grafikleri icin hazir"
  exit 0
fi

echo "[WARN] $fail kontrol basarisiz — bash scripts/dashboard_stack.sh" >&2
exit 1
