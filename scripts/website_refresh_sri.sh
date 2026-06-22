#!/usr/bin/env bash
# i18n.js / site.css degisince SRI + hash-CSP + allowlist guncelle
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SITE="$ROOT/assets/website"
CSP_FILE="$SITE/csp.txt"
HEADERS="$SITE/_headers"
ALLOWLIST="$SITE/publish.allowlist"

sri_for() {
  local file="$1"
  local hash
  hash="$(openssl dgst -sha384 -binary "$file" | openssl base64 -A)"
  echo "sha384-${hash}"
}

SRI_I18N="$(sri_for "$SITE/i18n.js")"
SRI_CSS="$(sri_for "$SITE/site.css")"
SRI_TESTS="$(sri_for "$SITE/test-results.js")"

export SITE CSP_FILE HEADERS ALLOWLIST
export SRI_I18N SRI_CSS SRI_TESTS

python3 <<'PY'
import os
import re
from pathlib import Path

site_dir = Path(os.environ["SITE"])
csp_path = Path(os.environ["CSP_FILE"])
headers_path = Path(os.environ["HEADERS"])
allowlist_path = Path(os.environ["ALLOWLIST"])
sri_i18n = os.environ["SRI_I18N"]
sri_css = os.environ["SRI_CSS"]
sri_tests = os.environ["SRI_TESTS"]


def js_cache_slug(sri: str) -> str:
    return sri.replace("sha384-", "").replace("+", "x").replace("/", "x")[:12]


I18N_VER = js_cache_slug(sri_i18n)
TESTS_VER = js_cache_slug(sri_tests)


def build_csp(js_hashes: list[str], css_hash: str, *, upgrade: bool = False) -> str:
    script_src = " ".join(f"'{h}'" for h in js_hashes)
    parts = [
        "default-src 'none'",
        f"script-src {script_src}",
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


CORE_PATHS = [
    "index.html",
    "tests.html",
    "404.html",
    "i18n.js",
    "test-results.js",
    "favicon.ico",
    "favicon-32.png",
    "logo.png",
    "hero-circuit.png",
    "robots.txt",
    ".well-known/security.txt",
    ".well-known/gpc.json",
]


def patch_html(html_path: Path, *, include_tests: bool) -> str:
    html = html_path.read_text(encoding="utf-8")

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
        raise SystemExit(f"[website_refresh_sri] {html_path.name} integrity meta bulunamadi")

    html, n_js = re.subn(
        r'<script src="(?:\./|/)i18n\.js(?:\?[^"]*)?"[^>]*>',
        f'<script src="/i18n.js?v={I18N_VER}" defer integrity="{sri_i18n}" crossorigin="anonymous">',
        html,
        count=1,
    )
    if n_js != 1:
        raise SystemExit(f"[website_refresh_sri] {html_path.name} i18n.js script tag bulunamadi")

    if include_tests:
        if re.search(r'<script src="(?:\./|/)test-results\.js', html):
            html, n_tr = re.subn(
                r'<script src="(?:\./|/)test-results\.js(?:\?[^"]*)?"[^>]*>',
                f'<script src="/test-results.js?v={TESTS_VER}" defer integrity="{sri_tests}" crossorigin="anonymous">',
                html,
                count=1,
            )
            if n_tr != 1:
                raise SystemExit(f"[website_refresh_sri] {html_path.name} test-results.js script tag bulunamadi")
        js_hashes = [sri_i18n, sri_tests]
    else:
        html = re.sub(r'\s*<script src="(?:\./|/)test-results\.js(?:\?[^"]*)?"[^>]*></script>', "", html)
        js_hashes = [sri_i18n]

    site_src = site_dir / "site.css"
    if not site_src.is_file():
        raise SystemExit("[website_refresh_sri] site.css yok")
    slug = sri_css.replace("sha384-", "").replace("+", "x").replace("/", "x")[:12]
    ver_name = f"site-{slug}.css"
    ver_path = site_dir / ver_name
    ver_path.write_bytes(site_src.read_bytes())

    html, n_css = re.subn(
        r'<link rel="stylesheet" href="(?:\./|/)(site[^"]*\.css)"[^>]*/?>',
        f'<link rel="stylesheet" href="/{ver_name}" id="lg-site-css" '
        f'integrity="{sri_css}" />',
        html,
        count=1,
    )
    if n_css != 1:
        raise SystemExit(f"[website_refresh_sri] {html_path.name} site.css link tag bulunamadi")

    page_csp = build_csp(js_hashes, sri_css)
    meta_csp = page_csp.replace('"', "&quot;")
    html, n_meta = re.subn(
        r'<meta http-equiv="Content-Security-Policy" content="[^"]*" />',
        f'<meta http-equiv="Content-Security-Policy" content="{meta_csp}" />',
        html,
        count=1,
    )
    if n_meta != 1:
        raise SystemExit(f"[website_refresh_sri] {html_path.name} meta CSP bulunamadi")

    html_path.write_text(html, encoding="utf-8")
    return html


# versioned CSS — tek kopya
for old in site_dir.glob("site-*.css"):
    slug = sri_css.replace("sha384-", "").replace("+", "x").replace("/", "x")[:12]
    if old.name != f"site-{slug}.css":
        old.unlink()

index_html = patch_html(site_dir / "index.html", include_tests=False)
tests_html = patch_html(site_dir / "tests.html", include_tests=True)


def write_allowlist(*html_blobs: str) -> None:
    linked: set[str] = set()
    css_linked: set[str] = set()
    for html in html_blobs:
        linked |= set(re.findall(r'(?:href|src)="((?:evidence|screenshots)/[^"#?]+)"', html))
        css_linked |= set(re.findall(r'href="(?:\./|/)(site[^"]*\.css)"', html))
    paths = sorted(set(CORE_PATHS) | linked | css_linked)
    body = "# Statik site — otomatik uretildi (website_refresh_sri.sh)\n"
    body += "\n".join(paths) + "\n"
    allowlist_path.write_text(body, encoding="utf-8")


write_allowlist(index_html, tests_html)

prod_csp = build_csp([sri_i18n, sri_tests], sri_css, upgrade=True)
csp_path.write_text(prod_csp + "\n", encoding="utf-8")

headers = headers_path.read_text(encoding="utf-8")
headers, n_hdr = re.subn(
    r"  Content-Security-Policy: .*",
    f"  Content-Security-Policy: {prod_csp}",
    headers,
    count=1,
)
if n_hdr != 1:
    raise SystemExit("[website_refresh_sri] _headers CSP bulunamadi")

if "/tests.html" not in headers:
    headers = headers.replace(
        "/index.html\n  Cache-Control: no-store, no-cache, must-revalidate",
        "/index.html\n  Cache-Control: no-store, no-cache, must-revalidate\n\n/tests.html\n  Cache-Control: no-store, no-cache, must-revalidate\n  Pragma: no-cache",
    )

headers_path.write_text(headers, encoding="utf-8")

allow_count = len([l for l in allowlist_path.read_text().splitlines() if l.strip() and not l.startswith("#")])
print(f"[OK] i18n.js SRI: {sri_i18n[:28]}...")
print(f"[OK] site.css SRI: {sri_css[:28]}...")
print(f"[OK] publish.allowlist ({allow_count} yol)")
print("[OK] csp.txt + index/tests meta + _headers guncellendi")
PY
