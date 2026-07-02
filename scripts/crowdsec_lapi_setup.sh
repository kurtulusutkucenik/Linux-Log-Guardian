#!/usr/bin/env bash
# CrowdSec LAPI bouncer API key -> /etc/log-guardian/crowdsec.env
#   sudo bash scripts/crowdsec_lapi_setup.sh
#   sudo bash scripts/crowdsec_lapi_setup.sh --install   # crowdsec paketi yoksa kur
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETC="${LG_ETC:-/etc/log-guardian}"
ENV_FILE="$ETC/crowdsec.env"
BOUNCER_NAME="${CROWDSEC_BOUNCER_NAME:-log-guardian}"
# Caddy prod stack HTTP_PORT=8080 ile cakisir — varsayilan 8081
DEFAULT_LAPI_PORT="${CROWDSEC_LAPI_PORT:-8081}"

fail() { echo "[crowdsec_lapi_setup] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }
info() { echo "[INFO] $*"; }

port_in_use() {
  local p="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -tln 2>/dev/null | grep -qE ":${p}([[:space:]]|$)"
  else
    netstat -tln 2>/dev/null | grep -q ":${p} "
  fi
}

configure_crowdsec_lapi_port() {
  local port="$1"
  python3 - "$port" <<'PY'
import re, sys
from pathlib import Path

port = sys.argv[1]
cfg = Path("/etc/crowdsec/config.yaml")
cred = Path("/etc/crowdsec/local_api_credentials.yaml")
if cfg.is_file():
    t = cfg.read_text(encoding="utf-8")
    t2, n = re.subn(
        r"(listen_uri:\s*)[^\n#]+",
        rf"\g<1>127.0.0.1:{port}",
        t,
        count=1,
    )
    if n:
        cfg.write_text(t2, encoding="utf-8")
if cred.is_file():
    t = cred.read_text(encoding="utf-8")
    t2, n = re.subn(
        r"(^url:\s*)http://[^\n#]+",
        rf"\g<1>http://127.0.0.1:{port}",
        t,
        count=1,
        flags=re.M,
    )
    if n:
        cred.write_text(t2, encoding="utf-8")
PY
  ok "CrowdSec LAPI -> 127.0.0.1:${port}"
}

ensure_crowdsec_service() {
  local port="$1"
  if port_in_use 8080 && ! systemctl is-active --quiet crowdsec 2>/dev/null; then
    info "8080 mesgul (genelde Caddy) — LAPI ${port}'e tasiniyor"
    configure_crowdsec_lapi_port "$port"
  elif ! grep -q "127.0.0.1:${port}" /etc/crowdsec/config.yaml 2>/dev/null; then
    if ! port_in_use "$port"; then
      configure_crowdsec_lapi_port "$port"
    fi
  fi
  systemctl enable crowdsec 2>/dev/null || true
  systemctl restart crowdsec 2>/dev/null || true
  sleep 2
  if systemctl is-active --quiet crowdsec 2>/dev/null; then
    ok "crowdsec.service aktif (LAPI :${port})"
    return 0
  fi
  journalctl -u crowdsec -n 8 --no-pager 2>/dev/null >&2 || true
  fail "crowdsec servisi baslamadi — journalctl -u crowdsec"
}

crowdsec_pkg_os_dist() {
  local pkg_os="ubuntu" pkg_dist="noble"
  if [[ -f /etc/os-release ]]; then
    # shellcheck source=/dev/null
    . /etc/os-release
    if [[ "${ID:-}" == "linuxmint" && -n "${UBUNTU_CODENAME:-}" ]]; then
      pkg_os="ubuntu"
      pkg_dist="$UBUNTU_CODENAME"
    elif [[ "${ID:-}" == "ubuntu" && -n "${VERSION_CODENAME:-}" ]]; then
      pkg_os="ubuntu"
      pkg_dist="$VERSION_CODENAME"
    elif [[ "${ID:-}" == "debian" && -n "${VERSION_CODENAME:-}" ]]; then
      pkg_os="debian"
      pkg_dist="$VERSION_CODENAME"
    fi
  fi
  echo "$pkg_os $pkg_dist"
}

install_crowdsec_package() {
  read -r pkg_os pkg_dist < <(crowdsec_pkg_os_dist)
  local cs_list="/etc/apt/sources.list.d/crowdsec_crowdsec.list"
  info "packagecloud repo: os=$pkg_os dist=$pkg_dist (Linux Mint -> Ubuntu tabani)"

  if [[ ! -f "$cs_list" ]]; then
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL https://packagecloud.io/install/repositories/crowdsec/crowdsec/script.deb.sh \
        | os="$pkg_os" dist="$pkg_dist" bash
    else
      fail "curl yok — docs/CROWDSEC_INTEGRATION.md"
    fi
  else
    ok "crowdsec apt repo zaten var ($cs_list)"
  fi

  info "yalnizca crowdsec repo guncelleniyor (tam apt update atlanir)"
  apt-get update -qq \
    -o "Dir::Etc::sourcelist=$cs_list" \
    -o Dir::Etc::sourceparts=- \
    -o APT::Get::List-Cleanup=0 \
    || fail "crowdsec repo apt update basarisiz ($cs_list)"

  if ! DEBIAN_FRONTEND=noninteractive apt-get install -y crowdsec; then
    info "cache'ten crowdsec kurulumu deneniyor..."
    DEBIAN_FRONTEND=noninteractive apt-get install -y -o APT::Get::Update=false crowdsec \
      || fail "crowdsec kurulamadi — apt-cache policy crowdsec"
  fi

  command -v cscli >/dev/null 2>&1 || fail "cscli yok — crowdsec paketi eksik"
  ok "crowdsec kuruldu ($(cscli version 2>/dev/null | head -1 || echo cscli))"
}

read_env_key() {
  grep -E '^CROWDSEC_API_KEY=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]' || true
}

read_env_lapi() {
  grep -E '^CROWDSEC_LAPI_URL=' "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]' || true
}

write_crowdsec_env() {
  local lapi="$1" key="$2"
  python3 - "$ENV_FILE" "$lapi" "$key" <<'PY'
import re, sys
from pathlib import Path

path, lapi, key = sys.argv[1], sys.argv[2], sys.argv[3]
text = Path(path).read_text(encoding="utf-8") if Path(path).exists() else ""

def upsert(name: str, val: str, body: str) -> str:
    line = f"{name}={val}"
    if re.search(rf"^{re.escape(name)}=", body, flags=re.M):
        return re.sub(rf"^{re.escape(name)}=.*$", line, body, count=1, flags=re.M)
    return body.rstrip() + "\n" + line + "\n"

text = upsert("CROWDSEC_LAPI_URL", lapi, text)
text = upsert("CROWDSEC_API_KEY", key, text)
if "CROWDSEC_MAX_DECISIONS=" not in text:
    text = text.rstrip() + "\nCROWDSEC_MAX_DECISIONS=50\n"
Path(path).write_text(text, encoding="utf-8")
PY
  chmod 600 "$ENV_FILE"
  write_crowdsec_env_cache "$lapi" "$key"
}

write_crowdsec_env_cache() {
  local lapi="$1" key="$2"
  local cache="${LG_CROWDSEC_CACHE:-$ROOT/.cache/crowdsec-bouncer.env}"
  install -d -m 755 "$(dirname "$cache")"
  {
    echo "CROWDSEC_LAPI_URL=$lapi"
    echo "CROWDSEC_API_KEY=$key"
    echo "CROWDSEC_MAX_DECISIONS=50"
  } >"$cache"
  chmod 600 "$cache"
  if [[ -n "${SUDO_UID:-}" ]]; then
    chown "${SUDO_USER:-root}:${SUDO_USER:-root}" "$cache" 2>/dev/null || true
  fi
  ok "operator cache -> $cache (e2e/sync okur)"
}

resolve_lapi_url() {
  local port="$1" key="$2"
  local primary="http://127.0.0.1:${port}"
  local legacy="http://127.0.0.1:8080"
  if [[ -n "$key" ]]; then
    if curl -sf -H "X-Api-Key: $key" "${primary%/}/v1/decisions?limit=1" >/dev/null 2>&1; then
      echo "$primary"
      return 0
    fi
    if [[ "$port" != "8080" ]] && \
      curl -sf -H "X-Api-Key: $key" "${legacy%/}/v1/decisions?limit=1" >/dev/null 2>&1; then
      echo "$legacy"
      return 0
    fi
  fi
  echo "$primary"
}

finish_setup() {
  local lapi="$1" key="$2"
  ok "CROWDSEC_API_KEY -> $ENV_FILE ($(wc -c <"$ENV_FILE") byte)"
  if curl -sf -H "X-Api-Key: $key" "${lapi%/}/v1/decisions?limit=1" >/dev/null 2>&1; then
    ok "LAPI erisilebilir ($lapi)"
  else
    echo "[WARN] LAPI henuz yanit vermiyor — systemctl status crowdsec"
  fi
  bash "$ROOT/scripts/install_crowdsec_bouncer.sh" >/dev/null 2>&1 || true
  systemctl enable --now log-guardian-crowdsec-bouncer.timer 2>/dev/null || true
  ok "timer: log-guardian-crowdsec-bouncer.timer"
  echo ""
  echo "  # Dogrulama:"
  echo "  LIVE_API=1 bash scripts/crowdsec_bouncer_e2e.sh"
  echo "  bash scripts/sync_dashboard_data.sh"
  echo ""
  echo "  NOT: Anahtar /etc/log-guardian/crowdsec.env (repodaki .env degil)."
}

[[ "$(id -u)" -eq 0 ]] || fail "sudo gerekli: sudo bash scripts/crowdsec_lapi_setup.sh"

install -d -m 755 "$ETC"
if [[ ! -f "$ENV_FILE" ]]; then
  install -m 600 "$ROOT/deploy/crowdsec.env.example" "$ENV_FILE"
  ok "ornek -> $ENV_FILE"
fi

if ! command -v cscli >/dev/null 2>&1; then
  if [[ "${1:-}" == "--install" ]]; then
    install_crowdsec_package
  else
    read -r pkg_os pkg_dist < <(crowdsec_pkg_os_dist)
    echo ""
    echo "CrowdSec kurulu degil (cscli yok)."
    echo "    sudo bash scripts/crowdsec_lapi_setup.sh --install"
    exit 1
  fi
fi

LAPI_URL="http://127.0.0.1:${DEFAULT_LAPI_PORT}"

ensure_crowdsec_service "${DEFAULT_LAPI_PORT}"

existing_key="$(read_env_key)"
LAPI_URL="$(resolve_lapi_url "${DEFAULT_LAPI_PORT}" "$existing_key")"

if [[ -n "$existing_key" ]]; then
  if curl -sf -H "X-Api-Key: $existing_key" "${LAPI_URL%/}/v1/decisions?limit=1" >/dev/null 2>&1; then
    ok "mevcut API key gecerli — yeniden uretilmedi"
    write_crowdsec_env "$LAPI_URL" "$existing_key"
    finish_setup "$LAPI_URL" "$existing_key"
    exit 0
  fi
  info "mevcut key gecersiz — yeni bouncer uretiliyor"
fi

if cscli bouncers list -o json 2>/dev/null | grep -q "\"name\":\"$BOUNCER_NAME\""; then
  info "bouncer '$BOUNCER_NAME' siliniyor (yeniden key)"
  cscli bouncers delete "$BOUNCER_NAME" 2>/dev/null || true
fi

KEY_OUT="$(cscli bouncers add "$BOUNCER_NAME" -o raw 2>&1)" || {
  echo "$KEY_OUT" >&2
  fail "cscli bouncers add basarisiz (crowdsec servisi + LAPI port kontrol)"
}
KEY="$(echo "$KEY_OUT" | grep -E '^[A-Za-z0-9+/=_-]+$' | tail -1 | tr -d '[:space:]')"
[[ -n "$KEY" ]] || fail "bos API key"

write_crowdsec_env "$LAPI_URL" "$KEY"
finish_setup "$LAPI_URL" "$KEY"
