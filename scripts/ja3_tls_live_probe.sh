#!/usr/bin/env bash
# JA3 / TLS canli probe — ja3_cluster_proof icin
#   bash scripts/ja3_tls_live_probe.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-443}"
METRICS_PORT="${METRICS_PORT:-9091}"
OUT="${JA3_LIVE_PROBE_JSON:-$ROOT/.cache/ja3_live_probe.json}"
COUNT="${APT_SWARM_COUNT:-12}"
PAYLOAD="${APT_SWARM_PAYLOAD:-/?id=1%27+OR+1%3D1--}"

mkdir -p "$(dirname "$OUT")"

metrics_ja3_c2() {
  local raw
  raw=$(curl -sf --max-time 2 "http://127.0.0.1:${METRICS_PORT}/metrics" 2>/dev/null || true)
  if [[ -z "$raw" ]]; then
    echo "0"
    return
  fi
  echo "$raw" | awk '/^loganalyzer_ja3_c2_total\{/{print $2; exit}'
}

tls_ready=0
if command -v openssl >/dev/null 2>&1; then
  if timeout 4 openssl s_client -connect "${HOST}:${PORT}" -servername localhost </dev/null 2>/dev/null \
     | grep -qE "BEGIN CERTIFICATE|SSL-Session"; then
    tls_ready=1
  fi
fi

[[ -x ./tester ]] || make -s tester 2>/dev/null || true
TESTER="${ROOT}/tester"

ja3_before=$(metrics_ja3_c2)
ja3_sent=0
ja3_ok=0
ja3_note=""
if [[ -x "$TESTER" && "$tls_ready" -eq 1 ]]; then
  if "$TESTER" --mode ja3-test --host "$HOST" --port "$PORT" 2>/tmp/ja3_test.stderr; then
    ja3_ok=1
  fi
  if grep -qi "ClientHello gonderildi" /tmp/ja3_test.stderr 2>/dev/null; then
    ja3_sent=1
  fi
  ja3_note=$(tail -1 /tmp/ja3_test.stderr 2>/dev/null | tr -d '\n' || true)
elif [[ "$tls_ready" -eq 0 ]]; then
  ja3_note="TLS :${PORT} kapali — sudo bash scripts/nginx_tls_local_setup.sh"
else
  ja3_note="tester binary yok"
fi
sleep 2
ja3_after=$(metrics_ja3_c2)
ja3_delta=$((ja3_after - ja3_before))

https_sent=0
https_ok=0
if [[ "$tls_ready" -eq 1 ]] && command -v openssl >/dev/null 2>&1; then
  for i in $(seq 1 "$COUNT"); do
    fake_ip="10.99.$((i / 256)).$((i % 256))"
    resp=$(timeout 3 openssl s_client -connect "${HOST}:${PORT}" -servername localhost -quiet 2>/dev/null <<REQ || true
GET ${PAYLOAD} HTTP/1.1
Host: ${HOST}
X-Forwarded-For: ${fake_ip}
X-Real-IP: ${fake_ip}
User-Agent: sqlmap/1.8#stable (https://sqlmap.org)
Connection: close

REQ
)
    if [[ "$resp" == *"200 OK"* ]] || [[ "$resp" == *"log-guardian tls ok"* ]]; then
      https_ok=$((https_ok + 1))
    fi
    https_sent=$((https_sent + 1))
    sleep 0.15
  done
fi

live_pass=0
if [[ "$tls_ready" -eq 1 && "$ja3_sent" -eq 1 ]]; then
  live_pass=1
fi
if [[ "$ja3_delta" -gt 0 ]]; then
  live_pass=1
fi

export JA3_PROBE_NOTE="$ja3_note"
export JA3_PROBE_COUNT="$COUNT"
python3 - "$OUT" "$HOST" "$PORT" "$tls_ready" "$ja3_sent" "$ja3_ok" \
  "$ja3_before" "$ja3_after" "$ja3_delta" "$https_sent" "$https_ok" \
  "$live_pass" <<'PY'
import json, os, sys
from datetime import datetime, timezone
from pathlib import Path

def arg(i: int, default: str = "0") -> str:
    return sys.argv[i] if len(sys.argv) > i else default

out = Path(arg(1))
data = {
    "date": datetime.now(timezone.utc).isoformat(),
    "host": arg(2),
    "port": int(arg(3)),
    "tls_ready": int(arg(4)) == 1,
    "ja3_test": {
        "sent": int(arg(5)) == 1,
        "exit_ok": int(arg(6)) == 1,
        "metrics_before_c2": int(arg(7) or 0),
        "metrics_after_c2": int(arg(8) or 0),
        "metrics_delta_c2": int(arg(9) or 0),
        "note": os.environ.get("JA3_PROBE_NOTE", ""),
    },
    "https_swarm": {
        "sent": int(arg(10)),
        "ok": int(arg(11)),
        "count_target": int(os.environ.get("JA3_PROBE_COUNT", "12")),
        "payload": "/?id=1'+OR+1=1--",
    },
    "pass": int(arg(12)) == 1,
    "setup_hint": "sudo bash scripts/nginx_tls_local_setup.sh",
}
out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
print(f"[ja3_tls_live_probe] tls={data['tls_ready']} ja3_sent={data['ja3_test']['sent']} "
      f"delta_c2={data['ja3_test']['metrics_delta_c2']} https_ok={data['https_swarm']['ok']} "
      f"pass={data['pass']}")
PY

[[ "$live_pass" -eq 1 ]] || exit 1
