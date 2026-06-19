#!/usr/bin/env python3
"""Grafana Telegram contact point + notification policy (LG #30 — Ops grubundan ayri)."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from base64 import b64encode
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CP_NAME = "log-guardian-telegram"
MATCH_LABEL = "product"
MATCH_VALUE = "log-guardian"


def auth_header(user: str, password: str) -> str:
    return "Basic " + b64encode(f"{user}:{password}".encode()).decode()


def api(
    base: str,
    path: str,
    auth: str,
    *,
    method: str = "GET",
    body: dict | None = None,
) -> tuple[int, dict | list | str | None]:
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
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode()
            if not raw.strip():
                return resp.status, None
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            payload = json.loads(raw) if raw.strip() else None
        except json.JSONDecodeError:
            payload = {"message": raw}
        return exc.code, payload


def find_contact_point(cps: list, name: str) -> dict | None:
    for cp in cps:
        if cp.get("name") == name:
            return cp
    return None


def upsert_contact_point(
    base: str, auth: str, token: str, chat_id: str, message_thread_id: int = 0
) -> str:
    settings: dict[str, str] = {"bottoken": token, "chatid": str(chat_id)}
    if message_thread_id > 0:
        settings["message_thread_id"] = str(message_thread_id)
    payload = {
        "name": CP_NAME,
        "type": "telegram",
        "settings": settings,
        "disableResolveMessage": False,
    }
    code, cps = api(base, "/api/v1/provisioning/contact-points", auth)
    if code != 200 or not isinstance(cps, list):
        raise RuntimeError(f"contact-points list HTTP {code}: {cps}")

    existing = find_contact_point(cps, CP_NAME)
    if existing:
        uid = existing["uid"]
        code, resp = api(
            base,
            f"/api/v1/provisioning/contact-points/{uid}",
            auth,
            method="PUT",
            body={**payload, "uid": uid},
        )
        if code not in (200, 202):
            raise RuntimeError(f"contact-point PUT HTTP {code}: {resp}")
        print(f"[OK] contact point guncellendi: {CP_NAME} (uid={uid})")
        return uid

    code, resp = api(
        base,
        "/api/v1/provisioning/contact-points",
        auth,
        method="POST",
        body=payload,
    )
    if code not in (200, 201, 202) or not isinstance(resp, dict):
        raise RuntimeError(f"contact-point POST HTTP {code}: {resp}")
    uid = resp.get("uid", "?")
    print(f"[OK] contact point olusturuldu: {CP_NAME} (uid={uid})")
    return str(uid)


def merge_route(routes: list | None, receiver: str) -> list:
    routes = list(routes or [])
    matcher = [[MATCH_LABEL, "=", MATCH_VALUE]]
    updated = False
    for i, route in enumerate(routes):
        om = route.get("object_matchers") or []
        if om == matcher:
            routes[i] = {
                **route,
                "receiver": receiver,
                "object_matchers": matcher,
                "group_by": route.get("group_by") or ["alertname", "severity"],
                "continue": False,
            }
            updated = True
            break
    if not updated:
        routes.append(
            {
                "receiver": receiver,
                "object_matchers": matcher,
                "group_by": ["alertname", "severity"],
                "continue": False,
            }
        )
    return routes


def upsert_policy(base: str, auth: str, receiver: str) -> None:
    code, policy = api(base, "/api/v1/provisioning/policies", auth)
    if code != 200 or not isinstance(policy, dict):
        raise RuntimeError(f"policies GET HTTP {code}: {policy}")

    policy["routes"] = merge_route(policy.get("routes"), receiver)
    code, resp = api(
        base,
        "/api/v1/provisioning/policies",
        auth,
        method="PUT",
        body=policy,
    )
    if code not in (200, 202):
        raise RuntimeError(f"policies PUT HTTP {code}: {resp}")
    thread = int(os.environ.get("GRAFANA_TELEGRAM_MESSAGE_THREAD_ID", "0") or "0")
    dest = f"#warn topic {thread}" if thread > 0 else "operator DM"
    print(
        f"[OK] notification policy: {MATCH_LABEL}={MATCH_VALUE} → {receiver} ({dest})"
    )


def main() -> int:
    base = os.environ.get("GRAFANA_URL", "http://127.0.0.1:3002")
    user = os.environ.get("GRAFANA_USER", "admin")
    password = os.environ.get("GRAFANA_PASS", "admin")
    token = os.environ.get("GRAFANA_TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("GRAFANA_TELEGRAM_CHAT_ID", "").strip()
    message_thread_id = int(os.environ.get("GRAFANA_TELEGRAM_MESSAGE_THREAD_ID", "0") or "0")
    if not token or not chat_id:
        print(
            "[grafana_contact] ATLANDI — GRAFANA_TELEGRAM_BOT_TOKEN + GRAFANA_TELEGRAM_CHAT_ID gerekli\n"
            "  Hizli (WARN DM, Ops grubu degil):\n"
            "    bash scripts/grafana_telegram_contact.sh --from-webhook-warn\n"
            "  Manuel env: deploy/grafana.telegram.env.example → .env.grafana.telegram.local",
            file=sys.stderr,
        )
        return 0

    if chat_id.startswith("-100"):
        if message_thread_id > 0:
            print(
                f"[grafana_contact] Ops supergroup + topic #{message_thread_id} (#warn)",
                file=sys.stderr,
            )
        else:
            print(
                "[grafana_contact] UYARI: chat_id supergroup (-100…) — "
                "LG Ops ile karismamak icin operator DM veya WEBHOOK_TELEGRAM_TOPIC_WARN kullanin (#30)",
                file=sys.stderr,
            )
            if os.environ.get("GRAFANA_ALLOW_OPS_CHAT", "0") != "1":
                print(
                    "[grafana_contact] FAIL: LG Ops grubu Grafana contact olarak onerilmez. "
                    "GRAFANA_TELEGRAM_CHAT_ID=DM, WEBHOOK_TELEGRAM_TOPIC_WARN=17 veya GRAFANA_ALLOW_OPS_CHAT=1",
                    file=sys.stderr,
                )
                return 1

    auth = auth_header(user, password)
    code, _ = api(base, "/api/health", auth)
    if code != 200:
        print(f"[grafana_contact] Grafana erisilemiyor: {base}", file=sys.stderr)
        return 1

    try:
        upsert_contact_point(base, auth, token, chat_id, message_thread_id)
        upsert_policy(base, auth, CP_NAME)
    except RuntimeError as exc:
        print(f"[grafana_contact] FAIL: {exc}", file=sys.stderr)
        return 1

    print("[OK] grafana_contact_provision tamam")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
