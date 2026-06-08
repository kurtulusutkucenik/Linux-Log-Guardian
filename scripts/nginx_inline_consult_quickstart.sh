#!/usr/bin/env bash
# Inline consult — 5 satir nginx + API kanit (ModSec boslugu)
#   bash scripts/nginx_inline_consult_quickstart.sh
#   sudo bash scripts/nginx_inline_consult_quickstart.sh   # rules merge
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

echo "=== nginx inline consult quickstart ==="
echo ""

if [[ "$(id -u)" -eq 0 ]]; then
  bash "$ROOT/scripts/merge_nginx_inline_consult.sh"
  systemctl restart log-guardian 2>/dev/null || true
  sleep 2
else
  echo "[INFO] rules merge icin: sudo bash scripts/merge_nginx_inline_consult.sh"
fi

echo ""
echo "── nginx (server {} icinde, 5 satir mantik)"
cat <<'NGINX'
include snippets/log-guardian-inline-consult.conf;

location / {
    auth_request /_lg_consult;
    error_page 403 = @lg_blocked;
    proxy_pass http://127.0.0.1:8080;   # kendi upstream'iniz
}
NGINX
echo ""
echo "Tam ornek: examples/nginx/log-guardian-inline-site.conf"
echo "Snippet:   examples/nginx/snippets/log-guardian-inline-consult.conf"
echo ""

echo "── API consult kanit"
bash "$ROOT/scripts/nginx_inline_consult_proof.sh"
echo ""
echo "[OK] inline consult quickstart tamam — dashboard /tests nginx-consult karti"
