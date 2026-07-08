#!/usr/bin/env bash
# Read/mutate API token ayrimi (Enterprise) — Community'de API_MUTATION_TOKEN yoksa tek token kalir
#   sudo bash scripts/ensure_api_split_tokens.sh
#   API_SPLIT_ROTATE=1 sudo bash scripts/ensure_api_split_tokens.sh  # mutation token yenile
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"

[[ "$(id -u)" -eq 0 ]] || { echo "[ensure_api_split_tokens] sudo gerekli" >&2; exit 1; }
[[ -f "$CONF" ]] || { echo "[ensure_api_split_tokens] $CONF yok" >&2; exit 1; }

ensure_kv() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

echo "=== ensure_api_split_tokens ==="

if ! grep -qE '^API_TOKEN=.+' "$CONF" 2>/dev/null; then
  echo "[ensure_api_split_tokens] API_TOKEN yok — once: sudo bash scripts/ensure_api_security.sh" >&2
  exit 1
fi

read_tok=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2-)
mut_tok=$(grep -E '^API_MUTATION_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

if [[ "${API_SPLIT_ROTATE:-0}" == "1" ]] || [[ -z "$mut_tok" ]]; then
  mut_tok="$(openssl rand -hex 32)"
  ensure_kv "API_MUTATION_TOKEN" "$mut_tok"
  echo "[OK] API_MUTATION_TOKEN uretildi"
else
  echo "[OK] API_MUTATION_TOKEN mevcut (korundu)"
fi

bash "$ROOT/scripts/fix_rules_conf_perms.sh" 2>/dev/null || true

if command -v nginx >/dev/null 2>&1; then
  bash "$ROOT/scripts/lib/sync_nginx_consult_token.sh" "$mut_tok"
  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true
  echo "[OK] nginx consult -> API_MUTATION_TOKEN"
fi

# API split C kodu — rules.conf tek basina yetmez; eski binary POST'u read token ile kabul eder
if [[ "${SKIP_BINARY_UPGRADE:-0}" == "1" ]]; then
  echo "[SKIP] binary upgrade (SKIP_BINARY_UPGRADE=1)"
elif [[ -f "$ROOT/main.c" && -x "$ROOT/scripts/upgrade_log_guardian_binary.sh" ]]; then
  if bash "$ROOT/scripts/upgrade_log_guardian_binary.sh"; then
    echo "[OK] log-guardian binary guncellendi (API_MUTATION_TOKEN split)"
  else
    echo "[WARN] binary upgrade atlandi — elle:" >&2
    echo "  make -j\$(nproc) log-guardian && sudo install -m 755 log-guardian /usr/local/bin/log-guardian" >&2
    echo "  sudo systemctl restart log-guardian" >&2
  fi
else
  systemctl restart log-guardian log-guardian-daemon 2>/dev/null || systemctl restart log-guardian 2>/dev/null || true
  sleep 2
fi

if [[ "${SKIP_DOCKER_SYNC:-0}" != "1" ]] && docker ps --format '{{.Names}}' 2>/dev/null | grep -q log-guardian-dashboard; then
  bash "$ROOT/scripts/sync_dashboard_api_token.sh" 2>/dev/null || true
fi

if [[ "${SKIP_API_MUTATION_E2E:-0}" != "1" ]]; then
  if bash "$ROOT/scripts/api_mutation_token_e2e.sh" >/dev/null 2>&1; then
    echo "[OK] api_mutation_token_e2e"
  else
    echo "[WARN] api_mutation_token_e2e — bash scripts/api_mutation_token_e2e.sh" >&2
  fi
  if bash "$ROOT/scripts/api_mutation_audit_e2e.sh" >/dev/null 2>&1; then
    echo "[OK] api_mutation_audit_e2e"
  else
    echo "[WARN] api_mutation_audit_e2e — binary install + restart gerekli" >&2
  fi
fi

echo ""
echo "  READ  (GET)  : API_TOKEN"
echo "  MUTATE (POST): API_MUTATION_TOKEN"
echo "  nginx consult: mutation token"
echo "  Dashboard    : bash scripts/sync_dashboard_api_token.sh"
echo "[OK] ensure_api_split_tokens"
