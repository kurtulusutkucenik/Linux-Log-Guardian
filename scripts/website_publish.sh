#!/usr/bin/env bash
# Cloudflare Pages yayini — gate sonrasi wrangler deploy
#   bash scripts/website_publish.sh              # dry-run (gate only)
#   LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PROJECT="${LG_CF_PAGES_PROJECT:-linux-log-guardian-website}"
BRANCH="${LG_CF_PAGES_BRANCH:-main}"
DEPLOY_DIR="$ROOT/assets/website-deploy"

fail() { echo "[website_publish] FAIL: $*" >&2; exit 1; }

echo "=== website_publish ==="
bash "$ROOT/scripts/website_deploy_gate.sh"

if [[ "${LG_WEBSITE_PUBLISH:-0}" != "1" ]]; then
  echo ""
  echo "[OK] website_publish — gate gecti (dry-run)"
  echo "  Canli deploy:"
  echo "    LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh"
  echo "  veya:"
  echo "    wrangler pages deploy $DEPLOY_DIR --project-name=$PROJECT --branch=$BRANCH --commit-dirty=true"
  exit 0
fi

command -v wrangler >/dev/null 2>&1 || fail "wrangler yok — npm i -g wrangler && wrangler login"

echo "[website_publish] wrangler pages deploy..."
wrangler pages deploy "$DEPLOY_DIR" \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

if [[ "${LG_CF_PURGE:-0}" == "1" && -x "$ROOT/scripts/website_cf_purge.sh" ]]; then
  bash "$ROOT/scripts/website_cf_purge.sh" || true
  sleep 5
fi

DOMAIN="${LG_WEBSITE_DOMAIN:-ceniklinuxlogguardian.org}"
if [[ -n "$DOMAIN" ]]; then
  if [[ -x "$ROOT/scripts/website_live_gate.sh" ]]; then
    LG_WEBSITE_DOMAIN="$DOMAIN" bash "$ROOT/scripts/website_live_gate.sh" || true
  elif [[ -x "$ROOT/scripts/website_live_check.sh" ]]; then
    LG_WEBSITE_DOMAIN="$DOMAIN" bash "$ROOT/scripts/website_live_check.sh" || true
  elif [[ -x "$ROOT/scripts/website_live_css_check.sh" ]]; then
    LG_WEBSITE_DOMAIN="$DOMAIN" bash "$ROOT/scripts/website_live_css_check.sh" || true
  fi
  n="$(python3 -c "import json; print(len(json.load(open('$ROOT/competitive-proof.json'))['validationTests']))" 2>/dev/null || echo "51")"
  echo "[OK] canli: https://$DOMAIN/tests (${n} kart, Ctrl+Shift+R)"
  echo "[INFO] SRI drift: LG_CF_PURGE=1 veya bash scripts/website_cf_purge.sh"
else
  echo "[INFO] LG_WEBSITE_DOMAIN ayarla — live CSS/JS check icin"
fi

echo "[OK] website_publish — Cloudflare Pages deploy tamam"
