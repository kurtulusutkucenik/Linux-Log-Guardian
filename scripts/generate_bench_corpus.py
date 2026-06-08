#!/usr/bin/env python3
"""Bench corpus: benign + attack karisimi (gercek dunya temsili, min 300 satir)."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENIGN = ROOT / "corpus" / "benign_corpus.access"
ATTACK = ROOT / "corpus" / "real_attack_corpus.access"
OUT = ROOT / "corpus" / "bench_mixed.access"
MIN_LINES = int(__import__("os").environ.get("BENCH_MIXED_MIN", "500"))


def ensure_corpus() -> None:
    if not BENIGN.is_file() or sum(1 for _ in BENIGN.open()) < 200:
        subprocess.run([sys.executable, str(ROOT / "scripts" / "generate_benign_corpus.py")], check=True)
    if not ATTACK.is_file():
        subprocess.run([sys.executable, str(ROOT / "scripts" / "generate_attack_corpus.py")], check=True)


def main() -> None:
    ensure_corpus()
    benign = BENIGN.read_text(encoding="utf-8").splitlines()
    attack = ATTACK.read_text(encoding="utf-8").splitlines()
    # Her 2 benign'e 1 attack — dengeli mix
    mixed: list[str] = []
    ai = 0
    for i, bl in enumerate(benign):
        if bl.strip():
            mixed.append(bl)
        if (i + 1) % 2 == 0 and ai < len(attack):
            if attack[ai].strip():
                mixed.append(attack[ai])
            ai += 1
    while ai < len(attack):
        if attack[ai].strip():
            mixed.append(attack[ai])
        ai += 1
    while len(mixed) < MIN_LINES and benign:
        mixed.append(benign[len(mixed) % len(benign)])

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(mixed) + "\n", encoding="utf-8")
    # bench_vs_modsec varsayilan logu da guncelle
    bench = ROOT / "corpus" / "bench_corpus.access"
    bench.write_text(OUT.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"[generate_bench_corpus] {OUT} ({len(mixed)} lines, attack_ratio~{ai}/{len(mixed)})")
    print(f"[generate_bench_corpus] -> {bench}")


if __name__ == "__main__":
    main()
