#!/usr/bin/env python3
"""Grafana dashboard JSON — Prometheus datasource UID enjekte et."""
from __future__ import annotations

import json
import sys

DS_REF = {"type": "prometheus"}


def patch_datasource(obj, uid: str) -> None:
    ref = {**DS_REF, "uid": uid}
    if isinstance(obj, dict):
        ds = obj.get("datasource")
        if isinstance(ds, dict) and ds.get("type") == "prometheus":
            ds["uid"] = uid
            ds.setdefault("type", "prometheus")
        for v in obj.values():
            patch_datasource(v, uid)
    elif isinstance(obj, list):
        for item in obj:
            patch_datasource(item, uid)


def inject_panel_datasources(dash: dict, uid: str) -> None:
    ref = {**DS_REF, "uid": uid}
    for panel in dash.get("panels", []):
        if not isinstance(panel, dict):
            continue
        if panel.get("type") in ("row",):
            continue
        panel.setdefault("datasource", dict(ref))
        for target in panel.get("targets", []):
            if isinstance(target, dict):
                target.setdefault("datasource", dict(ref))
                target.setdefault("refId", target.get("refId", "A"))


def main() -> None:
    if len(sys.argv) != 4:
        print("usage: grafana_dashboard_pack.py <dashboard.json> <ds_uid> <out.json>", file=sys.stderr)
        sys.exit(1)
    src, uid, dst = sys.argv[1:4]
    with open(src, encoding="utf-8") as f:
        dash = json.load(f)
    patch_datasource(dash, uid)
    inject_panel_datasources(dash, uid)
    dash.setdefault("uid", "log-guardian-01")
    dash.setdefault("schemaVersion", 39)
    payload = {
        "dashboard": dash,
        "overwrite": True,
        "folderId": 0,
        "message": "log-guardian provision",
    }
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(payload, f)
    print(dst)


if __name__ == "__main__":
    main()
