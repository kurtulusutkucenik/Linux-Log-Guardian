#!/usr/bin/env bash
# /etc/log-guardian kurallarini repo ile senkron (CRS bundle + OR SQLi regex)
#   sudo bash scripts/sync_etc_rules.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETC="${LG_ETC:-/etc/log-guardian}"
CONF="${ETC}/rules.conf"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "[sync_etc_rules] sudo gerekli" >&2
  exit 1
fi

install -d "${ETC}/rules"
install -m 644 "$ROOT/rules/crs-bundle.rules" "${ETC}/rules/crs-bundle.rules"
install -m 644 "$ROOT/rules/crs-core.rules" "${ETC}/rules/crs-core.rules" 2>/dev/null || true

[[ -f "$CONF" ]] || install -m 600 "$ROOT/rules.conf" "$CONF"

if ! grep -q '^CRS_RULES=' "$CONF" 2>/dev/null; then
  echo "CRS_RULES=rules/crs-bundle.rules" >>"$CONF"
fi
if ! grep -q "or\[\\\\s\\\\\+" "$CONF" 2>/dev/null; then
  grep '^REGEX_PATTERN=(?i)(or' "$ROOT/rules.conf" >>"$CONF" || true
  echo "[sync_etc_rules] OR SQLi REGEX eklendi"
fi

echo "[OK] sync_etc_rules -> ${ETC}/rules/crs-bundle.rules"
echo "     sudo systemctl restart log-guardian"
