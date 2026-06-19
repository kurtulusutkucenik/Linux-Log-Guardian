#!/usr/bin/env bash
# Statik site guvenlik kapisi (Faz E)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/assets/website"
CSP_FILE="$SITE/csp.txt"
ALLOWLIST="$SITE/publish.allowlist"
FAIL=0

warn() { echo "  [WARN] $*"; }
ok() { echo "  [OK] $*"; }
bad() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }

echo "=== website_security_check ==="

[[ -f "$SITE/index.html" ]] || { bad "index.html yok"; exit 1; }
[[ -f "$SITE/i18n.js" ]] || bad "i18n.js yok"
[[ -f "$SITE/site.css" ]] || bad "site.css yok"
if head -1 "$SITE/site.css" | grep -q ':root'; then
  ok "site.css :root"
else
  bad "site.css gecersiz ( :root { eksik )"
fi
[[ -f "$SITE/csp.txt" ]] || bad "csp.txt yok"
[[ -f "$ALLOWLIST" ]] || bad "publish.allowlist yok"
[[ -f "$SITE/_headers" ]] || bad "_headers yok (deploy basliklari)"
[[ -f "$SITE/_redirects" ]] || bad "_redirects yok (Cloudflare Pages 404)"
[[ -f "$SITE/robots.txt" ]] || bad "robots.txt yok"
[[ -f "$SITE/.well-known/security.txt" ]] || bad "security.txt yok"
[[ -f "$ROOT/scripts/website_secure_server.py" ]] || bad "website_secure_server.py yok"

node --check "$SITE/i18n.js" 2>/dev/null && ok "i18n.js syntax" || bad "i18n.js syntax"

if grep -q 'eval(' "$SITE/i18n.js" 2>/dev/null; then
  bad "i18n.js icinde eval()"
else
  ok "eval yok"
fi

if grep -q 'sanitizeHtml' "$SITE/i18n.js" && grep -q 'MAX_I18N_HTML_LEN' "$SITE/i18n.js"; then
  ok "HTML sanitizasyonu"
else
  bad "sanitizeHtml / uzunluk limiti eksik"
fi

if grep -q '__lgExpected' "$SITE/i18n.js" && grep -q 'installDomGuard' "$SITE/i18n.js"; then
  ok "SRI meta gate + DOM guard"
else
  bad "SRI meta gate / DOM guard eksik"
fi

if grep -q 'purgeServiceWorkers' "$SITE/i18n.js"; then
  ok "serviceWorker temizligi"
else
  bad "serviceWorker temizligi eksik"
fi

if grep -q 'trustedTypes' "$SITE/i18n.js" && grep -q 'setSafeHtml' "$SITE/i18n.js"; then
  ok "Trusted Types"
else
  bad "Trusted Types eksik"
fi

if grep -q 'Object.freeze(I18N)' "$SITE/i18n.js"; then
  ok "I18N freeze"
else
  bad "I18N freeze eksik"
fi

if grep -qE ' style=' "$SITE/index.html"; then
  bad "inline style attribute var"
else
  ok "inline style yok"
fi

if grep -q '<style' "$SITE/index.html"; then
  bad "inline <style> blogu var"
else
  ok "inline <style> yok"
fi

if grep -q "unsafe-inline" "$SITE/index.html" "$SITE/_headers" "$SITE/csp.txt" 2>/dev/null; then
  bad "CSP unsafe-inline bulundu"
else
  ok "CSP unsafe-inline yok"
fi

CSP="$(tr -d '\n' < "$CSP_FILE" | sed 's/  */ /g' | sed 's/;$//')"
META_CSP="$(grep -oP 'http-equiv="Content-Security-Policy" content="\K[^"]+' "$SITE/index.html" | sed 's/;$//' || true)"
if [[ -n "$META_CSP" && "$META_CSP" == "$CSP" ]]; then
  ok "meta CSP == csp.txt"
else
  bad "meta CSP csp.txt ile uyumsuz (bash scripts/website_refresh_sri.sh)"
fi

if grep -q "require-sri-for script" "$CSP_FILE" && ! grep -q "require-sri-for script style" "$CSP_FILE"; then
  ok "require-sri-for script"
else
  bad "require-sri-for script (style haric) eksik"
fi

if grep -q "style-src 'self'" "$CSP_FILE"; then
  ok "style-src self + hash"
else
  bad "style-src self eksik"
fi

META_I18N_SRI="$(grep -oP 'name="lg-integrity-i18n" content="\K[^"]+' "$SITE/index.html" || true)"
SCRIPT_SRI="$(grep -oP 'i18n\.js" defer integrity="\K[^"]+' "$SITE/index.html" || true)"
if [[ -n "$META_I18N_SRI" && "$META_I18N_SRI" == "$SCRIPT_SRI" ]]; then
  ok "lg-integrity-i18n == script SRI"
else
  bad "lg-integrity-i18n uyumsuz (website_build.sh)"
fi

if grep -q 'translate="no"' "$SITE/index.html" && grep -q 'notranslate' "$SITE/index.html"; then
  ok "ceviri enjeksiyon korumasi"
else
  bad "translate=no / notranslate eksik"
fi

if grep -q "script-src 'sha384-" "$CSP_FILE" && ! grep -q "script-src 'self'" "$CSP_FILE"; then
  ok "hash-only script-src"
else
  bad "hash-only script-src eksik (website_build.sh)"
fi

if grep -q "script-src-attr 'none'" "$CSP_FILE" && grep -q "style-src-attr 'none'" "$CSP_FILE"; then
  ok "src-attr none"
else
  bad "script/style-src-attr 'none' eksik"
fi

if grep -q "block-all-mixed-content" "$SITE/_headers"; then
  ok "block-all-mixed-content (prod)"
else
  bad "block-all-mixed-content eksik"
fi

if grep -q 'require-trusted-types-for' "$CSP_FILE" "$SITE/index.html" "$SITE/_headers"; then
  ok "Trusted Types CSP"
else
  bad "require-trusted-types-for eksik"
fi

if grep -q 'integrity=' "$SITE/index.html" && grep -q 'i18n.js' "$SITE/index.html"; then
  ok "i18n.js SRI"
else
  warn "i18n.js SRI yok (bash scripts/website_refresh_sri.sh)"
fi

if grep -q 'site.css' "$SITE/index.html" && grep -q 'integrity=' "$SITE/index.html"; then
  ok "site.css SRI"
else
  warn "site.css SRI yok (bash scripts/website_refresh_sri.sh)"
fi

if grep -q 'lg-integrity-css' "$SITE/index.html"; then
  ok "lg-integrity-css meta"
else
  bad "lg-integrity-css meta eksik"
fi

META_CSS="$(grep -oP 'name="lg-integrity-css" content="\K[^"]+' "$SITE/index.html" || true)"
LINK_CSS="$(grep -oP 'id="lg-site-css" integrity="\K[^"]+' "$SITE/index.html" || true)"
if [[ -n "$META_CSS" && "$META_CSS" == "$LINK_CSS" ]]; then
  ok "lg-integrity-css == link SRI"
else
  bad "lg-integrity-css uyumsuz (website_build.sh)"
fi

if grep -q 'id="lg-site-css"' "$SITE/index.html" && ! grep -q 'lg-site-css" integrity="[^"]*" crossorigin' "$SITE/index.html"; then
  ok "site.css crossorigin yok"
else
  bad "site.css crossorigin var (CSS kirilir)"
fi

if grep -q "prefetch-src 'none'" "$CSP_FILE"; then
  ok "prefetch-src none"
else
  bad "prefetch-src none eksik"
fi

if grep -q "manifest-src 'none'" "$CSP_FILE" && grep -q "base-uri 'none'" "$CSP_FILE"; then
  ok "manifest-src + base-uri none"
else
  bad "manifest-src / base-uri none eksik"
fi

if [[ -f "$SITE/.well-known/gpc.json" ]]; then
  ok "gpc.json"
else
  bad "gpc.json eksik"
fi

if grep -qE 'href="https?://|src="https?://' "$SITE/index.html" 2>/dev/null; then
  bad "index.html dis URL"
else
  ok "index dis URL yok"
fi

if [[ -f "$ROOT/scripts/website_audit_deploy.sh" ]]; then
  ok "website_audit_deploy.sh"
else
  bad "website_audit_deploy.sh eksik"
fi

if [[ -f "$ROOT/scripts/website_smoke.sh" ]]; then
  ok "website_smoke.sh"
else
  bad "website_smoke.sh eksik"
fi

if [[ -f "$ROOT/scripts/website_ensure_deploy.sh" ]]; then
  ok "website_ensure_deploy.sh"
else
  bad "website_ensure_deploy.sh eksik"
fi

if [[ -f "$ROOT/wrangler.toml" ]] && grep -q 'pages_build_output_dir = "assets/website-deploy"' "$ROOT/wrangler.toml"; then
  ok "wrangler.toml output"
else
  bad "wrangler.toml output eksik"
fi

if grep -q "Strict-Transport-Security" "$SITE/_headers"; then
  ok "HSTS (_headers)"
else
  bad "HSTS eksik"
fi

if grep -q "Cross-Origin-Resource-Policy" "$SITE/_headers"; then
  ok "CORP (_headers)"
else
  bad "CORP eksik"
fi

if grep -q "^Expires:" "$SITE/.well-known/security.txt"; then
  ok "security.txt Expires"
  exp_line="$(grep "^Expires:" "$SITE/.well-known/security.txt" | head -1 | cut -d: -f2- | xargs)"
  days_left="$(python3 - "$exp_line" <<'PY'
import sys
from datetime import datetime, timezone
raw = sys.argv[1].strip()
for fmt in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
    try:
        exp = datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc)
        break
    except ValueError:
        exp = None
if exp is None:
    print("-1")
else:
    print(int((exp - datetime.now(timezone.utc)).total_seconds() // 86400))
PY
)"
  if [[ "$days_left" -lt 0 ]]; then
    bad "security.txt suresi dolmus ($exp_line)"
  elif [[ "$days_left" -lt 90 ]]; then
    warn "security.txt ${days_left} gun icinde yenilenmeli ($exp_line)"
  else
    ok "security.txt gecerlilik (${days_left} gun)"
  fi
else
  bad "security.txt Expires eksik"
fi

if [[ -f "$SITE/404.html" ]]; then
  ok "404.html"
else
  bad "404.html eksik"
fi

if grep -q 'class="skip-link"' "$SITE/index.html"; then
  ok "skip-link a11y"
else
  bad "skip-link eksik"
fi

if grep -q 'property="og:title"' "$SITE/index.html" && grep -q 'name="twitter:card"' "$SITE/index.html"; then
  ok "OG / Twitter meta"
else
  bad "OG / Twitter meta eksik"
fi

if grep -qxF "404.html" "$ALLOWLIST"; then
  ok "404.html allowlist"
else
  bad "404.html allowlist disi"
fi

if [[ -f "$ROOT/scripts/website_i18n_browser_smoke.py" ]]; then
  ok "website_i18n_browser_smoke.py"
else
  bad "website_i18n_browser_smoke.py eksik"
fi

if grep -q "Cross-Origin-Embedder-Policy" "$SITE/_headers"; then
  ok "COEP (_headers prod)"
else
  bad "COEP eksik (_headers)"
fi

if grep -qF "/csp.txt" "$SITE/_redirects" && grep -q "404" "$SITE/_redirects"; then
  ok "_redirects hassas dosya 404"
else
  bad "_redirects csp/publish 404 eksik"
fi

if [[ -f "$ROOT/scripts/website_deploy_gate.sh" ]]; then
  ok "website_deploy_gate.sh"
else
  bad "website_deploy_gate.sh eksik"
fi

if [[ -f "$ROOT/scripts/website_pack_deploy.sh" ]]; then
  ok "website_pack_deploy.sh"
else
  bad "website_pack_deploy.sh eksik"
fi

if grep -q "load_allowlist" "$ROOT/scripts/website_secure_server.py"; then
  ok "sunucu allowlist dosyasi"
else
  bad "sunucu allowlist eksik"
fi

if grep -q 'target="_blank"' "$SITE/index.html" && ! grep -q 'rel="noopener noreferrer"' "$SITE/index.html"; then
  bad 'target="_blank" rel="noopener noreferrer" eksik'
else
  ok "noopener noreferrer"
fi

if grep -q "_host_ok" "$ROOT/scripts/website_secure_server.py" && grep -q "_rate_ok" "$ROOT/scripts/website_secure_server.py"; then
  ok "host + rate limit"
else
  bad "host / rate limit eksik"
fi

if grep -q "HOTLINK_PREFIXES" "$ROOT/scripts/website_secure_server.py"; then
  ok "hotlink korumasi"
else
  bad "hotlink korumasi eksik"
fi

if [[ -x "$ROOT/scripts/website_build.sh" ]] || [[ -f "$ROOT/scripts/website_build.sh" ]]; then
  ok "website_build.sh"
else
  bad "website_build.sh eksik"
fi

# allowlist: her satir mevcut dosya
while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | xargs)"
  [[ -z "$line" ]] && continue
  if [[ ! -f "$SITE/$line" ]]; then
    bad "allowlist dosya yok: $line"
  fi
done < "$ALLOWLIST"
[[ $FAIL -eq 0 ]] && ok "publish.allowlist dosyalari"

# index.html evidence linkleri allowlist icinde
while IFS= read -r href; do
  href="${href#evidence/}"
  if ! grep -qxF "evidence/$href" "$ALLOWLIST"; then
    bad "index evidence allowlist disi: evidence/$href"
  fi
done < <(grep -oP 'href="evidence/[^"]+' "$SITE/index.html" | sed 's/href="//')

# allowlist disi evidence/screenshot dosyalari
while IFS= read -r extra; do
  rel="${extra#"$SITE/"}"
  [[ -z "$rel" ]] && continue
  case "$rel" in
    _headers|_redirects|csp.txt|publish.allowlist|logo-transparent.png) continue ;;
  esac
  if grep -qxF "$rel" "$ALLOWLIST" 2>/dev/null; then
    continue
  fi
  if [[ "$rel" == evidence/* ]] || [[ "$rel" == screenshots/* ]]; then
    warn "allowlist disi dosya (servis edilmez): $rel"
  fi
done < <(find "$SITE" -type f | sort)

if [[ -f "$SITE/logo.svg" ]]; then
  warn "logo.svg hala duruyor (kullanilmiyorsa silin)"
fi

if [[ $FAIL -eq 0 ]]; then
  echo "[OK] website_security_check"
  exit 0
fi
echo "[FAIL] website_security_check ($FAIL hata)"
exit 1
