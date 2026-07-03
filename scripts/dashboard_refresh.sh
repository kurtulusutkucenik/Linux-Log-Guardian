#!/usr/bin/env bash
# Dashboard veri sync + container rebuild (yeni test kartlari / API icin)
#   bash scripts/dashboard_refresh.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || echo dev-jwt-secret-min-32-chars!!)}"

echo "=== dashboard_refresh ==="
echo "[dashboard_refresh] Gate + status raporlari yenileniyor..."
# IPC/metrics hazir olsun — ops_gate oncesi (aksi halde post_install + live-pipeline kirmizi)
if [[ -f /etc/log-guardian/webhook.env ]] && ! [[ -r /etc/log-guardian/webhook.env ]] \
    && command -v sudo >/dev/null 2>&1; then
  sudo bash "$ROOT/scripts/guardian_status_export.sh" \
    || bash "$ROOT/scripts/guardian_status_export.sh"
else
  bash "$ROOT/scripts/guardian_status_export.sh"
fi
bash "$ROOT/scripts/ops_gate_report.sh"

if [[ "${SKIP_FLEET_PRUNE:-0}" != "1" ]]; then
  STALE_HOURS="${STALE_HOURS:-1}" bash "$ROOT/scripts/fleet_prune_stale.sh" \
    && echo "[OK] fleet_prune_stale" \
    || echo "[WARN] fleet_prune_stale — atlandi" >&2
fi

if bash "$ROOT/scripts/website_sync_tests.sh"; then
  echo "[OK] website_sync_tests"
else
  echo "[WARN] website_sync_tests — atlandi (preview gate embed dener)" >&2
fi

run_preview_gate() {
  bash "$ROOT/scripts/website_preview_gate.sh"
}

if run_preview_gate; then
  echo "[OK] website_preview_gate"
else
  echo "[WARN] website_preview_gate FAIL — test embed + yeniden deneme..."
  python3 "$ROOT/scripts/competitive_proof_build.py" || true
  python3 "$ROOT/scripts/website_embed_tests.py" || true
  if run_preview_gate; then
    echo "[OK] website_preview_gate (retry)"
  else
    echo "[WARN] website_preview_gate hala FAIL — dashboard yine de yenileniyor" >&2
  fi
fi

if python3 "$ROOT/scripts/competitive_proof_build.py"; then
  echo "[OK] competitive_proof_build"
else
  echo "[WARN] competitive_proof_build — atlandi" >&2
fi

bash "$ROOT/scripts/sync_dashboard_data.sh"

echo "[dashboard_refresh] Dashboard image rebuild (--build zorunlu — kod degisince)"
docker compose -f docker-compose.prod.yml build dashboard

echo "[dashboard_refresh] Container yeniden baslatiliyor..."
docker compose -f docker-compose.prod.yml rm -sf dashboard 2>/dev/null || true
docker rm -f log-guardian-dashboard 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps dashboard

if [[ -f /etc/log-guardian/rules.conf ]]; then
  TOK=$(grep -E '^API_TOKEN=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$TOK" ]]; then
    export GUARDIAN_API_TOKEN="$TOK"
    docker compose -f docker-compose.prod.yml up -d ban-api-relay dashboard
    echo "[OK] GUARDIAN_API_TOKEN container'a verildi"
  fi
fi

if docker ps --format '{{.Names}}' | grep -qx log-guardian-caddy; then
  echo "[OK] Caddy ayakta — https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/tests"
else
  echo "[INFO] Caddy yok — bash scripts/tls_proxy_up.sh veya bash scripts/dashboard_stack.sh"
  echo "       Gecici: http://127.0.0.1:3000/tests"
fi

wait_dashboard_tier() {
  local i code
  for i in $(seq 1 45); do
    code=$(curl -sfk -o /dev/null -w '%{http_code}' --max-time 3 \
      --resolve 'localhost:8443:127.0.0.1' "https://localhost:8443/api/tier" 2>/dev/null || echo 000)
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    code=$(curl -sf -o /dev/null -w '%{http_code}' --max-time 3 \
      "http://127.0.0.1:3000/api/tier" 2>/dev/null || echo 000)
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

if [[ "${SKIP_ATTACK_MAP:-0}" != "1" ]]; then
  echo "[dashboard_refresh] Attack map kaniti (dashboard hazir olunca)..."
  attack_ok=0
  for attempt in 1 2 3; do
    if wait_dashboard_tier; then
      if bash "$ROOT/scripts/attack_map_e2e.sh"; then
        attack_ok=1
        break
      fi
      echo "[WARN] attack_map_e2e deneme $attempt/3 — login/marker" >&2
    else
      echo "[WARN] dashboard /api/tier hazir degil (deneme $attempt/3)" >&2
    fi
    [[ "$attempt" -lt 3 ]] && sleep 4
  done
  if [[ "$attack_ok" == "1" ]]; then
    echo "[OK] attack_map_e2e"
    bash "$ROOT/scripts/sync_dashboard_data.sh"
  else
    echo "[WARN] attack_map_e2e — atlandi (dashboard/login veya marker)" >&2
  fi
fi

if [[ "${QUICK_PROOF:-0}" == "1" ]]; then
  echo "[dashboard_refresh] QUICK_PROOF=1 — competitive-proof JSON/PDF..."
  bash "$ROOT/scripts/quick_proof_refresh.sh" || echo "[WARN] quick_proof_refresh atlandi" >&2
fi

echo "[OK] dashboard_refresh tamam"
echo "  Hard refresh: Ctrl+Shift+R on /tests"
python3 - "$ROOT" <<'PY'
import json
from pathlib import Path
root = Path(__import__("sys").argv[1])
preview = root / "website-preview-gate-report.json"
proof = root / "competitive-proof.json"
attack = root / "attack-map-report.json"
lines = []
if preview.is_file():
    r = json.loads(preview.read_text(encoding="utf-8"))
    sf = int(r.get("site_fail") or 0)
    shown = int(r.get("site_tests") or 0) if sf == 0 else int(r.get("site_pass") or 0)
    exp = int(r.get("expected_tests") or 0)
    lines.append(f"  website_preview: {shown}/{exp} pass")
if proof.is_file():
    t = json.loads(proof.read_text(encoding="utf-8")).get("validationTests") or []
    p = sum(1 for x in t if x.get("status") == "pass")
    lines.append(f"  competitive_proof: {p}/{len(t)} pass")
if attack.is_file():
    a = json.loads(attack.read_text(encoding="utf-8"))
    if a.get("pass") is True:
        lines.append(f"  attack_map: {a.get('markers', 0)} marker")
    else:
        lines.append("  attack_map: WARN")
if lines:
    print("")
    print("=== dashboard_refresh ozet ===")
    for ln in lines:
        print(ln)
    print("[OK] dashboard_refresh — kanit + site senkron")
PY
