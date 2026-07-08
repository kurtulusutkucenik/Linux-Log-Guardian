#!/usr/bin/env bash
# EDGE_PROTECTION.md kontrol listesi — laptop/prod ayrimli ozet
#   bash scripts/edge_protection_checklist.sh
#   JSON: edge-protection-checklist-report.json
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${EDGE_CHECKLIST_REPORT:-edge-protection-checklist-report.json}"

run_check() {
  local id="$1" scope="$2" label="$3" cmd="$4"
  local st note rc=0
  if eval "$cmd" >/dev/null 2>&1; then
    st="pass"
    note="OK"
  else
    rc=1
    if [[ "$scope" == "prod" ]] && [[ "${LAPTOP_PROFILE:-1}" == "1" ]]; then
      st="skip"
      note="prod-only (laptop)"
      rc=0
    else
      st="fail"
      note="FAIL"
    fi
  fi
  printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$scope" "$label" "$st" "$note"
  return "$rc"
}

items_tsv="$(mktemp)"
trap 'rm -f "$items_tsv"' EXIT

_add() {
  local id="$1" scope="$2" label="$3" st="$4" note="${5:-}"
  printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$scope" "$label" "$st" "$note" >>"$items_tsv"
}

echo "=== edge_protection_checklist ==="

# --- Gate raporlari ---
if [[ -f "$ROOT/edge-protection-gate-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/edge-protection-gate-report.json')).get('pass') else 1)"; then
  _add "edge-protection-gate" "both" "edge_protection_gate" "pass" "rapor pass"
else
  if bash "$ROOT/scripts/edge_protection_gate.sh" >/dev/null 2>&1; then
    _add "edge-protection-gate" "both" "edge_protection_gate" "pass" "canli kosum"
  else
    _add "edge-protection-gate" "both" "edge_protection_gate" "fail" "bash scripts/edge_protection_gate.sh"
  fi
fi

if [[ -f "$ROOT/dist-risk-proof-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/dist-risk-proof-report.json')).get('pass') else 1)"; then
  _add "dist-risk-proof" "both" "dist_risk_proof_e2e" "pass" ""
else
  _add "dist-risk-proof" "both" "dist_risk_proof_e2e" "warn" "rapor yok veya fail"
fi

if curl -sf --max-time 2 "http://127.0.0.1:${METRICS_PORT:-9091}/metrics" 2>/dev/null \
    | grep -q 'loganalyzer_dist_risk'; then
  _add "dist-risk-metrics" "both" ":9091 loganalyzer_dist_risk_*" "pass" ""
else
  _add "dist-risk-metrics" "both" ":9091 loganalyzer_dist_risk_*" "warn" "metrik yok"
fi

if [[ -f "$ROOT/laptop-core-gate-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/laptop-core-gate-report.json')).get('pass') else 1)"; then
  _add "laptop-core-gate" "laptop" "laptop_core_gate" "pass" ""
else
  _add "laptop-core-gate" "laptop" "laptop_core_gate" "warn" "rapor yok veya fail"
fi

# --- nginx ---
if [[ -f /etc/nginx/snippets/log-guardian.conf ]] \
    && [[ -f /etc/nginx/snippets/log-guardian-server.conf ]]; then
  _add "nginx-snippets" "both" "nginx snippet aktif" "pass" ""
else
  _add "nginx-snippets" "both" "nginx snippet aktif" "fail" "sudo bash scripts/prod_edge_setup.sh"
fi

if command -v nginx >/dev/null; then
  if nginx -t >/dev/null 2>&1 || sudo -n nginx -t >/dev/null 2>&1; then
    _add "nginx-t" "both" "nginx -t" "pass" ""
  elif systemctl is-active nginx >/dev/null 2>&1 \
      && [[ -f /etc/nginx/snippets/log-guardian.conf ]]; then
    _add "nginx-t" "both" "nginx -t" "pass" "nginx aktif + snippet (root -t gerekmez)"
  else
    _add "nginx-t" "both" "nginx -t" "warn" "sudo nginx -t"
  fi
else
  _add "nginx-t" "both" "nginx -t" "skip" "nginx yok"
fi

if bash "$ROOT/scripts/check_nginx_rate_limit.sh" >/dev/null 2>&1; then
  _add "nginx-rate-limit" "both" "lg_general rate limit" "pass" ""
else
  _add "nginx-rate-limit" "both" "lg_general rate limit" "warn" "POST_INSTALL_STRICT veya fix_nginx_log_format"
fi

# --- XDP / NIC ---
if bash "$ROOT/scripts/prod_nic_xdp_check.sh" >/dev/null 2>&1; then
  _add "prod-nic-xdp" "both" "prod_nic_xdp_check" "pass" ""
else
  mode=$(/usr/local/bin/log-guardian --status --quiet 2>/dev/null \
    | python3 -c "import json,sys; print(json.load(sys.stdin).get('xdp_mode','?'))" 2>/dev/null || echo "?")
  if [[ "$mode" == "ipset-fallback" ]]; then
    _add "prod-nic-xdp" "both" "prod_nic_xdp_check" "pass" "ipset-fallback bilincli"
  else
    _add "prod-nic-xdp" "both" "prod_nic_xdp_check" "warn" "xdp_mode=$mode"
  fi
fi

# --- Intel ban DB ---
if WARN_ONLY=1 bash "$ROOT/scripts/intel_ban_db_ops_check.sh" >/dev/null 2>&1; then
  stale=$(python3 -c "import json; print(json.load(open('$ROOT/intel-ban-db-report.json')).get('stale_rows',0))" 2>/dev/null || echo 0)
  _add "intel-ban-db" "both" "threat_intel ozet DB + TTL" "pass" "stale=${stale}"
else
  _add "intel-ban-db" "both" "threat_intel ozet DB + TTL" "fail" "intel_ban_db_ops_check"
fi

if sudo -n log-guardian ban-db-prune --ttl-days 7 >/dev/null 2>&1; then
  _add "intel-ban-prune-sudo" "laptop" "ban-db-prune NOPASSWD cron" "pass" ""
else
  _add "intel-ban-prune-sudo" "laptop" "ban-db-prune NOPASSWD cron" "warn" "sudoers-ban-db-prune.example"
fi

# --- Whitelist ---
wl=0
if [[ -f /etc/log-guardian/rules.conf ]]; then
  wl=$(grep -c '^WHITELIST_IP=' /etc/log-guardian/rules.conf 2>/dev/null || echo 0)
fi
if [[ "$wl" -ge 2 ]]; then
  _add "whitelist" "both" "WHITELIST (loopback+)" "pass" "count=${wl}"
else
  _add "whitelist" "both" "WHITELIST (loopback+)" "warn" "ofis/monitoring IP ekle"
fi

# --- Dashboard LAN ---
# shellcheck source=scripts/firewall_dashboard_bind.sh
source "$ROOT/scripts/firewall_dashboard_bind.sh" 2>/dev/null || true
if declare -F lg_firewall_dashboard_bind_check >/dev/null 2>&1 \
    && lg_firewall_dashboard_bind_check 2>/dev/null; then
  _add "dashboard-firewall" "both" "dashboard :8443 LAN" "pass" "firewall_dashboard_bind"
elif bash "$ROOT/scripts/check_dashboard_tls_bind.sh" >/dev/null 2>&1; then
  _add "dashboard-firewall" "both" "dashboard :8443 LAN" "pass" "tls_bind check"
else
  _add "dashboard-firewall" "both" "dashboard :8443 LAN" "warn" "firewall_dashboard_bind.sh install"
fi

# --- Canli site ---
if [[ -f "$ROOT/website-live-gate-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/website-live-gate-report.json')).get('pass') else 1)"; then
  cards=$(python3 -c "
import json
d=json.load(open('$ROOT/website-live-gate-report.json'))
c=d.get('live_cards')
if c is None:
    c=d.get('expected_tests', '?')
print(c)
")
  _add "website-live" "laptop" "Cloudflare Pages /tests parity" "pass" "${cards} kart"
else
  _add "website-live" "laptop" "Cloudflare Pages /tests parity" "warn" "website_live_gate"
fi

# --- Prod-only ---
if [[ -f /etc/nginx/conf.d/log-guardian-cloudflare.conf ]]; then
  _add "cdn-real-ip" "prod" "CDN origin real_ip snippet" "pass" ""
else
  _add "cdn-real-ip" "prod" "CDN origin real_ip snippet" "skip" "prod_edge_setup / cloudflare-origin.conf"
fi

if [[ -f "$ROOT/nginx-attack-test-report.json" ]] \
    || [[ -f "$ROOT/real-attack-report.json" ]]; then
  _add "nginx-attack-test" "both" "nginx_attack_test kaniti" "pass" "rapor mevcut"
else
  _add "nginx-attack-test" "both" "nginx_attack_test kaniti" "warn" "bash scripts/nginx_attack_test.sh"
fi

# --- Enterprise E9 + fleet imza ---
if [[ -f "$ROOT/enterprise-e9-verify-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/enterprise-e9-verify-report.json')).get('pass') else 1)"; then
  e9p=$(python3 -c "import json; print(json.load(open('$ROOT/enterprise-e9-verify-report.json')).get('competitive_proof','?'))" 2>/dev/null || echo "?")
  _add "enterprise-e9" "both" "E9 runbook zinciri" "pass" "proof=${e9p}"
else
  _add "enterprise-e9" "both" "E9 runbook zinciri" "warn" "bash scripts/enterprise_e9_verify.sh"
fi

if [[ -f "$ROOT/fleet-command-sign-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/fleet-command-sign-report.json')).get('pass') else 1)"; then
  _add "fleet-command-sign" "both" "fleet komut HMAC imzasi" "pass" ""
else
  _add "fleet-command-sign" "both" "fleet komut HMAC imzasi" "warn" "bash scripts/fleet_command_sign_e2e.sh"
fi

if [[ -f "$ROOT/vps-prep-gate-report.json" ]] \
    && python3 -c "import json,sys; sys.exit(0 if json.load(open('$ROOT/vps-prep-gate-report.json')).get('pass') else 1)"; then
  proof_note=$(python3 -c "import json; print(json.load(open('$ROOT/vps-prep-gate-report.json')).get('competitive_proof','?'))" 2>/dev/null || echo "?")
  _add "vps-prep" "laptop" "VPS kurulum hazirligi (sunucu yok)" "pass" "proof=${proof_note}"
else
  if bash "$ROOT/scripts/vps_prep_gate.sh" >/dev/null 2>&1; then
    _add "vps-prep" "laptop" "VPS kurulum hazirligi (sunucu yok)" "pass" "canli kosum"
  else
    _add "vps-prep" "laptop" "VPS kurulum hazirligi (sunucu yok)" "warn" "bash scripts/vps_prep_gate.sh"
  fi
fi

python3 - "$ROOT" "$REPORT" "$items_tsv" <<'PY'
import datetime
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
report_path = Path(sys.argv[2])
tsv = Path(sys.argv[3])

items = []
for line in tsv.read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    id_, scope, label, status, note = line.split("\t", 4)
    items.append({
        "id": id_,
        "scope": scope,
        "label": label,
        "status": status,
        "note": note,
    })

def counts(status):
    return sum(1 for i in items if i["status"] == status)

laptop_items = [i for i in items if i["scope"] in ("laptop", "both")]
laptop_fail = [i for i in laptop_items if i["status"] == "fail"]
laptop_warn = [i for i in laptop_items if i["status"] == "warn"]

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": len(laptop_fail) == 0,
    "laptop_profile": True,
    "items": items,
    "summary": {
        "pass": counts("pass"),
        "warn": counts("warn"),
        "fail": counts("fail"),
        "skip": counts("skip"),
        "total": len(items),
    },
    "laptop_fail_ids": [i["id"] for i in laptop_fail],
    "laptop_warn_ids": [i["id"] for i in laptop_warn],
    "script": "scripts/edge_protection_checklist.sh",
    "doc": "docs/EDGE_PROTECTION.md",
}
report_path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
if laptop_fail:
    sys.exit(1)
PY

echo "[OK] edge_protection_checklist — $REPORT"
