#!/usr/bin/env python3
"""
Ayni access log uzerinde OWASP CRS @rx pattern replay — ModSecurity/nginx olmadan
kural seti latency karsilastirmasi (bench-vs-modsec.json icin).
"""
from __future__ import annotations

import re
import sys
import time
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CRS = ROOT / "rules" / "crs-bundle.rules"
LOG_RE = re.compile(
    r'"([A-Z]+) ([^"]+) HTTP/[^"]+" \d+ \d+ "[^"]*" "([^"]*)"'
)


def load_patterns(crs_path: Path) -> list[re.Pattern]:
    out: list[re.Pattern] = []
    if not crs_path.is_file():
        return out
    for line in crs_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line.startswith("CRS_REGEX="):
            continue
        pat = line.split("=", 1)[1].strip()
        try:
            out.append(re.compile(pat, re.I))
        except re.error:
            continue
    return out


def extract_targets(log_path: Path) -> list[str]:
    targets: list[str] = []
    for raw in log_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        m = LOG_RE.search(raw)
        if not m:
            continue
        url = urllib.parse.unquote_plus(m.group(2))
        ua = m.group(3)
        targets.append(f"{url} {ua}".strip())
    return targets


def bench_replay(targets: list[str], patterns: list[re.Pattern]) -> tuple[float, int]:
    if not targets or not patterns:
        return 0.0, 0
    t0 = time.perf_counter()
    hits = 0
    for t in targets:
        for p in patterns:
            if p.search(t):
                hits += 1
                break
    elapsed = time.perf_counter() - t0
    return elapsed, hits


def main() -> int:
    log_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "corpus" / "bench_corpus.access"
    crs_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_CRS
    patterns = load_patterns(crs_path)
    targets = extract_targets(log_path)
    if not targets:
        print("{\"error\":\"no log targets\"}")
        return 1
    if not patterns:
        print("{\"error\":\"no crs patterns\"}")
        return 1
    elapsed, hits = bench_replay(targets, patterns)
    lines = len(targets)
    eps = int(lines / elapsed) if elapsed > 0 else 0
    latency_us = round((elapsed / lines) * 1_000_000, 2) if lines > 0 else 0.0
    import json

    print(
        json.dumps(
            {
                "mode": "crs_regex_replay",
                "log": str(log_path),
                "lines": lines,
                "patterns": len(patterns),
                "elapsed_sec": round(elapsed, 4),
                "eps": eps,
                "latency_us_per_line": latency_us,
                "rule_hits": hits,
                "note": "Python re over CRS_REGEX= lines; same corpus as Log Guardian bench.",
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
