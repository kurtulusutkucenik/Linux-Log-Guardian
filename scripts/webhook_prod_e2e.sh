#!/usr/bin/env bash
# Prod Telegram route: nginx saldiri logu + webhook-test paketi
#   LIVE_WEBHOOK=1 sudo bash scripts/webhook_prod_e2e.sh   # bilincli canli prova
#   sudo bash scripts/webhook_prod_e2e.sh                    # dogrudan ops (root)
set -euo pipefail
set +H
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Rutin gate/rehearsal — kanala alarm gitmesin
if [[ "${SKIP_WEBHOOK:-0}" == "1" ]]; then
  echo "[SKIP] webhook_prod_e2e — SKIP_WEBHOOK=1 (LIVE_WEBHOOK=1 ile ac)"
  exit 0
fi
# Dogrudan root ops cagrisi (bilincli); gate'ler LIVE_WEBHOOK=1 gerekir
if [[ "$(id -u)" -eq 0 && "${LIVE_WEBHOOK:-0}" != "1" && "${WEBHOOK_PROD_FORCE:-0}" != "1" ]]; then
  WEBHOOK_PROD_FORCE=1
fi
if [[ "${LIVE_WEBHOOK:-0}" != "1" && "${WEBHOOK_PROD_FORCE:-0}" != "1" ]]; then
  echo "[SKIP] webhook_prod_e2e — LIVE_WEBHOOK=1 veya sudo bash scripts/webhook_prod_e2e.sh"
  exit 0
fi

# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
LG_AUTH_ARGS=()

WEBHOOK_ENV="${WEBHOOK_ENV:-/etc/log-guardian/webhook.env}"
PROD_RULES="${LG_RULES:-/etc/log-guardian/rules.conf}"
RULES="${PROD_RULES}"
E2E_RULES=""
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
METRICS_FILE="${LOGANALYZER_WEBHOOK_METRICS_FILE:-/var/lib/log-guardian/webhook.metrics}"
ATTACK_IP="203.0.113.198"
CACHE="$ROOT/.cache"
ATTACK_LOG="$CACHE/webhook_prod_attack.access"

fail() { echo "[webhook_prod_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

ipset_has_ban() {
  local ip="$1"
  ipset test log_analyzer_block_v4 "$ip" >/dev/null 2>&1 \
    || ipset test log_analyzer_block_v6 "$ip" >/dev/null 2>&1
}

prepare_e2e_rules() {
  local src="$PROD_RULES" base
  [[ -f "$src" ]] || fail "rules yok: $src"
  base="$(cd "$(dirname "$src")" && pwd)"
  mkdir -p "$CACHE"
  E2E_RULES="$CACHE/webhook_prod_e2e.rules"
  {
    while IFS= read -r ln || [[ -n "$ln" ]]; do
      case "$ln" in
        BLOCK_COUNTRIES=*|THREAT_FEED_*|GEOIP_REFRESH_*|GEOIP_MMDB=*|GEOIP_OFFLINE_CSV=*|MESH_*|ETCD_*|SIEM_*)
          continue ;;
        CRS_RULES=*|OPENAPI_SCHEMA=*|FALCO_HOST_RULES=*|WASM_PLUGIN_DIR=*)
          key="${ln%%=*}"
          val="${ln#*=}"
          if [[ -n "$val" && "$val" != /* ]]; then
            ln="${key}=${base}/${val}"
          fi
          ;;
      esac
      printf '%s\n' "$ln"
    done <"$src"
    echo "THREAT_FEED_ENABLED=0"
    echo "BLOCK_COUNTRIES="
    echo "GEOIP_FEED_SKIP=1"
    echo "METRICS_PORT=0"
    echo "MESH_PUB_ENABLED=0"
    echo "MESH_SUB_ENABLED=0"
    echo "SIEM_FORWARDER_ENABLED=0"
  } >"$E2E_RULES"
  chmod 600 "$E2E_RULES"
}

run_lg_ingest() {
  local siem_env=()
  local ingest_rules="${E2E_RULES:-$RULES}"
  [[ -f "$ingest_rules" ]] || ingest_rules="$RULES"
  local auth_env=()
  if [[ ${#LG_AUTH_ARGS[@]} -eq 0 ]]; then
    auth_env=(LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD}")
  fi
  local ingest_env=(
    "${auth_env[@]}"
    WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0 METRICS_PORT=0
    GEOIP_FEED_SKIP=1 THREAT_FEED_ENABLED=0
    LOGANALYZER_TELEGRAM_TOKEN="${LOGANALYZER_TELEGRAM_TOKEN:-}"
    LOGANALYZER_TELEGRAM_CHAT_ID="${LOGANALYZER_TELEGRAM_CHAT_ID:-}"
    LOGANALYZER_TELEGRAM_CHAT_IDS="${LOGANALYZER_TELEGRAM_CHAT_IDS:-}"
    LOGANALYZER_TELEGRAM_CHAT_CRIT="${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}"
    LOGANALYZER_TELEGRAM_CHAT_WARN="${LOGANALYZER_TELEGRAM_CHAT_WARN:-}"
  )
  if [[ "${LG_DEMO_SIEM:-0}" == "1" ]]; then
    ingest_env+=(
      SIEM_FORWARDER_ENABLED=1
      SIEM_HOST="${SIEM_HOST:-127.0.0.1}"
      SIEM_PORT="${SIEM_PORT:-5044}"
      SIEM_FORMAT="${SIEM_FORMAT:-json}"
      SIEM_SYNC_SEND=1
    )
  fi
  if [[ $EUID -eq 0 ]]; then
    env "${ingest_env[@]}" \
      "$LG_BIN" "${LG_AUTH_ARGS[@]}" "$ATTACK_LOG" --no-tui --json --rules "$ingest_rules" 2>&1
  elif command -v sudo >/dev/null 2>&1; then
    sudo env "${ingest_env[@]}" \
      "$LG_BIN" "${LG_AUTH_ARGS[@]}" "$ATTACK_LOG" --no-tui --json --rules "$ingest_rules" 2>&1
  else
    env "${ingest_env[@]}" \
      "$LG_BIN" "${LG_AUTH_ARGS[@]}" "$ATTACK_LOG" --no-tui --json --rules "$ingest_rules" 2>&1
  fi
}

unban_test_ip() {
  if [[ $EUID -eq 0 ]]; then
    "$LG_BIN" unban "$ATTACK_IP" >/dev/null 2>&1 || true
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$LG_BIN" unban "$ATTACK_IP" >/dev/null 2>&1 || true
  fi
  if command -v ipset >/dev/null 2>&1; then
    if [[ $EUID -eq 0 ]]; then
      ipset del log_analyzer_block_v4 "$ATTACK_IP" -exist 2>/dev/null || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo ipset del log_analyzer_block_v4 "$ATTACK_IP" -exist 2>/dev/null || true
    fi
  fi
  local db="${LG_DB:-/etc/log-guardian/events.db}"
  if [[ -f "$db" ]] && command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$db" "INSERT INTO ban_events (ts,ip,action,reason) VALUES ($(date +%s),'${ATTACK_IP}','UNBAN','e2e-cleanup');" 2>/dev/null || true
  fi
}

stack_repair_after_ingest() {
  [[ $EUID -eq 0 ]] || return 0
  command -v systemctl >/dev/null 2>&1 || return 0
  # --json one-shot METRICS_PORT=0: :9091 cakismasi yok; restart ban'i dusurur
  if [[ "${LG_E2E_STACK_RESTART:-0}" != "1" ]]; then
    echo "[INFO] stack restart atlandi (--json ingest ban'i korur; zorla: LG_E2E_STACK_RESTART=1)"
    return 0
  fi
  echo "[INFO] LG_E2E_STACK_RESTART=1 — systemd yeniden baslatiliyor..."
  systemctl restart log-guardian-daemon.service 2>/dev/null || true
  sleep 2
  systemctl restart log-guardian.service 2>/dev/null || true
  local n=0
  while [[ "$n" -lt 15 ]]; do
    if curl -sf --max-time 2 http://127.0.0.1:9091/metrics >/dev/null 2>&1 \
        && curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
           http://127.0.0.1:8090/api/v1/metrics 2>/dev/null | grep -qx 403; then
      ok "stack restart — metrics+API ayakta"
      return 0
    fi
    sleep 1
    n=$((n + 1))
  done
  echo "[WARN] stack restart sonrasi metrics/API hazir degil — sudo bash scripts/repair_no_xdp_stack.sh" >&2
}

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
    SKIP_WEBHOOK="${SKIP_WEBHOOK:-0}" \
    LIVE_WEBHOOK="${LIVE_WEBHOOK:-0}" \
    WEBHOOK_PROD_FORCE="${WEBHOOK_PROD_FORCE:-0}" \
    WEBHOOK_ENV="$WEBHOOK_ENV" \
    LG_RULES="${LG_RULES:-}" \
    LG_BIN="${LG_BIN:-}" \
    LG_DEMO_SIEM="${LG_DEMO_SIEM:-0}" \
    SIEM_HOST="${SIEM_HOST:-}" \
    SIEM_PORT="${SIEM_PORT:-}" \
    SIEM_FORMAT="${SIEM_FORMAT:-}" \
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
[[ -f "$PROD_RULES" ]] || fail "$PROD_RULES yok"
prepare_e2e_rules
echo "[info] ingest rules: $E2E_RULES (BLOCK_COUNTRIES/threat-intel kapali — ag koruma)"

metrics_sent() {
  grep -E '^sent=' "$METRICS_FILE" 2>/dev/null | cut -d= -f2 || echo 0
}

echo "=== webhook_prod_e2e ==="

if ! bash "$ROOT/scripts/laptop_network_sanity.sh"; then
  fail "ag guvenligi — gateway/DNS ipset'te. Once:
  sudo bash scripts/laptop_network_sanity.sh --fix
  FLUSH=1 bash scripts/laptop_ban_cleanup.sh"
fi

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

prepare_lg_replay_auth
if [[ ${#LG_AUTH_ARGS[@]} -gt 0 ]]; then
  echo "[info] auth: --password-file /etc/log-guardian/service.password"
else
  load_lg_replay_password
  echo "[info] auth: LOGANALYZER_PASSWORD (KDF dogrulandi)"
fi

echo "[0/4] test IP temizligi: $ATTACK_IP"
unban_test_ip
if command -v ipset >/dev/null 2>&1 && ipset_has_ban "$ATTACK_IP"; then
  fail "$ATTACK_IP hala ipset'te — once temizle:
  sudo log-guardian unban $ATTACK_IP
  sudo ipset del log_analyzer_block_v4 $ATTACK_IP 2>/dev/null || true
  sudo bash scripts/fix_ipc_perms.sh"
fi

echo "[1/4] saldiri logu isleniyor: $ATTACK_LOG"
load_webhook_env
export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
export LOGANALYZER_TELEGRAM_TOKEN LOGANALYZER_TELEGRAM_CHAT_ID LOGANALYZER_TELEGRAM_CHAT_IDS
export LOGANALYZER_TELEGRAM_CHAT_CRIT LOGANALYZER_TELEGRAM_CHAT_WARN
combined=$(run_lg_ingest || true)
alerts=$(echo "$combined" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
ban_ok=$(echo "$combined" | grep -o '"ban_success"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
[[ "${alerts:-0}" -ge 1 ]] || fail "alarm uretilmedi: $combined"
[[ "${ban_ok:-0}" -ge 1 ]] || fail "ban_success=0 (DB stale rec->banned?) — once: sudo log-guardian unban $ATTACK_IP && sudo ipset del log_analyzer_block_v4 $ATTACK_IP
  ingest: $combined"
ok "saldiri logu alerts_total=$alerts ban_success=$ban_ok"

verify_ipset_ban() {
  if ! command -v ipset >/dev/null 2>&1; then
    echo "[WARN] ipset yok — ban dogrulama atlandi"
    return 0
  fi
  if ipset_has_ban "$ATTACK_IP"; then
    ok "ipset ban: $ATTACK_IP"
    return 0
  fi
  fail "ipset'te ban yok ($ATTACK_IP) — alarm!=ban.
  Telegram KRITIK ALARM gelir; IP BANLANDI yalnizca ban basariliysa gelir.
  Onarim: sudo bash scripts/fix_ipc_perms.sh && newgrp log-guardian
           sudo bash scripts/repair_no_xdp_stack.sh
  Tekrar: sudo bash scripts/webhook_prod_e2e.sh"
}

echo "[2/4] ipset ban dogrulama (ingest sonrasi)..."
verify_ipset_ban

echo "[2a/4] active_bans.json → dashboard feed..."
DEST="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
mkdir -p "$DEST"
if [[ -f /run/log-guardian/active_bans.json ]]; then
  if [[ -w /run/log-guardian/active_bans.json ]]; then
    FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
  elif command -v sudo >/dev/null 2>&1; then
    sudo FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
  fi
  cp -f /run/log-guardian/active_bans.json "$DEST/active_bans.json" 2>/dev/null \
    || sudo cp -f /run/log-guardian/active_bans.json "$DEST/active_bans.json" 2>/dev/null || true
fi

echo "[2b/4] bans telegram ops (canli ban + ack API)..."
if [[ -x "$ROOT/scripts/bans_telegram_ops_e2e.sh" ]]; then
  if TEST_IP="$ATTACK_IP" REQUIRE_BAN=1 bash "$ROOT/scripts/bans_telegram_ops_e2e.sh"; then
    ok "bans_telegram_ops_e2e (ban+ack)"
  else
    echo "[WARN] bans_telegram_ops_e2e — dashboard :8443 + login kontrol" >&2
  fi
else
  echo "[WARN] bans_telegram_ops_e2e.sh yok" >&2
fi

echo "[3/4] webhook.metrics kontrol..."
SENT_AFTER=$(metrics_sent)
DELTA=$((SENT_AFTER - SENT_BEFORE))
[[ "$DELTA" -ge 1 ]] || fail "webhook.metrics sent artmadi ($SENT_BEFORE -> $SENT_AFTER)"
if [[ "${ban_ok:-0}" -ge 1 && "$DELTA" -lt 2 ]]; then
  fail "ban_success=$ban_ok ama webhook.metrics +$DELTA (alert+ban>=2 beklenir) — #ban kanalini kontrol et"
fi
ok "webhook.metrics sent +$DELTA ($SENT_BEFORE -> $SENT_AFTER)"

CLI_OK=1
if [[ "${WEBHOOK_E2E_CLI_TEST:-0}" == "1" ]]; then
  if [[ "$ROUTE_MODE" -eq 1 ]]; then
    echo "[4/4] route webhook-test (alert→DM, ban/trap→kanal)"
  else
    echo "[4/4] webhook-test (alert/ban/trap → tek kanal)"
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
  echo "[4/4] webhook-test CLI SKIP (saldiri logu + ipset + metrik yeterli; zorla: WEBHOOK_E2E_CLI_TEST=1)"
fi

stack_repair_after_ingest

if [[ "${LG_E2E_STACK_RESTART:-0}" == "1" ]]; then
  echo "[2b/4] ipset ban kaliciligi (stack restart sonrasi)..."
  verify_ipset_ban
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
  echo "  Kanal — KRITIK ALARM (#waf) + IP BANLANDI (#ban) + tuzak"
  echo "  Not: Sadece KRITIK ALARM (DM) gorduysen #ban kanalini kontrol et"
  echo "  Not: alarm!=ban — journalctl -u log-guardian-daemon | grep BAN"
else
  echo "  Tek kanal — alert + ban + trap (hepsi CHAT_ID)"
  echo "  Route icin: .env.webhook.local WEBHOOK_TELEGRAM_ROUTE=1 + CRIT/WARN"
fi
echo "[report] $REPORT"
echo "[5/5] e2e sonrasi ipset temizligi (gateway/LAN/DNS)..."
unban_test_ip
if [[ -x "$ROOT/scripts/laptop_network_sanity.sh" ]]; then
  bash "$ROOT/scripts/laptop_network_sanity.sh" --fix >/dev/null 2>&1 || true
  if ! bash "$ROOT/scripts/laptop_network_sanity.sh"; then
    echo "[WARN] E2E sonrasi ag kontrolu — FLUSH=1 bash scripts/laptop_ban_cleanup.sh" >&2
  fi
fi

echo "[6/6] kanit sync (dashboard /tests)..."
bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null \
  || sudo bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null \
  || true
if [[ "${WEBHOOK_E2E_SKIP_ACK:-0}" != "1" ]] && [[ -x "$ROOT/scripts/webhook_ack_e2e.sh" ]]; then
  if bash "$ROOT/scripts/webhook_ack_e2e.sh" 2>/dev/null; then
    ok "webhook_ack_e2e (Gordum DB+metrik)"
  else
    echo "[WARN] webhook_ack_e2e atlandi — bash scripts/webhook_ack_e2e.sh" >&2
  fi
fi
DEST="${LG_DASHBOARD_DATA:-$ROOT/.cache/dashboard-live}"
mkdir -p "$DEST"
for f in webhook-route-proof-report.json webhook-telegram-ack-live-report.json \
  bans-telegram-ops-report.json telegram-soc-gate-report.json guardian-status.json; do
  [[ -f "$ROOT/$f" ]] && cp -f "$ROOT/$f" "$DEST/$f" && echo "[sync] $f -> $DEST/"
done
if [[ -x "$ROOT/scripts/telegram_soc_gate.sh" ]]; then
  bash "$ROOT/scripts/telegram_soc_gate.sh" 2>/dev/null \
    && cp -f "$ROOT/telegram-soc-gate-report.json" "$DEST/" 2>/dev/null \
    && echo "[sync] telegram-soc-gate-report.json -> $DEST/" \
    || echo "[WARN] telegram_soc_gate atlandi" >&2
fi

echo "[OK] webhook_prod_e2e"
