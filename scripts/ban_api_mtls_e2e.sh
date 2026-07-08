#!/usr/bin/env bash
# Enterprise ban API — mutation token + nginx mTLS lab
#   bash scripts/ban_api_mtls_e2e.sh
#   SKIP_MTLS_NGINX=1 bash scripts/ban_api_mtls_e2e.sh   # token-only (nginx yok)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

REPORT="${BAN_API_MTLS_REPORT:-ban-api-mtls-report.json}"
MTLS_DIR="${MTLS_DIR:-$ROOT/.cache/mtls-lab}"
LAB_PORT="${MTLS_LAB_PORT:-18443}"
API_PORT="$(read_lg_api_port)"
BASE="http://127.0.0.1:${API_PORT}"
LAB_BASE="https://127.0.0.1:${LAB_PORT}"
TEST_IP="203.0.113.210"

fail_reason=""
pass=true
read_token_post_reject=false
mutation_ok=false
mtls_verify=false
mtls_no_cert_reject=false
skipped_nginx=false

code() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$@" 2>/dev/null || echo 000
}

write_report() {
  python3 - "$REPORT" "$pass" "$fail_reason" "$read_token_post_reject" "$mutation_ok" \
    "$mtls_verify" "$mtls_no_cert_reject" "$skipped_nginx" "${caddy_mtls_verify:-false}" "${caddy_skipped:-true}" <<'PY'
import json, datetime, sys
from pathlib import Path

report = Path(sys.argv[1])
doc = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": sys.argv[2] == "true",
    "fail_reason": sys.argv[3] or None,
    "read_token_post_reject": sys.argv[4] == "true",
    "mutation_ok": sys.argv[5] == "true",
    "mtls_verify": sys.argv[6] == "true",
    "mtls_no_cert_reject": sys.argv[7] == "true",
    "skipped_nginx": sys.argv[8] == "true",
    "caddy_mtls_verify": sys.argv[9] == "true",
    "caddy_skipped": sys.argv[10] == "true",
    "script": "scripts/ban_api_mtls_e2e.sh",
}
report.write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")
PY
}

cleanup_nginx() {
  local pidf="$MTLS_DIR/nginx.pid"
  if [[ -f "$pidf" ]]; then
    local oldpid
    oldpid="$(cat "$pidf" 2>/dev/null || true)"
    if [[ -n "$oldpid" ]] && kill -0 "$oldpid" 2>/dev/null; then
      kill "$oldpid" 2>/dev/null || true
      wait "$oldpid" 2>/dev/null || true
    fi
    rm -f "$pidf"
  fi
  if [[ -n "${NGINX_LAB_PID:-}" ]] && kill -0 "$NGINX_LAB_PID" 2>/dev/null; then
    kill "$NGINX_LAB_PID" 2>/dev/null || true
    wait "$NGINX_LAB_PID" 2>/dev/null || true
  fi
}
trap cleanup_nginx EXIT

echo "=== ban_api_mtls_e2e ==="

read_tok="$(read_lg_api_token 2>/dev/null || true)"
mut_tok="$(read_lg_api_mutation_token 2>/dev/null || true)"

if [[ -z "$read_tok" ]]; then
  fail_reason="API_TOKEN yok"
  pass=false
elif [[ -z "$mut_tok" ]]; then
  echo "[SKIP] API_MUTATION_TOKEN yok — once: sudo bash scripts/ensure_api_split_tokens.sh"
  write_report
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'skipped': True,
  'reason': 'API_MUTATION_TOKEN yok',
  'script': 'scripts/ban_api_mtls_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  exit 0
fi

if [[ "$(code "${BASE}/api/v1/metrics")" == "000" ]]; then
  fail_reason="API :${API_PORT} yanit vermiyor"
  pass=false
fi

# --- 1) Token ayrimi (dogrudan loopback) ---
if [[ "$pass" == true ]]; then
  c_read=$(code -X POST -H "Authorization: Bearer ${read_tok}" \
    "${BASE}/api/v1/ban?ip=${TEST_IP}&reason=mtls_e2e_read")
  if [[ "$c_read" == "403" ]]; then
    read_token_post_reject=true
    echo "[OK] read token POST /ban -> 403"
  else
    echo "[FAIL] read token POST code=$c_read (403 beklenir)" >&2
    fail_reason="read_token_post_reject code=$c_read"
    pass=false
  fi
fi

if [[ "$pass" == true ]]; then
  c_mut=$(code -X POST -H "Authorization: Bearer ${mut_tok}" \
    "${BASE}/api/v1/ban?ip=${TEST_IP}&reason=mtls_e2e_mut")
  if [[ "$c_mut" == "200" || "$c_mut" == "409" ]]; then
    mutation_ok=true
    echo "[OK] mutation token POST /ban -> $c_mut"
  else
    echo "[FAIL] mutation POST code=$c_mut" >&2
    fail_reason="mutation_ok code=$c_mut"
    pass=false
  fi
fi

# --- 2) nginx mTLS lab (opsiyonel) ---
if [[ "$pass" == true && "${SKIP_MTLS_NGINX:-0}" != "1" ]]; then
  if ! command -v nginx >/dev/null 2>&1; then
    skipped_nginx=true
    echo "[SKIP] nginx yok — mTLS lab atlandi"
  else
    MTLS_REISSUE="${MTLS_REISSUE:-0}" bash "$ROOT/scripts/mtls_client_issue.sh"
    if [[ "${MTLS_REISSUE:-0}" == "1" && -f "$ROOT/deploy/mtls.d/.enabled" ]]; then
      if [[ "$(id -u)" -eq 0 ]]; then
        bash "$ROOT/scripts/caddy_mtls_setup.sh" sync
      else
        echo "[WARN] MTLS_REISSUE + Caddy SOAR — PKI drift: sudo bash scripts/caddy_mtls_setup.sh sync" >&2
      fi
    fi
    NGINX_CONF="$MTLS_DIR/nginx-mtls-lab.conf"
    MTLS_ABS="$(cd "$MTLS_DIR" && pwd)"
    python3 - "$NGINX_CONF" "$MTLS_DIR/nginx-mtls-lab.run.conf" "$MTLS_ABS" "$mut_tok" <<'PY'
import sys
from pathlib import Path
src, dst, mtls_abs, mut = sys.argv[1:5]
text = Path(src).read_text(encoding="utf-8")
text = text.replace("__MTLS_DIR__", mtls_abs).replace("MUTATION_TOKEN_PLACEHOLDER", mut)
Path(dst).write_text(text, encoding="utf-8")
PY
    if ! nginx -t -c "$MTLS_DIR/nginx-mtls-lab.run.conf" -p "$MTLS_ABS" 2>/dev/null; then
      skipped_nginx=true
      echo "[SKIP] nginx -t lab config FAIL" >&2
    else
      cleanup_nginx
      nginx -c "$MTLS_DIR/nginx-mtls-lab.run.conf" -p "$MTLS_ABS" 2>/dev/null &
      NGINX_LAB_PID=$!
      sleep 1
      if [[ -f "$MTLS_ABS/nginx.pid" ]]; then
        NGINX_LAB_PID="$(cat "$MTLS_ABS/nginx.pid" 2>/dev/null || echo "$NGINX_LAB_PID")"
      fi
      if ! kill -0 "$NGINX_LAB_PID" 2>/dev/null; then
        skipped_nginx=true
        echo "[SKIP] nginx lab baslatilamadi" >&2
      else
        c_nocert=$(code -k -X POST \
          "${LAB_BASE}/api/v1/ban?ip=${TEST_IP}&reason=mtls_nocert")
        if [[ "$c_nocert" == "403" || "$c_nocert" == "400" ]]; then
          mtls_no_cert_reject=true
          echo "[OK] mTLS sertifikasız -> $c_nocert"
        else
          echo "[FAIL] sertifikasız code=$c_nocert (403 beklenir)" >&2
          fail_reason="mtls_no_cert code=$c_nocert"
          pass=false
        fi

        if [[ "$pass" == true ]]; then
          c_mtls=$(code -k --cert "$MTLS_DIR/client.crt" --key "$MTLS_DIR/client.key" \
            -X POST "${LAB_BASE}/api/v1/ban?ip=${TEST_IP}&reason=mtls_edge")
          if [[ "$c_mtls" == "200" || "$c_mtls" == "409" ]]; then
            mtls_verify=true
            echo "[OK] mTLS client cert POST /ban -> $c_mtls"
          else
            echo "[FAIL] mTLS POST code=$c_mtls" >&2
            fail_reason="mtls_verify code=$c_mtls"
            pass=false
          fi
        fi
      fi
    fi
  fi
else
  skipped_nginx=true
fi

caddy_mtls_verify=false
caddy_skipped=true
if [[ "$pass" == true ]]; then
  if bash "$ROOT/scripts/caddy_api_mtls_e2e.sh" >/tmp/caddy_mtls_e2e.$$.log 2>&1; then
    if grep -qE '\[OK\] Caddy .*mTLS' /tmp/caddy_mtls_e2e.$$.log 2>/dev/null; then
      caddy_mtls_verify=true
      caddy_skipped=false
      echo "[OK] caddy_api_mtls_e2e"
    elif grep -q '\[SKIP\]' /tmp/caddy_mtls_e2e.$$.log 2>/dev/null; then
      echo "[SKIP] caddy_api_mtls_e2e (mTLS kapali)"
    fi
  else
    cat /tmp/caddy_mtls_e2e.$$.log >&2
    fail_reason="caddy_api_mtls_e2e FAIL"
    pass=false
  fi
  rm -f /tmp/caddy_mtls_e2e.$$.log
fi

write_report

if [[ "$pass" == true ]]; then
  echo "[OK] ban_api_mtls_e2e"
  exit 0
fi
echo "[FAIL] ban_api_mtls_e2e — $fail_reason" >&2
exit 1
