#!/usr/bin/env bash
# Tum yerel E2E scriptleri (dashboard opsiyonel)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

FAILED=0
run_step() {
  local name="$1"
  local script="$2"
  echo ""
  echo "========== $name =========="
  if bash "$script"; then
    echo ">> $name OK"
  else
    echo ">> $name FAIL" >&2
    FAILED=1
  fi
}

run_step "smoke_test"      scripts/smoke_test.sh
run_step "incident_e2e"    scripts/incident_e2e.sh
run_step "lineage_e2e"      scripts/lineage_e2e.sh
run_step "falco_host_e2e"   scripts/falco_host_e2e.sh
run_step "fp_report"       scripts/fp_report.sh

DASH_URL="${DASH_URL:-http://127.0.0.1:3000}"
if curl -sf --max-time 2 "${DASH_URL}/api/telemetry" -o /dev/null 2>/dev/null \
   || curl -sf --max-time 2 "${DASH_URL}/login" -o /dev/null 2>/dev/null; then
  run_step "fleet_e2e" scripts/fleet_e2e.sh
else
  echo ""
  echo ">> fleet_e2e atlandi (dashboard: ${DASH_URL} erisilemiyor)"
fi

echo ""
if [[ "$FAILED" -eq 0 ]]; then
  echo "Tum zorunlu E2E adimlari gecti."
  exit 0
fi
echo "Bazi adimlar basarisiz." >&2
exit 1
