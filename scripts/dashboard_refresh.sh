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

bash "$ROOT/scripts/edge_protection_gate.sh" >/dev/null 2>&1 \
  && echo "[OK] edge_protection_gate" \
  || echo "[WARN] edge_protection_gate — bash scripts/edge_protection_gate.sh" >&2
bash "$ROOT/scripts/edge_protection_checklist.sh" >/dev/null 2>&1 \
  && echo "[OK] edge_protection_checklist" \
  || echo "[WARN] edge_protection_checklist" >&2

refresh_grafana_ops_gates() {
  bash "$ROOT/scripts/grafana_parity_gate.sh" >/dev/null 2>&1 \
    && echo "[OK] grafana_parity_gate" \
    || echo "[WARN] grafana_parity_gate — bash scripts/grafana_parity_gate.sh" >&2
  bash "$ROOT/scripts/enterprise_escalation_gate.sh" >/dev/null 2>&1 \
    && echo "[OK] enterprise_escalation_gate" \
    || echo "[WARN] enterprise_escalation_gate" >&2
}

# enterprise_e9_verify — grafana_parity sonrasi (asagida refresh_grafana_ops_gates)

# Stale k8s-admission skip onlenir (go yoksa docker fallback — competitive_proof.sh ile ayni)
bash "$ROOT/scripts/k8s_admission_test.sh" 2>/dev/null || true

if [[ "${SKIP_FLEET_PRUNE:-0}" != "1" ]]; then
  # VM kapali iken node-vm-02 silinmesin — varsayilan 48h (1h demo gurultusu icin STALE_HOURS=1)
  STALE_HOURS="${STALE_HOURS:-48}" bash "$ROOT/scripts/fleet_prune_stale.sh" \
    && echo "[OK] fleet_prune_stale (${STALE_HOURS:-48}h)" \
    || echo "[WARN] fleet_prune_stale — atlandi" >&2
  bash "$ROOT/scripts/fleet_prune_pending_commands.sh" \
    && echo "[OK] fleet_prune_pending_commands" \
    || echo "[WARN] fleet_prune_pending_commands — atlandi" >&2
fi

# ban_events DB raporu (ban mantigina dokunmaz)
WARN_ONLY=1 bash "$ROOT/scripts/intel_ban_db_ops_check.sh" \
  && echo "[OK] intel_ban_db_ops_check" \
  || echo "[WARN] intel_ban_db_ops_check — atlandi" >&2

ensure_observability_stack() {
  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    echo "[WARN] docker yok — grafana/tls stack atlandi" >&2
    return 0
  fi
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx prometheus-lg \
      || ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx grafana-lg; then
    echo "[dashboard_refresh] Prometheus + Grafana baslatiliyor..."
    bash "$ROOT/scripts/grafana_stack.sh" || echo "[WARN] grafana_stack — atlandi" >&2
  fi
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
    echo "[dashboard_refresh] TLS stack (Caddy) baslatiliyor..."
    bash "$ROOT/scripts/tls_proxy_up.sh" 2>/dev/null \
      || bash "$ROOT/scripts/dashboard_stack.sh" 2>/dev/null \
      || echo "[WARN] tls_proxy_up — atlandi" >&2
  fi
}

ensure_observability_stack
refresh_grafana_ops_gates

# Stale nginx-consult / scorecard onlenir (73/80 dongusu)
if bash "$ROOT/scripts/nginx_inline_consult_proof.sh" >/dev/null 2>&1; then
  echo "[OK] nginx_inline_consult (pre-proof)"
else
  echo "[WARN] nginx_inline_consult — sudo systemctl restart log-guardian" >&2
fi

# Relay (18090) + docker ban path — dashboard-ban-api karti bayat kalmasin
if bash "$ROOT/scripts/sync_dashboard_api_token.sh" >/dev/null 2>&1 \
    && bash "$ROOT/scripts/dashboard_ban_smoke.sh" >/dev/null 2>&1; then
  echo "[OK] dashboard_ban_smoke (relay 18090)"
else
  echo "[WARN] dashboard_ban_smoke — bash scripts/sync_dashboard_api_token.sh && bash scripts/dashboard_ban_smoke.sh" >&2
fi

python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true

run_preview_gate() {
  bash "$ROOT/scripts/website_preview_gate.sh"
}

if run_preview_gate; then
  echo "[OK] website_preview_gate (landing parity)"
else
  echo "[WARN] website_preview_gate FAIL — competitive-proof tazele + yeniden dene..."
  python3 "$ROOT/scripts/competitive_proof_build.py" || true
  python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" || true
  if run_preview_gate; then
    echo "[OK] website_preview_gate (retry)"
  else
    echo "[WARN] website_preview_gate hala FAIL — dashboard yine de yenileniyor" >&2
  fi
fi

if python3 "$ROOT/scripts/competitive_proof_build.py"; then
  bash "$ROOT/scripts/proof_meta_gates_refresh.sh" \
    || echo "[WARN] proof_meta_gates_refresh — once ops_gate_report + competitive_proof_build" >&2
  python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
  echo "[OK] competitive_proof_build"
else
  echo "[WARN] competitive_proof_build — atlandi" >&2
fi

python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" \
  && echo "[OK] sync_landing_tests_from_proof" \
  || echo "[WARN] sync_landing_tests_from_proof — atlandi" >&2

bash "$ROOT/scripts/dashboard_tests_parity_check.sh" \
  && echo "[OK] dashboard_tests_parity" \
  || { echo "[FAIL] dashboard_tests_parity — competitive_proof_build + validationTests.ts" >&2; exit 1; }

bash "$ROOT/scripts/sync_dashboard_data.sh"

echo "[dashboard_refresh] Dashboard image rebuild (--build zorunlu — kod degisince)"
DASHBOARD_SRC_REV="$(
  find "$ROOT/dashboard/src" -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 2>/dev/null \
    | sort -z | xargs -0 sha256sum 2>/dev/null | sha256sum | cut -c1-16
)"
DASHBOARD_SRC_REV="${DASHBOARD_SRC_REV:-dev}"
export DASHBOARD_BUILD_REV="${DASHBOARD_BUILD_REV:-$(date -u +%Y%m%d%H%M)}"
BUILD_OPTS=(
  --build-arg "DASHBOARD_SRC_REV=${DASHBOARD_SRC_REV}"
  --build-arg "NEXT_PUBLIC_DASHBOARD_BUILD_REV=${DASHBOARD_BUILD_REV}"
)
if [[ "${NO_CACHE:-0}" == "1" ]]; then
  BUILD_OPTS+=(--no-cache)
  echo "[dashboard_refresh] NO_CACHE=1 — tam image rebuild"
fi
docker compose -f docker-compose.prod.yml build "${BUILD_OPTS[@]}" dashboard

echo "[dashboard_refresh] Container yeniden baslatiliyor..."
docker compose -f docker-compose.prod.yml stop dashboard 2>/dev/null || true
docker compose -f docker-compose.prod.yml rm -sf dashboard 2>/dev/null || true
docker ps -aq --filter name=log-guardian-dashboard 2>/dev/null | xargs -r docker rm -f 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps dashboard
echo "[OK] dashboard build rev: ${DASHBOARD_BUILD_REV}"

if [[ -f /etc/log-guardian/rules.conf ]]; then
  TOK=$(grep -E '^API_TOKEN=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2- || true)
  if [[ -n "$TOK" ]]; then
    export GUARDIAN_API_TOKEN="$TOK"
    docker compose -f docker-compose.prod.yml up -d host-api-bridge metrics-relay ban-api-relay dashboard
    echo "[OK] GUARDIAN_API_TOKEN container'a verildi"
    if bash "$ROOT/scripts/sync_dashboard_api_token.sh" >/dev/null 2>&1 \
        && bash "$ROOT/scripts/dashboard_ban_smoke.sh" >/dev/null 2>&1; then
      echo "[OK] dashboard_ban_smoke (post-docker relay 18090)"
    else
      echo "[WARN] dashboard_ban_smoke post-docker — bash scripts/dashboard_ban_smoke.sh" >&2
    fi
    bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
    python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 || true
  fi
fi

if docker ps --format '{{.Names}}' | grep -qx log-guardian-caddy; then
  echo "[OK] Caddy ayakta — https://${DOMAIN:-localhost}:${HTTPS_PORT:-8443}/tests"
else
  echo "[INFO] Caddy yok — bash scripts/tls_proxy_up.sh veya bash scripts/dashboard_stack.sh"
  echo "       Gecici: http://127.0.0.1:3000/tests"
fi

# Host fleet keepalive — vm_fleet_gate / laptop_excellence icin node-kurtulus-01 Online
if systemctl --user is-enabled log-guardian-fleet-keepalive.service &>/dev/null; then
  systemctl --user start log-guardian-fleet-keepalive.service 2>/dev/null \
    && echo "[OK] fleet keepalive (user systemd)" \
    || echo "[WARN] fleet keepalive baslatilamadi" >&2
elif [[ -f "$ROOT/.cache/fleet-host.env" ]]; then
  bash "$ROOT/scripts/fleet_telemetry_keepalive.sh" --bg 2>/dev/null \
    && echo "[OK] fleet keepalive (nohup)" \
    || true
fi

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx grafana-lg; then
  bash "$ROOT/scripts/grafana_provision.sh" >/dev/null 2>&1 \
    && echo "[OK] grafana_provision (DIST risk paneli dahil)" \
    || echo "[WARN] grafana_provision — Grafana :3002?" >&2
  refresh_grafana_ops_gates
  SKIP_MORNING=1 bash "$ROOT/scripts/enterprise_e9_verify.sh" >/dev/null 2>&1 \
    && echo "[OK] enterprise_e9_verify" \
    || echo "[WARN] enterprise_e9_verify — bash scripts/enterprise_e9_verify.sh" >&2
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

# shellcheck source=scripts/lib/dashboard_cache.sh
source "$ROOT/scripts/lib/dashboard_cache.sh"

echo "[dashboard_refresh] Bans API cache temizleniyor (active_bans sync sonrasi)..."
if wait_dashboard_tier; then
  LG_ROOT="$ROOT" invalidate_dashboard_bans_cache || true
else
  echo "[WARN] dashboard hazir degil — bans cache bust atlandi" >&2
fi

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
    bash "$ROOT/scripts/telegram_soc_gate.sh" >/dev/null 2>&1 \
      && echo "[OK] telegram_soc_gate" \
      || echo "[WARN] telegram_soc_gate — timeline/map/webhook zinciri" >&2
    # SOC/attack_map sonrasi laptop_core + morning_operator raporlari tazele (77/79 onlenir)
    SKIP_EDGE=1 bash "$ROOT/scripts/laptop_core_gate.sh" >/dev/null 2>&1 \
      && echo "[OK] laptop_core_gate" \
      || echo "[WARN] laptop_core_gate — :8443 veya telegram_soc" >&2
    TELEGRAM_NOTIFY=0 bash "$ROOT/scripts/morning_operator_gate.sh" >/dev/null 2>&1 \
      && echo "[OK] morning_operator_gate" \
      || echo "[WARN] morning_operator_gate" >&2
    refresh_grafana_ops_gates
    python3 "$ROOT/scripts/competitive_proof_build.py" >/dev/null 2>&1 \
      && echo "[OK] competitive_proof_build (gate raporlari)" \
      || echo "[WARN] competitive_proof_build — gate sonrasi" >&2
    bash "$ROOT/scripts/proof_meta_gates_refresh.sh" >/dev/null 2>&1 || true
    python3 "$ROOT/scripts/sync_landing_tests_from_proof.py" >/dev/null 2>&1 || true
    bash "$ROOT/scripts/sync_dashboard_data.sh"
    LG_ROOT="$ROOT" invalidate_dashboard_bans_cache || true
  else
    echo "[WARN] attack_map_e2e — atlandi (dashboard/login veya marker)" >&2
  fi
fi

if [[ "${QUICK_PROOF:-0}" == "1" ]]; then
  echo "[dashboard_refresh] QUICK_PROOF=1 — competitive-proof JSON/PDF..."
  bash "$ROOT/scripts/quick_proof_refresh.sh" || echo "[WARN] quick_proof_refresh atlandi" >&2
fi

if bash "$ROOT/scripts/sync_evidence_pack.sh" >/dev/null 2>&1; then
  echo "[OK] sync_evidence_pack -> docs/evidence/"
else
  echo "[WARN] sync_evidence_pack — atlandi" >&2
fi

echo "[OK] dashboard_refresh tamam"
echo "  Hard refresh: Ctrl+Shift+R on /tests"
if bash "$ROOT/scripts/dashboard_tests_live_count.sh" 2>/dev/null; then
  echo "[OK] dashboard_tests_live_count"
else
  echo "[WARN] dashboard_tests_live_count — /api/tests != competitive-proof (Ctrl+Shift+R)" >&2
fi
SUMMARY_JSON="${LG_LAST_VITRIN_JSON:-$HOME/lg-last-vitrin.json}"
python3 "$ROOT/scripts/lg_last_vitrin_summary.py" \
  --root "$ROOT" \
  --out "$SUMMARY_JSON" \
  --source "scripts/dashboard_refresh.sh" \
  --print-summary \
  --title "=== dashboard_refresh ozet ===" || true
echo "[OK] dashboard_refresh — kanit + site senkron"
