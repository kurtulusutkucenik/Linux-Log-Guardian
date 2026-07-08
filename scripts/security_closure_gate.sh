#!/usr/bin/env bash
# Guvenlik kapatma kapisi — L3/L4 haric P0-P2 (Anthropic Skills eslemesi)
#   bash scripts/security_closure_gate.sh
#   SKIP_DOCKER=1 bash scripts/security_closure_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/gate_webhook_quiet.sh
source "$ROOT/scripts/lib/gate_webhook_quiet.sh"
gate_webhook_quiet_on
trap gate_webhook_quiet_off EXIT

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }
warn() { echo "[WARN] $*"; }

run() {
  local name="$1"
  shift
  echo ""
  echo "=== $name ==="
  if "$@"; then
    ok "$name"
  else
    bad "$name"
  fi
}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  security_closure_gate (L3/L4 haric)                     ║"
echo "╚══════════════════════════════════════════════════════════╝"

# P0 — secret / push hazirligi
run "pre_push_secret_scan" bash scripts/pre_push_secret_scan.sh

# P0 — XFF spoof
run "check_proxy_trust" bash scripts/check_proxy_trust.sh

# P0 — relay LAN sizintisi
run "relay_lan_exposure_check" bash scripts/relay_lan_exposure_check.sh

# P1 — IPC grup abuse
if [[ $EUID -eq 0 ]] || sudo -n true 2>/dev/null; then
  run "ipc_abuse_test" sudo bash scripts/ipc_abuse_test.sh
else
  warn "ipc_abuse_test — sudo gerekli (atlandi)"
fi

# P1 — marketplace imza
run "marketplace_sig_gate" bash scripts/marketplace_sig_gate.sh

# P1 — guvenlik profili
run "security_profile_e2e" bash scripts/security_profile_e2e.sh
run "openapi_strict_profile_check" bash scripts/openapi_strict_profile_check.sh
run "parser_fuzz_e2e" bash scripts/parser_fuzz_e2e.sh
run "ban_policy_audit_e2e" bash scripts/ban_policy_audit_e2e.sh
run "dist_risk_e2e" bash scripts/dist_risk_e2e.sh
run "dist_risk_proof_e2e" bash scripts/dist_risk_proof_e2e.sh

# P2 — wasm prod (native yoksa WARN)
echo ""
echo "=== wasm_prod_check ==="
if bash scripts/wasm_gate.sh >/dev/null 2>&1; then
  ok "wasm_gate (WASM_PROD_STRICT)"
else
  warn "wasm_gate atlandi — wasmtime yok veya dev mod"
fi

# wasm_gate make clean yapar — canli servisi yenile (API + nginx consult)
if [[ $EUID -eq 0 ]]; then
  if gate_restore_live_stack; then
    ok "gate_restore_live_stack"
  else
    warn "gate_restore_live_stack — API sorunlu; fix_analyzer kontrol edin"
  fi
fi

# P2 — ingest / SIEM / CrowdSec (hizli, sudo yok)
run "auth_log_e2e" bash scripts/auth_log_e2e.sh
run "journald_e2e" bash scripts/journald_e2e.sh

if command -v nginx >/dev/null 2>&1; then
  # Gercek consult testi — guvenli bypass gecici kapali
  if [[ $EUID -eq 0 ]]; then
    gate_nginx_consult_safe_off 2>/dev/null || true
    gate_wait_api_ready_authed 8090 || warn "API :8090 hazir degil — nginx consult zorlanabilir"
  fi
  run "nginx_inline_consult_e2e" bash scripts/nginx_inline_consult_e2e.sh
  # Test sonrasi tekrar bypass — siem/threat intel sirasinda internet kesilmesin
  if [[ $EUID -eq 0 ]]; then
    gate_nginx_consult_safe_on 2>/dev/null || true
  fi
else
  warn "nginx_inline_consult_e2e — nginx yok"
fi

# consult flood API'yi yorar — inline consult SONRASI (nginx auth_request tikanmasin)
run "consult_rate_proof" bash scripts/consult_rate_proof.sh

echo ""
echo "=== siem_export_e2e ==="
if [[ "${SKIP_SIEM_E2E:-0}" == "1" ]]; then
  warn "siem_export_e2e — SKIP_SIEM_E2E=1"
else
  run "siem_export_e2e" bash scripts/siem_export_e2e.sh
fi

run "crowdsec_bouncer_e2e" bash scripts/crowdsec_bouncer_e2e.sh
run "taxii_feed_e2e" bash scripts/taxii_feed_e2e.sh
run "lineage_incident_e2e" bash scripts/lineage_incident_e2e.sh

# Docker internal relay dogrulama
if [[ "${SKIP_DOCKER:-0}" != "1" ]] && command -v docker >/dev/null 2>&1; then
  echo ""
  echo "=== docker_relay_internal ==="
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-ban-api-relay; then
    net="$(docker inspect log-guardian-ban-api-relay --format '{{.HostConfig.NetworkMode}}' 2>/dev/null || echo ?)"
    if [[ "$net" == "host" ]]; then
      bad "ban-api-relay hala host network — docker-compose.prod.yml guncelle"
    else
      ok "ban-api-relay network=$net (internal)"
    fi
  else
    warn "dashboard stack kapali — relay internal dogrulama atlandi"
  fi
fi

run "dashboard_security_gates" bash scripts/dashboard_security_gates.sh

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] security_closure_gate — $fail FAIL"
  exit 0
fi
echo "[FAIL] security_closure_gate — $fail madde" >&2
exit 1
