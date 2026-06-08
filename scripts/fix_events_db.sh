#!/usr/bin/env bash
# events.db + WAL: log-guardian kullanicisi yazabilsin (dizin 2770 + db 660)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[fix_events_db] sudo gerekli" >&2; exit 1; }

CONF_DIR="${LG_CONF:-/etc/log-guardian}"
DB="$CONF_DIR/events.db"

getent group log-guardian >/dev/null 2>&1 || groupadd --system log-guardian

mkdir -p "$CONF_DIR"
chown root:log-guardian "$CONF_DIR"
chmod 2770 "$CONF_DIR"

touch "$DB"
chown root:log-guardian "$DB"
chmod 660 "$DB"

systemctl restart log-guardian 2>/dev/null || true
sleep 2

if command -v sqlite3 >/dev/null 2>&1; then
  tables=$(sqlite3 "$DB" ".tables" 2>/dev/null || true)
  if echo "$tables" | grep -q alerts; then
    echo "[fix_events_db] OK — tablolar: $tables"
  else
    echo "[fix_events_db] UYARI: alerts tablosu yok — journal:" >&2
    journalctl -u log-guardian -n 15 --no-pager 2>/dev/null | grep '\[DB\]' >&2 || true
    exit 1
  fi
else
  echo "[fix_events_db] events.db olusturuldu (sqlite3 yok — tablo kontrolu atlandi)"
fi
