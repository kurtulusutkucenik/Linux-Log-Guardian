#!/usr/bin/env bash
# Adim adim kurulum — hangi adimda oldugunuzu gorun
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STEP="${1:-help}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*" >&2; exit 1; }

case "$STEP" in
  1-deps)
    echo -e "${BOLD}=== Adim 1: Bagimliliklar ===${NC}"
    if [[ $EUID -ne 0 ]]; then fail "sudo gerekli: sudo bash scripts/install_steps.sh 1-deps"; fi
    apt-get update -qq
    apt-get install -y \
      clang llvm libbpf-dev libpcre2-dev libsqlite3-dev \
      libcurl4-openssl-dev libssl-dev liburing-dev libseccomp-dev \
      libelf-dev zlib1g-dev \
      iproute2 ipset iptables nftables build-essential pkg-config
    kver=$(uname -r)
    if [[ ! -d "/lib/modules/${kver}/build" ]]; then
      apt-get install -y "linux-headers-${kver}" || apt-get install -y linux-headers-generic || warn "headers eksik"
    else ok "kernel headers: /lib/modules/${kver}/build"; fi
    if command -v bpftool >/dev/null; then ok "bpftool: $(command -v bpftool)"
    elif apt-get install -y "linux-tools-${kver}" 2>/dev/null || apt-get install -y linux-tools-common; then ok "bpftool kuruldu"
    else warn "bpftool yok (opsiyonel)"; fi
    ok "Adim 1 tamam"
    ;;
  2-build)
    echo -e "${BOLD}=== Adim 2: Derleme ===${NC}"
    export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
    make -j"$(nproc 2>/dev/null || echo 2)" \
      log-guardian log-guardian-daemon \
      xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o
    test -x ./log-guardian && test -x ./log-guardian-daemon || fail "binary yok"
    test -f ./xdp_filter.o || fail "xdp_filter.o yok (XDP icin gerekli)"
    ok "Adim 2 tamam: ./log-guardian ./log-guardian-daemon xdp_filter.o"
    ;;
  3-install)
    echo -e "${BOLD}=== Adim 3: Kurulum (systemd) ===${NC}"
    if [[ $EUID -ne 0 ]]; then fail "sudo gerekli"; fi
    test -x "$ROOT/log-guardian" || fail "Once adim 2: bash scripts/install_steps.sh 2-build"
    cd "$ROOT"
    bash "$ROOT/install.sh" --install-only
    if command -v nginx >/dev/null 2>&1; then
      if STRICT_EXIT=1 bash "$ROOT/scripts/enforce_nginx_log_format.sh"; then
        ok "nginx log_guardian format (STRICT)"
      else
        fail "log_guardian format kurulamadi — docs/QUICKSTART_NGINX.md bolum 2"
      fi
      systemctl restart log-guardian 2>/dev/null || true
      sleep 2
      if STRICT_EXIT=1 bash "$ROOT/scripts/enforce_nginx_inline_consult.sh"; then
        ok "nginx inline consult (STRICT)"
      else
        fail "inline consult kurulamadi — sudo bash scripts/fix_nginx_inline_consult.sh"
      fi
    fi
    ok "Adim 3 tamam"
    ;;
  4-health)
    echo -e "${BOLD}=== Adim 4: Saglik kontrolu ===${NC}"
    export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
    LG_BIN="/usr/local/bin/log-guardian"
    LG_LIB="/usr/local/lib/log-guardian"
    [[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
    if ! systemctl is-active log-guardian-daemon >/dev/null 2>&1; then
      warn "log-guardian-daemon kapali — calistirin: sudo systemctl start log-guardian-daemon"
    fi
    if ! systemctl is-active log-guardian >/dev/null 2>&1; then
      warn "log-guardian kapali — calistirin: sudo systemctl restart log-guardian"
    fi
    HEALTH_OUT=""
    if [[ -f /etc/log-guardian/env ]]; then
      HEALTH_OUT=$(sudo bash -c "
set -a
source /etc/log-guardian/env
set +a
export LOGANALYZER_PASSWORD='${LOGANALYZER_PASSWORD}'
export LD_LIBRARY_PATH='${LG_LIB}:\${LD_LIBRARY_PATH:-}'
'${LG_BIN}' --health --rules /etc/log-guardian/rules.conf 2>&1
" ) || true
    else
      export LD_LIBRARY_PATH="${LG_LIB}:${LD_LIBRARY_PATH:-}"
      HEALTH_OUT=$("$LG_BIN" --health --rules /etc/log-guardian/rules.conf 2>&1) || true
    fi
    echo "$HEALTH_OUT"
    if echo "$HEALTH_OUT" | grep -qE '/metrics:[0-9]+ OK'; then
      if echo "$HEALTH_OUT" | grep -q 'daemon IPC: FAIL'; then
        warn "IPC FAIL (opsiyonel) — tam duzeltme: sudo bash scripts/fix_analyzer.sh"
      fi
      systemctl is-active log-guardian-daemon log-guardian 2>/dev/null || warn "systemd servisleri inactive"
      ok "Adim 4 tamam (analyzer + metrics ayakta)"
    else
      fail "--health basarisiz — sudo journalctl -u log-guardian -n 20"
    fi
    ;;
  5-dashboard)
    echo -e "${BOLD}=== Adim 5: TLS Dashboard ===${NC}"
    export DOMAIN="${DOMAIN:-localhost}"
    export HTTP_PORT="${HTTP_PORT:-8080}"
    export HTTPS_PORT="${HTTPS_PORT:-8443}"
    bash "$ROOT/scripts/laptop_jwt_setup.sh"
    bash "$ROOT/scripts/tls_proxy_test.sh"
    ok "Adim 5 tamam: https://${DOMAIN}:${HTTPS_PORT}"
    ;;
  6-soak)
    echo -e "${BOLD}=== Adim 6: Kisa soak (5 dk) ===${NC}"
    SOAK_SHORT=1 bash "$ROOT/scripts/soak_test.sh"
    ok "Adim 6 tamam"
    ;;
  7-grafana)
    echo -e "${BOLD}=== Adim 7: Grafana + Prometheus ===${NC}"
    bash "$ROOT/scripts/grafana_stack.sh"
    bash "$ROOT/scripts/grafana_smoke_test.sh"
    ok "Adim 7 tamam: http://127.0.0.1:${GRAFANA_PORT:-3002}"
    ;;
  help|*)
    cat <<'EOF'
Log Guardian — adim adim kurulum (Mint/Ubuntu/Debian)

  sudo bash scripts/install_steps.sh 1-deps     # bagimliliklar
  bash scripts/install_steps.sh 2-build         # make (sudo gerekmez)
  sudo bash scripts/install_steps.sh 3-install  # binary + rules.conf + systemd
  bash scripts/install_steps.sh 4-health        # --health kontrol
  bash scripts/install_steps.sh 5-dashboard     # TLS dashboard (Docker)
  bash scripts/install_steps.sh 6-soak          # kisa soak (daemon ayaktayken)
  bash scripts/install_steps.sh 7-grafana       # Grafana + Prometheus (Docker)

  bash scripts/dashboard_stack.sh                 # laptop: grafana + JWT + TLS dashboard
  bash scripts/dev_stack.sh --all                 # alternatif: health + dashboard + grafana
  sudo bash scripts/sync_local_install.sh       # repo binary → /usr/local

Tek komut (hepsi):  sudo bash install.sh
Sadece kontrol:     sudo bash install.sh --dry-run

Detay: docs/INSTALL_STEP_BY_STEP.md
EOF
    ;;
esac
