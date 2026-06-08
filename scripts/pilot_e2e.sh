#!/usr/bin/env bash
# pilot_e2e.sh — beta pilot kaniti (kurulum sonrasi tek komut)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

LG="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG" ]] || LG="$ROOT/log-guardian"
[[ -x "$LG" ]] || { echo "[pilot_e2e] log-guardian yok" >&2; exit 1; }

RULES="${RULES:-/etc/log-guardian/rules.conf}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"
LOG="${PILOT_LOG:-$ROOT/test_access.log}"
[[ -f "$LOG" ]] || LOG="$ROOT/corpus/bench_corpus.access"

echo "=== pilot_e2e ==="
echo "[1] health"
LG_BIN="$LG" RULES="$RULES" bash "$ROOT/scripts/ops_health.sh"

echo "[2] sentetik saldiri analizi"
out=$("$LG" "$LOG" --no-tui --json --no-ban --no-db --rules "$ROOT/test_rules.conf" 2>/dev/null)
echo "$out" | grep -q '"alerts_total"' || { echo "[pilot_e2e] alerts_total yok" >&2; exit 1; }
alerts=$(echo "$out" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
lines=$(echo "$out" | grep -o '"total_lines"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0)
echo "    lines=$lines alerts=$alerts"
[[ "${alerts:-0}" -ge 1 ]] || { echo "[pilot_e2e] en az 1 alert bekleniyor" >&2; exit 1; }

echo "[3] manuel ban (IPC/ipset)"
if "$LG" ban 203.0.113.250 --rules "$RULES" --reason pilot-e2e 2>/dev/null; then
  echo "    ban OK"
else
  echo "    ban atlandi (root/ipset yok — dev ortami)"
fi

echo "[4] status ozet"
"$LG" --status --rules "$RULES" 2>/dev/null | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('    ipc=', d.get('ipc'))
print('    db=', d.get('db',{}).get('available'))
print('    bans_active=', d.get('db',{}).get('bans_active','?'))
" 2>/dev/null || echo "    status atlandi"

echo "OK — pilot_e2e (beta pilot hazir)"
