#!/usr/bin/env bash
# kubectl + kind — Linux Mint/Ubuntu (apt'te kubectl paketi yok)
#   bash scripts/install_k8s_cli.sh
# Helm ayri: curl .../get-helm-3 | bash  -> /usr/local/bin/helm
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BIN="${LG_K8S_BIN:-$HOME/.local/bin}"
KVER="${KUBECTL_VERSION:-$(curl -fsSL https://dl.k8s.io/release/stable.txt)}"
KIND_VER="${KIND_VERSION:-v0.29.0}"

fail() { echo "[install_k8s_cli] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

mkdir -p "$BIN"

echo "=== install_k8s_cli ==="
echo "[install_k8s_cli] kubectl $KVER -> $BIN"

tmp="$(mktemp)"
curl -fsSL "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl" -o "$tmp"
curl -fsSL "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl.sha256" -o "${tmp}.sha256"
echo "$(cat "${tmp}.sha256")  $tmp" | sha256sum -c -
install -m 0755 "$tmp" "$BIN/kubectl"
rm -f "$tmp" "${tmp}.sha256"

curl -fsSL -o "$tmp" "https://kind.sigs.k8s.io/dl/${KIND_VER}/kind-linux-amd64"
install -m 0755 "$tmp" "$BIN/kind"
rm -f "$tmp"

export PATH="$BIN:$PATH"
kubectl version --client --short
kind version

if command -v helm >/dev/null 2>&1; then
  ok "helm $(helm version --short)"
else
  echo "[INFO] helm yok —: curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash"
fi

case ":$PATH:" in
  *":$BIN:"*) ;;
  *)
    echo "[INFO] PATH'e ekleyin: export PATH=\"\$PATH:$BIN\""
    ;;
esac

echo ""
echo "[OK] install_k8s_cli tamam"
echo "  bash scripts/k8s_kind_e2e.sh"
echo "  K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 bash scripts/k8s_kind_e2e.sh"
