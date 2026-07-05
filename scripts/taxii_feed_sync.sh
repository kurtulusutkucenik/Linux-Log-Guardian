#!/usr/bin/env bash
# TAXII 2.1 / STIX 2.1 IOC cekme -> log-guardian ban API
#   TAXII_URL=https://host/taxii2/collections/ID/objects/ TAXII_API_KEY=... bash scripts/taxii_feed_sync.sh
#   TAXII_DRY_RUN=1 bash scripts/taxii_feed_sync.sh   # fixture veya URL, yalnizca listele
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/rules_conf_read.sh
source "$ROOT/scripts/lib/rules_conf_read.sh"

TAXII_URL="${TAXII_URL:-}"
TAXII_API_KEY="${TAXII_API_KEY:-}"
FIXTURE="${TAXII_FIXTURE:-$ROOT/corpus/fixtures/taxii_stix_bundle.json}"
API_BASE="${LG_BAN_API_BASE:-http://127.0.0.1:8090}"
TOKEN="${API_TOKEN:-}"
RULES="${LG_RULES:-$(lg_rules_conf_path)}"
[[ -f "$RULES" ]] || RULES="$ROOT/rules.conf"
DRY="${TAXII_DRY_RUN:-0}"
MAX="${TAXII_MAX_OBJECTS:-50}"
MIN_CONF="${TAXII_MIN_CONFIDENCE:-70}"

# rules.conf (env bos ise)
[[ -z "$TAXII_URL" ]] && TAXII_URL="$(lg_rules_kv TAXII_URL)"
[[ -z "$TAXII_API_KEY" ]] && TAXII_API_KEY="$(lg_rules_kv TAXII_API_KEY)"
rc_min="$(lg_rules_kv TAXII_MIN_CONFIDENCE)"
[[ -z "${TAXII_MIN_CONFIDENCE:-}" && -n "$rc_min" ]] && MIN_CONF="$rc_min"

fail() { echo "[taxii_feed_sync] FAIL: $*" >&2; exit 1; }
ok() { echo "[OK] $*"; }

# Placeholder / ornek URL'leri yok say (laptop fixture yolu)
taxii_url_usable() {
  local u="${1:-}"
  [[ -z "$u" ]] && return 1
  case "$u" in
    *'...'*|*example*|*CHANGE_ME*|*YOUR_*|*\<*|*\>*|*localhost:0*)
      return 1 ;;
  esac
  [[ "$u" =~ ^https?://[^/]+/ ]] || return 1
  return 0
}

load_fixture() {
  if [[ ! -f "$FIXTURE" ]]; then
    fail "TAXII_URL veya fixture yok ($FIXTURE)"
  fi
  echo "[INFO] TAXII_URL yok — fixture kullaniliyor: $FIXTURE" >&2
  cat "$FIXTURE"
}

if [[ -z "$TOKEN" && -f "$RULES" ]]; then
  TOKEN=$(lg_rules_kv API_TOKEN)
  [[ -z "$TOKEN" ]] && TOKEN=$(grep -E '^API_TOKEN=' "$RULES" | head -1 | cut -d= -f2- || true)
fi
if [[ -z "$TOKEN" && "$DRY" == "1" ]]; then
  TOKEN="dry-run"
elif [[ -z "$TOKEN" ]]; then
  fail "API_TOKEN yok — rules.conf veya env"
fi

STIX_JSON=""
STIX_SOURCE="fixture"
if taxii_url_usable "$TAXII_URL"; then
  hdr=(-H "Accept: application/vnd.oasis.stix+json; version=2.1")
  [[ -n "$TAXII_API_KEY" && "$TAXII_API_KEY" != "..." ]] && hdr+=(-H "Authorization: Bearer $TAXII_API_KEY")
  if STIX_JSON=$(curl -sf --max-time 30 "${hdr[@]}" "$TAXII_URL" 2>/dev/null); then
    STIX_SOURCE="taxii-url"
    echo "[OK] TAXII_URL: $TAXII_URL"
  else
    echo "[WARN] TAXII_URL erisilemedi ($TAXII_URL) — fixture'a dusuluyor" >&2
    STIX_JSON=$(load_fixture)
  fi
else
  if [[ -n "$TAXII_URL" ]]; then
    echo "[WARN] TAXII_URL placeholder/ornek — fixture kullaniliyor ($TAXII_URL)" >&2
  fi
  STIX_JSON=$(load_fixture)
fi
export TAXII_STIX_SOURCE="$STIX_SOURCE"

python3 - "$STIX_JSON" "$DRY" "$API_BASE" "$TOKEN" "$MAX" "$MIN_CONF" <<'PY'
import json, re, sys, urllib.request, urllib.error, urllib.parse

raw, dry, base, token, max_s, min_conf_s = sys.argv[1:7]
max_s = int(max_s)
min_conf = int(min_conf_s)
try:
    doc = json.loads(raw)
except json.JSONDecodeError as e:
    print(f"[taxii_feed_sync] FAIL: JSON {e}", file=sys.stderr)
    sys.exit(1)

ips = []
ipv4_re = re.compile(r"ipv4-addr:value\s*=\s*'([0-9.]+)'")

def indicator_conf(obj):
    for key in ("confidence", "x_confidence", "x_misp_confidence"):
        if key in obj:
            try:
                return int(float(obj[key]))
            except (TypeError, ValueError):
                pass
    return 100

def walk(obj):
    if isinstance(obj, dict):
        if obj.get("type") == "indicator":
            pat = obj.get("pattern") or ""
            m = ipv4_re.search(pat)
            if m:
                ips.append((m.group(1), obj.get("name") or obj.get("id") or "taxii", indicator_conf(obj)))
        for v in obj.values():
            walk(v)
    elif isinstance(obj, list):
        for v in obj:
            walk(v)

walk(doc)
seen = set()
unique = []
for ip, name, conf in ips:
    if ip in seen or "." not in ip:
        continue
    seen.add(ip)
    unique.append((ip, name, conf))
    if len(unique) >= max_s:
        break

if not unique:
    print("[OK] taxii_feed_sync — 0 IOC")
    sys.exit(0)

applied = 0
skipped_low = 0
for ip, name, conf in unique:
    reason = f"taxii:{name}"
    tag = f"conf={conf}"
    if conf < min_conf:
        if dry == "1":
            print(f"  [dry-run] skip {ip} ({reason}, {tag} < min {min_conf})")
        else:
            print(f"  [skip] {ip} ({tag} < min {min_conf})")
        skipped_low += 1
        continue
    if dry == "1":
        print(f"  [dry-run] ban {ip} ({reason}, {tag})")
        applied += 1
        continue
    url = f"{base.rstrip('/')}/api/v1/ban?ip={ip}&reason={urllib.parse.quote(reason, safe='')}"
    req = urllib.request.Request(url, method="POST", headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            if 200 <= resp.status < 300:
                applied += 1
                print(f"  [OK] ban {ip} ({tag})")
            else:
                print(f"  [WARN] ban {ip} HTTP {resp.status}", file=sys.stderr)
    except urllib.error.HTTPError as e:
        print(f"  [WARN] ban {ip} HTTP {e.code}", file=sys.stderr)

extra = f", skipped_low_conf={skipped_low}" if skipped_low else ""
print(f"[OK] taxii_feed_sync — {applied} IP (min_conf={min_conf}{extra})")
PY
