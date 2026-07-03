#!/usr/bin/env bash
# Canli sitede CSS parity — Next.js content-hash'li dosya adi = integrity.
# Live index.html'in referans verdigi _next/static/css/<hash>.css:
#   1) canli 200 + bos degil
#   2) hash, lokal build (landing/out) ile ayni  → deploy drift yok
#   bash scripts/website_live_css_check.sh
#   WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash scripts/website_live_css_check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${WEBSITE_LIVE_DOMAIN:-ceniklinuxlogguardian.org}"
URL="https://${DOMAIN}"

html="$(curl -sf "${URL}/")" || {
  echo "[FAIL] website_live_css_check — ${URL}/ acilamadi (HTTP/DNS)" >&2
  exit 1
}

# Next.js hash'li stylesheet: href="/_next/static/css/<hash>.css"
css_path="$(printf '%s' "$html" \
  | grep -oP 'href="\K/_next/static/css/[^"]+\.css' | head -1 || true)"
if [[ -z "$css_path" ]]; then
  echo "[FAIL] website_live_css_check — _next/static/css/*.css link yok (Next.js build eksik?)" >&2
  exit 1
fi

# Canli CSS govdesi 200 + bos degil
tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
code="$(curl -sf -o "$tmp" -w '%{http_code}' "${URL}${css_path}" || true)"
size="$(wc -c <"$tmp" 2>/dev/null || echo 0)"
if [[ "$code" != "200" || "${size:-0}" -lt 1000 ]]; then
  echo "[FAIL] website_live_css_check — CSS body sorunlu (http=${code}, size=${size})" >&2
  exit 1
fi

# Parity: lokal build ayni hash'i uretiyor mu? (deploy drift tespiti)
local_css="$(grep -oP 'href="\K/_next/static/css/[^"]+\.css' \
  "$ROOT/landing/out/index.html" 2>/dev/null | head -1 || true)"
if [[ -n "$local_css" && "$local_css" != "$css_path" ]]; then
  echo "[FAIL] website_live_css_check — CSS hash drift (canli != lokal build)" >&2
  echo "  live:  ${css_path}" >&2
  echo "  local: ${local_css}" >&2
  echo "  FIX: bash scripts/website_deploy_gate.sh && bash scripts/website_publish.sh" >&2
  echo "  Sonra Cloudflare → Caching → Purge Everything" >&2
  exit 1
fi

if [[ -n "$local_css" ]]; then
  echo "[OK] website_live_css_check — CSS parity (${DOMAIN}, ${css_path##*/}, ${size} B)"
else
  echo "[OK] website_live_css_check — CSS canli 200 (${DOMAIN}, ${css_path##*/}, ${size} B; lokal build yok)"
fi
exit 0
