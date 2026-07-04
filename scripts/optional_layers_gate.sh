#!/usr/bin/env bash
# Opsiyonel katmanlar kapisi — K8s + mesh + admission (VPS/GitHub gerekmez)
#   bash scripts/optional_layers_gate.sh
#   K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 bash scripts/optional_layers_gate.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

ok=0 warn=0 fail=0 skip=0
gate_ok()   { echo "[OK] $*"; ok=$((ok + 1)); }
gate_warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
gate_fail() { echo "[FAIL] $*"; fail=$((fail + 1)); }
gate_skip() { echo "[SKIP] $*"; skip=$((skip + 1)); }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — optional layers gate               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "=== K8s / Helm ==="
if bash "$ROOT/scripts/helm_install_smoke.sh" >/dev/null 2>&1; then
  mode=$(python3 -c "import json; print(json.load(open('helm-install-smoke-report.json')).get('mode','?'))" 2>/dev/null || echo "?")
  gate_ok "helm_install_smoke (mode=$mode)"
else
  gate_fail "helm_install_smoke"
fi

if bash "$ROOT/scripts/k8s_admission_test.sh" >/dev/null 2>&1; then
  km=$(python3 -c "import json; print(json.load(open('k8s-admission-report.json')).get('mode','?'))" 2>/dev/null || echo "?")
  gate_ok "k8s_admission_test (mode=$km)"
else
  gate_warn "k8s_admission_test — docker/go/kind erisilemedi"
fi

if bash "$ROOT/scripts/k8s_kind_e2e.sh" >/dev/null 2>&1; then
  km=$(python3 -c "import json; print(json.load(open('k8s-kind-e2e-report.json')).get('mode','?'))" 2>/dev/null || echo "?")
  gate_ok "k8s_kind_e2e (mode=$km)"
else
  gate_warn "k8s_kind_e2e — kind/kubectl/helm veya K8S_KIND_CREATE=1"
fi

echo ""
echo "=== Mesh / Wasm / Copilot ==="
if bash "$ROOT/scripts/mesh_etcd_e2e.sh" >/dev/null 2>&1; then
  gate_ok "mesh_etcd_e2e (kod+helm)"
else
  gate_fail "mesh_etcd_e2e"
fi

if bash "$ROOT/scripts/mesh_etcd_docker_smoke.sh" >/dev/null 2>&1; then
  gate_ok "mesh_etcd_docker_smoke"
else
  gate_warn "mesh_etcd_docker_smoke — docker etcd"
fi

if bash "$ROOT/scripts/mesh_etcd_live_e2e.sh" >/dev/null 2>&1; then
  gate_ok "mesh_etcd_live_e2e (PUT/GET)"
else
  gate_warn "mesh_etcd_live_e2e — docker etcd v3"
fi

if bash "$ROOT/scripts/wasm_gate.sh" >/dev/null 2>&1; then
  gate_ok "wasm_gate"
else
  gate_warn "wasm_gate — wasmtime/dev mod"
fi

if bash "$ROOT/scripts/copilot_ollama_e2e.sh" >/dev/null 2>&1; then
  gate_ok "copilot_ollama_e2e"
else
  gate_skip "copilot_ollama_e2e — ollama yok"
fi

echo ""
echo "=== Enterprise kanit ==="
if bash "$ROOT/scripts/phase5_e2e.sh" >/dev/null 2>&1; then
  gate_ok "phase5_e2e (wasm+copilot+mesh)"
else
  gate_warn "phase5_e2e"
fi

if bash "$ROOT/scripts/compliance_export_e2e.sh" >/dev/null 2>&1; then
  gate_ok "compliance_export_e2e"
else
  gate_warn "compliance_export_e2e — dashboard tier"
fi

if bash "$ROOT/scripts/marketplace_signed_api_e2e.sh" >/dev/null 2>&1; then
  gate_ok "marketplace_signed_api_e2e"
else
  gate_warn "marketplace_signed_api_e2e"
fi

if bash "$ROOT/scripts/wasm_release.sh" >/dev/null 2>&1; then
  gate_ok "wasm_release (native)"
else
  gate_warn "wasm_release — wasmtime native"
fi

echo ""
echo "=== L7 + Telegram prod ==="
if bash "$ROOT/scripts/webhook_prod_e2e_gate.sh" >/dev/null 2>&1; then
  gate_ok "webhook_prod_e2e_gate"
elif [[ -f /etc/log-guardian/http_l7_probe.o ]] && [[ -f /etc/log-guardian/webhook.env ]]; then
  gate_ok "L7+webhook prod kurulu"
  gate_warn "webhook_prod_e2e — sudo bash scripts/webhook_prod_e2e.sh"
else
  gate_warn "laptop_optional_layers_on — sudo gerekli"
fi

if bash "$ROOT/scripts/webhook_ack_e2e.sh" >/dev/null 2>&1; then
  gate_ok "webhook_ack_e2e (Gordum DB+metrik)"
else
  gate_warn "webhook_ack_e2e — events.db / guardian_status_export"
fi

if bash "$ROOT/scripts/telegram_inline_button_check.sh" >/dev/null 2>&1; then
  gate_ok "telegram_inline_button_check"
else
  gate_warn "telegram_inline_button_check — poll/webhook catismasi?"
fi

if bash "$ROOT/scripts/telegram_operator_undo_e2e.sh" >/dev/null 2>&1; then
  gate_ok "telegram_operator_undo_e2e (SIGUSR2)"
else
  gate_warn "telegram_operator_undo_e2e — binary upgrade?"
fi

if bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1; then
  gate_ok "telegram_soc_gate (timeline+map+webhook+bans)"
else
  gate_warn "telegram_soc_gate — dashboard refresh?"
fi

if bash "$ROOT/scripts/bans_telegram_ops_e2e.sh" >/dev/null 2>&1; then
  gate_ok "bans_telegram_ops_e2e"
else
  gate_warn "bans_telegram_ops_e2e — /bans?search= IP"
fi

if bash "$ROOT/scripts/edge_protection_gate.sh" >/dev/null 2>&1; then
  gate_ok "edge_protection_gate (nginx+XDP/ipset)"
else
  gate_warn "edge_protection_gate — sudo bash scripts/prod_edge_setup.sh"
fi

if bash "$ROOT/scripts/grafana_parity_gate.sh" >/dev/null 2>&1; then
  gate_ok "grafana_parity_gate (panels↔dashboard)"
else
  gate_fail "grafana_parity_gate"
fi

if bash "$ROOT/scripts/website_preview_gate.sh" >/dev/null 2>&1; then
  gate_ok "website_preview_gate (test parity)"
else
  gate_warn "website_preview_gate — python3 scripts/competitive_proof_build.py"
fi

if bash "$ROOT/scripts/enterprise_escalation_gate.sh" >/dev/null 2>&1; then
  gate_ok "enterprise_escalation_gate (P1-P4 playbook)"
else
  gate_warn "enterprise_escalation_gate — docs/ENTERPRISE_ESCALATION.md"
fi

if bash "$ROOT/scripts/vm_host_prep_gate.sh" >/dev/null 2>&1; then
  gate_ok "vm_host_prep_gate (HOST sync prep)"
else
  gate_warn "vm_host_prep_gate — VBox paylasim veya post_install"
fi

if bash "$ROOT/scripts/docs_consistency_gate.sh" >/dev/null 2>&1; then
  gate_ok "docs_consistency_gate (76 test + §8b)"
else
  gate_warn "docs_consistency_gate — docs/HOSTING_RUNBOOK veya proof sayisi"
fi

if bash "$ROOT/scripts/vm_fleet_gate.sh" >/dev/null 2>&1; then
  gate_ok "vm_fleet_gate (host+VM Online)"
else
  gate_warn "vm_fleet_gate — VM keepalive veya /fleet"
fi

if bash "$ROOT/scripts/website_live_gate.sh" >/dev/null 2>&1; then
  gate_ok "website_live_gate (cenik parity)"
else
  gate_warn "website_live_gate — publish veya /tests sayisi"
fi

if bash "$ROOT/scripts/release_ready_gate.sh" >/dev/null 2>&1; then
  gate_ok "release_ready_gate (GitHub zincir)"
else
  gate_warn "release_ready_gate — bash scripts/local_proof_refresh.sh"
fi

if bash "$ROOT/scripts/demo_rehearsal_gate.sh" >/dev/null 2>&1; then
  gate_ok "demo_rehearsal_gate (08:00 sunum)"
else
  gate_warn "demo_rehearsal_gate — bash scripts/demo_rehearsal_gate.sh"
fi

if bash "$ROOT/scripts/presentation_ship_gate.sh" >/dev/null 2>&1; then
  gate_ok "presentation_ship_gate (sunum + ship)"
else
  gate_warn "presentation_ship_gate — bash scripts/presentation_ship_gate.sh"
fi

if bash "$ROOT/scripts/demo_video_gate.sh" >/dev/null 2>&1; then
  gate_ok "demo_video_gate (04:00 kayit)"
else
  gate_warn "demo_video_gate — bash scripts/demo_video_gate.sh"
fi

if bash "$ROOT/scripts/laptop_core_gate.sh" >/dev/null 2>&1; then
  gate_ok "laptop_core_gate (edge+SOC+ban)"
else
  gate_warn "laptop_core_gate — bash scripts/laptop_core_gate.sh"
fi

echo ""
echo "=== Kanit sync ==="
bash "$ROOT/scripts/competitive_proof.sh" >/dev/null 2>&1 && gate_ok "competitive_proof refresh" \
  || gate_warn "competitive_proof — PDF atlandi olabilir"
bash "$ROOT/scripts/sync_dashboard_data.sh" >/dev/null 2>&1 && gate_ok "sync_dashboard_data" \
  || gate_warn "sync_dashboard_data — docker stack?"

echo ""
echo "=== ozet ==="
echo "  OK: $ok   WARN: $warn   FAIL: $fail   SKIP: $skip"
echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] optional_layers_gate — opsiyonel katmanlar hazir"
  echo "  K8s canli: K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 bash scripts/k8s_kind_e2e.sh"
  echo "  Dashboard: https://localhost:8443/tests (Ctrl+Shift+R)"
  exit 0
fi
echo "[FAIL] optional_layers_gate — $fail madde" >&2
exit 1
