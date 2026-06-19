#!/usr/bin/env python3
"""en.json tabanli tam locale dosyalari uret (komut bloklari korunur)."""
from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALES = ROOT / "assets/website/locales"
ALL_LOCALES = Path(__file__).resolve().parent / "i18n_all_locales.json"

COMMAND_KEYS = frozenset({
    "install.block1", "install.block_api", "install.block_nginx",
    "install.block_verify", "install.block2",
    "dashboard.start", "download.block", "laptop.block",
})

TARGET_LANGS = ("de", "fr", "es", "pt", "ru", "ar", "zh")


def main() -> int:
    if not ALL_LOCALES.is_file():
        print(f"[website_i18n_gen_locales] FAIL: {ALL_LOCALES} yok", file=sys.stderr)
        return 1
    en = json.loads((LOCALES / "en.json").read_text(encoding="utf-8"))
    all_locales = json.loads(ALL_LOCALES.read_text(encoding="utf-8"))
    for lang in TARGET_LANGS:
        if lang not in all_locales:
            print(f"[website_i18n_gen_locales] FAIL: {lang} tanimi yok", file=sys.stderr)
            return 1
        data = deepcopy(en)
        data.update(all_locales[lang])
        for key in COMMAND_KEYS:
            data[key] = en[key]
        missing = set(en) - set(data)
        if missing:
            print(f"[website_i18n_gen_locales] FAIL: {lang} eksik {missing}", file=sys.stderr)
            return 1
        out = LOCALES / f"{lang}.json"
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[OK] {out.name} ({len(data)} anahtar)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
