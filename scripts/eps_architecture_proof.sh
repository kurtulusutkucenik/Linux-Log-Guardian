#!/usr/bin/env bash
# EPS mimari fark — dürüst bench (ayni corpus, farkli mimari mesaji)
#   bash scripts/eps_architecture_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${EPS_ARCH_REPORT:-eps-architecture-report.json}"
BENCH_MIN="${BENCH_MIXED_MIN:-1500}"
BENCH_CORPUS="corpus/bench_corpus.access"

fail() { echo "[eps_architecture] FAIL: $*" >&2; exit 1; }

echo "=== eps_architecture_proof ==="
echo "  bench corpus min=${BENCH_MIN} satir"

# Mutlak/bosluklu BENCH_LOG ortam kirliligini temizle (bench_vs_modsec relative corpus kullanir)
unset BENCH_LOG 2>/dev/null || true

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

BENCH_MIXED_MIN="$BENCH_MIN" python3 scripts/generate_bench_corpus.py
LINES=$(wc -l < "$BENCH_CORPUS" | tr -d ' ')
[[ "${LINES:-0}" -ge 500 ]] || fail "bench_corpus yetersiz ($LINES satir)"
echo "[eps_architecture] bench_corpus=$BENCH_CORPUS lines=$LINES"

BENCH_MIXED_MIN="$BENCH_MIN" bash scripts/bench_vs_modsec.sh

python3 - "$REPORT" "$BENCH_MIN" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report_path = Path(sys.argv[1])
bench_min = int(sys.argv[2])
bench = json.loads(Path("bench-vs-modsec.json").read_text(encoding="utf-8"))
g = bench.get("log_guardian") or {}
m = bench.get("modsecurity") or {}
cmp_ = bench.get("comparison") or {}
lines = int(bench.get("lines") or 0)
g_eps, m_eps = int(g.get("eps") or 0), int(m.get("eps") or 0)
ratio = round(g_eps / m_eps, 4) if m_eps > 0 else None

data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "mode": "eps_architecture_honest",
    "bench_corpus": bench.get("log"),
    "lines": lines,
    "bench_mixed_min": bench_min,
    "log_guardian": {
        "eps": g_eps,
        "latency_us_per_line": g.get("latency_us_per_line"),
        "architecture": "single-pass log tail + WAF + ban pipeline",
    },
    "crs_regex_replay": {
        "eps": m_eps,
        "latency_us_per_line": m.get("latency_us_per_line"),
        "architecture": "offline @rx regex replay (nginx inline ModSec degil)",
    },
    "comparison": {
        "same_log_corpus": True,
        "guardian_over_crs_eps_ratio": ratio,
        "crs_latency_over_guardian": cmp_.get("crs_latency_over_guardian"),
    },
    "positioning": {
        "tr": "EPS farki mimari — Log Guardian log→WAF→ban; CRS replay hiz referansi. Yarismiyoruz.",
        "en": "EPS gap is architectural — log-WAF-ban vs regex replay reference. Not a speed race.",
    },
    "pass": lines >= 500 and g_eps > 0 and m_eps > 0,
    "note": "docs/BENCHMARK.md — referans only",
}
report_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[eps_architecture] lines={lines} guardian={g_eps} crs_replay={m_eps} ratio={ratio} pass={data['pass']}")
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true

python3 -c "import json; d=json.load(open('$REPORT')); exit(0 if d.get('pass') else 1)" || fail "EPS bench eksik (lines=$LINES — unset BENCH_LOG; corpus/bench_corpus.access kullanilir)"
echo "[OK] eps_architecture_proof -> $REPORT"
