#!/usr/bin/env python3
"""Deploy paketinde i18n + a11y tarayici smoke (Playwright)."""
from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = Path(os.environ.get("LG_WEBSITE_SMOKE_DIR", ROOT / "assets/website-deploy"))
HOST = os.environ.get("LG_WEBSITE_HOST", "127.0.0.1")
CONTACT_EMAIL = "kurtulusutkucenikcontact@gmail.com"


def free_port() -> int:
    sock = socket.socket()
    sock.bind((HOST, 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def wait_server(port: int, timeout: float = 8.0) -> None:
    import urllib.request

    url = f"http://{HOST}:{port}/"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    return
        except OSError:
            time.sleep(0.1)
    raise RuntimeError(f"sunucu hazir degil (port {port})")


def main() -> int:
    if not (SITE / "index.html").is_file():
        print(f"[website_i18n_browser_smoke] FAIL: {SITE} yok — once website_deploy_gate", file=sys.stderr)
        return 1

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("[website_i18n_browser_smoke] FAIL: pip install playwright && playwright install chromium", file=sys.stderr)
        return 1

    port = free_port()
    server = subprocess.Popen(
        [
            sys.executable,
            str(ROOT / "scripts/website_secure_server.py"),
            str(SITE),
            "--host",
            HOST,
            "--port",
            str(port),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        text=True,
    )
    fail = 0
    print("=== website_i18n_browser_smoke ===")
    try:
        site_label = str(SITE.relative_to(ROOT))
    except ValueError:
        site_label = str(SITE)
    print(f"  Site: {site_label}")
    print(f"  Port: {port}")

    try:
        wait_server(port)
        base = f"http://{HOST}:{port}"

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(base, wait_until="networkidle")

            if page.locator("a.skip-link").count() != 1:
                print("  [FAIL] skip-link eksik")
                fail += 1
            else:
                print("  [OK] skip-link")

            if page.locator(".app-nav").count() >= 1:
                print("  [OK] app-nav")
            else:
                print("  [FAIL] app-nav eksik")
                fail += 1

            page.locator('[data-lang="en"]').click()
            page.wait_for_timeout(150)
            body_en = page.inner_text("main")
            if "Installation" in body_en or "install" in body_en.lower():
                print("  [OK] EN install.title")
            else:
                print("  [FAIL] EN install.title cevrilmedi")
                fail += 1

            def check_theme_toggle(page_ctx, label: str) -> None:
                nonlocal fail
                if page_ctx.locator(".theme-btn").count() == 0:
                    print(f"  [OK] {label} (dark-only — theme-btn yok)")
                    return
                before_theme = page_ctx.locator("html").get_attribute("data-theme") or "dark"
                page_ctx.locator(".theme-btn").first.click()
                page_ctx.wait_for_timeout(100)
                after_theme = page_ctx.locator("html").get_attribute("data-theme")
                expected_theme = "light" if before_theme == "dark" else "dark"
                if after_theme == expected_theme:
                    print(f"  [OK] {label}")
                else:
                    print(f"  [FAIL] {label} {before_theme!r} -> {after_theme!r} (beklenen {expected_theme!r})")
                    fail += 1

            check_theme_toggle(page, "theme toggle")

            page.locator('[data-lang="tr"]').click()
            page.wait_for_timeout(150)
            body_tr = page.inner_text("footer")
            if "Türk" in body_tr or "yapımı" in body_tr:
                print("  [OK] TR footer")
            else:
                print("  [FAIL] TR footer cevrilmedi")
                fail += 1

            contact_text = page.inner_text("#iletisim")
            if CONTACT_EMAIL in contact_text or "(at) gmail.com" in contact_text:
                print("  [OK] contact email (index)")
            else:
                print(f"  [FAIL] contact email gorunmuyor (beklenen {CONTACT_EMAIL})")
                fail += 1

            page.goto(f"{base}/tests.html", wait_until="networkidle")
            page.wait_for_timeout(400)
            if page.locator(".app-nav a.active").inner_text().strip().lower().startswith("test"):
                print("  [OK] tests nav active")
            elif "Test" in page.locator(".app-nav a.active").inner_text():
                print("  [OK] tests nav active")
            else:
                active = page.locator(".app-nav a.active").inner_text()
                print(f"  [FAIL] tests nav active degil ({active!r})")
                fail += 1

            page.locator('[data-lang="en"]').click()
            page.wait_for_timeout(150)
            if page.locator("html").get_attribute("lang") == "en":
                print("  [OK] tests EN lang")
            else:
                print("  [FAIL] tests EN lang")
                fail += 1

            check_theme_toggle(page, "tests theme toggle")

            install_href = page.locator('a[data-i18n="nav.install"]').get_attribute("href")
            page.locator('a[data-i18n="nav.install"]').click()
            page.wait_for_timeout(200)
            if page.url.endswith("/#kurulum") or page.url.endswith("#kurulum"):
                print("  [OK] tests nav kurulum -> /#kurulum")
            else:
                print(f"  [FAIL] tests nav kurulum ({install_href!r} -> {page.url})")
                fail += 1

            page.goto(f"{base}/tests.html", wait_until="networkidle")
            page.wait_for_timeout(300)
            pdf_href = page.locator(".tests-toolbar-pdf").get_attribute("href")
            if pdf_href == "/evidence/competitive-proof.pdf":
                print("  [OK] tests toolbar PDF href")
            else:
                print(f"  [FAIL] tests toolbar PDF href ({pdf_href!r})")
                fail += 1

            cards = page.locator("#test-results-list .test-card").count()
            static = page.locator("#test-results-list .test-card-static").count()
            if cards >= 15:
                print(f"  [OK] test-results ({cards} kart, static={static})")
            else:
                print(f"  [FAIL] test-results yetersiz ({cards} kart, beklenen >=15)")
                fail += 1
            hero = page.locator("#test-results-hero:not([hidden])").count()
            if hero >= 1:
                print("  [OK] test-results-hero")
            else:
                print("  [FAIL] test-results-hero gorunmuyor")
                fail += 1

            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(300)
            honest = page.locator("#sinirlar .callout").inner_text().strip()
            if len(honest) > 40:
                print(f"  [OK] scope.honest.body ({len(honest)} char)")
            else:
                print("  [FAIL] scope.honest.body bos")
                fail += 1

            browser.close()
    except Exception as exc:
        print(f"  [FAIL] {exc}", file=sys.stderr)
        fail += 1
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()

    if fail == 0:
        print("[OK] website_i18n_browser_smoke")
        return 0
    print(f"[FAIL] website_i18n_browser_smoke ({fail} hata)", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
