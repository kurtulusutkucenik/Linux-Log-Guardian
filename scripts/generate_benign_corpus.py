#!/usr/bin/env python3
"""Nginx combined log — 200+ benign satir (WordPress, API, statik asset)."""
from __future__ import annotations

import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "corpus" / "benign_corpus.access"
BENCH_OUT = ROOT / "corpus" / "bench_corpus.access"

TS = "02/Jun/2026:10:00:01 +0300"
IP = "203.0.113.42"
UA_BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
UA_WP = "WordPress/6.5; https://shop.example.com"
UA_API = "MyApp/2.1 (+https://api.example.com)"


def line(method: str, path: str, status: int = 200, bytes_: int = 512, ua: str = UA_BROWSER) -> str:
    return (
        f'{IP} - - [{TS}] "{method} {path} HTTP/1.1" {status} {bytes_} "-" "{ua}"'
    )


def main() -> None:
    entries: list[str] = []

    # --- WordPress ---
    wp_paths = [
        "/",
        "/wp-login.php",
        "/wp-admin/",
        "/wp-admin/admin-ajax.php?action=heartbeat",
        "/wp-json/wp/v2/posts?per_page=10",
        "/wp-json/wp/v2/users/me",
        "/wp-content/themes/twentytwentyfour/style.css",
        "/wp-content/plugins/akismet/readme.txt",
        "/wp-content/uploads/2026/06/logo.png",
        "/wp-includes/js/jquery/jquery.min.js",
        "/xmlrpc.php",
        "/?p=123",
        "/category/news/",
        "/tag/security/",
        "/feed/",
        "/comments/feed/",
        "/wp-sitemap.xml",
        "/robots.txt",
    ]
    for p in wp_paths:
        entries.append(line("GET", p, ua=UA_WP if "wp" in p else UA_BROWSER))

    # --- REST / GraphQL API (benign) ---
    api_paths = [
        "/api/health",
        "/api/v1/status",
        "/api/v1/users/me",
        "/api/v2/products?page=1&limit=20",
        "/api/v2/orders/550e8400-e29b-41d4-a716-446655440000",
        "/graphql",
        "/v1/chat/completions",
        "/oauth/authorize?client_id=app&response_type=code",
        "/.well-known/openid-configuration",
        "/metrics",
        "/readyz",
        "/livez",
    ]
    for p in api_paths:
        q = ""
        if "?" in p:
            path, q = p.split("?", 1)
            p = f"{path}?{urllib.parse.quote(q, safe='=&?')}"
        entries.append(line("GET", p, ua=UA_API))

    # --- Statik asset ---
    static = [
        "/favicon.ico",
        "/assets/app.js",
        "/assets/app.css",
        "/static/js/main.chunk.js",
        "/static/css/2.abc123.css",
        "/fonts/inter.woff2",
        "/images/hero.webp",
        "/cdn/bootstrap.min.css",
        "/manifest.json",
        "/service-worker.js",
        "/apple-touch-icon.png",
    ]
    for p in static:
        entries.append(line("GET", p, bytes_=4096))

    # --- Normal e-ticaret / arama ---
    shop = [
        "/search?q=wireless+headphones",
        "/search?q=%C3%B6rnek+urun",
        "/products/sku-ABC-12345",
        "/cart",
        "/checkout/shipping",
        "/account/login",
        "/account/orders",
        "/sitemap.xml",
        "/privacy-policy",
        "/contact",
    ]
    for p in shop:
        entries.append(line("GET", p))

    # --- POST benign (form, webhook echo) ---
    posts = [
        ('POST', '/api/v1/auth/login', 401),
        ('POST', '/contact', 302),
        ('POST', '/wp-admin/admin-ajax.php?action=save-widget', 200),
        ('POST', '/api/v1/events', 202),
        ('PUT', '/api/v1/users/me/preferences', 204),
        ('PATCH', '/api/v1/profile', 200),
        ('HEAD', '/', 200),
        ('OPTIONS', '/api/v1/users', 204),
    ]
    for method, path, st in posts:
        entries.append(line(method, path, status=st, bytes_=0 if method == "HEAD" else 128))

    # --- Mobile / SPA / CDN ---
    mobile = [
        "/api/mobile/v3/home",
        "/api/mobile/v3/notifications?since=1717400000",
        "/_next/static/chunks/webpack-abc123.js",
        "/_next/static/css/app-layout.css",
        "/assets/vendor.react.js.map",
        "/cdn-cgi/trace",
        "/cloudflare-static/email-decode.min.js",
    ]
    for p in mobile:
        entries.append(line("GET", p, ua=UA_API))

    # Pad to >= 500 with varied cache-bust / locale
    i = 0
    while len(entries) < 500:
        entries.append(
            line(
                "GET",
                f"/static/locale/en/page-{i}.html?v=20260604",
                bytes_=2048,
            )
        )
        i += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = "\n".join(entries) + "\n"
    OUT.write_text(text, encoding="utf-8")
    BENCH_OUT.write_text(text, encoding="utf-8")
    print(f"[generate_benign_corpus] {OUT} ({len(entries)} lines)")
    print(f"[generate_benign_corpus] {BENCH_OUT} ({len(entries)} lines)")


if __name__ == "__main__":
    main()
