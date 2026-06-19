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
  if [[ -z "$src_i18n" || "$src_i18n" != "$dep_i18n" ]]; then
    need_pack=1
  fi
fi

if [[ $need_pack -eq 1 ]]; then
  echo "[website_ensure_deploy] paket yenileniyor..."
  bash "$ROOT/scripts/website_build.sh"
  bash "$ROOT/scripts/website_pack_deploy.sh"
fi

bash "$ROOT/scripts/website_audit_deploy.sh"
