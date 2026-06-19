#!/usr/bin/env bash
# Telegram chat_id — prod'da varsayilan: env'deki ID'leri getChat ile dogrula
#   bash scripts/telegram_chat_id.sh              # getChat dogrulama (webhook modunda guvenli)
#   bash scripts/telegram_chat_id.sh --env-only   # ag yok — route ozeti
#   bash scripts/telegram_chat_id.sh --discover   # ilk kurulum: getUpdates ile yeni id kesfi
#   sudo bash scripts/telegram_chat_id.sh         # /etc/log-guardian/webhook.env okur
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV_ONLY=0
DISCOVER=0
for arg in "$@"; do
  case "$arg" in
    --env-only|--route) ENV_ONLY=1 ;;
    --discover|--get-updates) DISCOVER=1 ;;
    --validate) ;;  # geriye uyumluluk; varsayilan davranis
    -h|--help)
      cat <<'EOF'
Kullanim: bash scripts/telegram_chat_id.sh [--env-only|--discover]

  (varsayilan)  env'deki CHAT_CRIT/CHAT_WARN/CHAT_ID getChat ile dogrula
                Prod + webhook modunda bunu kullanin.

  --env-only    Telegram API yok — mevcut route ozeti
  --discover    Ilk kurulum: getUpdates ile yeni chat_id kesfi
                Webhook aktifken getUpdates bos doner (normal).
EOF
      exit 0
      ;;
  esac
done

ENV_FILE="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
[[ -f "$ENV_FILE" ]] || ENV_FILE="/etc/log-guardian/webhook.env"
[[ -r "$ENV_FILE" ]] || { echo "[telegram_chat_id] $ENV_FILE okunamiyor — sudo?" >&2; exit 1; }

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

[[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" ]] || {
  echo "[telegram_chat_id] LOGANALYZER_TELEGRAM_TOKEN yok ($ENV_FILE)" >&2
  exit 1
}

print_route_summary() {
  echo "=== telegram route (env) ==="
  echo "  env file     : $ENV_FILE"
  echo "  route mode   : ${WEBHOOK_TELEGRAM_ROUTE:-0}"
  echo "  CHAT_CRIT    : ${LOGANALYZER_TELEGRAM_CHAT_CRIT:-<bos>}"
  echo "  CHAT_WARN    : ${LOGANALYZER_TELEGRAM_CHAT_WARN:-<bos>}"
  echo "  CHAT_ID      : ${LOGANALYZER_TELEGRAM_CHAT_ID:-<bos>}"
  echo "  mirror WARN  : ${WEBHOOK_TELEGRAM_MIRROR_WARN:-0}  topic_warn=${WEBHOOK_TELEGRAM_TOPIC_WARN:-0}"
  echo "  batch_sec    : ${WEBHOOK_TELEGRAM_BATCH_SEC:-0}"
  if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
    echo ""
    echo "Route modu:"
    echo "  WARN/INFO  -> LOGANALYZER_TELEGRAM_CHAT_WARN (operator DM, type=private)"
    echo "  CRIT/ban/trap -> LOGANALYZER_TELEGRAM_CHAT_CRIT (Ops supergroup)"
    if [[ "${WEBHOOK_TELEGRAM_MIRROR_WARN:-0}" == "1" ]]; then
      echo "  mirror WARN -> CHAT_CRIT + topic #${WEBHOOK_TELEGRAM_TOPIC_WARN:-?}"
    fi
  fi
  echo ""
  echo "Canli dogrulama (ag gerekmez):"
  echo "  sudo bash scripts/webhook_install_prod.sh --test-all"
  echo "  bash scripts/webhook_route_proof.sh --prod"
}

env_has_chat_ids() {
  [[ -n "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" \
    || -n "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" \
    || -n "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" ]]
}

API_BASE="${WEBHOOK_TELEGRAM_API_BASE:-https://api.telegram.org}"
API_BASE="${API_BASE%/}"

tg_curl() {
  local path="$1"
  local url="${API_BASE}/bot${LOGANALYZER_TELEGRAM_TOKEN}/${path}"
  local attempt out ip host
  host="${API_BASE#https://}"
  host="${host#http://}"
  host="${host%%/*}"

  for attempt in 1 2 3; do
    out=$(curl -4 -sS --connect-timeout 8 --max-time 25 "$url" 2>&1) && {
      echo "$out"
      return 0
    }
    if [[ "$attempt" -lt 3 ]]; then
      echo "[telegram_chat_id] ag/DNS deneme $attempt/3 — 5s..." >&2
      sleep 5
    fi
  done

  ip=$(getent ahostsv4 "$host" 2>/dev/null | awk 'NR==1{print $1; exit}')
  if [[ -n "$ip" ]]; then
    echo "[telegram_chat_id] DNS fallback --resolve ${host}:443:${ip}" >&2
    out=$(curl -4 -sS --connect-timeout 8 --max-time 25 \
      --resolve "${host}:443:${ip}" "$url" 2>&1) && {
      echo "$out"
      return 0
    }
  fi

  echo "$out" >&2
  return 1
}

validate_chat() {
  local label="$1"
  local cid="$2"
  [[ -n "$cid" ]] || { echo "  [$label] bos — atlandi"; return 0; }
  local raw ok ctype title
  raw=$(tg_curl "getChat?chat_id=${cid}") || {
    echo "  [$label] getChat basarisiz (id=$cid)" >&2
    return 1
  }
  ok=$(echo "$raw" | python3 -c "import json,sys; print(json.load(sys.stdin).get('ok',False))" 2>/dev/null || echo False)
  if [[ "$ok" != "True" ]]; then
    echo "  [$label] GECERSIZ id=$cid" >&2
    return 1
  fi
  read -r ctype title < <(echo "$raw" | python3 -c "
import json,sys
r=json.load(sys.stdin)['result']
print(r.get('type','?'), r.get('title') or r.get('username') or r.get('first_name') or '?')
")
  echo "  [$label] OK  id=$cid  type=$ctype  $title"
}

run_validate() {
  local fail=0
  echo ""
  echo "=== getChat dogrulama ==="
  if [[ "${WEBHOOK_TELEGRAM_ROUTE:-0}" == "1" ]]; then
    validate_chat "CHAT_CRIT" "${LOGANALYZER_TELEGRAM_CHAT_CRIT:-}" || fail=1
    validate_chat "CHAT_WARN" "${LOGANALYZER_TELEGRAM_CHAT_WARN:-}" || fail=1
  else
    validate_chat "CHAT_ID" "${LOGANALYZER_TELEGRAM_CHAT_ID:-}" || fail=1
  fi
  if [[ "$fail" -ne 0 ]]; then
    echo ""
    echo "[FAIL] env'deki chat_id gecersiz — .env.webhook.local duzelt" >&2
    echo "  Yeni id kesfi (ilk kurulum): bash scripts/telegram_chat_id.sh --discover" >&2
    return 1
  fi
  echo "[OK] route chat_id'leri Telegram'da gecerli"
  return 0
}

webhook_active_url() {
  local wh url
  wh=$(tg_curl "getWebhookInfo" 2>/dev/null) || return 0
  url=$(echo "$wh" | python3 -c "
import json,sys
try:
  r=json.load(sys.stdin).get('result') or {}
  print(r.get('url') or '')
except Exception:
  print('')
" 2>/dev/null || echo "")
  [[ -n "$url" ]] && echo "$url"
}

RESTART_LG=0
cleanup_lg() {
  if [[ "${RESTART_LG:-0}" -eq 1 ]]; then
    if [[ "$(id -u)" -eq 0 ]]; then systemctl start log-guardian
    else sudo -n systemctl start log-guardian 2>/dev/null || true; fi
  fi
}

run_discover() {
  local resp wh_url discover_rc=0

  wh_url=$(webhook_active_url || true)
  if [[ -n "${wh_url:-}" ]]; then
    echo ""
    echo "[info] Telegram webhook aktif — getUpdates kuyrugu bos (normal)"
    echo "  webhook: $wh_url"
    if env_has_chat_ids; then
      echo "  Mevcut env ID'leri gecerli mi kontrol ediliyor..."
      run_validate && return 0
    fi
    echo ""
    echo "Yeni chat_id kesfi icin (dev/laptop):"
    echo "  1. bash scripts/telegram_webhook_tunnel_dev.sh --stop   # deleteWebhook"
    echo "  2. Grupta mesaj at + sudo systemctl stop log-guardian"
    echo "  3. bash scripts/telegram_chat_id.sh --discover"
    echo "  4. webhook'u tekrar kaydet"
    return 1
  fi

  if systemctl is-active --quiet log-guardian 2>/dev/null; then
    echo "[telegram_chat_id] log-guardian acik — getUpdates 409 onleme..."
    if [[ "$(id -u)" -eq 0 ]]; then
      systemctl stop log-guardian
      RESTART_LG=1
    elif sudo -n systemctl stop log-guardian 2>/dev/null; then
      RESTART_LG=1
    else
      echo "[telegram_chat_id] uyari: sudo gerekli (409 riski)" >&2
      echo "  sudo systemctl stop log-guardian && bash scripts/telegram_chat_id.sh --discover" >&2
    fi
  fi
  trap cleanup_lg EXIT

  resp=$(tg_curl "getUpdates?limit=50") || {
    echo "[telegram_chat_id] getUpdates basarisiz (ag/DNS?)" >&2
    return 1
  }
  if echo "$resp" | grep -q '"error_code":409'; then
    trap - EXIT
    cleanup_lg
    echo "[info] getUpdates 409 — log-guardian poll/webhook aktif (normal)"
    if env_has_chat_ids; then
      echo "  env'deki ID'ler kontrol ediliyor..."
      run_validate && return 0
    fi
    echo "  sudo systemctl stop log-guardian && bash scripts/telegram_chat_id.sh --discover" >&2
    return 1
  fi

  set +e
  python3 - "$resp" <<'PY'
import json, sys
d = json.loads(sys.argv[1])
if not d.get("ok"):
    print("API hata:", d, file=sys.stderr)
    sys.exit(2)
rows = d.get("result") or []
if not rows:
    sys.exit(3)
seen = set()
privates = []
groups = []
for u in rows:
    m = u.get("message") or u.get("my_chat_member") or {}
    c = m.get("chat") if isinstance(m, dict) else None
    if not c and u.get("my_chat_member"):
        c = u["my_chat_member"].get("chat")
    if not c:
        continue
    cid = c.get("id")
    if cid in seen:
        continue
    seen.add(cid)
    ctype = c.get("type") or "?"
    title = c.get("title") or c.get("username") or c.get("first_name") or "?"
    thread = m.get("message_thread_id") if isinstance(m, dict) else None
    line = f"  id={cid}  type={ctype}  {title}"
    if thread:
        line += f"  thread={thread}"
    if ctype == "private":
        privates.append((cid, line))
    else:
        groups.append((cid, line))

print("Bulunan chat_id'ler:")
for cid, line in groups:
    print(line)
    print(f"    -> LOGANALYZER_TELEGRAM_CHAT_CRIT={cid}")
for cid, line in privates:
    print(line)
    print(f"    -> LOGANALYZER_TELEGRAM_CHAT_WARN={cid}")

print("\n.env.webhook.local guncelle -> sudo bash scripts/webhook_install_prod.sh --test-all")
PY
  discover_rc=$?
  set -e

  trap - EXIT
  cleanup_lg

  if [[ "$discover_rc" -eq 0 ]]; then
    return 0
  fi
  if [[ "$discover_rc" -eq 3 ]]; then
    echo ""
    echo "[info] getUpdates bos — webhook/long-poll kuyrugu tukendi (normal)"
    if env_has_chat_ids; then
      echo "  env'deki ID'ler kontrol ediliyor..."
      run_validate && return 0
    fi
    cat <<'EOF'

Ilk kurulum icin:
  1. @CENIK_Log_Guardians_Bot'u gruba ekle (admin)
  2. Grupta veya DM'de /start yaz
  3. sudo systemctl stop log-guardian
  4. bash scripts/telegram_chat_id.sh --discover

Prod'da ID zaten dogruysa:
  bash scripts/telegram_chat_id.sh
EOF
    return 1
  fi
  return 1
}

if [[ "$ENV_ONLY" -eq 1 ]]; then
  print_route_summary
  exit 0
fi

echo "=== telegram_chat_id ==="
print_route_summary

me=$(tg_curl "getMe") || {
  echo "[telegram_chat_id] getMe basarisiz (ag/DNS?)" >&2
  echo "  Cozum: resolvectl flush-caches  veya  ag/VPN kontrol" >&2
  echo "  Route zaten calisiyorsa: bash scripts/telegram_chat_id.sh --env-only" >&2
  exit 1
}
if ! echo "$me" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
  echo "[telegram_chat_id] getMe gecersiz yanit: $me" >&2
  exit 1
fi
echo "Bot:"
echo "$me" | python3 -c "import json,sys; r=json.load(sys.stdin)['result']; print(' ', r.get('username'), '—', r.get('first_name'))"

if [[ "$DISCOVER" -eq 1 ]]; then
  run_discover
  exit $?
fi

# Varsayilan: prod dogrulama (webhook modunda getUpdates kullanilmaz)
if ! env_has_chat_ids; then
  echo ""
  echo "[telegram_chat_id] env'de chat_id yok — kesif modu:" >&2
  run_discover
  exit $?
fi

run_validate
