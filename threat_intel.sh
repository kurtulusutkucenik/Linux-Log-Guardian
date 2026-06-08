#!/usr/bin/env bash
# threat_intel.sh — Linux Log Guardian Otomatik Tehdit İstihbaratı Beslemesi
#
# Firehol Level 1 listesini çekip XDP haritasını DOĞRUDAN günceller.
# Kill -HUP GÖNDERILMEZ — XDP haritası canlı (inline) güncellenir.
#
# Kullanım: threat_intel.sh [db_path]
set -euo pipefail

DB_PATH="${1:-/etc/log-guardian/events.db}"
TMP_LIST=$(mktemp /tmp/firehol_level1.XXXXXX.netset)
URL="https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset"

cleanup() { rm -f "$TMP_LIST"; }
trap cleanup EXIT

log()  { logger -t "loganalyzer-threatintel" -p daemon.info  "$*"; echo "[INFO] $*"; }
warn() { logger -t "loganalyzer-threatintel" -p daemon.warn  "$*"; echo "[WARN] $*" >&2; }
err()  { logger -t "loganalyzer-threatintel" -p daemon.err   "$*"; echo "[ERR ] $*" >&2; }

log "Threat Intel guncelleme baslatildi."

# ── Listeyi indir (exponential backoff ile retry) ────────────────────
MAX_RETRY=3
RETRY_DELAY=5
for attempt in $(seq 1 $MAX_RETRY); do
    if curl -sSL --fail --max-time 60 --retry 2 "$URL" -o "$TMP_LIST" 2>/dev/null; then
        break
    fi
    if [[ $attempt -ge $MAX_RETRY ]]; then
        err "Liste indirilemedi ($MAX_RETRY deneme)."
        # Cikis yapmiyoruz, belki GeoIP calisir
    fi
    warn "Indirme basarisiz, ${RETRY_DELAY}s sonra yeniden deneniyor... ($attempt/$MAX_RETRY)"
    sleep "$RETRY_DELAY"
    RETRY_DELAY=$((RETRY_DELAY * 2))
done

# ── GeoIP Ülke Engelleme (rules.conf'tan oku) ────────────────────────
RULES_CONF="/etc/log-guardian/rules.conf"
if [[ -f "$RULES_CONF" ]]; then
    COUNTRIES=$(grep -oP '^BLOCK_COUNTRIES=\K.*' "$RULES_CONF" || true)
    if [[ -n "$COUNTRIES" ]]; then
        log "GeoIP Engelleme aktif. Ulkeler: $COUNTRIES"
        IFS=',' read -ra CC_ARRAY <<< "$COUNTRIES"
        for cc in "${CC_ARRAY[@]}"; do
            cc_lower=$(echo "$cc" | tr '[:upper:]' '[:lower:]' | tr -d ' ')
            [[ -z "$cc_lower" ]] && continue
            cc_url="http://www.ipdeny.com/ipblocks/data/countries/${cc_lower}.zone"
            log "Indiriliyor: $cc_url"
            curl -sSL --max-time 30 "$cc_url" >> "$TMP_LIST" 2>/dev/null || warn "$cc_lower indirilemedi"
        done
    fi
fi

IP_COUNT=$(grep -cEv "^#|^$" "$TMP_LIST" || true)
log "Indirilen toplam IP/Subnet sayisi: $IP_COUNT"

XDP_BINARY="${LOGANALYZER_BIN:-/usr/local/bin/log-guardian}"
if [[ ! -x "$XDP_BINARY" && -x "./log-guardian" ]]; then
    XDP_BINARY="./log-guardian"
fi

# ── Adım 1: SQLite — per-IP insert yok (24K+ DB sisme onleme) ─────
if [[ -f "$DB_PATH" ]]; then
    if command -v sqlite3 >/dev/null 2>&1; then
        legacy=$(sqlite3 "$DB_PATH" \
            "DELETE FROM ban_events WHERE reason='threat-intel' AND ip != 'system'; SELECT changes();" \
            2>/dev/null || echo 0)
        [[ "${legacy:-0}" -gt 0 ]] && log "legacy per-IP threat-intel temizlendi: $legacy satir"
    fi
    if [[ -x "$XDP_BINARY" ]]; then
        pruned=$("$XDP_BINARY" ban-db-prune --db "$DB_PATH" 2>/dev/null \
            | python3 -c "import json,sys; print(json.load(sys.stdin).get('pruned',0))" 2>/dev/null || echo 0)
        log "ban-db-prune: $pruned eski threat-intel satiri silindi"
    fi
    summary="threat-intel-summary:${IP_COUNT} IPs"
    if sqlite3 "$DB_PATH" \
        "INSERT INTO ban_events (ts, ip, action, reason) VALUES (strftime('%s','now'), 'system', 'info', '${summary}');" \
        2>/dev/null; then
        log "DB ozet kaydi: $summary"
    else
        warn "DB ozet kaydi basarisiz: $DB_PATH"
    fi
else
    warn "Veritabani bulunamadi: $DB_PATH — DB guncelleme atlanıyor."
fi

# ── Adım 2: Ban listesi — XDP haritasi veya ipset fallback ───────────
XDP_UPDATE_OK=0
XDP_UPDATE_FAIL=0
IPSET_UPDATE_OK=0
THREAT_INTEL_IPSET="${THREAT_INTEL_IPSET:-1}"
IPSET_MAXELEM=65536
THREAT_INTEL_DYNAMIC_RESERVE="${THREAT_INTEL_DYNAMIC_RESERVE:-12000}"
THREAT_INTEL_MAX_APPLY="${THREAT_INTEL_MAX_APPLY:-$((IPSET_MAXELEM - THREAT_INTEL_DYNAMIC_RESERVE))}"

ipset_ensure_v4() {
    ipset list log_analyzer_block_v4 &>/dev/null && return 0
    ipset create log_analyzer_block_v4 hash:net maxelem "$IPSET_MAXELEM" 2>/dev/null || true
}

ipset_entry_count() {
    local n
    n=$(ipset list log_analyzer_block_v4 2>/dev/null | grep -cE '^[0-9]' || true)
    echo "${n:-0}"
}

restore_dynamic_bans_to_ipset() {
    local restored=0 ip
    command -v sqlite3 >/dev/null 2>&1 || return 0
    [[ -f "$DB_PATH" ]] || return 0
    while IFS= read -r ip; do
        [[ -z "$ip" || "$ip" == "system" ]] && continue
        if ipset add log_analyzer_block_v4 "$ip" -exist 2>/dev/null; then
            restored=$((restored + 1))
        fi
    done < <(sqlite3 -noheader "$DB_PATH" \
        "SELECT ip FROM ban_events WHERE action='ban' AND ip != 'system' \
         AND reason NOT LIKE 'threat-intel%' GROUP BY ip ORDER BY MAX(ts) DESC \
         LIMIT $THREAT_INTEL_DYNAMIC_RESERVE;" 2>/dev/null || true)
    log "ipset dynamic restore: $restored IP (DB)"
}

ipset_prune_before_threat_intel() {
    command -v ipset >/dev/null 2>&1 || return 0
    local count ceiling
    count=$(ipset_entry_count)
    ceiling=$((IPSET_MAXELEM - THREAT_INTEL_DYNAMIC_RESERVE))
    if [[ "$count" -lt "$ceiling" ]]; then
        log "ipset kapasite OK ($count/$IPSET_MAXELEM, dynamic rezerv=$THREAT_INTEL_DYNAMIC_RESERVE)"
        return 0
    fi
    warn "ipset dolu ($count/$IPSET_MAXELEM) — threat-intel oncesi flush + dynamic restore"
    ipset flush log_analyzer_block_v4 2>/dev/null || true
    restore_dynamic_bans_to_ipset
}

xdp_map_ready() {
    [[ -S "/run/log-guardian/ipc.sock" ]] || return 1
    [[ -x "$XDP_BINARY" ]] || return 1
    if [[ -f /run/log-guardian/daemon_stats.json ]]; then
        python3 -c "
import json
d=json.load(open('/run/log-guardian/daemon_stats.json'))
import sys
sys.exit(0 if d.get('xdp_active') else 1)
" 2>/dev/null && return 0
    fi
    [[ -e /sys/fs/bpf/loganalyzer/xdp_blacklist_v4 ]] 2>/dev/null
}

apply_ipset_list() {
    ipset_ensure_v4
    ipset_prune_before_threat_intel
    local count budget n=0
    count=$(ipset_entry_count)
    budget=$((IPSET_MAXELEM - THREAT_INTEL_DYNAMIC_RESERVE - count))
    [[ "$budget" -lt 0 ]] && budget=0
    if [[ "$THREAT_INTEL_MAX_APPLY" -lt "$budget" ]]; then
        budget="$THREAT_INTEL_MAX_APPLY"
    fi
    log "ipset threat feed budget: $budget (mevcut=$count, max=$IPSET_MAXELEM)"
    while IFS= read -r IP && [[ "$n" -lt "$budget" ]]; do
        [[ "$IP" =~ ^# ]] && continue
        [[ -z "$IP" ]] && continue
        if ipset add log_analyzer_block_v4 "$IP" -exist 2>/dev/null; then
            IPSET_UPDATE_OK=$((IPSET_UPDATE_OK + 1))
        fi
        n=$((n + 1))
    done < "$TMP_LIST"
    log "ipset guncelleme: $IPSET_UPDATE_OK entry (budget=$budget)"
}

if xdp_map_ready; then
    log "XDP haritasi inline guncelleniyor..."
    local_n=0
    while IFS= read -r IP && [[ "$local_n" -lt "$THREAT_INTEL_MAX_APPLY" ]]; do
        [[ "$IP" =~ ^# ]] && continue
        [[ -z "$IP" ]]   && continue
        if "$XDP_BINARY" --ban-cidr "$IP" >/dev/null 2>&1; then
            XDP_UPDATE_OK=$((XDP_UPDATE_OK + 1))
        else
            XDP_UPDATE_FAIL=$((XDP_UPDATE_FAIL + 1))
        fi
        local_n=$((local_n + 1))
    done < "$TMP_LIST"
    log "XDP guncelleme: $XDP_UPDATE_OK basarili, $XDP_UPDATE_FAIL basarisiz."
    if [[ "$XDP_UPDATE_FAIL" -gt 0 && "$THREAT_INTEL_IPSET" == "1" ]] && command -v ipset >/dev/null; then
        warn "XDP kismi basarisiz — ipset fallback deneniyor"
        apply_ipset_list
    fi
elif [[ "$THREAT_INTEL_IPSET" == "1" ]] && command -v ipset >/dev/null; then
    warn "XDP haritasi yok (Wi-Fi/generic NIC) — ipset fallback"
    apply_ipset_list
else
    warn "Ban listesi uygulanamadi (XDP OFF, ipset yok veya THREAT_INTEL_IPSET=0)"
fi

log "Threat Intel guncellemesi tamamlandi (XDP=$XDP_UPDATE_OK ipset=$IPSET_UPDATE_OK, DB=$DB_PATH)."
log "NOT: Kill -HUP GONDERILMEDI — haritalar dogrudan guncellendi."
