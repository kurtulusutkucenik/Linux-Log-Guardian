#!/usr/bin/env bash
# P3 #11 — Telegram Gördüm → DB ack + guardian-status/metrics sayaci
#   bash scripts/webhook_ack_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DB="${GUARDIAN_STATUS_DB:-/etc/log-guardian/events.db}"
[[ -f /etc/log-guardian/events.db ]] && DB="/etc/log-guardian/events.db"
REPORT="${WEBHOOK_ACK_REPORT:-webhook-telegram-ack-live-report.json}"
# Her kosuda benzersiz ack_key (tekrar calistirmada skip/FAIL olmasin)
ACK_KEY="E2E-ACK-$(date +%s)-$$"
CHAT_ID="e2e-ack-test"
OP_ID="e2e-operator-ack"

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$REPORT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'db': '$DB',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[webhook_ack_e2e] FAIL: $*" >&2
  exit 1
}

read_counts() {
  python3 -c "
import json,sys
try:
    d=json.load(open('guardian-status.json'))
    n=d.get('notifications') or {}
    print(n.get('ack_24h',0), n.get('unacked_24h',0))
except Exception:
    print('0 0')
"
}

read_metrics_ack() {
  curl -sf "http://127.0.0.1:9091/metrics" 2>/dev/null \
    | awk -F' ' '/^loganalyzer_telegram_ack_24h\{/ {print $2; exit}' || echo ""
}

echo "=== webhook_ack_e2e (P3 #11) ==="
[[ -f "$DB" ]] || fail "events.db yok: $DB"

bash scripts/guardian_status_export.sh 2>/dev/null \
  || sudo bash scripts/guardian_status_export.sh \
  || fail "guardian_status_export"

read -r ack_before unacked_before <<<"$(read_counts)"
echo "[1] onceki ack=$ack_before unacked=$unacked_before"

echo "[2] DB ack kaydi (Gordum simulasyonu) key=$ACK_KEY"
insert_rc=0
python3 - "$DB" "$CHAT_ID" "$ACK_KEY" "$OP_ID" <<'PY' || insert_rc=$?
import sqlite3, sys, time
db, chat, ack_key, op_id = sys.argv[1:5]
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
exists = conn.execute(
    "SELECT 1 FROM telegram_acks WHERE ack_key=? AND operator_id=? LIMIT 1",
    (ack_key, op_id),
).fetchone()
if exists:
    print("[FAIL] ack_key cakismasi (beklenmeyen)", file=sys.stderr)
    sys.exit(2)
conn.execute(
    "INSERT INTO telegram_acks (ts,chat_id,ack_key,incident_id,operator_id,operator_name) "
    "VALUES (?,?,?,?,?,?)",
    (int(time.time()), chat, ack_key, None, op_id, "e2e"),
)
conn.commit()
print("[OK] ack insert")
PY
[[ "$insert_rc" -eq 0 ]] || fail "ack insert basarisiz (rc=$insert_rc)"

bash scripts/guardian_status_export.sh 2>/dev/null \
  || sudo bash scripts/guardian_status_export.sh

read -r ack_after unacked_after <<<"$(read_counts)"
echo "[3] sonra ack=$ack_after unacked=$unacked_after"

[[ "$ack_after" -gt "$ack_before" ]] || fail "ack artmadi ($ack_before -> $ack_after)"

metrics_ack="$(read_metrics_ack)"
echo "[4] prometheus ack_24h=${metrics_ack:-?}"

python3 -c "
import json, datetime
from pathlib import Path
report={
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'db': '$DB',
  'ack_key': '$ACK_KEY',
  'ack_before': int('$ack_before'),
  'ack_after': int('$ack_after'),
  'unacked_before': int('$unacked_before'),
  'unacked_after': int('$unacked_after'),
  'metrics_ack_24h': int('$metrics_ack') if '$metrics_ack'.isdigit() else None,
  'script': 'scripts/webhook_ack_e2e.sh',
}
Path('$REPORT').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
"

echo "[OK] webhook_ack_e2e — ack $ack_before→$ack_after (rapor: $REPORT)"
