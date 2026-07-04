#!/usr/bin/env bash
# Faz 0.5 — false-positive orani (benign vs attack log)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RULES="${FP_RULES:-}"
if [[ -z "$RULES" ]]; then
  for candidate in rules/fp-bench.conf test_rules.conf; do
    if [[ -f "$candidate" ]]; then
      RULES="$candidate"
      break
    fi
  done
  RULES="${RULES:-rules.conf}"
fi
ATTACK_RULES="${FP_ATTACK_RULES:-smoke_schema.conf}"
BENIGN="${FP_BENIGN:-corpus/benign_corpus.access}"
ATTACK="${FP_ATTACK:-corpus/schema_strict.access}"
MIN_BENIGN_LINES="${MIN_BENIGN_LINES:-150}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ ! -f "$BENIGN" ]] || [[ "$(wc -l < "$BENIGN" | tr -d ' ')" -lt "$MIN_BENIGN_LINES" ]]; then
  python3 scripts/generate_benign_corpus.py
fi
test -f "$ATTACK" || { echo "[fp_report] attack corpus yok: $ATTACK" >&2; exit 1; }

[[ -f "$ATTACK_RULES" ]] && chmod 600 "$ATTACK_RULES" 2>/dev/null || true
[[ -f "$RULES" ]] && chmod 600 "$RULES" 2>/dev/null || true

make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian

alerts_from_json() {
  local log="$1"
  local rules="$2"
  local out
  out=$(./log-guardian "$log" --no-tui --json --no-ban --no-webhook --no-db --rules "$rules" 2>/dev/null || true)
  echo "$out" | grep -o '"alerts_total"[[:space:]]*:[[:space:]]*[0-9]*' | tail -1 | grep -o '[0-9]*$' || echo 0
}

benign_alerts=$(alerts_from_json "$BENIGN" "$RULES")
attack_alerts=$(alerts_from_json "$ATTACK" "$ATTACK_RULES")
if [[ "${attack_alerts:-0}" -lt 1 && "$ATTACK_RULES" != "rules.conf" ]]; then
  echo "[fp_report] $ATTACK_RULES alerts=0 — rules.conf fallback" >&2
  attack_alerts=$(alerts_from_json "$ATTACK" "rules.conf")
  ATTACK_RULES="rules.conf"
fi

lines_b=$(wc -l < "$BENIGN" | tr -d ' ')
lines_a=$(wc -l < "$ATTACK" | tr -d ' ')

fp_rate="0"
if [[ "$lines_b" -gt 0 ]]; then
  fp_rate=$(awk "BEGIN {printf \"%.2f\", ($benign_alerts/$lines_b)*100}")
fi

{
  echo "=== False Positive Report ==="
  echo "date: $(date -Iseconds)"
  echo "benign_log: $BENIGN ($lines_b lines) alerts=$benign_alerts fp_rate=${fp_rate}%"
  echo "attack_log: $ATTACK ($lines_a lines) alerts=$attack_alerts ($ATTACK_RULES + OPENAPI_STRICT)"
  echo ""
  echo "hedef: benign fp_rate < 5%, attack alerts >= 1"
} | tee fp-report.txt

python3 <<'PY'
import json, datetime, re
from pathlib import Path
text = Path("fp-report.txt").read_text(encoding="utf-8")
benign_m = re.search(r"benign_log: \S+ \((\d+) lines\) alerts=(\d+) fp_rate=([\d.,]+)%", text)
attack_m = re.search(r"attack_log: \S+ \((\d+) lines\) alerts=(\d+)", text)
fp = float(benign_m.group(3).replace(",", ".")) if benign_m else 0.0
obj = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "benign": {
        "lines": int(benign_m.group(1)) if benign_m else 0,
        "alerts": int(benign_m.group(2)) if benign_m else 0,
        "fp_rate_pct": fp,
    },
    "attack": {
        "lines": int(attack_m.group(1)) if attack_m else 0,
        "alerts": int(attack_m.group(2)) if attack_m else 0,
    },
    "target_fp_pct": 5.0,
    "adaptive_hint": "FP_LEARN=1 + FP_TRUST_DAYS — temiz IP EMA esigi yukari",
}
trust_path = Path("fp-trust.json")
if trust_path.is_file():
    try:
        obj["fp_trust"] = json.loads(trust_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        pass
Path("fp-report.json").write_text(json.dumps(obj, indent=2), encoding="utf-8")
PY

echo "[fp_report] fp-report.txt fp-report.json"
