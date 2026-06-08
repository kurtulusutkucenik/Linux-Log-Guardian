#!/usr/bin/env bash
# Prod sertlestirme — Tier 3 + daemon L7 + CI kapilari
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail() { echo "[prod_hardening] FAIL: $*" >&2; exit 1; }

echo "=== prod_hardening ==="

make -s log-guardian log-guardian-daemon http_l7_probe.o 2>/dev/null || make -s log-guardian log-guardian-daemon

bash scripts/tier3_suite.sh
bash scripts/tier_gate_test.sh
if pgrep -x log-guardian-daemon >/dev/null 2>&1 || \
   systemctl is-active log-guardian-daemon >/dev/null 2>&1; then
  SOAK_REPORT=soak-report.short.json SOAK_SHORT=1 bash scripts/soak_test.sh
else
  echo "[SKIP] soak_test — daemon calismiyor (canli kurulumda SOAK_SHORT=1 calistirin)"
fi

bash scripts/security_hardening_test.sh

# daemon_stats L7 alanlari (GET/POST + probe)
grep -q 'l7_http_get' daemon_stats.c || fail "daemon_stats l7_http_get eksik"
grep -q 'l7_http_post' daemon_stats.c || fail "daemon_stats l7_http_post eksik"
grep -q 'l7_probe' main.c || fail "main.c daemon l7_probe eksik"

if command -v go >/dev/null 2>&1; then
  (cd k8s-operator && go build -o /tmp/guardian-k8s-op .)
  GUARDIAN_STANDALONE=1 PORT=18083 /tmp/guardian-k8s-op &
  op=$!
  sleep 1
  curl -sf -X POST http://127.0.0.1:18083/admit -H 'Content-Type: application/json' -d '{"apiVersion":"admission.k8s.io/v1","kind":"AdmissionReview","request":{"uid":"x","object":{"metadata":{"name":"p","namespace":"d","labels":{"security.log-guardian.io/deny":"true"}},"spec":{"containers":[{"name":"c","image":"nginx"}]}}}}' | grep -q '"allowed":false'
  kill $op 2>/dev/null || true
  echo "[OK] k8s operator build + admit"
else
  echo "[SKIP] go yok"
fi

echo "[OK] prod_hardening"
