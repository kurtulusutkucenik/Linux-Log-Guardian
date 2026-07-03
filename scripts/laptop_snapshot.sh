#!/usr/bin/env bash
# Laptop snapshot — repo + /etc/log-guardian + operator secrets + runtime manifest
#   bash scripts/laptop_snapshot.sh
#   DEST_DIR=~/Belgeler/lg-snapshots bash scripts/laptop_snapshot.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST_DIR="${DEST_DIR:-$HOME/Belgeler/lg-snapshots}"
WORK="$DEST_DIR/lg-snapshot-$STAMP"
ARCHIVE="$DEST_DIR/lg-snapshot-$STAMP.tar.zst"

mkdir -p "$DEST_DIR" "$WORK"

echo "[1/4] operator secrets"
bash "$ROOT/scripts/backup_operator_secrets.sh" >/dev/null
cp -a "$HOME/.config/log-guardian/operator-secrets.txt" "$WORK/operator-secrets.txt" 2>/dev/null || true

echo "[2/4] /etc/log-guardian (okunabilir dosyalar)"
mkdir -p "$WORK/etc-log-guardian"
if [[ -d /etc/log-guardian ]]; then
  for f in rules.conf env webhook.env threat-feed.env crowdsec.env fp-trust.lst service.password threat_feed_stats.json; do
    [[ -r "/etc/log-guardian/$f" ]] && cp -a "/etc/log-guardian/$f" "$WORK/etc-log-guardian/" || true
  done
  if [[ -r /etc/log-guardian/rules ]]; then
    cp -a /etc/log-guardian/rules "$WORK/etc-log-guardian/" 2>/dev/null || true
  fi
  if [[ "${BACKUP_EVENTS_DB:-0}" == "1" && -r /etc/log-guardian/events.db ]]; then
    cp -a /etc/log-guardian/events.db* "$WORK/etc-log-guardian/" 2>/dev/null || true
  fi
fi

echo "[3/4] runtime manifest"
{
  echo "{"
  echo "  \"timestamp\": \"$(date -Iseconds)\","
  echo "  \"hostname\": \"$(hostname)\","
  echo "  \"tier\": \"${LOG_GUARDIAN_TIER:-}\","
  echo "  \"git_branch\": \"$(git -C "$ROOT" branch --show-current 2>/dev/null || echo unknown)\","
  echo "  \"git_head\": \"$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)\","
  echo "  \"log_guardian_rss_kb\": $(ps -o rss= -C log-guardian,log-guardian-daemon 2>/dev/null | awk '{s+=$1} END {print s+0}'),"
  echo "  \"kind_clusters\": \"$(kind get clusters 2>/dev/null | tr '\n' ',' | sed 's/,$//')\","
  echo "  \"docker_ps\": ["
  docker ps --format '    "{{.Names}}|{{.Status}}"' 2>/dev/null | sed 's/$/,/' | sed '$ s/,$//' || true
  echo "  ]"
  echo "}"
} >"$WORK/runtime-manifest.json"

if [[ -f "$ROOT/k8s-kind-e2e-report.json" ]]; then
  cp -a "$ROOT/k8s-kind-e2e-report.json" "$WORK/"
fi
for f in bench-ban-latency.json bench-vs-modsec.json soak-report.json competitive-proof.json; do
  [[ -f "$ROOT/$f" ]] && cp -a "$ROOT/$f" "$WORK/" || true
done

echo "[4/4] repo archive (node_modules/.next haric)"
TAR_EXCLUDES=(
  --exclude='./node_modules'
  --exclude='./dashboard/node_modules'
  --exclude='./dashboard/.next'
  --exclude='./landing/node_modules'
  --exclude='./landing/.next'
  --exclude='./.cache/dashboard-live'
  --exclude='./graphify-out'
  --exclude='./.cache/ipv6_ban_e2e_rules.conf'
  --exclude='./.cache/webhook_prod_e2e.rules'
)
if command -v zstd >/dev/null 2>&1; then
  tar -C "$ROOT" "${TAR_EXCLUDES[@]}" --ignore-failed-read -cf - . | zstd -T0 -19 -o "$ARCHIVE"
else
  ARCHIVE="${ARCHIVE%.tar.zst}.tar.gz"
  tar -C "$ROOT" "${TAR_EXCLUDES[@]}" --ignore-failed-read -czf "$ARCHIVE" .
fi

tar -C "$DEST_DIR" -cf - "$(basename "$WORK")" | zstd -T0 -19 -o "${WORK}.bundle.tar.zst" 2>/dev/null || \
  tar -czf "${WORK}.bundle.tar.gz" -C "$DEST_DIR" "$(basename "$WORK")"

chmod 600 "$WORK/operator-secrets.txt" 2>/dev/null || true
chmod 600 "${WORK}.bundle.tar.zst" 2>/dev/null || true
chmod 600 "${WORK}.bundle.tar.gz" 2>/dev/null || true
chmod 600 "$ARCHIVE" 2>/dev/null || true

echo ""
echo "[OK] snapshot hazir:"
echo "  repo:     $ARCHIVE ($(du -h "$ARCHIVE" | awk '{print $1}'))"
echo "  bundle:   ${WORK}.bundle.tar.zst ($(du -h "${WORK}.bundle.tar.zst" 2>/dev/null | awk '{print $1}') )"
echo "  secrets:  $WORK/operator-secrets.txt"
echo "  manifest: $WORK/runtime-manifest.json"
echo ""
echo "Geri yukleme (ornek):"
echo "  zstd -d $ARCHIVE -c | tar -C ~/restore -xf -"
echo "  sudo cp -a $WORK/etc-log-guardian/* /etc/log-guardian/"
