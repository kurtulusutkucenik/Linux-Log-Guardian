#!/usr/bin/env bash
# OWASP/CRS tarzi corpus recall kaniti -> owasp-corpus-report.json
#   bash scripts/owasp_corpus_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
ensure_sudo_lg_replay "$0" "$@"
load_lg_replay_password
export REAL_ATTACK_SKIP_CATEGORIES="${REAL_ATTACK_SKIP_CATEGORIES:-1}"

echo "=== owasp_corpus_proof ==="
python3 scripts/generate_owasp_corpus.py
REAL_ATTACK_CORPUS="$ROOT/corpus/owasp_crs_test.access" \
REAL_ATTACK_MANIFEST="$ROOT/corpus/owasp_crs_manifest.json" \
REAL_ATTACK_SKIP_CATEGORIES="$REAL_ATTACK_SKIP_CATEGORIES" \
python3 scripts/real_attack_replay.py -o owasp-corpus-report.json || REPLAY_EXIT=$?
REPLAY_EXIT="${REPLAY_EXIT:-0}"

python3 <<'PY'
import json, sys
from pathlib import Path
d = json.loads(Path("owasp-corpus-report.json").read_text())
print(f"[owasp_corpus_proof] recall={d.get('attack_recall_pct')}% "
      f"lines={d.get('lines_total')} pass={d.get('pass')}")
for cat, info in sorted((d.get("categories") or {}).items()):
    if not info.get("pass"):
        print(f"  FAIL category {cat}: recall={info.get('recall_pct')}%", file=sys.stderr)
sys.exit(0 if d.get("pass") else 1)
PY
OWASP_EXIT=$?

[[ "$REPLAY_EXIT" -eq 0 && "$OWASP_EXIT" -eq 0 ]] || exit 1

if [[ -x "$ROOT/scripts/sync_dashboard_data.sh" ]]; then
  bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
fi
echo "[OK] owasp_corpus_proof -> owasp-corpus-report.json"
