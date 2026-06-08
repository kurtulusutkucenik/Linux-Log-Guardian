#!/usr/bin/env bash
# Calisan servisi durdurup yeni log-guardian binary kurar (Text file busy onler)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
SERVICE="${LG_SERVICE:-log-guardian.service}"

fail() { echo "[upgrade_binary] FAIL: $*" >&2; exit 1; }

[[ "${EUID:-$(id -u)}" -ne 0 ]] && fail "sudo gerekli"

echo "[upgrade_binary] derleniyor..."
make -B -j"$(nproc 2>/dev/null || echo 2)" log-guardian
[[ -x "$ROOT/log-guardian" ]] || fail "$ROOT/log-guardian yok"

tmp="${LG_BIN}.new.$$"
install -m 755 "$ROOT/log-guardian" "$tmp"

stopped=0
if systemctl is-active --quiet "$SERVICE" 2>/dev/null; then
  echo "[upgrade_binary] $SERVICE durduruluyor..."
  systemctl stop "$SERVICE"
  stopped=1
fi

mv -f "$tmp" "$LG_BIN"
chmod 755 "$LG_BIN"
echo "[upgrade_binary] kuruldu: $LG_BIN"

if [[ "$stopped" -eq 1 ]]; then
  systemctl start "$SERVICE"
  echo "[upgrade_binary] $SERVICE baslatildi"
fi

if STRINGS="$(command -v strings 2>/dev/null)" && "$STRINGS" -a "$LG_BIN" 2>/dev/null \
    | grep -qE 'loganalyzer_webhook_(sent|fail)_total|INC-test-webhook'; then
  echo "[upgrade_binary] webhook v2 metrikleri: OK"
else
  echo "[upgrade_binary] WARN: webhook metrik dogrulamasi atlandi (strings yok veya eski build)"
fi
