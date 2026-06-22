#!/usr/bin/env python3
"""Canli sitede tarayici SRI — Cloudflare Auto Minify JS bozar (curl yeterli degil)."""
from __future__ import annotations

import base64
import hashlib
import os
import re
import sys


def sri_hash(body: bytes) -> str:
    return base64.b64encode(hashlib.sha384(body).digest()).decode()


def main() -> int:
    domain = os.environ.get("WEBSITE_LIVE_DOMAIN", "ceniklinuxlogguardian.org")
    base = f"https://{domain}"

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "[website_live_js_check] FAIL: playwright yok — bash scripts/website_i18n_browser_smoke.sh",
            file=sys.stderr,
        )
        return 1

    fail = 0
    sri_fail = 0
    print("=== website_live_js_check ===")

    print(f"  Domain: {domain}")

    script_bodies: dict[str, tuple[int, str]] = {}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        def on_response(resp) -> None:
            url = resp.url
            if not url.startswith(base):
                return
            for name in ("/i18n.js", "/test-results.js"):
                if url.endswith(name) or f"{name}?" in url:
                    try:
                        body = resp.body()
                        script_bodies[name] = (len(body), sri_hash(body))
                    except Exception:
                        pass

        page.on("response", on_response)

        tests_paths = ["/tests", "/tests.html"]
        loaded = False
        for tests_path in tests_paths:
            try:
                page.goto(f"{base}{tests_path}", wait_until="networkidle", timeout=45000)
                loaded = True
                print(f"  [OK] yuklendi: {tests_path}")
                break
            except Exception as exc:
                if "ERR_TOO_MANY_REDIRECTS" in str(exc):
                    print(
                        f"  [WARN] {tests_path} redirect dongusu "
                        "— _redirects icinde /tests rewrite kaldir + redeploy"
                    )
                else:
                    print(f"  [WARN] {tests_path}: {exc}")

        if not loaded:
            print("  [FAIL] tests sayfasi acilamadi")
            browser.close()
            return 1

        page.wait_for_timeout(800)

        html = page.content()
        i18n_meta = re.search(r'name="lg-integrity-i18n" content="sha384-([^"]+)"', html)
        tr_meta = re.search(r'test-results\.js(?:\?[^"]*)?"[^>]*integrity="sha384-([^"]+)"', html)
        if not i18n_meta or not tr_meta:
            print("  [FAIL] HTML integrity meta/script eksik")
            browser.close()
            return 1

        for path, expected in [
            ("/i18n.js", i18n_meta.group(1)),
            ("/test-results.js", tr_meta.group(1)),
        ]:
            if path not in script_bodies:
                print(f"  [WARN] {path} tarayici yaniti yok")
                sri_fail += 1
                continue
            size, live = script_bodies[path]
            if live == expected:
                print(f"  [OK] {path} SRI (browser, {size} B)")
            else:
                print(f"  [WARN] {path} SRI drift — CF JS minify/cache")
                print(f"         live sha384-{live}")
                print(f"         html sha384-{expected}")
                sri_fail += 1

        cards = page.locator("#test-results-list .test-card").count()
        static = page.locator("#test-results-list .test-card-static").count()
        if cards >= 15:
            tag = "statik HTML" if static >= 15 else "JS"
            print(f"  [OK] test kartlari ({cards}, {tag})")
        else:
            print(f"  [FAIL] test kartlari yok ({cards})")
            fail += 1

        install_href = page.locator('a[data-i18n="nav.install"]').get_attribute("href")
        pdf_href = page.locator(".tests-toolbar-pdf").get_attribute("href")
        if install_href == "/#kurulum":
            print("  [OK] tests nav kurulum href")
        else:
            print(f"  [FAIL] tests nav kurulum href ({install_href!r})")
            fail += 1
        if pdf_href == "/evidence/competitive-proof.pdf":
            print("  [OK] tests toolbar PDF href")
        else:
            print(f"  [FAIL] tests toolbar PDF href ({pdf_href!r})")
            fail += 1
        page.locator('[data-lang="en"]').click()
        page.wait_for_timeout(200)
        if page.locator("html").get_attribute("lang") == "en":
            print("  [OK] tests EN toggle")
        elif sri_fail:
            print("  [WARN] tests EN toggle (SRI drift — i18n.js bloklu, CF Purge Everything)")
        else:
            print("  [FAIL] tests EN toggle")
            fail += 1

        page.goto(f"{base}/", wait_until="networkidle")
        page.wait_for_timeout(400)
        honest = page.locator("#sinirlar .callout").inner_text().strip()
        if len(honest) > 40:
            print(f"  [OK] scope.honest.body ({len(honest)} char)")
        else:
            print("  [FAIL] scope.honest.body bos")
            fail += 1

        contact = page.inner_text("#iletisim")
        norm = contact.replace(" ", "").lower()
        if "kurtulusutkucenikcontact@gmail.com" in norm or "(at)gmail.com" in norm:
            print("  [OK] contact email")
        else:
            print("  [FAIL] contact email gorunmuyor")
            fail += 1

        browser.close()

    if fail:
        print(
            "[FAIL] website_live_js_check — icerik/nav hatasi (redeploy)",
            file=sys.stderr,
        )
        return 1
    if sri_fail:
        print(
            f"[FAIL] website_live_js_check — SRI drift ({domain}); "
            "CF Dashboard → Caching → Purge Everything (eski i18n.js cache)",
            file=sys.stderr,
        )
        return 1
    print(f"[OK] website_live_js_check — tarayici SRI uyumlu ({domain})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
