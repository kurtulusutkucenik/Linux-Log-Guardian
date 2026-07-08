#!/usr/bin/env bash
# Caddy :9443 ban API mTLS — prod stack dogrulama
#   bash scripts/caddy_mtls_setup.sh enable
#   bash scripts/caddy_api_mtls_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPORT="${CADDY_API_MTLS_REPORT:-caddy-api-mtls-report.json}"
HTTPS_PORT="${HTTPS_PORT:-8443}"
MTLS_PORT="${MTLS_API_PORT:-9443}"
STAMP="${ROOT}/deploy/mtls.d/.enabled"
TEST_IP="203.0.113.212"

resolve_mtls_client_paths() {
  CERT="${ROOT}/deploy/mtls/client.crt"
  KEY="${ROOT}/deploy/mtls/client.key"
  local ca="${ROOT}/deploy/mtls/ca.crt"
  if [[ ! -f "$CERT" || ! -f "$KEY" ]]; then
    fail_reason="deploy/mtls client cert yok — bash scripts/caddy_mtls_setup.sh enable"
    return 1
  fi
  if [[ ! -r "$KEY" ]]; then
    fail_reason="deploy/mtls/client.key okunamiyor — sudo bash scripts/caddy_mtls_setup.sh sync"
    return 1
  fi
  if [[ -f "$ca" ]] && ! openssl verify -CAfile "$ca" "$CERT" >/dev/null 2>&1; then
    fail_reason="client cert / CA uyumsuz — sudo bash scripts/caddy_mtls_setup.sh sync"
    return 1
  fi
  return 0
}
DASH_URL="https://localhost:${HTTPS_PORT}"
MTLS_URL="https://localhost:${MTLS_PORT}"

fail_reason=""
pass=true
mtls_enabled=false
caddy_ok=false
mtls_verify=false
mtls_no_cert_reject=false
dashboard_ok=false

code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 8 "$@" 2>/dev/null || echo 000
}

write_report() {
  python3 - "$REPORT" "$pass" "$fail_reason" "$mtls_enabled" "$caddy_ok" \
    "$mtls_verify" "$mtls_no_cert_reject" "$dashboard_ok" "$MTLS_PORT" <<'PY'
import json, datetime, sys
from pathlib import Path

doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": sys.argv[2] == "true",
    "fail_reason": sys.argv[3] or None,
    "mtls_enabled": sys.argv[4] == "true",
    "caddy_ok": sys.argv[5] == "true",
    "mtls_verify": sys.argv[6] == "true",
    "mtls_no_cert_reject": sys.argv[7] == "true",
    "dashboard_ok": sys.argv[8] == "true",
    "mtls_port": int(sys.argv[9]),
    "dash_url": f"https://localhost:{__import__('os').environ.get('HTTPS_PORT', '8443')}",
    "script": "scripts/caddy_api_mtls_e2e.sh",
}
Path(sys.argv[1]).write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY
}

echo "=== caddy_api_mtls_e2e ==="

if [[ ! -f "$STAMP" || ! -f "${ROOT}/deploy/mtls.d/10-mtls-api.caddy" ]]; then
  echo "[SKIP] caddy mTLS kapali — bash scripts/caddy_mtls_setup.sh enable"
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'skipped': True,
  'reason': 'caddy mTLS disabled',
  'script': 'scripts/caddy_api_mtls_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  exit 0
fi
mtls_enabled=true

# .cache/mtls-lab ile deploy/mtls PKI kaymasi (ban_api_mtls_e2e MTLS_REISSUE=1)
_cache_ca="${ROOT}/.cache/mtls-lab/ca.crt"
_deploy_ca="${ROOT}/deploy/mtls/ca.crt"
if [[ -f "$_cache_ca" && -f "$_deploy_ca" ]]; then
  _cfp="$(openssl x509 -in "$_cache_ca" -noout -fingerprint -sha256 2>/dev/null || true)"
  _dfp="$(openssl x509 -in "$_deploy_ca" -noout -fingerprint -sha256 2>/dev/null || true)"
  if [[ -n "$_cfp" && -n "$_dfp" && "$_cfp" != "$_dfp" ]]; then
    echo "[WARN] mTLS PKI drift (.cache/mtls-lab != deploy/mtls) — sudo bash scripts/caddy_mtls_setup.sh sync" >&2
  fi
fi
unset _cache_ca _deploy_ca _cfp _dfp

if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
  fail_reason="log-guardian-caddy ayakta degil"
  pass=false
else
  caddy_ok=true
fi

CURL_DASH=(--resolve "localhost:${HTTPS_PORT}:127.0.0.1" -k)
CURL_MTLS=(--resolve "localhost:${MTLS_PORT}:127.0.0.1" -k)

if [[ "$pass" == true ]]; then
  tier=$(code "${CURL_DASH[@]}" "${DASH_URL}/api/tier")
  if [[ "$tier" == "200" ]]; then
    dashboard_ok=true
    echo "[OK] dashboard :${HTTPS_PORT}/api/tier (cert yok) -> 200"
  else
    echo "[FAIL] dashboard /api/tier code=$tier" >&2
    fail_reason="dashboard_tier code=$tier"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  c_nocert=$(code "${CURL_MTLS[@]}" -X POST \
    "${MTLS_URL}/api/v1/ban?ip=${TEST_IP}&reason=caddy_nocert")
  if [[ "$c_nocert" == "403" || "$c_nocert" == "400" || "$c_nocert" == "000" || "$c_nocert" == 000* ]]; then
    mtls_no_cert_reject=true
    echo "[OK] Caddy :${MTLS_PORT} sertifikasız -> $c_nocert (TLS reject OK)"
  else
    echo "[FAIL] sertifikasız code=$c_nocert (403 beklenir)" >&2
    fail_reason="caddy_no_cert code=$c_nocert"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  if resolve_mtls_client_paths; then
    c_mtls=$(code "${CURL_MTLS[@]}" --cert "$CERT" --key "$KEY" \
      -X POST "${MTLS_URL}/api/v1/ban?ip=${TEST_IP}&reason=caddy_mtls")
    if [[ "$c_mtls" == "200" || "$c_mtls" == "409" ]]; then
      mtls_verify=true
      echo "[OK] Caddy :${MTLS_PORT} mTLS POST /ban -> $c_mtls (cert=${CERT##*/})"
    else
      echo "[FAIL] mTLS POST code=$c_mtls" >&2
      fail_reason="caddy_mtls code=$c_mtls"
      pass=false
    fi
  else
    pass=false
  fi
fi

write_report

if [[ "$pass" == true ]]; then
  echo "[OK] caddy_api_mtls_e2e"
  exit 0
fi
echo "[FAIL] caddy_api_mtls_e2e — $fail_reason" >&2
exit 1
