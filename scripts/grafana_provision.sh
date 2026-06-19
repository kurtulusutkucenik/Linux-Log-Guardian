#!/usr/bin/env bash
# Grafana dashboard + alert kurallari (API veya manuel talimat)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3002}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
DS_NAME="${GRAFANA_PROM_DS:-Prometheus}"

fail() { echo "[grafana_provision] FAIL: $*" >&2; exit 1; }

test -f grafana-dashboard.json || fail "grafana-dashboard.json yok"
test -f grafana-alerts.json || fail "grafana-alerts.json yok"

if ! command -v curl >/dev/null 2>&1; then
  fail "curl gerekli"
fi

auth=(-u "${GRAFANA_USER}:${GRAFANA_PASS}")

api_ok() {
  curl -sf "${auth[@]}" "${GRAFANA_URL}/api/health" >/dev/null 2>&1
}

if ! api_ok; then
  echo "[grafana_provision] Grafana API erisilemiyor: ${GRAFANA_URL}"
  echo "Manuel kurulum:"
  echo "  1. docs/GRAFANA_SETUP.md — Prometheus scrape METRICS_PORT=9091"
  echo "  2. Grafana → Dashboards → Import → grafana-dashboard.json"
  echo "  3. Alerting → Import → grafana-alerts.json (veya UI'da kurallari olustur)"
  exit 0
fi

PROM_URL="${PROMETHEUS_URL:-http://host.docker.internal:9090}"
echo "[grafana_provision] Prometheus datasource (${DS_NAME}) → ${PROM_URL}..."
ds_payload=$(python3 -c "
import json, os
print(json.dumps({
  'name': os.environ.get('DS_NAME', 'Prometheus'),
  'type': 'prometheus',
  'url': os.environ.get('PROM_URL', 'http://host.docker.internal:9090'),
  'access': 'proxy',
  'isDefault': True,
  'jsonData': {'httpMethod': 'POST'},
}))
" DS_NAME="$DS_NAME" PROM_URL="$PROM_URL")

ds_code=$(curl -s -o /tmp/grafana_ds_resp.json -w '%{http_code}' "${auth[@]}" -H "Content-Type: application/json" \
  -X POST "${GRAFANA_URL}/api/datasources" -d "$ds_payload" 2>/dev/null || echo 000)
if [[ "$ds_code" == "200" || "$ds_code" == "201" ]]; then
  echo "[OK] datasource created"
elif [[ "$ds_code" == "409" ]]; then
  ds_uid=$(curl -sf "${auth[@]}" "${GRAFANA_URL}/api/datasources/name/${DS_NAME}" | python3 -c "import json,sys; print(json.load(sys.stdin).get('uid',''))" 2>/dev/null || true)
  if [[ -n "$ds_uid" ]]; then
    upd_code=$(curl -s -o /dev/null -w '%{http_code}' "${auth[@]}" -H "Content-Type: application/json" \
      -X PUT "${GRAFANA_URL}/api/datasources/uid/${ds_uid}" -d "$ds_payload" 2>/dev/null || echo 000)
    echo "[OK] datasource guncellendi (PUT ${upd_code}) → ${PROM_URL}"
  else
    echo "[OK] datasource zaten var (409)"
  fi
else
  echo "[WARN] datasource HTTP $ds_code — mevcut DS ile devam"
fi

DS_UID=$(curl -sf "${auth[@]}" "${GRAFANA_URL}/api/datasources/name/${DS_NAME}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('uid',''))" 2>/dev/null || true)
[[ -n "$DS_UID" ]] || fail "Prometheus datasource UID alinamadi"

echo "[grafana_provision] dashboard import (uid=log-guardian-01, ds=${DS_UID})..."
PACKED=$(mktemp)
python3 "$ROOT/scripts/grafana_dashboard_pack.py" "$ROOT/grafana-dashboard.json" "$DS_UID" "$PACKED"

curl -sf "${auth[@]}" -H "Content-Type: application/json" \
  -X POST "${GRAFANA_URL}/api/dashboards/db" \
  -d @"$PACKED" >/dev/null && echo "[OK] dashboard import" || echo "[WARN] dashboard import basarisiz"
rm -f "$PACKED"

echo "[grafana_provision] Alert kurallari otomatik import..."
export GRAFANA_URL GRAFANA_USER GRAFANA_PASS
export GRAFANA_PROM_DS="$DS_NAME"
if python3 scripts/grafana_alerts_provision.py; then
  echo "[OK] alert rules provisioned"
else
  echo "[WARN] alert otomatik import basarisiz — manuel: Grafana → Alerting → Import → grafana-alerts.json"
fi

echo "[grafana_provision] Telegram contact (#30 — opsiyonel)..."
if [[ -f "$ROOT/.env.grafana.telegram.local" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env.grafana.telegram.local"
  set +a
fi
if python3 "$ROOT/scripts/grafana_contact_provision.py"; then
  :
else
  echo "[WARN] contact point — bash scripts/grafana_telegram_contact.sh --from-webhook-warn --test"
fi

echo "[OK] grafana_provision tamam"
