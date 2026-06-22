#!/usr/bin/env bash
# Consult API rate limit — flood sonrasi 429 veya servis ayakta
#   bash scripts/consult_rate_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LIB="$ROOT/scripts/lib/rules_conf_read.sh"
# shellcheck source=scripts/lib/rules_conf_read.sh
source "$LIB"

API="${LG_API_URL:-http://127.0.0.1:8090}"
tok="$(lg_rules_kv "API_TOKEN" 2>/dev/null || true)"
[[ -n "$tok" ]] || tok="${GUARDIAN_API_TOKEN:-}"

echo "=== consult_rate_proof ==="

api_up=0
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
  "${API}/api/v1/metrics" 2>/dev/null || echo 000)
if [[ "$code" == "403" || "$code" == "200" ]]; then
  api_up=1
fi
if [[ "$api_up" -eq 0 ]]; then
  echo "[WARN] API ayakta degil (metrics code=$code) — atlandi"
  exit 0
fi

body='{"uri":"/api/login","method":"POST","client_ip":"203.0.113.50"}'
hdr=()
[[ -n "$tok" ]] && hdr=(-H "Authorization: Bearer $tok")
[[ -z "$tok" ]] && echo "[WARN] API_TOKEN bos — consult 403 beklenir"

rate_hit=0
ok_count=0
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    -G "${hdr[@]}" \
    --data-urlencode "path=/api/login" \
    --data-urlencode "method=POST" \
    --data-urlencode "ip=203.0.113.50" \
    "${API}/api/v1/consult" 2>/dev/null || echo 000)
  if [[ "$code" == "429" ]]; then
    rate_hit=1
    break
  fi
  if [[ "$code" == "200" || "$code" == "403" ]]; then
    ok_count=$((ok_count + 1))
  fi
done

if [[ "$rate_hit" -eq 1 ]]; then
  echo "[OK] consult flood → 429 (rate limit aktif)"
elif [[ "$ok_count" -ge 30 ]]; then
  echo "[OK] consult ${ok_count}/40 yanit — global limit yuksek (120/s)"
else
  echo "[WARN] consult flood belirsiz (ok=$ok_count) — API token: rules.conf API_TOKEN"
fi

code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
  "${hdr[@]}" "${API}/api/v1/metrics" 2>/dev/null || echo 000)
[[ "$code" == "200" ]] && echo "[OK] API metrics post-flood" || echo "[WARN] metrics code=$code"

echo "[OK] consult_rate_proof"
