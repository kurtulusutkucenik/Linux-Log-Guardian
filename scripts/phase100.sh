#!/usr/bin/env bash
# Tum fazlar %100 kapisi (0-5)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ "${PHASE100_FAST:-0}" == "1" ]]; then
  export LG_QUIET_BUILD=1
  export PHASE0_BENCH_TIMEOUT="${PHASE0_BENCH_TIMEOUT:-90}"
  export BENCH_CRS_TIMEOUT="${BENCH_CRS_TIMEOUT:-90}"
  export COMPETITIVE_FAST=1
  echo "[phase100] PHASE100_FAST=1 — bench/soak/competitive kisaltildi"
fi

run() {
  local n="$1" s="$2"
  echo ""
  echo "========== Faz $n =========="
  if bash "$s"; then
    echo ">> Faz $n: 100%"
  else
    echo ">> Faz $n: FAIL ($s)" >&2
    exit 1
  fi
}

python3 scripts/generate_crs_bundle.py 2>/dev/null || true
if [[ ! -f test_access.log && -f corpus/bench_corpus.access ]]; then
  cp corpus/bench_corpus.access test_access.log
fi
if [[ ! -f test_schema_strict.log && -f corpus/schema_strict.access ]]; then
  cp corpus/schema_strict.access test_schema_strict.log
fi
if [[ ! -f test_schema_access.log ]]; then
  cat > test_schema_access.log <<'EOF'
203.0.113.42 - - [02/Jun/2026:10:00:01 +0300] "POST /api/login HTTP/1.1" 200 100 "-" "Mozilla/5.0"
203.0.113.42 - - [02/Jun/2026:10:00:02 +0300] "GET /api/users/42 HTTP/1.1" 200 100 "-" "Mozilla/5.0"
EOF
fi
if [[ ! -f test_incident_3hits.log ]]; then
  cat > test_incident_3hits.log <<'EOF'
10.0.0.99 - - [02/Jun/2026:10:00:01 +0300] "GET /search?q=1%27+UNION+SELECT+null HTTP/1.1" 200 100 "-" "sqlmap/1.0"
10.0.0.99 - - [02/Jun/2026:10:00:02 +0300] "GET /api?id=1;id; HTTP/1.1" 404 100 "-" "sqlmap/1.0"
10.0.0.99 - - [02/Jun/2026:10:00:03 +0300] "GET /admin?q=1%27+OR+%271%27%3D%271 HTTP/1.1" 403 100 "-" "sqlmap/1.0"
EOF
fi
if [[ ! -f test_graphql_access.log ]]; then
  cat > test_graphql_access.log <<'EOF'
10.8.0.61 - - [02/Jun/2026:10:00:02 +0300] "POST /graphql HTTP/1.1" 200 50 "-" "curl"
EOF
fi
LG_QUIET_BUILD="${LG_QUIET_BUILD:-0}" make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian log-guardian-daemon

run 0 scripts/phase0_e2e.sh
run 1 scripts/phase1_e2e.sh
run 2 scripts/phase2_caps_e2e.sh
run 3 scripts/phase3_e2e.sh
run 4 scripts/phase4_e2e.sh
run 5 scripts/phase5_e2e.sh

echo ""
echo "========== Rekabet kapisi (Faz 6) =========="
if bash scripts/competitive_suite.sh; then
  echo ">> Faz 6 (competitive): 100%"
else
  echo ">> Faz 6: FAIL (competitive_suite / competitive_gate)" >&2
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Faz 0-6: %100 — phase100 PASSED         ║"
echo "╚════════════════════════════════════════╝"
