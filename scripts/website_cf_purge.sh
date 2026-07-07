#!/usr/bin/env bash
# Cloudflare cache purge — deploy sonrasi i18n.js SRI drift
#   LG_CF_API_TOKEN=... bash scripts/website_cf_purge.sh
#   LG_CF_ZONE_ID=... LG_CF_API_TOKEN=... bash scripts/website_cf_purge.sh
# Publish ile: LG_CF_PURGE=1 LG_WEBSITE_PUBLISH=1 bash scripts/website_publish.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/cf_env.sh
source "$ROOT/scripts/lib/cf_env.sh"
DOMAIN="${LG_WEBSITE_DOMAIN:-ceniklinuxlogguardian.org}"
TOKEN="${LG_CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
ZONE="${LG_CF_ZONE_ID:-}"

fail() { echo "[website_cf_purge] FAIL: $*" >&2; exit 1; }

if [[ -z "$TOKEN" ]]; then
  echo "[website_cf_purge] WARN: LG_CF_API_TOKEN yok — manuel purge:" >&2
  echo "  Cloudflare Dashboard → $DOMAIN → Caching → Purge Everything" >&2
  echo "  Speed → Optimization → Auto Minify JS: KAPALI (SRI icin)" >&2
  exit 2
fi

if [[ -z "$ZONE" ]]; then
  ZONE=$(curl -sf --max-time 15 \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}&status=active" \
    | python3 -c "
import json, sys
d = json.load(sys.stdin)
r = d.get('result') or []
print(r[0]['id'] if r else '')
" 2>/dev/null || true)
fi

[[ -n "$ZONE" ]] || fail "zone bulunamadi ($DOMAIN) — LG_CF_ZONE_ID ayarla"

echo "=== website_cf_purge ==="
echo "  domain=$DOMAIN zone=$ZONE"

resp=$(curl -sf --max-time 30 -X POST \
  "https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}' 2>&1) || fail "API istegi basarisiz"

ok=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo false)
[[ "$ok" == "True" || "$ok" == "true" ]] || fail "purge reddedildi: $resp"

echo "[OK] website_cf_purge — Purge Everything ($DOMAIN)"
echo "  30sn sonra: bash scripts/website_live_js_check.sh"
