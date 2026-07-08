#!/usr/bin/env bash
# Log Guardian API yardimcilari — token, port, derleme on kontrol
# shellcheck shell=bash
[[ -n "${LG_GUARDIAN_API_SH:-}" ]] && return 0
LG_GUARDIAN_API_SH=1

_lg_root="${LG_ROOT:-}"
if [[ -z "$_lg_root" ]]; then
  _lg_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fi

read_lg_api_port() {
  local f p
  for f in "${LG_RULES:-/etc/log-guardian/rules.conf}" "$_lg_root/rules.conf"; do
    [[ -f "$f" ]] || continue
    p=$(grep -E '^API_PORT=' "$f" 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
    if [[ -n "$p" && "$p" =~ ^[0-9]+$ ]]; then
      echo "$p"
      return 0
    fi
  done
  echo "${GUARDIAN_API_PORT:-8090}"
}

# log-guardian restart sonrasi API hazir olana kadar bekle (403 = ayakta, token yok)
wait_lg_api_ready() {
  local tries="${1:-45}" port code i
  port="$(read_lg_api_port)"
  for ((i = 1; i <= tries; i++)); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
      "http://127.0.0.1:${port}/api/v1/metrics" 2>/dev/null || echo 000)
    if [[ "$code" == "200" || "$code" == "403" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "[wait_lg_api_ready] FAIL — :${port} hazir degil (son code=${code:-000})" >&2
  return 1
}

wait_lg_relay_ready() {
  local tries="${1:-20}" relay="${GUARDIAN_RELAY_URL:-http://127.0.0.1:18090}" code i
  for ((i = 1; i <= tries; i++)); do
    if ss -tln 2>/dev/null | grep -q ':18090 '; then
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
        "${relay}/api/v1/metrics" 2>/dev/null || echo 000)
      if [[ "$code" == "200" || "$code" == "403" || "$code" == "502" ]]; then
        return 0
      fi
    fi
    sleep 1
  done
  echo "[wait_lg_relay_ready] FAIL — relay :18090 hazir degil" >&2
  return 1
}

# POST /ban gercekten calisana kadar bekle (metrics 403 erken done verir)
wait_lg_ban_ready() {
  local tries="${1:-60}" port mut ip code i
  port="$(read_lg_api_port)"
  mut="$(read_lg_api_mutation_token 2>/dev/null || read_lg_api_token 2>/dev/null || true)"
  [[ -n "$mut" ]] || {
    echo "[wait_lg_ban_ready] FAIL — mutation token yok" >&2
    return 1
  }
  ip="${LG_BAN_PROBE_IP:-203.0.113.247}"
  for ((i = 1; i <= tries; i++)); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST \
      -H "Authorization: Bearer ${mut}" \
      "http://127.0.0.1:${port}/api/v1/ban?ip=${ip}&reason=ban-ready-probe" 2>/dev/null || echo 000)
    if [[ "$code" == "200" || "$code" == "409" ]]; then
      curl -s -o /dev/null --max-time 3 -X POST \
        -H "Authorization: Bearer ${mut}" \
        "http://127.0.0.1:${port}/api/v1/unban?ip=${ip}" 2>/dev/null || true
      return 0
    fi
    sleep 1
  done
  echo "[wait_lg_ban_ready] FAIL — POST /ban hazir degil (son code=${code:-000})" >&2
  return 1
}

read_lg_api_token() {
  local f tok
  for f in "${LG_RULES:-/etc/log-guardian/rules.conf}" "$_lg_root/rules.conf"; do
    [[ -f "$f" ]] || continue
    tok=$(grep -E '^API_TOKEN=' "$f" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
    if [[ -n "$tok" ]]; then
      echo "$tok"
      return 0
    fi
  done
  return 1
}

read_lg_api_mutation_token() {
  local f tok
  for f in "${LG_RULES:-/etc/log-guardian/rules.conf}" "$_lg_root/rules.conf"; do
    [[ -f "$f" ]] || continue
    tok=$(grep -E '^API_MUTATION_TOKEN=' "$f" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
    if [[ -n "$tok" ]]; then
      echo "$tok"
      return 0
    fi
  done
  return 1
}

# nginx inline consult (auth_request) — split modda mutation token
lg_api_consult_token() {
  local mut
  mut="$(read_lg_api_mutation_token 2>/dev/null || true)"
  if [[ -n "$mut" ]]; then
    echo "$mut"
    return 0
  fi
  read_lg_api_token
}

# curl -H "Authorization: Bearer ..." icin dizi: API_AUTH=(-H "Authorization: Bearer $tok")
lg_api_auth_curl() {
  local tok
  tok=$(read_lg_api_token 2>/dev/null || true)
  if [[ -n "$tok" ]]; then
    printf '%s\n' "-H" "Authorization: Bearer $tok"
  fi
}

# POST /ban /unban — split modda mutation token
lg_api_post_auth_curl() {
  local tok
  tok=$(lg_api_consult_token 2>/dev/null || true)
  if [[ -n "$tok" ]]; then
    printf '%s\n' "-H" "Authorization: Bearer $tok"
  fi
}

LG_DEMO_ACCESS_PW='DegistirBeni!123'

verify_lg_kdf_password() {
  local kdf="$1" pw="$2"
  [[ -n "$kdf" && -n "$pw" ]] || return 1
  python3 - "$kdf" "$pw" <<'PY'
import hashlib, sys
kdf, pw = sys.argv[1], sys.argv[2]
if not kdf.startswith("pbkdf2$"):
    raise SystemExit(1)
try:
    _, iters, salt, expected = kdf.split("$", 3)
    got = hashlib.pbkdf2_hmac(
        "sha256", pw.encode(), bytes.fromhex(salt), int(iters)
    ).hex()
    raise SystemExit(0 if got == expected else 1)
except Exception:
    raise SystemExit(1)
PY
}

read_lg_access_kdf() {
  local rules="${LG_RULES:-/etc/log-guardian/rules.conf}"
  [[ -f "$rules" ]] || return 1
  grep -E '^ACCESS_PASSWORD_KDF=' "$rules" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r'
}

load_lg_replay_password() {
  local kdf pw env_pw candidate
  kdf="$(read_lg_access_kdf 2>/dev/null || true)"

  if [[ -n "${LOGANALYZER_PASSWORD:-}" && -n "$kdf" ]]; then
    verify_lg_kdf_password "$kdf" "$LOGANALYZER_PASSWORD" && return 0
  fi

  if [[ -f /etc/log-guardian/env ]] && [[ -r /etc/log-guardian/env ]]; then
    env_pw=$(grep -E '^LOGANALYZER_PASSWORD=' /etc/log-guardian/env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r')
    if [[ -n "$env_pw" ]]; then
      if [[ -z "$kdf" ]] || verify_lg_kdf_password "$kdf" "$env_pw"; then
        export LOGANALYZER_PASSWORD="$env_pw"
        return 0
      fi
    fi
  fi

  for candidate in "$LG_DEMO_ACCESS_PW"; do
    if [[ -z "$kdf" ]] || verify_lg_kdf_password "$kdf" "$candidate"; then
      export LOGANALYZER_PASSWORD="$candidate"
      return 0
    fi
  done

  export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-$LG_DEMO_ACCESS_PW}"
}

# systemd ile ayni: service.password > LOGANALYZER_PASSWORD env
prepare_lg_replay_auth() {
  LG_AUTH_ARGS=()
  local pwfile="/etc/log-guardian/service.password"
  if [[ -f "$pwfile" && -r "$pwfile" ]]; then
    LG_AUTH_ARGS=(--password-file "$pwfile")
    return 0
  fi
  load_lg_replay_password
}

needs_sudo_lg_replay() {
  [[ -f /etc/log-guardian/rules.conf ]] || return 1
  grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$100000\$6560e0aa800d47957280cab9a1038847\$' \
    /etc/log-guardian/rules.conf 2>/dev/null
}

# Prod KDF varsa script'i sudo ile yeniden calistir: ensure_sudo_lg_replay "$0" "$@"
ensure_sudo_lg_replay() {
  local script="${1:?}"
  shift
  if [[ -f /etc/log-guardian/rules.conf ]] && [[ "$(id -u)" -ne 0 ]]; then
    if ! needs_sudo_lg_replay; then
      echo "[INFO] ozel ACCESS_PASSWORD_KDF — sudo ile replay"
      exec sudo -E LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-}" bash "$script" "$@"
    fi
  fi
}

# nobody/docker .o sahipligi — make clean
ensure_lg_build_tree() {
  local root="${1:-$_lg_root}"
  [[ -d "$root" ]] || return 0
  local probe
  probe=$(find "$root" -maxdepth 1 -name '*.o' -print -quit 2>/dev/null || true)
  [[ -n "$probe" ]] || return 0
  if ! touch "$probe" 2>/dev/null; then
    echo "[build] .o yazilamaz (sahiplik?) — make clean" >&2
    make -C "$root" clean
  fi
}

# VM/laptop e2e: repo binary yoksa /usr/local/bin; rules repo yoksa /etc
resolve_lg_e2e_bin() {
  local root="${1:-$_lg_root}"
  if [[ -n "${LG_BIN:-}" && -x "$LG_BIN" ]]; then
    printf '%s\n' "$LG_BIN"
    return 0
  fi
  if [[ -x "$root/log-guardian" ]]; then
    printf '%s\n' "$root/log-guardian"
    return 0
  fi
  if [[ -x /usr/local/bin/log-guardian ]]; then
    printf '%s\n' /usr/local/bin/log-guardian
    return 0
  fi
  return 1
}

resolve_lg_e2e_rules() {
  local root="${1:-$_lg_root}"
  local f
  for f in "${LG_RULES:-}" "$root/rules.conf" /etc/log-guardian/rules.conf; do
    [[ -n "$f" && -f "$f" ]] || continue
    printf '%s\n' "$f"
    return 0
  done
  return 1
}

# VM sync *.log haric tutar — tests/fixtures/*.fixture -> test_*.log kopyala
ensure_e2e_log_fixture() {
  local root="${1:?}" fixture_name="${2:?}" dest="${3:?}"
  [[ -f "$dest" ]] && return 0
  local src="$root/tests/fixtures/${fixture_name}.fixture"
  [[ -f "$src" ]] || return 1
  cp "$src" "$dest"
  echo "[fixture] $dest <- tests/fixtures/${fixture_name}.fixture"
}
