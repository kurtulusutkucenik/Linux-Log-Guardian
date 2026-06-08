#!/usr/bin/env bash
# TR hosting tarzi corpus recall -> tr-hosting-corpus-report.json
#   bash scripts/tr_hosting_corpus_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== tr_hosting_corpus_proof ==="
python3 scripts/generate_tr_hosting_corpus.py
REAL_ATTACK_CORPUS="$ROOT/corpus/tr_hosting_corpus.access" \
REAL_ATTACK_MANIFEST="$ROOT/corpus/tr_hosting_manifest.json" \
python3 scripts/real_attack_replay.py -o tr-hosting-corpus-report.json || REPLAY_EXIT=$?
REPLAY_EXIT="${REPLAY_EXIT:-0}"

python3 <<'PY'
import json, sys
from pathlib import Path
d = json.loads(Path("tr-hosting-corpus-report.json").read_text())
# benign haric recall
cats = d.get("categories") or {}
atk = {k: v for k, v in cats.items() if k != "benign"}
atk_ok = all(c.get("pass") for c in atk.values()) if atk else True
d["attack_only_pass"] = atk_ok and d.get("pass")
Path("tr-hosting-corpus-report.json").write_text(json.dumps(d, indent=2) + "\n")
print(f"[tr_hosting_corpus_proof] recall={d.get('attack_recall_pct')}% "
      f"lines={d.get('lines_total')} pass={d.get('pass')} attack_only={atk_ok}")
for cat, info in sorted(atk.items()):
    if not info.get("pass"):
        print(f"  FAIL {cat}: recall={info.get('recall_pct')}%", file=sys.stderr)
sys.exit(0 if d.get("pass") else 1)
PY

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
echo "[OK] tr_hosting_corpus_proof -> tr-hosting-corpus-report.json"
