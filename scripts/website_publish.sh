#!/usr/bin/env bash
# Canli site yayini — Next.js landing/ -> Cloudflare Pages (production)
# Calistir: bash scripts/website_publish.sh   (repo kokunden veya herhangi bir yerden)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANDING="$ROOT/landing"
OUT="$LANDING/out"
PROJECT="${LG_CF_PAGES_PROJECT:-linux-log-guardian-website}"
BRANCH="${LG_CF_PAGES_BRANCH:-main}"

if command -v wrangler >/dev/null 2>&1; then
  WRANGLER=(wrangler)
elif [[ -x "${HOME}/.nvm/versions/node/v20.20.2/bin/wrangler" ]]; then
  WRANGLER=("${HOME}/.nvm/versions/node/v20.20.2/bin/wrangler")
else
  echo "[FAIL] wrangler bulunamadi — once: npm i -g wrangler && wrangler login" >&2
  exit 1
fi

echo "=== website_publish ==="
echo "  proje: $PROJECT"
echo "  branch: $BRANCH (production)"
echo "  cikti: landing/out"
echo ""

bash "$ROOT/scripts/website_deploy_gate.sh"

echo ""
echo "=== Cloudflare Pages deploy ==="
"${WRANGLER[@]}" pages deploy "$OUT" \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

echo ""
echo "[OK] website_publish"
echo "  Canli: https://ceniklinuxlogguardian.org"
echo "  www:   https://www.ceniklinuxlogguardian.org"
echo "  Not:   tarayicida Ctrl+Shift+R (cache temizle)"
