#!/usr/bin/env bash
# Operator credential ozeti — kagit / password manager (chat'e yapistirmayin)
#   bash scripts/operator_credential_sheet.sh          # dosya yolu + maskeli
#   bash scripts/operator_credential_sheet.sh --print  # tam degerler (yalnizca kagit icin)
#   DEST=~/Belgeler/lg-kagit.txt bash scripts/operator_credential_sheet.sh --print
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PRINT=0
[[ "${1:-}" == "--print" ]] && PRINT=1

mask() {
  local v="$1"
  local n=${#v}
  [[ "$n" -le 8 ]] && echo "${v:0:2}***" && return
  echo "${v:0:6}...${v: -4} (${n} char)"
}

show_kv() {
  local label="$1" val="$2"
  if [[ -z "$val" ]]; then
    echo "  $label: (yok)"
  elif [[ "$PRINT" -eq 1 ]]; then
    echo "  $label: $val"
  else
    echo "  $label: $(mask "$val")"
  fi
}

read_file_kv() {
  local file="$1" key="$2"
  if [[ -r "$file" ]]; then
    grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- || true
    return
  fi
  if command -v sudo >/dev/null 2>&1 && sudo test -r "$file" 2>/dev/null; then
    sudo grep -E "^${key}=" "$file" 2>/dev/null | tail -1 | cut -d= -f2- || true
  fi
}

read_webhook_lines() {
  local file="$1"
  if [[ -r "$file" ]]; then
    grep -E '^(LOGANALYZER_TELEGRAM|TELEGRAM_|WEBHOOK_)' "$file" 2>/dev/null || true
    return
  fi
  if command -v sudo >/dev/null 2>&1 && sudo test -r "$file" 2>/dev/null; then
    sudo grep -E '^(LOGANALYZER_TELEGRAM|TELEGRAM_|WEBHOOK_)' "$file" 2>/dev/null || true
  fi
}

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Log Guardian — operator credential sheet                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "  Tarih: $(date -Iseconds)"
echo "  Host:  $(hostname)"
[[ "$PRINT" -eq 1 ]] && echo "  MOD:   TAM DEGER (--print) — kagida yaz, chat'e atma"
echo ""

# --- Yedek dosya ---
DEST="${DEST:-$HOME/.config/log-guardian/operator-secrets.txt}"
bash "$ROOT/scripts/backup_operator_secrets.sh" >/dev/null 2>&1 || true
echo "[dosya] $DEST (chmod 600)"
echo ""

CONF="/etc/log-guardian/rules.conf"
ENV="/etc/log-guardian/env"
WEBHOOK="/etc/log-guardian/webhook.env"
DASH_ENV="$ROOT/dashboard/.env"

echo "=== 1) API (nginx consult + dashboard ban) ==="
echo "  Konum: $CONF"
api_tok="$(read_file_kv "$CONF" API_TOKEN)"
show_kv "API_TOKEN" "$api_tok"
echo "  Kullanim: curl -H \"Authorization: Bearer ...\" http://127.0.0.1:8090/api/v1/..."
echo "  Dashboard: bash scripts/sync_dashboard_api_token.sh"
echo ""

echo "=== 2) Analyzer parola ==="
echo "  Konum: $ENV (LOGANALYZER_PASSWORD) + rules.conf (ACCESS_PASSWORD_KDF)"
pw="$(read_file_kv "$ENV" LOGANALYZER_PASSWORD)"
show_kv "LOGANALYZER_PASSWORD" "$pw"
echo "  Degistir: sudo env LG_NEW_PASSWORD='...' bash scripts/laptop_harden.sh"
echo ""

echo "=== 3) Telegram / webhook ==="
echo "  Konum: $WEBHOOK"
if [[ -r "$WEBHOOK" ]] || sudo test -r "$WEBHOOK" 2>/dev/null; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    show_kv "$key" "$val"
  done < <(read_webhook_lines "$WEBHOOK")
else
  echo "  (dosya yok — deploy/webhook.env.example)"
fi
echo ""

echo "=== 4) Dashboard JWT + admin ==="
echo "  Konum: $DASH_ENV veya docker compose env"
if [[ -f "$DASH_ENV" ]]; then
  show_kv "JWT_SECRET" "$(read_file_kv "$DASH_ENV" JWT_SECRET)"
  show_kv "DASHBOARD_FLEET_API_KEY" "$(read_file_kv "$DASH_ENV" DASHBOARD_FLEET_API_KEY)"
  show_kv "GUARDIAN_API_TOKEN" "$(read_file_kv "$DASH_ENV" GUARDIAN_API_TOKEN)"
  echo "  Admin parola: scrypt hash prisma DB — degistir: bash scripts/laptop_jwt_setup.sh"
else
  echo "  (dashboard/.env yok — bash scripts/laptop_jwt_setup.sh)"
fi
# docker compose export
if docker inspect log-guardian-dashboard >/dev/null 2>&1; then
  dj="$(docker inspect log-guardian-dashboard --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null \
    | grep -E '^JWT_SECRET=' | tail -1 | cut -d= -f2- || true)"
  [[ -n "$dj" ]] && show_kv "JWT_SECRET (docker)" "$dj"
fi
echo ""

echo "=== 5) IPC (daemon) ==="
echo "  Konum: /etc/log-guardian/env veya LOG_GUARDIAN_IPC_TOKEN"
show_kv "LOG_GUARDIAN_IPC_TOKEN" "$(read_file_kv "$ENV" LOG_GUARDIAN_IPC_TOKEN)"
echo ""

echo "=== 6) .deb dogrulama ==="
deb="$(ls -1t "$ROOT/dist/log-guardian_"*.deb 2>/dev/null | head -1 || true)"
if [[ -n "$deb" ]]; then
  echo "  Paket: $(basename "$deb")"
  [[ -f "${deb}.sha256" ]] && echo "  sha256: $(cat "${deb}.sha256")"
fi
echo ""

if [[ "$PRINT" -eq 1 && -f "$DEST" ]]; then
  cp "$DEST" "${DEST%.txt}.print-backup.txt" 2>/dev/null || true
  chmod 600 "${DEST%.txt}.print-backup.txt" 2>/dev/null || true
  echo "[OK] tam yedek: $DEST"
  echo "  Kagida yazdiktan sonra: shred -u $DEST  (opsiyonel)"
else
  echo "Tam degerler: bash scripts/operator_credential_sheet.sh --print"
  echo "  veya: cat $DEST"
fi
