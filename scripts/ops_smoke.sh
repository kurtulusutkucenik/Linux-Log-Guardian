#!/usr/bin/env bash
# ops_smoke.sh — 7/24 systemd entegrasyon dogrulamasi
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== ops_smoke (7/24) ==="

systemd_usable() {
  command -v systemctl &>/dev/null || return 1
  [[ -d /run/systemd/system ]] || return 1
  [[ "$(ps -p 1 -o comm= 2>/dev/null | tr -d ' ')" == "systemd" ]] || return 1
  systemctl list-units --type=service --no-legend &>/dev/null 2>&1 || return 1
  return 0
}

if ! systemd_usable; then
  echo "[ops_smoke] systemd yok veya bus erisilemiyor — smoke_test (dev ortami)"
  bash "$ROOT/scripts/smoke_test.sh"
  exit 0
fi

# Kurulu degilse sadece binary smoke
if ! systemctl list-unit-files log-guardian.service &>/dev/null 2>&1; then
  echo "[ops_smoke] log-guardian.service yok — smoke_test"
  bash "$ROOT/scripts/smoke_test.sh"
  exit 0
fi

check_unit() {
  local unit="$1"
  systemctl is-enabled "$unit" &>/dev/null || {
    echo "[ops_smoke] $unit enabled degil" >&2
    return 1
  }
  echo "[ops_smoke] $unit: enabled OK"
}

check_active() {
  local unit="$1"
  if systemctl is-active --quiet "$unit"; then
    echo "[ops_smoke] $unit: active OK"
  else
    echo "[ops_smoke] $unit: inactive — baslatiliyor" >&2
    systemctl start "$unit" 2>/dev/null || true
    sleep 2
    systemctl is-active --quiet "$unit" || {
      echo "[ops_smoke] $unit baslatilamadi" >&2
      systemctl status "$unit" --no-pager -l 2>&1 | tail -8 >&2 || true
      return 1
    }
    echo "[ops_smoke] $unit: active OK (restart sonrasi)"
  fi
}

if systemctl list-unit-files log-guardian-daemon.service &>/dev/null 2>&1; then
  check_unit log-guardian-daemon.service
  check_active log-guardian-daemon.service
fi

check_unit log-guardian.service
check_active log-guardian.service

if systemctl list-unit-files log-guardian-threatintel.timer &>/dev/null 2>&1; then
  check_unit log-guardian-threatintel.timer
fi

# Health retry — servisler active ise zorunlu
health_required=0
systemctl is-active --quiet log-guardian 2>/dev/null && health_required=1
systemctl is-active --quiet log-guardian-daemon 2>/dev/null && health_required=1

if [[ -x /usr/local/bin/log-guardian || -x "$ROOT/log-guardian" ]]; then
  if [[ "$health_required" -eq 1 ]]; then
    bash "$ROOT/scripts/ops_health.sh"
    echo "[ops_smoke] health OK"
  else
    bash "$ROOT/scripts/ops_health.sh" 2>/dev/null && echo "[ops_smoke] health OK" || \
      echo "[ops_smoke] health atlandi (servisler inactive — dev ortami)"
  fi
else
  echo "[ops_smoke] binary yok — health atlandi"
fi

# Sentetik analiz (binary repo veya /usr/local)
if [[ -f "$ROOT/test_access.log" ]]; then
  LG="$ROOT/log-guardian"
  [[ -x "$LG" ]] || LG=/usr/local/bin/log-guardian
  if [[ -x "$LG" ]]; then
    out=$("$LG" "$ROOT/test_access.log" --no-tui --json --no-ban --no-db \
      --rules "$ROOT/test_rules.conf" 2>/dev/null || true)
    echo "$out" | grep -q '"total_lines"' && echo "[ops_smoke] sentetik analiz OK"
  fi
fi

echo "OK — ops_smoke"
