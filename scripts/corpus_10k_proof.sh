#!/usr/bin/env bash
# Corpus 10K recall kaniti (rakip_kanit disinda — ~5-10 dk)
#   bash scripts/corpus_10k_proof.sh
#   REAL_ATTACK_CORPUS_LINES=10000 bash scripts/real_attack_suite.sh  # alternatif
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

# LINES bash readonly (terminal satir sayisi) — CORPUS_TARGET kullan
CORPUS_TARGET="${REAL_ATTACK_CORPUS_LINES:-10000}"
REPORT="${CORPUS_10K_REPORT:-real-attack-report-10k.json}"
TIMEOUT="${REAL_ATTACK_REPLAY_TIMEOUT:-900}"

echo "=== corpus_10k_proof ==="
echo "  hedef=${CORPUS_TARGET} satir  timeout=${TIMEOUT}s"

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

export REAL_ATTACK_CORPUS_LINES="$CORPUS_TARGET"
export REAL_ATTACK_REPLAY_TIMEOUT="$TIMEOUT"

python3 scripts/generate_attack_corpus.py
REAL_ATTACK_REPLAY_TIMEOUT="$TIMEOUT" python3 scripts/real_attack_replay.py -o "$REPORT"

python3 - "$REPORT" "$CORPUS_TARGET" <<'PY'
import json, sys
from pathlib import Path

report = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
target = int(sys.argv[2])
lines = report.get("lines_total", 0)
recall = report.get("attack_recall_pct", 0)
passed = report.get("pass", False)
print(f"[corpus_10k_proof] recall={recall}% lines={lines}/{target} pass={passed}")
if lines < target:
    raise SystemExit(f"corpus satir sayisi {lines} < {target}")
if not passed:
    raise SystemExit("recall hedefin altinda")
PY

cp -f "$REPORT" "${REPORT%.json}-snapshot.json" 2>/dev/null || true
bash scripts/sync_dashboard_data.sh 2>/dev/null || true

# Varsayilan 1K corpus'a geri don (rakip_kanit hizli kalsin)
export REAL_ATTACK_CORPUS_LINES=1000
python3 scripts/generate_attack_corpus.py

echo "[OK] corpus_10k_proof -> $REPORT"
echo "       Varsayilan corpus 1K'ya geri alindi (rakip_kanit icin)"
