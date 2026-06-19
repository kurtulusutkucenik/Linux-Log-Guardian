#!/usr/bin/env bash
# Log Guardian vs CRS regex replay — ayni log corpus (ModSec/nginx proxy)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Bosluklu mutlak yol + BENCH_LOG kirliligi onlenir — her zaman repo-relative corpus
unset BENCH_LOG 2>/dev/null || true
LOG="corpus/bench_corpus.access"
RULES="${BENCH_RULES:-test_rules.conf}"
WORKERS="${BENCH_WORKERS:-$(nproc 2>/dev/null || echo 4)}"
REPORT="${BENCH_VS_REPORT:-bench-vs-modsec.json}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

BENCH_MIN_LINES="${BENCH_MIXED_MIN:-1500}"
line_count() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo 0
    return
  fi
  wc -l < "$f" | tr -d ' '
}

LOG_LINES=$(line_count "$LOG")
if [[ "$LOG_LINES" -lt "$BENCH_MIN_LINES" ]]; then
  BENCH_MIXED_MIN="$BENCH_MIN_LINES" python3 scripts/generate_bench_corpus.py
  LOG_LINES=$(line_count "$LOG")
fi
[[ "$LOG_LINES" -ge 100 ]] || {
  echo "[bench_vs_modsec] FAIL: bench corpus yetersiz ($LOG_LINES satir, min 100) — $ROOT/$LOG" >&2
  exit 1
}

make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian >/dev/null

GUARDIAN_ELAPSED=$( ( /usr/bin/time -f '%e' ./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )
GUARDIAN_RSS=$( ( /usr/bin/time -f '%M' ./log-guardian "$LOG" --no-tui --json --no-ban --no-db --rules "$RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )

CRS_JSON=$(python3 scripts/bench_crs_replay.py "$LOG" 2>/dev/null || echo '{}')
MODSEC_EPS=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('eps',0))" 2>/dev/null || echo "0")
MODSEC_ELAPSED=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('elapsed_sec',0))" 2>/dev/null || echo "0")
MODSEC_PATTERNS=$(echo "$CRS_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('patterns',0))" 2>/dev/null || echo "0")
MODSEC_NOTE="crs_regex_replay (OWASP CRS @rx seti, ayni log satirlari)"

if command -v nginx >/dev/null 2>&1; then
  MODSEC_NOTE="${MODSEC_NOTE}; nginx kurulu — tam inline ModSec icin docs/BENCHMARK.md"
fi

export LG_BENCH_LOG="$LOG" LG_BENCH_REPORT="$REPORT" LG_BENCH_WORKERS="$WORKERS"
export LG_BENCH_G_ELAPSED="$GUARDIAN_ELAPSED" LG_BENCH_G_RSS="$GUARDIAN_RSS"
export LG_BENCH_M_EPS="$MODSEC_EPS" LG_BENCH_M_ELAPSED="$MODSEC_ELAPSED"
export LG_BENCH_M_PATTERNS="$MODSEC_PATTERNS" LG_BENCH_M_NOTE="$MODSEC_NOTE"
export LG_BENCH_CRS_JSON="$CRS_JSON"

python3 <<'PY'
import json
import os
import datetime
from pathlib import Path

report = Path(os.environ["LG_BENCH_REPORT"])
log = Path(os.environ["LG_BENCH_LOG"])
workers = int(os.environ["LG_BENCH_WORKERS"])
g_elapsed = float(os.environ.get("LG_BENCH_G_ELAPSED") or 0)
g_rss = int(os.environ.get("LG_BENCH_G_RSS") or 0)
m_eps = int(os.environ.get("LG_BENCH_M_EPS") or 0)
m_elapsed = float(os.environ.get("LG_BENCH_M_ELAPSED") or 0)
m_patterns = int(os.environ.get("LG_BENCH_M_PATTERNS") or 0)
m_note = os.environ.get("LG_BENCH_M_NOTE") or ""
crs_raw = os.environ.get("LG_BENCH_CRS_JSON") or "{}"

lines_i = sum(1 for ln in log.read_text(encoding="utf-8", errors="replace").splitlines() if ln.strip())
g_eps = int(lines_i / g_elapsed) if g_elapsed > 0 else 0
g_lat = round((g_elapsed / lines_i) * 1_000_000, 2) if lines_i > 0 and g_elapsed > 0 else 0

try:
    crs_detail = json.loads(crs_raw) if crs_raw.strip() else {}
except json.JSONDecodeError:
    crs_detail = {}
m_lat = crs_detail.get("latency_us_per_line") or (
    round((m_elapsed / lines_i) * 1_000_000, 2) if lines_i > 0 and m_elapsed > 0 else 0
)
ratio = round(g_eps / m_eps, 2) if m_eps > 0 else None
lat_ratio = round(m_lat / g_lat, 2) if g_lat > 0 and m_lat > 0 else None

obj = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "log": str(log),
    "lines": lines_i,
    "workers": workers,
    "log_guardian": {
        "eps": g_eps,
        "elapsed_sec": g_elapsed,
        "latency_us_per_line": g_lat,
        "maxrss_kb": g_rss,
        "rules": "test_rules.conf / CRS via PCRE2 JIT",
    },
    "modsecurity": {
        "eps": m_eps,
        "elapsed_sec": m_elapsed,
        "latency_us_per_line": m_lat,
        "patterns": m_patterns,
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
parity_path = Path("crs-parity-report.json")
if parity_path.is_file():
    try:
        parity = json.loads(parity_path.read_text(encoding="utf-8"))
        obj["crs_parity"] = {
            "attack_recall_pct": parity.get("guardian", {}).get("attack_recall_pct"),
            "parity_pct": parity.get("parity_pct"),
            "crs_pattern_count": parity.get("crs_pattern_count"),
            "pass": parity.get("pass"),
        }
    except json.JSONDecodeError:
        pass

report.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")
print(json.dumps(obj, indent=2))
print(f"[bench_vs_modsec] {report} (lines={lines_i} guardian_eps={g_eps} crs_replay_eps={m_eps})")
PY
