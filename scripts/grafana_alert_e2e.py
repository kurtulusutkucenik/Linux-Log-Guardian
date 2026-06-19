#!/usr/bin/env python3
"""Grafana → Telegram DM E2E (#30): policy + contact dogrulama, Grafana formatinda test mesaji."""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from base64 import b64encode

CP_NAME = "log-guardian-telegram"
MATCH_LABEL = "product"
MATCH_VALUE = "log-guardian"


def auth_header(user: str, password: str) -> str:
    return "Basic " + b64encode(f"{user}:{password}".encode()).decode()


def api_json(
    base: str,
    path: str,
    auth: str,
    *,
    method: str = "GET",
    body: dict | None = None,
) -> tuple[int, object]:
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
            return resp.status, json.loads(raw) if raw.strip() else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode(errors="replace")
        try:
            payload = json.loads(raw) if raw.strip() else {"message": raw}
        except json.JSONDecodeError:
            payload = {"message": raw}
        return exc.code, payload


def find_contact(cps: list, name: str) -> dict | None:
    for cp in cps:
        if cp.get("name") == name:
            return cp
    return None


def policy_routes_to_receiver(policy: dict, receiver: str) -> bool:
    matcher = [MATCH_LABEL, "=", MATCH_VALUE]
    for route in policy.get("routes") or []:
        if route.get("receiver") == receiver and route.get("object_matchers") == [matcher]:
            return True
    return False


def grafana_test_message(*, topic_id: int = 0) -> str:
    dest = f"#warn topic {topic_id}" if topic_id > 0 else "operator DM"
    return (
        "🟡 [FIRING:1] LG Grafana E2E\n"
        "Labels:\n"
        " - alertname = LG Grafana E2E\n"
        f" - {MATCH_LABEL} = {MATCH_VALUE}\n"
        " - severity = warning\n"
        "Annotations:\n"
        f" - summary = Grafana metrik alarmi → {dest}\n"
        "Source: bash scripts/grafana_alert_e2e.sh"
    )


def token_usable(token: str) -> bool:
    t = (token or "").strip()
    if not t or len(t) < 20:
        return False
    if "REDACTED" in t.upper() or t.startswith("["):
        return False
    return True


def send_telegram(token: str, chat_id: str, text: str, *, message_thread_id: int = 0) -> None:
    payload: dict[str, object] = {
        "chat_id": chat_id,
        "text": text,
        "disable_web_page_preview": True,
    }
    if message_thread_id > 0:
        payload["message_thread_id"] = message_thread_id
    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    if not data.get("ok"):
        raise RuntimeError(f"Telegram sendMessage: {data.get('description')}")


def main() -> int:
    base = os.environ.get("GRAFANA_URL", "http://127.0.0.1:3002")
    user = os.environ.get("GRAFANA_USER", "admin")
    password = os.environ.get("GRAFANA_PASS", "admin")
    token = os.environ.get("GRAFANA_TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("GRAFANA_TELEGRAM_CHAT_ID", "").strip()
    skip_send = os.environ.get("GRAFANA_ALERT_E2E_SKIP_SEND", "0") == "1"

    auth = auth_header(user, password)
    code, _ = api_json(base, "/api/health", auth)
    if code != 200:
        print(f"[grafana_alert_e2e] FAIL: Grafana erisilemiyor ({base})", file=sys.stderr)
        return 1

    code, cps = api_json(base, "/api/v1/provisioning/contact-points", auth)
    if code != 200 or not isinstance(cps, list):
        print(f"[grafana_alert_e2e] FAIL: contact-points HTTP {code}", file=sys.stderr)
        return 1

    cp = find_contact(cps, CP_NAME)
    if not cp:
        print(
            f"[grafana_alert_e2e] FAIL: contact '{CP_NAME}' yok — "
            "bash scripts/grafana_telegram_contact.sh --from-webhook-warn",
            file=sys.stderr,
        )
        return 1

    settings = cp.get("settings") or {}
    chat_id = chat_id or str(settings.get("chatid") or "").strip()
    thread_raw = (
        os.environ.get("GRAFANA_TELEGRAM_MESSAGE_THREAD_ID")
        or settings.get("message_thread_id")
        or "0"
    )
    try:
        message_thread_id = int(str(thread_raw).strip() or "0")
    except ValueError:
        message_thread_id = 0
    if not token_usable(token):
        grafana_token = str(settings.get("bottoken") or "").strip()
        if token_usable(grafana_token):
            token = grafana_token

    if not chat_id:
        print(
            "[grafana_alert_e2e] FAIL: Telegram chat_id yok — "
            "bash scripts/grafana_telegram_contact.sh --from-webhook-warn",
            file=sys.stderr,
        )
        return 1

    if not skip_send and not token_usable(token):
        print(
            "[grafana_alert_e2e] FAIL: bot token okunamadi (Grafana API [REDACTED]) — "
            "sudo bash scripts/grafana_alert_e2e.sh veya webhook.env okunur olmali",
            file=sys.stderr,
        )
        return 1

    if chat_id.startswith("-100") and message_thread_id <= 0:
        print(
            "[grafana_alert_e2e] FAIL: supergroup (-100…) topic yok — "
            "WEBHOOK_TELEGRAM_TOPIC_WARN=17 + --from-webhook-warn",
            file=sys.stderr,
        )
        return 1

    code, policy = api_json(base, "/api/v1/provisioning/policies", auth)
    if code != 200 or not isinstance(policy, dict):
        print(f"[grafana_alert_e2e] FAIL: policies HTTP {code}", file=sys.stderr)
        return 1

    if not policy_routes_to_receiver(policy, CP_NAME):
        print(
            f"[grafana_alert_e2e] FAIL: policy {MATCH_LABEL}={MATCH_VALUE} → {CP_NAME} yok",
            file=sys.stderr,
        )
        return 1

    dest = f"#warn topic {message_thread_id}" if message_thread_id > 0 else "DM"
    print(f"[OK] contact: {CP_NAME} chat_id={chat_id} ({dest})")
    print(f"[OK] policy: {MATCH_LABEL}={MATCH_VALUE} → {CP_NAME}")

    if skip_send:
        print("[OK] grafana_alert_e2e — dogrulama (mesaj atlanadi)")
        return 0

    send_telegram(
        token,
        chat_id,
        grafana_test_message(topic_id=message_thread_id),
        message_thread_id=message_thread_id,
    )
    print(f"[OK] Telegram test mesaji gonderildi (Grafana FIRING formati, {dest})")
    if message_thread_id > 0:
        print("[OK] grafana_alert_e2e — #warn topic'inde FIRING mesaji gorunmeli (#waf/#ban ayri)")
    else:
        print("[OK] grafana_alert_e2e — operator DM'de mesaj gorunmeli")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
