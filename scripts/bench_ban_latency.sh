#!/usr/bin/env bash
# Ban latency bench — tek seferlik kurulum + olcum
#   sudo bash scripts/bench_ban_latency.sh
#
# ipset doluysa (65536) bench icin otomatik flush yapar.
# Flush istemezseniz: BENCH_NO_FLUSH=1 sudo bash scripts/bench_ban_latency.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ $EUID -ne 0 ]]; then
  echo "[bench_ban_latency] root gerekli:" >&2
  echo "  sudo bash scripts/bench_ban_latency.sh" >&2
  exit 1
fi

TEST_IP="${BENCH_BAN_IP:-203.0.113.250}"
IPSET="${IPSET_NAME:-log_analyzer_block_v4}"
REPORT="${BENCH_BAN_REPORT:-bench-ban-latency.json}"
BENCH_AUTO_SETUP="${BENCH_AUTO_SETUP:-1}"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

if [[ -f /etc/log-guardian/env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /etc/log-guardian/env
  set +a
fi

IPSET_BIN="${BENCH_IPSET_BIN:-$(command -v ipset || true)}"
if [[ -z "$IPSET_BIN" ]]; then
  echo '{"error":"ipset not installed","ban_latency_ms":null}' | tee "$REPORT"
  exit 0
fi

make -j"$(nproc 2>/dev/null || echo 2)" -s log-guardian log-guardian-daemon >/dev/null
LG="$ROOT/log-guardian"
if install -m755 log-guardian log-guardian-daemon /usr/local/bin/ 2>/dev/null; then
  LG="/usr/local/bin/log-guardian"
else
  echo "[bench_ban_latency] /usr/local/bin install atlandi — $LG kullaniliyor"
fi

BENCH_RULES="$ROOT/.cache/bench_ban_rules.conf"
mkdir -p "$ROOT/.cache"
cat > "$BENCH_RULES" <<'RC'
ACCESS_PASSWORD_KDF=pbkdf2$100000$6560e0aa800d47957280cab9a1038847$b0c64cf98788c6921356411f05f1fbc60fbdf6a7e487b34124576866e97cb504
WAF_ENABLED=0
DB_ENABLED=0
WEBHOOK_ENABLED=0
METRICS_PORT=0
RC
chmod 600 "$BENCH_RULES"

ipset_entry_count() {
  "$IPSET_BIN" list "$IPSET" 2>/dev/null | awk '/Number of entries/ {print $4; exit}' | tr -d '\r\n' | head -1
}

ensure_ipset() {
  "$IPSET_BIN" create "$IPSET" hash:ip family inet maxelem 65536 -exist 2>/dev/null || true
}

ip_in_set() {
  "$IPSET_BIN" test "$IPSET" "$TEST_IP" >/dev/null 2>&1
}

prepare_ipset_for_bench() {
  local n probe_ip="241.0.0.254"
  ensure_ipset
  n=$(ipset_entry_count || echo 0)
  n="${n//[^0-9]/}"
  n="${n:-0}"
  if [[ "$n" -ge 65000 ]]; then
    echo "[bench_ban_latency] ipset dolu ($n/65536) — bench icin flush"
    if [[ "${BENCH_NO_FLUSH:-0}" == "1" ]]; then
      echo "[bench_ban_latency] BENCH_NO_FLUSH=1 — flush atlandi, bench yapilamaz" >&2
      return 1
    fi
    "$IPSET_BIN" flush "$IPSET"
    n=0
  fi
  if ! "$IPSET_BIN" add "$IPSET" "$probe_ip" -exist 2>/dev/null; then
    echo "[bench_ban_latency] ipset yazma testi basarisiz (Hash full?) — flush" >&2
    if [[ "${BENCH_NO_FLUSH:-0}" == "1" ]]; then
      return 1
    fi
    "$IPSET_BIN" flush "$IPSET"
  else
    "$IPSET_BIN" del "$IPSET" "$probe_ip" -exist 2>/dev/null || true
  fi
  "$IPSET_BIN" del "$IPSET" "$TEST_IP" -exist 2>/dev/null || true
  "$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
  n=$(ipset_entry_count || echo 0)
  echo "[bench_ban_latency] ipset hazir (entries=$n)"
}

run_ban_cli() {
  "$LG" ban "$TEST_IP" --rules "$BENCH_RULES" --reason "bench-latency" 2>&1
}

do_setup() {
  echo "[bench_ban_latency] Kurulum: IPC + daemon yenileme..."
  bash "$ROOT/scripts/fix_ipc_perms.sh"
  systemctl restart log-guardian-daemon
  sleep 2
  systemctl restart log-guardian 2>/dev/null || true
  sleep 1
}

preflight() {
  local ipc_ok=0 n
  if "$LG" --health --rules "$BENCH_RULES" -q 2>/dev/null; then
    ipc_ok=1
  fi
  n=$(ipset_entry_count || echo "?")
  echo "[bench_ban_latency] ipset=$IPSET_BIN entries=$n daemon=$(systemctl is-active log-guardian-daemon 2>/dev/null || echo '?') ipc=$ipc_ok"
}

preflight
prepare_ipset_for_bench
sleep 0.2

# Isinma — IPC + daemon yolu
"$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
"$IPSET_BIN" del "$IPSET" "$TEST_IP" -exist 2>/dev/null || true
run_ban_cli >/dev/null 2>&1 || true
"$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
"$IPSET_BIN" del "$IPSET" "$TEST_IP" -exist 2>/dev/null || true
sleep 0.05

measure_one_sample() {
  local start_ns end_ns deadline found=0
  "$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
  "$IPSET_BIN" del "$IPSET" "$TEST_IP" -exist 2>/dev/null || true
  sleep 0.02
  start_ns=$(date +%s%N)
  if ! run_ban_cli >/dev/null 2>&1; then
    return 1
  fi
  deadline=$(( $(date +%s) + 3 ))
  while [[ $(date +%s) -lt $deadline ]]; do
    if ip_in_set; then found=1; break; fi
    sleep 0.0005
  done
  end_ns=$(date +%s%N)
  [[ "$found" -eq 1 ]] || return 1
  LC_NUMERIC=C awk "BEGIN {printf \"%.2f\", ($end_ns - $start_ns) / 1000000}"
}

BENCH_SAMPLES="${BENCH_SAMPLES:-5}"
TARGET_MS="${BENCH_TARGET_MS:-75}"
PROD_TARGET_MS=50
LATENCIES=()
BAN_OK=0
BAN_PATH=""

for ((i = 1; i <= BENCH_SAMPLES; i++)); do
  lat=$(measure_one_sample) || continue
  LATENCIES+=("$lat")
  echo "[bench_ban_latency] ornek $i: ${lat} ms"
done

if [[ ${#LATENCIES[@]} -eq 0 ]]; then
  if [[ "$BENCH_AUTO_SETUP" == "1" ]]; then
    do_setup
    prepare_ipset_for_bench
    for ((i = 1; i <= BENCH_SAMPLES; i++)); do
      lat=$(measure_one_sample) || continue
      LATENCIES+=("$lat")
    done
  fi
fi

if [[ ${#LATENCIES[@]} -gt 0 ]]; then
  BAN_OK=1
  out=$(run_ban_cli 2>/dev/null || true)
  [[ "$out" == *"ipc-xdp"* ]] && BAN_PATH="ipc-xdp"
  [[ "$out" == *"ipset"* ]] && BAN_PATH="ipset"
fi

"$LG" unban "$TEST_IP" --rules "$BENCH_RULES" >/dev/null 2>&1 || true
"$IPSET_BIN" del "$IPSET" "$TEST_IP" -exist 2>/dev/null || true

if [[ "$BAN_OK" -ne 1 ]]; then
  n=$(ipset_entry_count || echo "?")
  python3 - "$n" <<PY | tee "$REPORT"
import json, datetime, sys
n = sys.argv[1]
print(json.dumps({
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "error": f"ban failed — ipset entries={n}/65536 (dolu olabilir)",
    "ban_latency_ms": None,
    "target_ms": 50,
    "hint": "sudo ipset flush log_analyzer_block_v4 && sudo bash scripts/bench_ban_latency.sh",
}, indent=2))
PY
  exit 1
fi

python3 - "$REPORT" "$TEST_IP" "$TARGET_MS" "$PROD_TARGET_MS" "$BAN_PATH" "${LATENCIES[@]}" <<'PY'
import json, sys, datetime, statistics
report, ip = sys.argv[1], sys.argv[2]
target_ms = float(sys.argv[3])
prod_target_ms = float(sys.argv[4])
ban_path = sys.argv[5] or "ipc-xdp"
samples = [float(x.replace(",", ".")) for x in sys.argv[6:]]
median = statistics.median(samples)
p90 = sorted(samples)[max(0, int(len(samples) * 0.9) - 1)] if samples else median
obj = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "test_ip": ip,
    "ban_latency_ms": round(median, 2),
    "median_ms": round(median, 2),
    "p90_ms": round(p90, 2),
    "samples_ms": [round(s, 2) for s in samples],
    "sample_count": len(samples),
    "ipset_confirmed": True,
    "target_ms": target_ms,
    "prod_target_ms": prod_target_ms,
    "pass": median <= target_ms,
    "ban_path": ban_path,
    "note": f"Median {median:.1f} ms ({ban_path}) — hedef <{target_ms:.0f} ms (laptop IPC); prod hedef <{prod_target_ms:.0f} ms",
}
with open(report, "w", encoding="utf-8") as f:
    json.dump(obj, f, indent=2)
print(json.dumps(obj, indent=2))
PY

echo "[bench_ban_latency] $REPORT"
