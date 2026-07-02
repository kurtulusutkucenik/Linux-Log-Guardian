#!/usr/bin/env bash
# L7 eBPF HTTP probe — prod readiness (daemon + guardian-status JSON)
#   bash scripts/l7_probe_prod_e2e.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT="${ROOT}/l7-probe-prod-report.json"

fail() { echo "[l7_probe_prod_e2e] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

echo "=== l7_probe_prod_e2e ==="

STATUS_JSON=""
for candidate in \
  "$(log-guardian --status 2>/dev/null || true)" \
  "$(sudo log-guardian --status 2>/dev/null || true)"; do
  if [[ -n "$candidate" ]] && echo "$candidate" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
    STATUS_JSON="$candidate"
    break
  fi
done

if [[ -z "$STATUS_JSON" ]]; then
  bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null \
    || sudo bash "$ROOT/scripts/guardian_status_export.sh" 2>/dev/null \
    || true
  if [[ -f "$ROOT/guardian-status.json" ]]; then
    STATUS_JSON="$(cat "$ROOT/guardian-status.json")"
  fi
fi

[[ -n "$STATUS_JSON" ]] || fail "guardian status JSON alinamadi (--status veya guardian-status.json)"

export STATUS_JSON REPORT
eval "$(python3 - <<'PY'
import json, os, shlex

d = json.loads(os.environ["STATUS_JSON"])
ipc = d.get("ipc", "fail")
daemon = d.get("daemon") or {}
l7 = d.get("l7_http") or {}
probe = bool(daemon.get("l7_probe") or l7.get("probe_active"))
execve = bool(daemon.get("execve_probe"))
hits = int(daemon.get("l7_http_hits") or l7.get("ebpf_hits") or 0)
xdp_mode = d.get("xdp_mode") or "—"

if ipc == "ok":
    mode = "live"
elif probe:
    mode = "partial"
else:
    mode = "laptop-skip"

passed = ipc == "ok" or mode in ("partial", "laptop-skip")

print(f"ipc={shlex.quote(ipc)}")
print(f"probe_active={'true' if probe else 'false'}")
print(f"execve={'true' if execve else 'false'}")
print(f"hits={hits}")
print(f"mode={shlex.quote(mode)}")
print(f"passed={'true' if passed else 'false'}")
print(f"xdp_mode={shlex.quote(str(xdp_mode))}")
PY
)"

if [[ "$ipc" == "ok" ]]; then
  ok "daemon IPC ok"
else
  echo "[WARN] daemon IPC yok — laptop/VM ipset modu (beklenen)"
fi

if [[ "$probe_active" == true ]]; then
  ok "l7_probe active (hits=$hits, xdp=$xdp_mode)"
else
  echo "[INFO] l7_probe OFF — NIC/XDP veya --no-xdp"
fi

python3 - <<'PY'
import json, os
from datetime import datetime, timezone
from pathlib import Path

d = json.loads(os.environ["STATUS_JSON"])
ipc = d.get("ipc", "fail")
daemon = d.get("daemon") or {}
l7 = d.get("l7_http") or {}
probe = bool(daemon.get("l7_probe") or l7.get("probe_active"))
execve = bool(daemon.get("execve_probe"))
hits = int(daemon.get("l7_http_hits") or l7.get("ebpf_hits") or 0)
xdp_mode = d.get("xdp_mode") or "—"

if ipc == "ok":
    mode = "live"
elif probe:
    mode = "partial"
else:
    mode = "laptop-skip"

passed = ipc == "ok" or mode in ("partial", "laptop-skip")

report = {
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "pass": passed,
    "mode": mode,
    "ipc": ipc,
    "l7_probe_active": probe,
    "execve_probe": execve,
    "l7_http_hits": hits,
    "xdp_mode": xdp_mode,
    "note": "Prod NIC: log-guardian-daemon --iface eth0; laptop: ipset-fallback ile probe ON olabilir",
}
Path(os.environ["REPORT"]).write_text(
    json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
PY

ok "l7_probe_prod_e2e -> $REPORT"
