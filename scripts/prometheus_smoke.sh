#!/usr/bin/env bash
# Prometheus scrape + ornek sorgular (UI'ya yapistir)
#   bash scripts/prometheus_smoke.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROM="${PROMETHEUS_URL:-http://127.0.0.1:9090}"
TENANT="${LG_TENANT:-default}"

fail() { echo "[prometheus_smoke] FAIL: $*" >&2; exit 1; }

command -v curl >/dev/null || fail "curl gerekli"
command -v python3 >/dev/null || fail "python3 gerekli"

# Tarayici :9090 — host.docker.internal yalnizca Grafana container icinden
if [[ "$PROM" == *docker.internal* ]]; then
  PROM="http://127.0.0.1:9090"
fi

q() {
  curl -sfG "${PROM}/api/v1/query" --data-urlencode "query=$1" 2>/dev/null \
    | python3 -c "
import sys,json
d=json.load(sys.stdin)
if d.get('status')!='success':
    sys.exit(1)
r=d['data']['result']
if not r:
    print('NO_DATA')
else:
    print(r[0]['value'][1])
" 2>/dev/null || echo "ERR"
}

echo "=== prometheus_smoke ==="
echo "  Prometheus: ${PROM}"
echo ""

up=$(q 'up{job="log-guardian"}')
[[ "$up" == "1" ]] || fail "scrape yok — log-guardian ayakta mi? bash scripts/grafana_stack.sh"
echo "[OK] scrape up{job=\"log-guardian\"} = 1"

applied=$(q "loganalyzer_threat_last_applied{tenant_id=\"${TENANT}\"}")
eps=$(q "loganalyzer_eps{tenant_id=\"${TENANT}\"}")
lines=$(q "loganalyzer_lines_total{tenant_id=\"${TENANT}\"}")
echo "[OK] threat_last_applied = ${applied}"
echo "[OK] eps = ${eps}  lines_total = ${lines}"
echo ""
echo "Prometheus UI → Query kutusuna BUNLARI yapistir (PromQL kelimesi DEGIL):"
echo ""
cat <<EOF
  up{job="log-guardian"}
  loganalyzer_threat_last_applied{tenant_id="${TENANT}"}
  loganalyzer_threat_last_failed{tenant_id="${TENANT}"}
  loganalyzer_eps{tenant_id="${TENANT}"}
  loganalyzer_lines_total{tenant_id="${TENANT}"}
EOF
echo ""
enc=$(python3 -c "import urllib.parse; print(urllib.parse.quote('up{job=\"log-guardian\"}'))")
echo "Hazir link (tarayicida ac):"
echo "  ${PROM}/graph?g0.expr=${enc}&g0.tab=0"
echo ""
echo "[OK] prometheus_smoke"
