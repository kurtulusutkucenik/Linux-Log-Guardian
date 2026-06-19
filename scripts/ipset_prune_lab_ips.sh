#!/usr/bin/env bash
# Test/lab IP'lerini ipset'ten temizle (RFC5737 + benchmark bloklari)
#   bash scripts/ipset_prune_lab_ips.sh          # dry-run
#   bash scripts/ipset_prune_lab_ips.sh --apply  # unban uygula
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SET="${LG_IPSET_V4:-log_analyzer_block_v4}"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

LG_BIN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_BIN" ]] || LG_BIN="$ROOT/log-guardian"
CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
TOK=""
[[ -f "$CONF" ]] && TOK=$(grep -E '^API_TOKEN=' "$CONF" 2>/dev/null | tail -1 | cut -d= -f2- || true)

IPSET_CMD=(ipset)
if ! ipset list "$SET" &>/dev/null; then
  if command -v sudo >/dev/null && sudo ipset list "$SET" &>/dev/null; then
    IPSET_CMD=(sudo ipset)
  else
    echo "[ipset_prune_lab] FAIL: ipset $SET yok — sudo ile deneyin" >&2
    exit 1
  fi
fi

is_lab_ip() {
  local ip="$1"
  [[ "$ip" =~ ^203\.0\.113\. ]] && return 0
  [[ "$ip" =~ ^198\.51\.100\. ]] && return 0
  [[ "$ip" =~ ^198\.18\. ]] && return 0
  [[ "$ip" =~ ^10\.99\.0\. ]] && return 0
  return 1
}

mapfile -t ALL < <("${IPSET_CMD[@]}" list "$SET" -o plain 2>/dev/null | awk '/^[0-9]/{print $1}')
LAB=()
for ip in "${ALL[@]}"; do
  is_lab_ip "$ip" && LAB+=("$ip")
done

before=${#ALL[@]}
count=${#LAB[@]}
echo "[ipset_prune_lab] set=$SET total=$before lab=$count"

if [[ "$count" -eq 0 ]]; then
  echo "[OK] temizlenecek lab IP yok"
  exit 0
fi

if [[ "$APPLY" -eq 0 ]]; then
  echo "[dry-run] Ornek (ilk 10): ${LAB[*]:0:10}"
  echo "Uygula: sudo bash scripts/ipset_prune_lab_ips.sh --apply"
  exit 0
fi

removed=0
failed=0
for ip in "${LAB[@]}"; do
  ok=0
  if [[ -n "$TOK" ]] && curl -sf -X POST -H "Authorization: Bearer $TOK" \
    "http://127.0.0.1:8090/api/v1/unban?ip=${ip}" >/dev/null 2>&1; then
    ok=1
  elif [[ -x "$LG_BIN" ]]; then
    if "$LG_BIN" unban "$ip" --rules "$CONF" 2>/dev/null | grep -q '\[OK\]'; then
      ok=1
    fi
  elif "${IPSET_CMD[@]}" del "$SET" "$ip" -exist 2>/dev/null; then
    ok=1
  fi
  if [[ "$ok" -eq 1 ]]; then
    removed=$((removed + 1))
  else
    failed=$((failed + 1))
  fi
done

after=$("${IPSET_CMD[@]}" list "$SET" -o plain 2>/dev/null | awk '/^[0-9]/{c++} END{print c+0}')
echo "[OK] kaldirilan=$removed basarisiz=$failed kalan=$after (once $before)"
[[ "$failed" -eq 0 ]]
