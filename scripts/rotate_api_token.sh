#!/usr/bin/env bash
# API_TOKEN yenile — rules.conf + nginx consult + dashboard
#   sudo bash scripts/rotate_api_token.sh
#   sudo bash scripts/rotate_api_token.sh --dry-run
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
DRY=0

[[ "${1:-}" == "--dry-run" ]] && DRY=1
[[ "$(id -u)" -eq 0 ]] || { echo "[rotate_api_token] sudo gerekli" >&2; exit 1; }
[[ -f "$CONF" ]] || { echo "[rotate_api_token] $CONF yok" >&2; exit 1; }

new_tok="$(openssl rand -hex 32)"
old_tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

echo "=== rotate_api_token ==="
if [[ -n "$old_tok" ]]; then
  echo "  eski: ${old_tok:0:8}...${old_tok: -8}"
else
  echo "  eski: (yok)"
fi
echo "  yeni: ${new_tok:0:8}...${new_tok: -8}"

if [[ "$DRY" -eq 1 ]]; then
  echo "[dry-run] degisiklik yapilmadi"
  exit 0
fi

if grep -q '^API_TOKEN=' "$CONF" 2>/dev/null; then
  sed -i "s|^API_TOKEN=.*|API_TOKEN=${new_tok}|" "$CONF"
else
  echo "API_TOKEN=${new_tok}" >>"$CONF"
fi
chmod 600 "$CONF" 2>/dev/null || true

bash "$ROOT/scripts/ensure_api_security.sh" 2>/dev/null || true
bash "$ROOT/scripts/sync_dashboard_api_token.sh" 2>/dev/null || true

echo "[OK] rotate_api_token — dashboard/nginx guncellendi"
echo "  test: bash scripts/api_fail_closed_test.sh"
