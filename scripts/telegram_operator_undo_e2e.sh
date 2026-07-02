#!/usr/bin/env bash
# SIGUSR2 telegram undo kapisi — WL/sessiz geri al (poll kesintisiz)
#   bash scripts/telegram_operator_undo_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="${TELEGRAM_UNDO_E2E_REPORT:-telegram-operator-undo-e2e-report.json}"
IP="${TEST_IP:-203.0.113.198}"

if [[ "$(id -u)" -ne 0 && -z "${TELEGRAM_UNDO_E2E_SUDO:-}" ]]; then
  pid_pre=$(systemctl show -p MainPID --value log-guardian.service 2>/dev/null || echo 0)
  if [[ -n "$pid_pre" && "$pid_pre" != "0" ]] && ! kill -0 "$pid_pre" 2>/dev/null; then
    echo "[telegram_operator_undo_e2e] root servis — sudo ile yeniden calistiriliyor"
    exec sudo env TELEGRAM_UNDO_E2E_SUDO=1 TEST_IP="$IP" TELEGRAM_UNDO_E2E_REPORT="$OUT" bash "$0"
  fi
fi

fail() {
  python3 -c "
import json, datetime
from pathlib import Path
Path('$OUT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': False,
  'fail_reason': '''$*''',
  'ip': '$IP',
  'script': 'scripts/telegram_operator_undo_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"
  echo "[telegram_operator_undo_e2e] FAIL: $*" >&2
  exit 1
}

echo "=== telegram_operator_undo_e2e ==="

pid=$(systemctl show -p MainPID --value log-guardian.service 2>/dev/null || echo 0)
[[ -n "$pid" && "$pid" != "0" ]] || fail "log-guardian.service ayakta degil"

undo_out=""
if ! undo_out=$(bash "$ROOT/scripts/telegram_operator_undo.sh" "$IP" 2>&1); then
  fail "telegram_operator_undo basarisiz"
fi

if ! printf '%s\n' "$undo_out" | grep -q 'SIGUSR2'; then
  fail "SIGUSR2 yolu calismadi — upgrade_log_guardian_binary.sh?"
fi

if ! journalctl -u log-guardian.service -b --no-pager 2>/dev/null \
    | tail -30 | grep -q "\[TELEGRAM_UNDO\] $IP"; then
  fail "journal TELEGRAM_UNDO yok"
fi

python3 -c "
import json, datetime
from pathlib import Path
Path('$OUT').write_text(json.dumps({
  'date': datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'pass': True,
  'ip': '$IP',
  'mode': 'sigusr2',
  'script': 'scripts/telegram_operator_undo_e2e.sh',
}, indent=2)+'\n', encoding='utf-8')
"

echo "[OK] telegram_operator_undo_e2e — SIGUSR2 + journal TELEGRAM_UNDO"
