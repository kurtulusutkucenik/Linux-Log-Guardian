#!/usr/bin/env bash
# Faz 0 — kurulum dosyalari + verify + bench (kisa)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

test -x install.sh || chmod +x install.sh
test -f docs/QUICKSTART_NGINX.md
test -f docs/OPERATIONS.md
test -f docs/TEST_MATRIX.md
test -x scripts/ops_health.sh
test -x scripts/ops_smoke.sh
! grep -qi 'work in progress' README.md

bash scripts/verify_rules_conf.sh

if [[ ! -f test_access.log && -f corpus/bench_corpus.access ]]; then
  cp corpus/bench_corpus.access test_access.log
fi
test -f test_access.log || { echo "[phase0] test_access.log yok" >&2; exit 1; }

if [[ ! -x ./log-guardian && -x /usr/local/bin/log-guardian ]]; then
  echo "[phase0] repo binary yok — /usr/local/bin/log-guardian kullaniliyor"
  export PATH="/usr/local/bin:$PATH"
fi

BENCH_TIMEOUT="${PHASE0_BENCH_TIMEOUT:-180}"
if ! timeout "$BENCH_TIMEOUT" bash scripts/bench_report.sh; then
  rc=$?
  echo "[phase0] bench_report FAIL (rc=$rc, timeout=${BENCH_TIMEOUT}s)" >&2
  [[ -f bench-report.txt ]] || exit "$rc"
  echo "[phase0] bench-report.txt mevcut — devam (rapor eski olabilir)" >&2
fi
test -f bench-report.txt

# 7/24 smoke (systemd yoksa smoke_test'e duser)
bash scripts/ops_smoke.sh 2>/dev/null || bash scripts/smoke_test.sh

echo "OK — phase0_e2e"
