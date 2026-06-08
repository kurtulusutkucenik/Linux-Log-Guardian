#!/usr/bin/env bash
# nginx inline consult kaniti — API /api/v1/consult
#   bash scripts/nginx_inline_consult_proof.sh
#   sudo make install && sudo systemctl restart log-guardian && bash scripts/nginx_inline_consult_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${NGINX_CONSULT_REPORT:-nginx-inline-consult-report.json}"

fail() { echo "[nginx_inline_consult] FAIL: $*" >&2; exit 1; }

read_api_port() {
  local f="$1"
  if [[ -f "$f" ]]; then
    local p
    p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
    if [[ -n "$p" && "$p" =~ ^[0-9]+$ ]]; then
      echo "$p"
      return 0
    fi
  fi
  return 1
}

echo "=== nginx_inline_consult_proof ==="

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

API_PORT="${GUARDIAN_API_PORT:-}"
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port /etc/log-guardian/rules.conf 2>/dev/null || true)
fi
if [[ -z "$API_PORT" ]]; then
  API_PORT=$(read_api_port "$ROOT/rules.conf" 2>/dev/null || true)
fi
API_PORT="${API_PORT:-8090}"
BASE="http://127.0.0.1:${API_PORT}"

api_up=0
for _ in 1 2 3 4 5 6 7 8; do
  if curl -sf --max-time 2 "${BASE}/api/v1/metrics" >/dev/null 2>&1; then
    api_up=1
    break
  fi
  sleep 2
done

if [[ "$api_up" -eq 1 ]]; then
  echo "[OK] API :${API_PORT} yanit veriyor"
  if [[ ! -f /etc/log-guardian/rules/crs-bundle.rules ]]; then
    echo "[WARN] /etc/log-guardian/rules/crs-bundle.rules yok — CRS consult/SQLi zayif" >&2
    echo "       sudo bash scripts/sync_etc_rules.sh && sudo systemctl restart log-guardian" >&2
  fi
else
  echo "[WARN] API :${API_PORT} yanit vermiyor (16s beklendi)" >&2
  bash "$ROOT/scripts/ensure_guardian_api.sh" 2>/dev/null || true
  fail "once: sudo systemctl restart log-guardian  (make install binary'i yukler, servisi yenilemez)"
fi

consult() {
  local path="$1"
  local ua="${2:-Mozilla/5.0}"
  curl -s -o /dev/null -w "%{http_code}" --max-time 3 -G "${BASE}/api/v1/consult" \
    --data-urlencode "method=GET" \
    --data-urlencode "path=${path}" \
    --data-urlencode "ua=${ua}" \
    --data-urlencode "ip=203.0.113.99"
}

attack_code="$(consult "/?id=1+UNION+SELECT+1,2--" "sqlmap/1.8")"
sqli_or_code="$(consult "/?id=1%27+OR+1%3D1--" "Mozilla/5.0")"
benign_code="$(consult "/api/health" "Mozilla/5.0")"
lfi_code="$(consult "/download?file=../../../etc/passwd" "Mozilla/5.0")"

attack_ok=0
sqli_or_ok=0
benign_ok=0
lfi_ok=0
[[ "$attack_code" == "403" ]] && attack_ok=1
[[ "$sqli_or_code" == "403" ]] && sqli_or_ok=1
[[ "$benign_code" == "200" ]] && benign_ok=1
[[ "$lfi_code" == "403" ]] && lfi_ok=1

pass=0
if [[ "$attack_ok" -eq 1 && "$sqli_or_ok" -eq 1 && "$benign_ok" -eq 1 && "$lfi_ok" -eq 1 ]]; then
  pass=1
fi

python3 - "$REPORT" "$API_PORT" "$api_up" "$attack_code" "$sqli_or_code" "$benign_code" "$lfi_code" "$pass" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report = Path(sys.argv[1])
port, api_up = int(sys.argv[2]), int(sys.argv[3]) == 1
attack_c, sqli_or_c, benign_c, lfi_c = sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7]
passed = int(sys.argv[8]) == 1

def code(v):
    return int(v) if str(v).isdigit() else 0

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "api_port": port,
    "api_reachable": api_up,
    "endpoint": "/api/v1/consult",
    "tests": {
        "sqli_union": {"http_code": code(attack_c), "expect": 403},
        "sqli_or": {"http_code": code(sqli_or_c), "expect": 403},
        "benign_health": {"http_code": code(benign_c), "expect": 200},
        "lfi_attack": {"http_code": code(lfi_c), "expect": 403},
    },
    "nginx_snippet": "examples/nginx/snippets/log-guardian-inline-consult.conf",
    "pass": passed,
    "note": "make install sonrasi: sudo systemctl restart log-guardian",
}
report.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[nginx_inline_consult] union={attack_c} or1={sqli_or_c} benign={benign_c} lfi={lfi_c} pass={passed}")
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true
[[ "$pass" -eq 1 ]] || fail "consult testleri basarisiz (union=$attack_code or1=$sqli_or_code benign=$benign_code lfi=$lfi_code)"
echo "[OK] nginx_inline_consult_proof -> $REPORT"
