#!/usr/bin/env python3
"""competitive-proof.json validationTests -> test-results.js (idempotent)."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "competitive-proof.json"
OUT = ROOT / "assets/website/test-results.js"
TESTS_RE = re.compile(r"var tests = \[.*?\];", re.DOTALL)


def main() -> int:
    if not PROOF.is_file():
        print(f"[website_embed_tests] FAIL: {PROOF} yok", file=sys.stderr)
        return 1
    if not OUT.is_file():
        print(f"[website_embed_tests] FAIL: {OUT} yok", file=sys.stderr)
        return 1

    data = json.loads(PROOF.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    blob = json.dumps(tests, ensure_ascii=False, separators=(",", ":"))
    replacement = f"var tests = {blob};"

    raw = OUT.read_text(encoding="utf-8")
    if not TESTS_RE.search(raw):
        print("[website_embed_tests] FAIL: var tests = [...] bulunamadi", file=sys.stderr)
        return 1
    OUT.write_text(TESTS_RE.sub(replacement, raw, count=1), encoding="utf-8")
    print(f"[OK] website_embed_tests -> {len(tests)} test")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
