#!/usr/bin/env bash
# Caddy prod stack — ban API mTLS (client cert + mutation token inject)
#   bash scripts/caddy_mtls_setup.sh enable
#   bash scripts/caddy_mtls_setup.sh disable
#   bash scripts/caddy_mtls_setup.sh status
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/lib/guardian_api.sh
source "$ROOT/scripts/lib/guardian_api.sh"

CONF="${LG_RULES:-/etc/log-guardian/rules.conf}"
MTLS_D="${ROOT}/deploy/mtls"
MTLS_SNIP_D="${ROOT}/deploy/mtls.d"
CACHE_MTLS="${MTLS_DIR:-$ROOT/.cache/mtls-lab}"
STAMP="${MTLS_SNIP_D}/.enabled"

write_snippets() {
  cat >"$MTLS_SNIP_D/10-mtls-api.caddy" <<'EOF'
# Enterprise SOAR — mTLS ban API (ayri port; dashboard :8443 degismez)
:9443 {
	tls /etc/caddy/mtls/server.crt /etc/caddy/mtls/server.key {
		client_auth {
			mode require_and_verify
			trust_pool file /etc/caddy/mtls/ca.crt
		}
	}
	reverse_proxy http://ban-api-relay:18090 {
		header_up X-Guardian-Token {$GUARDIAN_API_MUTATION_TOKEN}
		header_up Host {host}
	}
}
EOF
}

write_disabled() {
  rm -f "$MTLS_SNIP_D/10-mtls-api.caddy" "$MTLS_SNIP_D/10-tls-client-auth.caddy" \
    "$MTLS_SNIP_D/20-api-route.caddy" "$STAMP"
  cat >"$MTLS_SNIP_D/99-disabled.caddy" <<'EOF'
# Ban API mTLS (Caddy) kapali — etkinlestir:
#   bash scripts/caddy_mtls_setup.sh enable
EOF
}

sync_certs() {
  bash "$ROOT/scripts/mtls_client_issue.sh"
  mkdir -p "$MTLS_D"
  install -m 644 "$CACHE_MTLS/ca.crt" "$MTLS_D/ca.crt"
  install -m 644 "$CACHE_MTLS/server.crt" "$MTLS_D/server.crt"
  install -m 600 "$CACHE_MTLS/server.key" "$MTLS_D/server.key"
  install -m 644 "$CACHE_MTLS/client.crt" "$MTLS_D/client.crt"
  install -m 600 "$CACHE_MTLS/client.key" "$MTLS_D/client.key"
  # Laptop: operator curl e2e (non-root) client key okuyabilsin; server key root kalsin
  local op="${SUDO_USER:-${LG_OWNER:-}}"
  if [[ -n "$op" && "$op" != root ]]; then
    chown "$op:$op" "$MTLS_D/client.crt" "$MTLS_D/client.key" 2>/dev/null || true
    chmod 644 "$MTLS_D/client.crt"
    chmod 600 "$MTLS_D/client.key"
  fi
}

enable() {
  echo "=== caddy_mtls_setup enable ==="
  mut_tok="$(read_lg_api_mutation_token 2>/dev/null || true)"
  [[ -n "$mut_tok" ]] || {
    echo "[caddy_mtls_setup] API_MUTATION_TOKEN yok — sudo bash scripts/ensure_api_split_tokens.sh" >&2
    exit 1
  }
  sync_certs
  write_snippets
  rm -f "$MTLS_SNIP_D/99-disabled.caddy"
  date -u +%Y-%m-%dT%H:%M:%SZ >"$STAMP"

  export GUARDIAN_API_MUTATION_TOKEN="$mut_tok"
  read_tok="$(read_lg_api_token)"
  export GUARDIAN_API_TOKEN="$read_tok"

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
    docker compose -f docker-compose.prod.yml up -d host-api-bridge ban-api-relay caddy
    docker compose -f docker-compose.prod.yml restart caddy
    sleep 2
    echo "[OK] caddy yeniden baslatildi (mTLS snippet + token env)"
  else
    echo "[WARN] caddy ayakta degil — sonra: docker compose -f docker-compose.prod.yml up -d caddy"
  fi
  echo "[OK] caddy mTLS enable — test: bash scripts/caddy_api_mtls_e2e.sh"
  bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
}

disable() {
  echo "=== caddy_mtls_setup disable ==="
  write_disabled
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
    docker compose -f docker-compose.prod.yml restart caddy
    sleep 1
  fi
  echo "[OK] caddy mTLS disable"
  bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
}

status() {
  if [[ -f "$STAMP" && -f "$MTLS_SNIP_D/10-mtls-api.caddy" ]]; then
    echo "enabled since $(cat "$STAMP")"
    echo "certs: $MTLS_D"
    exit 0
  fi
  echo "disabled"
  exit 0
}

sync_only() {
  echo "=== caddy_mtls_setup sync ==="
  sync_certs
  if [[ -f "$STAMP" && -f "$MTLS_SNIP_D/10-mtls-api.caddy" ]]; then
    mut_tok="$(read_lg_api_mutation_token 2>/dev/null || true)"
    [[ -n "$mut_tok" ]] || {
      echo "[caddy_mtls_setup] API_MUTATION_TOKEN yok" >&2
      exit 1
    }
    export GUARDIAN_API_MUTATION_TOKEN="$mut_tok"
    export GUARDIAN_API_TOKEN="$(read_lg_api_token)"
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx log-guardian-caddy; then
      docker compose -f docker-compose.prod.yml up -d host-api-bridge ban-api-relay caddy
      docker compose -f docker-compose.prod.yml restart caddy
      sleep 2
      echo "[OK] caddy yeniden baslatildi (mtls cert sync)"
    fi
    bash "$ROOT/scripts/caddy_mtls_status_export.sh" 2>/dev/null || true
  fi
  echo "[OK] caddy_mtls_setup sync"
}

case "${1:-status}" in
  enable) enable ;;
  disable) disable ;;
  sync) sync_only ;;
  status) status ;;
  *)
    echo "Kullanim: bash scripts/caddy_mtls_setup.sh {enable|disable|sync|status}" >&2
    exit 1
    ;;
esac
