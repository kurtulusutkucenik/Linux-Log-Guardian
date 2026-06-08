#!/usr/bin/env python3
"""Basit Sigma kural dosyasini PCRE satirlarina cevirir (Faz 1/2 MVP)."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "rules" / "sigma-generated.rules"


def sigma_to_pcre(condition: str) -> str:
    c = condition.strip()
    c = re.sub(r"\s+and\s+", "|", c, flags=re.I)
    c = re.sub(r"\s+or\s+", "|", c, flags=re.I)
    c = re.sub(r"contains\s+", "", c, flags=re.I)
    c = re.sub(r"['\"]", "", c)
    return c[:200] if c else ".*"


def parse_sigma_yaml(text: str) -> list[tuple[str, str]]:
    rules = []
    blocks = re.split(r"\n(?=title:)", text)
    for block in blocks:
        title_m = re.search(r"^title:\s*(.+)$", block, re.M)
        cond_m = re.search(r"^condition:\s*(.+)$", block, re.M)
        if not title_m:
            continue
        title = title_m.group(1).strip()
        cond = cond_m.group(1).strip() if cond_m else ""
        rules.append((title, sigma_to_pcre(cond)))
    return rules


def main() -> int:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} path/to/rule.yml", file=sys.stderr)
        return 1
    src = Path(sys.argv[1])
    if not src.is_file():
        print(f"not found: {src}", file=sys.stderr)
        return 1
    rules = parse_sigma_yaml(src.read_text(encoding="utf-8", errors="replace"))
    lines = [
        "# Sigma -> PCRE (MVP; pcre_engine.c ile yukleyin)",
        f"# source: {src.name}",
        "",
    ]
    for title, pat in rules:
        safe = re.sub(r"[^a-zA-Z0-9_]", "_", title)[:48]
        lines.append(f"# {title}")
        lines.append(f"SIGMA_{safe}\t{pat}\t10")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK {len(rules)} rules -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
