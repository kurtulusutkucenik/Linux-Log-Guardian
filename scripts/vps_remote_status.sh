#!/usr/bin/env bash
# Laptop -> VPS uzaktan durum (72h soak, XDP, guardian)
#   bash scripts/vps_remote_status.sh
#   VPS_HOST=root@157.173.122.198 bash scripts/vps_remote_status.sh
#   source .cache/vps-production.env && bash scripts/vps_remote_status.sh
#   VPS_SSH_IDENTITY=~/.ssh/id_ed25519 bash scripts/vps_remote_status.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
REPORT="${VPS_REMOTE_STATUS_REPORT:-vps-remote-status-report.json}"
ENV_FILE="${VPS_ENV:-$ROOT/.cache/vps-production.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

HOST="${VPS_HOST:-}"
IP="${VPS_IP:-}"
PORT="${VPS_SSH_PORT:-22}"
REMOTE_ROOT="${VPS_REMOTE_ROOT:-/root/Linux-Log-Guardian}"
SSH_IDENTITY="${VPS_SSH_IDENTITY:-}"
QUIET="${QUIET:-1}"
[[ "${VERBOSE:-0}" == "1" || "${VPS_VERBOSE:-0}" == "1" ]] && QUIET=0
VPS_SOAK_REPORT="${VPS_SOAK_REPORT:-vps-soak-report.json}"

if [[ -z "$HOST" && -n "$IP" ]]; then
  HOST="root@${IP}"
fi
[[ -n "$HOST" ]] || { echo "[vps_remote_status] FAIL: VPS_HOST veya VPS_IP gerekli" >&2; exit 1; }

# host:port — BatchMode script'ler icin
SSH_TARGET="$HOST"
if [[ "$HOST" == *:* && "$HOST" != *@*:* ]]; then
  SSH_TARGET="$HOST"
elif [[ "$HOST" == *@* ]]; then
  SSH_TARGET="$HOST"
fi

SSH_BASE=(ssh -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=accept-new -p "$PORT")
SCP_BASE=(scp -o BatchMode=yes -o ConnectTimeout=12 -o StrictHostKeyChecking=accept-new -P "$PORT" -q)
if [[ -n "$SSH_IDENTITY" ]]; then
  SSH_BASE+=(-i "$SSH_IDENTITY")
  SCP_BASE+=(-i "$SSH_IDENTITY")
fi

echo "=== vps_remote_status ==="
echo "  host=${HOST} port=${PORT}"

host_up=false
if command -v nc >/dev/null 2>&1; then
  nc -z -w 5 "${IP:-${HOST#*@}}" "$PORT" >/dev/null 2>&1 && host_up=true
elif command -v timeout >/dev/null 2>&1; then
  timeout 5 bash -c "echo >/dev/tcp/${IP:-${HOST#*@}}/$PORT" 2>/dev/null && host_up=true
fi

RAW="$("${SSH_BASE[@]}" "$SSH_TARGET" bash -s <<REMOTE 2>&1 || true
set -euo pipefail
R="${REMOTE_ROOT}"
for d in "\$R" /root/Linux-Log-Guardian /opt/log-guardian /root/log-guardian /root/Linux\\ Log\\ Guardian /home/*/Linux\\ Log\\ Guardian /home/*/Linux-Log-Guardian; do
  [[ -d "\$d" ]] && cd "\$d" && break
done
echo "HOSTNAME=\$(hostname 2>/dev/null || echo ?)"
echo "PWD=\$(pwd)"
if command -v log-guardian >/dev/null; then
  log-guardian --status --quiet 2>/dev/null | head -c 800 || true
  echo ""
fi
if [[ -f scripts/soak_status.sh ]]; then
  echo "--- soak_status ---"
  bash scripts/soak_status.sh 2>/dev/null | head -20
elif systemctl is-active log-guardian-soak >/dev/null 2>&1; then
  echo "--- systemd soak ---"
  systemctl is-active log-guardian-soak
  systemctl status log-guardian-soak --no-pager 2>/dev/null | head -10
else
  echo "SOAK=unknown"
fi
if [[ -f vps-xdp-report.json ]]; then
  python3 -c "import json; r=json.load(open('vps-xdp-report.json')); print('XDP pass=',r.get('pass'),'mode=',r.get('mode','?'))" 2>/dev/null || true
fi
REMOTE
)"

ssh_ok=false
auth_error=false
connection_error=false
if echo "$RAW" | grep -qE '^HOSTNAME='; then
  ssh_ok=true
  host_up=true
  if [[ "$QUIET" != "1" ]]; then
    echo "$RAW"
  else
    hn=$(echo "$RAW" | grep -E '^HOSTNAME=' | head -1 | cut -d= -f2-)
    pwd_r=$(echo "$RAW" | grep -E '^PWD=' | head -1 | cut -d= -f2-)
    echo "  SSH OK · ${hn:-?} · ${pwd_r:-?}"
  fi
elif echo "$RAW" | grep -qiE 'permission denied|publickey|authentication failed'; then
  auth_error=true
  host_up=true
  echo "[WARN] SSH auth — anahtar yok veya yanlis kullanici:" >&2
  echo "$RAW" >&2
elif echo "$RAW" | grep -qiE 'timed out|no route|connection refused|could not resolve'; then
  connection_error=true
  echo "[FAIL] SSH baglanti hatasi:" >&2
  echo "$RAW" >&2
else
  echo "[FAIL] SSH komut hatasi:" >&2
  echo "$RAW" >&2
fi

pass=false
if [[ "$ssh_ok" == true ]]; then
  pass=true
  for rel in soak-report.json soak-report.short.json vps-xdp-report.json; do
    remote_path="${REMOTE_ROOT%/}/$rel"
    local_name="$ROOT/vps-${rel}"
    [[ "$rel" == "soak-report.json" ]] && local_name="$ROOT/$VPS_SOAK_REPORT"
    [[ "$rel" == "soak-report.short.json" ]] && local_name="$ROOT/vps-soak-report.short.json"
    [[ "$rel" == "vps-xdp-report.json" ]] && local_name="$ROOT/vps-xdp-remote-report.json"
    "${SCP_BASE[@]}" "${SSH_TARGET}:${remote_path}" "$local_name" 2>/dev/null \
      && echo "[OK] cekildi: $rel -> $(basename "$local_name")" || true
  done
fi

python3 - "$REPORT" "$HOST" "$PORT" "$host_up" "$ssh_ok" "$auth_error" "$connection_error" "$pass" "$RAW" "$ROOT/$VPS_SOAK_REPORT" <<'PY'
import datetime
import json
import re
import sys
from pathlib import Path

def b(x):
    return str(x).lower() == "true"

host_up = b(sys.argv[4])
ssh_ok = b(sys.argv[5])
auth_error = b(sys.argv[6])
connection_error = b(sys.argv[7])
pass_ = b(sys.argv[8])
raw = sys.argv[9]

hostname = None
remote_root = None
xdp_mode = None
soak_active = None
soak_mode = None
soak_elapsed = None
soak_progress = None
soak_proof_72h = None
eps = None
rm = re.search(r"running: PID=\d+ \(elapsed ([^)]+)\)\s+mod=(\S+)", raw)
if rm:
    soak_active = True
    soak_elapsed = rm.group(1)
    soak_mode = rm.group(2)
pm = re.search(r"ilerleme: ~([0-9.]+)%", raw)
if pm:
    soak_progress = float(pm.group(1))
sm = re.search(r"report \(onceki kosu[^)]*\):\s*\?\s*([0-9.]+)h strict=True operational=True failures=0/864", raw)
if sm:
    soak_proof_72h = float(sm.group(1))
for line in raw.splitlines():
    line = line.strip()
    if line.startswith("HOSTNAME="):
        hostname = line.split("=", 1)[1]
    elif line.startswith("PWD="):
        remote_root = line.split("=", 1)[1]
    elif line.startswith("XDP pass="):
        m = re.search(r"mode=\s*(\S+)", line)
        if m:
            xdp_mode = m.group(1)
    elif line.startswith("{") and '"xdp_mode"' in line:
        try:
            # status JSON tek satirda kesilebilir — regex ile alan cek
            xm = re.search(r'"xdp_mode"\s*:\s*"([^"]+)"', line)
            if xm:
                xdp_mode = xm.group(1)
            em = re.search(r'"eps"\s*:\s*([0-9.]+)', line)
            if em:
                eps = float(em.group(1))
        except (ValueError, TypeError):
            pass
    elif "--- soak_status ---" in line or line.startswith("running: PID="):
        soak_active = True

if soak_active is None and "log-guardian-soak" in raw:
    soak_active = "active (running)" in raw.lower()
if soak_active is None and "running: PID=" in raw:
    soak_active = True
if eps is None:
    em = re.search(r'"eps"\s*:\s*([0-9.]+)', raw)
    if em:
        eps = float(em.group(1))

soak_report_path = sys.argv[10]
soak_synced = None
soak_failures = None
if Path(soak_report_path).is_file():
    try:
        sr = json.loads(Path(soak_report_path).read_text(encoding="utf-8"))
        soak_synced = True
        soak_proof_72h = soak_proof_72h or sr.get("duration_hours")
        soak_failures = sr.get("failures")
        if sr.get("pass") is True and (soak_proof_72h or 0) >= 72:
            soak_proof_72h = float(soak_proof_72h)
    except (json.JSONDecodeError, OSError, TypeError, ValueError):
        soak_synced = False

out = {
    "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "pass": pass_,
    "reachable": ssh_ok,
    "host_up": host_up,
    "ssh_ok": ssh_ok,
    "auth_error": auth_error,
    "connection_error": connection_error,
    "host": sys.argv[2],
    "port": int(sys.argv[3]),
    "hostname": hostname,
    "remote_root": remote_root,
    "xdp_mode": xdp_mode,
    "soak_active": soak_active,
    "soak_mode": soak_mode,
    "soak_elapsed": soak_elapsed,
    "soak_progress": soak_progress,
    "soak_proof_72h": soak_proof_72h,
    "soak_synced": soak_synced,
    "soak_failures": soak_failures,
    "eps": eps,
    "raw_excerpt": raw[:4000],
    "script": "scripts/vps_remote_status.sh",
}
if auth_error:
    out["hint"] = "ssh-copy-id root@HOST  # veya VPS_SSH_IDENTITY=~/.ssh/key"
Path(sys.argv[1]).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(json.dumps(out, indent=2, ensure_ascii=False))
PY

if [[ "$pass" == true ]]; then
  echo "[OK] vps_remote_status — $REPORT"
  exit 0
fi
if [[ "$auth_error" == true ]]; then
  echo "[WARN] vps_remote_status — VPS ayakta, SSH anahtari gerekli: ssh-copy-id ${HOST#*@}" >&2
  exit 1
fi
echo "[WARN] vps_remote_status — VPS'e ulasilamadi (firewall/port?)" >&2
exit 1
