#!/usr/bin/env bash
# Laptop/demo: L7 eBPF probe + Telegram webhook prod katmanlarini ac
#   sudo bash scripts/laptop_optional_layers_on.sh
#   sudo bash scripts/laptop_optional_layers_on.sh --skip-webhook   # yalniz L7
#   sudo bash scripts/laptop_optional_layers_on.sh --skip-l7        # yalniz Telegram
#   sudo bash scripts/laptop_optional_layers_on.sh --skip-fleet     # L7+webhook, filo yok
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

SKIP_WEBHOOK=0
SKIP_L7=0
SKIP_FLEET=0
for arg in "$@"; do
  case "$arg" in
    --skip-webhook) SKIP_WEBHOOK=1 ;;
    --skip-l7) SKIP_L7=1 ;;
    --skip-fleet) SKIP_FLEET=1 ;;
  esac
done

fail() { echo "[optional_layers] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
warn() { echo "[WARN] $*" >&2; }

[[ "$(id -u)" -eq 0 ]] || exec sudo bash "$0" "$@"

CONF_DIR="/etc/log-guardian"
ENV_SRC="${WEBHOOK_ENV_FILE:-$ROOT/.env.webhook.local}"
DROPIN_DIR="/etc/systemd/system/log-guardian-daemon.service.d"

echo "=== laptop_optional_layers_on ==="

if [[ "$SKIP_L7" -eq 0 ]]; then
  echo "[1/5] daemon unit + BPF yetenekleri (CAP_PERFMON)..."
  bash "$ROOT/scripts/repair_daemon_unit.sh"
  mkdir -p "$DROPIN_DIR"
  cat >"$DROPIN_DIR/11-bpf-caps.conf" <<'EOF'
# tracepoint/L7 probe icin CAP_PERFMON (Operation not permitted onler)
[Service]
AmbientCapabilities=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW CAP_PERFMON CAP_SYS_ADMIN
CapabilityBoundingSet=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW CAP_PERFMON CAP_SYS_ADMIN
EOF
  systemctl daemon-reload
  ok "daemon unit + 11-bpf-caps.conf"

  echo "[2/5] eBPF nesneleri derleniyor..."
  make -j"$(nproc 2>/dev/null || echo 2)" \
    log-guardian-daemon \
    xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o

  for obj in xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o; do
    [[ -f "$ROOT/$obj" ]] || fail "$obj yok — make basarisiz"
    install -m 644 "$ROOT/$obj" "$CONF_DIR/$obj"
  done
  ok "BPF .o -> $CONF_DIR/"

  if [[ -x "$ROOT/log-guardian-daemon" ]]; then
    install -m 755 "$ROOT/log-guardian-daemon" /usr/local/bin/log-guardian-daemon
    ok "log-guardian-daemon binary guncellendi"
  fi

  systemctl reset-failed log-guardian-daemon.service 2>/dev/null || true
  systemctl restart log-guardian-daemon.service
  sleep 3
  if ! systemctl is-active --quiet log-guardian-daemon.service; then
    warn "daemon ayakta degil — journalctl -u log-guardian-daemon -b -n 20"
    journalctl -u log-guardian-daemon.service -b --no-pager -n 15 2>/dev/null >&2 || true
    fail "log-guardian-daemon.service basarisiz"
  fi
  ok "log-guardian-daemon.service active"

  l7_journal_ok=0
  for _ in 1 2 3; do
    if journalctl -u log-guardian-daemon.service -b --no-pager 2>/dev/null \
        | grep -E 'l7=ON|L7-PROBE.*aktif|HTTP method izleyici aktif' >/dev/null 2>&1; then
      l7_journal_ok=1
      break
    fi
    sleep 1
  done
  if [[ "$l7_journal_ok" -eq 1 ]]; then
    ok "journal: L7 probe aktif"
  else
    warn "L7 journal satiri gecikti (daemon yeniden basladi olabilir) — status ile dogrulanacak"
  fi
else
  echo "[1-2/5] L7 atlandi (--skip-l7)"
fi

if [[ "$SKIP_WEBHOOK" -eq 0 ]]; then
  echo "[3/5] Telegram webhook prod..."
  [[ -f "$ENV_SRC" ]] || fail "$ENV_SRC yok — cp deploy/webhook.local.env.example .env.webhook.local"
  WEBHOOK_ENV_FILE="$ENV_SRC" bash "$ROOT/scripts/webhook_install_prod.sh"
  ok "webhook_install_prod ($ENV_SRC)"
else
  echo "[3/5] webhook atlandi (--skip-webhook)"
fi

if [[ "$SKIP_FLEET" -eq 0 ]]; then
  echo "[3b/6] filo telemetri (host -> dashboard :8443)..."
  bash "$ROOT/scripts/fix_fleet_telemetry.sh"
  FLEET_USER="${SUDO_USER:-}"
  if [[ -z "$FLEET_USER" || "$FLEET_USER" == "root" ]]; then
    FLEET_USER="$(logname 2>/dev/null || true)"
  fi
  if [[ -z "$FLEET_USER" || "$FLEET_USER" == "root" ]]; then
    FLEET_USER="$(who am i 2>/dev/null | awk '{print $1}' || true)"
  fi
  if [[ -n "$FLEET_USER" && "$FLEET_USER" != "root" ]]; then
    sudo -u "$FLEET_USER" -H bash "$ROOT/scripts/host_fleet_agent_setup.sh" --install-user-service \
      || warn "fleet user service — manuel: bash scripts/host_fleet_agent_setup.sh --install-user-service"
  else
    bash "$ROOT/scripts/host_fleet_agent_setup.sh" --bg 2>/dev/null \
      || warn "fleet keepalive — bash scripts/host_fleet_agent_setup.sh --install-user-service"
  fi
  ok "fleet telemetry (${FLEET_KEEPALIVE_INTERVAL:-8}s)"
else
  echo "[3b/6] filo atlandi (--skip-fleet)"
fi

echo "[4/6] guardian status (webhook.env ile)..."
bash "$ROOT/scripts/guardian_status_export.sh"

L7_OK=1
TG_OK=1
SKIP_L7="$SKIP_L7" SKIP_WEBHOOK="$SKIP_WEBHOOK" python3 - <<'PY' || true
import json, sys, os
from pathlib import Path

d = json.loads(Path("guardian-status.json").read_text())
skip_l7 = int(os.environ.get("SKIP_L7", "0"))
skip_wh = int(os.environ.get("SKIP_WEBHOOK", "0"))
rc = 0

if not skip_l7:
    l7 = d.get("daemon", {}).get("l7_probe")
    active = d.get("l7_http", {}).get("probe_active")
    if l7 or active:
        print(f"L7 probe: daemon.l7_probe={l7} l7_http.probe_active={active}")
    else:
        print("l7_probe=false probe_active=false", file=sys.stderr)
        print("  -> journalctl -u log-guardian-daemon -b | grep -i l7", file=sys.stderr)
        rc |= 1

if not skip_wh:
    n = d.get("notifications") or {}
    route = n.get("telegram_route") or n.get("telegram_bot")
    if n.get("telegram") and not n.get("dry_run"):
        print(f"Telegram: route={n.get('telegram_route')} batch={n.get('telegram_batch_sec')}s")
    elif route and not n.get("dry_run"):
        print(f"Telegram route: batch={n.get('telegram_batch_sec')}s topics OK")
    else:
        print(f"notifications.telegram={n.get('telegram')} route={n.get('telegram_route')} dry_run={n.get('dry_run')}", file=sys.stderr)
        rc |= 2

sys.exit(rc)
PY
verify_rc=$?
[[ $((verify_rc & 1)) -eq 0 ]] || L7_OK=0
[[ $((verify_rc & 2)) -eq 0 ]] || TG_OK=0

echo "[5/6] dashboard sync..."
bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true

if [[ "$SKIP_L7" -eq 0 && "$L7_OK" -eq 0 ]]; then
  fail "L7 probe acilamadi — CAP_PERFMON drop-in uygulandi; journalctl -u log-guardian-daemon -b"
fi
if [[ "$SKIP_WEBHOOK" -eq 0 && "$TG_OK" -eq 0 ]]; then
  fail "Telegram status false — sudo bash scripts/webhook_install_prod.sh --test-all"
fi

echo ""
echo "[OK] laptop_optional_layers_on tamam"
echo "  Panel: https://localhost:8443 → Ctrl+Shift+R"
echo "  Wasm/L7/Lineage + Webhook panelleri LIVE rozeti"
