#!/usr/bin/env bash
# Canli sitede site.css SRI == index.html integrity (Cloudflare cache drift)
#   bash scripts/website_live_css_check.sh
#   WEBSITE_LIVE_DOMAIN=ceniklinuxlogguardian.org bash scripts/website_live_css_check.sh
set -euo pipefail

DOMAIN="${WEBSITE_LIVE_DOMAIN:-ceniklinuxlogguardian.org}"
URL="https://${DOMAIN}"

html="$(curl -sf "${URL}/")"
css_path="$(printf '%s' "$html" | grep -oP 'href="\./\Ksite[^"]+\.css' | head -1 || true)"
if [[ -z "$css_path" ]]; then
  echo "[FAIL] website_live_css_check — site*.css link yok" >&2
  exit 1
fi

css_hash="$(curl -sf "${URL}/${css_path}" | openssl dgst -sha384 -binary | openssl base64 -A)"
meta_hash="$(printf '%s' "$html" | grep -oP 'name="lg-integrity-css" content="sha384-\K[^"]+' | head -1 || true)"

if [[ -z "$meta_hash" ]]; then
  echo "[FAIL] website_live_css_check — lg-integrity-css meta yok" >&2
  exit 1
fi

if [[ "$css_hash" == "$meta_hash" ]]; then
  echo "[OK] website_live_css_check — site.css SRI uyumlu (${DOMAIN})"
  exit 0
fi

echo "[FAIL] website_live_css_check — site.css cache drift" >&2
echo "  live body:  sha384-${css_hash}" >&2
echo "  html meta:  sha384-${meta_hash}" >&2
echo "  FIX: bash scripts/website_deploy_gate.sh && wrangler pages deploy assets/website-deploy --project-name=linux-log-guardian-website --branch=main --commit-dirty=true" >&2
echo "  Sonra Cloudflare → Caching → Purge Everything (veya site.css)" >&2
exit 1
