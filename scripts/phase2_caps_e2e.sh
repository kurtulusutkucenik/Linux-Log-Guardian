#!/usr/bin/env bash
# Faz 2 — daemon_stats caps (execve/lineage); daemon yoksa lineage demo yeterli
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
make -s log-guardian

STATS="/run/log-guardian/daemon_stats.json"
if [[ -r "$STATS" ]]; then
  echo "[1] daemon_stats okunuyor: $STATS"
  if grep -qE '"lineage_probe"[[:space:]]*:[[:space:]]*1' "$STATS"; then
    echo "[2] lineage_probe=ON (canli BPF)"
    if grep -qE '"execve_probe"[[:space:]]*:[[:space:]]*1' "$STATS"; then
      echo "[3] execve_probe=ON (canli BPF)"
    else
      echo "[3] execve_probe=OFF"
    fi
  else
    echo "[2] lineage_probe=OFF — laptop / BPF kapali; demo + e2e yeterli"
    ./log-guardian lineage-stats --demo 2>/dev/null | grep -q '"active_trees":1'
    test -r ./attack_tree.json || test -r "$ROOT/.cache/lineage_live/attack_tree.json"
  fi
else
  echo "[1] daemon_stats yok — lineage demo"
  ./log-guardian lineage-stats --demo 2>/dev/null | grep -q '"active_trees":1'
  test -r ./attack_tree.json || test -r "$ROOT/.cache/lineage_live/attack_tree.json"
fi

bash scripts/incident_e2e.sh
bash scripts/falco_host_e2e.sh
bash scripts/lineage_e2e.sh
echo "OK — phase2_caps_e2e"
