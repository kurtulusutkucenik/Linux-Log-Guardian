#!/usr/bin/env bash
# .deb paketi olustur — kurulum surtunmesini azaltir (roadmap #6)
#   bash scripts/build_deb.sh
#   LG_DEB_VERSION=0.1.0 bash scripts/build_deb.sh
#   sudo dpkg -i dist/log-guardian_*.deb
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PKG="log-guardian"
ARCH="${LG_DEB_ARCH:-amd64}"
VERSION="${LG_DEB_VERSION:-}"
if [[ -z "$VERSION" ]]; then
  VERSION=$(git describe --tags --always 2>/dev/null | tr '/' '-' | sed 's/-dirty$//' || echo "0.1.0-dev")
fi
VERSION="${VERSION#v}"
# dpkg semver: harf/rakam/nokta/tire
VERSION=$(echo "$VERSION" | sed 's/[^a-zA-Z0-9.+~:-]/-/g')
# dpkg Version rakamla baslamali (git kisa hash: c9b9af1)
if [[ ! "$VERSION" =~ ^[0-9] ]]; then
  VERSION="0.${VERSION}"
fi

DIST="$ROOT/dist"
STAGE="$DIST/deb-stage"
DEBIAN="$STAGE/DEBIAN"
OUT="$DIST/${PKG}_${VERSION}_${ARCH}.deb"

fail() { echo "[build_deb] FAIL: $*" >&2; exit 1; }

command -v dpkg-deb >/dev/null 2>&1 || fail "dpkg-deb yok — apt install dpkg-dev"

detect_iface() {
  ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' | head -1 \
    || echo "eth0"
}

echo "=== build_deb ==="
echo "  version=$VERSION  arch=$ARCH"

if [[ -f "$ROOT/main.o" && ! -w "$ROOT/main.o" ]]; then
  echo "[build_deb] root sahipli .o — fix_laptop_build calistiriliyor..."
  bash "$ROOT/scripts/fix_laptop_build.sh"
fi

LG_QUIET_BUILD=1 make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian log-guardian-daemon

rm -rf "$STAGE"
mkdir -p "$DEBIAN"

if ! LG_QUIET_BUILD=1 make -s install DESTDIR="$STAGE" >/dev/null; then
  fail "make install basarisiz"
fi

# /etc/log-guardian/rules.conf pakete dahil etme — upgrade'de API_TOKEN/KDF silinmesin
rm -f "$STAGE/etc/log-guardian/rules.conf"

SHARE="$STAGE/usr/local/share/log-guardian"
install -d "$SHARE"
install -m 644 rules.conf "$SHARE/rules.conf.template"

# Tam script agaci + kurulum bagimliliklari (install_first_run / post_install_verify)
rsync -a \
  --exclude='.cache' \
  scripts/ "$SHARE/scripts/"
find "$SHARE/scripts" -type f -name '*.sh' -exec chmod 755 {} \;
chmod 755 "$SHARE/scripts/deb_post_install.sh" 2>/dev/null || true

rsync -a examples/ "$SHARE/examples/"
rsync -a corpus/ "$SHARE/corpus/"

# Dokumantasyon (VM/offline kurulum). Canli site ayri: landing/ (Next.js).
install -d "$SHARE/docs"
for doc in docs/SECURITY_PROFILES.md docs/QUICKSTART_15MIN.md docs/LAPTOP_OPS.md \
           docs/VPS_SETUP.md docs/QUICKSTART_NGINX.md docs/BRANDING.md docs/SOAK_TEST.md; do
  [[ -f "$doc" ]] && install -m 644 "$doc" "$SHARE/docs/" || true
done

install -d "$SHARE/data"
for df in data/fp-trust-warmup.lst data/fp-trust.lst; do
  [[ -f "$df" ]] && install -m 644 "$df" "$SHARE/data/" || true
done

for cf in test_rules.conf smoke_schema.conf; do
  [[ -f "$cf" ]] && install -m 644 "$cf" "$SHARE/" || true
done

# deploy nginx snippet referanslari (fix_nginx_*)
install -d "$SHARE/deploy"
[[ -d deploy/log-guardian.service.d ]] && \
  rsync -a deploy/log-guardian.service.d "$SHARE/deploy/" || true
for df in deploy/log-guardian-crowdsec-bouncer.service \
          deploy/log-guardian-crowdsec-bouncer.timer \
          deploy/crowdsec.env.example; do
  [[ -f "$df" ]] && install -m 644 "$df" "$SHARE/deploy/" || true
done

if [[ -f examples/openapi-mini.json ]]; then
  install -d "$STAGE/etc/log-guardian/examples"
  install -m 644 examples/openapi-mini.json "$STAGE/etc/log-guardian/examples/"
  install -m 644 examples/openapi-mini.json "$SHARE/examples/" 2>/dev/null || true
fi

# eBPF objeleri (daemon)
for obj in xdp_filter.o syscall_uprobe.o tls_uprobe.o lineage_probe.o http_l7_probe.o; do
  [[ -f "$obj" ]] && install -m 755 "$obj" "$STAGE/etc/log-guardian/" || true
done

# systemd
IFACE="${LG_IFACE:-$(detect_iface)}"
install -d "$STAGE/etc/systemd/system"
install -m 644 packaging/debian/log-guardian.service "$STAGE/etc/systemd/system/"
sed "s/__IFACE__/${IFACE}/g" packaging/debian/log-guardian-daemon.service \
  >"$STAGE/etc/systemd/system/log-guardian-daemon.service"
install -d "$STAGE/etc/systemd/system/log-guardian.service.d"
if [[ -f deploy/log-guardian.service.d/20-readwrite.conf ]]; then
  install -m 644 deploy/log-guardian.service.d/20-readwrite.conf \
    "$STAGE/etc/systemd/system/log-guardian.service.d/"
fi
if [[ -f deploy/log-guardian.service.d/30-password-file.conf ]]; then
  install -m 644 deploy/log-guardian.service.d/30-password-file.conf \
    "$STAGE/etc/systemd/system/log-guardian.service.d/"
fi

# DEBIAN metadata
sed "s/@VERSION@/${VERSION}/" packaging/debian/control.in >"$DEBIAN/control"
install -m 755 packaging/debian/postinst packaging/debian/prerm "$DEBIAN/"

# Paket boyutu (KB, yaklasik)
INSTALLED_KB=$(du -sk "$STAGE" | awk '{print $1}')
echo "Installed-Size: $INSTALLED_KB" >>"$DEBIAN/control"

mkdir -p "$DIST"
dpkg-deb --root-owner-group --build "$STAGE" "$OUT"

sha256sum "$OUT" | awk '{print $1}' >"${OUT}.sha256"
bn="$(basename "$OUT")"
sha="$(cat "${OUT}.sha256")"
touch "$DIST/SHA256SUMS"
grep -v " ${bn}$" "$DIST/SHA256SUMS" >"$DIST/.sha256.tmp" 2>/dev/null || true
echo "${sha}  ${bn}" >>"$DIST/.sha256.tmp"
mv "$DIST/.sha256.tmp" "$DIST/SHA256SUMS"

echo "[build_deb] -> $OUT ($(du -h "$OUT" | awk '{print $1}'))"
echo "[build_deb] sha256: $(cat "${OUT}.sha256")"
echo ""
echo "Kurulum:"
echo "  sudo dpkg -i $OUT"
echo "  sudo apt-get install -f   # bagimlilik eksikse"
echo "  sudo bash /usr/local/share/log-guardian/scripts/install_first_run.sh"
echo "  bash /usr/local/share/log-guardian/scripts/post_install_verify.sh"
echo "  # --no-xdp / servis FAIL: sudo bash .../repair_no_xdp_stack.sh"
echo ""
echo "VM (VirtualBox):"
echo "  HOST: bash scripts/build_deb.sh   # dist/*.deb olusturur"
echo "  VM:   sudo bash scripts/vm_sync_from_host.sh"
echo "  VM:   sudo bash scripts/vm_install_deb.sh"
echo "  # veya paylasimdan: sudo bash /mnt/lg/scripts/vm_install_deb.sh"
