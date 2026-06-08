#!/usr/bin/env python3
"""real_attack_corpus replay -> real-attack-report.json (kategori bazli recall)."""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CORPUS = Path(os.environ.get("REAL_ATTACK_CORPUS", ROOT / "corpus" / "real_attack_corpus.access"))
MANIFEST = Path(os.environ.get("REAL_ATTACK_MANIFEST", ROOT / "corpus" / "real_attack_manifest.json"))
TARGET_RECALL = float(os.environ.get("REAL_ATTACK_MIN_RECALL", "85"))
REPLAY_TIMEOUT = int(os.environ.get("REAL_ATTACK_REPLAY_TIMEOUT", "0"))


def lg_bin() -> Path:
    for p in (ROOT / "log-guardian", Path("/usr/local/bin/log-guardian")):
        if p.is_file() and os.access(p, os.X_OK):
            return p
    raise FileNotFoundError("log-guardian binary yok — make log-guardian")


def rules_path() -> Path:
    # Replay her zaman repo rules.conf — CRS yolu ve yazilabilir tmp dosya
    local = ROOT / "rules.conf"
    if local.is_file():
        return local
    installed = Path("/etc/log-guardian/rules.conf")
    if installed.is_file():
        return installed
    raise FileNotFoundError("rules.conf bulunamadi")


def parse_lg_stdout(stdout: str) -> dict:
    """log-guardian --json stdout: [INFO] satirlari ile karisik olabilir."""
    start = stdout.find("{")
    if start >= 0:
        depth = 0
        for i, ch in enumerate(stdout[start:], start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(stdout[start : i + 1])
                    except json.JSONDecodeError:
                        break
    alerts_m = re.search(r'"alerts_total"\s*:\s*(\d+)', stdout)
    lines_m = re.search(r'"total_lines"\s*:\s*(\d+)', stdout)
    if alerts_m and lines_m:
        return {
            "alerts_total": int(alerts_m.group(1)),
            "total_lines": int(lines_m.group(1)),
        }
    raise RuntimeError("JSON cikti yok")


def replay_timeout_for(lines: int) -> int:
    if REPLAY_TIMEOUT > 0:
        return REPLAY_TIMEOUT
    return max(120, min(900, lines // 4 + 60))


def replay_file(lg: Path, rules: Path, log_path: Path, timeout: int | None = None) -> dict:
    env = os.environ.copy()
    env.setdefault("LOGANALYZER_PASSWORD", "DegistirBeni!123")
    # GeoIP satirlarini cikar; tmp rules rules.conf ile AYNI dizinde olmali (CRS yolu cozumu)
    cache_dir = ROOT / ".cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    tmp_rules = cache_dir / "real_attack_replay.conf"
    try:
        text = rules.read_text(encoding="utf-8", errors="replace")
        stripped: list[str] = []
        for ln in text.splitlines():
            if ln.strip().startswith("BLOCK_COUNTRIES="):
                continue
            # CRS/OpenAPI yollarini repo kokune gore mutlak yap (tmp .cache/ altinda)
            for key in ("CRS_RULES=", "OPENAPI_SCHEMA=", "FALCO_HOST_RULES=", "WASM_PLUGIN_DIR="):
                if ln.strip().startswith(key):
                    val = ln.split("=", 1)[1].strip()
                    if val and not val.startswith("/"):
                        ln = f"{key.split('=')[0]}={ROOT / val}"
                    break
            stripped.append(ln)
        tmp_rules.write_text("\n".join(stripped) + "\n", encoding="utf-8")
        os.chmod(tmp_rules, 0o600)
        line_count = sum(1 for _ in log_path.open(encoding="utf-8", errors="replace"))
        tmo = timeout if timeout is not None else replay_timeout_for(line_count)
        proc = subprocess.run(
            [
                str(lg),
                str(log_path),
                "--no-tui",
                "--json",
                "--no-ban",
                "--no-db",
                "--rules",
                str(tmp_rules),
            ],
            capture_output=True,
            text=True,
            env=env,
            timeout=tmo,
            cwd=str(ROOT),
        )
        combined = (proc.stdout or "") + (proc.stderr or "")
        if proc.returncode != 0 and "{" not in combined:
            raise RuntimeError(proc.stderr[:500] or f"exit {proc.returncode}")
        return parse_lg_stdout(combined)
    finally:
        tmp_rules.unlink(missing_ok=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--output", type=Path, default=ROOT / "real-attack-report.json")
    args = ap.parse_args()

    if not CORPUS.is_file():
        subprocess.run([sys.executable, str(ROOT / "scripts" / "generate_attack_corpus.py")], check=True)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    all_lines = CORPUS.read_text(encoding="utf-8").splitlines()
    lg = lg_bin()
    rules = rules_path()

    full = replay_file(lg, rules, CORPUS, replay_timeout_for(len(all_lines)))
    total_alerts = int(full.get("alerts_total", 0))
    total_lines = int(full.get("total_lines", len(all_lines)))

    cat_results: dict[str, dict] = {}
    for cat, info in manifest.get("categories", {}).items():
        idxs = info.get("line_indices", [])
        subset = [all_lines[i] for i in idxs if i < len(all_lines)]
        if not subset:
            continue
        with tempfile.NamedTemporaryFile(mode="w", suffix=".access", delete=False) as tf:
            tf.write("\n".join(subset) + "\n")
            tf.flush()
            sub_path = Path(tf.name)
        try:
            rep = replay_file(lg, rules, sub_path)
            alerts = int(rep.get("alerts_total", 0))
            n = len(subset)
            recall = round(100.0 * alerts / n, 1) if n else 0.0
            cat_results[cat] = {
                "lines": n,
                "alerts": alerts,
                "recall_pct": recall,
                "pass": recall >= TARGET_RECALL,
            }
        finally:
            sub_path.unlink(missing_ok=True)

    parsed_lines = total_lines or len(all_lines)
    full_recall = round(100.0 * total_alerts / parsed_lines, 1) if parsed_lines else 0.0
    cat_recalls = [c["recall_pct"] for c in cat_results.values() if c["lines"] > 0]
    cat_avg_recall = round(sum(cat_recalls) / len(cat_recalls), 1) if cat_recalls else 0.0
    offline_cats = {
        k: v for k, v in cat_results.items() if k != "brute"
    }
    offline_ok = all(c.get("pass", False) for c in offline_cats.values()) if offline_cats else True

    prev_live = None
    if args.output.is_file():
        try:
            prev = json.loads(args.output.read_text(encoding="utf-8"))
            pl = prev.get("live")
            if isinstance(pl, dict) and pl.get("enabled"):
                prev_live = pl
        except (json.JSONDecodeError, OSError):
            pass

    report = {
        "date": datetime.now(timezone.utc).isoformat(),
        "corpus": str(CORPUS.relative_to(ROOT)),
        "manifest": str(MANIFEST.relative_to(ROOT)),
        "lines_total": parsed_lines,
        "alerts_total": total_alerts,
        "attack_recall_pct": full_recall,
        "category_avg_recall_pct": cat_avg_recall,
        "target_recall_pct": TARGET_RECALL,
        "categories": cat_results,
        "pass": full_recall >= TARGET_RECALL and offline_ok,
        "note": "Corpus replay (offline). brute=canli flood (LIVE=1). bash scripts/real_attack_suite.sh LIVE=1",
    }
    if prev_live:
        report["live"] = prev_live

    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"[real_attack_replay] -> {args.output}")
    print(
        f"[real_attack_replay] recall={full_recall}% "
        f"alerts={total_alerts}/{parsed_lines} pass={report['pass']}"
    )
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
