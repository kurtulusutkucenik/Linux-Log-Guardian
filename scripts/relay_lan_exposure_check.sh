#!/usr/bin/env bash
# Host/LAN'dan relay ve API portlari siziyor mu? (internet-facing oncesi)
#   bash scripts/relay_lan_exposure_check.sh
#   JSON: relay-lan-exposure-report.json
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${RELAY_LAN_REPORT:-relay-lan-exposure-report.json}"

fail=0
warn_n=0
items_tsv="$(mktemp)"
trap 'rm -f "$items_tsv"' EXIT

_add() {
  local level="$1" msg="$2"
  printf '%s\t%s\n' "$level" "$msg" >>"$items_tsv"
  case "$level" in
    ok) echo "[OK] $msg" ;;
    fail) echo "[FAIL] $msg"; fail=$((fail + 1)) ;;
    warn) echo "[WARN] $msg"; warn_n=$((warn_n + 1)) ;;
  esac
}

echo "=== relay_lan_exposure_check ==="

lan_ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
[[ -z "$lan_ip" ]] && lan_ip="127.0.0.1"

docker0_ip="172.17.0.1"
if command -v ip >/dev/null 2>&1; then
  docker0_ip="$(ip -4 addr show docker0 2>/dev/null | awk '/inet / {split($2,a,"/"); print a[1]; exit}' || true)"
  [[ -z "$docker0_ip" ]] && docker0_ip="172.17.0.1"
fi

host_api_bridge_up=0
if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'log-guardian-host-api-bridge'; then
  host_api_bridge_up=1
fi

# Host'ta 18090/19091 dinleniyor mu? (docker internal relay olmali — host'ta yok)
for port in 18090 19091; do
  if command -v ss >/dev/null 2>&1; then
    if ss -tln 2>/dev/null | grep -qE ":${port}\b"; then
      bind_line="$(ss -tln 2>/dev/null | grep -E ":${port}\b" | head -1)"
      if echo "$bind_line" | grep -qE '127\.0\.0\.1:'; then
        _add ok "host :${port} yalnizca loopback ($bind_line)"
      else
        _add fail "host :${port} disari acik — docker relay host network veya bind=0.0.0.0 ($bind_line)"
      fi
    else
      _add ok "host :${port} dinlenmiyor (docker internal relay OK)"
    fi
  fi
done

# host-api-bridge docker0 hop — yalnizca bridge IP'de dinlemeli (18091 ban, 19092 metrics)
for port in 18091 19092; do
  if ! command -v ss >/dev/null 2>&1; then
    continue
  fi
  if ! ss -tln 2>/dev/null | grep -qE ":${port}\b"; then
    if [[ "$host_api_bridge_up" == "1" ]]; then
      _add warn "host-api-bridge ayakta ama :${port} dinlenmiyor"
    else
      _add ok "host :${port} dinlenmiyor (host-api-bridge kapali)"
    fi
    continue
  fi
  while IFS= read -r bind_line; do
    [[ -z "$bind_line" ]] && continue
    local_addr="$(echo "$bind_line" | awk '{print $4}')"
    if echo "$local_addr" | grep -qE '^\*:|\[::\]:|^0\.0\.0\.0:'; then
      _add fail "host :${port} 0.0.0.0 bind — LAN sizintisi (local=${local_addr})"
    elif echo "$local_addr" | grep -qE "${docker0_ip//./\\.}:"; then
      _add ok "host :${port} yalnizca docker0 ${docker0_ip} (local=${local_addr})"
    elif echo "$local_addr" | grep -qE '127\.0\.0\.1:'; then
      _add ok "host :${port} loopback (local=${local_addr})"
    elif [[ "$lan_ip" != "127.0.0.1" ]] && echo "$local_addr" | grep -qE "${lan_ip//./\\.}:"; then
      _add fail "host :${port} LAN IP bind (local=${local_addr})"
    else
      _add warn "host :${port} beklenmeyen bind (local=${local_addr})"
    fi
  done < <(ss -tln 2>/dev/null | grep -E ":${port}\b" || true)
done

# LAN'dan metrics/ban relay erisimi
for port in 8090 9091 18090 19091 18091 19092; do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 \
    "http://${lan_ip}:${port}/api/v1/metrics" 2>/dev/null || echo 000)"
  if [[ "$code" == "200" ]]; then
    _add fail "LAN ${lan_ip}:${port}/metrics tokensiz 200 — API sizintisi"
  elif [[ "$code" == "403" ]]; then
    _add warn "LAN ${lan_ip}:${port} yanit veriyor (403) — firewall ile kapat"
  else
    _add ok "LAN ${lan_ip}:${port} erisilemiyor (code=$code)"
  fi
done

python3 - "$ROOT" "$REPORT" "$fail" "$warn_n" "$lan_ip" "$docker0_ip" "$host_api_bridge_up" "$items_tsv" <<'PY'
import datetime
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
report_path = Path(sys.argv[2])
fail_n = int(sys.argv[3])
warn_n = int(sys.argv[4])
checks = []
for line in Path(sys.argv[8]).read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    level, msg = line.split("\t", 1)
    checks.append({"level": level, "msg": msg})

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": fail_n == 0,
    "fail_count": fail_n,
    "warn_count": warn_n,
    "lan_ip": sys.argv[5],
    "docker0_ip": sys.argv[6],
    "host_api_bridge_up": sys.argv[7] == "1",
    "checks": checks,
    "script": "scripts/relay_lan_exposure_check.sh",
}
report_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

if [[ "$fail" -eq 0 ]]; then
  echo "[OK] relay_lan_exposure_check — $REPORT"
  exit 0
fi
echo "[FAIL] relay_lan_exposure_check — $fail madde — $REPORT" >&2
exit 1
