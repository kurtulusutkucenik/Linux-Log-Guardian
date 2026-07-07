#!/usr/bin/env python3
"""Operator ozet — ~/lg-last-vitrin.json (ban/WAF hattina dokunmaz)."""
from __future__ import annotations

import argparse
import datetime
import json
import sys
from pathlib import Path
from typing import Any


def _load(root: Path, name: str) -> dict[str, Any] | None:
    p = root / name
    if not p.is_file():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def build_summary(
    root: Path,
    *,
    source_script: str,
    warn_count: int = 0,
    warn_labels: list[str] | None = None,
    published: bool = False,
) -> dict[str, Any]:
    summary: dict[str, Any] = {
        "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "script": source_script,
        "warn_count": warn_count,
        "published": published,
    }
    if warn_labels:
        summary["warn_labels"] = warn_labels

    proof = _load(root, "competitive-proof.json")
    if proof:
        tests = proof.get("validationTests") or []
        pass_n = sum(1 for x in tests if x.get("status") == "pass")
        summary["competitive_proof"] = {"pass": pass_n, "total": len(tests)}

    preview = _load(root, "website-preview-gate-report.json")
    if preview:
        sf = int(preview.get("site_fail") or 0)
        pass_n = int(
            preview.get("site_pass_all")
            or (preview.get("site_tests") if sf == 0 else preview.get("site_pass"))
            or 0
        )
        summary["website_preview"] = {
            "pass": pass_n,
            "expected": int(preview.get("expected_tests") or 0),
        }

    morning = _load(root, "morning-operator-gate-report.json")
    if morning:
        summary["morning_operator"] = {"pass": morning.get("pass") is True}

    audit = _load(root, "local-security-audit-report.json")
    if audit:
        summary["local_security_audit"] = {
            "pass": audit.get("pass") is True,
            "fail": audit.get("fail", 0),
            "warn": audit.get("warn", 0),
        }

    attack = _load(root, "attack-map-report.json")
    if attack:
        summary["attack_map"] = {
            "pass": attack.get("pass") is True,
            "markers": attack.get("markers"),
            "nav_ban_count": attack.get("nav_ban_count"),
            "nav_parity_ok": attack.get("nav_parity_ok"),
        }

    edge = _load(root, "edge-protection-gate-report.json")
    if edge:
        summary["edge"] = {
            "pass": edge.get("pass") is True,
            "xdp_mode": edge.get("xdp_mode"),
            "ipc": edge.get("ipc"),
        }

    soc = _load(root, "telegram-soc-gate-report.json")
    if soc:
        summary["telegram_soc"] = {
            "pass": soc.get("pass") is True,
            "soc_entries": soc.get("soc_entries"),
            "soc_ack": soc.get("soc_ack"),
            "soc_lineage": soc.get("soc_lineage"),
        }

    intel = _load(root, "intel-ban-db-report.json")
    if intel:
        summary["intel_ban_db"] = {
            "pass": intel.get("pass") is True,
            "ban_events_total": intel.get("ban_events_total"),
            "intel_legacy_rows": intel.get("intel_legacy_rows"),
            "stale_rows": intel.get("stale_rows"),
        }

    live = _load(root, "website-live-gate-report.json")
    if live:
        summary["website_live"] = {
            "pass": live.get("pass") is True,
            "expected": live.get("expected_tests"),
            "domain": live.get("domain"),
        }

    fleet_sign = _load(root, "fleet-command-sign-report.json")
    if fleet_sign:
        summary["fleet_command_sign"] = {
            "pass": fleet_sign.get("pass") is True,
            "require_sig": fleet_sign.get("require_sig"),
            "tamper_reject": fleet_sign.get("tamper_reject"),
        }

    e9 = _load(root, "enterprise-e9-verify-report.json")
    if e9:
        summary["enterprise_e9"] = {
            "pass": e9.get("pass") is True,
            "competitive_proof": e9.get("competitive_proof"),
        }

    dash_live = _load(root, "dashboard-tests-live-report.json")
    if dash_live:
        summary["dashboard_tests_live"] = {
            "pass": dash_live.get("pass") is True,
            "actual": dash_live.get("actual"),
            "expected": dash_live.get("expected"),
            "parity_ok": dash_live.get("parity_ok"),
            "login_ok": dash_live.get("login_ok"),
        }

    fleet_prune = _load(root, "fleet-prune-cmds-report.json")
    if fleet_prune:
        summary["fleet_prune_cmds"] = {
            "pass": fleet_prune.get("pass") is True,
            "closed": fleet_prune.get("closed"),
            "pending_total": fleet_prune.get("pending_total"),
            "pending_young": fleet_prune.get("pending_young"),
        }

    cp = summary.get("competitive_proof")
    mo = summary.get("morning_operator")
    all_ok = True
    if cp and cp["total"] and cp["pass"] < cp["total"]:
        all_ok = False
    if mo and not mo.get("pass"):
        all_ok = False
    intel = summary.get("intel_ban_db")
    if intel and not intel.get("pass"):
        all_ok = False
    if warn_count > 0:
        all_ok = False
    summary["pass"] = all_ok
    return summary


def print_lines(summary: dict[str, Any], title: str) -> None:
    lines: list[str] = []
    cp = summary.get("competitive_proof")
    if cp:
        lines.append(f"  competitive_proof: {cp['pass']}/{cp['total']} pass")
    wp = summary.get("website_preview")
    if wp:
        lines.append(f"  website_preview: {wp['pass']}/{wp['expected']} pass")
    mo = summary.get("morning_operator")
    if mo:
        lines.append(f"  morning_operator: {'pass' if mo['pass'] else 'WARN'}")
    am = summary.get("attack_map")
    if am and am.get("pass"):
        lines.append(
            f"  attack_map: {am.get('markers', 0)} marker · nav={am.get('nav_ban_count', '—')} "
            f"parity={'OK' if am.get('nav_parity_ok') else '—'}"
        )
    edge = summary.get("edge")
    if edge and edge.get("pass"):
        lines.append(f"  edge: {edge.get('xdp_mode', '?')} · ipc={edge.get('ipc', '?')}")
    soc = summary.get("telegram_soc")
    if soc and soc.get("pass"):
        lines.append(
            f"  telegram_soc: {soc.get('soc_entries', 0)} entry · "
            f"ack={soc.get('soc_ack', 0)} lg={soc.get('soc_lineage', 0)}"
        )
    intel = summary.get("intel_ban_db")
    if intel:
        status = "OK" if intel.get("pass") else "WARN"
        stale_n = int(intel.get("stale_rows") or 0)
        line = (
            f"  intel_ban_db: {status} · rows={intel.get('ban_events_total', '—')} "
            f"legacy={intel.get('intel_legacy_rows', 0)} stale={stale_n}"
        )
        if stale_n >= 10:
            line += " · prune: bash scripts/intel_ban_db_prune_cron.sh"
        lines.append(line)
    live = summary.get("website_live")
    if live and live.get("pass"):
        lines.append(
            f"  website_live: {live.get('domain', '?')} · {live.get('expected', '—')} kart"
        )
    fcs = summary.get("fleet_command_sign")
    if fcs:
        lines.append(
            f"  fleet_command_sign: {'OK' if fcs.get('pass') else 'WARN'}"
            f" · sig={'on' if fcs.get('require_sig') else 'off'}"
        )
    e9 = summary.get("enterprise_e9")
    if e9:
        lines.append(
            f"  enterprise_e9: {'pass' if e9.get('pass') else 'WARN'}"
            f" · proof={e9.get('competitive_proof', '—')}"
        )
    dtl = summary.get("dashboard_tests_live")
    if dtl:
        if dtl.get("pass"):
            lines.append(
                f"  dashboard_tests_live: {dtl.get('actual', '—')}/{dtl.get('expected', '—')} "
                f"parity={'OK' if dtl.get('parity_ok') else '—'}"
            )
        elif dtl.get("login_ok") is False:
            lines.append("  dashboard_tests_live: WARN · login")
        else:
            lines.append(
                f"  dashboard_tests_live: WARN · "
                f"{dtl.get('actual', '—')}/{dtl.get('expected', '—')}"
            )
    fpc = summary.get("fleet_prune_cmds")
    if fpc:
        lines.append(
            f"  fleet_prune: pending={fpc.get('pending_total', 0)} "
            f"(young={fpc.get('pending_young', 0)}) · closed={fpc.get('closed', 0)}"
        )
    wl = summary.get("warn_labels")
    if wl:
        lines.append(f"  uyarilar: {', '.join(str(x) for x in wl)}")
    if not lines:
        return
    print("")
    print(title)
    for ln in lines:
        print(ln)


def main() -> int:
    ap = argparse.ArgumentParser(description="Write ~/lg-last-vitrin.json operator summary")
    ap.add_argument("--root", type=Path, required=True)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--source", default="scripts/finish_vitrin_plan.sh")
    ap.add_argument("--warn-count", type=int, default=0)
    ap.add_argument(
        "--warn-labels",
        default="",
        help="JSON array of step labels (finish_vitrin warn listesi)",
    )
    ap.add_argument("--published", action="store_true")
    ap.add_argument("--print-summary", action="store_true")
    ap.add_argument("--title", default="=== lg-last-vitrin ozet ===")
    args = ap.parse_args()

    warn_labels: list[str] = []
    if args.warn_labels.strip():
        try:
            parsed = json.loads(args.warn_labels)
            if isinstance(parsed, list):
                warn_labels = [str(x) for x in parsed]
        except json.JSONDecodeError:
            warn_labels = [args.warn_labels]

    out = args.out or Path.home() / "lg-last-vitrin.json"
    summary = build_summary(
        args.root.resolve(),
        source_script=args.source,
        warn_count=args.warn_count,
        warn_labels=warn_labels or None,
        published=args.published,
    )
    out.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[OK] lg-last-vitrin -> {out}", file=sys.stderr)
    if args.print_summary:
        print_lines(summary, args.title)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
