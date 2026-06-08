#!/usr/bin/env python3
"""
Sigma YAML -> Log Guardian PCRE rules (pcre_engine / CRS_REGEX format).

Kullanim:
  python3 scripts/sigma_import.py /path/to/sigma/rules -o rules/sigma-imported.rules
  python3 scripts/sigma_import.py rules/sigma/sample.yml --max 50
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None


def sigma_keywords_to_pcre(keywords: list) -> str | None:
    parts: list[str] = []
    for kw in keywords:
        if isinstance(kw, str) and 2 <= len(kw) <= 80:
            esc = re.escape(kw)
            parts.append(esc)
    if not parts:
        return None
    if len(parts) == 1:
        return parts[0]
    return "(?i)(" + "|".join(parts[:12]) + ")"


def load_sigma(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if yaml:
        doc = yaml.safe_load(text)
        return doc if isinstance(doc, dict) else None
    # minimal fallback
    title = re.search(r"^title:\s*(.+)$", text, re.M)
    if not title:
        return None
    kws = re.findall(r"^\s*-\s+'?([^'\n]+)'?\s*$", text, re.M)
    return {"title": title.group(1).strip(), "detection": {"keywords": kws[:8]}}


def extract_patterns(doc: dict) -> list[str]:
    det = doc.get("detection") or {}
    patterns: list[str] = []
    if "keywords" in det:
        p = sigma_keywords_to_pcre(det["keywords"] if isinstance(det["keywords"], list) else [])
        if p:
            patterns.append(p)
    for key, val in det.items():
        if key in ("keywords", "condition", "timeframe"):
            continue
        if isinstance(val, dict):
            for field, spec in val.items():
                if isinstance(spec, str) and "|re" in field:
                    rx = spec.strip("'\"")
                    if 2 < len(rx) < 200:
                        patterns.append(rx)
                elif isinstance(spec, list):
                    p = sigma_keywords_to_pcre([str(x) for x in spec])
                    if p:
                        patterns.append(p)
    return patterns


def main() -> int:
    ap = argparse.ArgumentParser(description="Sigma -> Log Guardian PCRE rules")
    ap.add_argument("input", type=Path, help="Sigma YAML dosya veya dizin")
    ap.add_argument("-o", "--output", type=Path, default=Path("rules/sigma-imported.rules"))
    ap.add_argument("--max", type=int, default=128)
    args = ap.parse_args()

    paths: list[Path] = []
    if args.input.is_dir():
        paths = sorted(args.input.rglob("*.yml")) + sorted(args.input.rglob("*.yaml"))
    else:
        paths = [args.input]

    lines = [
        "# Sigma-imported PCRE patterns — scripts/sigma_import.py",
        "# rules.conf: CRS_RULES=rules/sigma-imported.rules (veya birlestir)",
        "",
    ]
    seen: set[str] = set()
    count = 0
    meta: list[dict] = []

    for p in paths:
        try:
            doc = load_sigma(p)
            if not doc:
                continue
            title = str(doc.get("title", p.stem))[:80]
            for pat in extract_patterns(doc):
                if pat in seen:
                    continue
                seen.add(pat)
                lines.append(f"# SIGMA: {title}")
                lines.append(f"CRS_REGEX={pat}")
                lines.append("")
                meta.append({"title": title, "pattern": pat, "file": str(p.name)})
                count += 1
                if count >= args.max:
                    break
        except OSError:
            continue
        if count >= args.max:
            break

    if count == 0:
        print("[ERR] Sigma pattern bulunamadi.", file=sys.stderr)
        return 1

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(lines), encoding="utf-8")
    meta_path = args.output.with_suffix(".json")
    meta_path.write_text(json.dumps({"rules": meta, "count": count}, indent=2), encoding="utf-8")
    print(f"[OK] {count} pattern -> {args.output}")
    print(f"[OK] metadata -> {meta_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
