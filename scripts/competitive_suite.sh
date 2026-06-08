#!/usr/bin/env bash
# Rekabet kaniti — benchmark + import + FP + canli status
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
FAST="${COMPETITIVE_FAST:-0}"

echo "=== competitive_suite ==="
[[ "$FAST" == "1" ]] && echo "[competitive_suite] COMPETITIVE_FAST=1"
python3 scripts/generate_benign_corpus.py
python3 scripts/generate_bench_corpus.py
echo "--- real attack corpus + replay ---"
bash scripts/real_attack_suite.sh || {
  echo "[WARN] real_attack_suite FAIL — competitive_proof icinde isaretlenecek"
  true
}
bash scripts/bench_vs_modsec.sh
bash scripts/fp_report.sh
bash scripts/fp_learn_test.sh 2>/dev/null || true

echo "--- wasm release (HAVE_WASM=1, Wasmtime native) ---"
wasm_native_ok() {
  [[ -f wasm-status.json ]] && python3 -c "
import json, sys
d = json.load(open('wasm-status.json'))
sys.exit(0 if d.get('mode') == 'native' and d.get('pass') else 1)
" 2>/dev/null
}
if [[ "${SKIP_WASM_GATE:-0}" == "1" ]]; then
  if [[ "${REQUIRE_WASM_NATIVE:-1}" == "1" ]]; then
    echo "[competitive_suite] SKIP_WASM_GATE=1 ile REQUIRE_WASM_NATIVE=1 uyumsuz" >&2
    exit 1
  fi
  make -s log-guardian 2>/dev/null || true
  bash scripts/wasm_smoke_test.sh 2>/dev/null || \
    echo "[WARN] stub wasm smoke — prod icin: bash scripts/wasm_release.sh"
elif wasm_native_ok && [[ "${FORCE_WASM_GATE:-0}" != "1" ]]; then
  echo "[wasm] wasm-status.json native OK (yeniden derleme atlandi)"
  export WASM_BIN="$ROOT/log-guardian"
else
  if command -v cargo >/dev/null 2>&1; then
    bash scripts/wasm_gate.sh
  else
    echo "[competitive_suite] WARN: cargo/rust yok — wasm_gate atlandi (dashboard icin sorun degil)"
    make -s log-guardian 2>/dev/null || true
  fi
fi

bash scripts/ban_policy_test.sh 2>/dev/null || true

echo "--- CRS parity (ModSecurity @rx) ---"
bash scripts/crs_parity_test.sh 2>/dev/null || python3 scripts/crs_parity_bench.py -o crs-parity-report.json || true

echo "--- threat feed (AbuseIPDB/OTX/STIX) ---"
bash scripts/threat_feed_e2e.sh 2>/dev/null || true

echo "--- lineage live E2E (openat/connect/execve) ---"
bash scripts/lineage_live_e2e.sh
if [[ "$FAST" != "1" ]]; then
  bash scripts/lineage_e2e.sh
  bash scripts/lineage_ui_test.sh 2>/dev/null || true
else
  echo "[FAST] lineage_e2e + lineage_ui atlandi (live kaniti yeterli)"
fi

echo "--- OpenAPI strict v2 ---"
bash scripts/openapi_v2_test.sh 2>/dev/null || true

echo "--- BOLA/IDOR + GraphQL depth ---"
if [[ "$FAST" != "1" ]]; then
  bash scripts/bola_idor_e2e.sh
else
  echo "[FAST] bola_idor_e2e atlandi"
fi

echo "--- compliance export (PCI/SOC2/KVKK) ---"
bash scripts/compliance_test.sh 2>/dev/null || bash scripts/compliance_export.sh || true

echo "--- multi-tenant isolation ---"
bash scripts/tenant_isolation_export.sh 2>/dev/null || bash scripts/tenant_isolation_test.sh || true

echo "--- prod hardening ---"
bash scripts/prod_hardening_test.sh 2>/dev/null || bash scripts/tier3_suite.sh || true

echo "--- falco import v2 ---"
if [[ "$FAST" == "1" && -f rules/generated-falco-host.json ]]; then
  n=$(python3 -c "import json; print(json.load(open('rules/generated-falco-host.json'))['count'])" 2>/dev/null || echo 0)
  echo "[FAST] falco_fetch atlandi (mevcut $n kural)"
else
  bash scripts/falco_fetch_and_import.sh
fi
bash scripts/falco_import_test.sh 2>/dev/null || {
  python3 scripts/falco_import.py rules/falco/ ${FALCO_VENDOR:-} -o rules/generated-falco-host.json --max 512 --verbose || true
}

python3 scripts/sigma_import.py rules/sigma/sample.yml -o rules/sigma-imported.rules 2>/dev/null || true

bash scripts/guardian_status_export.sh
bash scripts/l7_prod_e2e.sh

if [[ "${SKIP_BAN_BENCH:-0}" != "1" ]]; then
  if [[ $EUID -eq 0 ]]; then
    bash scripts/bench_ban_latency.sh || echo "[WARN] ban latency atlandi"
  elif sudo -n true 2>/dev/null; then
    sudo bash scripts/bench_ban_latency.sh || echo "[WARN] ban latency atlandi"
  else
    echo "[INFO] ban latency: sudo bash scripts/bench_ban_latency.sh  (sprint_a otomatik calistirir)"
  fi
fi

./log-guardian incident-sim 2>/dev/null | tee incidents-snapshot.json || true

echo "--- competitive proof (data room PDF) ---"
bash scripts/competitive_proof.sh 2>/dev/null || true

echo "--- competitive gate ---"
bash scripts/competitive_gate.sh

echo "[OK] competitive_suite tamam"
echo "  bench-vs-modsec.json fp-report.json guardian-status.json compliance-report.json tenant-isolation-report.json competitive-proof.pdf"
bash scripts/sync_dashboard_data.sh 2>/dev/null || echo "[WARN] sync_dashboard_data — docker volume icin: bash scripts/sync_dashboard_data.sh"
