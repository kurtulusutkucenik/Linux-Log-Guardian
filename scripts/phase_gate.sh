#!/usr/bin/env bash
# Faz 0-5 dosya/kapabilité kapı kontrolü (derleme + E2E)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

fail=0
need() {
  if [[ -e "$1" ]]; then echo "  OK $2"
  else echo "  FAIL eksik: $1 ($2)" >&2; fail=1; fi
}

echo "=== Faz 0 (production-ready) ==="
need main.c "core"
need ebpf_daemon.c "daemon"
need install.sh "installer"
need scripts/smoke_test.sh "smoke"

echo "=== Faz 1 (OpenAPI + CRS) ==="
need schema_validator.c "openapi"
need rules/crs-bundle.rules "crs bundle 120+"
need tenant_db.c "multi-tenant db"
need examples/openapi-mini.json "schema demo"
need waf_rules.c "waf+graphql"

echo "=== Faz 2 (lineage + incident) ==="
need lineage_probe.c "ebpf lineage"
need attack_tree.c "attack tree"
need incident_engine.c "incident"
need scripts/incident_e2e.sh "incident e2e"
need rules/falco-guardian-map.yaml "falco map"
need falco_host_rules.c "falco host ebpf rules"
need endpoint_baseline.c "endpoint 7d baseline"
need docs/TEST_MATRIX.md "test matrix"

echo "=== Faz 3 (API + k8s) ==="
need scripts/phase3_e2e.sh "phase3 e2e"
need test_graphql_access.log "graphql sample"
need k8s-operator/main.go "k8s operator"

echo "=== Faz 4 (fleet + grafana) ==="
need agent_sync.c "telemetry agent"
need rules_fleet.c "config push"
need dashboard/src/app/fleet/page.tsx "fleet ui"
need dashboard/src/app/api/fleet/commands/ack/route.ts "command ack"
need docs/FLEET_ONLINE.md "fleet guide"
need grafana-dashboard.json "grafana"
need docs/GRAFANA_SETUP.md "grafana doc"
need docs/ENTERPRISE_SUPPORT.md "enterprise"

echo "=== Faz 5 (wasm + copilot + mesh) ==="
need wasm_runtime.c "wasm engine"
need examples/plugins/README.md "plugins doc"
need dashboard/src/app/copilot/page.tsx "copilot ui"
need dashboard/src/app/api/copilot/route.ts "copilot api"
need scripts/phase100.sh "phase 100 gate"
need scripts/phase5_e2e.sh "phase5 e2e"

echo ""
make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian log-guardian-daemon
bash scripts/run-all-e2e.sh

if [[ "$fail" -eq 0 ]]; then
  echo ""
  echo "Faz 0-5 gate: PASSED"
else
  echo "Faz gate: bazi dosyalar eksik" >&2
  exit 1
fi
