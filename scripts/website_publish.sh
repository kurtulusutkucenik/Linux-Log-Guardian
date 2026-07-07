#!/usr/bin/env bash
# Canli site yayini — Next.js landing/ -> Cloudflare Pages (production)
# Calistir: bash scripts/website_publish.sh   (repo kokunden veya herhangi bir yerden)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/lib/cf_env.sh
source "$ROOT/scripts/lib/cf_env.sh"
LANDING="$ROOT/landing"
OUT="$LANDING/out"
PROJECT="${LG_CF_PAGES_PROJECT:-linux-log-guardian-website}"
BRANCH="${LG_CF_PAGES_BRANCH:-main}"

if command -v wrangler >/dev/null 2>&1; then
  WRANGLER=(wrangler)
elif [[ -x "${HOME}/.nvm/versions/node/v20.20.2/bin/wrangler" ]]; then
  WRANGLER=("${HOME}/.nvm/versions/node/v20.20.2/bin/wrangler")
else
  echo "[FAIL] wrangler bulunamadi — once: npm i -g wrangler && wrangler login" >&2
  exit 1
fi

echo "=== website_publish ==="
echo "  proje: $PROJECT"
echo "  branch: $BRANCH (production)"
echo "  cikti: landing/out"
echo ""

bash "$ROOT/scripts/website_deploy_gate.sh"

echo ""
echo "=== Cloudflare Pages deploy ==="
"${WRANGLER[@]}" pages deploy "$OUT" \
  --project-name="$PROJECT" \
  --branch="$BRANCH" \
  --commit-dirty=true

echo ""
echo "[OK] website_publish"
echo "  Canli: https://ceniklinuxlogguardian.org"
echo "  www:   https://www.ceniklinuxlogguardian.org"
echo "  Not:   tarayicida Ctrl+Shift+R (cache temizle)"
echo ""

if [[ "${LG_CF_PURGE:-1}" == "1" ]] && [[ -n "${LG_CF_API_TOKEN:-${CLOUDFLARE_API_TOKEN:-}}" ]]; then
  echo "=== CF cache purge (deploy sonrasi) ==="
  if bash "$ROOT/scripts/website_cf_purge.sh"; then
    echo "[website_publish] purge sonrasi 30sn bekleniyor..."
    sleep 30
  else
    echo "[WARN] website_cf_purge atlandi" >&2
  fi
elif [[ "${LG_CF_PURGE:-1}" == "1" ]]; then
  echo "[WARN] LG_CF_API_TOKEN yok — ~/.config/log-guardian/cloudflare.env (ornek: scripts/cloudflare.env.example)" >&2
  echo "  Manuel: Cloudflare → Purge Everything" >&2
  echo "[website_publish] token yok — CF yayilim beklemesi (${LG_LIVE_GATE_WARMUP_SEC:-20}s)..."
  sleep "${LG_LIVE_GATE_WARMUP_SEC:-20}"
fi

if [[ "${WEBSITE_PUBLISH_SKIP_LIVE_GATE:-0}" == "1" ]]; then
  echo "[SKIP] website_live_gate — WEBSITE_PUBLISH_SKIP_LIVE_GATE=1"
  exit 0
fi

_live_gate_retries="${LG_LIVE_GATE_RETRIES:-3}"
_live_gate_wait="${LG_LIVE_GATE_RETRY_SEC:-15}"
_live_gate_ok=0
for attempt in $(seq 1 "$_live_gate_retries"); do
  if bash "$ROOT/scripts/website_live_gate.sh"; then
    echo "[OK] website_live_gate (post-publish parity, deneme ${attempt}/${_live_gate_retries})"
    _live_gate_ok=1
    break
  fi
  if [[ "$attempt" -lt "$_live_gate_retries" ]]; then
    echo "[WARN] website_live_gate deneme ${attempt}/${_live_gate_retries} — ${_live_gate_wait}s sonra tekrar (CF cache)" >&2
    sleep "$_live_gate_wait"
  fi
done
if [[ "$_live_gate_ok" != "1" ]]; then
  echo "[WARN] website_live_gate FAIL — Purge Everything veya: bash scripts/website_live_gate.sh" >&2
  exit 1
fi
