#!/usr/bin/env bash
# Three.js + lg-scene → webgl-runtime.js (CSP hash bundle)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/assets/website"
ESBUILD="$SITE/node_modules/.bin/esbuild"

if [[ ! -x "$ESBUILD" ]]; then
  echo "[website_bundle_webgl] esbuild yok — cd assets/website && npm install" >&2
  exit 1
fi

"$ESBUILD" "$SITE/webgl/entry.js" \
  --bundle \
  --format=iife \
  --minify \
  --target=es2020 \
  --outfile="$SITE/webgl-runtime.js"

echo "[OK] website_bundle_webgl -> webgl-runtime.js ($(wc -c < "$SITE/webgl-runtime.js" | tr -d ' ') bytes)"
