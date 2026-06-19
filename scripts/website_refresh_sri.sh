#!/usr/bin/env bash
# i18n.js / site.css degisince SRI + hash-CSP + allowlist guncelle
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/assets/website"
HTML="$SITE/index.html"
CSP_FILE="$SITE/csp.txt"
HEADERS="$SITE/_headers"
ALLOWLIST="$SITE/publish.allowlist"
I18N="$SITE/i18n.js"

sri_for() {
  local file="$1"
  local hash
  hash="$(openssl dgst -sha384 -binary "$file" | openssl base64 -A)"
  echo "sha384-${hash}"
}

export HTML CSP_FILE HEADERS ALLOWLIST
export SRI_I18N SRI_CSS
SRI_I18N="$(sri_for "$SITE/i18n.js")"
SRI_CSS="$(sri_for "$SITE/site.css")"

python3 <<'PY'
import os
import re
from pathlib import Path

html_path = Path(os.environ["HTML"])
csp_path = Path(os.environ["CSP_FILE"])
headers_path = Path(os.environ["HEADERS"])
allowlist_path = Path(os.environ["ALLOWLIST"])
sri_i18n = os.environ["SRI_I18N"]
sri_css = os.environ["SRI_CSS"]

CORE_PATHS = [
    "index.html",
    "404.html",
    "site.css",
    "i18n.js",
    "favicon.ico",
    "favicon-32.png",
    "logo.png",
    "hero-circuit.png",
    "robots.txt",
    ".well-known/security.txt",
    ".well-known/gpc.json",
]


def build_csp(js_hash: str, css_hash: str, *, upgrade: bool = False) -> str:
    parts = [
        "default-src 'none'",
        f"script-src '{js_hash}'",
        "script-src-attr 'none'",
        f"style-src 'self' '{css_hash}'",
        "style-src-attr 'none'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'none'",
        "frame-src 'none'",
        "frame-ancestors 'none'",
        "child-src 'none'",
        "worker-src 'none'",
        "media-src 'none'",
        "prefetch-src 'none'",
        "manifest-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "navigate-to 'self' mailto:",
        "trusted-types lgI18n",
        "require-trusted-types-for 'script'",
        "require-sri-for script",
    ]
    if upgrade:
        parts.extend(["upgrade-insecure-requests", "block-all-mixed-content"])
    return "; ".join(parts) + ";"


def write_allowlist(html: str) -> None:
    linked = set(re.findall(r'(?:href|src)="((?:evidence|screenshots)/[^"#?]+)"', html))
    paths = sorted(set(CORE_PATHS) | linked)
    body = "# Statik site — otomatik uretildi (website_refresh_sri.sh)\n"
    body += "\n".join(paths) + "\n"
    allowlist_path.write_text(body, encoding="utf-8")


csp = build_csp(sri_i18n, sri_css)
csp_path.write_text(csp + "\n", encoding="utf-8")

html = html_path.read_text(encoding="utf-8")
write_allowlist(html)

if 'name="lg-integrity-i18n"' in html:
    html, n_int = re.subn(
        r'<meta name="lg-integrity-i18n" content="[^"]*" />',
        f'<meta name="lg-integrity-i18n" content="{sri_i18n}" />',
        html,
        count=1,
    )
else:
    html = html.replace(
        '<meta name="google" content="notranslate" />',
        f'<meta name="google" content="notranslate" />\n'
        f'  <meta name="lg-integrity-i18n" content="{sri_i18n}" />',
    )
    n_int = 1

if 'name="lg-integrity-css"' in html:
    html, n_css_meta = re.subn(
        r'<meta name="lg-integrity-css" content="[^"]*" />',
        f'<meta name="lg-integrity-css" content="{sri_css}" />',
        html,
        count=1,
    )
else:
    html = html.replace(
        f'<meta name="lg-integrity-i18n" content="{sri_i18n}" />',
        f'<meta name="lg-integrity-i18n" content="{sri_i18n}" />\n'
        f'  <meta name="lg-integrity-css" content="{sri_css}" />',
    )
    n_css_meta = 1

if n_int != 1 or n_css_meta != 1:
    raise SystemExit("[website_refresh_sri] integrity meta bulunamadi")

html, n_js = re.subn(
    r'<script src="\./i18n\.js"[^>]*>',
    f'<script src="./i18n.js" defer integrity="{sri_i18n}" crossorigin="anonymous">',
    html,
    count=1,
)
if n_js != 1:
    raise SystemExit("[website_refresh_sri] i18n.js script tag bulunamadi")

html, n_css = re.subn(
    r'<link rel="stylesheet" href="\./site\.css"[^>]*/?>',
    f'<link rel="stylesheet" href="./site.css" id="lg-site-css" '
    f'integrity="{sri_css}" />',
    html,
    count=1,
)
if n_css != 1:
    raise SystemExit("[website_refresh_sri] site.css link tag bulunamadi")

meta_csp = csp.replace('"', "&quot;")
html, n_meta = re.subn(
    r'<meta http-equiv="Content-Security-Policy" content="[^"]*" />',
    f'<meta http-equiv="Content-Security-Policy" content="{meta_csp}" />',
    html,
    count=1,
)
if n_meta != 1:
    raise SystemExit("[website_refresh_sri] meta CSP bulunamadi")

html_path.write_text(html, encoding="utf-8")

headers = headers_path.read_text(encoding="utf-8")
prod_csp = build_csp(sri_i18n, sri_css, upgrade=True)
headers, n_hdr = re.subn(
    r"  Content-Security-Policy: .*",
    f"  Content-Security-Policy: {prod_csp}",
    headers,
    count=1,
)
if n_hdr != 1:
    raise SystemExit("[website_refresh_sri] _headers CSP bulunamadi")
headers_path.write_text(headers, encoding="utf-8")

print(f"[OK] i18n.js SRI: {sri_i18n[:28]}...")
print(f"[OK] site.css SRI: {sri_css[:28]}...")
print(f"[OK] publish.allowlist ({len([l for l in allowlist_path.read_text().splitlines() if l.strip() and not l.startswith('#')])} yol)")
print("[OK] csp.txt + meta + _headers guncellendi")
PY

# Meta/script guncellemesi index hash degistirmez; i18n.js degismedi
