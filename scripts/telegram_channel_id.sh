#!/usr/bin/env bash
# Kanal chat_id bul — once kanala mesaj yaz, bot kanal admin olsun
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
[[ -f "$ENV_FILE" ]] || { echo "FAIL: $ENV_FILE yok" >&2; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
[[ -n "${LOGANALYZER_TELEGRAM_TOKEN:-}" ]] || { echo "FAIL: LOGANALYZER_TELEGRAM_TOKEN bos" >&2; exit 1; }

echo "=== telegram_channel_id ==="
echo "Once: gizli kanal olustur, @BotFather botunu Yonetici yap (Mesaj gonderme)."
echo "Sonra kanala bir satir yaz (or. test) ve Enter'a bas."
read -r -p "Kanala mesaj yazdin mi? [Enter devam] " _

upd=$(curl -sS -m 20 "https://api.telegram.org/bot${LOGANALYZER_TELEGRAM_TOKEN}/getUpdates")
echo "$upd" | python3 -c "
import json,sys
d=json.load(sys.stdin)
if not d.get('ok'):
    print('getUpdates FAIL:', d.get('description')); sys.exit(1)
channels=[]
for u in d.get('result') or []:
    for key in ('channel_post','message','edited_message'):
        msg=u.get(key)
        if not msg: continue
        chat=msg.get('chat') or {}
        cid=chat.get('id')
        if cid is None: continue
        title=chat.get('title') or chat.get('username') or chat.get('first_name') or '?'
        ctype=chat.get('type','?')
        txt=(msg.get('text') or '')[:50]
        if ctype in ('channel','supergroup') or str(cid).startswith('-100'):
            channels.append((cid, title, ctype, txt))
if not channels:
    print('Kanal bulunamadi.')
    print('  - Bot kanalda admin mi?')
    print('  - Kanala mesaj yazdin mi?')
    print('  - Tekrar: kanala test yaz, scripti yeniden calistir')
    sys.exit(2)
print('Bulunan kanallar (en son mesajlar):')
seen=set()
for cid,title,ctype,txt in channels[-5:]:
    if cid in seen: continue
    seen.add(cid)
    print(f'  chat_id={cid}  type={ctype}  title={title!r}  text={txt!r}')
print()
last=channels[-1][0]
print(f'Onerilen .env.webhook.local satiri:')
print(f'  LOGANALYZER_TELEGRAM_CHAT_ID={last}')
"
