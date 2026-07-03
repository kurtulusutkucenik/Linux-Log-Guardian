#!/usr/bin/env python3
"""Canli site icerik/nav parity (Next.js landing) — tarayici ile render dogrulama.

Kritik (fatal): /tests acilir · >= expected-2 test karti · PDF linki · iletisim e-posta.
Yumusak (WARN): dogru-sinir bloku · EN dil toggle (dropdown, CF/i18n gecikmesine dayanikli).
Not: eski statik site (site.css + lg-integrity meta + #test-results-list) emekli;
     bu kapi Next.js DOM'una gore yazildi (ul.grid > li kartlar, #dogrusinir, LangSwitcher).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    domain = os.environ.get("WEBSITE_LIVE_DOMAIN", "ceniklinuxlogguardian.org")
    base = f"https://{domain}"

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "[website_live_js_check] SKIP: playwright yok — "
            "pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        return 0

    # Beklenen test karti sayisi — competitive-proof.json tek kaynak.
    expected = 0
    proof_path = ROOT / "competitive-proof.json"
    if proof_path.is_file():
        import json

        expected = len(json.loads(proof_path.read_text(encoding="utf-8")).get("validationTests") or [])
    if expected <= 0:
        expected = int(os.environ.get("WEBSITE_EXPECT_TESTS", "75"))
    min_cards = max(15, expected - 2)

    fail = 0
    warn = 0
    cards = 0
    print("=== website_live_js_check ===")
    print(f"  Domain: {domain}")

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1) /tests sayfasi
        loaded = False
        for tests_path in ("/tests", "/tests.html", "/testler"):
            try:
                page.goto(f"{base}{tests_path}", wait_until="networkidle", timeout=45000)
                loaded = True
                print(f"  [OK] yuklendi: {tests_path}")
                break
            except Exception as exc:
                if "ERR_TOO_MANY_REDIRECTS" in str(exc):
                    print(f"  [WARN] {tests_path} redirect dongusu — _redirects kontrol")
                else:
                    print(f"  [WARN] {tests_path}: {exc}")

        if not loaded:
            print("  [FAIL] tests sayfasi acilamadi")
            browser.close()
            return 1

        page.wait_for_timeout(600)

        # 2) test kartlari — Next.js: ul.grid > li (gate + proof gruplari)
        cards = page.locator("main ul.grid > li").count()
        if cards == 0:
            # fallback: her kartta bir <h3> baslik var
            cards = page.locator("main ul > li h3").count()
        if cards >= min_cards:
            detail = f"{cards}/{expected}" if cards >= expected else f"{cards} (beklenen {expected})"
            print(f"  [OK] test kartlari ({detail})")
            if cards < expected:
                print(f"  [WARN] test kartlari eksik ({cards} < {expected}) — CF yayiliyor")
        else:
            print(f"  [FAIL] test kartlari yok ({cards}, beklenen {expected})")
            fail += 1

        # 3) kanit PDF linki
        pdf = page.locator('a[href="/evidence/competitive-proof.pdf"]').count()
        if pdf > 0:
            print("  [OK] tests PDF linki")
        else:
            print("  [FAIL] tests PDF linki (/evidence/competitive-proof.pdf) yok")
            fail += 1

        # 4) EN dil toggle — LangSwitcher dropdown (kirilgan → WARN)
        try:
            page.locator("header button[aria-haspopup='listbox']").first.click(timeout=3000)
            page.wait_for_timeout(300)
            en = page.locator("[role='option']", has_text="English").first
            if en.count() > 0:
                en.click(timeout=3000)
                page.wait_for_timeout(500)
                if page.locator("html").get_attribute("lang") == "en":
                    print("  [OK] EN dil toggle")
                else:
                    print("  [WARN] EN dil toggle (lang gec guncellendi)")
                    warn += 1
            else:
                print("  [WARN] EN dil secenegi bulunamadi (dropdown)")
                warn += 1
        except Exception as exc:
            print(f"  [WARN] EN dil toggle atlandi: {exc}")
            warn += 1

        # 5) ana sayfa: iletisim e-posta + dogru-sinir bloku
        page.goto(f"{base}/", wait_until="networkidle")
        page.wait_for_timeout(400)

        try:
            contact = page.inner_text("#iletisim")
            norm = contact.replace(" ", "").lower()
            if "gmail.com" in norm and "cenik" in norm:
                print("  [OK] iletisim e-posta")
            else:
                print("  [FAIL] iletisim e-posta gorunmuyor")
                fail += 1
        except Exception:
            print("  [FAIL] #iletisim bolumu yok")
            fail += 1

        try:
            honest = page.inner_text("#dogrusinir").strip()
            if len(honest) > 40:
                print(f"  [OK] dogru-sinir bloku ({len(honest)} char)")
            else:
                print("  [WARN] dogru-sinir bloku kisa/bos")
                warn += 1
        except Exception:
            print("  [WARN] #dogrusinir bolumu yok")
            warn += 1

        browser.close()

    if fail:
        print("[FAIL] website_live_js_check — icerik/nav parity hatasi (redeploy)", file=sys.stderr)
        return 1
    tag = f" ({warn} WARN)" if warn else ""
    print(f"[OK] website_live_js_check — icerik OK{tag} ({domain})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
