#!/usr/bin/env bash
# Threat intel prod bootstrap — timer + ilk sync
#   sudo bash scripts/enable_threat_intel_prod.sh
#   THREAT_INTEL_FIXTURE=corpus/fixtures/firehol_sample.netset sudo bash scripts/enable_threat_intel_prod.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "sudo ile calistirin: sudo bash scripts/enable_threat_intel_prod.sh" >&2
  exit 1
fi

echo "=== enable_threat_intel_prod ==="

PREFIX="${PREFIX:-/usr/local}"
install -m 755 "$ROOT/threat_intel.sh" "$PREFIX/bin/log-guardian-threatintel"
echo "[OK] log-guardian-threatintel -> $PREFIX/bin/log-guardian-threatintel"

bash "$ROOT/scripts/merge_threat_intel_prod.sh"

if command -v systemctl >/dev/null 2>&1; then
  systemctl daemon-reload 2>/dev/null || true
  systemctl enable log-guardian-threatintel.timer 2>/dev/null || true
  systemctl start log-guardian-threatintel.timer 2>/dev/null || true
  if systemctl is-active log-guardian-threatintel.timer >/dev/null 2>&1; then
    echo "[OK] log-guardian-threatintel.timer aktif"
  else
    echo "[WARN] timer baslatilamadi — systemctl status log-guardian-threatintel.timer" >&2
  fi
fi

# ipset tipi hash:net (firewall.c ile uyumlu)
if command -v ipset >/dev/null 2>&1; then
  if ipset list log_analyzer_block_v4 &>/dev/null; then
    typ=$(set +o pipefail; ipset list log_analyzer_block_v4 2>/dev/null | awk '/^Type:/ {print $2; exit}' || true)
    if [[ "$typ" != "hash:net" ]]; then
      echo "[WARN] ipset tipi $typ — onarim: sudo bash scripts/repair_ipset_v4.sh" >&2
    else
      echo "[OK] ipset log_analyzer_block_v4 type=hash:net"
    fi
  else
    ipset create log_analyzer_block_v4 hash:net maxelem 65536 -exist 2>/dev/null || true
    echo "[OK] ipset log_analyzer_block_v4 olusturuldu (hash:net)"
  fi
fi

SYNC_MODE="live"
if [[ -n "${THREAT_INTEL_FIXTURE:-}" ]]; then
  SYNC_MODE="fixture"
elif [[ "${THREAT_INTEL_OFFLINE:-0}" == "1" ]]; then
  THREAT_INTEL_FIXTURE="${THREAT_INTEL_FIXTURE:-corpus/fixtures/firehol_sample.netset}"
  SYNC_MODE="fixture"
fi

if [[ "$SYNC_MODE" == "fixture" && -f "${THREAT_INTEL_FIXTURE:-}" ]]; then
  echo "[INFO] fixture sync: $THREAT_INTEL_FIXTURE"
  THREAT_INTEL_FIXTURE="$THREAT_INTEL_FIXTURE" bash "$ROOT/scripts/threat_intel_sync_proof.sh" || true
else
  echo "[INFO] canli Firehol sync..."
  if bash "$PREFIX/bin/log-guardian-threatintel" /etc/log-guardian/events.db; then
    echo "[OK] threat intel sync tamam"
  else
    echo "[WARN] canli sync basarisiz — fixture ile tekrar deneyin:" >&2
    echo "  THREAT_INTEL_FIXTURE=corpus/fixtures/firehol_sample.netset sudo bash scripts/enable_threat_intel_prod.sh" >&2
    THREAT_INTEL_FIXTURE="${ROOT}/corpus/fixtures/firehol_sample.netset"
    if [[ -f "$THREAT_INTEL_FIXTURE" ]]; then
      THREAT_INTEL_FIXTURE="$THREAT_INTEL_FIXTURE" bash "$ROOT/scripts/threat_intel_sync_proof.sh" || true
    fi
  fi
fi

if [[ "${SKIP_API_FEED_INSTALL:-0}" != "1" ]] && \
   [[ -f /etc/log-guardian/threat-feed.env ]] && \
   grep -qE '^(ABUSEIPDB_API_KEY|THREAT_FEED_API_KEY|OTX_API_KEY)=.+' /etc/log-guardian/threat-feed.env 2>/dev/null; then
  echo "[INFO] API anahtarlari var — threat feed live..."
  bash "$ROOT/scripts/install_threat_feed_live.sh" --api-only 2>/dev/null || \
    echo "[WARN] install_threat_feed_live atlandi — sudo bash scripts/install_threat_feed_live.sh" >&2
fi

echo "[OK] enable_threat_intel_prod tamam"
echo "  kanit: sudo bash scripts/threat_intel_prod_proof.sh"
echo "  API feed: bash scripts/threat_feed_live_proof.sh"
