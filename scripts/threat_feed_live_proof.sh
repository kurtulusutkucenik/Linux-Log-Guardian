#!/usr/bin/env bash
# Threat intel kanit — Firehol ipset + opsiyonel AbuseIPDB/OTX
#   bash scripts/threat_feed_live_proof.sh
#   sudo bash scripts/threat_feed_live_proof.sh   # bos ipset ise sync dener
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/ipset_entries.sh
source "$ROOT/scripts/lib/ipset_entries.sh"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${THREAT_FEED_LIVE_REPORT:-threat-feed-live-report.json}"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
ENV_FILE="/etc/log-guardian/threat-feed.env"
LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
TI_BIN="${TI_BIN:-/usr/local/bin/log-guardian-threatintel}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
[[ -x "$TI_BIN" ]] || TI_BIN="$ROOT/threat_intel.sh"

fail() { echo "[threat_feed_live] FAIL: $*" >&2; exit 1; }

# ipset + rules.conf (640/600) + threat-feed.env (600) root okur
need_root_read() {
  [[ -f "$CONF" && ! -r "$CONF" ]] && return 0
  [[ -f "$ENV_FILE" && ! -r "$ENV_FILE" ]] && return 0
  command -v ipset >/dev/null 2>&1 || return 0
  ipset list log_analyzer_block_v4 &>/dev/null || return 0
  return 1
}
if need_root_read && [[ "$(id -u)" -ne 0 ]]; then
  echo "[INFO] dogru sonuc icin sudo gerekli (ipset/rules.conf/threat-feed.env)"
  exec sudo -E LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}" \
    bash "$0" "$@"
fi

echo "=== threat_feed_live_proof ==="

feed_enabled=0 feed_sources="" abuse_key=0 otx_key=0 env_exists=0
firehol_timer=0 firehol_entries=0 intel_prod=0
sync_applied=0 sync_failed=0 firehol_sync_ran=0

[[ -f "$CONF" ]] || CONF="$ROOT/rules.conf"
[[ -f "$ENV_FILE" ]] && env_exists=1

if [[ -f "$CONF" ]]; then
  grep -qE '^THREAT_FEED_ENABLED=1' "$CONF" 2>/dev/null && feed_enabled=1
  feed_sources=$(grep -E '^THREAT_FEED_SOURCES=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)
  grep -qE '^THREAT_INTEL_PROD=1' "$CONF" 2>/dev/null && intel_prod=1
fi

if [[ -f "$ENV_FILE" ]]; then
  grep -qE '^(ABUSEIPDB_API_KEY|THREAT_FEED_API_KEY)=.+' "$ENV_FILE" 2>/dev/null && abuse_key=1
  grep -qE '^OTX_API_KEY=.+' "$ENV_FILE" 2>/dev/null && otx_key=1
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl is-active log-guardian-threatintel.timer &>/dev/null && firehol_timer=1
fi

firehol_entries=$(ipset_v4_entry_count | tr -d '[:space:]')
firehol_entries=$((firehol_entries + 0))
MIN_FIREHOL="${THREAT_INTEL_MIN_LIVE_IPSET:-50}"

# Bos ipset + root → bir kez Firehol sync dene
if [[ "$(id -u)" -eq 0 && "${firehol_entries:-0}" -lt "$MIN_FIREHOL" && -x "$TI_BIN" ]]; then
  echo "[INFO] ipset bos ($firehol_entries) — Firehol sync deneniyor..."
  if bash "$TI_BIN" /etc/log-guardian/events.db 2>&1 | tail -5; then
    firehol_sync_ran=1
    firehol_entries=$(ipset_v4_entry_count)
    echo "[INFO] sync sonrasi ipset entries=$firehol_entries"
  fi
fi

api_live=0
if [[ "$feed_enabled" -eq 1 && -x "$LG_BIN" ]] && [[ "$abuse_key" -eq 1 || "$otx_key" -eq 1 ]]; then
  echo "[INFO] threat-feed-sync..."
  if out=$("$LG_BIN" threat-feed-sync 2>/dev/null); then
    sync_applied=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('applied',0))" "$out" 2>/dev/null || echo 0)
    sync_failed=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('failed',0))" "$out" 2>/dev/null || echo 0)
    echo "  applied=$sync_applied failed=$sync_failed"
    [[ "${sync_applied:-0}" -gt 0 ]] && api_live=1
  else
    echo "[WARN] threat-feed-sync basarisiz (binary guncel mi?)" >&2
  fi
elif [[ "$abuse_key" -eq 0 && "$otx_key" -eq 0 ]]; then
  echo "[INFO] API key yok — Firehol katmani yeterli (AbuseIPDB/OTX kapali)"
elif [[ "$feed_enabled" -eq 0 ]]; then
  echo "[INFO] API key var ama THREAT_FEED_ENABLED=0 — sudo bash scripts/install_threat_feed_live.sh"
fi

# Ikinci sync applied=0 olabilir (IP zaten ipset'te) — metrik/audit ile canli say
if [[ "$api_live" -eq 0 && "$feed_enabled" -eq 1 && ($abuse_key -eq 1 || $otx_key -eq 1) ]]; then
  mport="${METRICS_PORT:-9091}"
  if m=$(curl -sf --max-time 2 "http://127.0.0.1:${mport}/metrics" 2>/dev/null); then
    if grep -q 'loganalyzer_threat_feed_enabled{tenant_id="default"} 1' <<<"$m" 2>/dev/null; then
      iocs=$(grep -oE 'loganalyzer_threat_total_iocs\{[^}]*\} [0-9]+' <<<"$m" | awk '{print $2}' | tail -1)
      [[ "${iocs:-0}" -gt 0 ]] && api_live=1 && echo "[INFO] API feed metrikten canli (total_iocs=$iocs)"
    fi
  fi
  audit="/etc/log-guardian/data/threat-feed-audit.jsonl"
  if [[ "$api_live" -eq 0 && -r "$audit" ]] && [[ $(wc -l <"$audit" 2>/dev/null || echo 0) -gt 0 ]]; then
    api_live=1
    echo "[INFO] API feed audit dosyasindan canli ($audit)"
  fi
fi

firehol_live=0
[[ "${firehol_entries:-0}" -ge "$MIN_FIREHOL" ]] && firehol_live=1

# Mod: firehol_only | api | both | none
mode="none"
if [[ "$firehol_live" -eq 1 && "$api_live" -eq 1 ]]; then mode="both"
elif [[ "$firehol_live" -eq 1 ]]; then mode="firehol_only"
elif [[ "$api_live" -eq 1 ]]; then mode="api_only"
elif [[ "$firehol_timer" -eq 1 && "$intel_prod" -eq 1 ]]; then mode="firehol_pending"
fi

pass=false
[[ "$firehol_live" -eq 1 || "$api_live" -eq 1 ]] && pass=true

echo ""
echo "Ozet:"
echo "  mod              : $mode"
echo "  firehol ipset    : $firehol_entries (canli icin >=$MIN_FIREHOL)"
echo "  firehol timer    : $([[ $firehol_timer -eq 1 ]] && echo aktif || echo kapali)"
echo "  API feed         : $([[ $feed_enabled -eq 1 ]] && echo enabled || echo kapali)"
echo "  API keys         : abuse=$abuse_key otx=$otx_key"

export TFL_PASS=0 TFL_MODE="$mode"
export TFL_FIREHOL_TIMER="$firehol_timer" TFL_FIREHOL_ENTRIES="${firehol_entries:-0}"
export TFL_FIREHOL_LIVE="$firehol_live" TFL_INTEL_PROD="$intel_prod"
export TFL_FEED_ENABLED="$feed_enabled" TFL_FEED_SOURCES="${feed_sources}"
export TFL_ABUSE_KEY="$abuse_key" TFL_OTX_KEY="$otx_key" TFL_ENV_EXISTS="$env_exists"
export TFL_SYNC_APPLIED="${sync_applied:-0}" TFL_SYNC_FAILED="${sync_failed:-0}"
export TFL_API_LIVE="$api_live" TFL_FIREHOL_SYNC_RAN="$firehol_sync_ran"
[[ "$pass" == true ]] && TFL_PASS=1

python3 - "$REPORT" <<'PY'
import json, os, sys
from datetime import datetime, timezone

def b(k):
    return os.environ.get(k, "0") == "1"

report_path = sys.argv[1]
obj = {
    "ts": datetime.now(timezone.utc).isoformat(),
    "pass": b("TFL_PASS"),
    "mode": os.environ.get("TFL_MODE", "none"),
    "firehol": {
        "prod_marker": b("TFL_INTEL_PROD"),
        "timer_active": b("TFL_FIREHOL_TIMER"),
        "ipset_entries": int(os.environ.get("TFL_FIREHOL_ENTRIES", "0") or 0),
        "live": b("TFL_FIREHOL_LIVE"),
        "sync_attempted": b("TFL_FIREHOL_SYNC_RAN"),
    },
    "api_feed": {
        "env_file": b("TFL_ENV_EXISTS"),
        "enabled": b("TFL_FEED_ENABLED"),
        "sources": os.environ.get("TFL_FEED_SOURCES", ""),
        "abuseipdb_key": b("TFL_ABUSE_KEY"),
        "otx_key": b("TFL_OTX_KEY"),
        "last_sync_applied": int(os.environ.get("TFL_SYNC_APPLIED", "0") or 0),
        "last_sync_failed": int(os.environ.get("TFL_SYNC_FAILED", "0") or 0),
        "live": b("TFL_API_LIVE"),
    },
    "notes": "pass=ipset>=50 veya API sync>0; timer tek basina live sayilmaz",
}
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)
print(f"[OK] -> {report_path} pass={obj['pass']} mode={obj['mode']}")
PY

if [[ "$pass" != true ]]; then
  echo "" >&2
  echo "COZUM:" >&2
  echo "  sudo bash scripts/install_threat_intel_stack.sh" >&2
  [[ "$abuse_key" -eq 1 || "$otx_key" -eq 1 ]] && \
    echo "  sudo bash scripts/install_threat_feed_live.sh" >&2
  fail "Firehol ipset bos ve API feed yok — yukaridaki komutu calistir"
fi
echo "[OK] threat_feed_live_proof"
