#!/usr/bin/env bash
# Faz 4 — Fleet + Grafana + enterprise doc + multi-tenant
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

test -f grafana-dashboard.json
test -f docs/GRAFANA_SETUP.md
test -f docs/ENTERPRISE_SUPPORT.md
test -f docs/FLEET_ONLINE.md
test -f helm/log-guardian/Chart.yaml
bash scripts/helm_install_smoke.sh

DASH_URL="${DASH_URL:-http://127.0.0.1:3000}"
if curl -sf --max-time 2 "${DASH_URL}/login" -o /dev/null 2>/dev/null; then
  bash scripts/fleet_e2e.sh
else
  echo "fleet_e2e atlandi (dashboard kapali)"
fi

bash scripts/multitenant_e2e.sh
echo "OK — phase4_e2e"
