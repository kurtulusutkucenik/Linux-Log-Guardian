#!/usr/bin/env python3
"""locales/*.json -> assets/website/i18n.js"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALES_DIR = ROOT / "assets/website/locales"
RUNTIME = ROOT / "assets/website/i18n.runtime.js"
OUT = ROOT / "assets/website/i18n.js"
MARKER = "/*__I18N__*/"

COMMAND_KEYS = frozenset({
    "install.block1", "install.block_api", "install.block_nginx",
    "install.block_verify", "install.block2",
    "dashboard.start", "download.block", "laptop.block",
})

REQUIRED_LANGS = ("tr", "en", "de", "fr", "es", "pt", "ru", "ar", "zh")


def main() -> int:
    if not RUNTIME.is_file():
        print(f"[website_bundle_i18n] FAIL: {RUNTIME} yok", file=sys.stderr)
        return 1
    if not LOCALES_DIR.is_dir():
        print(f"[website_bundle_i18n] FAIL: {LOCALES_DIR} yok", file=sys.stderr)
        return 1

    en = json.loads((LOCALES_DIR / "en.json").read_text(encoding="utf-8"))
    i18n: dict[str, dict[str, str]] = {}
    for lang in REQUIRED_LANGS:
        path = LOCALES_DIR / f"{lang}.json"
        if not path.is_file():
            print(f"[website_bundle_i18n] FAIL: eksik {path.name}", file=sys.stderr)
            return 1
        data = json.loads(path.read_text(encoding="utf-8"))
        missing = set(en) - set(data)
        extra = set(data) - set(en)
        if missing:
            print(f"[website_bundle_i18n] FAIL: {lang} eksik anahtar: {sorted(missing)[:5]}...", file=sys.stderr)
            return 1
        if extra:
            print(f"[website_bundle_i18n] FAIL: {lang} fazla anahtar: {sorted(extra)[:5]}...", file=sys.stderr)
            return 1
        for key in COMMAND_KEYS:
            data[key] = en[key]
        i18n[lang] = data

    runtime = RUNTIME.read_text(encoding="utf-8")
    if MARKER not in runtime:
        print(f"[website_bundle_i18n] FAIL: marker {MARKER} yok", file=sys.stderr)
        return 1

    body = json.dumps(i18n, ensure_ascii=False, indent=2)
    js = runtime.replace(MARKER, f"const I18N = {body};", 1)
    OUT.write_text(js, encoding="utf-8")
    print(f"[OK] website_bundle_i18n -> {OUT.name} ({len(REQUIRED_LANGS)} dil, {len(en)} anahtar)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
