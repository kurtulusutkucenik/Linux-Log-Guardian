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
SRI_BOOT="$(sri_for "$SITE/boot-enter.js")"
SRI_THREE=""
SRI_PHOENIX=""
if [[ -f "$SITE/three.min.js" ]]; then
  SRI_THREE="$(sri_for "$SITE/three.min.js")"
fi
if [[ -f "$SITE/phoenix-3d.js" ]]; then
  SRI_PHOENIX="$(sri_for "$SITE/phoenix-3d.js")"
fi

export SITE CSP_FILE HEADERS ALLOWLIST
export SRI_I18N SRI_CSS SRI_TESTS SRI_BOOT SRI_THREE SRI_PHOENIX

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
sri_boot = os.environ["SRI_BOOT"]
sri_three = os.environ.get("SRI_THREE", "")
sri_phoenix = os.environ.get("SRI_PHOENIX", "")


def js_cache_slug(sri: str) -> str:
    return sri.replace("sha384-", "").replace("+", "x").replace("/", "x")[:12]


I18N_VER = js_cache_slug(sri_i18n)
TESTS_VER = js_cache_slug(sri_tests)
BOOT_VER = js_cache_slug(sri_boot)
THREE_VER = js_cache_slug(sri_three) if sri_three else ""
PHOENIX_VER = js_cache_slug(sri_phoenix) if sri_phoenix else ""


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
        "media-src 'self'",
        "prefetch-src 'none'",
        "manifest-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "object-src 'none'",
        "navigate-to 'self' mailto: https://github.com",
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
    "boot.css",
    "boot-enter.js",
    "iron-lattice.svg",
    "flag-tr.svg",
    "i18n.js",
    "test-results.js",
    "favicon.ico",
    "favicon-32.png",
    "logo.png",
    "hero-circuit.png",
    "fonts/InstrumentSerif-Regular.ttf",
    "fonts/Syne-Variable.ttf",
    "fonts/Outfit-Variable.ttf",
    "robots.txt",
    ".well-known/security.txt",
    ".well-known/gpc.json",
    "evidence/sprint-prod-proof.json",
    "evidence/siem-export-report.json",
    "evidence/taxii-feed-report.json",
    "evidence/vm-sprint-proof.json",
    "evidence/geoip-mmdb-report.json",
    "evidence/webhook-route-proof-report.json",
    "evidence/webhook-telegram-live-report.json",
    "media/core-loop.webm",
    "screenshots/dashboard-fleet.png",
    "screenshots/dashboard-grafana.png",
    "screenshots/dashboard-tests.png",
]

three_tag = ""
if sri_three:
    three_tag = (
        f'<script src="/three.min.js?v={THREE_VER}" '
        f'integrity="{sri_three}" crossorigin="anonymous"></script>'
    )
phoenix_tag = ""
if sri_phoenix:
    phoenix_tag = (
        f'<script src="/phoenix-3d.js?v={PHOENIX_VER}" defer '
        f'integrity="{sri_phoenix}" crossorigin="anonymous"></script>'
    )
boot_tag = (
    f'<script src="/boot-enter.js?v={BOOT_VER}" '
    f'integrity="{sri_boot}" crossorigin="anonymous"></script>'
)
i18n_tag = (
    f'<script src="/i18n.js?v={I18N_VER}" defer integrity="{sri_i18n}" crossorigin="anonymous"></script>'
)
tests_tag = (
    f'<script src="/test-results.js?v={TESTS_VER}" defer integrity="{sri_tests}" crossorigin="anonymous"></script>'
)

SCRIPT_RE = re.compile(
    r'\s*<script src="(?:\./|/)(?:boot-enter|scene-3d|webgl-runtime|three\.min|phoenix-3d|i18n|test-results)\.js[^>]*></script>'
)


def patch_html(html_path: Path, *, include_tests: bool, include_phoenix: bool, include_boot: bool) -> str:
    raw = html_path.read_text(encoding="utf-8")
    if not include_boot and "lg-motion-enter" in raw:
        include_boot = True
    if include_phoenix and "phoenix-3d" not in raw and "lg-webgl-stage" not in raw:
        include_phoenix = False

    html = raw

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

    html = SCRIPT_RE.sub("", html)

    js_hashes: list[str] = []
    scripts: list[str] = []
    if include_boot:
        scripts.append(boot_tag)
        js_hashes.append(sri_boot)
    if include_phoenix and phoenix_tag:
        scripts.append(phoenix_tag)
        js_hashes.append(sri_phoenix)
    scripts.append(i18n_tag)
    js_hashes.append(sri_i18n)
    if include_tests:
        scripts.append(tests_tag)
        js_hashes.append(sri_tests)

    csp_hashes = list(js_hashes)

    script_block = "\n  ".join(scripts)
    html = html.replace("</body>", f"  {script_block}\n</body>", 1)

    site_src = site_dir / "site.css"
    if not site_src.is_file():
        raise SystemExit("[website_refresh_sri] site.css yok")
    slug = sri_css.replace("sha384-", "").replace("+", "x").replace("/", "x")[:12]
    ver_name = f"site-{slug}.css"
    ver_path = site_dir / ver_name
    ver_path.write_bytes(site_src.read_bytes())

    html, n_css = re.subn(
        r'(?:<link rel="stylesheet" href="/boot\.css" id="lg-boot-css" />\s*)?'
        r'(?:<link rel="preload" href="/site[^"]+\.css"[^>]*/>\s*)?'
        r'(?:<link rel="preload" href="/fonts/[^"]+"[^>]*/>\s*)?'
        r'(?:<link rel="stylesheet" href="/boot\.css" id="lg-boot-css" />\s*)?'
        r'(?:<link rel="preload" href="/site[^"]+\.css"[^>]*/>\s*)?'
        r'<link rel="stylesheet" href="(?:\./|/)(site[^"]*\.css)"[^>]*/?>',
        f'<link rel="stylesheet" href="/boot.css" id="lg-boot-css" />\n'
        f'  <link rel="preload" href="/{ver_name}" as="style" integrity="{sri_css}" />\n'
        f'  <link rel="preload" href="/fonts/Syne-Variable.ttf" as="font" type="font/ttf" crossorigin="anonymous" />\n'
        f'  <link rel="stylesheet" href="/{ver_name}" id="lg-site-css" '
        f'integrity="{sri_css}" />',
        html,
        count=1,
    )
    if n_css != 1:
        raise SystemExit(f"[website_refresh_sri] {html_path.name} stylesheet link bulunamadi")

    if 'name="color-scheme"' not in html:
        html = html.replace(
            '<meta charset="utf-8" />',
            '<meta charset="utf-8" />\n  <meta name="color-scheme" content="dark" />',
            1,
        )

    page_csp = build_csp(csp_hashes, sri_css)
    meta_csp = page_csp.replace('"', "&quot;")
    if 'http-equiv="Content-Security-Policy"' not in html:
        html = html.replace(
            '<meta http-equiv="X-Frame-Options" content="DENY" />',
            '<meta http-equiv="X-Frame-Options" content="DENY" />\n'
            '  <meta http-equiv="Content-Security-Policy" content="default-src \'none\';" />',
            1,
        )
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

index_html = patch_html(
    site_dir / "index.html", include_tests=False, include_phoenix=False, include_boot=True
)
tests_html = patch_html(
    site_dir / "tests.html", include_tests=True, include_phoenix=False, include_boot=True
)


def css_asset_paths() -> set[str]:
    css = (site_dir / "site.css").read_text(encoding="utf-8")
    found: set[str] = set()
    for rel in re.findall(r'url\(["\']?([^"\')\s#]+)', css):
        if rel.startswith("data:") or rel.startswith("fonts/"):
            continue
        rel = rel.lstrip("./")
        if (site_dir / rel).is_file():
            found.add(rel)
    return found


def write_allowlist(*html_blobs: str) -> None:
    linked: set[str] = set()
    css_linked: set[str] = set()
    for html in html_blobs:
        linked |= set(re.findall(r'(?:href|src)="/?((?:evidence|screenshots)/[^"#?]+)"', html))
        css_linked |= set(re.findall(r'href="(?:\./|/)?(site-[^"]+\.css)"', html))
    paths = sorted(set(CORE_PATHS) | linked | css_linked | css_asset_paths())
    body = "# Statik site — otomatik uretildi (website_refresh_sri.sh)\n"
    body += "\n".join(paths) + "\n"
    allowlist_path.write_text(body, encoding="utf-8")


write_allowlist(index_html, tests_html)

prod_csp = build_csp([sri_boot, sri_i18n, sri_tests], sri_css, upgrade=True)
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
