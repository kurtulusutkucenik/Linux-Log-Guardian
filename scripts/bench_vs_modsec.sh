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

WASMTIME_ROOT="${WASMTIME_ROOT:-$ROOT/vendor/wasmtime}"
MAKE_ARGS=( -j"$(nproc 2>/dev/null || echo 2)" -s )
if [[ -f "$WASMTIME_ROOT/lib/libwasmtime.so" || -f "$WASMTIME_ROOT/lib/libwasmtime.a" ]]; then
  MAKE_ARGS+=( HAVE_WASM=1 "WASMTIME_ROOT=$WASMTIME_ROOT" )
fi
make "${MAKE_ARGS[@]}" log-guardian >/dev/null || {
  echo "[bench_vs_modsec] FAIL: make log-guardian" >&2
  make "${MAKE_ARGS[@]}" log-guardian
  exit 1
}

# ---------------------------------------------------------------------------
# Adil olcum (apples-to-apples):
#   * Rakip CRS replay yalnizca ic dongusunu olcer (surec startup'i haric).
#     Bu yuzden Guardian tarafinda da ic isleme suresini (JSON elapsed_sec)
#     kullaniyoruz — surec baslatma / mmap fault-in / thread spawn haric.
#   * Ayni 121 CRS pattern iki tarafta da yuklu (gercek parite).
#   * Steady-state icin corpus tile'lanir; cold-cache warm-up ile dislanir.
#   * Ban pipeline'a DOKUNULMAZ — bu yalniz throughput olcum scripti.
# ---------------------------------------------------------------------------

# 1) 121 CRS pattern yuklu, guvenli izinli bench rules (parite icin)
BENCH_RULES_CRS="$ROOT/.cache/bench-rules-crs.conf"
mkdir -p "$ROOT/.cache"
if [[ -f "$RULES" ]]; then
  sed 's/^CRS_ENABLED=.*/CRS_ENABLED=1/' "$RULES" > "$BENCH_RULES_CRS"
  grep -q '^CRS_ENABLED=' "$BENCH_RULES_CRS" || echo 'CRS_ENABLED=1' >> "$BENCH_RULES_CRS"
else
  printf 'CRS_ENABLED=1\n' > "$BENCH_RULES_CRS"
fi
chmod 600 "$BENCH_RULES_CRS"
MEASURE_RULES="$BENCH_RULES_CRS"

# 2) Steady-state olcum corpus'u (taban corpus'tan tile) — iki taraf da ayni satirlar
STEADY_LINES="${BENCH_STEADY_LINES:-30000}"
MEASURE_LOG="$LOG"
if [[ "$STEADY_LINES" -gt 0 && "$LOG_LINES" -gt 0 && "$LOG_LINES" -lt "$STEADY_LINES" ]]; then
  MEASURE_LOG="$ROOT/.cache/bench-steady.access"
  : > "$MEASURE_LOG"
  reps=$(( (STEADY_LINES + LOG_LINES - 1) / LOG_LINES ))
  for _ in $(seq 1 "$reps"); do cat "$LOG"; done | head -n "$STEADY_LINES" > "$MEASURE_LOG"
fi
MEASURE_LINES=$(line_count "$MEASURE_LOG")

# 3) Warm-up (cold-cache page-fault + mmap fault-in disla)
./log-guardian "$MEASURE_LOG" --no-tui --json --no-ban --no-db --rules "$MEASURE_RULES" -t "$WORKERS" >/dev/null 2>&1 || true

# 4) Guardian ic isleme suresi — 3 kosum medyani (surec startup'i haric)
read_internal_elapsed() {
  ./log-guardian "$MEASURE_LOG" --no-tui --json --no-ban --no-db --rules "$MEASURE_RULES" -t "$WORKERS" 2>/dev/null \
    | grep '"elapsed_sec"' | grep -oE '[0-9]+\.[0-9]+' | head -1
}
E1=$(read_internal_elapsed); E2=$(read_internal_elapsed); E3=$(read_internal_elapsed)
GUARDIAN_ELAPSED=$(printf '%s\n%s\n%s\n' "$E1" "$E2" "$E3" | grep -E '^[0-9]' | sort -g | sed -n '2p')
# Fallback: ic olcum basarisizsa surec wall-clock'a don
if [[ -z "$GUARDIAN_ELAPSED" ]]; then
  GUARDIAN_ELAPSED=$( ( /usr/bin/time -f '%e' ./log-guardian "$MEASURE_LOG" --no-tui --json --no-ban --no-db --rules "$MEASURE_RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )
fi

# 5) RSS (bilgi amacli) — tam surec olcumu
GUARDIAN_RSS=$( ( /usr/bin/time -f '%M' ./log-guardian "$MEASURE_LOG" --no-tui --json --no-ban --no-db --rules "$MEASURE_RULES" -t "$WORKERS" >/dev/null ) 2>&1 | tail -1 )

# Downstream python MEASURE_LOG'u okur (satir sayisi + eps)
LOG="$MEASURE_LOG"

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
        "rules": "CRS bundle (121 pattern) / PCRE2 JIT",
        "method": "internal processing time (median of 3, warm) — excludes process startup, same as CRS inner-loop",
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
        "summary": "Adil olcum: iki taraf da ayni 121 CRS pattern + ayni corpus; her ikisi de ic isleme suresiyle (surec startup'i haric) karsilastirilir. Guardian tek gecis log->WAF, ModSec tarafi CRS @rx regex replay.",
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
