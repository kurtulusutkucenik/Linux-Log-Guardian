#!/usr/bin/env bash
# Log Guardian vs CRS regex replay — ayni log corpus (ModSec/nginx proxy)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG="${BENCH_LOG:-corpus/bench_corpus.access}"
RULES="${BENCH_RULES:-test_rules.conf}"
WORKERS="${BENCH_WORKERS:-$(nproc 2>/dev/null || echo 4)}"
REPORT="${BENCH_VS_REPORT:-bench-vs-modsec.json}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ ! -f "$LOG" ]] || [[ "$(wc -l < "$LOG" | tr -d ' ')" -lt 100 ]]; then
  python3 scripts/generate_bench_corpus.py
  LOG="${BENCH_LOG:-corpus/bench_corpus.access}"
fi

LINES=$(wc -l < "$LOG" | tr -d ' ')
make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian >/dev/null

GUARDIAN_ELAPSED=$( ( /usr/bin/time -f '%e' ./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )
GUARDIAN_RSS=$( ( /usr/bin/time -f '%M' ./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )
GUARDIAN_EPS=$(awk -v e="$GUARDIAN_ELAPSED" -v l="$LINES" 'BEGIN {
  if (e+0 > 0) printf "%.0f", l/e; else print "0"
}')

CRS_JSON=$(python3 scripts/bench_crs_replay.py "$LOG" 2>/dev/null || echo '{}')
MODSEC_EPS=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('eps',0))" 2>/dev/null || echo "0")
MODSEC_ELAPSED=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('elapsed_sec',0))" 2>/dev/null || echo "0")
MODSEC_PATTERNS=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('patterns',0))" 2>/dev/null || echo "0")
MODSEC_NOTE="crs_regex_replay (OWASP CRS @rx seti, ayni log satirlari)"

if command -v nginx >/dev/null 2>&1; then
  MODSEC_NOTE="${MODSEC_NOTE}; nginx kurulu — tam inline ModSec icin docs/BENCHMARK.md"
fi

python3 - "$REPORT" "$LOG" "$LINES" "$WORKERS" "$GUARDIAN_EPS" "$GUARDIAN_ELAPSED" "$GUARDIAN_RSS" \
  "$MODSEC_EPS" "$MODSEC_ELAPSED" "$MODSEC_PATTERNS" "$MODSEC_NOTE" "$CRS_JSON" <<'PY'
import json, sys, datetime
from pathlib import Path
report, log, lines, workers = sys.argv[1:5]
g_eps, g_elapsed, g_rss = sys.argv[5:8]
m_eps, m_elapsed, m_patterns, m_note, crs_raw = sys.argv[8:13]
try:
    crs_detail = json.loads(crs_raw) if crs_raw.strip() else {}
except json.JSONDecodeError:
    crs_detail = {}
parity_path = Path("crs-parity-report.json")
parity = None
if parity_path.is_file():
    try:
        parity = json.load(parity_path.open(encoding="utf-8"))
    except json.JSONDecodeError:
        pass
g_eps_i, m_eps_i = int(g_eps or 0), int(m_eps or 0)
g_el_f, m_el_f = float(g_elapsed or 0), float(m_elapsed or 0)
lines_i = int(lines)
g_lat = round((g_el_f / lines_i) * 1_000_000, 2) if lines_i > 0 and g_el_f > 0 else 0
m_lat = crs_detail.get("latency_us_per_line") or (
    round((m_el_f / lines_i) * 1_000_000, 2) if lines_i > 0 and m_el_f > 0 else 0
)
ratio = round(g_eps_i / m_eps_i, 2) if m_eps_i > 0 else None
lat_ratio = round(m_lat / g_lat, 2) if g_lat > 0 and m_lat > 0 else None
obj = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "log": log,
    "lines": int(lines),
    "workers": int(workers),
    "log_guardian": {
        "eps": g_eps_i,
        "elapsed_sec": g_el_f,
        "latency_us_per_line": g_lat,
        "maxrss_kb": int(g_rss or 0),
        "rules": "test_rules.conf / CRS via PCRE2 JIT",
    },
    "modsecurity": {
        "eps": m_eps_i,
        "elapsed_sec": m_el_f,
        "latency_us_per_line": m_lat,
        "patterns": int(m_patterns or 0),
        "mode": crs_detail.get("mode", "crs_regex_replay"),
        "note": m_note,
    },
    "comparison": {
        "same_log_corpus": True,
        "guardian_eps_over_crs_replay": ratio,
        "crs_latency_over_guardian": lat_ratio,
        "summary": "Ayni corpus: Guardian tek gecis replay; ModSec tarafi CRS @rx regex replay (nginx inline degil). latency_us_per_line karsilastirmasi.",
    },
}
if parity:
    obj["crs_parity"] = {
        "attack_recall_pct": parity.get("guardian", {}).get("attack_recall_pct"),
        "parity_pct": parity.get("parity_pct"),
        "crs_pattern_count": parity.get("crs_pattern_count"),
        "pass": parity.get("pass"),
    }
with open(report, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)
print(json.dumps(obj, indent=2))
PY

echo "[bench_vs_modsec] $REPORT (lines=$LINES guardian_eps=$GUARDIAN_EPS crs_replay_eps=$MODSEC_EPS)"
