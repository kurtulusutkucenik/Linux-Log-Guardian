#!/usr/bin/env bash
# Dashboard Telegram unacked sayacini dusur — son 24s onaylanmamis alert/ban icin ops ack
#   sudo bash scripts/telegram_unacked_ops_cleanup.sh
#   sudo bash scripts/telegram_unacked_ops_cleanup.sh --dry-run
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="${GUARDIAN_STATUS_DB:-/etc/log-guardian/events.db}"
[[ -f /etc/log-guardian/events.db ]] && DB="/etc/log-guardian/events.db"
DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

[[ -f "$DB" ]] || { echo "[telegram_unacked_cleanup] FAIL: $DB yok" >&2; exit 1; }

read -r ack_before unacked_before <<<"$(python3 -c "
import json
try:
    d=json.load(open('$ROOT/guardian-status.json'))
    n=d.get('notifications') or {}
    print(n.get('ack_24h',0), n.get('unacked_24h',0))
except Exception:
    print('0 0')
" 2>/dev/null || echo "0 0")"

python3 - "$DB" "$DRY" <<'PY'
import sqlite3, sys, time
db, dry = sys.argv[1], sys.argv[2] == "1"
since = int(time.time()) - 86400
conn = sqlite3.connect(db)
conn.execute(
    "CREATE TABLE IF NOT EXISTS telegram_acks ("
    "id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER, chat_id TEXT, "
    "ack_key TEXT, incident_id TEXT, operator_id TEXT, operator_name TEXT)"
)
cols = {r[1] for r in conn.execute("PRAGMA table_info(telegram_acks)")}
for col in ("operator_id", "operator_name"):
    if col not in cols:
        conn.execute(f"ALTER TABLE telegram_acks ADD COLUMN {col} TEXT;")

def acked(key, inc=""):
    row = conn.execute(
        "SELECT 1 FROM telegram_acks WHERE ack_key=? OR ack_key=? "
        "OR (? != '' AND incident_id=?) LIMIT 1",
        (key, inc or key, inc, inc),
    ).fetchone()
    return row is not None

def insert_ack(key, inc=""):
    if acked(key, inc):
        return False
    if dry:
        print(f"  [dry-run] ack: {key}")
        return True
    conn.execute(
        "INSERT INTO telegram_acks (ts,chat_id,ack_key,incident_id,operator_id,operator_name) "
        "VALUES (?,?,?,?,?,?)",
        (int(time.time()), "ops-cleanup", key, inc or None, "ops-auto", "ops-cleanup"),
    )
    return True

n = 0
for inc, ip in conn.execute(
    "SELECT COALESCE(incident_id,''), ip FROM alerts "
    "WHERE level >= 2 AND ts >= ? ORDER BY id DESC LIMIT 64",
    (since,),
):
    if not ip:
        continue
    key = inc if inc else ip
    if insert_ack(key, inc):
        n += 1

for (ip,) in conn.execute(
    "SELECT ip FROM ban_events WHERE UPPER(action)='BAN' AND ts >= ? "
    "ORDER BY id DESC LIMIT 32",
    (since,),
):
    if ip and insert_ack(ip):
        n += 1

if not dry:
    conn.commit()
print(f"[telegram_unacked_cleanup] {'dry-run ' if dry else ''}yeni ack: {n}")
PY

bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null \
  || sudo bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null || true

read -r ack_after unacked_after <<<"$(python3 -c "
import json
try:
    d=json.load(open('$ROOT/guardian-status.json'))
    n=d.get('notifications') or {}
    print(n.get('ack_24h',0), n.get('unacked_24h',0))
except Exception:
    print('0 0')
")"

echo "[telegram_unacked_cleanup] ack ${ack_before}→${ack_after}  unacked ${unacked_before}→${unacked_after}"
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
