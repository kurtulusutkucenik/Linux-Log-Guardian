#!/usr/bin/env bash
# Community Tier-A guvenlik — ucretsiz MIT, VPS gerekmez
#   bash scripts/laptop_security_excellence.sh              # denetim (~3 dk)
#   sudo bash scripts/laptop_security_excellence.sh           # + API firewall + IPC abuse
#   APPLY=1 bash scripts/laptop_security_excellence.sh        # JWT + audit cron (sudo yok)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

AUDIT_LOG="${LG_SEC_AUDIT_LOG:-$ROOT/.cache/lg-sec-audit.txt}"
mkdir -p "$(dirname "$AUDIT_LOG")"

wait_api_ready() {
  local port="${GUARDIAN_API_PORT:-8090}" i code
  for i in $(seq 1 25); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://127.0.0.1:${port}/api/v1/metrics" 2>/dev/null || echo 000)
    [[ "$code" != "000" ]] && return 0
    sleep 1
  done
  return 1
}

run_as_invoker() {
  if [[ "$(id -u)" -eq 0 && -n "${SUDO_USER:-}" ]]; then
    sudo -u "$SUDO_USER" -H bash "$@"
  else
    bash "$@"
  fi
}

ok=0 warn=0 fail=0
gate_ok()   { echo "[OK] $*"; ok=$((ok + 1)); }
gate_warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
gate_fail() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — security excellence (community)    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# --- Uygulama (opsiyonel, zararsiz) ---
if [[ "${APPLY:-0}" == "1" || "$(id -u)" -eq 0 ]]; then
  echo "=== Sertlestirme ==="
  if [[ -f "$ROOT/.env" ]] && grep -qE '^JWT_SECRET=[a-f0-9]{32,}' "$ROOT/.env" 2>/dev/null; then
    gate_ok "JWT_SECRET guclu (.env)"
  else
    bash "$ROOT/scripts/laptop_jwt_setup.sh" >/dev/null 2>&1 && gate_ok "laptop_jwt_setup" \
      || gate_warn "laptop_jwt_setup — docker stack ayakta mi?"
  fi
  if crontab -l 2>/dev/null | grep -q 'log-guardian-security-audit' \
      || { [[ -n "${SUDO_USER:-}" ]] && sudo -u "$SUDO_USER" crontab -l 2>/dev/null | grep -q 'log-guardian-security-audit'; }; then
    gate_ok "haftalik audit cron"
  else
    run_as_invoker "$ROOT/scripts/install_audit_cron.sh" >/dev/null 2>&1 && gate_ok "install_audit_cron" \
      || gate_warn "install_audit_cron"
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    bash "$ROOT/scripts/ensure_api_security.sh" >/dev/null 2>&1 && gate_ok "ensure_api_security" \
      || gate_fail "ensure_api_security"
    if bash "$ROOT/scripts/firewall_api_bind.sh" check >/dev/null 2>&1; then
      gate_ok "firewall_api_bind (8090 loopback)"
    elif bash "$ROOT/scripts/firewall_api_bind.sh" install >/dev/null 2>&1; then
      gate_ok "firewall_api_bind (8090 loopback)"
    else
      gate_warn "firewall_api_bind — API_BIND koruyor"
    fi
    if wait_api_ready; then
      gate_ok "API :8090 hazir (restart sonrasi)"
    else
      gate_warn "API :8090 gecikmeli — testler devam"
    fi
  else
    gate_warn "sudo ile calistirin — ensure_api_security + firewall"
  fi
  echo ""
fi

# --- Statik + API ---
echo "=== API fail-closed ==="
wait_api_ready || true
if bash "$ROOT/scripts/api_fail_closed_test.sh" >/dev/null 2>&1; then
  gate_ok "api_fail_closed_test"
else
  gate_fail "api_fail_closed_test"
fi

if env LG_SKIP_BUILD=1 bash "$ROOT/scripts/security_hardening_test.sh" >/dev/null 2>&1; then
  gate_ok "security_hardening_test (IPC/JWT/install)"
else
  gate_fail "security_hardening_test"
fi

if [[ "$(id -u)" -eq 0 ]]; then
  if bash "$ROOT/scripts/ipc_abuse_test.sh" >/dev/null 2>&1; then
    gate_ok "ipc_abuse_test (SO_PEERCRED)"
  else
    gate_fail "ipc_abuse_test"
  fi
elif sudo -n true 2>/dev/null; then
  if sudo bash "$ROOT/scripts/ipc_abuse_test.sh" >/dev/null 2>&1; then
    gate_ok "ipc_abuse_test (SO_PEERCRED)"
  else
    gate_fail "ipc_abuse_test"
  fi
else
  gate_warn "ipc_abuse_test — sudo gerekli"
fi

echo ""
echo "=== Relay + proxy ==="
if bash "$ROOT/scripts/relay_lan_exposure_check.sh" >/dev/null 2>&1; then
  gate_ok "relay_lan_exposure_check"
else
  gate_fail "relay_lan_exposure_check"
fi
if bash "$ROOT/scripts/check_proxy_trust.sh" >/dev/null 2>&1; then
  gate_ok "check_proxy_trust (XFF spoof)"
else
  gate_fail "check_proxy_trust"
fi

echo ""
echo "=== Site CSP/SRI ==="
if bash "$ROOT/scripts/website_security_check.sh" >/dev/null 2>&1; then
  gate_ok "website_security_check (hash-only CSP)"
else
  gate_warn "website_security_check — bash scripts/website_build.sh"
fi

echo ""
echo "=== Tam denetim ==="
mkdir -p "$(dirname "$AUDIT_LOG")"
if [[ -e "$AUDIT_LOG" && ! -w "$AUDIT_LOG" ]]; then
  rm -f "$AUDIT_LOG" 2>/dev/null || sudo rm -f "$AUDIT_LOG" 2>/dev/null || true
fi
: >"$AUDIT_LOG"
if bash "$ROOT/scripts/local_security_audit.sh" >>"$AUDIT_LOG" 2>&1; then
  af=$(grep -E '^  FAIL:' "$AUDIT_LOG" | tail -1 | awk '{print $2}')
  aw=$(grep -E '^  FAIL:' "$AUDIT_LOG" | tail -1 | awk '{print $4}')
  gate_ok "local_security_audit (FAIL:${af:-0} WARN:${aw:-0})"
else
  tail -5 "$AUDIT_LOG" >&2 2>/dev/null || true
  gate_fail "local_security_audit"
fi

if bash "$ROOT/scripts/laptop_harden_check.sh" >/dev/null 2>&1; then
  gate_ok "laptop_harden_check"
else
  gate_fail "laptop_harden_check"
fi

if bash "$ROOT/scripts/pre_push_secret_scan.sh" >/dev/null 2>&1; then
  gate_ok "pre_push_secret_scan"
else
  gate_fail "pre_push_secret_scan — repoda secret?"
fi

echo ""
echo "=== ozet ==="
echo "  OK: $ok   WARN: $warn   FAIL: $fail"
echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "[OK] laptop_security_excellence — community Tier-A"
  echo "  Mimari: fail-closed API · IPC peer cred · loopback bind · CSP hash-only · rate limit"
  echo "  Internet-facing VPS: sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh"
  echo "  Tam kapatma: bash scripts/security_closure_gate.sh"
  exit 0
fi
echo "[FAIL] laptop_security_excellence — $fail madde" >&2
exit 1
