#!/usr/bin/env bash
# Host/LAN'dan relay ve API portlari siziyor mu? (internet-facing oncesi)
#   bash scripts/relay_lan_exposure_check.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "[OK] $*"; }
bad() { echo "[FAIL] $*"; fail=$((fail + 1)); }
warn() { echo "[WARN] $*"; }

echo "=== relay_lan_exposure_check ==="

lan_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
[[ -z "$lan_ip" ]] && lan_ip="127.0.0.1"

# Host'ta 18090/19091 dinleniyor mu? (docker internal relay olmali — host'ta yok)
for port in 18090 19091; do
  if command -v ss >/dev/null 2>&1; then
    if ss -tln 2>/dev/null | grep -qE ":${port}\b"; then
      bind_line="$(ss -tln 2>/dev/null | grep -E ":${port}\b" | head -1)"
      if echo "$bind_line" | grep -qE '127\.0\.0\.1:'; then
        ok "host :${port} yalnizca loopback ($bind_line)"
      else
        bad "host :${port} disari acik — docker relay host network veya bind=0.0.0.0 ($bind_line)"
      fi
    else
      ok "host :${port} dinlenmiyor (docker internal relay OK)"
    fi
  fi
done

# LAN'dan metrics/ban relay erisimi
for port in 8090 9091 18090 19091; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "http://${lan_ip}:${port}/api/v1/metrics" 2>/dev/null || echo 000)"
  if [[ "$code" == "200" ]]; then
    bad "LAN ${lan_ip}:${port}/metrics tokensiz 200 — API sizintisi"
  elif [[ "$code" == "403" ]]; then
    warn "LAN ${lan_ip}:${port} yanit veriyor (403) — firewall ile kapat"
  else
    ok "LAN ${lan_ip}:${port} erisilemiyor (code=$code)"
  fi
done

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] relay_lan_exposure_check"
  exit 0
fi
echo "[FAIL] relay_lan_exposure_check — $fail madde" >&2
exit 1
