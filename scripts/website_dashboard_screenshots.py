#!/usr/bin/env python3
"""Dashboard PNG — Playwright ile https://localhost:8443 (veya :3000).

Dashboard ayakta degilse exit 2 (placeholder'a birak).
  bash scripts/website_dashboard_screenshots.sh
  LG_DASHBOARD_SCREENSHOT_FORCE=1 bash scripts/website_dashboard_screenshots.sh
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/website/screenshots"
VIEW_W, VIEW_H = 1280, 720
OUT_W, OUT_H = 960, 540

DEFAULT_PASSWORDS = ("DegistirBeni!123", "ChangeMeOnFirstLogin!")


def load_env_password() -> str | None:
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DASHBOARD_ADMIN_PASSWORD="):
            val = line.split("=", 1)[1].strip().strip("'\"")
            return val or None
    return None


def resolve_password() -> str:
    """Tek parola — rate limit icin tum listeyi deneme."""
    env_pw = load_env_password()
    if env_pw:
        return env_pw
    override = os.environ.get("DASHBOARD_ADMIN_PASSWORD", "").strip()
    if override:
        return override
    return DEFAULT_PASSWORDS[0]


def login_dashboard(page, dash_url: str, password: str) -> tuple[bool, str | None]:
    """API login; 401 ise form. 429 ise hata mesaji don."""
    try:
        resp = page.request.post(
            f"{dash_url}/api/auth/login",
            data={"username": "admin", "password": password},
            headers={"Content-Type": "application/json"},
        )
        if resp.status == 429:
            try:
                body = resp.json()
                sec = body.get("retryAfterSec", 900)
            except Exception:
                sec = 900
            return False, f"login rate limit ({sec}s) — docker restart log-guardian-dashboard"
        if resp.ok:
            return True, None
    except Exception as exc:
        return False, str(exc)

    try:
        page.goto(f"{dash_url}/login", wait_until="domcontentloaded", timeout=25000)
        page.wait_for_selector('input[name="username"]', timeout=15000)
        page.fill('input[name="username"]', "admin")
        page.fill('input[name="password"]', password)
        page.click('button[type="submit"]')
        page.wait_for_function(
            "() => !window.location.pathname.endsWith('/login')",
            timeout=12000,
        )
        return True, None
    except Exception as exc:
        return False, f"form login: {exc}"


def curl_ok(url: str, *, resolve: str | None = None, insecure: bool = False) -> bool:
    cmd = ["curl", "-sf", "-o", "/dev/null", "--max-time", "3"]
    if insecure:
        cmd.append("-k")
    if resolve:
        cmd.extend(["--resolve", resolve])
    cmd.append(url)
    try:
        return subprocess.run(cmd, capture_output=True).returncode == 0
    except OSError:
        return False


def resolve_dash_url() -> tuple[str, bool, str | None]:
    explicit = os.environ.get("DASH_URL", "").strip()
    if explicit:
        return explicit.rstrip("/"), explicit.startswith("https://"), None

    if curl_ok(
        "https://localhost:8443/api/tier",
        resolve="localhost:8443:127.0.0.1",
        insecure=True,
    ):
        return "https://localhost:8443", True, "localhost:8443:127.0.0.1"

    if curl_ok("http://127.0.0.1:3000/api/tier"):
        return "http://127.0.0.1:3000", False, None

    return "", False, None


def resize_png(path: Path) -> None:
    try:
        from PIL import Image
    except ImportError:
        return
    with Image.open(path) as img:
        if img.size == (OUT_W, OUT_H):
            return
        img = img.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
        img.save(path, "PNG", optimize=True)


def capture_playwright(force: bool) -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "[website_dashboard_screenshots] playwright yok — "
            "bash scripts/website_dashboard_screenshots.sh",
            file=sys.stderr,
        )
        return 2

    dash_url, insecure, resolve_host = resolve_dash_url()
    if not dash_url:
        print("[website_dashboard_screenshots] dashboard yok (exit 2 — placeholder)")
        return 2

    targets = {
        "dashboard-fleet.png": OUT / "dashboard-fleet.png",
        "dashboard-tests.png": OUT / "dashboard-tests.png",
    }
    if not force and all(p.is_file() for p in targets.values()):
        print("[OK] website_dashboard_screenshots — mevcut ( --force ile yenile )")
        return 0

    OUT.mkdir(parents=True, exist_ok=True)
    made = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": VIEW_W, "height": VIEW_H},
            ignore_https_errors=insecure,
            device_scale_factor=1,
        )
        page = context.new_page()

        admin_pass = resolve_password()
        logged_in, login_err = login_dashboard(page, dash_url, admin_pass)
        if not logged_in:
            browser.close()
            hint = login_err or "parola hatali"
            print(
                f"[website_dashboard_screenshots] FAIL: {hint}\n"
                f"  ipucu: .env DASHBOARD_ADMIN_PASSWORD veya "
                f"DASHBOARD_ADMIN_PASSWORD='...' bash scripts/website_dashboard_screenshots.sh --force",
                file=sys.stderr,
            )
            return 1

        # Fleet / SOC — ana sayfa üst + KPI
        fleet_out = targets["dashboard-fleet.png"]
        if force or not fleet_out.is_file():
            page.goto(f"{dash_url}/", wait_until="networkidle", timeout=45000)
            page.wait_for_selector("#kpi-eps", timeout=25000)
            page.wait_for_timeout(1800)
            page.screenshot(path=str(fleet_out), full_page=False)
            resize_png(fleet_out)
            print(f"[OK] {fleet_out.relative_to(ROOT)} (playwright)")
            made += 1

        # Tests matrisi
        tests_out = targets["dashboard-tests.png"]
        if force or not tests_out.is_file():
            page.goto(f"{dash_url}/tests", wait_until="networkidle", timeout=45000)
            page.wait_for_selector("#validation-tests", timeout=25000)
            page.wait_for_selector("#validation-tests .glass-panel", timeout=20000)
            page.wait_for_timeout(1200)
            page.screenshot(path=str(tests_out), full_page=False)
            resize_png(tests_out)
            print(f"[OK] {tests_out.relative_to(ROOT)} (playwright)")
            made += 1

        browser.close()

    if made == 0 and all(p.is_file() for p in targets.values()):
        print("[OK] website_dashboard_screenshots — guncelleme yok")
        return 0
    print(f"[OK] website_dashboard_screenshots — {made} dosya ({dash_url})")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="mevcut PNG ustune yaz")
    args = ap.parse_args()
    force = args.force or os.environ.get("LG_DASHBOARD_SCREENSHOT_FORCE") == "1"
    return capture_playwright(force)


if __name__ == "__main__":
    raise SystemExit(main())
