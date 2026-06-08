#!/usr/bin/env bash
# Rakip kaniti — VPS/webhook gerektirmez; tek komut PDF+JSON
#   bash scripts/rakip_kanit.sh
#   LIVE_ATTACK=1 bash scripts/rakip_kanit.sh   # zorla canli harness
#   LIVE_ATTACK=0 bash scripts/rakip_kanit.sh   # sadece offline
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

resolve_live() {
  case "${LIVE_ATTACK:-auto}" in
    0|no|false|off) echo 0 ;;
    1|yes|true|on|force) echo 1 ;;
    auto|*)
      if bash scripts/detect_nginx_live.sh 2>/dev/null; then echo 1; else echo 0; fi
      ;;
  esac
}

resolve_consult() {
  local port="${GUARDIAN_API_PORT:-8090}"
  if [[ -f /etc/log-guardian/rules.conf ]]; then
    local p
    p=$(grep -E '^API_PORT=' /etc/log-guardian/rules.conf 2>/dev/null | tail -1 | cut -d= -f2 | tr -d ' \r')
    [[ -n "$p" && "$p" =~ ^[0-9]+$ ]] && port="$p"
  fi
  case "${NGINX_CONSULT:-auto}" in
    0|no|false|off) echo 0 ;;
    1|yes|true|on|force) echo 1 ;;
    auto|*)
      if curl -sf --max-time 2 "http://127.0.0.1:${port}/api/v1/metrics" >/dev/null 2>&1; then
        echo 1
      else
        echo 0
      fi
      ;;
  esac
}

LIVE_VAL="$(resolve_live)"
CONSULT_VAL="$(resolve_consult)"
if [[ "$LIVE_VAL" == "1" ]]; then
  echo "[rakip_kanit] nginx :80 acik — canli harness dahil (LIVE_ATTACK=${LIVE_ATTACK:-auto})"
else
  echo "[rakip_kanit] offline mod — canli harness atlandi (LIVE_ATTACK=${LIVE_ATTACK:-auto})"
fi
if [[ "$CONSULT_VAL" == "1" ]]; then
  echo "[rakip_kanit] API :8090 acik — inline consult kaniti dahil (NGINX_CONSULT=${NGINX_CONSULT:-auto})"
elif [[ "${NGINX_CONSULT:-auto}" != "0" ]]; then
  echo "[rakip_kanit] inline consult atlandi — sudo systemctl restart log-guardian (NGINX_CONSULT=${NGINX_CONSULT:-auto})"
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Linux Log Guardian — rakip kanit paketi (offline)      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

[[ -x ./log-guardian ]] || make -s -j"$(nproc 2>/dev/null || echo 2)" log-guardian

echo "── [1/5] Gercek saldiri corpus + bench mix + replay"
python3 scripts/generate_bench_corpus.py
LIVE="$LIVE_VAL" bash scripts/real_attack_suite.sh

echo ""
echo "── [2/5] Dagitik saldiri (JA3 cluster offline)"
JA3_LIVE="${JA3_LIVE:-0}"
if [[ "$JA3_LIVE" == "1" ]]; then
  bash scripts/check_nginx_tls_443.sh 2>/dev/null || \
    echo "[WARN] TLS :443 kapali — sudo bash scripts/nginx_tls_local_setup.sh" >&2
  LIVE=1 bash scripts/ja3_cluster_proof.sh
else
  bash scripts/ja3_cluster_proof.sh
fi

JA3_CLUSTER_BAN_LIVE="${JA3_CLUSTER_BAN_LIVE:-auto}"
resolve_ja3_cluster_ban_live() {
  case "$JA3_CLUSTER_BAN_LIVE" in
    0|no|false|off) echo 0 ;;
    1|yes|true|on|force) echo 1 ;;
    auto|*)
      if [[ "$LIVE_VAL" == "1" ]] && [[ "$(id -u)" -eq 0 ]]; then echo 1; else echo 0; fi
      ;;
  esac
}
JA3_CLUSTER_LIVE_VAL="$(resolve_ja3_cluster_ban_live)"
if [[ "$JA3_CLUSTER_LIVE_VAL" == "1" ]]; then
  echo ""
  echo "── [2b] Canli JA3/UA cluster ban (nginx access log)"
  RULES_CHK="${LG_RULES:-/etc/log-guardian/rules.conf}"
  if grep -qE '^JA3_CLUSTER_BAN=1' "$RULES_CHK" 2>/dev/null \
     || grep -qE '^JA3_CLUSTER_BAN=1' rules.conf 2>/dev/null; then
    bash scripts/ja3_cluster_ban_live.sh
    bash scripts/competitive_proof.sh 2>/dev/null || true
  else
    echo "[WARN] JA3_CLUSTER_BAN=1 yok — sudo bash scripts/merge_ja3_cluster_rules.sh" >&2
  fi
elif [[ "$LIVE_VAL" == "1" ]] && [[ "$JA3_CLUSTER_BAN_LIVE" != "0" ]]; then
  echo "[INFO] Canli cluster ban: sudo JA3_CLUSTER_BAN_LIVE=1 bash scripts/rakip_kanit.sh"
fi

echo ""
echo "── [3/5] Competitive proof (mevcut bench/FP/CRS raporlari)"
FP_CLUSTER_TRUST="${FP_CLUSTER_TRUST:-auto}"
if [[ "$FP_CLUSTER_TRUST" != "0" ]]; then
  echo "── [3a] FP learn × cluster ban (offline replay)"
  bash scripts/fp_cluster_trust_e2e.sh 2>/dev/null || \
    echo "[WARN] fp_cluster_trust_e2e FAIL — JA3_CLUSTER + FP_LEARN rules" >&2
fi
echo "── [3b] eBPF lineage canli snapshot (openat/execve/connect)"
bash scripts/lineage_live_e2e.sh 2>/dev/null || \
  echo "[WARN] lineage_live_e2e FAIL — corpus/lineage_live_snapshot.json" >&2
if [[ -f bench-vs-modsec.json && -f fp-report.json ]]; then
  bash scripts/competitive_proof.sh
else
  echo "[INFO] bench/FP yok — FAST competitive_suite (ilk kurulum)"
  FAST=1 bash scripts/competitive_suite.sh || true
  bash scripts/competitive_proof.sh
fi

echo ""
echo "── [4/5] Data-room ZIP"
bash scripts/data_room_pack.sh 2>/dev/null || true

NGINX_CONSULT="${NGINX_CONSULT:-auto}"
if [[ "$CONSULT_VAL" == "1" ]]; then
  echo ""
  echo "── [4a] nginx inline consult API"
  if bash scripts/nginx_inline_consult_proof.sh; then
    bash scripts/competitive_proof.sh 2>/dev/null || true
    bash scripts/data_room_pack.sh 2>/dev/null || true
  else
    echo "[WARN] nginx_inline_consult FAIL — API restart: sudo systemctl restart log-guardian" >&2
  fi
fi

LIVE_ATTACK="${LIVE_ATTACK:-auto}"
if [[ "$LIVE_ATTACK" == "force" ]]; then
  echo ""
  echo "── [4b] Canli nginx saldiri harness (yeniden kosu)"
  if bash scripts/live_attack_harness.sh; then
    LIVE=1 bash scripts/real_attack_suite.sh
    bash scripts/competitive_proof.sh
    bash scripts/data_room_pack.sh 2>/dev/null || true
    bash scripts/github_release_pack.sh 2>/dev/null || true
  else
    echo "[WARN] live_attack_harness FAIL — nginx kapali veya port ${ATTACK_PORT:-80} yok" >&2
  fi
fi

STABILITY="${STABILITY:-0}"
if [[ "$STABILITY" == "1" ]]; then
  echo ""
  echo "── [4c] Kisa stabilite (5 dk soak)"
  if bash scripts/soak_short_proof.sh; then
    bash scripts/competitive_proof.sh 2>/dev/null || true
    bash scripts/data_room_pack.sh 2>/dev/null || true
  else
    echo "[WARN] soak_short_proof FAIL" >&2
  fi
fi

echo ""
echo "── [5/5] Ozet (JSON'dan)"
python3 <<'PY'
import json
from pathlib import Path

def load(name):
    p = Path(name)
    return json.loads(p.read_text()) if p.is_file() else {}

proof = load("competitive-proof.json")
real = load("real-attack-report.json")
real10k = load("real-attack-report-10k.json")
ja3 = load("ja3-cluster-report.json")
live = load("live-attack-report.json")
consult = load("nginx-inline-consult-report.json")
fp_cluster = load("fp-cluster-trust-report.json")
ja3_ban_live = load("ja3-cluster-ban-live.json")
lineage_live = load("lineage-live-report.json")
fp = load("fp-report.json")
ban = load("bench-ban-latency.json")
crs = load("crs-parity-report.json")
soak_short = load("soak-report.short.json")
soak_long = load("soak-report.json")
owasp = load("owasp-corpus-report.json")
tr_host = load("tr-hosting-corpus-report.json")
ti_sync = load("threat-intel-sync-report.json")

r_recall = real.get("attack_recall_pct", "-")
r_lines = real.get("lines_total", "-")
j_recall = ja3.get("recall_pct", "-")
j_ips = ja3.get("unique_ips", "-")
live_summ = live.get("summary") or {}
live_refused = live_summ.get("refused_total", "-")
fp_pct = (fp.get("benign") or {}).get("fp_rate_pct", "-")
ban_ms = ban.get("ban_latency_ms", "-")
crs_p = crs.get("parity_pct", "-")
pass_ok = proof.get("pass", False)

print("┌─────────────────────────┬──────────────────────────────┐")
print("│ Metrik                  │ Deger                        │")
print("├─────────────────────────┼──────────────────────────────┤")
print(f"│ Gercek saldiri recall   │ {r_recall}% ({r_lines} satir)".ljust(58) + "│")
if real10k:
    r10 = real10k.get("attack_recall_pct", "-")
    l10 = real10k.get("lines_total", "-")
    print(f"│ Corpus 10K recall       │ {r10}% ({l10} satir)".ljust(58) + "│")
print(f"│ Dagitik cluster recall  │ {j_recall}% ({j_ips} IP)".ljust(58) + "│")
if live_summ:
    print(f"│ Canli harness refused   │ {live_refused}".ljust(58) + "│")
if consult:
    t = consult.get("tests") or {}
    c_line = (
        f"union={t.get('sqli_union',{}).get('http_code')} "
        f"benign={t.get('benign_health',{}).get('http_code')} "
        f"{'PASS' if consult.get('pass') else 'FAIL'}"
    )
    print(f"│ nginx consult           │ {c_line}".ljust(58) + "│")
live_ja3 = (ja3.get("live") or {}) if ja3 else {}
if live_ja3.get("enabled"):
    jt = live_ja3.get("ja3_test") or {}
    j_line = (
        f"tls={'OK' if live_ja3.get('tls_ready') else '—'} "
        f"ja3={'PASS' if live_ja3.get('pass') else 'skip'}"
    )
    if jt.get("metrics_delta_c2"):
        j_line += f" c2+={jt.get('metrics_delta_c2')}"
    print(f"│ JA3 TLS live            │ {j_line}".ljust(58) + "│")
print(f"│ False positive          │ {fp_pct}%".ljust(58) + "│")
print(f"│ Ban gecikmesi           │ {ban_ms} ms".ljust(58) + "│")
print(f"│ CRS parity              │ {crs_p}%".ljust(58) + "│")
if owasp.get("pass"):
    print(f"│ OWASP corpus recall      │ {owasp.get('attack_recall_pct')}% ({owasp.get('lines_total')} satir)".ljust(58) + "│")
if tr_host.get("pass"):
    print(f"│ TR hosting recall        │ {tr_host.get('attack_recall_pct')}% ({tr_host.get('lines_total')} satir)".ljust(58) + "│")
if ti_sync.get("pass"):
    print(f"│ Threat intel sync        │ {ti_sync.get('duration_sec',0)}s ipset_delta={ti_sync.get('ipset_delta',0)}".ljust(58) + "│")
if fp_cluster.get("pass"):
    print(f"│ FP x cluster trust       │ trusted={fp_cluster.get('trusted_ip')} flush={fp_cluster.get('ja3_cluster_flush')}".ljust(58) + "│")
if ja3_ban_live.get("pass"):
    print(f"│ JA3 cluster ban live     │ delta={ja3_ban_live.get('ban_pipeline_delta')} block={ja3_ban_live.get('ip_block','?')}".ljust(58) + "│")
if lineage_live.get("pass"):
    print(f"│ eBPF lineage live        │ risk={lineage_live.get('chain_risk')} events={lineage_live.get('event_count')}".ljust(58) + "│")
if soak_short.get("pass"):
    sf = soak_short.get("failures", 0)
    ss = soak_short.get("samples", 0)
    print(f"│ Kisa soak (5 dk)        │ PASS {sf}/{ss} failures".ljust(58) + "│")
elif soak_long.get("pass"):
    dur_h = soak_long.get("duration_hours") or (soak_long.get("duration_sec", 0) / 3600.0)
    sf = soak_long.get("failures", 0)
    print(f"│ Stabilite soak          │ PASS {dur_h:.1f}h failures={sf}".ljust(58) + "│")
print(f"│ competitive-proof       │ {'PASS' if pass_ok else 'FAIL'}".ljust(58) + "│")
print("└─────────────────────────┴──────────────────────────────┘")
print("")
print("Ciktilar:")
for f in ("competitive-proof.pdf", "competitive-proof.json", "real-attack-report.json", "real-attack-report-10k.json", "ja3-cluster-report.json", "ja3-cluster-ban-live.json", "fp-cluster-trust-report.json", "lineage-live-report.json", "nginx-inline-consult-report.json", "data-room.zip", "release-pack.zip"):
    mark = "OK" if Path(f).is_file() else "—"
    print(f"  [{mark}] {f}")
print("")
print("Rakip karsilastirma: docs/VS_RAKIPLER.md")
print("GitHub vitrin: README.md + competitive-proof.pdf")
PY

bash scripts/github_release_pack.sh 2>/dev/null || true

echo "[OK] rakip_kanit tamam"
