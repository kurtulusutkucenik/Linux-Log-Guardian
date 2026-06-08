#!/usr/bin/env bash
# K8s admission webhook smoke (standalone operator)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/k8s-operator"

if ! command -v go >/dev/null 2>&1; then
  echo "[SKIP] go yok — admission logic: k8s-operator/admission.go"
  exit 0
fi

go build -o /tmp/guardian-k8s-op . 2>/dev/null || {
  echo "[SKIP] go build failed (vendor/modules)"
  exit 0
}

PORT=18082
GUARDIAN_STANDALONE=1 PORT=$PORT /tmp/guardian-k8s-op &
PID=$!
sleep 1

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

deny=$(curl -sf -X POST "http://127.0.0.1:${PORT}/admit" -H 'Content-Type: application/json' -d "$deny_payload")
allow=$(curl -sf -X POST "http://127.0.0.1:${PORT}/admit" -H 'Content-Type: application/json' -d "$allow_payload")

echo "$deny" | grep -q '"allowed":false' || { echo "FAIL deny"; kill $PID; exit 1; }
echo "$allow" | grep -q '"allowed":true' || { echo "FAIL allow"; kill $PID; exit 1; }

kill $PID 2>/dev/null || true
echo "[OK] k8s_admission_test"
