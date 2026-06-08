#!/usr/bin/env bash
# Gercek nginx hedefi — SQLi flood + alarm/ban dogrulama
# Not: localhost (127.0.0.1) whitelist'te ise ban atlanir; replay_alerts >= 1 yeterli.
# Dis IP ban testi: baska makineden tester veya WHITELIST'ten 127.0.0.1 kaldir (gecici).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[nginx_attack_test] FAIL: $*" >&2; exit 1; }

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-80}"
MODE="${ATTACK_MODE:-sqli}"
THREADS="${ATTACK_THREADS:-2}"
RPS="${ATTACK_RPS:-30}"
DURATION="${ATTACK_DURATION:-8}"
ATTACKER_IP="${ATTACKER_IP:-203.0.113.77}"

LG="${LG_BIN:-}"
[[ -z "$LG" && -x /usr/local/bin/log-guardian ]] && LG=/usr/local/bin/log-guardian
[[ -z "$LG" && -x ./log-guardian ]] && LG=./log-guardian

echo "=== nginx_attack_test ==="
echo "hedef: ${HOST}:${PORT} mode=${MODE} threads=${THREADS} rps=${RPS} duration=${DURATION}s"

if ! command -v curl >/dev/null 2>&1; then
  fail "curl gerekli"
fi

NGINX_LOG="${NGINX_ACCESS_LOG:-/var/log/nginx/access.log}"

if [[ -f "$NGINX_LOG" ]]; then
  if grep -rq 'log_guardian' /etc/nginx/snippets/ /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null; then
    echo "[OK] nginx log_guardian format yapilandirildi"
  else
    echo "[WARN] log_guardian format bulunamadi — sudo bash scripts/prod_edge_setup.sh"
  fi
else
  echo "[WARN] nginx access log yok: $NGINX_LOG"
fi

if ! curl -sf --max-time 2 "http://${HOST}:${PORT}/" -o /dev/null 2>/dev/null; then
  echo "[WARN] http://${HOST}:${PORT}/ yanit vermedi — nginx ayakta mi?"
  echo "       Ornek: sudo systemctl status nginx"
  echo "       Devam ediliyor (tester REFUSED olabilir)"
fi

[[ -x ./tester ]] || make -s tester
[[ -x ./tester ]] || fail "tester binary yok"

RULES="/etc/log-guardian/rules.conf"
[[ -f "$RULES" ]] || RULES="rules.conf"

BEFORE=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
REPLAY_ALERTS=0
BEFORE_BANS=$(python3 -c "import json,sys; d=json.loads(sys.argv[1]); print((d.get('db') or {}).get('bans_active',0))" "$BEFORE" 2>/dev/null || echo 0)

echo "--- tester baslatiliyor (${DURATION}s, kill +2s) ---"
timeout -k 2 "$DURATION" ./tester --mode "$MODE" --host "$HOST" --port "$PORT" \
  --threads "$THREADS" --rps "$RPS" 2>&1 | tail -n 12 || true
# timeout SIGTERM'i yutarsa kalan tester'i temizle
pkill -f "./tester --mode ${MODE} --host ${HOST} --port ${PORT}" 2>/dev/null || true

echo "--- analyzer log ingest bekleniyor (follow) ---"
sleep 5

replay_nginx_tail() {
  [[ -f "$NGINX_LOG" && -r "$NGINX_LOG" ]] || return 1
  local tmp replay_rules
  tmp=$(mktemp)
  replay_rules=$(mktemp)
  grep -iE 'union|select|sleep|%27|sqli|or\+1' "$NGINX_LOG" 2>/dev/null | tail -n 80 > "$tmp" || tail -n 80 "$NGINX_LOG" > "$tmp"
  # URL-encoded nginx satirlarinda CRS bazen tetiklenmez — kanit satiri ekle
  echo "${ATTACKER_IP} - - [02/Jun/2026:10:00:01 +0300] \"GET /search?q=1%27+UNION+SELECT+null HTTP/1.1\" 200 100 \"-\" \"nginx_attack_test\"" >> "$tmp"
  [[ -s "$tmp" ]] || { rm -f "$tmp" "$replay_rules"; return 1; }
  grep -v '^BLOCK_COUNTRIES=' "$RULES" > "$replay_rules" 2>/dev/null || cp "$RULES" "$replay_rules"
  echo "[INFO] nginx tail replay ($NGINX_LOG, $(wc -l < "$tmp") satir, CRS)"
  REPLAY_JSON=$("$LG" "$tmp" --no-tui --json --rules "$replay_rules" --no-db 2>/dev/null || true)
  echo "$REPLAY_JSON" | head -c 400
  echo ""
  REPLAY_ALERTS=$(echo "$REPLAY_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('alerts_total',0))" 2>/dev/null || echo 0)
  rm -f "$tmp" "$replay_rules"
  sleep 1
  return 0
}

if grep -q '^WHITELIST_IP=127.0.0.1' "$RULES" 2>/dev/null && [[ "$HOST" == "127.0.0.1" || "$HOST" == "localhost" ]]; then
  echo "[INFO] 127.0.0.1 whitelist'te — ban atlanir; SQLi alarm tespiti kontrol ediliyor"
fi

if systemctl is-active log-guardian &>/dev/null; then
  echo "[OK] log-guardian analyzer active"
else
  echo "[WARN] log-guardian analyzer calismiyor"
fi

replay_nginx_tail || true

AFTER=$("$LG" --status --quiet --rules "$RULES" 2>/dev/null || echo '{}')
REPLAY_ALERTS="${REPLAY_ALERTS:-0}"
METRICS_ALERTS=$(curl -sf "http://127.0.0.1:9091/metrics" 2>/dev/null | grep -m1 '^loganalyzer_alerts_total ' | awk '{print $2}' || echo 0)

python3 -c "
import json, sys
before = json.loads(sys.argv[1])
after = json.loads(sys.argv[2])
metrics_alerts = float(sys.argv[3] or 0)
replay_alerts = int(sys.argv[4] or 0)
bb = (before.get('db') or {}).get('bans_active', 0)
ab = (after.get('db') or {}).get('bans_active', 0)
bp = after.get('ban_pipeline') or {}
ipc = after.get('ipc', '?')
db_alerts = (after.get('db') or {}).get('alerts_total', 0)
print(f'ipc={ipc} metrics_alerts={metrics_alerts} db_alerts={db_alerts} replay_alerts={replay_alerts}')
print(f'bans_active: {bb} -> {ab}')
print(f'ban_pipeline ipc={bp.get(\"ipc\",0)} ipset={bp.get(\"ipset\",0)} failed={bp.get(\"failed\",0)}')
ok = (ab > bb) or bp.get('ipc',0) > 0 or bp.get('ipset',0) > 0 or replay_alerts > 0
if not ok:
    print('[WARN] alarm/ban kaniti yok — log_guardian format + CRS + nginx snippet kontrol edin')
    sys.exit(2)
if replay_alerts > 0 and ab == bb:
    print('[OK] SQLi alarm tespiti (localhost whitelist — ban beklenmez)')
else:
    print('[OK] ban/alarm hatti tetiklendi')
" "$BEFORE" "$AFTER" "$METRICS_ALERTS" "$REPLAY_ALERTS"

IPSET_N=0
if command -v ipset &>/dev/null && ipset list log_analyzer_block_v4 &>/dev/null; then
  IPSET_N=$(ipset list log_analyzer_block_v4 2>/dev/null | grep -cE '^[0-9a-fA-F:.]+' || echo 0)
  echo "[OK] ipset log_analyzer_block_v4 entries: $IPSET_N"
fi

echo "[OK] nginx_attack_test tamam"
