#!/usr/bin/env bash
# dpkg postinst ic mantik — API token, IPC, systemd
set -euo pipefail
SHARE="${LG_SHARE:-/usr/local/share/log-guardian}"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

if ! getent group log-guardian >/dev/null 2>&1; then
  addgroup --system --quiet log-guardian 2>/dev/null || groupadd --system log-guardian
fi
if ! getent passwd log-guardian >/dev/null 2>&1; then
  adduser --system --quiet --home /var/lib/log-guardian --no-create-home \
    --disabled-login --disabled-password --ingroup log-guardian log-guardian \
    2>/dev/null || useradd --system -g log-guardian -d /var/lib/log-guardian -s /usr/sbin/nologin log-guardian
fi

install -d -m 0750 -o root -g log-guardian /var/lib/log-guardian
install -d -m 0750 -o root -g log-guardian /etc/log-guardian/data /etc/log-guardian/examples 2>/dev/null || true

if [[ -d "$SHARE/examples" ]]; then
  cp -n "$SHARE/examples/"* /etc/log-guardian/examples/ 2>/dev/null || true
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload || true
fi

if [[ -x "$SHARE/scripts/fix_ipc_perms.sh" ]]; then
  bash "$SHARE/scripts/fix_ipc_perms.sh" || true
fi

if [[ -x "$SHARE/scripts/fix_rules_conf_perms.sh" ]]; then
  bash "$SHARE/scripts/fix_rules_conf_perms.sh" || true
fi

# Ilk kurulum: rules.conf sablonu (upgrade mevcut /etc dosyasina dokunmaz)
if [[ ! -f "$CONF" ]]; then
  tpl="$SHARE/rules.conf.template"
  [[ -f "$tpl" ]] || tpl="$SHARE/rules.conf"
  if [[ -f "$tpl" ]]; then
    install -m 640 -o root -g log-guardian "$tpl" "$CONF"
    echo "[deb_post_install] rules.conf olusturuldu: $CONF"
  fi
fi

if [[ -f "$CONF" ]]; then
  if ! grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null; then
    if [[ -x "$SHARE/scripts/ensure_api_security.sh" ]]; then
      bash "$SHARE/scripts/ensure_api_security.sh" || true
    fi
  else
    # Token mevcut — yalnizca izin + servis parolasi (token korunur)
    bash "$SHARE/scripts/fix_rules_conf_perms.sh" 2>/dev/null || true
    if [[ -x "$SHARE/scripts/sync_service_password.sh" ]]; then
      bash "$SHARE/scripts/sync_service_password.sh" || true
    fi
    # API_BIND / firewall (token dokunulmaz)
    if [[ -x "$SHARE/scripts/ensure_api_security.sh" ]]; then
      API_SKIP_TOKEN=1 bash "$SHARE/scripts/ensure_api_security.sh" || true
    fi
  fi
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl reset-failed log-guardian.service 2>/dev/null || true
  systemctl enable log-guardian-daemon.service log-guardian.service 2>/dev/null || true
  systemctl restart log-guardian-daemon.service log-guardian.service 2>/dev/null || true
fi

echo ""
echo "log-guardian kuruldu."
echo "  sudo bash $SHARE/scripts/install_first_run.sh   # nginx + FP (opsiyonel)"
echo "  bash $SHARE/scripts/post_install_verify.sh"
