#!/usr/bin/env bash
# systemd / servis parolasi — rules.conf KDF ile hizala
#   sudo bash scripts/sync_service_password.sh
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "[sync_service_password] sudo gerekli" >&2; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
ENV_FILE="/etc/log-guardian/env"
PWFILE="/etc/log-guardian/service.password"
DEMO_PW='DegistirBeni!123'

[[ -f "$CONF" ]] || { echo "[sync_service_password] $CONF yok" >&2; exit 1; }

verify_kdf_pw() {
  local kdf="$1" pw="$2"
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

kdf=$(grep -E '^ACCESS_PASSWORD_KDF=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
if [[ -z "$kdf" ]]; then
  echo "[sync_service_password] ACCESS_PASSWORD_KDF yok — repo rules.conf veya install.sh" >&2
  exit 1
fi

matched=""
env_pw=""
if [[ -f "$ENV_FILE" ]]; then
  env_pw=$(grep -E '^LOGANALYZER_PASSWORD=' "$ENV_FILE" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$env_pw" ]] && verify_kdf_pw "$kdf" "$env_pw"; then
    matched="$env_pw"
  fi
fi

if [[ -z "$matched" ]] && verify_kdf_pw "$kdf" "$DEMO_PW"; then
  matched="$DEMO_PW"
  install -d -m 0750 -o root -g log-guardian /etc/log-guardian
  if [[ -f "$ENV_FILE" ]]; then
    if grep -q '^LOGANALYZER_PASSWORD=' "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^LOGANALYZER_PASSWORD=.*|LOGANALYZER_PASSWORD=${DEMO_PW}|" "$ENV_FILE"
    else
      echo "LOGANALYZER_PASSWORD=${DEMO_PW}" >> "$ENV_FILE"
    fi
  else
    printf 'LOGANALYZER_PASSWORD=%s\n' "$DEMO_PW" >"$ENV_FILE"
    chown root:log-guardian "$ENV_FILE"
    chmod 640 "$ENV_FILE"
  fi
  if [[ -n "$env_pw" ]]; then
    echo "[sync_service_password] env parolasi KDF ile uyumsuzdu — demo ile hizalandi (laptop)"
  fi
fi

if [[ -z "$matched" ]]; then
  echo "[sync_service_password] FAIL: parola KDF ile uyumsuz" >&2
  echo "  sudo env LG_NEW_PASSWORD='GucluParola' bash scripts/laptop_harden.sh" >&2
  exit 1
fi

install -d -m 0750 -o root -g log-guardian /etc/log-guardian
printf '%s' "$matched" >"$PWFILE"
chown log-guardian:log-guardian "$PWFILE"
chmod 600 "$PWFILE"
echo "[sync_service_password] OK $PWFILE (log-guardian:log-guardian 600)"

DROPIN=/etc/systemd/system/log-guardian.service.d/30-password-file.conf
if [[ -f "$ROOT/deploy/log-guardian.service.d/30-password-file.conf" ]]; then
  install -d /etc/systemd/system/log-guardian.service.d
  install -m 644 "$ROOT/deploy/log-guardian.service.d/30-password-file.conf" "$DROPIN"
  systemctl daemon-reload 2>/dev/null || true
  echo "[sync_service_password] drop-in: $DROPIN"
fi

if [[ -x "$ROOT/scripts/fix_rules_conf_perms.sh" ]]; then
  bash "$ROOT/scripts/fix_rules_conf_perms.sh" 2>/dev/null || true
fi
