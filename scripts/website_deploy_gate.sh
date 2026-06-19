#!/usr/bin/env bash
# Domain / Cloudflare Pages oncesi tek kapı
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== website_deploy_gate ==="
bash "$ROOT/scripts/sync_evidence_pack.sh"
bash "$ROOT/scripts/website_build.sh"
bash "$ROOT/scripts/website_pack_deploy.sh"
bash "$ROOT/scripts/website_audit_deploy.sh"

SITE="$ROOT/assets/website"
DEPLOY="$ROOT/assets/website-deploy"

for path in csp.txt publish.allowlist _headers _redirects deploy-manifest.json .env; do
  if grep -qF "/${path}" "$SITE/_redirects" 2>/dev/null; then
    echo "  [OK] _redirects -> /${path} 404"
  else
    echo "  [FAIL] _redirects /${path} 404 eksik" >&2
    exit 1
  fi
done
for pattern in .git wp-admin admin; do
  if grep -qF "/${pattern}" "$SITE/_redirects" 2>/dev/null; then
    echo "  [OK] _redirects -> /${pattern}* 404"
  else
    echo "  [FAIL] _redirects /${pattern} eksik" >&2
    exit 1
  fi
done
if grep -qF '/*.map' "$SITE/_redirects" 2>/dev/null; then
  echo "  [OK] _redirects -> /*.map 404"
else
  echo "  [FAIL] _redirects /*.map 404 eksik" >&2
  exit 1
fi

for forbidden in csp.txt publish.allowlist; do
  [[ -e "$DEPLOY/$forbidden" ]] && { echo "  [FAIL] deploy: $forbidden" >&2; exit 1; }
  echo "  [OK] deploy paketinde yok: $forbidden"
done

if [[ -f "$ROOT/wrangler.toml" ]] && grep -q 'pages_build_output_dir = "assets/website-deploy"' "$ROOT/wrangler.toml"; then
  echo "  [OK] wrangler.toml output dizini"
else
  echo "  [FAIL] wrangler.toml pages_build_output_dir eksik/yanlis" >&2
  exit 1
fi

bash "$ROOT/scripts/website_smoke.sh"
bash "$ROOT/scripts/website_i18n_browser_smoke.sh"

echo ""
echo "[OK] website_deploy_gate"
echo "  Cloudflare Pages output: assets/website-deploy"
echo "  Prod onizleme: LG_WEBSITE_PREVIEW=deploy bash scripts/preview_website.sh"
echo "  Rehber: docs/WEBSITE_DEPLOY.md"
echo "  Canli kontrol (domain sonrasi): curl -sI https://DOMAIN/csp.txt  # 404"
