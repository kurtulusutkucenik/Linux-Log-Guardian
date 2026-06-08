/* covert_ch.c — Covert Channel & Steganography Detection */
#include "covert_ch.h"
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <pthread.h>

static _Atomic uint64_t g_cookie_hits   = 0;
static _Atomic uint64_t g_respsize_hits = 0;
static _Atomic uint64_t g_dns_hits      = 0;
static _Atomic uint64_t g_timing_hits   = 0;

/* Yanıt boyutu tracker tablosu */
static RespSizeTracker g_size_trackers[COVERT_SIZE_TRACKER_COUNT];
static pthread_mutex_t g_size_mutex = PTHREAD_MUTEX_INITIALIZER;

/* ── Shannon Entropy ─────────────────────────────────────────────── */
static double entropy(const char *s, size_t len) {
    if (!s || len == 0) return 0.0;
    unsigned long freq[256] = {0};
    for (size_t i = 0; i < len; i++) freq[(unsigned char)s[i]]++;
    double e = 0.0;
    for (int i = 0; i < 256; i++) {
        if (!freq[i]) continue;
        double p = (double)freq[i] / (double)len;
        e -= p * log2(p);
    }
    return e;
}

/* ── FNV-1a URL hash ─────────────────────────────────────────────── */
static uint32_t url_hash(StrView url) {
    uint32_t h = 2166136261u;
    size_t n = url.len < 128 ? url.len : 128;
    for (size_t i = 0; i < n; i++) {
        h ^= (uint8_t)url.ptr[i]; h *= 16777619u;
    }
    return h & (COVERT_SIZE_TRACKER_COUNT - 1);
}

/* ── Base64/Hex patern tespiti ───────────────────────────────────── */
static int looks_like_encoded(const char *s, size_t len) {
    if (len < 16) return 0;
    int b64_chars = 0, hex_chars = 0;
    for (size_t i = 0; i < len; i++) {
        char c = s[i];
        if ((c>='A'&&c<='Z')||(c>='a'&&c<='z')||(c>='0'&&c<='9')
            ||c=='+'||c=='/'||c=='=') b64_chars++;
        if ((c>='0'&&c<='9')||(c>='a'&&c<='f')||(c>='A'&&c<='F'))
            hex_chars++;
    }
    double b64_ratio = (double)b64_chars / (double)len;
    double hex_ratio = (double)hex_chars / (double)len;
    return (b64_ratio > 0.92 || hex_ratio > 0.95) ? 1 : 0;
}

/* ── Cookie/ETag entropi tespiti ─────────────────────────────────── */
int covert_detect_cookie(StrView cookie, StrView etag, double *entropy_out) {
    double max_ent = 0.0;
    int detected = 0;

    if (cookie.ptr && cookie.len > 8) {
        /* Cookie değerlerini ayrıştır (key=value; key=value) */
        const char *p = cookie.ptr;
        const char *end = cookie.ptr + cookie.len;
        while (p < end) {
            const char *eq = NULL, *sc = p;
            /* '=' bul */
            while (sc < end && *sc != '=') sc++;
            if (sc >= end) break;
            eq = sc + 1;
            /* ';' veya sona kadar ilerle */
            const char *val_end = eq;
            while (val_end < end && *val_end != ';') val_end++;
            size_t val_len = (size_t)(val_end - eq);
            if (val_len >= 16) {
                double e = entropy(eq, val_len);
                if (e > max_ent) max_ent = e;
                if (e >= COVERT_COOKIE_ENTROPY_THRESH &&
                    looks_like_encoded(eq, val_len)) {
                    detected = 1;
                }
            }
            p = val_end + 1;
        }
    }

    if (etag.ptr && etag.len > 8) {
        /* ETag: "abcdef..." veya W/"abcdef..." */
        const char *ev = etag.ptr;
        size_t el = etag.len;
        if (el > 2 && ev[0] == '"') { ev++; el -= 2; }
        else if (el > 4 && ev[0]=='W' && ev[1]=='/') { ev+=3; el-=4; }
        if (el >= 16) {
            double e = entropy(ev, el);
            if (e > max_ent) max_ent = e;
            if (e >= COVERT_COOKIE_ENTROPY_THRESH) detected = 1;
        }
    }

    if (entropy_out) *entropy_out = max_ent;
    if (detected) atomic_fetch_add(&g_cookie_hits, 1);
    return detected;
}

/* ── Yanıt boyutu sapma tespiti ──────────────────────────────────── */
int covert_detect_resp_size(StrView url, uint32_t resp_bytes) {
    if (resp_bytes == 0) return 0;
    uint32_t idx = url_hash(url);

    pthread_mutex_lock(&g_size_mutex);
    RespSizeTracker *t = &g_size_trackers[idx];

    /* Hash çakışması: farklı URL → sıfırla */
    uint32_t current_hash = url_hash(url);
    if (t->url_hash != 0 && t->url_hash != current_hash) {
        memset(t, 0, sizeof(*t));
    }
    t->url_hash = current_hash;

    /* Boyutu ekle */
    t->sizes[t->head % COVERT_RESP_HISTORY_SIZE] = resp_bytes;
    t->head++;
    if (t->count < COVERT_RESP_HISTORY_SIZE) t->count++;

    /* Yeterli örnek yoksa geç */
    if (t->count < 4) {
        pthread_mutex_unlock(&g_size_mutex);
        return 0;
    }

    /* Ortalama hesapla */
    uint64_t sum = 0;
    for (int i = 0; i < t->count; i++) sum += t->sizes[i];
    uint32_t mean = (uint32_t)(sum / t->count);
    t->mean = mean;

    /* Sapma kontrolü */
    if (mean == 0) { pthread_mutex_unlock(&g_size_mutex); return 0; }
    double deviation = (double)abs((int)resp_bytes - (int)mean) / (double)mean;
    pthread_mutex_unlock(&g_size_mutex);

    if (deviation > COVERT_RESP_SIZE_DEVIATION && resp_bytes > 1024) {
        atomic_fetch_add(&g_respsize_hits, 1);
        return 1;
    }
    return 0;
}

/* ── DNS tüneli tespiti ──────────────────────────────────────────── */
int covert_detect_dns_tunnel(StrView host) {
    if (!host.ptr || host.len < 4) return 0;

    /* Subdomain uzunluk kontrolü */
    const char *p = host.ptr;
    const char *end = host.ptr + host.len;
    int max_label_len = 0;
    int cur_len = 0;
    while (p < end) {
        if (*p == '.') {
            if (cur_len > max_label_len) max_label_len = cur_len;
            cur_len = 0;
        } else {
            cur_len++;
        }
        p++;
    }
    if (cur_len > max_label_len) max_label_len = cur_len;

    /* Subdomain çok uzunsa → DNS tüneli şüphesi */
    if (max_label_len > COVERT_DNS_SUBDOMAIN_LEN) {
        /* Entropi de yüksekse kesin tespit */
        double e = entropy(host.ptr, host.len);
        if (e >= COVERT_DNS_ENTROPY_THRESH) {
            atomic_fetch_add(&g_dns_hits, 1);
            return 1;
        }
    }

    /* Yalnızca entropi yüksekse zayıf sinyal */
    double e = entropy(host.ptr, host.len);
    if (host.len > 20 && e >= COVERT_DNS_ENTROPY_THRESH + 0.5) {
        atomic_fetch_add(&g_dns_hits, 1);
        return 1;
    }
    return 0;
}

/* ── HTTP Timing Channel tespiti ─────────────────────────────────── */
/*
 * Yanıt süresi Fibonacci sayılarını veya asal sayı dizisini taklit
 * ediyorsa zamanlama kanalı şüphesi. IP başına son N yanıt süresi
 * IpRecord.window'dan alınır (zaman damgaları ms değil sn olduğundan
 * bu tespit düşük hassasiyette çalışır, sadece sinyal üretir).
 */
static int detect_timing_pattern(IpRecord *rec) {
    if (!rec) return 0;
    uint32_t count = atomic_load(&rec->window.count);
    if (count < COVERT_TIMING_PATTERN_SAMPLES) return 0;

    /* Son N zaman damgasının farklarını al */
    long diffs[COVERT_TIMING_PATTERN_SAMPLES];
    uint32_t head = atomic_load(&rec->window.head);
    int n = 0;
    for (uint32_t i = 1; i < (uint32_t)COVERT_TIMING_PATTERN_SAMPLES; i++) {
        time_t t1 = rec->window.times[(head - i)     & (WINDOW_SLOTS-1)];
        time_t t2 = rec->window.times[(head - i - 1) & (WINDOW_SLOTS-1)];
        long d = (long)(t1 - t2);
        if (d < 0) d = -d;
        diffs[n++] = d;
    }

    /* Fibonacci kontrolü: her eleman önceki ikinin toplamına yakın mı? */
    int fib_count = 0;
    for (int i = 2; i < n; i++) {
        long expected = diffs[i-1] + diffs[i-2];
        long actual   = diffs[i];
        if (expected > 0) {
            double ratio = (double)actual / (double)expected;
            if (ratio > 0.8 && ratio < 1.2) fib_count++;
        }
    }
    if (fib_count >= n - 2 && n >= 4) {
        atomic_fetch_add(&g_timing_hits, 1);
        return 1;
    }
    return 0;
}

/* ── Ana analiz ──────────────────────────────────────────────────── */
void covert_ch_init(void) {
    memset(g_size_trackers, 0, sizeof(g_size_trackers));
}

CovertType covert_ch_analyze(IpRecord *rec, const LogEntry *e,
                             CovertResult *out) {
    if (!rec || !e || !out) return COVERT_NONE;
    memset(out, 0, sizeof(*out));

    int signals = 0;
    CovertType primary = COVERT_NONE;

    /* A) Cookie/ETag */
    if (e->cookie.ptr && e->cookie.len > 0) {
        double ent = 0.0;
        StrView empty = {NULL, 0};
        if (covert_detect_cookie(e->cookie, empty, &ent)) {
            signals++;
            primary = COVERT_COOKIE;
            out->entropy = ent;
            snprintf(out->detail, sizeof(out->detail),
                     "Yuksek entropili Cookie (%.2f bit/char) — data exfil şüphesi",
                     ent);
        }
    }

    /* B) Yanıt boyutu */
    if (e->resp_bytes > 0) {
        if (covert_detect_resp_size(e->url, (uint32_t)e->resp_bytes)) {
            signals++;
            if (primary == COVERT_NONE) {
                primary = COVERT_RESP_SIZE;
                snprintf(out->detail, sizeof(out->detail),
                         "Yanit boyutu sapması (%ld bytes) — LSB stego şüphesi",
                         e->resp_bytes);
            }
        }
    }

    /* C) DNS tüneli (host başlığı varsa) */
    if (e->host.ptr && e->host.len > 0) {
        if (covert_detect_dns_tunnel(e->host)) {
            signals++;
            if (primary == COVERT_NONE) {
                primary = COVERT_DNS_TUNNEL;
                snprintf(out->detail, sizeof(out->detail),
                         "DNS tunel imzasi: subdomain uzunlugu/entropi asimi");
            }
        }
    }

    /* D) Timing channel */
    if (detect_timing_pattern(rec)) {
        signals++;
        if (primary == COVERT_NONE) {
            primary = COVERT_TIMING;
            snprintf(out->detail, sizeof(out->detail),
                     "Zamanlama kanali: Fibonacci/asal dizi örüntüsü");
        }
    }

    if (signals > 1) primary = COVERT_MULTI;
    out->type = primary;
    return primary;
}

void covert_get_stats(uint64_t *cookie_hits, uint64_t *respsize_hits,
                      uint64_t *dns_hits,    uint64_t *timing_hits) {
    if (cookie_hits)   *cookie_hits   = atomic_load(&g_cookie_hits);
    if (respsize_hits) *respsize_hits = atomic_load(&g_respsize_hits);
    if (dns_hits)      *dns_hits      = atomic_load(&g_dns_hits);
    if (timing_hits)   *timing_hits   = atomic_load(&g_timing_hits);
}
