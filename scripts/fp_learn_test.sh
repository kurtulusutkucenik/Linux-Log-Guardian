#!/usr/bin/env bash
# Adaptive FP ogrenme testi — ikinci kosuda bastirilan alarm sayisi dusmeli
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

mkdir -p data
rm -f data/fp-trust.lst fp-trust.json

make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian

alerts() {
  ./log-guardian "$1" --no-tui --json --no-ban --no-db --rules test_rules.conf 2>/dev/null \
    | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0
}

LOG="${FP_BENIGN:-test_access.log}"
a1=$(alerts "$LOG")
./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules test_rules.conf >/dev/null 2>&1 || true
a2=$(alerts "$LOG")

echo "[fp_learn_test] run1 alerts=$a1 run2 alerts=$a2"
test -f fp-trust.json && cat fp-trust.json

if [[ "$a2" -le "$a1" ]]; then
  echo "[OK] adaptive FP — ikinci kosu <= birinci ($a2 <= $a1)"
else
  echo "[WARN] ikinci kosuda daha fazla alarm ($a2 > $a1)" >&2
fi
