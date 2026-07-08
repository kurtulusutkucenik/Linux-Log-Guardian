#!/usr/bin/env bash
# API_MUTATION_TOKEN split — read POST ayirimi (Community tek token degismez)
#   bash scripts/api_mutation_token_e2e.sh
#   sudo bash scripts/ensure_api_split_tokens.sh && bash scripts/api_mutation_token_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

PORT="${GUARDIAN_API_PORT:-8090}"
BASE="http://127.0.0.1:${PORT}"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
REPORT="${API_MUTATION_TOKEN_E2E_REPORT:-api-mutation-token-e2e-report.json}"

read_tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
mut_tok=$(grep -E '^API_MUTATION_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$@" 2>/dev/null || echo 000
}

fail_reason=""
pass=true

echo "=== api_mutation_token_e2e ==="

if [[ -z "$read_tok" ]]; then
  fail_reason="API_TOKEN yok"
  pass=false
elif [[ -z "$mut_tok" ]]; then
  echo "[SKIP] API_MUTATION_TOKEN yok — Community tek token (OK)"
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'skipped': True,
  'reason': 'API_MUTATION_TOKEN yok — tek token modu',
  'script': 'scripts/api_mutation_token_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  exit 0
fi

init=$(code "${BASE}/api/v1/metrics")
if [[ "$init" == "000" ]]; then
  fail_reason="API yanit vermiyor"
  pass=false
fi

# Eski binary: mutation token rules.conf'ta ama POST read token ile 200
if [[ "$pass" == true && -n "$mut_tok" && "$mut_tok" != "$read_tok" ]]; then
  probe=$(code -X POST -H "Authorization: Bearer ${read_tok}" \
    "${BASE}/api/v1/ban?ip=203.0.113.198&reason=api_mut_probe")
  if [[ "$probe" == "200" || "$probe" == "409" ]]; then
    echo "[FAIL] Eski /usr/local/bin/log-guardian — API split kodu yok" >&2
    echo "  sudo bash scripts/upgrade_log_guardian_binary.sh" >&2
    echo "  veya: make -j\$(nproc) log-guardian && sudo install -m 755 log-guardian /usr/local/bin/log-guardian" >&2
    echo "  sudo systemctl restart log-guardian && bash scripts/api_mutation_token_e2e.sh" >&2
    fail_reason="binary upgrade gerekli (read token POST kabul edildi)"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  c_read_post=$(code -X POST -H "Authorization: Bearer ${read_tok}" \
    "${BASE}/api/v1/ban?ip=203.0.113.199&reason=api_mut_e2e")
  if [[ "$c_read_post" == "403" ]]; then
    echo "[OK] POST /ban read-only token -> 403"
  else
    echo "[FAIL] POST /ban read token code=$c_read_post (403 beklenir)" >&2
    fail_reason="read token POST kabul edildi"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  c_mut_post=$(code -X POST -H "Authorization: Bearer ${mut_tok}" \
    "${BASE}/api/v1/ban?ip=203.0.113.199&reason=api_mut_e2e")
  if [[ "$c_mut_post" == "200" || "$c_mut_post" == "409" ]]; then
    echo "[OK] POST /ban mutation token -> $c_mut_post"
  else
    echo "[FAIL] POST /ban mutation code=$c_mut_post" >&2
    fail_reason="mutation POST code=$c_mut_post"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  c_read_get=$(code -H "Authorization: Bearer ${read_tok}" "${BASE}/api/v1/metrics")
  if [[ "$c_read_get" == "200" ]]; then
    echo "[OK] GET /metrics read token -> 200"
  else
    echo "[FAIL] GET /metrics read code=$c_read_get" >&2
    fail_reason="read GET code=$c_read_get"
    pass=false
  fi
fi

python3 - "$REPORT" "$pass" "$fail_reason" <<'PY'
import json, datetime, sys
from pathlib import Path

report = Path(sys.argv[1])
passed = sys.argv[2] == "true"
fail_reason = sys.argv[3]
doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": passed,
    "fail_reason": fail_reason or None,
    "split_enabled": True,
    "script": "scripts/api_mutation_token_e2e.sh",
}
report.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$pass" == true ]]; then
  echo "[OK] api_mutation_token_e2e"
  exit 0
fi
echo "[FAIL] api_mutation_token_e2e — $fail_reason" >&2
exit 1
