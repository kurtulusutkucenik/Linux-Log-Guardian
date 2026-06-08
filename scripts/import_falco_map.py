#!/usr/bin/env python3
"""rules/falco-guardian-map.yaml → rules.conf yorum bloklari (Faz 2)"""
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("pip install pyyaml", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
MAP = ROOT / "rules" / "falco-guardian-map.yaml"
OUT = ROOT / "rules" / "falco-generated.conf"


def main() -> int:
    if not MAP.is_file():
        print(f"missing {MAP}", file=sys.stderr)
        return 1
    data = yaml.safe_load(MAP.read_text(encoding="utf-8")) or {}
    lines = [
        "# Uretildi: scripts/import_falco_map.py — Falco esleme (manuel WAF icin rehber)",
        "",
    ]
    for m in data.get("mappings", []):
        falco = m.get("falco", "?")
        sig = m.get("guardian_signal", "")
        mitre = m.get("mitre", "")
        lines.append(f"# Falco: {falco} -> {sig} MITRE={mitre}")
        waf = m.get("waf_category")
        if waf:
            lines.append(f"#   WAF kategori: {waf}")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK -> {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
