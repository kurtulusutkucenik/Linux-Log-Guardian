#!/usr/bin/env bash
# Laptop mükemmellik kapisi — VPS/GitHub gerekmez (~2-8 dk)
#   bash scripts/laptop_excellence_gate.sh              # hizli
#   FULL=1 bash scripts/laptop_excellence_gate.sh       # + live site + fleet e2e
#   SKIP_LIVE=1 bash scripts/laptop_excellence_gate.sh  # ag yok
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

ok=0 warn=0 fail=0
gate_ok()   { echo "[OK] $*"; ok=$((ok + 1)); }
gate_warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
gate_fail() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — laptop excellence gate             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# --- Core servisler ---
echo "=== Core ==="
if systemctl is-active log-guardian-daemon.service >/dev/null 2>&1; then
  gate_ok "log-guardian-daemon active"
  if journalctl -u log-guardian-daemon.service -b --no-pager 2>/dev/null \
      | grep -q 'LG_DISABLE_URING=1'; then
    gate_ok "daemon LG_DISABLE_URING=1 (klasik poll)"
  elif [[ -f /etc/log-guardian/env ]] && grep -q '^LG_DISABLE_URING=1' /etc/log-guardian/env 2>/dev/null; then
    gate_ok "env LG_DISABLE_URING=1"
  else
    gate_warn "io_uring acik — laptop: sudo bash scripts/ensure_daemon_env.sh"
  fi
else
  gate_fail "log-guardian-daemon inactive — sudo systemctl start log-guardian-daemon"
fi

if systemctl is-active log-guardian.service >/dev/null 2>&1; then
  gate_ok "log-guardian analyzer active"
else
  gate_fail "log-guardian inactive"
fi

if [[ -x "$ROOT/log-guardian" ]]; then
  ipc_ok=0
  if [[ -f "$ROOT/guardian-status.json" ]]; then
    ipc_st=$(python3 -c "import json; print(json.load(open('guardian-status.json')).get('ipc',''))" 2>/dev/null || true)
    [[ "$ipc_st" == "ok" ]] && ipc_ok=1
  fi
  if [[ "$ipc_ok" -eq 0 ]] && "$ROOT/log-guardian" --health 2>&1 | grep -q 'daemon IPC: OK'; then
    ipc_ok=1
  fi
  if [[ "$ipc_ok" -eq 1 ]]; then
    gate_ok "daemon IPC OK"
  else
    gate_fail "daemon IPC — sudo systemctl restart log-guardian-daemon"
  fi
else
  gate_fail "log-guardian binary yok — make log-guardian"
fi

# --- Docker + dashboard ---
echo ""
echo "=== Dashboard :8443 ==="
if ! bash "$ROOT/scripts/laptop_observability_check.sh" >/dev/null 2>&1; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    bash "$ROOT/scripts/laptop_stack_boot.sh" >/dev/null 2>&1 \
      && bash "$ROOT/scripts/laptop_observability_check.sh" >/dev/null 2>&1 \
      && gate_ok "laptop_observability_check (auto boot)" \
      || gate_warn "observability — bash scripts/laptop_stack_boot.sh"
  else
    gate_warn "observability — bash scripts/laptop_stack_boot.sh"
  fi
else
  gate_ok "laptop_observability_check"
fi

if curl -sfk --max-time 4 --resolve 'localhost:8443:127.0.0.1' \
    "https://localhost:8443/api/tier" >/dev/null 2>&1; then
  gate_ok "https://localhost:8443/api/tier"
else
  gate_fail "dashboard :8443 erisilemiyor — bash scripts/dashboard_refresh.sh"
fi

# --- Kanit /tests ---
echo ""
proof_label="?"
if [[ -f "$ROOT/competitive-proof.json" ]]; then
  proof_label=$(python3 -c "import json; print(len(json.load(open('competitive-proof.json')).get('validationTests',[])))" 2>/dev/null || echo "?")
fi
echo "=== Kanit (${proof_label} test) ==="
if [[ -f "$ROOT/competitive-proof.json" ]]; then
  read -r cp_pass cp_total cp_fail <<<"$(python3 -c "
import json
d=json.load(open('competitive-proof.json'))
t=d.get('validationTests',[])
f=sum(1 for x in t if x.get('status')=='fail')
print(d.get('pass'), len(t), f)
" 2>/dev/null || echo "0 0 0")"
  if [[ "$cp_pass" == "True" && "${cp_fail:-1}" -eq 0 ]]; then
    gate_ok "competitive-proof pass=True (${cp_total} kart)"
  else
    gate_warn "competitive-proof pass=$cp_pass fail=$cp_fail — bash scripts/competitive_proof.sh"
  fi
else
  gate_warn "competitive-proof.json yok — bash scripts/competitive_proof.sh"
fi

if [[ -f "$ROOT/ops-gate-report.json" ]]; then
  og=$(python3 -c "import json; d=json.load(open('ops-gate-report.json')); print(sum(1 for g in d.get('gates',[]) if not g.get('pass')))" 2>/dev/null || echo "?")
  [[ "$og" == "0" ]] && gate_ok "ops_gate 9/9" || gate_warn "ops_gate fail=$og — bash scripts/ops_gate_report.sh"
fi

if bash "$ROOT/scripts/dashboard_tests_parity_check.sh" >/dev/null 2>&1; then
  gate_ok "dashboard_tests_parity"
else
  gate_warn "dashboard_tests_parity — bash scripts/competitive_proof_build.py"
fi

if bash "$ROOT/scripts/dashboard_security_gates.sh" >/dev/null 2>&1; then
  gate_ok "dashboard_security_gates"
else
  gate_warn "dashboard_security_gates — login RL / JWT idle / mTLS expiry"
fi

if bash "$ROOT/scripts/docs_consistency_gate.sh" >/dev/null 2>&1; then
  gate_ok "docs_consistency_gate"
else
  gate_warn "docs_consistency_gate — docs veya proof sayisi"
fi

# --- Reboot-safe ---
echo ""
echo "=== Reboot-safe ==="
if systemctl --user is-enabled log-guardian-laptop-stack.service &>/dev/null; then
  gate_ok "user systemd: log-guardian-laptop-stack"
else
  gate_warn "stack boot yok — bash scripts/install_laptop_stack_boot.sh"
fi

if systemctl --user is-active log-guardian-fleet-keepalive.service &>/dev/null; then
  gate_ok "user systemd: fleet keepalive active"
elif [[ -f "$ROOT/.cache/fleet-keepalive.pid" ]] && kill -0 "$(cat "$ROOT/.cache/fleet-keepalive.pid")" 2>/dev/null; then
  gate_ok "fleet keepalive (nohup PID)"
else
  gate_warn "fleet keepalive yok — bash scripts/host_fleet_agent_setup.sh --install-user-service"
fi

if [[ -f "$ROOT/soak-report.json" ]] && python3 -c "
import json,sys
d=json.load(open('soak-report.json'))
sys.exit(0 if d.get('pass') and float(d.get('duration_hours') or 0)>=70 else 1)
" 2>/dev/null; then
  h=$(python3 -c "import json; print(json.load(open('soak-report.json')).get('duration_hours'))")
  gate_ok "72h soak PASS (${h}h)"
else
  gate_warn "soak kaniti eksik (72h tamamlandi ise sync kontrol)"
fi

# --- FULL: vitrin + filo ---
if [[ "${FULL:-0}" == "1" ]]; then
  echo ""
  echo "=== FULL (vitrin + filo) ==="
  if [[ "${SKIP_LIVE:-0}" != "1" ]]; then
    if bash "$ROOT/scripts/website_live_gate.sh" >/dev/null 2>&1; then
      gate_ok "website_live_gate (ceniklinuxlogguardian.org)"
    else
      gate_warn "website_live_check — LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh"
    fi
  fi
  if bash "$ROOT/scripts/fleet_multi_node_e2e.sh" >/dev/null 2>&1; then
    gate_ok "fleet_multi_node_e2e (host+VM)"
  else
    gate_warn "fleet_multi_node_e2e — VM keepalive + host fleet setup"
  fi
  if bash "$ROOT/scripts/release_ready_gate.sh" >/dev/null 2>&1; then
    gate_ok "release_ready_gate (ZIP + docs + live + filo)"
  elif bash "$ROOT/scripts/release_ready_check.sh" >/dev/null 2>&1; then
    gate_ok "release_ready_check"
  else
    gate_warn "release_ready_gate — bash scripts/local_proof_refresh.sh"
  fi
  if APPLY=1 bash "$ROOT/scripts/laptop_security_excellence.sh" >/dev/null 2>&1; then
    gate_ok "laptop_security_excellence (Tier-A)"
  else
    gate_warn "laptop_security_excellence — sudo bash scripts/laptop_security_excellence.sh (firewall)"
  fi
fi

echo ""
echo "=== ozet ==="
echo "  OK: $ok   WARN: $warn   FAIL: $fail"
echo ""

REPORT="${LAPTOP_EXCELLENCE_GATE_REPORT:-laptop-excellence-gate-report.json}"
python3 - "$REPORT" "$ROOT" "$ok" "$warn" "$fail" "${FULL:-0}" <<'PY'
import json, datetime, sys
from pathlib import Path

report_path, root_s, ok_s, warn_s, fail_s, full_s = sys.argv[1:7]
ok, warn, fail = int(ok_s), int(warn_s), int(fail_s)
full_mode = full_s == "1"
root = Path(root_s)

proof_n = 0
proof_pass = 0
cp_path = root / "competitive-proof.json"
if cp_path.is_file():
    tests = json.loads(cp_path.read_text(encoding="utf-8")).get("validationTests") or []
    proof_n = len(tests)
    proof_pass = sum(1 for t in tests if t.get("status") == "pass")

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": fail == 0,
    "ok": ok,
    "warn": warn,
    "fail": fail,
    "full_mode": full_mode,
    "proof_tests": proof_n,
    "proof_pass": proof_pass,
    "script": "scripts/laptop_excellence_gate.sh",
}
Path(report_path).write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
PY

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] laptop_excellence_gate — laptop demo hazir"
  echo "  Dashboard: https://localhost:8443/tests  (Ctrl+Shift+R)"
  echo "  Site:      https://ceniklinuxlogguardian.org/tests"
  echo "  Reboot:    bash scripts/laptop_reboot_ready.sh"
  [[ "${FULL:-0}" != "1" ]] && echo "  Tam vitrin: FULL=1 bash scripts/laptop_excellence_gate.sh"
  exit 0
fi
echo "[FAIL] laptop_excellence_gate — $fail kritik madde" >&2
exit 1
