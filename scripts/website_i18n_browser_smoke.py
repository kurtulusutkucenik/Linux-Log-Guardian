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

            page.locator('[data-lang="de"]').click()
            page.wait_for_timeout(150)
            body_de = page.inner_text("main")
            if "Installationsanleitung" in body_de:
                print("  [OK] DE install.title")
            else:
                print("  [FAIL] DE install.title cevrilmedi")
                fail += 1

            page.locator('[data-lang="ru"]').click()
            page.wait_for_timeout(150)
            body_ru = page.inner_text("main")
            if "Руководство по установке" in body_ru:
                print("  [OK] RU install.title")
            else:
                print("  [FAIL] RU install.title cevrilmedi")
                fail += 1

            page.locator('[data-lang="ar"]').click()
            page.wait_for_timeout(150)
            dir_attr = page.locator("html").get_attribute("dir")
            if dir_attr == "rtl":
                print("  [OK] AR dir=rtl")
            else:
                print(f"  [FAIL] AR dir beklenen rtl, gelen {dir_attr!r}")
                fail += 1

            page.locator('[data-lang="zh"]').click()
            page.wait_for_timeout(150)
            body_zh = page.inner_text("main")
            if "安装指南" in body_zh:
                print("  [OK] ZH install.title")
            else:
                print("  [FAIL] ZH install.title cevrilmedi")
                fail += 1

            page.locator('[data-lang="tr"]').click()
            page.wait_for_timeout(150)
            body_tr = page.inner_text("footer")
            if "Türk" in body_tr or "yapımı" in body_tr:
                print("  [OK] TR footer")
            else:
                print("  [FAIL] TR footer cevrilmedi")
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
