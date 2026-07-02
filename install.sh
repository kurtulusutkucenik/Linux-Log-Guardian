#!/usr/bin/env bash
# install.sh — Linux Log Guardian Otomatik Kurulum Scripti
#
# Kullanim:
#   sudo bash install.sh              # Normal kurulum
#   sudo bash install.sh --dry-run    # Sadece kontrol, kurulum yok
#   sudo bash install.sh --no-xdp    # XDP olmadan kur (container/eski kernel)
#   sudo bash install.sh --uninstall  # Kaldir
#   sudo bash install.sh --update     # Guncelle (git pull + yeniden derle)
#   NGINX_ENFORCE_STRICT=1 sudo bash install.sh  # log_guardian yoksa kurulum FAIL
#   NGINX_ENFORCE_LOG_FORMAT=0 sudo bash install.sh  # nginx format otomatik fix atla
#
# GitHub'dan tek satirla:
#   curl -fsSL https://raw.githubusercontent.com/kurtulusutkucenik/loganalyzer/main/install.sh | sudo bash
#
set -euo pipefail

REPO_URL="https://github.com/kurtulusutkucenik/loganalyzer"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFIX="${PREFIX:-/usr/local}"
CONF_DIR="/etc/log-guardian"
UNIT_DIR="/etc/systemd/system"
LOG_ANALYZER_USER="nobody"
LOG_ANALYZER_GROUP="nogroup"

DRY_RUN=0
NO_XDP=0
DO_UNINSTALL=0
DO_UPDATE=0
INSTALL_ONLY=0

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERR ]${NC}  $*" >&2; exit 1; }
step()  { echo -e "\n${BOLD}▶ $*${NC}"; }

# ── Argüman İşleme ───────────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --dry-run)    DRY_RUN=1;      warn "Dry-run: sistem degistirilmeyecek." ;;
        --no-xdp)     NO_XDP=1;       warn "XDP devre disi: iptables/nftables modu." ;;
        --install-only) INSTALL_ONLY=1; warn "Sadece kurulum (deps/build atlanir)." ;;
        --uninstall)  DO_UNINSTALL=1 ;;
        --update)     DO_UPDATE=1 ;;
        --help|-h)
            echo "Kullanim: $0 [--dry-run] [--no-xdp] [--uninstall] [--update] [--help]"
            echo "  GitHub: $REPO_URL"
            exit 0 ;;
    esac
done

# Root kontrolü
if [[ $EUID -ne 0 ]] && [[ $DRY_RUN -eq 0 ]]; then
    error "Bu script root (sudo) ile calistirilmalidir."
fi

# ── OS Tespiti ───────────────────────────────────────────────────────
detect_os() {
    if   [[ -f /etc/debian_version ]]; then echo "debian"
    elif [[ -f /etc/arch-release ]];   then echo "arch"
    elif [[ -f /etc/fedora-release ]]; then echo "fedora"
    elif [[ -f /etc/redhat-release ]]; then echo "rhel"
    else echo "unknown"
    fi
}
OS=$(detect_os)
info "İşletim sistemi: $OS | Kernel: $(uname -r)"

# ── Ağ Arayüzü Otomatik Tespiti ──────────────────────────────────────
detect_iface() {
    local iface
    iface=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' | head -1)
    if [[ -z "$iface" ]]; then
        iface=$(ip link show | grep -E '^[0-9]+: (eth|ens|enp|eno)' | head -1 | awk '{print $2}' | tr -d ':')
    fi
    echo "${iface:-eth0}"
}
IFACE=$(detect_iface)
info "Tespit edilen ağ arayüzü: ${CYAN}${IFACE}${NC}"

# ── Nginx access log otomatik tespiti ─────────────────────────────────
detect_nginx_log() {
    local found=""
    if command -v nginx &>/dev/null; then
        found=$(nginx -T 2>/dev/null | grep -oP 'access_log \K[^\s;]+' \
            | grep -vE '^(off|syslog|buffer=)' | head -1 || true)
        if [[ -n "$found" && "$found" != "off" && -e "$found" ]]; then
            echo "$found"
            return
        fi
    fi
    for c in /var/log/nginx/access.log /var/log/nginx/access_log; do
        if [[ -e "$c" ]]; then
            echo "$c"
            return
        fi
    done
    echo "/var/log/nginx/access.log"
}
NGINX_LOG=$(detect_nginx_log)
info "Nginx access log: ${CYAN}${NGINX_LOG}${NC}"

# ── BTF / Kernel Uyumluluk Kontrolü (3 Katmanlı) ────────────────────
detect_xdp_mode() {
    local kver_major kver_minor
    kver_major=$(uname -r | cut -d. -f1)
    kver_minor=$(uname -r | cut -d. -f2)

    if [[ -f /sys/kernel/btf/vmlinux ]]; then
        echo "native"       # Kat 1: CO-RE native
    elif [[ $kver_major -ge 5 ]] && [[ $kver_minor -ge 2 ]]; then
        echo "legacy"       # Kat 2: kernel >= 5.2, legacy headers
    else
        echo "iptables"     # Kat 3: XDP yok, iptables/nftables fallback
    fi
}
XDP_MODE=$(detect_xdp_mode)
[[ $NO_XDP -eq 1 ]] && XDP_MODE="iptables"

case "$XDP_MODE" in
    native)   ok   "BTF mevcut → CO-RE native XDP aktif" ;;
    legacy)   warn "BTF yok, kernel ≥5.2 → legacy header XDP" ;;
    iptables) warn "XDP desteklenmiyor → iptables/nftables modu" ;;
esac

# ── Kaldırma ─────────────────────────────────────────────────────────
if [[ $DO_UNINSTALL -eq 1 ]]; then
    step "Linux Log Guardian Kaldırılıyor"
    systemctl stop  log-guardian log-guardian-daemon 2>/dev/null || true
    systemctl disable log-guardian log-guardian-daemon log-guardian-threatintel.timer 2>/dev/null || true
    rm -f "$UNIT_DIR/log-guardian.service" \
          "$UNIT_DIR/log-guardian-daemon.service" \
          "$UNIT_DIR/log-guardian-threatintel.service" \
          "$UNIT_DIR/log-guardian-threatintel.timer"
    rm -f "$PREFIX/bin/log-guardian" \
          "$PREFIX/bin/log-guardian-daemon" \
          "$PREFIX/bin/log-guardian-threatintel"
    systemctl daemon-reload 2>/dev/null || true
    ok "Linux Log Guardian kaldirildi. Config ($CONF_DIR) korundu."
    exit 0
fi

# ── Güncelleme ────────────────────────────────────────────────────────
if [[ $DO_UPDATE -eq 1 ]]; then
    step "Linux Log Guardian Güncelleniyor"
    if [[ -d "$REPO_DIR/.git" ]]; then
        git -C "$REPO_DIR" pull --ff-only
        ok "Kaynak kod güncellendi."
    else
        warn "git deposu bulunamadi. Manuel olarak dosyalari guncelleyin."
    fi
    # Yeniden derle ve kur (bu scriptin geri kalanı çalışır)
fi

# ── Bağımlılık Kurulumu ───────────────────────────────────────────────
install_bpftool_debian() {
    if command -v bpftool >/dev/null 2>&1; then
        ok "bpftool: mevcut ($(command -v bpftool))"
        return 0
    fi
    # Ubuntu/Debian/Mint: 'bpftool' sanal paket — linux-tools-common kur
    local kver
    kver="$(uname -r)"
    if apt-get install -y "linux-tools-${kver}" 2>/dev/null; then
        ok "bpftool: linux-tools-${kver}"
        return 0
    fi
    if apt-get install -y linux-tools-common 2>/dev/null; then
        ok "bpftool: linux-tools-common"
        return 0
    fi
    warn "bpftool kurulamadi (opsiyonel — derleme libbpf-dev ile devam eder)"
    return 0
}

install_kernel_headers_debian() {
    local kver pkg
    kver="$(uname -r)"
    pkg="linux-headers-${kver}"
    if [[ -d "/lib/modules/${kver}/build" ]]; then
        ok "kernel headers: /lib/modules/${kver}/build mevcut"
        return 0
    fi
    if apt-get install -y "$pkg" 2>/dev/null; then
        ok "kernel headers: $pkg"
        return 0
    fi
    if apt-get install -y linux-headers-generic 2>/dev/null; then
        warn "kernel headers: linux-headers-generic (tam surum eslesmeyebilir)"
        return 0
    fi
    warn "kernel headers yok — BTF modu disinda derleme devam edebilir"
    return 0
}

install_deps() {
    step "Bağımlılıklar Kuruluyor"
    case "$OS" in
        debian)
            apt-get update -qq
            apt-get install -y \
                clang llvm libbpf-dev libpcre2-dev libsqlite3-dev \
                libcurl4-openssl-dev libssl-dev liburing-dev libseccomp-dev \
                libelf-dev zlib1g-dev \
                iproute2 ipset iptables nftables \
                build-essential pkg-config
            install_kernel_headers_debian
            install_bpftool_debian ;;
        arch)
            pacman -Sy --noconfirm \
                clang llvm libbpf pcre2 sqlite curl openssl liburing \
                iproute2 ipset iptables nftables linux-headers bpf ;;
        fedora)
            dnf install -y \
                clang llvm libbpf-devel pcre2-devel sqlite-devel \
                libcurl-devel openssl-devel liburing-devel \
                iproute ipset iptables nftables kernel-devel bpftool ;;
        rhel)
            yum install -y epel-release
            yum install -y \
                clang llvm libbpf-devel pcre2-devel sqlite-devel \
                libcurl-devel openssl-devel liburing-devel bpftool ;;
        *)
            warn "Bilinmeyen OS. Bagimlilikler: clang libbpf libpcre2 libsqlite3 libcurl libssl liburing bpftool" ;;
    esac
    ok "Bağımlılıklar hazır."
}

# ── rules.conf Oluştur ────────────────────────────────────────────────
create_rules_conf() {
    local dest="$CONF_DIR/rules.conf"
    if [[ -f "$dest" ]]; then
        warn "Mevcut rules.conf korunuyor: $dest"
        return
    fi
    info "rules.conf kopyalanıyor: $dest"
    cp "$REPO_DIR/rules.conf" "$dest"
    mkdir -p "$CONF_DIR/examples" "$CONF_DIR/plugins"
    if [[ -d "$REPO_DIR/examples" ]]; then
        cp -a "$REPO_DIR/examples/." "$CONF_DIR/examples/"
        ok "OpenAPI ornekleri: $CONF_DIR/examples/"
    fi
    if [[ -d "$REPO_DIR/examples/plugins" ]]; then
        cp -a "$REPO_DIR/examples/plugins/"* "$CONF_DIR/plugins/" 2>/dev/null || true
        ok "Wasm plugin stub: $CONF_DIR/plugins/"
    fi
    if python3 "$REPO_DIR/scripts/generate_crs_bundle.py" 2>/dev/null; then
        cp "$REPO_DIR/rules/crs-bundle.rules" "$CONF_DIR/crs-bundle.rules" 2>/dev/null || true
        sed -i "s|^CRS_RULES=.*|CRS_RULES=$CONF_DIR/crs-bundle.rules|" "$dest" 2>/dev/null || true
    fi
    # Ağ arayüzü ve log yolu otomatik güncelle
    sed -i "s/^IFACE=.*/IFACE=$IFACE/" "$dest"
    sed -i "s|^LOG_PATH=.*|LOG_PATH=$NGINX_LOG|" "$dest" 2>/dev/null || true
    sed -i "s|^DB_PATH=.*|DB_PATH=$CONF_DIR/events.db|" "$dest" 2>/dev/null || true
    sed -i "s|^INTEL_BAN_DB_TTL_DAYS=.*|INTEL_BAN_DB_TTL_DAYS=7|" "$dest" 2>/dev/null || \
        echo "INTEL_BAN_DB_TTL_DAYS=7" >> "$dest"
    sed -i "s|^OPENAPI_SCHEMA=.*|OPENAPI_SCHEMA=$CONF_DIR/examples/openapi-mini.json|" "$dest" 2>/dev/null || true
    chmod 600 "$dest"
    ok "rules.conf oluşturuldu (IFACE=${IFACE})."
    fix_conf_permissions
}

patch_rules_conf_prod_keys() {
    local dest="$CONF_DIR/rules.conf"
    [[ -f "$dest" ]] || return 0
    if grep -q '^DB_PATH=' "$dest" 2>/dev/null; then
        sed -i "s|^DB_PATH=.*|DB_PATH=$CONF_DIR/events.db|" "$dest" 2>/dev/null || true
    else
        echo "DB_PATH=$CONF_DIR/events.db" >> "$dest"
    fi
    if grep -q '^INTEL_BAN_DB_TTL_DAYS=' "$dest" 2>/dev/null; then
        sed -i 's|^INTEL_BAN_DB_TTL_DAYS=.*|INTEL_BAN_DB_TTL_DAYS=7|' "$dest" 2>/dev/null || true
    else
        echo 'INTEL_BAN_DB_TTL_DAYS=7' >> "$dest"
    fi
    if ! grep -q '^IFACE=' "$dest" 2>/dev/null; then
        echo "IFACE=$IFACE" >> "$dest"
    else
        sed -i "s/^IFACE=.*/IFACE=$IFACE/" "$dest" 2>/dev/null || true
    fi
    if grep -q '^API_PORT=' "$dest" 2>/dev/null; then
        sed -i 's/^API_PORT=.*/API_PORT=8090/' "$dest" 2>/dev/null || true
    else
        echo 'API_PORT=8090' >> "$dest"
    fi
    if grep -q '^THREAT_INTEL_PROD=' "$dest" 2>/dev/null; then
        sed -i 's/^THREAT_INTEL_PROD=.*/THREAT_INTEL_PROD=1/' "$dest" 2>/dev/null || true
    else
        echo 'THREAT_INTEL_PROD=1' >> "$dest"
    fi
    if grep -q '^API_BIND=' "$dest" 2>/dev/null; then
        sed -i 's/^API_BIND=.*/API_BIND=127.0.0.1/' "$dest" 2>/dev/null || true
    else
        echo 'API_BIND=127.0.0.1' >> "$dest"
    fi
    if ! grep -qE '^API_TOKEN=.+' "$dest" 2>/dev/null; then
        if command -v openssl >/dev/null 2>&1; then
            echo "API_TOKEN=$(openssl rand -hex 32)" >> "$dest"
        fi
    fi
    if grep -q '^FP_LEARN=' "$dest" 2>/dev/null; then
        sed -i 's/^FP_LEARN=.*/FP_LEARN=1/' "$dest" 2>/dev/null || true
    else
        echo 'FP_LEARN=1' >> "$dest"
    fi
    if grep -q '^FP_TRUST_DAYS=' "$dest" 2>/dev/null; then
        sed -i 's/^FP_TRUST_DAYS=.*/FP_TRUST_DAYS=30/' "$dest" 2>/dev/null || true
    else
        echo 'FP_TRUST_DAYS=30' >> "$dest"
    fi
    fix_conf_permissions
    ok "rules.conf prod anahtarlari guncellendi (DB_PATH, TTL, IFACE, API_PORT, API_BIND, API_TOKEN, FP_LEARN, FP_TRUST_DAYS, THREAT_INTEL_PROD)."
}

install_nginx_snippets() {
    command -v nginx >/dev/null 2>&1 || { warn "nginx yok — snippet atlandi."; return 0; }
    install -d /etc/nginx/snippets
    install -m 644 "$REPO_DIR/examples/nginx/snippets/log-guardian.conf" /etc/nginx/snippets/
    install -m 644 "$REPO_DIR/examples/nginx/snippets/log-guardian-server.conf" /etc/nginx/snippets/
    if [[ -f "$REPO_DIR/examples/nginx/snippets/log-guardian-inline-consult.conf" ]]; then
        install -m 644 "$REPO_DIR/examples/nginx/snippets/log-guardian-inline-consult.conf" /etc/nginx/snippets/
        local api_tok
        api_tok=$(grep -E '^API_TOKEN=' "$CONF_DIR/rules.conf" 2>/dev/null | tail -1 | cut -d= -f2- || true)
        if [[ -n "$api_tok" ]]; then
            sed -i "s|__LG_API_TOKEN__|${api_tok}|g" /etc/nginx/snippets/log-guardian-inline-consult.conf 2>/dev/null || true
        fi
    fi
    if [[ -f "$REPO_DIR/examples/nginx/snippets/log-guardian-inline-server.conf" ]]; then
        install -m 644 "$REPO_DIR/examples/nginx/snippets/log-guardian-inline-server.conf" /etc/nginx/snippets/
    fi
    if [[ -f "$REPO_DIR/examples/nginx/snippets/log-guardian-tls-443.conf" ]]; then
        install -m 644 "$REPO_DIR/examples/nginx/snippets/log-guardian-tls-443.conf" /etc/nginx/snippets/
    fi
    ok "nginx snippets: /etc/nginx/snippets/log-guardian*.conf"
    if [[ -d /etc/nginx/conf.d ]] && [[ ! -f /etc/nginx/conf.d/log-guardian-cloudflare.conf ]]; then
        install -m 644 "$REPO_DIR/deploy/cloudflare-origin.conf" /etc/nginx/conf.d/log-guardian-cloudflare.conf
        ok "Cloudflare real_ip sablonu: /etc/nginx/conf.d/log-guardian-cloudflare.conf"
    fi
    if nginx -t 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || true
        ok "nginx -t OK, reload"
    else
        warn "nginx -t FAIL — site config'inize snippet include edin (docs/EDGE_PROTECTION.md)"
    fi
}

migrate_threat_intel_db() {
    local db="$CONF_DIR/events.db"
    [[ -f "$db" ]] || return 0
    command -v sqlite3 >/dev/null 2>&1 || return 0
    local legacy
    legacy=$(sqlite3 "$db" \
        "DELETE FROM ban_events WHERE reason='threat-intel' AND ip != 'system'; SELECT changes();" \
        2>/dev/null || echo 0)
    if [[ "${legacy:-0}" -gt 0 ]]; then
        ok "Legacy threat-intel DB temizlendi: $legacy satir"
    fi
}

install_helper_scripts() {
    local s dest
    for s in soak_start.sh soak_status.sh webhook_test_cli.sh webhook_dev.sh metrics_demo.sh stop_traffic.sh; do
        [[ -f "$REPO_DIR/scripts/$s" ]] || continue
        dest="log-guardian-${s%.sh}"
        install -m 755 "$REPO_DIR/scripts/$s" "$PREFIX/bin/$dest"
    done
    ok "Yardimci scriptler: log-guardian-{soak_start,soak_status,webhook_test_cli,webhook_dev,metrics_demo}"
}

# ── iptables Fallback Kurulumu ────────────────────────────────────────
setup_iptables_fallback() {
    if ! command -v iptables &>/dev/null; then return; fi
    info "iptables kuralları hazırlanıyor (XDP fallback)..."
    # Temel rate-limiting — 60sn içinde 300'den fazla bağlantı → DROP
    iptables -I INPUT -p tcp --dport 80  -m connlimit --connlimit-above 300 \
             --connlimit-mask 32 -j DROP 2>/dev/null || true
    iptables -I INPUT -p tcp --dport 443 -m connlimit --connlimit-above 300 \
             --connlimit-mask 32 -j DROP 2>/dev/null || true
    ok "iptables rate-limit kuralları eklendi."
}

install_wasmtime_libs() {
    local libdir="$PREFIX/lib/log-guardian"
    local vendor="$REPO_DIR/vendor/wasmtime/lib"
    if [[ -f "$vendor/libwasmtime.so" ]]; then
        install -d "$libdir"
        install -m 755 "$vendor/libwasmtime.so" "$libdir/"
        ok "Wasmtime kutuphanesi: $libdir"
    fi
}

install_ebpf_objects() {
    local f
    for f in xdp_filter.o tls_uprobe.o syscall_uprobe.o lineage_probe.o http_l7_probe.o; do
        if [[ -f "$REPO_DIR/$f" ]]; then
            install -m 755 "$REPO_DIR/$f" "$CONF_DIR/"
        fi
    done
    ok "eBPF nesneleri: $CONF_DIR/*.o"
}

ensure_rules_access_kdf() {
    local dest="$CONF_DIR/rules.conf"
    [[ -f "$dest" ]] || return 0
    if grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$[0-9]+\$[0-9a-fA-F]+\$[0-9a-fA-F]{64}' "$dest" 2>/dev/null; then
        ok "ACCESS_PASSWORD_KDF gecerli ($dest)"
        return 0
    fi
    local kdf
    kdf=$(grep '^ACCESS_PASSWORD_KDF=' "$REPO_DIR/rules.conf" 2>/dev/null | head -1)
    if [[ -z "$kdf" ]]; then
        warn "ACCESS_PASSWORD_KDF bulunamadi — repo rules.conf kontrol edin"
        return 0
    fi
    sed -i '/^ACCESS_PASSWORD_KDF=/d' "$dest" 2>/dev/null || true
    sed -i '/^ACCESS_PASSWORD_HASH=/d' "$dest" 2>/dev/null || true
    printf '\n%s\n' "$kdf" >> "$dest"
    chmod 600 "$dest"
    ok "ACCESS_PASSWORD_KDF eklendi ($dest) — varsayilan parola: DegistirBeni!123"
    fix_conf_permissions
}

ensure_env_password() {
    local envfile="$CONF_DIR/env"
    [[ -f "$envfile" ]] || return 0
    if grep -q '^LOGANALYZER_PASSWORD=' "$envfile" 2>/dev/null; then
        return 0
    fi
    printf 'LOGANALYZER_PASSWORD=DegistirBeni!123\n' >> "$envfile"
    chmod 600 "$envfile"
    ok "LOGANALYZER_PASSWORD eklendi ($envfile)"
}

ensure_nginx_log() {
    local logdir
    logdir=$(dirname "$NGINX_LOG")
    mkdir -p "$logdir"
    if [[ ! -f "$NGINX_LOG" ]]; then
        install -m 644 /dev/null "$NGINX_LOG" 2>/dev/null || touch "$NGINX_LOG"
        chmod 644 "$NGINX_LOG"
    fi
    chgrp adm "$NGINX_LOG" 2>/dev/null || true
}

install_nginx_log_guardian_snippet() {
    [[ "${NGINX_AUTO_LOG_FORMAT:-0}" == "1" ]] || return 0
    command -v nginx >/dev/null 2>&1 || return 0
    local snippet_src="$REPO_DIR/examples/nginx/snippets/log-guardian.conf"
    local snippet_dst="/etc/nginx/snippets/log-guardian.conf"
    [[ -f "$snippet_src" ]] || return 0
    if [[ "$(id -u)" -eq 0 ]] || [[ -w /etc/nginx/snippets ]]; then
        install -d /etc/nginx/snippets
        if [[ ! -f "$snippet_dst" ]]; then
            install -m 644 "$snippet_src" "$snippet_dst"
            ok "nginx snippet kuruldu: $snippet_dst"
            warn "http {} icine ekleyin: include /etc/nginx/snippets/log-guardian.conf;"
            warn "site access_log: access_log $NGINX_LOG log_guardian;"
        fi
    fi
}

enforce_nginx_log_guardian_format() {
    bash "$REPO_DIR/scripts/enforce_nginx_log_format.sh"
}

enforce_nginx_inline_consult() {
    bash "$REPO_DIR/scripts/enforce_nginx_inline_consult.sh"
}

install_legal_notices() {
    install -d "$PREFIX/share/doc/log-guardian"
    install -m 644 "$REPO_DIR/NOTICE" "$PREFIX/share/doc/log-guardian/"
    [[ -f "$REPO_DIR/LICENSE" ]] && install -m 644 "$REPO_DIR/LICENSE" "$PREFIX/share/doc/log-guardian/"
    ok "Lisans dosyalari: $PREFIX/share/doc/log-guardian/ (NOTICE, LICENSE)"
}

fix_conf_permissions() {
    getent group log-guardian >/dev/null 2>&1 || return 0
    chown root:log-guardian "$CONF_DIR" 2>/dev/null || true
    chmod 2770 "$CONF_DIR"
    if [[ -f "$CONF_DIR/rules.conf" ]]; then
        chown root:log-guardian "$CONF_DIR/rules.conf"
        chmod 640 "$CONF_DIR/rules.conf"
    fi
    if [[ -d "$CONF_DIR/rules" ]]; then
        chown -R root:log-guardian "$CONF_DIR/rules"
        chmod 755 "$CONF_DIR/rules"
    fi
    mkdir -p "$CONF_DIR/plugins"
    chown -R root:log-guardian "$CONF_DIR/plugins"
    chmod 750 "$CONF_DIR/plugins"
    touch "$CONF_DIR/events.db" 2>/dev/null || true
    chown root:log-guardian "$CONF_DIR/events.db" 2>/dev/null || true
    chmod 660 "$CONF_DIR/events.db" 2>/dev/null || true
    mkdir -p "$CONF_DIR/data"
    chown root:log-guardian "$CONF_DIR/data" 2>/dev/null || true
    chmod 2770 "$CONF_DIR/data"
    if [[ -f "$CONF_DIR/data/fp-trust.lst" ]]; then
        chown log-guardian:log-guardian "$CONF_DIR/data/fp-trust.lst" 2>/dev/null || true
        chmod 660 "$CONF_DIR/data/fp-trust.lst" 2>/dev/null || true
    fi
    ok "Config izinleri: log-guardian grubu okuyabilir ($CONF_DIR)"
}

add_operator_to_log_guardian_group() {
    getent group log-guardian >/dev/null 2>&1 || return 0
    local u
    for u in ${LG_CONF_USERS:-} ${SUDO_USER:-}; do
        [[ -n "$u" ]] || continue
        id "$u" >/dev/null 2>&1 || continue
        if id -nG "$u" 2>/dev/null | tr ' ' '\n' | grep -qx log-guardian; then
            info "Kullanici zaten log-guardian grubunda: $u"
        elif usermod -aG log-guardian "$u" 2>/dev/null; then
            ok "log-guardian grubuna eklendi: $u"
            warn "Grup aktif olsun diye cikis/giris yapin veya: newgrp log-guardian"
        else
            warn "Gruba eklenemedi: $u"
        fi
    done
}

# ── Prod kullanicisi + ortam ─────────────────────────────────────────
setup_log_guardian_user() {
    if command -v groupadd >/dev/null 2>&1; then
        getent group log-guardian >/dev/null 2>&1 || groupadd --system log-guardian
    fi
    if command -v useradd >/dev/null 2>&1; then
        id log-guardian >/dev/null 2>&1 || useradd --system -g log-guardian \
            -d /var/lib/log-guardian -s /usr/sbin/nologin log-guardian 2>/dev/null || \
            useradd --system -g log-guardian -d /var/lib/log-guardian -s /bin/false log-guardian
    fi
    mkdir -p /var/lib/log-guardian
    chown log-guardian:log-guardian /var/lib/log-guardian 2>/dev/null || true
    ok "log-guardian sistem kullanicisi hazir."
}

create_production_env() {
    local envfile="$CONF_DIR/env"
    if [[ -f "$envfile" ]]; then
        warn "Mevcut env korunuyor: $envfile"
        return
    fi
    local ipc_tok saas_tok
    if command -v openssl >/dev/null 2>&1; then
        ipc_tok=$(openssl rand -hex 24)
        saas_tok="sk_guardian_$(openssl rand -hex 16)"
    else
        ipc_tok=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
        saas_tok="sk_guardian_$(date +%s)"
    fi
    cat > "$envfile" <<EOF
LOG_GUARDIAN_PROD=1
LOG_GUARDIAN_IPC_TOKEN=$ipc_tok
LOG_GUARDIAN_IPC_GROUP=log-guardian
LOGANALYZER_PASSWORD=DegistirBeni!123
EOF
    chmod 600 "$envfile"
    if grep -q '^SAAS_TOKEN=' "$CONF_DIR/rules.conf" 2>/dev/null; then
        sed -i "s|^SAAS_TOKEN=.*|SAAS_TOKEN=$saas_tok|" "$CONF_DIR/rules.conf"
    else
        echo "SAAS_TOKEN=$saas_tok" >> "$CONF_DIR/rules.conf"
    fi
    ok "Uretim ortami: $envfile (IPC token + SAAS_TOKEN)"
}

# ── Systemd Servisleri ───────────────────────────────────────────────
ensure_ipset_state_dir() {
    install -d -m 0755 /var/lib/ipset
}

create_daemon_service() {
    ensure_ipset_state_dir
    local service="$UNIT_DIR/log-guardian-daemon.service"
    cat > "$service" <<EOF
[Unit]
Description=Linux Log Guardian — eBPF/XDP Ayricalikli Daemon
After=network.target
Documentation=$REPO_URL
StartLimitInterval=60s
StartLimitBurst=5

[Service]
Type=notify
EnvironmentFile=-$CONF_DIR/env
ExecStart=$PREFIX/bin/log-guardian-daemon \\
    --iface $IFACE \\
    --obj $CONF_DIR/xdp_filter.o
WorkingDirectory=$CONF_DIR
User=root
AmbientCapabilities=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW CAP_PERFMON CAP_SYS_ADMIN
CapabilityBoundingSet=CAP_NET_ADMIN CAP_BPF CAP_NET_RAW CAP_PERFMON CAP_SYS_ADMIN
NoNewPrivileges=yes
WatchdogSec=60
NotifyAccess=main
LimitNOFILE=65536
LimitMEMLOCK=infinity
RuntimeDirectory=log-guardian
RuntimeDirectoryMode=0750
RuntimeDirectoryGroup=log-guardian
Restart=on-failure
RestartSec=3
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=/sys/fs/bpf /run/log-guardian /var/lib/ipset

[Install]
WantedBy=multi-user.target
EOF
    chmod 644 "$service"
    ok "log-guardian-daemon.service oluşturuldu."
}

create_analyzer_service() {
    local service="$UNIT_DIR/log-guardian.service"
    cat > "$service" <<EOF
[Unit]
Description=Linux Log Guardian — L7 Analiz & WAF Motoru
After=network.target log-guardian-daemon.service
Requires=log-guardian-daemon.service
Documentation=$REPO_URL
StartLimitInterval=60s
StartLimitBurst=5

[Service]
Type=simple
EnvironmentFile=-$CONF_DIR/env
Environment=LD_LIBRARY_PATH=$PREFIX/lib/log-guardian
ExecStart=$PREFIX/bin/log-guardian $NGINX_LOG \\
    --rules $CONF_DIR/rules.conf \\
    --db $CONF_DIR/events.db \\
    --password-file $CONF_DIR/service.password \\
    --follow --no-tui
WorkingDirectory=$CONF_DIR
User=log-guardian
Group=log-guardian
SupplementaryGroups=adm
AmbientCapabilities=
CapabilityBoundingSet=
NoNewPrivileges=yes
WatchdogSec=30
LimitNOFILE=65536
Restart=on-failure
RestartSec=3
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=$CONF_DIR /var/log/nginx

[Install]
WantedBy=multi-user.target
EOF
    chmod 644 "$service"
install -d "$UNIT_DIR/log-guardian.service.d"
install -m 644 "$REPO_DIR/deploy/log-guardian.service.d/20-readwrite.conf" \
    "$UNIT_DIR/log-guardian.service.d/20-readwrite.conf" 2>/dev/null \
    || cat > "$UNIT_DIR/log-guardian.service.d/20-readwrite.conf" <<'DROPIN'
[Service]
ReadWritePaths=/etc/log-guardian /var/log/nginx /var/lib/log-guardian
DROPIN
if [[ -f "$REPO_DIR/deploy/log-guardian.service.d/30-password-file.conf" ]]; then
    install -m 644 "$REPO_DIR/deploy/log-guardian.service.d/30-password-file.conf" \
        "$UNIT_DIR/log-guardian.service.d/30-password-file.conf"
fi
    ok "log-guardian.service oluşturuldu (+ service.d drop-in)."
}

create_threat_intel_timer() {
    # Eski kurulumlarda loganalyzer-* adi kullaniliyordu
    rm -f "$UNIT_DIR/loganalyzer-threatintel.service" \
          "$UNIT_DIR/loganalyzer-threatintel.timer"
    cat > "$UNIT_DIR/log-guardian-threatintel.service" <<EOF
[Unit]
Description=Linux Log Guardian Threat Intel Guncelleme

[Service]
Type=oneshot
ExecStart=$PREFIX/bin/log-guardian-threatintel
EOF
    cat > "$UNIT_DIR/log-guardian-threatintel.timer" <<EOF
[Unit]
Description=Linux Log Guardian Threat Intel — Gece Guncelleme

[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
    ok "Threat intel timer oluşturuldu (her gece 03:00)."
}

# ── Dry-Run Modu ─────────────────────────────────────────────────────
if [[ $DRY_RUN -eq 1 ]]; then
    step "=== DRY-RUN: Sistem Kontrolü ==="
    deps_ok=1
    for dep in clang pkg-config bpftool; do
        command -v "$dep" &>/dev/null && ok "$dep: mevcut" || { warn "$dep: EKSIK"; deps_ok=0; }
    done
    for lib in liburing libpcre2-8 sqlite3; do
        pkg-config --exists "$lib" 2>/dev/null && ok "lib $lib: mevcut" || { warn "lib $lib: EKSIK"; deps_ok=0; }
    done
    ok  "Tespit edilen arayüz : $IFACE"
    case "$XDP_MODE" in
        native)   ok   "XDP modu: CO-RE native (BTF mevcut)" ;;
        legacy)   warn "XDP modu: Legacy headers (BTF yok, kernel >= 5.2)" ;;
        iptables) warn "XDP modu: iptables fallback (kernel çok eski)" ;;
    esac
    [[ $deps_ok -eq 1 ]] && ok "Kurulum hazır!" || warn "Eksik bağımlılıklar mevcut."
    exit 0
fi

# ── Ana Akış ─────────────────────────────────────────────────────────
if [[ $INSTALL_ONLY -eq 1 ]]; then
    test -x "$REPO_DIR/log-guardian" || error "Binary yok — once: bash scripts/install_steps.sh 2-build"
else
    install_deps

    step "Proje Derleniyor"
    cd "$REPO_DIR"
    make clean

    if [[ "$XDP_MODE" == "iptables" ]] || [[ $NO_XDP -eq 1 ]]; then
        make fallback -j"$(nproc)"
        info "iptables/nftables fallback kurulacak."
        setup_iptables_fallback
    else
        make -j"$(nproc)"
    fi
    ok "Derleme tamamlandı."
    # sudo install.sh sonrasi .o dosyalari root'a kalmasin (make: Operation not permitted)
    if [[ -n "${SUDO_USER:-}" ]]; then
        chown -R "$SUDO_USER:$(id -gn "$SUDO_USER")" "$REPO_DIR" 2>/dev/null || true
    fi
fi

cd "$REPO_DIR"
step "Binary Dosyalar Kuruluyor"
install_wasmtime_libs
make install PREFIX="$PREFIX"
if [[ -x "$REPO_DIR/scripts/sync_etc_rules.sh" ]]; then
    bash "$REPO_DIR/scripts/sync_etc_rules.sh" || warn "sync_etc_rules atlandi — CRS /etc altinda guncel olmayabilir"
fi

install -d "$CONF_DIR"
if [[ "$XDP_MODE" != "iptables" ]]; then
    install_ebpf_objects
elif [[ -f "$REPO_DIR/xdp_filter.o" ]]; then
    install -m 755 "$REPO_DIR/xdp_filter.o" "$CONF_DIR/"
else
    warn "xdp_filter.o yok — once: bash scripts/install_steps.sh 2-build"
fi
create_rules_conf
patch_rules_conf_prod_keys
ensure_rules_access_kdf
ensure_env_password
ensure_nginx_log
setup_log_guardian_user
fix_conf_permissions
add_operator_to_log_guardian_group
create_production_env
install -m 755 "$REPO_DIR/threat_intel.sh" "$PREFIX/bin/log-guardian-threatintel"
migrate_threat_intel_db
install_helper_scripts
install_nginx_snippets
install_legal_notices
install_nginx_log_guardian_snippet || true
NGINX_FORMAT_OK=0
enforce_nginx_log_guardian_format && NGINX_FORMAT_OK=1 || true

if command -v systemctl &>/dev/null; then
    step "Systemd Servisleri Kaydediliyor"
    # IPC + ban hattı daemon'da; --no-xdp/iptables modunda da gerekli (XDP OFF, ipset aktif)
    create_daemon_service
    create_analyzer_service
    create_threat_intel_timer
    systemctl daemon-reload
    systemctl enable log-guardian-threatintel.timer
    systemctl enable log-guardian-daemon.service
    systemctl enable log-guardian.service
    systemctl start log-guardian-threatintel.timer 2>/dev/null || true
    systemctl start log-guardian-daemon.service 2>/dev/null || \
        warn "Daemon baslatilamadi (root/iface?)"
    sleep 2
    systemctl start log-guardian.service 2>/dev/null || \
        warn "Analyzer baslatilamadi — nginx log yolu ve izinleri kontrol edin."
    ok "Systemd servisleri etkinlestirildi ve baslatildi."
fi

NGINX_INLINE_OK=0
if command -v nginx >/dev/null 2>&1; then
    enforce_nginx_inline_consult && NGINX_INLINE_OK=1 || true
fi

if [[ "$(id -u)" -eq 0 ]]; then
    bash "$REPO_DIR/scripts/enable_threat_intel_prod.sh" 2>/dev/null && THREAT_INTEL_OK=1 || THREAT_INTEL_OK=0
else
    THREAT_INTEL_OK=0
fi

step "Kurulum Sonrasi Saglik Kontrolu"
if command -v "$PREFIX/bin/log-guardian" &>/dev/null; then
    systemctl start log-guardian-daemon 2>/dev/null || warn "Daemon baslatilamadi (root/iface?)"
    sleep 3
    bash "$REPO_DIR/scripts/repair_active_bans_json.sh" 2>/dev/null || true
    systemctl start log-guardian 2>/dev/null || true
    if LG_BIN="$PREFIX/bin/log-guardian" RULES="${CONF_DIR}/rules.conf" \
       bash "$REPO_DIR/scripts/ops_health.sh"; then
        ok "Healthcheck basarili (retry)."
    else
        warn "Healthcheck basarisiz — docs/OPERATIONS.md sorun giderme"
        warn "Manuel: sudo bash scripts/ops_health.sh"
    fi
else
    warn "log-guardian binary bulunamadi, healthcheck atlandi."
fi

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║     Linux Log Guardian Kurulumu Tamamlandı! 🚀             ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Ağ Arayüzü   : ${CYAN}${IFACE}${NC}"
echo -e "  XDP Modu     : ${CYAN}${XDP_MODE}${NC}"
echo -e "  Konfig Dizini: ${CYAN}${CONF_DIR}${NC}"
echo ""
echo -e "  eBPF Daemon başlat  : ${CYAN}systemctl start log-guardian-daemon${NC} (XDP=${XDP_MODE})"
echo -e "  Analyzer başlat     : ${CYAN}systemctl start log-guardian${NC}"
echo -e "  Metrikler           : ${CYAN}curl http://127.0.0.1:9091/metrics${NC}"
echo -e "  Nginx log           : ${CYAN}${NGINX_LOG}${NC}"
echo -e "  Kural dosyası       : ${CYAN}${CONF_DIR}/rules.conf${NC}"
echo -e "  Operasyon rehberi   : ${CYAN}docs/OPERATIONS.md${NC}"
echo -e "  Laptop ops          : ${CYAN}docs/LAPTOP_OPS.md${NC}"
echo -e "  Ilk calistirma      : ${CYAN}sudo bash scripts/install_first_run.sh${NC}  (docs/QUICKSTART_15MIN.md)"
echo -e "  API guvenligi       : ${CYAN}sudo bash scripts/ensure_api_security.sh${NC}"
echo -e "  Pilot checklist     : ${CYAN}docs/PILOT_SETUP.md${NC}"
echo -e "  7/24 dogrulama      : ${CYAN}bash scripts/ops_smoke.sh${NC}"
echo -e "  JA3 TLS :443        : ${CYAN}sudo bash scripts/nginx_tls_local_setup.sh${NC}  sonra: bash scripts/t2_tls_proof.sh"
echo -e "  Edge sertlestirme   : ${CYAN}sudo bash scripts/prod_edge_setup.sh${NC}  (docs/EDGE_PROTECTION.md)"
echo -e "  GitHub              : ${CYAN}${REPO_URL}${NC}"
echo ""
if [[ "${NGINX_FORMAT_OK:-0}" -ne 1 ]] && command -v nginx >/dev/null 2>&1; then
    warn "nginx log_guardian format EKSIK — POST SQLi gorunmez; WAF recall duser."
    warn "  sudo bash scripts/fix_nginx_log_format.sh"
    warn "  dogrula: STRICT=1 bash scripts/check_nginx_log_format.sh"
fi
if [[ "${NGINX_INLINE_OK:-0}" -ne 1 ]] && command -v nginx >/dev/null 2>&1; then
    warn "nginx inline consult EKSIK — auth_request oncesi WAF kapali."
    warn "  sudo bash scripts/fix_nginx_inline_consult.sh"
    warn "  kanit: bash scripts/nginx_hybrid_proof.sh"
fi
if [[ "${THREAT_INTEL_OK:-0}" -ne 1 ]]; then
    warn "threat intel prod EKSIK — timer/TTL/ipset sync kontrol edin."
    warn "  sudo bash scripts/enable_threat_intel_prod.sh"
    warn "  kanit: sudo bash scripts/threat_intel_prod_proof.sh"
fi
if [[ "${NGINX_FORMAT_OK:-0}" -ne 1 ]] && command -v nginx >/dev/null 2>&1 && [[ "${NGINX_ENFORCE_STRICT:-0}" == "1" ]]; then
    error "NGINX_ENFORCE_STRICT=1 — kurulum log_guardian olmadan tamamlanamaz"
fi
