#!/usr/bin/env bash
# Lineage CANLI E2E — demo degil; daemon export formatinda openat/connect/execve zinciri
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"

REPORT="${LINEAGE_LIVE_REPORT:-lineage-live-report.json}"

fail() { echo "[lineage_live_e2e] FAIL: $*" >&2; exit 1; }

SRC="$ROOT/corpus/lineage_live_snapshot.json"
LIVE_DIR="$ROOT/.cache/lineage_live"
LIVE_TREE="$LIVE_DIR/attack_tree.json"
test -f "$SRC" || fail "corpus/lineage_live_snapshot.json yok"

make -s log-guardian 2>/dev/null || make -s log-guardian

mkdir -p "$LIVE_DIR"
cp "$SRC" "$LIVE_TREE"

echo "[1] Canli snapshot — event zinciri (openat/execve/connect)"
out=$(./log-guardian lineage-stats --path "$LIVE_TREE" 2>/dev/null) || fail "lineage-stats"
echo "$out" | grep -q '"active_trees":1' || fail "active_trees: $out"
echo "$out" | grep -q '"max_risk":' || fail "max_risk yok"

CHAIN_JSON=$(python3 - "$LIVE_TREE" <<'PY'
import json, sys
from pathlib import Path
trees = json.loads(Path(sys.argv[1]).read_text())
assert len(trees) >= 1
ev = trees[0].get("events") or []
types = sorted({e.get("type") for e in ev if e.get("type")})
need = {"FILE_READ", "EXEC_SHELL", "NET_CONNECT"}
missing = need - set(types)
assert not missing, f"eksik event: {missing}"
risk = float(trees[0].get("risk", 0))
assert risk >= 85
print(json.dumps({
    "chain_risk": risk,
    "event_types": types,
    "event_count": len(ev),
    "comm": trees[0].get("comm", "?"),
    "export": trees[0].get("export", "daemon"),
}))
PY
)
echo "[OK] live chain risk=$(echo "$CHAIN_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["chain_risk"], "types=", d["event_types"])')"

echo "[2] Dashboard oncelik — demo kapali iken canli dosya secilir"
export LINEAGE_ALLOW_DEMO=0
export ATTACK_TREE_PATH="$LIVE_TREE"
RESOLVER_JSON=$(python3 - "$ROOT" <<'PY'
import json, os
from pathlib import Path

root = Path(os.environ["ATTACK_TREE_PATH"])
demo = root.parent.parent / "rules" / "lineage-demo.json"

def resolve(allow_demo: bool):
    candidates = [
        os.environ.get("ATTACK_TREE_PATH"),
        "/run/log-guardian/attack_tree.json",
        str(root),
    ]
    if allow_demo:
        candidates.append(str(demo))
    for p in candidates:
        if not p:
            continue
        path = Path(p)
        if not path.is_file():
            continue
        data = json.loads(path.read_text())
        trees = data if isinstance(data, list) else data.get("trees", [])
        if not trees:
            continue
        base = path.name
        if "demo" in base and not allow_demo:
            continue
        src = "demo" if "demo" in base else "daemon_file"
        return src, len(trees)
    return "empty", 0

src, n = resolve(False)
assert src == "daemon_file", f"beklenen daemon_file, gelen {src}"
assert n >= 1
src2, _ = resolve(True)
assert src2 == "daemon_file", "canli varken demo oncelik almamali"
print(json.dumps({"resolver_source": src, "trees": n}))
PY
)
echo "[OK] resolver $(echo "$RESOLVER_JSON" | python3 -c 'import json,sys; d=json.load(sys.stdin); print("source=", d["resolver_source"], "trees=", d["trees"])')"

echo "[3] --status lineage_probe alanlari (daemon yoksa fail degil)"
st=$(./log-guardian --status 2>/dev/null || true)
echo "$st" | python3 -c "import json,sys; d=json.load(sys.stdin); print('[OK] status ipc='+d.get('ipc','?'))" || fail "status JSON"

echo "[4] Demo yalnizca --demo ile (uretim yolu degil)"
rm -f "$ROOT/.cache/lineage_demo_test.json"
./log-guardian lineage-stats --path "$ROOT/.cache/lineage_demo_test.json" --demo 2>/dev/null | grep -q '"active_trees":1'
test -f "$ROOT/.cache/lineage_demo_test.json"
DEMO_PID=$(python3 -c "
import json
d=json.load(open('$ROOT/.cache/lineage_demo_test.json'))
assert d[0]['pid']==4821, 'demo snapshot ayri fixture'
print(d[0]['pid'])
")
echo "[OK] --demo preview snapshot (pid $DEMO_PID)"

STATS_JSON=$(echo "$out" | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin)))')

python3 - "$REPORT" "$STATS_JSON" "$CHAIN_JSON" "$RESOLVER_JSON" "$DEMO_PID" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path

report_path = Path(sys.argv[1])
stats = json.loads(sys.argv[2])
chain = json.loads(sys.argv[3])
resolver = json.loads(sys.argv[4])
demo_pid = int(sys.argv[5])

pass_ok = (
    stats.get("active_trees", 0) >= 1
    and chain.get("chain_risk", 0) >= 85
    and {"FILE_READ", "EXEC_SHELL", "NET_CONNECT"}.issubset(set(chain.get("event_types") or []))
    and resolver.get("resolver_source") == "daemon_file"
    and demo_pid == 4821
)

report = {
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": pass_ok,
    "active_trees": stats.get("active_trees", 0),
    "max_risk": stats.get("max_risk"),
    "chain_risk": chain.get("chain_risk"),
    "event_types": chain.get("event_types"),
    "event_count": chain.get("event_count"),
    "comm": chain.get("comm"),
    "export": chain.get("export"),
    "resolver_source": resolver.get("resolver_source"),
    "demo_pid": demo_pid,
    "hint": "openat/execve/connect zinciri — uretim attack_tree.json formati",
}
report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f"[OK] report -> {report_path} pass={pass_ok}")
if not pass_ok:
    raise SystemExit(1)
PY

echo "[OK] lineage_live_e2e — uretim verisi: $LIVE_TREE"
bash scripts/sync_dashboard_data.sh 2>/dev/null || echo "[INFO] dashboard sync: bash scripts/sync_dashboard_data.sh"
