#!/usr/bin/env python3
"""guardian --status tenant blogu -> tenant-isolation-report.json"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--input", type=Path, default=ROOT / ".cache/tenant-status-snapshot.json")
    ap.add_argument("-o", "--output", type=Path, default=ROOT / "tenant-isolation-report.json")
    args = ap.parse_args()

    status = json.loads(args.input.read_text(encoding="utf-8")) if args.input.is_file() else {}
    tenant = status.get("tenant") or {}

    checks = [
        {"id": "separate_db", "pass": "events-" in (tenant.get("db_path") or "")},
        {"id": "scoped_ban_audit", "pass": "tenants/" in (tenant.get("ban_audit") or "")},
        {"id": "policy_overlay", "pass": tenant.get("policy_overlay") is True},
        {"id": "tenant_id_label", "pass": bool(tenant.get("id"))},
    ]
    passed = sum(1 for c in checks if c["pass"])

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pass": passed == len(checks) and tenant.get("multi_tenant_db") is True,
        "tenant": tenant,
        "checks": checks,
        "checks_passed": passed,
        "checks_total": len(checks),
        "standards": ["SOC2 CC6.1", "KVKK m.12", "PCI Req 10.2"],
    }
    args.output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[tenant_isolation_export] {passed}/{len(checks)} -> {args.output}")
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
