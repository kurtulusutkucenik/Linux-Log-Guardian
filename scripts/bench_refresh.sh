#!/usr/bin/env bash
# P2 #7 — ModSecurity EPS/latency karsilastirmasi guncelle + kanit sync
#   bash scripts/bench_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== bench_refresh (P2 #7) ==="
bash scripts/bench_vs_modsec.sh
bash scripts/fp_report.sh 2>/dev/null || true
bash scripts/bench_ban_latency.sh 2>/dev/null || true
bash scripts/sync_evidence_pack.sh
python3 scripts/competitive_proof_build.py -o competitive-proof.json

python3 -c "
import json
from pathlib import Path
b=json.load(open('bench-vs-modsec.json'))
lg=b.get('log_guardian',{}).get('eps',0)
fp_path=Path('fp-report.json')
fp=json.loads(fp_path.read_text()) if fp_path.is_file() else {}
fp_pct=(fp.get('benign') or {}).get('fp_rate_pct','?')
print(f'[OK] bench_refresh — guardian_eps={lg} fp={fp_pct}%')
"
