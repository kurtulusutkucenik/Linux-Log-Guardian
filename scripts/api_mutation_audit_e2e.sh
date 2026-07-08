#!/usr/bin/env bash
# API mutation audit trail — POST ban sonrasi jsonl satiri
#   bash scripts/api_mutation_audit_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

PORT="${GUARDIAN_API_PORT:-8090}"
BASE="http://127.0.0.1:${PORT}"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
REPORT="${API_MUTATION_AUDIT_E2E_REPORT:-api-mutation-audit-e2e-report.json}"
AUDIT="${GUARDIAN_API_MUTATION_AUDIT:-/var/lib/log-guardian/api-mutation-audit.jsonl}"
TEST_IP="203.0.113.211"

# shellcheck source=scripts/lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

mut_tok=$(lg_rules_ban_token)
pass=true
reason=""

echo "=== api_mutation_audit_e2e ==="

if [[ -z "$mut_tok" ]]; then
  reason="mutation token yok"
  pass=false
fi

mkdir -p "$(dirname "$AUDIT")"
before=0
[[ -f "$AUDIT" ]] && before=$(wc -l <"$AUDIT" | tr -d ' ')

if [[ "$pass" == true ]]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
    -X POST -H "Authorization: Bearer ${mut_tok}" \
    "${BASE}/api/v1/ban?ip=${TEST_IP}&reason=audit_e2e" 2>/dev/null || echo 000)
  if [[ "$code" != "200" && "$code" != "409" ]]; then
    reason="POST ban HTTP $code"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  sleep 1
  after=0
  [[ -f "$AUDIT" ]] && after=$(wc -l <"$AUDIT" | tr -d ' ')
  if [[ "$after" -le "$before" ]]; then
    reason="audit jsonl yeni satir yok ($AUDIT)"
    pass=false
  elif ! tail -1 "$AUDIT" | grep -q "$TEST_IP"; then
    reason="son satirda test IP yok"
    pass=false
  else
    echo "[OK] audit trail +1 satir ($AUDIT)"
  fi
fi

python3 - "$REPORT" "$pass" "$reason" "$AUDIT" <<'PY'
import datetime, json, sys
from pathlib import Path
report, ok, reason, audit = sys.argv[1], sys.argv[2] == "true", sys.argv[3], sys.argv[4]
Path(report).write_text(json.dumps({
  "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
  "pass": ok,
  "fail_reason": reason or None,
  "audit_path": audit,
  "script": "scripts/api_mutation_audit_e2e.sh",
}, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$pass" == true ]]; then
  echo "[OK] api_mutation_audit_e2e"
  exit 0
fi
echo "[FAIL] api_mutation_audit_e2e — $reason" >&2
exit 1
