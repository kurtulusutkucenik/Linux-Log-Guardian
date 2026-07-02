#!/usr/bin/env bash
# Cloudflare real_ip — origin nginx (site + VPS)
#   sudo bash scripts/install_cloudflare_real_ip.sh
# Cloudflare Pages (statik site) icin gerekmez — nginx yoksa [SKIP].
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/deploy/cloudflare-origin.conf"

[[ "${EUID:-0}" -eq 0 ]] || { echo "sudo gerekli" >&2; exit 1; }
[[ -f "$SRC" ]] || { echo "FAIL: $SRC yok" >&2; exit 1; }

if ! command -v nginx >/dev/null 2>&1; then
  echo "[SKIP] nginx kurulu degil — Cloudflare real_ip yalnizca origin nginx/VPS icin"
  echo "  Site Cloudflare Pages ise gerekmez (VM demo gate bunu gerektirmez)."
  exit 0
fi

CONF_DIR="${NGINX_CF_CONF_DIR:-}"
if [[ -z "$CONF_DIR" ]]; then
  for d in /etc/nginx/conf.d /etc/nginx/snippets; do
    if [[ -d /etc/nginx ]]; then
      install -d "$d"
      CONF_DIR="$d"
      break
    fi
  done
fi

if [[ -z "$CONF_DIR" || ! -d "$CONF_DIR" ]]; then
  echo "[FAIL] nginx var ama conf.d/snippets olusturulamadi" >&2
  exit 1
fi

DEST="${CONF_DIR}/log-guardian-cloudflare.conf"
install -m 644 "$SRC" "$DEST"
nginx -t
systemctl reload nginx 2>/dev/null || service nginx reload
echo "[OK] Cloudflare real_ip -> $DEST"
echo "  TRUST_XFF=0 (rules.conf) — \$remote_addr gercek istemci IP"
bash "$ROOT/scripts/check_proxy_trust.sh" || true
