#!/usr/bin/env bash
# .deb paket dogrulama (kurulum simülasyonu — canli /etc'e dokunmaz)
#   bash scripts/test_deb_local.sh
#   INSTALL=1 sudo bash scripts/test_deb_local.sh   # gercek dpkg -i (dikkat)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/build_deb.sh
DEB=$(ls -1t "$ROOT"/dist/log-guardian_*.deb 2>/dev/null | head -1)
[[ -n "$DEB" ]] || { echo "[test_deb] FAIL: .deb yok" >&2; exit 1; }

echo "[test_deb] paket: $DEB"
# head SIGPIPE (141) — pipefail ile script dusmesin
{ dpkg-deb -I "$DEB" 2>&1 | head -8; } || true
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
dpkg-deb -x "$DEB" "$TMP"

for want in \
  usr/local/bin/log-guardian \
  usr/local/bin/log-guardian-daemon \
  usr/local/share/log-guardian/scripts/post_install_verify.sh \
  usr/local/share/log-guardian/rules.conf.template \
  etc/systemd/system/log-guardian.service; do
  [[ -e "$TMP/$want" ]] || { echo "[test_deb] FAIL: eksik $want" >&2; exit 1; }
  echo "[OK] $want"
done

# rules.conf upgrade korumasi — pakette olmamali
if [[ -f "$TMP/etc/log-guardian/rules.conf" ]]; then
  echo "[test_deb] WARN: pakette rules.conf var (upgrade token silinebilir)" >&2
else
  echo "[OK] rules.conf pakette yok (upgrade guvenli)"
fi

if [[ "${INSTALL:-0}" == "1" ]]; then
  [[ "$(id -u)" -eq 0 ]] || { echo "[test_deb] INSTALL=1 icin sudo" >&2; exit 1; }
  dpkg -i "$DEB"
  echo "[test_deb] dpkg -i tamam — bash /usr/local/share/log-guardian/scripts/post_install_verify.sh"
else
  echo ""
  echo "[OK] test_deb_local — extract dogrulama tamam"
  echo "  Gercek kurulum: sudo dpkg -i $DEB"
fi
