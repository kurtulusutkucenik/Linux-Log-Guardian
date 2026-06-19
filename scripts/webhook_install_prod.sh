#!/usr/bin/env bash
# Telegram webhook — prod kurulum (systemd + rules.conf)
#   bash scripts/webhook_apply_local.sh          # once: .env.webhook.local hazir
#   sudo bash scripts/webhook_install_prod.sh
#   sudo bash scripts/webhook_install_prod.sh --test-all
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_SRC="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
CONF_DIR="${LG_CONF:-/etc/log-guardian}"
WEBHOOK_ENV="$CONF_DIR/webhook.env"
RULES="$CONF_DIR/rules.conf"
DROPIN_DIR="/etc/systemd/system/log-guardian.service.d"
DROPIN="$DROPIN_DIR/10-webhook.conf"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"

fail() { echo "[webhook_install_prod] FAIL: $*" >&2; exit 1; }

[[ -f "$ENV_SRC" ]] || fail "$ENV_SRC yok — once: cp deploy/webhook.local.env.example .env.webhook.local"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  fail "sudo gerekli: sudo bash scripts/webhook_install_prod.sh"
fi

# Yeni binary (Text file busy — once servisi durdur)
if [[ "${SKIP_BINARY_UPGRADE:-0}" != 1 ]]; then
  bash "$ROOT/scripts/upgrade_log_guardian_binary.sh"
fi

# Yerel env -> /etc (token burada kalir, rules.conf'a YAZMA)
grep -v '^[[:space:]]*#' "$ENV_SRC" | grep -v '^[[:space:]]*$' \
  | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' >"$WEBHOOK_ENV"
chmod 600 "$WEBHOOK_ENV"
chown root:root "$WEBHOOK_ENV"

set -a
# shellcheck disable=SC1090
source "$WEBHOOK_ENV"
set +a

[[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" ]] \
  || fail "LOGANALYZER_TELEGRAM_TOKEN eksik ($ENV_SRC)

  1. Telegram @BotFather -> /newbot -> token kopyala
  2. .env.webhook.local icinde yorumu kaldir:
       LOGANALYZER_TELEGRAM_TOKEN=...
       LOGANALYZER_TELEGRAM_CHAT_ID=-100...   (kanal veya DM)
  3. Tekrar: sudo bash scripts/webhook_install_prod.sh --test-all

  Token hazir degilse: bash scripts/webhook_apply_local.sh --dev --test alert"

if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
  [[ -n "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" && -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" ]] \
    || fail "WEBHOOK_TELEGRAM_ROUTE=1 icin CRIT+WARN gerekli ($ENV_SRC)"
else
  [[ -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]] \
    || fail "LOGANALYZER_TELEGRAM_CHAT_ID eksik ($ENV_SRC)"
fi

# Prod onerilen degerler (env dosyasini guncelle)
upsert_env() {
  local key="$1" val="$2"
  local file="$WEBHOOK_ENV"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    echo "${key}=${val}" >>"$file"
  fi
}
upsert_env WEBHOOK_ENABLED 1
upsert_env WEBHOOK_MIN_LEVEL "${WEBHOOK_MIN_LEVEL:-2}"
upsert_env WEBHOOK_COOLDOWN_SEC "${WEBHOOK_COOLDOWN_SEC:-60}"
upsert_env WEBHOOK_ASYNC "${WEBHOOK_ASYNC:-1}"
upsert_env WEBHOOK_SILENT_INFO "${WEBHOOK_SILENT_INFO:-1}"
upsert_env WEBHOOK_TELEGRAM_BOT "${WEBHOOK_TELEGRAM_BOT:-1}"
upsert_env WEBHOOK_TELEGRAM_ROUTE "${WEBHOOK_TELEGRAM_ROUTE:-0}"
upsert_env WEBHOOK_TELEGRAM_BATCH_SEC "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}"
upsert_env ALERT_COOLDOWN_SEC "${ALERT_COOLDOWN_SEC:-10}"
upsert_env WEBHOOK_DRY_RUN 0

if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
  sed -i '/^LOGANALYZER_TELEGRAM_CHAT_ID=/d' "$WEBHOOK_ENV"
  sed -i '/^LOGANALYZER_TELEGRAM_CHAT_IDS=/d' "$WEBHOOK_ENV"
  echo "[OK] route modu — CHAT_ID kaldirildi (CRIT/WARN kullanilir)"
fi

upsert_rules() {
  local key="$1" val="$2"
  [[ -f "$RULES" ]] || fail "$RULES yok"
  if grep -q "^${key}=" "$RULES"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$RULES"
  else
    echo "${key}=${val}" >>"$RULES"
  fi
}

upsert_rules WEBHOOK_ENABLED 1
upsert_rules WEBHOOK_MIN_LEVEL "${WEBHOOK_MIN_LEVEL:-2}"
upsert_rules WEBHOOK_COOLDOWN_SEC "${WEBHOOK_COOLDOWN_SEC:-60}"
upsert_rules WEBHOOK_ASYNC "${WEBHOOK_ASYNC:-1}"
upsert_rules WEBHOOK_SILENT_INFO "${WEBHOOK_SILENT_INFO:-1}"
upsert_rules WEBHOOK_TELEGRAM_BOT "${WEBHOOK_TELEGRAM_BOT:-1}"
upsert_rules WEBHOOK_TELEGRAM_ROUTE "${WEBHOOK_TELEGRAM_ROUTE:-0}"
upsert_rules WEBHOOK_TELEGRAM_BATCH_SEC "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}"
upsert_rules ALERT_COOLDOWN_SEC "${ALERT_COOLDOWN_SEC:-10}"

mkdir -p "$DROPIN_DIR"
cat >"$DROPIN" <<EOF
# Log Guardian — Telegram/webhook env (token rules.conf icinde DEGIL)
[Service]
EnvironmentFile=-${WEBHOOK_ENV}
EOF
chmod 644 "$DROPIN"

systemctl daemon-reload
if systemctl is-active --quiet log-guardian.service 2>/dev/null; then
  systemctl restart log-guardian.service
  echo "[OK] log-guardian.service restart"
else
  echo "[WARN] log-guardian.service inactive — start: sudo systemctl start log-guardian.service"
fi

echo "=== webhook_install_prod OK ==="
echo "  webhook.env  -> $WEBHOOK_ENV (600)"
echo "  rules.conf   -> WEBHOOK_ENABLED=1 MIN_LEVEL=${WEBHOOK_MIN_LEVEL:-2} COOLDOWN=${WEBHOOK_COOLDOWN_SEC:-60}s ALERT_COOLDOWN=${ALERT_COOLDOWN_SEC:-10}s"
echo "  systemd      -> $DROPIN"
echo ""
echo "Canli dogrulama:"
echo "  sudo bash scripts/webhook_install_prod.sh --test-all"
echo "  sudo -u log-guardian env \$(grep -v '^#' $WEBHOOK_ENV | xargs) $LG_BIN --status --quiet | grep notifications"

run_test() {
  local kind="$1"
  local expect_ok="${2:-1}"
  set -a
  # shellcheck disable=SC1090
  source "$WEBHOOK_ENV"
  set +a
  export WEBHOOK_ENABLED=1 WEBHOOK_DRY_RUN=0
  export WEBHOOK_COOLDOWN_SEC=0 ALERT_COOLDOWN_SEC=0
  local out attempt
  for attempt in 1 2 3; do
    out=$("$LG_BIN" webhook-test "$kind" --quiet --rules "$RULES" 2>&1) || true
    if echo "$out" | grep -qiE 'Timeout|timed out|Couldn.t connect'; then
      echo "$out" >&2
      echo "  [retry $attempt/3] Telegram ag — 5s bekleniyor..." >&2
      sleep 5
      continue
    fi
    if echo "$out" | grep -q '"fail":0'; then
      break
    fi
    echo "$out" >&2
    if echo "$out" | grep -qi 'chat not found'; then
      fail "webhook-test $kind — Telegram chat not found

  Bot gruba/kanala admin olarak eklendi mi?
  CHAT_ID dogru mu? Supergroup forum icin genelde -100... ile baslar.
  Ornek: -5577870816 -> -1005577870816
  Dogrula: bash scripts/telegram_chat_id.sh
  .env.webhook.local duzelt -> sudo bash scripts/webhook_install_prod.sh --test-all"
    fi
    fail "webhook-test $kind"
  done
  [[ -n "${out:-}" ]] || fail "webhook-test $kind (bos cikti)"
  echo "$out"
  echo "$out" | grep -q '"ok":' || fail "ok alani yok ($kind)"
  echo "$out" | grep -q '"fail":0' || fail "fail>0 ($kind): $out"
  if [[ "$kind" == "alert" || "$kind" == "ban" || "$kind" == "trap" || "$kind" == "batch" ]]; then
    ok_n=$(echo "$out" | grep -o '"ok":[0-9]*' | grep -o '[0-9]*$' || echo 0)
    [[ "$ok_n" -ge "$expect_ok" ]] \
      || fail "$kind ok=$ok_n (beklenen >=$expect_ok): $out"
  fi
  echo "  [test $kind] OK (ok=$ok_n)"
}

if [[ "${1:-}" == "--test" ]]; then
  run_test "${2:-alert}"
elif [[ "${1:-}" == "--test-all" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$WEBHOOK_ENV"
  set +a
  fmt_ok=0
  if command -v strings >/dev/null && strings "$LG_BIN" 2>/dev/null \
      | grep -qF 'INC-test-webhook'; then
    fmt_ok=1
  fi
  fmt_out=$(WEBHOOK_DRY_RUN=1 "$LG_BIN" webhook-test alert 2>&1) || true
  if [[ "$fmt_ok" -eq 0 ]] && echo "$fmt_out" | grep -qE \
      'FORMAT-V2|INC-test-webhook|Host: <code>|T1190|203\.0\.113\.1'; then
    fmt_ok=1
  fi
  if [[ "$fmt_ok" -eq 1 ]]; then
    echo "  [format v2] Host + incident OK"
  else
    echo "$fmt_out" >&2
    echo "[webhook_install_prod] WARN: format v2 dry-run dogrulanamadi (canli test devam)" >&2
  fi
  export WEBHOOK_DRY_RUN=0
  alert_expect=1
  if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
    echo "  [route] CRIT/WARN ayri hedef"
  fi
  if [[ "${WEBHOOK_TELEGRAM_MIRROR_WARN:-0}" == "1" \
        && "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" \
        && "${WEBHOOK_TELEGRAM_TOPIC_WARN:-0}" -gt 0 ]]; then
    alert_expect=2
    echo "  [mirror] WARN alert — ok>=2 (DM + #uyari topic)"
  fi
  for k in alert ban trap; do
    exp=1
    [[ "$k" == "alert" ]] && exp=$alert_expect
    run_test "$k" "$exp"
    sleep 2
  done
  if [[ "${WEBHOOK_TELEGRAM_BATCH_SEC:-0}" -gt 0 ]]; then
    run_test batch 1
    echo "  [batch] WARN ozet DM'e gitti (10sn penceresi)"
  fi
  echo "[OK] Telegram alert + ban + trap gonderildi"
  echo "  [TEST] RFC5737 IP (203.0.113.x) — gercek saldirgan degil; ipset test ban:"
  echo "    sudo log-guardian unban 203.0.113.99   # webhook-test ban"
  echo "  Tam prod E2E: sudo bash scripts/webhook_prod_e2e.sh"
fi
