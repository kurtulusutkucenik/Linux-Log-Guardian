#!/usr/bin/env bash
# GitHub Release artefaktlari — once: bash scripts/rakip_kanit.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

OUT="${RELEASE_DIR:-$ROOT/release-pack}"
ZIP="${RELEASE_ZIP:-$ROOT/release-pack.zip}"

need() {
  local f="$1"
  if [[ ! -f "$ROOT/$f" ]]; then
    echo "[github_release_pack] eksik: $f — once bash scripts/rakip_kanit.sh" >&2
    exit 1
  fi
}

need competitive-proof.json
need competitive-proof.pdf
need real-attack-report.json
need ja3-cluster-report.json
need data-room.zip

mkdir -p "$OUT"
for f in competitive-proof.json competitive-proof.pdf real-attack-report.json \
  real-attack-report-10k.json ja3-cluster-report.json ja3-cluster-ban-live.json \
  fp-cluster-trust-report.json lineage-live-report.json \
  nginx-inline-consult-report.json live-attack-report.json data-room.zip; do
  [[ -f "$ROOT/$f" ]] && cp -f "$ROOT/$f" "$OUT/$f"
done
if compgen -G "$ROOT/dist/log-guardian_*.deb" >/dev/null; then
  mkdir -p "$OUT/deb"
  cp -f "$ROOT"/dist/log-guardian_*.deb "$OUT/deb/"
  echo "[github_release_pack] deb -> $OUT/deb/"
fi

python3 - "$OUT" <<'PY'
import json
from datetime import datetime, timezone
from pathlib import Path

out = Path(__import__("sys").argv[1])
proof = json.loads((out / "competitive-proof.json").read_text(encoding="utf-8"))
km = (proof.get("sections", {}).get("versusCompetitors") or proof.get("versusCompetitors") or {}).get("killerMetrics") or {}
if not km:
    km = (proof.get("versusCompetitors") or {}).get("killerMetrics") or {}

ja3_tls = km.get("ja3_tls_live_pass")
ja3_line = f"- JA3 TLS live: {'PASS' if ja3_tls else '—'}"
if ja3_tls is None:
    ja3_line = "- JA3 TLS live: — (JA3_LIVE=1 + nginx_tls_local_setup)"

ja3_ban = km.get("ja3_cluster_ban_live_pass")
fp_cluster = km.get("fp_cluster_trust_pass")
lineage = km.get("lineage_live_pass")

tests = proof.get("validationTests") or []
test_pass = sum(1 for t in tests if t.get("status") == "pass")
test_total = len(tests)

lines = [
    "# Linux Log Guardian — Release Evidence Pack",
    "",
    f"Generated: {datetime.now(timezone.utc).isoformat()}",
    "",
    "## Measured metrics",
    f"- Validation tests: {test_pass}/{test_total} pass (dashboard /tests)",
    f"- Real attack recall (1K): {km.get('real_attack_recall_pct', '—')}%",
    f"- Real attack recall (10K): {km.get('real_attack_10k_recall_pct', '—')}%",
    f"- Distributed cluster recall: {km.get('distributed_recall_pct', '—')}%",
    ja3_line,
    f"- JA3 cluster ban live: {'PASS' if ja3_ban else '—'}",
    f"- FP learn × cluster trust: {'PASS' if fp_cluster else '—'}",
    f"- eBPF lineage chain: {'PASS' if lineage else '—'} (risk {km.get('lineage_chain_risk', '—')})",
    f"- Live harness refused: {km.get('live_harness_refused', '—')}",
    f"- nginx consult: {'PASS' if km.get('nginx_consult_pass') else '—'}",
    f"- False positive: {km.get('fp_rate_pct', '—')}%",
    f"- Ban latency: {km.get('ban_latency_ms', '—')} ms",
    f"- CRS parity: {km.get('crs_parity_pct', '—')}%",
    f"- Short soak (5m): {'PASS' if km.get('soak_short_pass') else '—'}",
    f"- OWASP corpus recall: {km.get('owasp_corpus_recall_pct', '—')}%",
    f"- TR hosting recall: {km.get('tr_hosting_recall_pct', '—')}%",
    f"- Threat intel sync: {'PASS' if km.get('threat_intel_sync_pass') else '—'}",
    "",
    "## Files",
    "- `competitive-proof.pdf` — summary brief",
    "- `data-room.zip` — full JSON artefacts",
    "- `deb/log-guardian_*.deb` — amd64 paket (dist/ mevcutsa)",
    "- `lineage-live-report.json` / `fp-cluster-trust-report.json` / `ja3-cluster-ban-live.json`",
    "",
    "Reproduce: `bash scripts/local_proof_refresh.sh` (GitHub push ayri adim)",
    "Tam paket: `bash scripts/rakip_kanit.sh`",
    "",
    "MIT — docs/QUICKSTART_NGINX.md",
]
(out / "RELEASE_NOTES.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
print("[github_release_pack] RELEASE_NOTES.md")
PY

if command -v zip >/dev/null 2>&1; then
  rm -f "$ZIP"
  (cd "$OUT" && zip -qr "$ZIP" .)
  echo "[github_release_pack] -> $ZIP ($(wc -c < "$ZIP" | tr -d ' ') bytes)"
fi

echo "[OK] github_release_pack -> $OUT"
echo "       gh release create vX.Y.Z $ZIP competitive-proof.pdf --notes-file $OUT/RELEASE_NOTES.md"
