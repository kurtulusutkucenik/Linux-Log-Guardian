#!/usr/bin/env bash
# Deploy paketi yoksa veya kaynak ile uyumsuzsa yenile
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets/website"
DEPLOY="$ROOT/assets/website-deploy"
MANIFEST="$ROOT/assets/website-deploy.manifest.json"

need_pack=0
if [[ ! -f "$DEPLOY/index.html" ]]; then
  need_pack=1
elif [[ ! -f "$MANIFEST" ]]; then
  need_pack=1
else
  src_i18n="$(grep -oP 'name="lg-integrity-i18n" content="\K[^"]+' "$SRC/index.html" 2>/dev/null || true)"
  dep_i18n="$(grep -oP 'name="lg-integrity-i18n" content="\K[^"]+' "$DEPLOY/index.html" 2>/dev/null || true)"
  src_css="$(grep -oP 'name="lg-integrity-css" content="\K[^"]+' "$SRC/index.html" 2>/dev/null || true)"
  dep_css="$(grep -oP 'name="lg-integrity-css" content="\K[^"]+' "$DEPLOY/index.html" 2>/dev/null || true)"
  src_tests_js="$(grep -oP 'test-results\.js\?[^"]+' "$SRC/tests.html" 2>/dev/null || grep -oP 'test-results\.js"[^>]*integrity="\K[^"]+' "$SRC/tests.html" 2>/dev/null || true)"
  dep_tests_js="$(grep -oP 'test-results\.js\?[^"]+' "$DEPLOY/tests.html" 2>/dev/null || grep -oP 'test-results\.js"[^>]*integrity="\K[^"]+' "$DEPLOY/tests.html" 2>/dev/null || true)"
  if [[ -z "$src_i18n" || "$src_i18n" != "$dep_i18n" || -z "$src_css" || "$src_css" != "$dep_css" || "$src_tests_js" != "$dep_tests_js" ]]; then
    need_pack=1
  fi
fi

if [[ $need_pack -eq 1 ]]; then
  echo "[website_ensure_deploy] paket yenileniyor..."
  bash "$ROOT/scripts/website_build.sh"
  bash "$ROOT/scripts/website_pack_deploy.sh"
fi

bash "$ROOT/scripts/website_audit_deploy.sh"
