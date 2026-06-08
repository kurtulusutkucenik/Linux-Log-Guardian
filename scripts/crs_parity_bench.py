#!/usr/bin/env python3
"""
CRS parity benchmark — Guardian PCRE2 vs OWASP CRS @rx pattern seti.

  python3 scripts/crs_parity_bench.py
  python3 scripts/crs_parity_bench.py -o crs-parity-report.json
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CORPUS = ROOT / "rules" / "crs-parity-corpus.json"
DEFAULT_CRS = ROOT / "rules" / "crs-bundle.rules"
DEFAULT_OUT = ROOT / "crs-parity-report.json"
MIN_RECALL = 0.85
MIN_PARITY = 0.80


def load_patterns(crs_path: Path) -> list[str]:
    pats: list[str] = []
    if not crs_path.is_file():
        return pats
    for line in crs_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line.startswith("CRS_REGEX="):
            pats.append(line.split("=", 1)[1].strip())
    return pats


def normalize_target(url: str, ua: str = "") -> str:
    from urllib.parse import unquote_plus

    decoded = unquote_plus(url)
    if ua:
        return f"{decoded} {ua}"
    return decoded


def regex_sim(url: str, patterns: list[str], ua: str = "") -> bool:
    target = normalize_target(url, ua)
    for p in patterns:
        try:
            if re.search(p, target, re.I):
                return True
        except re.error:
            continue
    return False


def build_log_line(ip: str, query: str, ua: str = "Mozilla/5.0") -> str:
    path = "/search"
    if query:
        q = query if "%" in query else urllib.parse.quote(query, safe="=&+'")
        url_part = f"{path}?{q}"
    else:
        url_part = "/health"
    return (
        f'{ip} - - [02/Jun/2026:10:00:01 +0300] '
        f'"GET {url_part} HTTP/1.1" 200 100 "-" "{ua}"'
    )


def write_rules_conf(path: Path, crs_rules: Path) -> None:
    pwd = (
        "pbkdf2$100000$6560e0aa800d47957280cab9a1038847$"
        "b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504"
    )
    # rules.conf .cache/ altindaysa goreli CRS_RULES yanlis cozulur (.cache/rules/...).
    crs_abs = crs_rules.resolve()
    text = f"""ACCESS_PASSWORD_KDF={pwd}
CRS_ENABLED=1
CRS_RULES={crs_abs}
WAF_ENABLED=1
WAF_SCORE_BAN_THRESHOLD=7
WAF_SCANNER_DETECT=1
WAF_SHELLCMD=1
WASM_ENABLED=0
SQLI_SCORE=1
AUTO_BAN=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
SIEM_FORWARDER_ENABLED=0
MESH_PUB_ENABLED=0
"""
    path.write_text(text, encoding="utf-8")
    path.chmod(0o600)


def run_guardian(log_path: Path, rules_path: Path) -> set[str]:
    env = dict(**__import__("os").environ)
    env.setdefault("LOGANALYZER_PASSWORD", "DegistirBeni!123")
    proc = subprocess.run(
        [
            str(ROOT / "log-guardian"),
            str(log_path),
            "--no-tui",
            "--no-ban",
            "--no-db",
            "--rules",
            str(rules_path),
            "-t",
            "2",
        ],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        env=env,
    )
    alerted: set[str] = set()
    for line in (proc.stderr or "").splitlines():
        m = re.search(r"\[ALARM\s+\d+\]\s+(\S+)\s+-", line)
        if m:
            alerted.add(m.group(1))
    return alerted


def main() -> int:
    ap = argparse.ArgumentParser(description="CRS parity benchmark")
    ap.add_argument("-o", "--output", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    ap.add_argument("--crs", type=Path, default=DEFAULT_CRS)
    ap.add_argument("--min-recall", type=float, default=MIN_RECALL)
    ap.add_argument("--min-parity", type=float, default=MIN_PARITY)
    args = ap.parse_args()

    if not args.corpus.is_file():
        print(f"[ERR] corpus yok: {args.corpus}", file=sys.stderr)
        return 1

    corpus = json.loads(args.corpus.read_text(encoding="utf-8"))
    patterns = load_patterns(args.crs)
    if len(patterns) < 50:
        subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "generate_crs_bundle.py")],
            cwd=str(ROOT),
            check=False,
        )
        patterns = load_patterns(args.crs)

    cache = ROOT / ".cache"
    cache.mkdir(exist_ok=True)
    log_path = cache / "crs_parity.log"
    rules_path = cache / "crs_parity_rules.conf"
    write_rules_conf(rules_path, args.crs)

    attacks = corpus.get("attacks", [])
    benign = corpus.get("benign", [])
    ip_map: dict[str, dict] = {}
    lines: list[str] = []

    for i, item in enumerate(attacks):
        ip = f"10.1.0.{i + 1}"
        q = item.get("query", "")
        ua = item.get("ua", "Mozilla/5.0")
        lines.append(build_log_line(ip, q, ua))
        url = f"/search?{q}" if q else "/health"
        ip_map[ip] = {
            "id": item["id"],
            "kind": "attack",
            "category": item.get("category", ""),
            "regex_sim": regex_sim(url, patterns, ua),
        }

    for i, item in enumerate(benign):
        ip = f"10.2.0.{i + 1}"
        q = item.get("query", "")
        lines.append(build_log_line(ip, q))
        url = f"/search?{q}" if q else "/health"
        ip_map[ip] = {
            "id": item["id"],
            "kind": "benign",
            "category": "benign",
            "regex_sim": regex_sim(url, patterns),
        }

    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    guardian = ROOT / "log-guardian"
    if not guardian.is_file():
        subprocess.run(["make", "-s", "log-guardian"], cwd=str(ROOT), check=True)

    alerted_ips = run_guardian(log_path, rules_path)

    results: list[dict] = []
    atk_hit = atk_sim = atk_g = 0
    ben_fp = ben_g = 0
    parity_agree = 0
    parity_total = 0

    for ip, meta in ip_map.items():
        g_hit = ip in alerted_ips
        if meta["kind"] == "attack":
            atk_g += int(g_hit)
            atk_sim += int(meta["regex_sim"])
            if meta["regex_sim"]:
                atk_hit += 1
            parity_total += 1
            if g_hit == meta["regex_sim"]:
                parity_agree += 1
        else:
            if g_hit:
                ben_g += 1
            if meta["regex_sim"]:
                ben_fp += 1
        results.append(
            {
                **meta,
                "ip": ip,
                "guardian": g_hit,
            }
        )

    n_atk = len(attacks)
    n_ben = len(benign)
    recall = (atk_g / n_atk) if n_atk else 0.0
    sim_recall = (atk_sim / n_atk) if n_atk else 0.0
    parity = (parity_agree / parity_total) if parity_total else 0.0
    benign_fp_rate = (ben_g / n_ben) if n_ben else 0.0

    passed = recall >= args.min_recall and parity >= args.min_parity and benign_fp_rate == 0.0

    report = {
        "date": datetime.now(timezone.utc).isoformat(),
        "crs_rules": str(args.crs.relative_to(ROOT) if args.crs.is_relative_to(ROOT) else args.crs),
        "crs_pattern_count": len(patterns),
        "corpus": str(args.corpus.name),
        "attacks_total": n_atk,
        "benign_total": n_ben,
        "guardian": {
            "attack_detected": atk_g,
            "attack_recall_pct": round(recall * 100, 2),
            "benign_fp": ben_g,
            "benign_fp_pct": round(benign_fp_rate * 100, 2),
        },
        "crs_regex_sim": {
            "attack_detected": atk_sim,
            "attack_recall_pct": round(sim_recall * 100, 2),
            "benign_fp": ben_fp,
            "note": "Python re ile CRS_REGEX seti — ModSecurity @rx yaklasik paritesi",
        },
        "parity_pct": round(parity * 100, 2),
        "targets": {
            "min_attack_recall_pct": args.min_recall * 100,
            "min_parity_pct": args.min_parity * 100,
            "max_benign_fp": 0,
        },
        "pass": passed,
        "samples": results,
    }

    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(
        f"[crs_parity] guardian_recall={report['guardian']['attack_recall_pct']}% "
        f"parity={report['parity_pct']}% crs_patterns={len(patterns)} pass={passed}"
    )
    print(f"[crs_parity] -> {args.output}")
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
