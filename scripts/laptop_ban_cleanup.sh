#!/usr/bin/env bash
# Laptop demo — ipset/API ban temizligi
#   bash scripts/laptop_ban_cleanup.sh              # dry-run (API -> active_bans -> ipset)
#   APPLY=1 bash scripts/laptop_ban_cleanup.sh      # tek tek unban
#   FLUSH=1 bash scripts/laptop_ban_cleanup.sh      # ipset flush + dashboard cache (onay ister)
# Not: repair_ipset_v4 ban TEMIZLEMEZ — DB'den geri yukler.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh" 2>/dev/null || true

APPLY="${APPLY:-0}"
FLUSH="${FLUSH:-0}"
IPSET="${IPSET_NAME:-log_analyzer_block_v4}"
PORT="$(read_lg_api_port)"
BASE="http://127.0.0.1:${PORT}"
TOK="$(read_lg_api_token 2>/dev/null || true)"

if [[ -z "$TOK" ]]; then
  echo "[laptop_ban_cleanup] FAIL: API_TOKEN yok — sudo bash scripts/ensure_api_security.sh" >&2
  exit 1
fi

if ! curl -sf --max-time 2 -H "Authorization: Bearer $TOK" "${BASE}/api/v1/metrics" >/dev/null; then
  echo "[laptop_ban_cleanup] FAIL: API yanit vermiyor (:${PORT})" >&2
  exit 1
fi

collect_ips_from_json() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  python3 - "$f" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except (OSError, json.JSONDecodeError):
    raise SystemExit(0)
for row in d.get("ips") or d.get("bans") or []:
    ip = row if isinstance(row, str) else (row.get("ip") or row.get("value") or "")
    ip = str(ip).strip()
    if ip and "." in ip:
        print(ip)
PY
}

collect_ips_from_ipset() {
  local raw=""
  if raw=$(ipset list "$IPSET" -o plain 2>/dev/null); then
    :
  elif raw=$(sudo -n ipset list "$IPSET" -o plain 2>/dev/null); then
    :
  else
    return 0
  fi
  while IFS= read -r line; do
    ip="${line%% *}"
    [[ "$ip" == *.* ]] && echo "$ip"
  done <<< "$raw"
}

collect_ips() {
  local -a seen=()
  local ip src

  add_unique() {
    local x="$1"
    [[ -z "$x" ]] && return
    local s
    for s in "${seen[@]:-}"; do
      [[ "$s" == "$x" ]] && return
    done
    seen+=("$x")
    echo "$x"
  }

  # 1) API
  while IFS= read -r ip; do
    [[ -n "$ip" ]] && add_unique "$ip"
  done < <(
    curl -sf --max-time 5 -H "Authorization: Bearer $TOK" "${BASE}/api/v1/bans" \
      | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except json.JSONDecodeError:
    sys.exit(0)
for row in d if isinstance(d,list) else d.get('bans',[]) or d.get('ips',[]) or []:
    ip = row if isinstance(row,str) else (row.get('ip') or row.get('value') or '')
    ip = str(ip).strip()
    if ip and '.' in ip:
        print(ip)
" 2>/dev/null || true
  )

  # 2) daemon export
  for f in /run/log-guardian/active_bans.json "$ROOT/.cache/dashboard-live/active_bans.json"; do
    while IFS= read -r ip; do
      [[ -n "$ip" ]] && add_unique "$ip"
    done < <(collect_ips_from_json "$f")
  done

  # 3) ipset (API bos olsa bile)
  while IFS= read -r ip; do
    [[ -n "$ip" ]] && add_unique "$ip"
  done < <(collect_ips_from_ipset)
}

if [[ "$FLUSH" == "1" ]]; then
  echo "[laptop_ban_cleanup] FLUSH=1 — ipset sifirlaniyor ($IPSET)"
  if [[ $EUID -ne 0 ]]; then
    sudo ipset flush "$IPSET"
    sudo FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
  else
    ipset flush "$IPSET"
    FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
  fi
  LG_FORCE_EMPTY_BANS=1 bash "$ROOT/scripts/sync_dashboard_data.sh" \
    | grep -E 'active_bans|sync\] OK' || true
  echo "[OK] laptop_ban_cleanup — ipset bos, dashboard kanit onizleme"
  echo "[INFO] repair_ipset_v4 DB banlari geri yukler — FLUSH sonrasi calistirma"
  exit 0
fi

mapfile -t IPS < <(collect_ips)

if [[ "${#IPS[@]}" -eq 0 ]]; then
  echo "[OK] laptop_ban_cleanup — 0 aktif ban (API + ipset)"
  exit 0
fi

echo "[laptop_ban_cleanup] ${#IPS[@]} aktif ban (API/ipset/active_bans)"
if [[ "$APPLY" != "1" ]]; then
  printf '  %s\n' "${IPS[@]:0:10}"
  [[ "${#IPS[@]}" -gt 10 ]] && echo "  ... +$((${#IPS[@]}-10)) daha"
  echo "[INFO] Tek tek unban: APPLY=1 bash scripts/laptop_ban_cleanup.sh"
  echo "[INFO] Tam sifir:     FLUSH=1 bash scripts/laptop_ban_cleanup.sh"
  exit 0
fi

ok=0 fail=0
LG_UNBAN="${LG_BIN:-/usr/local/bin/log-guardian}"
[[ -x "$LG_UNBAN" ]] || LG_UNBAN="$ROOT/log-guardian"

for ip in "${IPS[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 -X POST \
    -H "Authorization: Bearer $TOK" "${BASE}/api/v1/unban?ip=${ip}" 2>/dev/null || echo 000)
  if [[ "$code" == "200" || "$code" == "502" ]]; then
    ok=$((ok + 1))
  else
    echo "[WARN] unban $ip HTTP $code" >&2
    fail=$((fail + 1))
  fi
  # API unban ipset'i her zaman temizlemez — CLI ile zorla
  if [[ -x "$LG_UNBAN" ]]; then
    if [[ $EUID -eq 0 ]]; then
      "$LG_UNBAN" unban "$ip" >/dev/null 2>&1 || true
      ipset del "$IPSET" "$ip" -exist 2>/dev/null || true
    elif command -v sudo >/dev/null 2>&1; then
      sudo "$LG_UNBAN" unban "$ip" >/dev/null 2>&1 || true
      sudo ipset del "$IPSET" "$ip" -exist 2>/dev/null || true
    fi
  fi
done

if command -v sudo >/dev/null 2>&1; then
  sudo -n FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
    /run/log-guardian/active_bans.json 2>/dev/null \
    || sudo FORCE_IPSET_REFRESH=1 bash "$ROOT/scripts/repair_active_bans_json.sh" \
      /run/log-guardian/active_bans.json 2>/dev/null || true
fi

remain=$(collect_ips | wc -l)
if [[ "${remain:-0}" -gt 0 ]]; then
  echo "[WARN] ${remain} ban kaldi — FLUSH=1 bash scripts/laptop_ban_cleanup.sh" >&2
fi

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null | grep -E 'active_bans|sync\] OK' || true
echo "[OK] laptop_ban_cleanup — unban ok=$ok fail=$fail"
