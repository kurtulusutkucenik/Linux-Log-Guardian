#!/usr/bin/env python3
"""Copilot RAG — events.db + attack tree -> copilot-rag-context.json"""
from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "copilot-rag-context.json"


def read_json(path: Path):
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def fetch_alerts(db_path: Path, limit: int = 12) -> list[dict]:
    if not db_path.is_file():
        return []
    try:
        con = sqlite3.connect(str(db_path))
        con.row_factory = sqlite3.Row
        rows = con.execute(
            """
            SELECT ts, ip, level, message, incident_id
            FROM alerts
            ORDER BY ts DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        con.close()
    except sqlite3.Error:
        return []
    out = []
    for r in rows:
        out.append(
            {
                "ts": r["ts"],
                "ip": r["ip"] or "",
                "level": r["level"],
                "message": (r["message"] or "")[:240],
                "incident_id": r["incident_id"] or "",
                "cite": f"events.db alerts ts={r['ts']} ip={r['ip']} level={r['level']}",
            }
        )
    return out


def fetch_bans(db_path: Path, limit: int = 8) -> list[dict]:
    if not db_path.is_file():
        return []
    try:
        con = sqlite3.connect(str(db_path))
        con.row_factory = sqlite3.Row
        rows = con.execute(
            """
            SELECT ts, ip, action, reason
            FROM ban_events
            ORDER BY ts DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        con.close()
    except sqlite3.Error:
        return []
    return [
        {
            "ts": r["ts"],
            "ip": r["ip"] or "",
            "action": r["action"] or "",
            "reason": (r["reason"] or "")[:160],
            "cite": f"events.db ban_events ts={r['ts']} ip={r['ip']}",
        }
        for r in rows
    ]


def flatten_attack_trees(data) -> list[dict]:
    trees: list[dict] = []
    if isinstance(data, list):
        raw = data
    elif isinstance(data, dict) and "trees" in data:
        raw = data["trees"]
    else:
        return trees

    for t in raw:
        if not isinstance(t, dict):
            continue
        pid = t.get("pid") or t.get("root_pid") or 0
        risk = float(t.get("risk") or t.get("risk_score") or 0)
        comm = t.get("comm") or t.get("root_comm") or "?"
        events = t.get("events") or []
        chain = []
        for ev in events[:8]:
            if not isinstance(ev, dict):
                continue
            chain.append(
                {
                    "type": ev.get("type") or ev.get("event") or "?",
                    "detail": (ev.get("detail") or ev.get("path") or "")[:120],
                    "comm": ev.get("comm") or comm,
                }
            )
        trees.append(
            {
                "pid": pid,
                "comm": comm,
                "risk": risk,
                "events": chain,
                "cite": f"attack_tree pid={pid} risk={risk:.1f} comm={comm}",
            }
        )
    trees.sort(key=lambda x: x["risk"], reverse=True)
    return trees[:10]


def build_context(root: Path, db: Path) -> dict:
    alerts = fetch_alerts(db)
    bans = fetch_bans(db)

    trees: list[dict] = []
    for name in ("attack_tree.json", "rules/lineage-demo.json"):
        data = read_json(root / name)
        if data:
            trees.extend(flatten_attack_trees(data))

    seen = set()
    uniq_trees = []
    for t in trees:
        key = (t["pid"], t["comm"])
        if key in seen:
            continue
        seen.add(key)
        uniq_trees.append(t)
    uniq_trees.sort(key=lambda x: x["risk"], reverse=True)

    evidence_lines: list[str] = []
    for a in alerts[:6]:
        evidence_lines.append(
            f"[ALERT L{a['level']}] {a['ip']}: {a['message'][:100]}"
        )
    for t in uniq_trees[:3]:
        evs = " → ".join(
            f"{e['type']}:{e['detail'][:40]}" for e in t.get("events", [])[:4]
        )
        evidence_lines.append(
            f"[LINEAGE pid={t['pid']} risk={t['risk']:.0f}] {t['comm']} {evs}"
        )
    for b in bans[:3]:
        evidence_lines.append(f"[BAN {b['action']}] {b['ip']}: {b['reason'][:80]}")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "db_path": str(db.name),
        "alerts": alerts,
        "bans": bans,
        "attack_trees": uniq_trees[:8],
        "evidence_lines": evidence_lines,
        "stats": {
            "alert_count": len(alerts),
            "ban_count": len(bans),
            "tree_count": len(uniq_trees),
            "top_risk": uniq_trees[0]["risk"] if uniq_trees else 0,
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--output", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--root", type=Path, default=ROOT)
    ap.add_argument("--db", type=Path, default=ROOT / "events.db")
    args = ap.parse_args()

    ctx = build_context(args.root, args.db)
    args.output.write_text(
        json.dumps(ctx, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(
        f"[copilot_rag] alerts={ctx['stats']['alert_count']} "
        f"trees={ctx['stats']['tree_count']} -> {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
