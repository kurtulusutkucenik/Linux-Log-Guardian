#!/usr/bin/env bash
# arm64 cross dev lib (curl, ssl, sqlite, pcre2) — amd64 host / Linux Mint
#   bash scripts/install_arm64_cross_deps.sh          # kur (sudo)
#   bash scripts/install_arm64_cross_deps.sh --check  # sadece kontrol
set -euo pipefail

PORTS_LIST=/etc/apt/sources.list.d/lg-ubuntu-ports-arm64.list
BASE_PKGS=(
  libsqlite3-dev:arm64
  libssl-dev:arm64
  libpcre2-dev:arm64
  libseccomp-dev:arm64
  zlib1g-dev:arm64
  liburing-dev:arm64
)
CURL_PKG=libcurl4-openssl-dev:arm64

need_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "[install_arm64_cross_deps] sudo gerekiyor" >&2
    exit 1
  fi
}

cross_deps_ok() {
  [[ -f /usr/include/aarch64-linux-gnu/curl/curl.h ]] \
    && [[ -f /usr/include/seccomp.h ]] \
    && [[ -f /usr/include/pcre2.h ]] \
    && [[ -f /usr/lib/aarch64-linux-gnu/libseccomp.so ]] \
    && return 0
  return 1
}

ensure_cross_gcc() {
  command -v aarch64-linux-gnu-gcc >/dev/null 2>&1 \
    || apt-get install -y crossbuild-essential-arm64
}

ensure_ports_repo() {
  if [[ -f "$PORTS_LIST" ]]; then
    return 0
  fi
  need_root
  cat >"$PORTS_LIST" <<'EOF'
# Log Guardian — arm64 cross dev (amd64 host; archive.ubuntu arm64 404 verir)
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble main restricted universe multiverse
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble-updates main restricted universe multiverse
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble-security main restricted universe multiverse
EOF
  echo "[install_arm64_cross_deps] $PORTS_LIST eklendi (ports.ubuntu.com)"
}

ports_apt() {
  local tmp
  tmp="$(mktemp)"
  cat >"$tmp" <<'EOF'
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble main restricted universe multiverse
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble-updates main restricted universe multiverse
deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports noble-security main restricted universe multiverse
EOF
  apt-get "$@" \
    -o Dir::Etc::sourcelist="$tmp" \
    -o Dir::Etc::sourceparts=- \
    -o APT::Get::List-Cleanup=0
  rm -f "$tmp"
}

repair_dpkg() {
  dpkg --configure -a || true
}

if [[ "${1:-}" == "--check" ]]; then
  if cross_deps_ok; then
    echo "[OK] arm64 cross dev headers mevcut"
    exit 0
  fi
  echo "[MISS] arm64 cross dev lib eksik (curl/seccomp/pcre2 header)" >&2
  echo "  sudo bash scripts/install_arm64_cross_deps.sh" >&2
  exit 1
fi

need_root
ensure_cross_gcc
dpkg --add-architecture arm64 2>/dev/null || true
ensure_ports_repo
repair_dpkg
echo "[install_arm64_cross_deps] ports.ubuntu uzerinden arm64 dev paketleri kuruluyor..."
ports_apt update
ports_apt install -y --no-install-recommends "${BASE_PKGS[@]}"
# Multiarch: amd64 libcurl4-openssl-dev /usr/bin/curl-config ile cakisir — force-overwrite
echo "[install_arm64_cross_deps] libcurl4-openssl-dev:arm64 (curl-config force-overwrite)..."
ports_apt install -y --no-install-recommends \
  -o Dpkg::Options::="--force-overwrite" \
  "$CURL_PKG"
repair_dpkg
if cross_deps_ok; then
  echo "[OK] arm64 cross deps kuruldu"
else
  echo "[FAIL] kurulum sonrasi header eksik — dpkg --audit kontrol edin" >&2
  dpkg --audit >&2 || true
  exit 1
fi
