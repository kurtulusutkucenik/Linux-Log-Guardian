#!/usr/bin/env bash
# L7 + webhook on kontrol (sudo gerekmez) — bitince tek sudo komut
#   bash scripts/laptop_optional_layers_preflight.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

ok=0 warn=0 fail=0
say_ok()   { echo "[OK] $*"; ok=$((ok + 1)); }
say_warn() { echo "[WARN] $*"; warn=$((warn + 1)); }
say_fail() { echo "[FAIL] $*"; fail=$((fail + 1)); }

echo "=== laptop_optional_layers_preflight ==="

make -j"$(nproc 2>/dev/null || echo 2)" -s \
  log-guardian-daemon xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o \
  && say_ok "BPF .o derlendi" || say_fail "make BPF"

bash "$ROOT/scripts/guardian_status_export.sh" >/dev/null 2>&1 || true

l7_ok=0
# grep -q + pipefail = SIGPIPE false negative; >/dev/null kullan
if journalctl -u log-guardian-daemon.service -b --no-pager 2>/dev/null \
     | grep -E 'l7=ON|L7-PROBE.*aktif|HTTP method izleyici aktif' >/dev/null 2>&1; then
  l7_ok=1
  say_ok "daemon journal: l7=ON"
elif python3 -c "import json; d=json.load(open('${ROOT}/guardian-status.json')); exit(0 if (d.get('daemon',{}).get('l7_probe') or d.get('l7_http',{}).get('probe_active')) else 1)" 2>/dev/null; then
  l7_ok=1
  say_ok "guardian-status: l7_probe active"
elif [[ -f /etc/log-guardian/http_l7_probe.o ]]; then
  l7_ok=1
  say_ok "L7 BPF /etc/log-guardian/http_l7_probe.o kurulu"
fi

if bash "$ROOT/scripts/l7_probe_prod_e2e.sh" >/dev/null 2>&1; then
  say_ok "l7_probe_prod_e2e"
  l7_ok=1
else
  say_warn "l7_probe_prod_e2e"
fi

if [[ "$l7_ok" -eq 0 ]]; then
  say_warn "l7 kapali — sudo bash scripts/laptop_optional_layers_on.sh"
fi

if [[ -f /etc/log-guardian/webhook.env ]]; then
  say_ok "webhook.env kurulu"
else
  say_warn "webhook.env yok — sudo WEBHOOK_ENV_FILE=$ROOT/.env.webhook.local bash scripts/webhook_install_prod.sh"
fi

bash "$ROOT/scripts/webhook_smoke_test.sh" >/dev/null 2>&1 && say_ok "webhook_smoke_test" || say_warn "webhook_smoke_test"

bash "$ROOT/scripts/guardian_status_export.sh" >/dev/null 2>&1 && say_ok "guardian_status_export" || say_warn "guardian_status_export"

bash "$ROOT/scripts/sync_dashboard_data.sh" >/dev/null 2>&1 && say_ok "sync_dashboard_data" || say_warn "sync_dashboard_data"

echo ""
echo "=== ozet ==="
echo "  OK: $ok   WARN: $warn   FAIL: $fail"
echo ""
if [[ "$fail" -eq 0 ]]; then
  layers_done=0
  if [[ -f /etc/log-guardian/webhook.env ]] && [[ -f /etc/log-guardian/http_l7_probe.o ]]; then
    layers_done=1
  fi
  if [[ "$layers_done" -eq 1 ]]; then
    echo "[OK] laptop_optional_layers_preflight — L7 + webhook prod zaten kurulu"
    echo "  Telegram test: sudo bash scripts/webhook_install_prod.sh --test-all"
    if systemctl --user is-active --quiet log-guardian-fleet-keepalive.service 2>/dev/null; then
      echo "  Filo keepalive: user systemd aktif (node-kurtulus-01)"
    else
      echo "  Filo user svc: bash scripts/host_fleet_agent_setup.sh --install-user-service"
    fi
    echo "  Tam prod E2E: sudo bash scripts/webhook_prod_e2e.sh"
  else
    echo "Sudo ile bitir (BPF /etc + webhook prod + filo):"
    echo "  cd \"$ROOT\" && sudo bash scripts/laptop_optional_layers_on.sh"
    echo ""
    echo "Telegram chat yoksa: bota /start yaz, sonra:"
    echo "  sudo bash scripts/webhook_install_prod.sh --test-all"
  fi
  exit 0
fi
echo "[FAIL] preflight — $fail madde" >&2
exit 1
