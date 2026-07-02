#!/usr/bin/env bash
# Domain / Cloudflare Pages tek kapı — CANLI SITE = Next.js "landing/" (24 dil)
# Cloudflare Pages: Build command = bash scripts/website_deploy_gate.sh
#                   Build output  = landing/out  (wrangler.toml ile ayni)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANDING="$ROOT/landing"
OUT="$LANDING/out"

echo "=== website_deploy_gate (landing) ==="

# 1) Kanit dosyalarini tazele + landing/public/evidence altina senkronla
bash "$ROOT/scripts/sync_evidence_pack.sh" || true
bash "$ROOT/scripts/landing_sync_assets.sh"

# 2) Next.js statik export
cd "$LANDING"
if [[ -f "$LANDING/.env.local" ]]; then
  echo "  [OK] landing/.env.local yüklenecek (analytics / GSC)"
fi
if [[ -n "${CI:-}" || ! -d node_modules ]]; then
  npm ci
fi
npm run build

# 3) Cikti dogrulama
[[ -d "$OUT" ]] || { echo "[FAIL] landing/out yok" >&2; exit 1; }
for f in index.html 404.html _headers _redirects; do
  [[ -e "$OUT/$f" ]] || { echo "[FAIL] landing/out/$f eksik" >&2; exit 1; }
  echo "  [OK] $f"
done

# 4) Guvenlik basligi ve gizli-yol kontrolu
grep -q 'Strict-Transport-Security' "$OUT/_headers" || { echo "[FAIL] HSTS eksik" >&2; exit 1; }
grep -q 'Content-Security-Policy' "$OUT/_headers"   || { echo "[FAIL] CSP eksik" >&2; exit 1; }
grep -q '/.git/\*' "$OUT/_redirects"                || { echo "[FAIL] _redirects .git 404 eksik" >&2; exit 1; }
echo "  [OK] guvenlik basliklari + gizli-yol 404"

# 5) wrangler output dizini dogrulama
if [[ -f "$ROOT/wrangler.toml" ]] && grep -q 'pages_build_output_dir = "landing/out"' "$ROOT/wrangler.toml"; then
  echo "  [OK] wrangler.toml output dizini -> landing/out"
else
  echo "  [FAIL] wrangler.toml pages_build_output_dir landing/out degil" >&2
  exit 1
fi

echo ""
echo "[OK] website_deploy_gate"
echo "  Cloudflare Pages output: landing/out"
echo "  Onizleme: cd landing && bash scripts/preview.sh   (veya cd landing/out && python3 -m http.server 4321)"
echo "  Rehber: docs/WEBSITE_DEPLOY.md"
