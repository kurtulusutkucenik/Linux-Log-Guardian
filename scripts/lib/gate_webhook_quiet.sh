#!/usr/bin/env bash
# security_closure_gate — canli Telegram + nginx consult guvenli mod
#   source scripts/lib/gate_webhook_quiet.sh
#   gate_webhook_quiet_on
#   trap gate_webhook_quiet_off EXIT
set -euo pipefail

GATE_QUIET_ENV="${GATE_QUIET_ENV:-/etc/log-guardian/env}"
GATE_QUIET_MARKER="${GATE_QUIET_MARKER:-/tmp/lg-gate-webhook-quiet.$$}"
GATE_QUIET_PREV=""
GATE_NGINX_SNIP="/etc/nginx/snippets/log-guardian-inline-consult.conf"
GATE_NGINX_BAK="/etc/nginx/snippets/log-guardian-inline-consult.conf.lg-gate-bak"
GATE_ROOT="${LG_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

gate_wait_api_ready() {
  local port="${1:-8090}" i code
  for i in $(seq 1 30); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://127.0.0.1:${port}/api/v1/metrics" 2>/dev/null || echo 000)
    [[ "$code" == "200" || "$code" == "403" ]] && return 0
    sleep 1
  done
  return 1
}

gate_wait_api_ready_authed() {
  local port="${1:-8090}" tok i code
  for i in $(seq 1 45); do
    tok=$(grep -E '^API_TOKEN=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' || true)
    if [[ -n "$tok" ]]; then
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
        -H "Authorization: Bearer $tok" \
        -H "X-Guardian-Token: $tok" \
        "http://127.0.0.1:${port}/api/v1/metrics" 2>/dev/null || echo 000)
      [[ "$code" == "200" ]] && return 0
    else
      gate_wait_api_ready "$port" && return 0
    fi
    sleep 1
  done
  return 1
}

gate_nginx_consult_safe_on() {
  [[ "$(id -u)" -eq 0 ]] || return 0
  command -v nginx >/dev/null 2>&1 || return 0
  [[ -f "$GATE_NGINX_SNIP" ]] || return 0
  [[ -f "$GATE_NGINX_BAK" ]] || cp -a "$GATE_NGINX_SNIP" "$GATE_NGINX_BAK"
  cat >"$GATE_NGINX_SNIP" <<'EOF'
# LG gate gecici — auth_request 204 (API yokken site dusmesin)
location = /_lg_consult {
    internal;
    return 204;
}
EOF
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
    echo "[gate] nginx consult bypass aktif (gate guvenli mod)"
  fi
}

gate_nginx_consult_safe_off() {
  [[ "$(id -u)" -eq 0 ]] || return 0
  [[ -f "$GATE_NGINX_BAK" ]] || return 0
  cp -a "$GATE_NGINX_BAK" "$GATE_NGINX_SNIP"
  rm -f "$GATE_NGINX_BAK"
  if command -v nginx >/dev/null 2>&1; then
    bash "$GATE_ROOT/scripts/fix_nginx_inline_consult.sh" >/dev/null 2>&1 \
      || { nginx -t >/dev/null 2>&1 && systemctl reload nginx 2>/dev/null || true; }
    echo "[gate] nginx consult bypass kapali — gercek consult aktif"
  fi
}

gate_restore_live_stack() {
  [[ "$(id -u)" -eq 0 ]] || return 0
  echo "[gate] canli stack yenileniyor (wasm/build sonrasi)..."
  local wasmt="${WASMTIME_ROOT:-$GATE_ROOT/vendor/wasmtime}"
  if [[ -x "$GATE_ROOT/log-guardian" ]]; then
    if [[ -f "$wasmt/lib/libwasmtime.so" ]]; then
      make -C "$GATE_ROOT" -j"$(nproc 2>/dev/null || echo 2)" \
        HAVE_WASM=1 WASMTIME_ROOT="$wasmt" install 2>/dev/null \
        || make -C "$GATE_ROOT" install 2>/dev/null || true
    else
      make -C "$GATE_ROOT" install 2>/dev/null || true
    fi
  fi
  systemctl reset-failed log-guardian-daemon log-guardian 2>/dev/null || true
  systemctl restart log-guardian-daemon 2>/dev/null || true
  sleep 2
  systemctl restart log-guardian 2>/dev/null || true
  sleep 5
  if gate_wait_api_ready_authed 8090; then
    echo "[OK] gate_restore_live_stack — API :8090 hazir"
    return 0
  fi
  echo "[gate] fix_analyzer deneniyor..." >&2
  bash "$GATE_ROOT/scripts/fix_analyzer.sh" >/dev/null 2>&1 || true
  sleep 4
  gate_wait_api_ready_authed 8090
}

gate_webhook_quiet_on() {
  export LG_SECURITY_GATE=1
  export WEBHOOK_DRY_RUN=1
  export GEOIP_FEED_SKIP=1

  gate_nginx_consult_safe_on

  [[ "$(id -u)" -eq 0 ]] || return 0
  systemctl is-active --quiet log-guardian 2>/dev/null || return 0

  if [[ -f "$GATE_QUIET_ENV" ]]; then
    GATE_QUIET_PREV="$(grep -E '^WEBHOOK_DRY_RUN=' "$GATE_QUIET_ENV" 2>/dev/null | tail -1 || true)"
  fi

  if [[ -f "$GATE_QUIET_ENV" ]] && grep -qE '^WEBHOOK_DRY_RUN=' "$GATE_QUIET_ENV" 2>/dev/null; then
    sed -i 's/^WEBHOOK_DRY_RUN=.*/WEBHOOK_DRY_RUN=1/' "$GATE_QUIET_ENV"
  elif [[ -f "$GATE_QUIET_ENV" ]]; then
    printf '\nWEBHOOK_DRY_RUN=1\n' >>"$GATE_QUIET_ENV"
  else
    install -d -m 750 /etc/log-guardian
    echo 'WEBHOOK_DRY_RUN=1' >"$GATE_QUIET_ENV"
    chmod 640 "$GATE_QUIET_ENV" 2>/dev/null || true
  fi
  echo "${GATE_QUIET_PREV:-__unset__}" >"$GATE_QUIET_MARKER"

  systemctl restart log-guardian 2>/dev/null || true
  sleep 3
  echo "[gate] WEBHOOK_DRY_RUN=1 — canli Telegram susturuldu (gate bitince geri alinir)"
}

gate_webhook_quiet_off() {
  gate_nginx_consult_safe_off

  [[ "$(id -u)" -eq 0 ]] || return 0
  [[ -f "$GATE_QUIET_MARKER" ]] || return 0

  local prev
  prev="$(cat "$GATE_QUIET_MARKER" 2>/dev/null || echo __unset__)"
  rm -f "$GATE_QUIET_MARKER"

  if [[ -f "$GATE_QUIET_ENV" ]]; then
    if [[ "$prev" == "__unset__" ]]; then
      sed -i '/^WEBHOOK_DRY_RUN=/d' "$GATE_QUIET_ENV" 2>/dev/null || true
    else
      sed -i "s/^WEBHOOK_DRY_RUN=.*/${prev}/" "$GATE_QUIET_ENV" 2>/dev/null || true
    fi
  fi

  if systemctl is-active --quiet log-guardian 2>/dev/null; then
    systemctl restart log-guardian 2>/dev/null || true
  fi
}
