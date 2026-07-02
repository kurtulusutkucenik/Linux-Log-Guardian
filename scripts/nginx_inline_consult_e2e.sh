#!/usr/bin/env bash
# nginx inline consult E2E — config + API consult + (opsiyonel) nginx edge
#   sudo bash scripts/fix_nginx_inline_consult.sh   # once kurulum
#   bash scripts/nginx_inline_consult_e2e.sh
#
# Alt scriptler (ayri da calisir):
#   check_nginx_inline_consult.sh  — nginx snippet/token
#   nginx_inline_consult_proof.sh  — /api/v1/consult HTTP
#   nginx_hybrid_proof.sh          — inline + log replay (tam hibrit)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${NGINX_CONSULT_E2E_REPORT:-nginx-inline-consult-report.json}"

fail() { echo "[nginx_inline_consult_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== nginx_inline_consult_e2e ==="

nginx_cfg_ok=0
if command -v nginx >/dev/null 2>&1; then
  if bash "$ROOT/scripts/check_nginx_inline_consult.sh"; then
    nginx_cfg_ok=1
    ok "nginx inline consult config"
  else
    echo "[WARN] nginx config eksik — sudo bash scripts/fix_nginx_inline_consult.sh" >&2
    [[ "${NGINX_E2E_STRICT:-0}" == "1" ]] && fail "inline consult config (STRICT)"
  fi
else
  echo "[INFO] nginx yok — yalnizca API consult testi (NGINX_E2E_STRICT=1 ile FAIL)"
  [[ "${NGINX_E2E_STRICT:-0}" == "1" ]] && fail "nginx kurulu degil"
fi

bash "$ROOT/scripts/nginx_inline_consult_proof.sh"
ok "API /api/v1/consult"

edge_sqli=0 edge_benign=0 edge_ok=0
if [[ "$nginx_cfg_ok" -eq 1 ]]; then
  HOST="${ATTACK_HOST:-127.0.0.1}"
  PORT="${ATTACK_PORT:-80}"
  probe=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
    "http://${HOST}:${PORT}/" -A "Mozilla/5.0" 2>/dev/null || echo 000)
  if [[ "$probe" =~ ^[0-9]+$ && "$probe" != "000" && "$probe" != "0" ]]; then
    edge_sqli=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
      "http://${HOST}:${PORT}/?id=1+UNION+SELECT+1,2--" -A "sqlmap/1.8" 2>/dev/null || echo 0)
    edge_benign=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 \
      "http://${HOST}:${PORT}/api/health" -A "Mozilla/5.0" 2>/dev/null || echo 0)
    echo "  edge :${PORT} probe=${probe} union=${edge_sqli} benign=${edge_benign}"
    [[ "$edge_sqli" == "403" ]] && edge_ok=1
    [[ "$edge_benign" == "200" || "$edge_benign" == "404" ]] && edge_ok=$((edge_ok + 1))
    if [[ "$edge_ok" -ge 2 ]]; then
      ok "nginx auth_request edge (union=403, benign=${edge_benign})"
    else
      echo "[WARN] edge consult beklenen degil — site upstream/proxy kontrol edin" >&2
      [[ "${NGINX_E2E_STRICT:-0}" == "1" ]] && fail "nginx edge consult"
    fi
  else
    echo "[INFO] nginx :${PORT} erisilemedi (probe=${probe}) — edge atlandi"
  fi
fi

if [[ -f "$REPORT" ]]; then
  python3 - <<PY
import json
from pathlib import Path

p = Path("$REPORT")
data = json.loads(p.read_text(encoding="utf-8"))
data["e2e"] = {
    "nginx_config_ok": ${nginx_cfg_ok} == 1,
    "edge_sqli_http": int("${edge_sqli}" or 0),
    "edge_benign_http": int("${edge_benign}" or 0),
    "edge_strict": "${NGINX_E2E_STRICT:-0}" == "1",
}
if ${nginx_cfg_ok} == 1 and int("${edge_sqli}" or 0) == 403:
    data["pass"] = bool(data.get("pass")) and True
p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
PY
  ok "rapor guncellendi -> $REPORT"
fi

bash "$ROOT/scripts/sync_dashboard_data.sh" 2>/dev/null || true
echo ""
echo "[OK] nginx_inline_consult_e2e"
echo "  Tam hibrit (log+inline): bash scripts/nginx_hybrid_proof.sh"
