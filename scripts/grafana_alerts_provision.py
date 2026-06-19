#!/usr/bin/env python3
"""Grafana unified alerting — grafana-alerts.json kurallarini provisioning API ile yukler."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from base64 import b64encode
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def auth_header(user: str, password: str) -> str:
    token = b64encode(f"{user}:{password}".encode()).decode()
    return f"Basic {token}"


def api_request(
    base: str,
    path: str,
    auth: str,
    method: str = "GET",
    body: dict | None = None,
) -> tuple[int, dict | list | None]:
    url = f"{base.rstrip('/')}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": auth,
            "Content-Type": "application/json",
            "X-Disable-Provenance": "true",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw.strip() else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            payload = json.loads(raw) if raw.strip() else None
        except json.JSONDecodeError:
            payload = {"message": raw}
        return exc.code, payload


def resolve_folder_uid(base: str, auth: str, title: str = "Log Guardian") -> str | None:
    code, folders = api_request(base, "/api/folders", auth)
    if code == 200 and isinstance(folders, list):
        for f in folders:
            if f.get("title") == title:
                return f.get("uid")
    code, created = api_request(
        base, "/api/folders", auth, method="POST", body={"title": title}
    )
    if code in (200, 201) and isinstance(created, dict):
        return created.get("uid")
    return None


def resolve_datasource_uid(base: str, auth: str, name: str) -> str:
    code, ds_list = api_request(base, "/api/datasources", auth)
    if code == 200 and isinstance(ds_list, list):
        for ds in ds_list:
            if ds.get("name") == name or ds.get("type") == "prometheus":
                return ds.get("uid") or "prometheus"
    return "prometheus"


def threshold_rule(
    *,
    uid: str,
    title: str,
    expr: str,
    folder_uid: str,
    ds_uid: str,
    group: str,
    threshold: float,
    cmp: str,
    for_duration: str,
    annotations: dict,
    labels: dict,
) -> dict:
    """Prometheus (A) -> reduce last (B) -> threshold (C) — Grafana unified alerting zorunlulugu."""
    return {
        "uid": uid,
        "title": title,
        "condition": "C",
        "data": [
            {
                "refId": "A",
                "relativeTimeRange": {"from": 300, "to": 0},
                "datasourceUid": ds_uid,
                "model": {
                    "expr": expr,
                    "intervalMs": 1000,
                    "refId": "A",
                },
            },
            {
                "refId": "B",
                "relativeTimeRange": {"from": 0, "to": 0},
                "datasourceUid": "__expr__",
                "model": {
                    "type": "reduce",
                    "refId": "B",
                    "expression": "A",
                    "reducer": "last",
                    "settings": {"mode": "dropNN", "replaceNN": False},
                },
            },
            {
                "refId": "C",
                "relativeTimeRange": {"from": 0, "to": 0},
                "datasourceUid": "__expr__",
                "model": {
                    "type": "threshold",
                    "refId": "C",
                    "expression": "B",
                    "conditions": [
                        {
                            "evaluator": {"params": [threshold], "type": cmp},
                            "operator": {"type": "and"},
                            "query": {"params": ["C"]},
                            "type": "query",
                        }
                    ],
                },
            },
        ],
        "noDataState": "OK",
        "execErrState": "Alerting",
        "for": for_duration,
        "annotations": annotations,
        "labels": labels,
        "ruleGroup": group,
        "folderUID": folder_uid,
    }


def parse_rule_expr(raw_expr: str, uid: str) -> tuple[str, float, str]:
    """Prometheus ifadesi -> (temiz expr, esik, karsilastirma)."""
    expr = raw_expr.strip()
    # Bool carpim / karsilastirma: 1=alarm, 0=normal → esik > 0
    if (
        " and " in expr
        or " == " in expr
        or "> bool" in expr
        or "< bool" in expr
        or " == bool" in expr
    ):
        return expr, 0.0, "gt"

    if ">" in expr:
        base, tail = expr.rsplit(">", 1)
        try:
            return base.strip(), float(tail.strip()), "gt"
        except ValueError:
            pass

    if "<" in expr:
        base, tail = expr.rsplit("<", 1)
        try:
            return base.strip(), float(tail.strip()), "lt"
        except ValueError:
            pass

    return expr, 1.0, "gt"


def rules_from_template(alerts_path: Path, folder_uid: str, ds_uid: str) -> list[dict]:
    raw = json.loads(alerts_path.read_text(encoding="utf-8"))
    group_name = "log-guardian"
    if raw.get("groups"):
        group_name = raw["groups"][0].get("name") or group_name

    built: list[dict] = []
    for grp in raw.get("groups") or []:
        group_name = grp.get("name") or group_name
        for rule in grp.get("rules") or []:
            uid = rule.get("uid") or rule.get("title", "rule").lower().replace(" ", "-")
            title = rule.get("title") or uid
            expr = ""
            for item in rule.get("data") or []:
                model = item.get("model") or {}
                if model.get("expr"):
                    expr = model["expr"]
            if not expr:
                continue
            base_expr, threshold, cmp = parse_rule_expr(expr, uid)
            built.append(
                threshold_rule(
                    uid=uid,
                    title=title,
                    expr=base_expr,
                    folder_uid=folder_uid,
                    ds_uid=ds_uid,
                    group=group_name,
                    threshold=threshold,
                    cmp=cmp,
                    for_duration=rule.get("for") or "5m",
                    annotations=rule.get("annotations") or {},
                    labels=rule.get("labels") or {},
                )
            )
    return built


def main() -> int:
    base = os.environ.get("GRAFANA_URL", "http://127.0.0.1:3002")
    user = os.environ.get("GRAFANA_USER", "admin")
    password = os.environ.get("GRAFANA_PASS", "admin")
    ds_name = os.environ.get("GRAFANA_PROM_DS", "Prometheus")
    alerts_path = ROOT / "grafana-alerts.json"

    if not alerts_path.is_file():
        print(f"[grafana_alerts] {alerts_path} yok", file=sys.stderr)
        return 1

    auth = auth_header(user, password)
    code, _ = api_request(base, "/api/health", auth)
    if code != 200:
        print(f"[grafana_alerts] Grafana erisilemiyor: {base} (HTTP {code})", file=sys.stderr)
        return 1

    folder_uid = resolve_folder_uid(base, auth)
    if not folder_uid:
        print("[grafana_alerts] folder UID alinamadi", file=sys.stderr)
        return 1

    ds_uid = resolve_datasource_uid(base, auth, ds_name)
    rules = rules_from_template(alerts_path, folder_uid, ds_uid)
    if not rules:
        print("[grafana_alerts] import edilecek kural yok", file=sys.stderr)
        return 1

    ok = 0
    for rule in rules:
        uid = rule["uid"]
        code, _ = api_request(
            base,
            f"/api/v1/provisioning/alert-rules/{uid}",
            auth,
            method="GET",
        )
        if code == 200:
            code, resp = api_request(
                base,
                f"/api/v1/provisioning/alert-rules/{uid}",
                auth,
                method="PUT",
                body=rule,
            )
        else:
            code, resp = api_request(
                base,
                "/api/v1/provisioning/alert-rules",
                auth,
                method="POST",
                body=rule,
            )
        if code in (200, 201, 202):
            ok += 1
            print(f"[OK] alert rule: {uid}")
        else:
            print(f"[WARN] alert rule {uid} HTTP {code}: {resp}", file=sys.stderr)

    print(f"[grafana_alerts] {ok}/{len(rules)} kural yuklendi (folder={folder_uid})")
    return 0 if ok == len(rules) else 1


if __name__ == "__main__":
    raise SystemExit(main())
