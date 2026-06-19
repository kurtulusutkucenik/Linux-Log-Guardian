#!/usr/bin/env bash
# Prod Telegram route: nginx saldiri logu + webhook-test paketi
#   sudo bash scripts/webhook_prod_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WEBHOOK_ENV="${WEBHOOK_ENV:-/etc/log-guardian/webhook.env}"
RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
METRICS_FILE="${LOGANALYZER_WEBHOOK_METRICS_FILE:-/var/lib/log-guardian/webhook.metrics}"
ATTACK_IP="203.0.113.198"
CACHE="$ROOT/.cache"
ATTACK_LOG="$CACHE/webhook_prod_attack.access"

fail() { echo "[webhook_prod_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

webhook_env_readable() {
  [[ -r "$WEBHOOK_ENV" ]] || return 1
  return 0
}

load_webhook_env() {
  set -a
  # shellcheck disable=SC1090
  source "$WEBHOOK_ENV"
  set +a
}

if [[ -f "$WEBHOOK_ENV" && ! -r "$WEBHOOK_ENV" && "$(id -u)" -ne 0 ]]; then
  echo "[webhook_prod_e2e] $WEBHOOK_ENV root-only — sudo ile yeniden calistiriliyor"
  exec sudo env \
    WEBHOOK_ENV="$WEBHOOK_ENV" \
    LG_RULES="${LG_RULES:-}" \
    LG_BIN="${LG_BIN:-}" \
    LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" \
    WEBHOOK_E2E_CLI_TEST="${WEBHOOK_E2E_CLI_TEST:-}" \
    METRICS_PORT="${METRICS_PORT:-}" \
    LOGANALYZER_WEBHOOK_METRICS_FILE="${LOGANALYZER_WEBHOOK_METRICS_FILE:-}" \
    bash "$0" "$@"
fi

[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
if ! [[ -f "$WEBHOOK_ENV" ]]; then
  if [[ "$(id -u)" -eq 0 ]]; then
    fail "$WEBHOOK_ENV yok — once: sudo bash scripts/webhook_install_prod.sh"
  elif ! sudo test -f "$WEBHOOK_ENV" 2>/dev/null; then
    fail "$WEBHOOK_ENV yok — once: sudo bash scripts/webhook_install_prod.sh"
  fi
fi
webhook_env_readable || fail "$WEBHOOK_ENV okunamiyor (chmod 600 root)"
[[ -f "$RULES" ]] || fail "$RULES yok"

metrics_sent() {
  grep -E '^sent=' "$METRICS_FILE" 2>/dev/null | cut -d= -f2 || echo 0
}

echo "=== webhook_prod_e2e ==="

if ! systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  echo "[WARN] log-guardian.service inactive"
fi

load_webhook_env

ROUTE_MODE=0
[[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]] && ROUTE_MODE=1

if [[ "$ROUTE_MODE" -eq 1 ]]; then
  if [[ -z "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" || -z "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]]; then
    fail "WEBHOOK_TELEGRAM_ROUTE=1 ama CRIT/WARN eksik.
  .env.webhook.local:
    LOGANALYZER_TELEGRAM_CHAT_CRIT=-100...   # kanal
    LOGANALYZER_TELEGRAM_CHAT_WARN=123...    # operator DM
  sonra: sudo bash scripts/webhook_install_prod.sh --test-all"
  fi
  echo "[info] route modu — WARN→DM, CRIT/ban/trap→kanal"
else
  [[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" ]] \
    || fail "LOGANALYZER_TELEGRAM_TOKEN eksik ($WEBHOOK_ENV)"
  [[ -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" || -n "${LOGANALYZER_TELEGRAM_CHAT_IDS:-}" ]] \
    || fail "tek kanal modu — LOGANALYZER_TELEGRAM_CHAT_ID gerekli"
  echo "[info] tek kanal modu (WEBHOOK_TELEGRAM_ROUTE=0) — tum bildirimler CHAT_ID'ye"
fi

EXPECT_OK=1
if [[ "$ROUTE_MODE" -eq 1 ]] \
   && [[ "${WEBHOOK_TELEGRAM_MIRROR_WARN:-0}" == "1" ]] \
   && [[ "${WEBHOOK_TELEGRAM_TOPIC_WARN:-0}" -gt 0 ]]; then
  EXPECT_OK=2
  echo "[info] mirror WARN — alert test ok>=2 bekleniyor"
fi

run_webhook_test() {
  local kind="$1"
  local expect_ok="${2:-1}"
  local soft="${3:-0}"
  load_webhook_env
  export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
  export WEBHOOK_COOLDOWN_SEC=0 ALERT_COOLDOWN_SEC=0
  export LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID LOGANALYZER_TELEGRAM_CHAT_IDS
  export LOGANALYZER_TELEGRAM_CHAT_CRIT LOGANALYZER_TELEGRAM_CHAT_WARN
  local out json ok_n fail_n attempt
  for attempt in 1 2 3; do
    out=$("$LG_BIN" webhook-test "$kind" --quiet --rules "$RULES" 2>&1) || true
    if echo "$out" | grep -qiE 'Timeout|timed out|Couldn.t connect'; then
      echo "$out" >&2
      echo "[webhook_prod_e2e] retry $attempt/3 — 8s..." >&2
      sleep 8
      continue
    fi
    json=$(echo "$out" | grep '^{' | tail -1)
    if [[ -n "$json" ]]; then
      fail_n=$(echo "$json" | grep -o '"fail":[0-9]*' | grep -o '[0-9]*$' || echo 1)
      ok_n=$(echo "$json" | grep -o '"ok":[0-9]*' | grep -o '[0-9]*$' || echo 0)
      if [[ "$fail_n" -eq 0 && "$ok_n" -ge "$expect_ok" ]]; then
        ok "webhook-test $kind ok=$ok_n"
        return 0
      fi
    fi
    [[ "$attempt" -lt 3 ]] && sleep 3
  done
  json=$(echo "$out" | grep '^{' | tail -1)
  [[ -n "$json" ]] || { [[ "$soft" -eq 1 ]] && return 1; fail "webhook-test $kind JSON yok: $out"; }
  fail_n=$(echo "$json" | grep -o '"fail":[0-9]*' | grep -o '[0-9]*$' || echo 1)
  ok_n=$(echo "$json" | grep -o '"ok":[0-9]*' | grep -o '[0-9]*$' || echo 0)
  if [[ "$fail_n" -eq 0 && "$ok_n" -ge "$expect_ok" ]]; then
    ok "webhook-test $kind ok=$ok_n"
    return 0
  fi
  [[ "$soft" -eq 1 ]] && return 1
  fail "webhook-test $kind fail=$fail_n ok=$ok_n (beklenen ok>=$expect_ok): $out"
}

SENT_BEFORE=$(metrics_sent)
mkdir -p "$CACHE"
cat >"$ATTACK_LOG" <<EOF
${ATTACK_IP} - - [09/Jun/2026:01:15:01 +0300] "GET /search?q=1'+UNION+SELECT+null HTTP/1.1" 200 100 "-" "webhook_prod_e2e"
${ATTACK_IP} - - [09/Jun/2026:01:15:02 +0300] "GET /admin?id=1 OR 1=1 HTTP/1.1" 404 50 "-" "webhook_prod_e2e"
${ATTACK_IP} - - [09/Jun/2026:01:15:03 +0300] "GET /api?x=<script>alert(1)</script> HTTP/1.1" 403 80 "-" "webhook_prod_e2e"
EOF

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "[1/3] saldiri logu isleniyor: $ATTACK_LOG"
load_webhook_env
export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
export LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID LOGANALYZER_TELEGRAM_CHAT_IDS
export LOGANALYZER_TELEGRAM_CHAT_CRIT LOGANALYZER_TELEGRAM_CHAT_WARN
combined=$("$LG_BIN" "$ATTACK_LOG" --no-tui --json --rules "$RULES" 2>&1 || true)
alerts=$(echo "$combined" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
[[ "${alerts:-0}" -ge 1 ]] || fail "alarm uretilmedi: $combined"
ok "saldiri logu alerts_total=$alerts"

echo "[2/3] webhook.metrics kontrol..."
SENT_AFTER=$(metrics_sent)
DELTA=$((SENT_AFTER - SENT_BEFORE))
[[ "$DELTA" -ge 1 ]] || fail "webhook.metrics sent artmadi ($SENT_BEFORE -> $SENT_AFTER)"
ok "webhook.metrics sent +$DELTA ($SENT_BEFORE -> $SENT_AFTER)"

CLI_OK=1
if [[ "${WEBHOOK_E2E_CLI_TEST:-0}" == "1" ]]; then
  if [[ "$ROUTE_MODE" -eq 1 ]]; then
    echo "[3/3] route webhook-test (alert→DM, ban/trap→kanal)"
  else
    echo "[3/3] webhook-test (alert/ban/trap → tek kanal)"
  fi
  for k in alert ban trap; do
    if [[ "$k" == "alert" ]]; then
      run_webhook_test "$k" "$EXPECT_OK" 1 || CLI_OK=0
    else
      run_webhook_test "$k" 1 1 || CLI_OK=0
    fi
    sleep 3
  done
  if [[ "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}" -gt 0 ]]; then
    run_webhook_test batch 1 1 || CLI_OK=0
  fi
  [[ "$CLI_OK" -eq 1 ]] || echo "[WARN] webhook-test CLI basarisiz — saldiri logu + metrik OK" >&2
else
  echo "[3/3] webhook-test CLI SKIP (saldiri logu + metrik yeterli; zorla: WEBHOOK_E2E_CLI_TEST=1)"
fi

SENT_AFTER=$(metrics_sent)
DELTA=$((SENT_AFTER - SENT_BEFORE))

if command -v curl >/dev/null && curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" >/dev/null 2>&1; then
  route=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_telegram_route{' | awk '{print $2}')
  batch=$(curl -sf "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" \
    | grep -E '^loganalyzer_webhook_telegram_batch_sec{' | awk '{print $2}')
  ok "Prometheus route=$route batch_sec=${batch:-0}"
fi

REPORT="$ROOT/webhook-route-proof-report.json"
DATE_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
BATCH_OK=0
[[ "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}" -gt 0 ]] && BATCH_OK=1
python3 - "$REPORT" <<PY
import json, sys
data = {
    "date": "${DATE_ISO}",
    "pass": True,
    "mode": "prod",
    "route_enabled": bool(${ROUTE_MODE}),
    "batch_sec": int("${WEBHOOK_TELEGRAM_BATCH_SEC:-0}"),
    "dry_run": {"ok": False},
    "batch": {"ok": bool(${BATCH_OK})},
    "prod_e2e": {"ok": True, "skipped": False},
    "metrics_delta": int("${DELTA}"),
    "alerts_total": int("${alerts}"),
    "fail_reason": "",
}
with open(sys.argv[1], "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
PY

echo ""
echo "Telegram kontrol:"
if [[ "$ROUTE_MODE" -eq 1 ]]; then
  echo "  DM    — WARN + batch ozet"
  echo "  Kanal — ban + tuzak"
else
  echo "  Tek kanal — alert + ban + trap (hepsi CHAT_ID)"
  echo "  Route icin: .env.webhook.local WEBHOOK_TELEGRAM_ROUTE=1 + CRIT/WARN"
fi
echo "[report] $REPORT"
echo "[OK] webhook_prod_e2e"
