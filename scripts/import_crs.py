#!/usr/bin/env python3
"""
OWASP ModSecurity CRS -> Log Guardian crs.rules donusturucu.

Kullanim:
  python3 scripts/import_crs.py /path/to/coreruleset/rules -o rules/crs-imported.rules
  python3 scripts/import_crs.py --max 200 /path/to/coreruleset/rules

coreruleset: https://github.com/coreruleset/coreruleset
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

RX_RE = re.compile(r'@rx\s+([^\s"\']+|"(?:\\.|[^"\\])*")', re.IGNORECASE)
T_RX_RE = re.compile(r't:rx\s*/([^/]+)/', re.IGNORECASE)


def normalize_rx(raw: str) -> str | None:
    s = raw.strip().strip('"').strip("'")
    if not s or len(s) > 400:
        return None
    # ModSecurity /.../ -> PCRE2
    if s.startswith('/') and s.endswith('/') and len(s) > 2:
        s = s[1:-1]
    return s


def extract_from_line(line: str) -> list[str]:
    out: list[str] = []
    for m in RX_RE.finditer(line):
        p = normalize_rx(m.group(1))
        if p:
            out.append(p)
    for m in T_RX_RE.finditer(line):
        p = normalize_rx(m.group(1))
        if p:
            out.append(p)
    return out


def scan_crs_dir(root: Path, max_rules: int) -> list[str]:
    seen: set[str] = set()
    patterns: list[str] = []

    for path in sorted(root.rglob('*.conf')):
        try:
            text = path.read_text(encoding='utf-8', errors='ignore')
        except OSError:
            continue
        for line in text.splitlines():
            if 'SecRule' not in line and '@rx' not in line and 't:rx' not in line:
                continue
            for p in extract_from_line(line):
                if p in seen:
                    continue
                seen.add(p)
                patterns.append(p)
                if len(patterns) >= max_rules:
                    return patterns
    return patterns


def main() -> int:
    ap = argparse.ArgumentParser(description='OWASP CRS -> Log Guardian CRS_REGEX')
    ap.add_argument('crs_dir', type=Path, help='coreruleset/rules dizini')
    ap.add_argument('-o', '--output', type=Path, default=Path('rules/crs-imported.rules'))
    ap.add_argument('--max', type=int, default=256, help='Maksimum regex (PCRE_MAX_PATTERNS ile uyumlu)')
    args = ap.parse_args()

    if not args.crs_dir.is_dir():
        print(f'[ERR] Dizin yok: {args.crs_dir}', file=sys.stderr)
        return 1

    patterns = scan_crs_dir(args.crs_dir, args.max)
    if not patterns:
        print('[ERR] @rx kurali bulunamadi.', file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open('w', encoding='utf-8') as f:
        f.write('# Uretildi: scripts/import_crs.py\n')
        for i, p in enumerate(patterns):
            f.write(f'CRS_REGEX={p}\n')
    print(f'[OK] {len(patterns)} CRS_REGEX -> {args.output}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
