#!/usr/bin/env bash
# Hangi log satiri parse edilemiyor? (satir numarasi + icerik)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG="${1:-test_access.log}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ ! -f "$LOG" ]]; then
  echo "Dosya yok: $LOG" >&2
  exit 1
fi

make -s log-guardian 2>/dev/null || true
out=$(./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules test_rules.conf 2>/dev/null || true)
pe=$(echo "$out" | grep -o '"parse_errors"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)
tl=$(echo "$out" | grep -o '"total_lines"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$' || echo 0)

echo "log=$LOG total_lines=$tl parse_errors=$pe"
if [[ "$pe" == "0" ]]; then
  echo "OK — tum satirlar parse edildi."
  exit 0
fi

echo ""
echo "Muhtemel neden: satirda bosluklu SQLi veya nginx disi format."
echo "Ornek sorunlu satir (eski test_access.log satir 7):"
echo '  "GET /search?q=1'"'"' UNION SELECT HTTP/1.1"  → bosluk parser''i bozar'
echo ""
echo "Duzeltilmis ornek:"
echo '  "GET /search?q=1%27%20UNION%20SELECT HTTP/1.1"'
echo ""
echo "Satirlar:"
nl -ba "$LOG"
exit 1
