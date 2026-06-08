#!/usr/bin/env bash
# Telegram webhook dogrulama — token/chat_id .env.webhook.local'dan
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
[[ -f "$ENV_FILE" ]] || { echo "FAIL: $ENV_FILE yok" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "=== telegram_webhook_check ==="
me=$(curl -sS -m 20 "https://api.telegram.org/bot${LOGANALYZER_TELEGRAM_TOKEN}/getMe")
echo "$me" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('ok'):
    r=d['result']
    print(f\"Bot OK: @{r.get('username','?')} ({r.get('first_name','')})\")
else:
    print('getMe FAIL:', d.get('description')); sys.exit(1)
"

echo ""
echo "1) Telegram'da bota /start yazdin mi? (chat not found = genelde hayir)"
echo "2) getUpdates (son mesajlar):"
upd=$(curl -sS -m 20 "https://api.telegram.org/bot${LOGANALYZER_TELEGRAM_TOKEN}/getUpdates")
echo "$upd" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('ok'):
    print('getUpdates FAIL:', d.get('description')); sys.exit(1)
res=d.get('result') or []
if not res:
    print('  (bos) — bota /start yaz, sonra scripti tekrar calistir')
    sys.exit(2)
for u in res[-3:]:
    msg=u.get('message') or u.get('edited_message') or {}
    chat=msg.get('chat') or {}
    cid=chat.get('id')
    un=chat.get('username') or chat.get('first_name') or '?'
    txt=(msg.get('text') or '')[:40]
    print(f'  chat_id={cid} user={un} text={txt!r}')
"

echo ""
plain=$(curl -sS -m 20 -X POST \
  "https://api.telegram.org/bot${LOGANALYZER_TELEGRAM_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":${LOGANALYZER_TELEGRAM_CHAT_ID},\"text\":\"Log Guardian check OK\"}")
echo "$plain" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if d.get('ok'):
    print('sendMessage OK — Telegram mesaji gelmeli')
else:
    print('sendMessage FAIL:', d.get('description'))
    sys.exit(1)
"
