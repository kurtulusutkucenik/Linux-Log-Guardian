#!/usr/bin/env bash
# Cloudflare Web Analytics + Google Search Console hazırlığı
#
# Otomatik (DNS + analytics token):
#   LG_CF_API_TOKEN=<cloudflare api token> bash scripts/website_search_setup.sh
#
# Sadece GSC meta tag (API token gerekmez):
#   GSC_META_TOKEN=<google verification content> bash scripts/website_search_setup.sh
#
# Sonra canlıya:
#   bash scripts/website_publish.sh
#
# GSC sitemap (doğrulama sonrası, tarayıcıda bir kez):
#   https://search.google.com/search-console → Site haritaları →
#   https://ceniklinuxlogguardian.org/sitemap.xml
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LANDING="$ROOT/landing"
ENV_LOCAL="$LANDING/.env.local"
DOMAIN="${LG_WEBSITE_DOMAIN:-ceniklinuxlogguardian.org}"
ACCOUNT_ID="${LG_CF_ACCOUNT_ID:-04b2cf9bf0a351963e01d716c4e47f5a}"
TOKEN="${LG_CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}"
GSC_META="${GSC_META_TOKEN:-${NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:-}}"

write_env() {
  local key="$1" val="$2"
  touch "$ENV_LOCAL"
  if grep -q "^${key}=" "$ENV_LOCAL" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_LOCAL"
  else
    echo "${key}=${val}" >> "$ENV_LOCAL"
  fi
  echo "  [OK] $ENV_LOCAL → $key"
}

cf_api() {
  local method="$1" url="$2"
  shift 2
  curl -sf --max-time 30 -X "$method" "$url" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

echo "=== website_search_setup ==="
echo "  domain: $DOMAIN"
echo ""

# --- 1) Cloudflare Web Analytics ---
if [[ -n "$TOKEN" ]]; then
  echo ">> Cloudflare Web Analytics (API)"
  ZONE=$(cf_api GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}&status=active" \
    | python3 -c "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')" 2>/dev/null || true)

  BEACON=$(cf_api GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rum/site_info/list" \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
for s in d.get('result') or []:
    for r in s.get('rules') or []:
        if '${DOMAIN}' in (r.get('host') or ''):
            print(s.get('site_token') or '')
            raise SystemExit
" 2>/dev/null || true)

  if [[ -z "$BEACON" ]]; then
    echo "  Yeni Web Analytics sitesi oluşturuluyor..."
  payload='{"host":"'"$DOMAIN"'"}'
    if [[ -n "$ZONE" ]]; then
      payload='{"host":"'"$DOMAIN"'","zone_tag":"'"$ZONE"'","auto_install":false}'
    fi
    BEACON=$(cf_api POST "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/rum/site_info" \
      -d "$payload" \
      | python3 -c "import json,sys; print((json.load(sys.stdin).get('result') or {}).get('site_token',''))" 2>/dev/null || true)
  fi

  if [[ -n "$BEACON" ]]; then
    write_env "NEXT_PUBLIC_CF_BEACON" "$BEACON"
  else
    echo "  [WARN] Analytics token alınamadı — Dashboard → Web Analytics → Add site → $DOMAIN" >&2
  fi
else
  echo ">> Cloudflare Web Analytics (manuel)"
  echo "  LG_CF_API_TOKEN yok. Dashboard:"
  echo "    https://dash.cloudflare.com → Web Analytics → Add a site → $DOMAIN"
  echo "  Token'ı landing/.env.local içine yaz:"
  echo "    NEXT_PUBLIC_CF_BEACON=<token>"
fi

echo ""

# --- 2) Google Search Console ---
if [[ -n "$GSC_META" ]]; then
  echo ">> Google Search Console (meta tag)"
  write_env "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION" "$GSC_META"
elif [[ -n "$TOKEN" ]]; then
  echo ">> Google Search Console (DNS TXT — hazırlık)"
  echo "  1) https://search.google.com/search-console → Mülk ekle → $DOMAIN"
  echo "  2) Doğrulama: DNS kaydı → google-site-verification=XXXXX kopyala"
  echo "  3) Tekrar çalıştır:"
  echo "     GSC_DNS_TXT='google-site-verification=XXXXX' LG_CF_API_TOKEN=... bash scripts/website_search_setup.sh"
  if [[ -n "${GSC_DNS_TXT:-}" ]]; then
    ZONE="${ZONE:-$(cf_api GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}&status=active" \
      | python3 -c "import json,sys; r=json.load(sys.stdin).get('result') or []; print(r[0]['id'] if r else '')")}"
    if [[ -n "$ZONE" ]]; then
      cf_api POST "https://api.cloudflare.com/client/v4/zones/${ZONE}/dns_records" \
        -d "{\"type\":\"TXT\",\"name\":\"${DOMAIN}\",\"content\":\"${GSC_DNS_TXT}\",\"ttl\":3600}" \
        >/dev/null && echo "  [OK] DNS TXT eklendi — Search Console'da Doğrula'ya bas"
    fi
  fi
else
  echo ">> Google Search Console (meta tag — önerilen)"
  echo "  1) https://search.google.com/search-console → Mülk ekle → $DOMAIN"
  echo "  2) Doğrulama yöntemi: HTML etiketi → content=\"...\" değerini kopyala"
  echo "  3) Çalıştır:"
  echo "     GSC_META_TOKEN=<content-değeri> bash scripts/website_search_setup.sh"
  echo "     bash scripts/website_publish.sh"
  echo "  4) Search Console'da Doğrula → Site haritaları → sitemap.xml ekle"
fi

echo ""
echo "[OK] website_search_setup"
if [[ -f "$ENV_LOCAL" ]]; then
  echo "  Sonraki adım: bash scripts/website_publish.sh"
else
  echo "  .env.local oluşmadı — yukarıdaki manuel adımları tamamla"
fi
