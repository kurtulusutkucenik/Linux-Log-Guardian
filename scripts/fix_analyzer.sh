#!/usr/bin/env bash
# Analyzer + IPC + rules.conf tek seferde duzelt
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "[FAIL] sudo gerekli: sudo bash scripts/fix_analyzer.sh"; exit 1; }

RULES=/etc/log-guardian/rules.conf
ENV=/etc/log-guardian/env
KDF='ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504'
DAEMON_UNIT=/etc/systemd/system/log-guardian-daemon.service

echo "=== Log Guardian analyzer duzeltme ==="

# Bozuk ExecStartPost (onceki kurulum hatasi)
if [[ -f "$DAEMON_UNIT" ]] && grep -q '^ExecStartPost=/bin/sh' "$DAEMON_UNIT"; then
  sed -i '/^ExecStartPost=\/bin\/sh/d' "$DAEMON_UNIT"
  echo "[OK] Bozuk ExecStartPost kaldirildi"
fi

# rules.conf — gecerli KDF yoksa ekle (parola: DegistirBeni!123)
if [[ -f "$RULES" ]]; then
  if grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$[0-9]+\$[0-9a-fA-F]+\$[0-9a-fA-F]{64}' "$RULES"; then
    echo "[OK] ACCESS_PASSWORD_KDF zaten gecerli"
  else
    sed -i '/^ACCESS_PASSWORD_KDF=/d' "$RULES"
    sed -i '/^ACCESS_PASSWORD_HASH=/d' "$RULES"
    printf '\n%s\n' "$KDF" >> "$RULES"
    chmod 600 "$RULES"
    echo "[OK] ACCESS_PASSWORD_KDF eklendi (parola: DegistirBeni!123)"
  fi
else
  echo "[FAIL] $RULES yok — once: sudo bash scripts/install_steps.sh 3-install"
  exit 1
fi

# env — systemd icin LOGANALYZER_PASSWORD
if [[ -f "$ENV" ]]; then
  if grep -q '^LOGANALYZER_PASSWORD=' "$ENV"; then
    echo "[OK] LOGANALYZER_PASSWORD zaten var"
  else
    echo 'LOGANALYZER_PASSWORD=DegistirBeni!123' >> "$ENV"
    chmod 600 "$ENV"
    echo "[OK] LOGANALYZER_PASSWORD eklendi"
  fi
fi

fix_ipc_perms() {
  local g
  g=$(getent group log-guardian | cut -d: -f3 || true)
  [[ -n "$g" ]] || return 0
  if [[ -d /run/log-guardian ]]; then
    chown root:"$g" /run/log-guardian
    chmod 0750 /run/log-guardian
  fi
  if [[ -S /run/log-guardian/ipc.sock ]]; then
    chown root:"$g" /run/log-guardian/ipc.sock
    chmod 0660 /run/log-guardian/ipc.sock
  fi
}

fix_conf_perms() {
  local conf=/etc/log-guardian
  getent group log-guardian >/dev/null 2>&1 || return 0
  chown root:log-guardian "$conf"
  chmod 750 "$conf"
  [[ -f "$conf/rules.conf" ]] && chown root:log-guardian "$conf/rules.conf" && chmod 640 "$conf/rules.conf"
  [[ -d "$conf/rules" ]] && chown -R root:log-guardian "$conf/rules" && chmod 755 "$conf/rules"
  mkdir -p "$conf/plugins"
  chown -R root:log-guardian "$conf/plugins"
  chmod 750 "$conf/plugins"
  touch "$conf/events.db" 2>/dev/null || true
  chown root:log-guardian "$conf/events.db" 2>/dev/null || true
  chmod 660 "$conf/events.db" 2>/dev/null || true
  echo "[OK] rules.conf izinleri: root:log-guardian 640"
}

systemctl daemon-reload
systemctl reset-failed log-guardian-daemon log-guardian 2>/dev/null || true
fix_conf_perms
systemctl restart log-guardian-daemon
sleep 2
fix_ipc_perms
echo "[OK] IPC izinleri ayarlandi"

systemctl restart log-guardian
sleep 1

echo "---"
if systemctl is-active --quiet log-guardian-daemon && systemctl is-active --quiet log-guardian; then
  echo "[OK] log-guardian-daemon + log-guardian active"
  curl -sf --max-time 3 http://127.0.0.1:9091/metrics | head -3 || echo "[WARN] /metrics henuz hazir degil (birkaç sn bekleyin)"
else
  echo "[WARN] Servisler hala sorunlu:"
  systemctl status log-guardian-daemon log-guardian --no-pager -l 2>&1 | head -30
  journalctl -u log-guardian -n 10 --no-pager
  exit 1
fi
