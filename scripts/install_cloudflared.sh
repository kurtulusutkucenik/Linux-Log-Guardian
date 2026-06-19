#!/usr/bin/env bash
# cloudflared — Linux Mint / Ubuntu (apt paketi yoksa GitHub binary)
#   bash scripts/install_cloudflared.sh
#   sudo bash scripts/install_cloudflared.sh   # /usr/local/bin
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCAL_BIN="$ROOT/.cache/bin"
DEST="${CLOUDFLARED_DEST:-}"

pick_dest() {
  if [[ -n "$DEST" ]]; then
    echo "$DEST"
    return
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "/usr/local/bin/cloudflared"
  else
    echo "$LOCAL_BIN/cloudflared"
  fi
}

install_via_apt_repo() {
  command -v curl >/dev/null || return 1
  command -v apt-get >/dev/null || return 1
  [[ "$(id -u)" -eq 0 ]] || return 1

  echo "[install_cloudflared] Cloudflare apt repo..."
  mkdir -p --mode=0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
    > /etc/apt/sources.list.d/cloudflared.list
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y cloudflared
  command -v cloudflared
}

install_via_github() {
  local arch dest url tmp
  arch=$(uname -m)
  case "$arch" in
    x86_64) arch=amd64 ;;
    aarch64|arm64) arch=arm64 ;;
    *) echo "[install_cloudflared] FAIL: desteklenmeyen arch: $arch" >&2; return 1 ;;
  esac
  dest=$(pick_dest)
  mkdir -p "$(dirname "$dest")"
  url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${arch}"
  tmp=$(mktemp)
  echo "[install_cloudflared] GitHub binary → $dest"
  curl -fsSL "$url" -o "$tmp"
  chmod +x "$tmp"
  if [[ "$(id -u)" -eq 0 ]]; then
    install -m 755 "$tmp" "$dest"
  else
    mv "$tmp" "$dest"
  fi
  echo "$dest"
}

if command -v cloudflared >/dev/null 2>&1; then
  echo "[OK] cloudflared zaten var: $(command -v cloudflared)"
  cloudflared --version 2>/dev/null | head -1 || true
  exit 0
fi

if [[ -x "$LOCAL_BIN/cloudflared" ]]; then
  echo "[OK] cloudflared: $LOCAL_BIN/cloudflared"
  "$LOCAL_BIN/cloudflared" --version 2>/dev/null | head -1 || true
  exit 0
fi

if [[ "$(id -u)" -eq 0 ]]; then
  if path=$(install_via_apt_repo); then
    :
  else
    echo "[install_cloudflared] apt repo basarisiz — GitHub binary deneniyor..." >&2
    path=$(install_via_github) || exit 1
  fi
else
  path=$(install_via_github) || {
    echo "[install_cloudflared] FAIL: indirilemedi" >&2
    echo "  Alternatif: sudo bash scripts/install_cloudflared.sh" >&2
    exit 1
  }
fi

echo "[OK] cloudflared kuruldu: $path"
"$path" --version 2>/dev/null | head -1 || true
if [[ "$path" == "$LOCAL_BIN/cloudflared" ]]; then
  echo "  PATH: export PATH=\"$LOCAL_BIN:\$PATH\"  (veya script otomatik bulur)"
fi
