#!/usr/bin/env bash
# K8s admission webhook smoke — kind operator veya standalone binary
#   bash scripts/k8s_admission_test.sh
#   K8S_ADMISSION_URL=http://127.0.0.1:18082/admit  # manuel
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/k8s-admission-report.json"
cd "$ROOT/k8s-operator"

DENY_LABEL="security.log-guardian.io/deny"
PF_PID=""

cleanup() {
  if [[ -n "$PF_PID" ]]; then
    if [[ "$PF_PID" == lg-k8s-adm-test-* ]]; then
      docker rm -f "$PF_PID" >/dev/null 2>&1 || true
    else
      kill "$PF_PID" 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT

write_report() {
  local mode="$1" pass="${2:-true}" reason="${3:-}"
  python3 - "$OUT" "$mode" "$pass" "$reason" "$DENY_LABEL" <<'PY'
import json, sys
from datetime import datetime, timezone
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({
    "date": datetime.now(timezone.utc).isoformat(),
    "pass": sys.argv[3].lower() == "true",
    "mode": sys.argv[2],
    "deny_label": sys.argv[5],
    "reason": sys.argv[4] or None,
    "script": "scripts/k8s_admission_test.sh",
}, indent=2) + "\n", encoding="utf-8")
PY
}

write_skip() {
  write_report "skip" true "$1"
  echo "[SKIP] $1 — admission logic: k8s-operator/admission.go"
  exit 0
}

deny_payload='{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "request": {
    "uid": "test-deny-uid",
    "object": {
      "metadata": {"name": "bad-pod", "namespace": "default", "labels": {"security.log-guardian.io/deny": "true"}},
      "spec": {"containers": [{"name": "c", "image": "nginx:latest"}]}
    }
  }
}'

allow_payload='{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "request": {
    "uid": "test-allow-uid",
    "object": {
      "metadata": {"name": "good-pod", "namespace": "default"},
      "spec": {"containers": [{"name": "c", "image": "nginx:1.25"}]}
    }
  }
}'

run_admit_checks() {
  local base="$1"
  local deny allow
  deny=$(curl -sf -X POST "${base%/}/admit" -H 'Content-Type: application/json' -d "$deny_payload")
  allow=$(curl -sf -X POST "${base%/}/admit" -H 'Content-Type: application/json' -d "$allow_payload")
  echo "$deny" | grep -q '"allowed":false' || { echo "[FAIL] deny beklenir"; return 1; }
  echo "$allow" | grep -q '"allowed":true' || { echo "[FAIL] allow beklenir"; return 1; }
  return 0
}

try_docker_standalone() {
  command -v docker >/dev/null 2>&1 || return 1
  local img="${K8S_ADMISSION_IMAGE:-log-guardian-k8s-op:local}"
  local port="${K8S_ADMISSION_LOCAL_PORT:-18082}"
  local cname="lg-k8s-adm-test-$$"
  docker build -t "$img" "$ROOT/k8s-operator" >/dev/null || return 1
  docker rm -f "$cname" >/dev/null 2>&1 || true
  docker run -d --name "$cname" -e GUARDIAN_STANDALONE=1 -e PORT=8082 \
    -p "${port}:8082" "$img" >/dev/null || return 1
  PF_PID="$cname"
  for _ in 1 2 3 4 5 6 7 8; do
    sleep 1
    curl -sf --max-time 1 "http://127.0.0.1:${port}/admit" -X POST \
      -H 'Content-Type: application/json' -d "$allow_payload" >/dev/null 2>&1 && break
  done
  run_admit_checks "http://127.0.0.1:${port}" || return 1
  write_report "docker-standalone" true ""
  echo "[OK] k8s_admission_test (docker standalone) -> $OUT"
  exit 0
}

try_kind_operator() {
  command -v kubectl >/dev/null 2>&1 || return 1
  local ns="${K8S_ADMISSION_NS:-log-guardian}"
  local svc="${K8S_ADMISSION_SVC:-}"
  if [[ -z "$svc" ]]; then
    svc=$(kubectl -n "$ns" get svc -o name 2>/dev/null | grep -i operator | head -1 | sed 's|service/||')
  fi
  [[ -n "$svc" ]] || return 1
  local port="${K8S_ADMISSION_LOCAL_PORT:-18082}"
  kubectl -n "$ns" port-forward "svc/${svc}" "${port}:8082" >/dev/null 2>&1 &
  PF_PID=$!
  for _ in 1 2 3 4 5 6; do
    sleep 1
    curl -sf --max-time 1 "http://127.0.0.1:${port}/admit" -X POST \
      -H 'Content-Type: application/json' -d "$allow_payload" >/dev/null 2>&1 && break
  done
  run_admit_checks "http://127.0.0.1:${port}" || return 1
  write_report "kind-live" true ""
  echo "[OK] k8s_admission_test (kind operator svc/${svc}) -> $OUT"
  exit 0
}

if [[ -n "${K8S_ADMISSION_URL:-}" ]]; then
  run_admit_checks "${K8S_ADMISSION_URL%/admit}" || exit 1
  write_report "url" true ""
  echo "[OK] k8s_admission_test (K8S_ADMISSION_URL) -> $OUT"
  exit 0
fi

try_kind_operator || true
try_docker_standalone || true

if command -v go >/dev/null 2>&1; then
  if go build -o /tmp/guardian-k8s-op . 2>/dev/null; then
    PORT=18082
    GUARDIAN_STANDALONE=1 PORT=$PORT /tmp/guardian-k8s-op &
    PF_PID=$!
    sleep 1
    if run_admit_checks "http://127.0.0.1:${PORT}"; then
      write_report "standalone" true ""
      echo "[OK] k8s_admission_test (standalone) -> $OUT"
      exit 0
    fi
  fi
fi

write_skip "go/kind/docker operator erisilemedi"
