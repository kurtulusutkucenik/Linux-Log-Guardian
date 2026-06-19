#!/usr/bin/env bash
# Threat intel durumu — API key var mi? Firehol? Analyzer feed?
#   sudo bash scripts/threat_intel_status.sh   # tam okuma (onerilen)
#   bash scripts/threat_intel_status.sh        # sudo yoksa otomatik yeniden calisir
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=lib/ipset_entries.sh
source "$ROOT/scripts/lib/ipset_entries.sh"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
ENV_FILE="/etc/log-guardian/threat-feed.env"

need_root_read() {
  [[ -f "$CONF" && ! -r "$CONF" ]] && return 0
  [[ -f "$ENV_FILE" && ! -r "$ENV_FILE" ]] && return 0
  command -v ipset >/dev/null 2>&1 || return 0
  ipset list log_analyzer_block_v4 &>/dev/null || return 0
  return 1
}
if need_root_read && [[ "$(id -u)" -ne 0 ]]; then
  echo "[INFO] tam durum icin sudo — yeniden calistiriliyor..."
  exec sudo bash "$0" "$@"
fi

echo "=== threat_intel_status ==="
echo ""

abuse=0 otx=0

# --- threat-feed.env ---
if [[ ! -f "$ENV_FILE" ]]; then
  echo "threat-feed.env : YOK"
  echo "  -> sudo bash scripts/install_threat_intel_stack.sh"
else
  echo "threat-feed.env : VAR ($(stat -c '%a' "$ENV_FILE" 2>/dev/null || echo ?))"
  grep -qE '^(ABUSEIPDB_API_KEY|THREAT_FEED_API_KEY)=.+' "$ENV_FILE" 2>/dev/null && abuse=1
  grep -qE '^OTX_API_KEY=.+' "$ENV_FILE" 2>/dev/null && otx=1
  if [[ "$abuse" -eq 1 ]]; then
    echo "  AbuseIPDB key : EVET"
  else
    echo "  AbuseIPDB key : HAYIR (bos — Firehol-only OK)"
  fi
  if [[ "$otx" -eq 1 ]]; then
    echo "  OTX key       : EVET"
  else
    echo "  OTX key       : HAYIR (bos — Firehol-only OK)"
  fi
fi

echo ""

# --- Firehol katmani ---
timer=0
if command -v systemctl >/dev/null 2>&1; then
  systemctl is-active log-guardian-threatintel.timer &>/dev/null && timer=1
fi
entries=$(ipset_v4_entry_count)
intel_prod=0
[[ -f "$CONF" ]] && grep -qE '^THREAT_INTEL_PROD=1' "$CONF" 2>/dev/null && intel_prod=1

echo "Firehol (threat_intel.sh):"
echo "  THREAT_INTEL_PROD : $([[ $intel_prod -eq 1 ]] && echo EVET || echo HAYIR)"
echo "  timer aktif       : $([[ $timer -eq 1 ]] && echo EVET || echo HAYIR)"
echo "  ipset entries     : $entries"
if [[ "$entries" -ge 50 ]]; then
  echo "  durum             : CANLI (ipset dolu)"
elif [[ "$timer" -eq 1 ]]; then
  echo "  durum             : TIMER VAR, ipset bos — sync gerekli"
  echo "  -> sudo bash scripts/enable_threat_intel_prod.sh"
else
  echo "  durum             : KURULU DEGIL"
  echo "  -> sudo bash scripts/install_threat_intel_stack.sh"
fi

echo ""

# --- Analyzer API feed ---
feed_en=0 sources=""
[[ -f "$CONF" ]] && grep -qE '^THREAT_FEED_ENABLED=1' "$CONF" 2>/dev/null && feed_en=1
[[ -f "$CONF" ]] && sources=$(grep -E '^THREAT_FEED_SOURCES=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

echo "AbuseIPDB/OTX (threat_feed.c):"
echo "  THREAT_FEED_ENABLED : $([[ $feed_en -eq 1 ]] && echo 1 || echo 0)"
echo "  THREAT_FEED_SOURCES : ${sources:-—}"
if [[ "$feed_en" -eq 1 ]]; then
  echo "  durum               : AYARLI (log-guardian threat-feed-sync)"
elif [[ "$abuse" -eq 1 || "${otx:-0}" -eq 1 ]]; then
  echo "  durum               : KEY VAR, rules.conf eksik"
  echo "  -> sudo bash scripts/install_threat_feed_live.sh"
else
  echo "  durum               : KAPALI (API key yok — normal, Firehol yeter)"
  echo "  threat-feed-sync ERR beklenen davranis"
fi

echo ""
echo "Tek komut kurulum (Firehol, key gerektirmez):"
echo "  sudo bash scripts/install_threat_intel_stack.sh"
echo "Kanıt:"
echo "  sudo bash scripts/threat_feed_live_proof.sh"
