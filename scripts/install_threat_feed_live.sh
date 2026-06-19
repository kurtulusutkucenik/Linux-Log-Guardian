#!/usr/bin/env bash
# AbuseIPDB / OTX — analyzer icinde (threat_feed.c)
# Firehol icin: sudo bash scripts/install_threat_intel_stack.sh
#
#   sudo bash scripts/install_threat_feed_live.sh
#   sudo bash scripts/install_threat_feed_live.sh --api-only   # stack icinden
#   sudo env ABUSEIPDB_API_KEY='...' bash scripts/install_threat_feed_live.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/ipset_entries.sh
source "$ROOT/scripts/lib/ipset_entries.sh"

[[ "$(id -u)" -eq 0 ]] || { echo "[install_threat_feed_live] sudo gerekli" >&2; exit 1; }

API_ONLY=0
[[ "${1:-}" == "--api-only" ]] && API_ONLY=1

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
ENV_FILE="/etc/log-guardian/threat-feed.env"
DATA_DIR="/etc/log-guardian/data"

install -d -m 750 /etc/log-guardian "$DATA_DIR"

STATS="/etc/log-guardian/threat_feed_stats.json"
if [[ ! -f "$STATS" ]]; then
  printf '%s\n' '{"last_sync_ts":0,"last_applied":0,"last_skipped_whitelist":0,"last_failed":0,"total_iocs":0,"last_error":""}' >"$STATS"
  chmod 660 "$STATS"
  chown root:log-guardian "$STATS"
fi

if [[ ! -f "$ENV_FILE" ]]; then
  install -m 600 "$ROOT/examples/threat-feed.env.example" "$ENV_FILE"
  echo "[OK] sablon: $ENV_FILE — API anahtarlarini duzenleyin"
fi

patch_env() {
  local key="$1" val="${2:-}"
  [[ -z "$val" ]] && return 0
  if grep -qE "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >>"$ENV_FILE"
  fi
}
patch_env ABUSEIPDB_API_KEY "${ABUSEIPDB_API_KEY:-}"
patch_env OTX_API_KEY "${OTX_API_KEY:-}"
patch_env THREAT_FEED_API_KEY "${THREAT_FEED_API_KEY:-}"
chmod 600 "$ENV_FILE"

has_abuse=0 has_otx=0
grep -qE '^ABUSEIPDB_API_KEY=.+' "$ENV_FILE" 2>/dev/null && has_abuse=1
grep -qE '^THREAT_FEED_API_KEY=.+' "$ENV_FILE" 2>/dev/null && has_abuse=1
grep -qE '^OTX_API_KEY=.+' "$ENV_FILE" 2>/dev/null && has_otx=1

sources=""
[[ "$has_abuse" -eq 1 ]] && sources="abuseipdb"
[[ "$has_otx" -eq 1 ]] && sources="${sources:+$sources,}otx"

if [[ -z "$sources" ]]; then
  if [[ "$API_ONLY" -eq 1 ]]; then
    echo "[WARN] --api-only ama anahtar yok — atlandi" >&2
    exit 0
  fi
  # Zaten dolu ipset varsa gereksiz Firehol re-sync yapma (ag kopuklugunde uyarir)
  entries=$(ipset_v4_entry_count)
  if [[ "$entries" -ge 50 ]] && grep -qE '^THREAT_INTEL_PROD=1' "$CONF" 2>/dev/null; then
    echo "[OK] Firehol zaten kurulu (ipset=$entries) — API key bos, laptop icin yeterli"
    echo "  API sonra: sudo nano $ENV_FILE && sudo bash scripts/install_threat_feed_live.sh"
    bash "$ROOT/scripts/threat_intel_status.sh" 2>/dev/null || true
    exit 0
  fi
  echo "[INFO] API anahtari yok — Firehol katmani kuruluyor (key gerektirmez)"
  exec bash "$ROOT/scripts/install_threat_intel_stack.sh"
fi

[[ -f "$CONF" ]] || install -m 600 "$ROOT/rules.conf" "$CONF"

patch_kv() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$CONF" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$CONF"
  else
    echo "${key}=${val}" >>"$CONF"
  fi
}

patch_kv THREAT_FEED_ENABLED 1
if [[ -n "${THREAT_FEED_SOURCES:-}" ]]; then
  patch_kv THREAT_FEED_SOURCES "$THREAT_FEED_SOURCES"
elif [[ "$has_abuse" -eq 1 && "$has_otx" -eq 1 ]]; then
  patch_kv THREAT_FEED_SOURCES "abuseipdb"
  sources="abuseipdb"
  echo "[INFO] THREAT_FEED_SOURCES=abuseipdb (OTX yavas — ikisi de acik icin: THREAT_FEED_SOURCES=abuseipdb,otx)"
else
  patch_kv THREAT_FEED_SOURCES "$sources"
fi
patch_kv THREAT_FEED_INTERVAL_SEC "${THREAT_FEED_INTERVAL_SEC:-3600}"
patch_kv THREAT_FEED_USE_BAN_PIPELINE 1
patch_kv THREAT_FEED_MIN_SCORE "${THREAT_FEED_MIN_SCORE:-75}"
patch_kv THREAT_FEED_MAX_IPS "${THREAT_FEED_MAX_IPS:-5000}"
patch_kv THREAT_FEED_AUDIT "$DATA_DIR/threat-feed-audit.jsonl"

KDF='ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504'
if ! grep -qE '^ACCESS_PASSWORD_KDF=pbkdf2\$[0-9]+\$[0-9a-fA-F]+\$[0-9a-fA-F]{64}' "$CONF" 2>/dev/null; then
  sed -i '/^ACCESS_PASSWORD_KDF=/d' "$CONF" 2>/dev/null || true
  sed -i '/^ACCESS_PASSWORD_HASH=/d' "$CONF" 2>/dev/null || true
  printf '\n%s\n' "$KDF" >>"$CONF"
  echo "[OK] ACCESS_PASSWORD_KDF eklendi (servis cokmesin diye)"
fi
getent group log-guardian >/dev/null 2>&1 && chown root:log-guardian "$CONF" 2>/dev/null || true
chmod 640 "$CONF" 2>/dev/null || chmod 600 "$CONF"

echo "[OK] THREAT_FEED_ENABLED=1 sources=$sources"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
if [[ -x "$LG_BIN" ]]; then
  echo "[install_threat_feed_live] ilk threat-feed-sync (kaynak=$sources)..."
  echo "[INFO] AbuseIPDB indir + en fazla ${THREAT_FEED_MAX_IPS:-5000} ban — sessiz gorunebilir"
  echo "[INFO] OTX tam IPv4 export cok buyuk olabilir — ilk sync 5-15 dk normal"
  echo "[INFO] Baska terminal: sudo /usr/local/bin/log-guardian threat-feed-sync"
  t0=$(date +%s)
  sync_out=""
  if sync_out=$("$LG_BIN" threat-feed-sync 2>&1); then
    elapsed=$(($(date +%s) - t0))
    echo "[OK] threat-feed-sync ${elapsed}s"
    printf '%s\n' "$sync_out" | grep -E '^\{|^\[THREAT' | tail -3 || printf '%s\n' "$sync_out" | tail -3
  else
    echo "[WARN] threat-feed-sync basarisiz (${sources}):" >&2
    printf '%s\n' "$sync_out" | tail -5 >&2
    echo "  cozum: sudo bash scripts/upgrade_log_guardian_binary.sh" >&2
    echo "  veya sadece AbuseIPDB: rules.conf → THREAT_FEED_SOURCES=abuseipdb" >&2
  fi
else
  echo "[WARN] log-guardian binary yok" >&2
fi

systemctl reset-failed log-guardian 2>/dev/null || true
systemctl restart log-guardian 2>/dev/null || true
sleep 2
if ! systemctl is-active --quiet log-guardian 2>/dev/null; then
  echo "[WARN] log-guardian active degil — sudo bash scripts/fix_analyzer.sh" >&2
else
  echo "[OK] log-guardian active"
fi
echo "[OK] install_threat_feed_live tamam"
echo "  kanit: bash scripts/threat_feed_live_proof.sh"
