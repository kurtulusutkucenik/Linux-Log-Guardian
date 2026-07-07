#!/usr/bin/env python3
"""Regenerate landing/lib/tests.ts from competitive-proof.json validationTests.

Usage (repo root):
  python3 scripts/sync_landing_tests_from_proof.py

From landing/ or landing/out/:
  bash landing/sync_tests.sh
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROOF = ROOT / "competitive-proof.json"
OUT = ROOT / "landing/lib/tests.ts"

HEADER = """\
// Live site test matrix — single source of truth for the /testler proof page.
// Kept in parity with competitive-proof.json (see scripts/website_preview_gate.sh).
// Regenerate: python3 scripts/sync_landing_tests_from_proof.py

export type TestStatus = "pass" | "warn" | "fail" | "pending";

export interface TestMetric {
  label: string;
  value: string;
}

export interface TestEntry {
  id: string;
  status: TestStatus;
  statusLabel?: string;
  statusLabelEn?: string;
  title: string;
  titleEn?: string;
  verdict?: string;
  verdictEn?: string;
  group: "gate" | "proof";
  purpose?: string;
  purposeEn?: string;
  metrics?: TestMetric[];
  script?: string;
  date?: string;
  badge?: string;
  badgeEn?: string;
}

export const TESTS: TestEntry[] = """


def patch_proof_test_count(n: int) -> None:
    content = ROOT / "landing/lib/content.ts"
    if not content.is_file():
        return
    text = content.read_text(encoding="utf-8")
    import re

    new_text, count = re.subn(
        r"export const PROOF_TEST_COUNT = \d+;",
        f"export const PROOF_TEST_COUNT = {n};",
        text,
        count=1,
    )
    if count:
        content.write_text(new_text, encoding="utf-8")
        print(f"[OK] PROOF_TEST_COUNT -> {n} (landing/lib/content.ts)")


def main() -> int:
    if not PROOF.is_file():
        print(f"[sync_landing_tests] FAIL: {PROOF} yok", file=sys.stderr)
        return 1
    data = json.loads(PROOF.read_text(encoding="utf-8"))
    tests = data.get("validationTests") or []
    if not tests:
        print("[sync_landing_tests] FAIL: validationTests bos", file=sys.stderr)
        return 1
    body = json.dumps(tests, indent=2, ensure_ascii=False)
    OUT.write_text(f"{HEADER}{body};\n", encoding="utf-8")
    n = len(tests)
    pass_n = sum(1 for t in tests if t.get("status") == "pass")
    patch_proof_test_count(n)
    print(f"[OK] sync_landing_tests_from_proof -> {OUT} ({pass_n}/{n} pass)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
