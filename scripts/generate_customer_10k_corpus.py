#!/usr/bin/env python3
"""10K corpus — customer_anonymized log_guardian format (expanded replay, honeypot degil)."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "corpus" / "customer_anonymized.access"
SRC_MANIFEST = ROOT / "corpus" / "customer_anonymized_manifest.json"
OUT = ROOT / "corpus" / "customer_10k.access"
MANIFEST = ROOT / "corpus" / "customer_10k_manifest.json"
TARGET = int(os.environ.get("CUSTOMER_10K_LINES", "10000"))

IP_RE = re.compile(r"^(\d{1,3}(?:\.\d{1,3}){3})")


def ip_for(i: int) -> str:
    third = (i // 256) % 200 + 10
    fourth = i % 256
    if i % 3 == 0:
        return f"198.51.100.{fourth}"
    if i % 3 == 1:
        return f"203.0.113.{fourth}"
    return f"203.0.113.{third}"


def rotate_ip(line: str, i: int) -> str:
    new_ip = ip_for(i)
    return IP_RE.sub(new_ip, line, count=1)


def index_category(manifest: dict) -> dict[int, str]:
    out: dict[int, str] = {}
    for cat, info in (manifest.get("categories") or {}).items():
        for idx in info.get("line_indices") or []:
            out[int(idx)] = cat
    return out


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"kaynak yok: {SRC} — once: python3 scripts/generate_customer_corpus.py")
    src_lines = [ln for ln in SRC.read_text(encoding="utf-8").splitlines() if ln.strip()]
    if not src_lines:
        raise SystemExit(f"bos corpus: {SRC}")

    src_manifest = json.loads(SRC_MANIFEST.read_text(encoding="utf-8")) if SRC_MANIFEST.is_file() else {}
    idx_cat = index_category(src_manifest)

    entries: list[dict[str, str | int]] = []
    categories: dict[str, list[int]] = {}

    for i in range(TARGET):
        src_idx = i % len(src_lines)
        line = rotate_ip(src_lines[src_idx], i)
        cat = idx_cat.get(src_idx, "unknown")
        entries.append({"category": cat, "line": line, "source_index": src_idx})
        categories.setdefault(cat, []).append(i)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(e["line"] for e in entries) + "\n", encoding="utf-8")

    manifest = {
        "generated": src_manifest.get("generated", ""),
        "format": "log_guardian",
        "source": "customer_anonymized expanded — TR/WP hosting log_guardian (RFC5737 IPs)",
        "provenance": {
            "seed_corpus": str(SRC.relative_to(ROOT)),
            "seed_lines": len(src_lines),
            "expansion": "deterministic tile + IP rotation (honeypot/EvilBot degil)",
        },
        "corpus": str(OUT.relative_to(ROOT)),
        "lines_total": len(entries),
        "categories": {
            cat: {"count": len(idxs), "line_indices": idxs[:50], "line_indices_truncated": len(idxs) > 50}
            for cat, idxs in sorted(categories.items())
        },
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"[generate_customer_10k] {OUT} ({len(entries)} lines, seed={len(src_lines)})")
    print(f"[generate_customer_10k] {MANIFEST}")


if __name__ == "__main__":
    main()
