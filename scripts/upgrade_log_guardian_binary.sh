#!/usr/bin/env bash
# Calisan servisi durdurup yeni log-guardian binary kurar (Text file busy onler)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
DAEMON_BIN="${LG_DAEMON_BIN:-/usr/local/bin/log-guardian-daemon}"
SERVICE="${LG_SERVICE:-log-guardian.service}"
DAEMON_SERVICE="${LG_DAEMON_SERVICE:-log-guardian-daemon.service}"

fail() { echo "[upgrade_binary] FAIL: $*" >&2; exit 1; }

[[ "${EUID:-$(id -u)}" -ne 0 ]] && fail "sudo gerekli"

if [[ -x "$ROOT/scripts/soak_active_lock.sh" ]]; then
  if bash "$ROOT/scripts/soak_active_lock.sh" running 2>/dev/null; then
    echo "[upgrade_binary] WARN: SOAK_RUNNING=1 — soak aktif" >&2
  fi
  bash "$ROOT/scripts/soak_active_lock.sh" check "${UPGRADE_FORCE:-0}" || exit 1
fi

echo "[upgrade_binary] derleniyor..."
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"
ensure_lg_build_tree "$ROOT"
build_log="$(mktemp)"
if [[ "${LG_VERBOSE_BUILD:-0}" == "1" ]]; then
  LG_QUIET_BUILD=1 make -j1 refresh-binaries
else
  LG_QUIET_BUILD=1 make -s -j1 refresh-binaries >"$build_log" 2>&1 || {
    tail -30 "$build_log" >&2
    rm -f "$build_log"
    fail "make refresh-binaries"
  }
  grep -E '^\[OK\]|^error:|FAIL' "$build_log" 2>/dev/null || true
  rm -f "$build_log"
fi

# root ile derleme sonrasi .o dosyalari kullaniciya geri ver (make Permission denied onler)
if [[ -n "${SUDO_USER:-}" && "${SUDO_USER}" != "root" ]]; then
  chown "${SUDO_USER}:${SUDO_USER}" "$ROOT"/*.o "$ROOT"/*.daemon.o 2>/dev/null || true
fi

if [[ -x "$ROOT/scripts/sync_etc_rules.sh" ]]; then
  bash "$ROOT/scripts/sync_etc_rules.sh" 2>/dev/null \
    || echo "[upgrade_binary] WARN: sync_etc_rules atlandi"
fi
[[ -x "$ROOT/log-guardian" ]] || fail "$ROOT/log-guardian yok"

install_binary() {
  local src="$1" dest="$2" label="$3"
  local tmp="${dest}.new.$$"
  install -m 755 "$src" "$tmp"
  mv -f "$tmp" "$dest"
  chmod 755 "$dest"
  echo "[upgrade_binary] kuruldu: $dest ($label)"
}

stop_service_safely() {
  local svc="$1"
  systemctl is-active --quiet "$svc" 2>/dev/null || return 0
  echo "[upgrade_binary] $svc durduruluyor..."
  systemctl stop "$svc" 2>/dev/null || true
  local n=0
  while systemctl is-active --quiet "$svc" 2>/dev/null && [[ "$n" -lt 20 ]]; do
    sleep 1
    n=$((n + 1))
  done
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    echo "[upgrade_binary] WARN: $svc hala aktif — SIGTERM/SIGKILL" >&2
    systemctl kill -s SIGTERM "$svc" 2>/dev/null || true
    sleep 2
    systemctl kill -s SIGKILL "$svc" 2>/dev/null || true
    sleep 1
  fi
  systemctl reset-failed "$svc" 2>/dev/null || true
}

daemon_stopped=0
analyzer_stopped=0
if systemctl is-active --quiet "$DAEMON_SERVICE" 2>/dev/null; then
  stop_service_safely "$DAEMON_SERVICE"
  daemon_stopped=1
fi
if systemctl is-active --quiet "$SERVICE" 2>/dev/null; then
  stop_service_safely "$SERVICE"
  analyzer_stopped=1
fi

install_binary "$ROOT/log-guardian" "$LG_BIN" "analyzer"
[[ -x "$ROOT/log-guardian-daemon" ]] \
  && install_binary "$ROOT/log-guardian-daemon" "$DAEMON_BIN" "daemon"

start_service_after_upgrade() {
  local svc="$1" was_active="$2"
  if [[ "$was_active" -eq 1 ]]; then
    systemctl start "$svc"
    echo "[upgrade_binary] $svc baslatildi"
    return
  fi
  if systemctl is-enabled --quiet "$svc" 2>/dev/null \
      && ! systemctl is-active --quiet "$svc" 2>/dev/null; then
    systemctl start "$svc" 2>/dev/null \
      && echo "[upgrade_binary] $svc baslatildi (enabled, kapaliydi)"
  fi
}

start_service_after_upgrade "$DAEMON_SERVICE" "$daemon_stopped"
sleep 1
start_service_after_upgrade "$SERVICE" "$analyzer_stopped"
sleep 2

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
METRICS_PORT="${METRICS_PORT:-9091}"
if [[ -f "$CONF" ]]; then
  mp=$(grep -E '^METRICS_PORT=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$mp" && "$mp" != "0" ]]; then
    METRICS_PORT="$mp"
  fi
fi
metrics_ok=0
metrics_note=""
for _ in 1 2 3 4 5 6 7 8; do
  m=$(curl -sf --connect-timeout 2 --max-time 3 \
    "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null || true)
  if [[ -n "$m" ]]; then
    if grep -q 'loganalyzer_webhook_sent_total' <<<"$m"; then
      metrics_ok=1
      metrics_note="webhook"
      break
    fi
    if grep -qE 'loganalyzer_(lines_total|eps|alerts_total)' <<<"$m"; then
      metrics_ok=1
      metrics_note="core"
      break
    fi
  fi
  sleep 2
done
if [[ "$metrics_ok" -eq 1 ]]; then
  echo "[upgrade_binary] metrics :${METRICS_PORT} OK (${metrics_note})"
elif STRINGS="$(command -v strings 2>/dev/null)" && "$STRINGS" "$LG_BIN" 2>/dev/null \
    | grep -q 'loganalyzer_webhook_sent_total'; then
  echo "[upgrade_binary] metrics (binary strings): OK — servis henuz hazir olabilir"
else
  echo "[upgrade_binary] WARN: metrics dogrulanamadi (:${METRICS_PORT}) — 30s sonra: curl -s http://127.0.0.1:${METRICS_PORT}/metrics | head"
fi
