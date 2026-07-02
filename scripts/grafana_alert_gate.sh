#!/usr/bin/env bash
# P3 #9 — Grafana dashboard + alert ($tenant) provision + smoke
#   bash scripts/grafana_alert_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GRAFANA_URL="${GRAFANA_URL:-http://127.0.0.1:3002}"
GRAFANA_USER="${GRAFANA_USER:-admin}"
GRAFANA_PASS="${GRAFANA_PASS:-admin}"
REPORT="${GRAFANA_PROVISION_REPORT:-grafana-provision-report.json}"
AUTH=(-u "${GRAFANA_USER}:${GRAFANA_PASS}")

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'grafana_url': '$GRAFANA_URL',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[grafana_alert_gate] FAIL: $*" >&2
  exit 1
}

echo "=== grafana_alert_gate (P3 #9) ==="

if ! curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/health" >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg; then
    :
  elif [[ -f "$ROOT/scripts/grafana_stack.sh" ]]; then
    echo "[grafana_alert_gate] Stack baslatiliyor..."
    bash "$ROOT/scripts/grafana_stack.sh" || fail "grafana_stack basarisiz"
  else
    fail "Grafana erisilemiyor: $GRAFANA_URL"
  fi
fi

export GRAFANA_URL GRAFANA_USER GRAFANA_PASS
bash "$ROOT/scripts/grafana_provision.sh" || fail "grafana_provision"

bash "$ROOT/scripts/grafana_smoke_test.sh" || fail "grafana_smoke_test"

# Dashboard $tenant degiskeni
dash=$(curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/dashboards/uid/log-guardian-01") \
  || fail "dashboard uid=log-guardian-01 yok"
echo "$dash" | grep -q '"tenant"' || fail 'dashboard tenant degiskeni yok'

# Alert kurallari — tenant_id ifadesi
alert_count=0
tenant_expr=0
if curl -sf "${AUTH[@]}" "${GRAFANA_URL}/api/v1/provisioning/alert-rules" >/tmp/lg_alert_rules.json 2>/dev/null; then
  read -r alert_count tenant_expr <<<"$(python3 -c "
import json
rules=json.load(open('/tmp/lg_alert_rules.json'))
n=len(rules) if isinstance(rules,list) else 0
t=0
if isinstance(rules,list):
    for r in rules:
        blob=json.dumps(r)
        if 'tenant_id' in blob:
            t+=1
print(n,t)
")"
  [[ "$alert_count" -ge 1 ]] || fail "alert rule yok"
  [[ "$tenant_expr" -ge 1 ]] || fail "alert kurallarinda tenant_id yok"
else
  grep -q 'tenant_id' "$ROOT/grafana-alerts.json" || fail "grafana-alerts.json tenant yok"
  alert_count=$(python3 -c "import json; print(len(json.load(open('$ROOT/grafana-alerts.json')).get('groups',[{}])[0].get('rules',[])))")
  tenant_expr="$alert_count"
fi

python3 -c "
import json, datetime
from pathlib import Path
report={
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'grafana_url': '$GRAFANA_URL',
  'dashboard_uid': 'log-guardian-01',
  'tenant_variable': True,
  'alert_rules': int('$alert_count'),
  'alert_rules_with_tenant': int('$tenant_expr'),
  'script': 'scripts/grafana_alert_gate.sh',
}
Path('$REPORT').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
"

echo "[OK] grafana_alert_gate — dashboard \$tenant + $alert_count alert ($tenant_expr tenant_id)"
echo "  Rapor: $REPORT"
echo "  UI: ${GRAFANA_URL}/d/log-guardian-01"
