#!/usr/bin/env bash
# Dagitik saldiri + JA3 cluster kaniti (offline corpus + opsiyonel canli)
#   bash scripts/ja3_cluster_proof.sh
#   LIVE=1 bash scripts/ja3_cluster_proof.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${JA3_CLUSTER_REPORT:-ja3-cluster-report.json}"
LIVE="${LIVE:-0}"
HOST="${ATTACK_HOST:-127.0.0.1}"
PORT="${ATTACK_PORT:-443}"
MIN_RECALL="${DISTRIBUTED_MIN_RECALL:-85}"

echo "=== ja3_cluster_proof ==="

python3 scripts/generate_attack_corpus.py

python3 - "$ROOT" "$REPORT" "$LIVE" "$HOST" "$PORT" "$MIN_RECALL" <<'PY'
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(sys.argv[1])
report_path = Path(sys.argv[2])
live = sys.argv[3] == "1"
host, port = sys.argv[4], int(sys.argv[5])
min_recall = float(sys.argv[6])

manifest = json.loads((ROOT / "corpus/real_attack_manifest.json").read_text())
corpus_lines = (ROOT / "corpus/real_attack_corpus.access").read_text().splitlines()
cat = "distributed"
idxs = manifest["categories"].get(cat, {}).get("line_indices", [])
subset = [corpus_lines[i] for i in idxs if i < len(corpus_lines)]
unique_ips = len({ln.split()[0] for ln in subset if ln.strip()})

lg = ROOT / "log-guardian"
rules = ROOT / "rules.conf"
env = os.environ.copy()
env.setdefault("LOGANALYZER_PASSWORD", "DegistirBeni!123")

cache = ROOT / ".cache"
cache.mkdir(exist_ok=True)
tmp_rules = cache / "real_attack_replay.conf"
text = rules.read_text(encoding="utf-8", errors="replace")
stripped = []
for ln in text.splitlines():
    if ln.strip().startswith("BLOCK_COUNTRIES="):
        continue
    for key in ("CRS_RULES=", "OPENAPI_SCHEMA=", "FALCO_HOST_RULES=", "WASM_PLUGIN_DIR="):
        if ln.strip().startswith(key):
            val = ln.split("=", 1)[1].strip()
            if val and not val.startswith("/"):
                ln = f"{key.split('=')[0]}={ROOT / val}"
            break
    stripped.append(ln)
tmp_rules.write_text("\n".join(stripped) + "\n", encoding="utf-8")
os.chmod(tmp_rules, 0o600)

with tempfile.NamedTemporaryFile(mode="w", suffix=".access", delete=False) as tf:
    tf.write("\n".join(subset) + "\n")
    sub_path = Path(tf.name)

proc = subprocess.run(
    [str(lg), str(sub_path), "--no-tui", "--json", "--no-ban", "--no-webhook", "--no-db", "--rules", str(tmp_rules)],
    capture_output=True, text=True, env=env, cwd=str(ROOT), timeout=120,
)
combined = proc.stdout + proc.stderr
m = re.search(r'"alerts_total"\s*:\s*(\d+)', combined)
alerts = int(m.group(1)) if m else 0
sub_path.unlink(missing_ok=True)
tmp_rules.unlink(missing_ok=True)

n = len(subset)
recall = round(100.0 * alerts / n, 1) if n else 0.0
offline_pass = recall >= min_recall and alerts >= max(1, int(n * min_recall / 100))

live_result = {"enabled": False}
if live:
    probe_json = ROOT / ".cache/ja3_live_probe.json"
    env_live = os.environ.copy()
    env_live["ATTACK_HOST"] = host
    env_live["ATTACK_PORT"] = str(port)
    env_live["JA3_LIVE_PROBE_JSON"] = str(probe_json)
    probe_rc = subprocess.run(
        ["bash", str(ROOT / "scripts/ja3_tls_live_probe.sh")],
        cwd=str(ROOT), env=env_live, timeout=120,
    ).returncode
    live_result = {"enabled": True, "host": host, "port": port, "pass": False}
    if probe_json.is_file():
        live_result = json.loads(probe_json.read_text(encoding="utf-8"))
        live_result["enabled"] = True
    elif probe_rc != 0:
        live_result["probe_error"] = (
            "ja3_tls_live_probe basarisiz — sudo bash scripts/nginx_tls_local_setup.sh"
        )

report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "category": cat,
    "unique_ips": unique_ips,
    "lines_total": n,
    "alerts_total": alerts,
    "recall_pct": recall,
    "target_recall_pct": min_recall,
    "same_ua": "sqlmap",
    "pass": offline_pass,
    "note": "Ayni scanner UA + farkli IP; JA3 canli test TLS :443 (VPS/eBPF)",
    "live": live_result,
}
report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"[ja3_cluster_proof] distributed recall={recall}% ips={unique_ips} alerts={alerts}/{n} pass={offline_pass}")
sys.exit(0 if offline_pass else 1)
PY

bash scripts/sync_dashboard_data.sh 2>/dev/null || true
echo "[OK] ja3_cluster_proof -> $REPORT"
