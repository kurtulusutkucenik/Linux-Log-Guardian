#!/usr/bin/env bash
# Musteri format corpus (log_guardian) recall -> customer-corpus-report.json
#   bash scripts/customer_corpus_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== customer_corpus_proof ==="
python3 scripts/generate_customer_corpus.py

# log_guardian format dogrulama
sample=$(head -1 corpus/customer_anonymized.access)
if [[ "$sample" != *'"-"'* ]] || [[ $(echo "$sample" | tr -cd '"' | wc -c) -lt 10 ]]; then
  echo "[FAIL] log_guardian format (xff + request_body) eksik" >&2
  exit 1
fi
echo "[OK] log_guardian format (10 alan)"

REAL_ATTACK_CORPUS="$ROOT/corpus/customer_anonymized.access" \
REAL_ATTACK_MANIFEST="$ROOT/corpus/customer_anonymized_manifest.json" \
REAL_ATTACK_MIN_RECALL="${CUSTOMER_CORPUS_MIN_RECALL:-80}" \
python3 scripts/real_attack_replay.py -o customer-corpus-report.json

python3 <<'PY'
import json, sys
from pathlib import Path
d = json.loads(Path("customer-corpus-report.json").read_text())
cats = d.get("categories") or {}
atk = {k: v for k, v in cats.items() if k != "benign"}
atk_ok = all(c.get("pass") for c in atk.values()) if atk else True
d["attack_only_pass"] = atk_ok and d.get("pass")
d["format"] = "log_guardian"
Path("customer-corpus-report.json").write_text(json.dumps(d, indent=2) + "\n")
print(f"[customer_corpus_proof] recall={d.get('attack_recall_pct')}% "
      f"lines={d.get('lines_total')} pass={d.get('pass')} attack_only={atk_ok}")
for cat, info in sorted(atk.items()):
    if not info.get("pass"):
        print(f"  FAIL {cat}: recall={info.get('recall_pct')}%", file=sys.stderr)
sys.exit(0 if d.get("pass") else 1)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
echo "[OK] customer_corpus_proof -> customer-corpus-report.json"
