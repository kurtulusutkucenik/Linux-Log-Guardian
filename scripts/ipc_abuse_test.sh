#!/usr/bin/env bash
# IPC abuse — log-guardian grubu disindaki kullanici --health / IPC reddedilmeli
#   bash scripts/ipc_abuse_test.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }
warn() { echo "[WARN] $*"; }

echo "=== ipc_abuse_test ==="

LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
[[ -x "$LG_BIN" ]] || { echo "[FAIL] log-guardian binary yok" >&2; exit 1; }

DB="${SOAK_HEALTH_DB:-/etc/log-guardian/events.db}"
[[ -f "$DB" ]] || DB="$ROOT/events.db"

if ! getent group log-guardian >/dev/null 2>&1; then
  warn "log-guardian grubu yok — fix_ipc_perms.sh sonrasi tekrar"
  exit 0
fi

# nobody genelde grupta degil
abuser="nobody"
if ! id "$abuser" >/dev/null 2>&1; then
  abuser="$(getent passwd | awk -F: '$3>=1000 && $1!="root"{print $1; exit}')"
fi
[[ -n "$abuser" ]] || { warn "test kullanicisi bulunamadi"; exit 0; }

if id -nG "$abuser" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
  warn "$abuser log-guardian grubunda — farkli kullanici secin"
else
  ok "test kullanici $abuser grupta degil"
fi

_run_abuse() {
  runuser -u "$abuser" -- env LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" \
    "$LG_BIN" --health --db "$DB" 2>/dev/null
}

if _run_abuse; then
  bad "$abuser --health basarili (IPC/grup bypass?)"
else
  ok "$abuser --health reddedildi veya IPC fail"
fi

# Root olmayan, grupta olmayan ban CLI (yerel kullanici root degilse)
if [[ $EUID -ne 0 ]] && ! id -nG 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
  if "$LG_BIN" --status 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); exit(0 if d.get('ipc')=='ok' else 1)" 2>/dev/null; then
    bad "mevcut shell (grupta degil) --status IPC ok"
  else
    ok "mevcut shell --status IPC kapali"
  fi
fi

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] ipc_abuse_test"
  exit 0
fi
echo "[FAIL] ipc_abuse_test — $fail madde" >&2
exit 1
