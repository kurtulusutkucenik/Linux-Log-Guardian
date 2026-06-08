#include "anomaly.h"
#include "pcre_engine.h"
#include "adaptive_threshold.h"
#include "waf_rules.h"
#include "l7_telemetry.h"
#include "mesh_intel.h"
#include "etcd_mesh.h"
#include "mesh_backend.h"
#include "incident_engine.h"
#include "endpoint_baseline.h"
#include "fp_trust.h"
#include "ja3_cluster.h"
#include "parser.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>
#include <pthread.h>


static int g_ipc_fd = -1;  /* Deception motoru için IPC bağlantısı */
static int g_low_slow_req       = THRESHOLD_LOW_SLOW_REQ;
static int g_bruteforce_err     = THRESHOLD_BRUTE_FORCE_ERR;
static int g_ddos_rps           = THRESHOLD_DDOS_RPS;
static int g_slow_resp_ms       = THRESHOLD_SLOW_RESP_MS;
static int g_sqli_score         = THRESHOLD_SQLI_SCORE;
static int g_slow_hit_count     = THRESHOLD_SLOW_HIT_COUNT;
static int g_alert_cooldown_sec = THRESHOLD_ALERT_COOLDOWN;

/* Adaptive kayit havuzu (IP hash -> AdaptiveRecord) */
#define ADAPTIVE_POOL_SIZE (1 << 16)
static AdaptiveRecord g_adaptive_pool[ADAPTIVE_POOL_SIZE];
static pthread_once_t g_adaptive_pool_once = PTHREAD_ONCE_INIT;

static void init_adaptive_pool(void) {
    memset(g_adaptive_pool, 0, sizeof(g_adaptive_pool));
}

static AdaptiveRecord *get_adaptive_rec(const char *ip) {
    if (!ip) return NULL;
    pthread_once(&g_adaptive_pool_once, init_adaptive_pool);
    uint32_t h = 2166136261u;
    for (const char *p = ip; *p; p++) { h ^= (uint8_t)*p; h *= 16777619u; }
    return &g_adaptive_pool[h & (ADAPTIVE_POOL_SIZE - 1)];
}

/* Her IP'ye ait EWMA varyans istatistiklerini tutan ek havuz */
typedef struct {
    double var_rps;      /* EWMA varyansı [rps]                 */
    double var_err;      /* EWMA varyansı [err_rate]             */
    double var_resp;     /* EWMA varyansı [resp_ms normalized]   */
    uint64_t n;          /* Gözlem sayısı (varyans stabilizasyonu için) */
} EwmaVariance;

static EwmaVariance *get_ewma_var(const char *ip);
static void update_ewma_variance(EwmaVariance *ev, AdaptiveRecord *ar,
                                  double rps, double err, double resp_norm);
static double compute_mahalanobis(AdaptiveRecord *ar, EwmaVariance *ev,
                                   double rps, double err, double resp_norm);
int anomaly_weighted_score(IpRecord *rec, const LogEntry *e);


/* User-Agent fingerprint tablolari */
#define UA_TABLE_SIZE (1 << 16)
static _Atomic uint32_t g_ua_hash[UA_TABLE_SIZE];
static _Atomic uint8_t  g_ua_chg[UA_TABLE_SIZE];

static uint32_t hash_ua(StrView ua) {
    uint32_t h = 2166136261u;
    for (size_t i = 0; i < ua.len && i < 128; i++) { h ^= (uint8_t)ua.ptr[i]; h *= 16777619u; }
    return h;
}
static uint32_t ip_idx(const char *ip) {
    uint32_t h = 2166136261u;
    for (const char *p = ip; *p; p++) { h ^= (uint8_t)*p; h *= 16777619u; }
    return h & (UA_TABLE_SIZE - 1);
}

/* Shannon Entropy eşiği — şifrelenmiş/obfuscated payload tespiti */
#define ENTROPY_THRESHOLD  6.5

/* Beaconing tespiti: istek arası stddev bu değerin altındaysa bot */
#define BEACONING_STDDEV_THRESHOLD  0.5   /* saniye cinsinden */
#define BEACONING_MIN_SAMPLES       16    /* en az bu kadar istek gerekli */

void anomaly_get_thresholds(int *low_slow_req, int *brute_force_err,
                            int *ddos_rps, int *slow_resp_ms, int *sqli_score,
                            int *slow_hit_count, int *alert_cooldown_sec) {
    if (low_slow_req)       *low_slow_req       = g_low_slow_req;
    if (brute_force_err)    *brute_force_err     = g_bruteforce_err;
    if (ddos_rps)           *ddos_rps            = g_ddos_rps;
    if (slow_resp_ms)       *slow_resp_ms        = g_slow_resp_ms;
    if (sqli_score)         *sqli_score          = g_sqli_score;
    if (slow_hit_count)     *slow_hit_count      = g_slow_hit_count;
    if (alert_cooldown_sec) *alert_cooldown_sec  = g_alert_cooldown_sec;
}

void anomaly_set_thresholds(int low_slow_req, int brute_force_err,
                            int ddos_rps, int slow_resp_ms, int sqli_score,
                            int slow_hit_count, int alert_cooldown_sec) {
    if (low_slow_req   > 0)        g_low_slow_req       = low_slow_req;
    if (brute_force_err >= 0)      g_bruteforce_err     = brute_force_err;
    if (ddos_rps        > 0)       g_ddos_rps           = ddos_rps;
    if (slow_resp_ms    > 0)       g_slow_resp_ms       = slow_resp_ms;
    if (sqli_score      > 0)       g_sqli_score         = sqli_score;
    if (slow_hit_count  > 0)       g_slow_hit_count     = slow_hit_count;
    if (alert_cooldown_sec >= 0)   g_alert_cooldown_sec = alert_cooldown_sec;
}

EndpointLimit g_endpoint_limits[MAX_ENDPOINT_LIMITS];
int g_endpoint_limit_count = 0;

void anomaly_add_endpoint_limit(const char *path, int limit) {
    if (g_endpoint_limit_count >= MAX_ENDPOINT_LIMITS) return;
    strncpy(g_endpoint_limits[g_endpoint_limit_count].path, path, 127);
    g_endpoint_limits[g_endpoint_limit_count].path[127] = '\0';
    g_endpoint_limits[g_endpoint_limit_count].limit_rpm = limit;
    g_endpoint_limit_count++;
}

int detect_endpoint_abuse(IpRecord *rec, StrView url) {
    for (int i = 0; i < g_endpoint_limit_count; i++) {
        if (sv_contains(url, g_endpoint_limits[i].path, strlen(g_endpoint_limits[i].path))) {
            uint16_t hits = atomic_fetch_add(&rec->cnt.endpoint_hits[i], 1) + 1;
            /* Basit bir burst rate-limiting mantigi */
            if (hits >= g_endpoint_limits[i].limit_rpm) {
                return i + 1; // Hangi kuralin ihlal edildigini dondur (1-indexed)
            }
        }
    }
    return 0;
}



/*
 * calc_shannon_entropy: Bir string'in Shannon entropisini hesaplar.
 * Sonuç [0, 8] arasındadır. 6.5+ şifrelenmiş/obfuscated payload işareti.
 */
static double calc_shannon_entropy(const char *s, size_t len) {
    if (!s || len == 0) return 0.0;

    unsigned long freq[256] = {0};
    for (size_t i = 0; i < len; i++)
        freq[(unsigned char)s[i]]++;

    double entropy = 0.0;
    for (int i = 0; i < 256; i++) {
        if (freq[i] == 0) continue;
        double p = (double)freq[i] / (double)len;
        entropy -= p * log2(p);
    }
    return entropy;
}

static inline char from_hex(char ch) {
    if (ch >= '0' && ch <= '9') return ch - '0';
    if (ch >= 'a' && ch <= 'f') return ch - 'a' + 10;
    if (ch >= 'A' && ch <= 'F') return ch - 'A' + 10;
    return 0;
}

void url_decode(const char *src, size_t src_len, char *dst, size_t *dst_len) {
    size_t d = 0;
    for (size_t i = 0; i < src_len; i++) {
        if (src[i] == '%' && i + 2 < src_len) {
            dst[d++] = (from_hex(src[i+1]) << 4) | from_hex(src[i+2]);
            i += 2;
        } else if (src[i] == '+') {
            dst[d++] = ' ';
        } else {
            dst[d++] = src[i];
        }
    }
    dst[d] = '\0';
    *dst_len = d;
}

int detect_sqli(StrView url, StrView body) {
    char decoded_buf[8192];
    size_t decoded_len = 0;
    
    // Check URL
    if (url.len > 0 && url.ptr) {
        url_decode(url.ptr, url.len < sizeof(decoded_buf)-1 ? url.len : sizeof(decoded_buf)-1, decoded_buf, &decoded_len);
        StrView decoded_url = { decoded_buf, decoded_len };
        if (pcre_engine_match(decoded_url)) return 1;

        const char *qmark = NULL;
        for (size_t i = 0; i < decoded_len; i++) {
            if (decoded_buf[i] == '?') { qmark = decoded_buf + i + 1; break; }
        }
        if (qmark) {
            size_t param_len = decoded_len - (size_t)(qmark - decoded_buf);
            if (param_len > 8) {
                double ent = calc_shannon_entropy(qmark, param_len);
                if (ent > ENTROPY_THRESHOLD) return 1;
            }
        }
    }
    
    // Check Body
    if (body.len > 0 && body.ptr) {
        url_decode(body.ptr, body.len < sizeof(decoded_buf)-1 ? body.len : sizeof(decoded_buf)-1, decoded_buf, &decoded_len);
        StrView decoded_body = { decoded_buf, decoded_len };
        if (pcre_engine_match(decoded_body)) return 1;

        if (decoded_len > 8) {
            double ent = calc_shannon_entropy(decoded_buf, decoded_len);
            if (ent > ENTROPY_THRESHOLD) return 1;
        }
    }

    return 0;
}

int detect_low_and_slow(IpRecord *rec, time_t now) {
    uint32_t cnt = ipmap_window_count_since(rec, now - WINDOW_SECONDS);
    long err = atomic_load(&rec->cnt.error_4xx);
    return (cnt >= (uint32_t)g_low_slow_req && err >= g_bruteforce_err) ? 1 : 0;
}

int detect_resource_starvation(IpRecord *rec, const LogEntry *e) {
    if (e->response_ms > g_slow_resp_ms) {
        atomic_fetch_add(&rec->cnt.resp_slow, 1);
        if (atomic_load(&rec->cnt.resp_slow) >= g_slow_hit_count) return 1;
    }
    return 0;
}

/*
 * detect_beaconing: SlidingWindow içindeki timestamp farklarının standart
 * sapmasını hesaplar. Sapma çok düşükse (istek aralıkları sabit) → C2 bot.
 */
int detect_beaconing(IpRecord *rec) {
    uint32_t current_count = atomic_load(&rec->window.count);
    uint32_t count = current_count < WINDOW_SLOTS ? current_count : WINDOW_SLOTS;
    if (count < BEACONING_MIN_SAMPLES) {
        return 0;
    }

    /* Farkları hesapla */
    double diffs[WINDOW_SLOTS];
    uint32_t ndiff = 0;
    uint32_t current_head = atomic_load(&rec->window.head);
    uint32_t start = current_head >= count ? current_head - count : 0;

    for (uint32_t i = 1; i < count; i++) {
        time_t t1 = rec->window.times[(start + i - 1) % WINDOW_SLOTS];
        time_t t2 = rec->window.times[(start + i)     % WINDOW_SLOTS];
        double d  = (double)(t2 - t1);
        if (d < 0) d = -d;
        diffs[ndiff++] = d;
    }

    if (ndiff < 2) return 0;

    /* Ortalama */
    double sum = 0.0;
    for (uint32_t i = 0; i < ndiff; i++) sum += diffs[i];
    double mean = sum / (double)ndiff;

    /* Standart sapma */
    double var = 0.0;
    for (uint32_t i = 0; i < ndiff; i++) {
        double d = diffs[i] - mean;
        var += d * d;
    }
    double stddev = sqrt(var / (double)ndiff);

    return (stddev < BEACONING_STDDEV_THRESHOLD) ? 1 : 0;
}

static void copy_ip(char *dst, const char *src) {
    size_t len = strlen(src);
    if (len >= IP_STR_LEN) len = IP_STR_LEN - 1;
    memcpy(dst, src, len);
    dst[len] = '\0';
}

static int (*g_rules_whitelist_fn)(const char *ip) = NULL;

void anomaly_set_whitelist_fn(int (*fn)(const char *ip))
{
    g_rules_whitelist_fn = fn;
}

int is_whitelisted(const char *ip) {
    if (!ip) return 0;
    if (g_rules_whitelist_fn && g_rules_whitelist_fn(ip)) return 1;
    if (strcmp(ip, "127.0.0.1") == 0) return 1;
    if (strcmp(ip, "::1") == 0) return 1;
    return 0;
}

/* ── Mesh Yayın Yardımcısı ────────────────────────────────────────── */
/* ALERT_CRIT her tetiklendiginde cagirilir; IP'yi tum node'lara yayinlar. */
static void anomaly_mesh_propagate(const Alert *a, const char *mitre) {
    if (!a || a->level != ALERT_CRIT || !a->ip[0]) return;

    if (mesh_backend_use_zmq()) {
        MeshThreatEvent ev;
        mesh_intel_fill_from_ip(&ev, a->ip, 32, 800,
                                mitre ? mitre : "T1190",
                                a->message);
        mesh_intel_publish(&ev);
    }

    if (mesh_backend_use_etcd() && etcd_mesh_active()) {
        etcd_mesh_publish(a->ip, 800,
                          mitre ? mitre : "T1190",
                          a->message);
    }
}

#define ANOMALY_ALERT_RETURN(rec, alert, sig) do {              \
    if (fp_trust_should_suppress((rec)->ip, (alert))) {         \
        fp_trust_note_suppressed((rec)->ip);                     \
        (alert)->level = ALERT_NONE;                            \
        return 0;                                               \
    }                                                           \
    fp_trust_note_alert((rec)->ip);                             \
    incident_engine_note_signal((rec)->ip, (sig));              \
    incident_engine_attach_alert((alert), (rec)->ip);           \
    return 1;                                                   \
} while (0)

static int anomaly_emit(IpRecord *rec, Alert *alert, uint32_t sig)
{
    if (fp_trust_should_suppress(rec->ip, alert)) {
        fp_trust_note_suppressed(rec->ip);
        alert->level = ALERT_NONE;
        return 0;
    }
    fp_trust_note_alert(rec->ip);
    if (sig) {
        incident_engine_note_signal(rec->ip, sig);
        incident_engine_attach_alert(alert, rec->ip);
    }
    return 1;
}

int anomaly_check(IpRecord *rec, const LogEntry *e, Alert *out_alert) {
    if (!rec || !e || !out_alert) return 0;
    out_alert->level = ALERT_NONE;
    out_alert->incident_id[0] = '\0';

    if (is_whitelisted(rec->ip)) {
        return 0; /* Beyaz listedeki IP'ler banlanmaz ve alarm uretmez */
    }

    /* 0. Intelligence Engines: APT Graph & Covert Channel */
    if (anomaly_process_apt_graph(rec, e, out_alert)) {
        atomic_store(&rec->last_alert_ts, e->ts);
        ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_WAF);
    }
    if (anomaly_check_covert(rec, e, out_alert)) {
        atomic_store(&rec->last_alert_ts, e->ts);
        ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_WAF);
    }

    /* 1. WAF & SQL Injection */
    char method_str[16] = {0};
    if (e->method.len > 0) {
        size_t n = e->method.len < 15 ? e->method.len : 15;
        memcpy(method_str, e->method.ptr, n);
    }
    if (detect_waf_threat(e->url, e->body, e->user_agent, method_str, out_alert, rec->ip,
                          e->host, e->cookie)) {
        alert_set_mitre(out_alert, MITRE_T1190, "Initial Access");
        atomic_store(&rec->last_alert_ts, e->ts);
        anomaly_mesh_propagate(out_alert, "T1190");
        ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_WAF);
    }

    if (detect_sqli(e->url, e->body)) {
        atomic_fetch_add(&rec->cnt.sqli_hits, 1);
        long hits = atomic_load(&rec->cnt.sqli_hits);
        if (hits >= g_sqli_score) {
            time_t la = atomic_load(&rec->last_alert_ts);
            if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
            out_alert->level = ALERT_CRIT;
            copy_ip(out_alert->ip, rec->ip);
            snprintf(out_alert->message, ALERT_MSG_LEN,
                     "SQL INJECTION / PAYLOAD SALDIRISI! %ld adet supheli istek.", hits);
            out_alert->ts = e->ts;
            alert_set_mitre(out_alert, MITRE_T1190, "Initial Access");
            atomic_store(&rec->last_alert_ts, e->ts);
            anomaly_mesh_propagate(out_alert, "T1190");
            ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_SQLI);
        }
    }

    /* 2. Low & Slow Brute Force */
    if (detect_low_and_slow(rec, e->ts)) {
        time_t la = atomic_load(&rec->last_alert_ts);
        if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
        out_alert->level = ALERT_CRIT;
        copy_ip(out_alert->ip, rec->ip);
        uint32_t cnt = ipmap_window_count_since(rec, e->ts - WINDOW_SECONDS);
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "LOW & SLOW BRUTE FORCE! Son %d sn'de %u istek + %ld hata.",
                 WINDOW_SECONDS, cnt, atomic_load(&rec->cnt.error_4xx));
        out_alert->ts = e->ts;
        alert_set_mitre(out_alert, MITRE_T1110, "Credential Access");
        atomic_store(&rec->last_alert_ts, e->ts);
        anomaly_mesh_propagate(out_alert, "T1110");
        ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_BRUTE);
    }

    /* 3. DDoS (ani trafik patlamasi) */
    {
        uint32_t rps = ipmap_window_count_since(rec, e->ts - 1);
        if (rps >= (uint32_t)g_ddos_rps) {
            time_t la = atomic_load(&rec->last_alert_ts);
            if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
            out_alert->level = ALERT_WARN;
            copy_ip(out_alert->ip, rec->ip);
            snprintf(out_alert->message, ALERT_MSG_LEN,
                     "TRAFIK PATLAMASI (DDoS)! Son 1 sn'de %u istek (esik: %d).", rps, g_ddos_rps);
            out_alert->ts = e->ts;
            alert_set_mitre(out_alert, MITRE_T1498, "Impact");
            atomic_store(&rec->last_alert_ts, e->ts);
            return anomaly_emit(rec, out_alert, 0);
        }
    }

    /* 4. Kaynak tuketimi / yavas yanit */
    if (detect_resource_starvation(rec, e)) {
        time_t la = atomic_load(&rec->last_alert_ts);
        if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
        out_alert->level = ALERT_WARN;
        copy_ip(out_alert->ip, rec->ip);
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "KAYNAK TUKENMESI! Yanit %ld ms (esik: %d ms). Toplam yavas: %ld",
                 e->response_ms, g_slow_resp_ms, atomic_load(&rec->cnt.resp_slow));
        out_alert->ts = e->ts;
        alert_set_mitre(out_alert, MITRE_T1499, "Impact");
        atomic_store(&rec->last_alert_ts, e->ts);
        return anomaly_emit(rec, out_alert, 0);
    }

    /* 5. Beaconing (C2 bot / periyodik sinyal) */
    if (detect_beaconing(rec)) {
        time_t la = atomic_load(&rec->last_alert_ts);
        if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
        out_alert->level = ALERT_CRIT;
        copy_ip(out_alert->ip, rec->ip);
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "BEACONING TESPIT EDILDI! Istek araliklari makine hassasiyetinde "
                 "sabit — C2 bot/malware sinyali.");
        out_alert->ts = e->ts;
        alert_set_mitre(out_alert, MITRE_T1071_001, "Command & Control");
        atomic_store(&rec->last_alert_ts, e->ts);
        anomaly_mesh_propagate(out_alert, "T1071.001");
        return anomaly_emit(rec, out_alert, 0);
    }

    /* 5b. 7-gun endpoint baseline (Faz 3.3) */
    {
        char path[256] = {0};
        if (e->url.len > 0)
            url_path_only(e->url.ptr, e->url.len, path, sizeof(path));
        if (path[0]) {
            AdaptiveRecord *ar = get_adaptive_rec(rec->ip);
            uint32_t rpm = ar ? atomic_load(&ar->window_rps) : 0;
            char eb_reason[128] = {0};
            int eb = endpoint_baseline_check(path, rpm, eb_reason, sizeof(eb_reason));
            if (eb >= 2) {
                time_t la = atomic_load(&rec->last_alert_ts);
                if (la == 0 || (e->ts - la) >= g_alert_cooldown_sec) {
                    out_alert->level = ALERT_CRIT;
                    copy_ip(out_alert->ip, rec->ip);
                    snprintf(out_alert->message, ALERT_MSG_LEN, "%s",
                             eb_reason[0] ? eb_reason : "Endpoint baseline anomaly");
                    out_alert->ts = e->ts;
                    alert_set_mitre(out_alert, MITRE_T1190, "Initial Access");
                    atomic_store(&rec->last_alert_ts, e->ts);
                    ANOMALY_ALERT_RETURN(rec, out_alert, INC_SIG_LOG_WAF);
                }
            }
        }
    }

    /* 6. Context-Aware Endpoint Abuse (Kör Nokta 3) */
    int abused_idx = detect_endpoint_abuse(rec, e->url);
    if (abused_idx > 0) {
        time_t la = atomic_load(&rec->last_alert_ts);
        if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
        out_alert->level = ALERT_CRIT;
        copy_ip(out_alert->ip, rec->ip);
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "ENDPOINT ABUSE! Hedef: %s, Limit Asildi (%d)",
                 g_endpoint_limits[abused_idx - 1].path, 
                 g_endpoint_limits[abused_idx - 1].limit_rpm);
        out_alert->ts = e->ts;
        alert_set_mitre(out_alert, MITRE_T1110, "Credential Access");
        atomic_store(&rec->last_alert_ts, e->ts);
        return anomaly_emit(rec, out_alert, 0);
    }

    /* 7. Dinamik ve Hassas Uygulama Mantığı Hata Oranı */
    long total = atomic_load(&rec->cnt.total_requests);
    long err4  = atomic_load(&rec->cnt.error_4xx);
    if (total > 50 && (err4 * 100 / total > 50)) {
        time_t la = atomic_load(&rec->last_alert_ts);
        if (la > 0 && (e->ts - la) < g_alert_cooldown_sec) return 0;
        out_alert->level = ALERT_CRIT;
        copy_ip(out_alert->ip, rec->ip);
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "MANTIK HATASI TARAMASI: %ld/%ld istek 4xx (%%%ld). Brute-force veya dir-scan suphesi.",
                 err4, total, err4 * 100 / total);
        out_alert->ts = e->ts;
        alert_set_mitre(out_alert, MITRE_T1083, "Discovery");
        atomic_store(&rec->last_alert_ts, e->ts);
        return anomaly_emit(rec, out_alert, 0);
    }

    /* 8. EWMA Mahalanobis ML
     *    Kural tabanlı detektörler alarmlamadıysa bile tek başına yüksek
     *    Mahalanobis mesafesi ALERT_WARN üretir; ban için yeterli değil.
     */
    {
        int ml_score = anomaly_weighted_score(rec, e);
        if (ml_score >= 14) {
            time_t la = atomic_load(&rec->last_alert_ts);
            if (!(la > 0 && (e->ts - la) < g_alert_cooldown_sec)) {
                out_alert->level = ALERT_WARN;
                copy_ip(out_alert->ip, rec->ip);
                snprintf(out_alert->message, ALERT_MSG_LEN,
                         "ML ANOMALI! EWMA Mahalanobis uzaklik yuksek — "
                         "ML skor: %d. Sessiz sapma / gizli saldiri olabilir.",
                         ml_score);
                out_alert->ts = e->ts;
                alert_set_mitre(out_alert, MITRE_T1110, "Credential Access");
                atomic_store(&rec->last_alert_ts, e->ts);
                return anomaly_emit(rec, out_alert, 0);
            }
        } else {
            /* Skör düşük olsa bile EWMA'yı güncelle (sessiz öğrenme) */
            AdaptiveRecord *ar = get_adaptive_rec(rec->ip);
            if (ar && total > 0) {
                double cur_rps      = (double)ipmap_window_count_since(rec, e->ts - 1);
                double cur_err_rate = total > 0
                    ? (double)atomic_load(&rec->cnt.error_4xx) / (double)total
                    : 0.0;
                adaptive_update(ar, (uint32_t)cur_rps, cur_err_rate,
                                e->response_ms);
                /* Varyans hav uzunu güncelle */
                EwmaVariance *ev = get_ewma_var(rec->ip);
                double resp_norm = e->response_ms > 0
                    ? (double)e->response_ms / 5000.0 : 0.0;
                if (resp_norm > 1.0) resp_norm = 1.0;
                update_ewma_variance(ev, ar, cur_rps, cur_err_rate, resp_norm);
            }
        }
    }

    return 0;
}

/* ── WAF Entegrasyonu ──────────────────────────────────────────────── */

int detect_waf_threat(StrView url, StrView body,
                      StrView user_agent, const char *method,
                      Alert *out_alert, const char *ip,
                      StrView host, StrView cookie) {
    if (!out_alert) return 0;
    
    char path[1024] = {0};
    if (url.len > 0)
        url_path_only(url.ptr, url.len, path, sizeof(path));

    WafResult wr = waf_analyze_full(url, body, user_agent, method, path, ip,
                                    host, cookie);

    int blocked = waf_should_ban(&wr) ? 1 : 0;
    l7_telemetry_record(method, blocked);
    
    /* Deception: LFI veya dizin gecisi varsa tarpit ve sahte icerik tetikle */
    if (wr.dominant == WAF_CAT_LFI && ip) {
        anomaly_trigger_deception(ip, url, g_ipc_fd);
    }
    
    if (!blocked) return 0;
    out_alert->level = ALERT_CRIT;
    if (ip) {
        size_t n = strlen(ip);
        if (n >= IP_STR_LEN) n = IP_STR_LEN - 1;
        memcpy(out_alert->ip, ip, n);
        out_alert->ip[n] = '\0';
    }
    snprintf(out_alert->message, ALERT_MSG_LEN,
             "WAF ALARM! Kategori: %s | Skor: %d | %d kural eslemesi",
             waf_category_str(wr.dominant), wr.total_score, wr.match_count);
    out_alert->ts = time(NULL);
    return 1;
}

/* ── Adaptive Threshold ─────────────────────────────────────────────── */

AdaptiveDecision anomaly_adaptive_check(IpRecord *rec, uint32_t cur_rps,
                                        double err_rate, long resp_ms) {
    if (!rec) return ADAPTIVE_OK;
    AdaptiveRecord *ar = get_adaptive_rec(rec->ip);
    if (!ar) return ADAPTIVE_OK;
    double boost = fp_trust_adaptive_boost(rec->ip);
    return adaptive_check_boost(ar, cur_rps, err_rate, resp_ms, boost);
}

void anomaly_adaptive_update(IpRecord *rec, uint32_t cur_rps,
                             double err_rate, long resp_ms) {
    if (!rec) return;
    AdaptiveRecord *ar = get_adaptive_rec(rec->ip);
    if (ar) adaptive_update(ar, cur_rps, err_rate, resp_ms);
}

/* ── Session Fingerprint: User-Agent Tutarsizlik Tespiti ────────────── */

int detect_ua_switching(IpRecord *rec, StrView user_agent) {
    if (!rec || !user_agent.ptr || user_agent.len == 0) return 0;
    uint32_t idx      = ip_idx(rec->ip);
    uint32_t new_hash = hash_ua(user_agent);
    
    uint32_t expected = 0;
    if (atomic_compare_exchange_strong(&g_ua_hash[idx], &expected, new_hash)) {
        return 0; /* First time setting the hash */
    }
    
    uint32_t old_hash = atomic_load(&g_ua_hash[idx]);
    if (old_hash != new_hash) {
        atomic_store(&g_ua_hash[idx], new_hash);
        uint8_t old_chg = atomic_load(&g_ua_chg[idx]);
        if (old_chg < 255) {
            old_chg = atomic_fetch_add(&g_ua_chg[idx], 1) + 1;
        }
        if (old_chg >= SESSION_UA_CHANGE_THRESHOLD) return 1;
    }
    return 0;
}

/* ── Konfigürasyon Yükleyicileri ───────────────────────────────────── */

void anomaly_load_waf_config(int enabled, int ban_threshold,
                             int lfi, int ssrf, int xxe,
                             int xss, int scanner, int shellcmd) {
    WafConfig cfg;
    waf_config_get(&cfg);
    cfg.enabled                = enabled;
    if (ban_threshold > 0)     cfg.ban_threshold = ban_threshold;
    cfg.lfi_enabled            = lfi;
    cfg.ssrf_enabled           = ssrf;
    cfg.xxe_enabled            = xxe;
    cfg.xss_enabled            = xss;
    cfg.scanner_detect_enabled = scanner;
    cfg.shellcmd_enabled       = shellcmd;
    waf_config_set(&cfg);
}

void anomaly_load_adaptive_config(int enabled, double alpha,
                                  double warn_mult, double ban_mult,
                                  int warmup) {
    adaptive_config_set(alpha, warn_mult, ban_mult, warmup);
    adaptive_config_set_enabled(enabled);
}

/* ── EWMA + Mahalanobis Tabanlı ML Anomali Skoru ────────────────────────── *
 *
 * Her IP için üç boyutlu bir EWMA baz hattı tutulur:
 *   X = [rps, err_rate, resp_ms_normalized]
 *
 * Mahalanobis mesafesi (diyagonal kovaryans varsayımıyla):
 *   M = sqrt( sum_i [ (x_i - mu_i)^2 / sigma_i^2 ] )
 *
 * Sigma EWMA varyansından hesaplanır. Varyans sıfırsa min-epsilon ile
 * korunur (sıfıra bölme engeli).
 *
 * Eşik aralıkları:
 *   M < 2.0  => Normal   (skor 0)
 *   M < 3.5  => Şüpheli  (skor 4)
 *   M < 5.5  => Tehdit    (skor 8)
 *   M >= 5.5 => Kritik    (skor 13)
 */

/* Her IP'ye ait EWMA varyans istatistiklerini tutan ek havuz */

#define EWMA_VAR_POOL_SIZE (1 << 16)
static EwmaVariance g_ewma_var_pool[EWMA_VAR_POOL_SIZE];
static pthread_once_t g_ewma_var_once = PTHREAD_ONCE_INIT;

static void init_ewma_var_pool(void) {
    memset(g_ewma_var_pool, 0, sizeof(g_ewma_var_pool));
}

static EwmaVariance *get_ewma_var(const char *ip) {
    if (!ip) return NULL;
    pthread_once(&g_ewma_var_once, init_ewma_var_pool);
    uint32_t h = 2166136261u;
    for (const char *p = ip; *p; p++) { h ^= (uint8_t)*p; h *= 16777619u; }
    return &g_ewma_var_pool[h & (EWMA_VAR_POOL_SIZE - 1)];
}

/* EWMA varyansını Welford online algorithm ile güncelle */
static void update_ewma_variance(EwmaVariance *ev, AdaptiveRecord *ar,
                                  double rps, double err, double resp_norm) {
    if (!ev || !ar) return;
    ev->n++;

    /* Mahalanobis için varyans: EWMA-weighted online estimator
     * var_new = (1-alpha) * var_old + alpha * (x - mu)^2            */
    double alpha = 0.10;  /* Varyans EWMA katsayısı */

    double d_rps  = rps      - ar->ema_rps;
    double d_err  = err      - ar->ema_err_rate;
    double d_resp = resp_norm - (ar->ema_resp_ms / 5000.0);

    if (ev->n < 5) {
        /* İlk birkaç örnekte başlatma değeri olarak kare fark kullan */
        ev->var_rps  += d_rps  * d_rps;
        ev->var_err  += d_err  * d_err;
        ev->var_resp += d_resp * d_resp;
        if (ev->n == 4) {
            ev->var_rps  /= 4.0;
            ev->var_err  /= 4.0;
            ev->var_resp /= 4.0;
        }
    } else {
        ev->var_rps  = (1.0 - alpha) * ev->var_rps  + alpha * d_rps  * d_rps;
        ev->var_err  = (1.0 - alpha) * ev->var_err  + alpha * d_err  * d_err;
        ev->var_resp = (1.0 - alpha) * ev->var_resp + alpha * d_resp * d_resp;
    }
}

/* Mahalanobis mesafesini hesapla */
static double compute_mahalanobis(AdaptiveRecord *ar, EwmaVariance *ev,
                                   double rps, double err, double resp_norm) {
    if (!ar || !ev || ev->n < 10) return 0.0;  /* Veri yetersiz */

    const double EPS = 1e-9;  /* sıfıra bölme engeli */

    double sigma2_rps  = ev->var_rps  > EPS ? ev->var_rps  : EPS;
    double sigma2_err  = ev->var_err  > EPS ? ev->var_err  : EPS;
    double sigma2_resp = ev->var_resp > EPS ? ev->var_resp : EPS;

    double d_rps  = rps       - ar->ema_rps;
    double d_err  = err       - ar->ema_err_rate;
    double d_resp = resp_norm - (ar->ema_resp_ms / 5000.0);

    double dist2 = (d_rps  * d_rps)  / sigma2_rps
                 + (d_err  * d_err)  / sigma2_err
                 + (d_resp * d_resp) / sigma2_resp;

    return sqrt(dist2);
}

int anomaly_weighted_score(IpRecord *rec, const LogEntry *e) {
    if (!rec || !e) return 0;

    long total = atomic_load(&rec->cnt.total_requests);
    long err4  = atomic_load(&rec->cnt.error_4xx);
    long err5  = atomic_load(&rec->cnt.error_5xx);
    long sqli  = atomic_load(&rec->cnt.sqli_hits);
    long slow  = atomic_load(&rec->cnt.resp_slow);

    /* ── Geleneksel kural tabanlı skor (baz) ────────────────────────── */
    int score = 0;
    if (total > 20 && (err4 * 100 / total) > 40) score += 3;
    if (total > 10 && (err5 * 100 / total) > 20) score += 2;
    if (sqli >= g_sqli_score)     score += 5;
    if (slow >= g_slow_hit_count) score += 2;
    if (detect_low_and_slow(rec, e->ts)) score += 4;
    if (detect_beaconing(rec))    score += 6;

    /* ── EWMA Mahalanobis ML katkısı ───────────────────────────────── */
    AdaptiveRecord *ar = get_adaptive_rec(rec->ip);
    EwmaVariance   *ev = get_ewma_var(rec->ip);

    if (ar && ev && total > 0) {
        /* Mevcut anlık değerler (normalize edilmiş) */
        double cur_rps       = (double)ipmap_window_count_since(rec, e->ts - 1);
        double cur_err_rate  = total > 0 ? (double)err4 / (double)total : 0.0;
        double cur_resp_norm = total > 0
            ? (double)e->response_ms / 5000.0 : 0.0;  /* 5000 ms normalize */
        if (cur_resp_norm > 1.0) cur_resp_norm = 1.0;

        /* Varyans güncelle */
        update_ewma_variance(ev, ar, cur_rps, cur_err_rate, cur_resp_norm);

        /* EWMA'yı da güncelle (baz hattı kayan ortalama) */
        adaptive_update(ar, (uint32_t)cur_rps, cur_err_rate,
                        e->response_ms);

        /* Mahalanobis mesafesi */
        double M = compute_mahalanobis(ar, ev,
                                       cur_rps, cur_err_rate, cur_resp_norm);

        if      (M >= 5.5) score += 13;
        else if (M >= 3.5) score += 8;
        else if (M >= 2.0) score += 4;
        /* M < 2.0: normal bant, katkı yok */
    }

    return score; /* >= 10 -> ban önerilir */
}

/* ── Intelligence Motorlari Entegrasyonu ─────────────────────────── */

void anomaly_set_ipc_fd(int fd) {
    g_ipc_fd = fd;
}

/*
 * anomaly_process_ja3_event:
 *   XDP ring buffer'dan gelen TLS Client Hello event'ini işler.
 *   C2 araç imzası eşleşirse ALERT_CRIT üretir.
 */
int anomaly_process_ja3_event(const uint8_t *payload, uint16_t payload_len,
                              const char *ip_str, Alert *out_alert) {
    if (!payload || !out_alert || !ip_str) return 0;
    out_alert->level = ALERT_NONE;

    Ja3Result jr;
    if (ja3_parse_client_hello(payload, payload_len, &jr) != 0) return 0;

    /* C2 eşleşmesi var mı? */
    if (jr.c2_tool[0] == '\0') return 0;

    out_alert->level = ALERT_CRIT;
    size_t n = strlen(ip_str);
    if (n >= IP_STR_LEN) n = IP_STR_LEN - 1;
    memcpy(out_alert->ip, ip_str, n);
    out_alert->ip[n] = '\0';
    snprintf(out_alert->message, ALERT_MSG_LEN,
             "JA3 C2 PARMAK IZI! Araç: %s | JA3: %s | JA4: %s",
             jr.c2_tool, jr.ja3_hash, jr.ja4_hash);
    out_alert->ts = time(NULL);
    alert_set_mitre(out_alert, MITRE_T1573_002, "Command & Control");

    {
        char fp[72];
        ja3_cluster_fingerprint_ja3(jr.ja3_hash, fp, sizeof(fp));
        ja3_cluster_track(ip_str, fp, out_alert->ts);
    }

    /* Active Deception: C2 tespit → tarpit escalate */
    deception_trigger_c2_tool(ip_str, jr.c2_tool, g_ipc_fd);
    return 1;
}

/*
 * anomaly_process_apt_graph:
 *   Log entry'yi APT dağıtık korelasyon motoruna gönderir.
 *   Küme tespitinde Alert üretir.
 */
int anomaly_process_apt_graph(IpRecord *rec, const LogEntry *e,
                              Alert *out_alert) {
    if (!rec || !e || !out_alert) return 0;
    out_alert->level = ALERT_NONE;

    char ip_str[IP_STR_LEN];
    size_t n = strlen(rec->ip);
    if (n >= IP_STR_LEN) n = IP_STR_LEN - 1;
    memcpy(ip_str, rec->ip, n); ip_str[n] = '\0';

    AptResult ar = apt_graph_submit(ip_str, e->url, e->body, e->ts);
    if (ar == APT_RESULT_CLEAN) return 0;

    out_alert->level = ALERT_CRIT;
    copy_ip(out_alert->ip, rec->ip);
    out_alert->ts = e->ts;

    char cluster_desc[256] = {0};
    /* payload hash'i hesaplayamayız burada, genel mesaj yeterli */
    switch (ar) {
        case APT_RESULT_SYNC_APT:
            snprintf(out_alert->message, ALERT_MSG_LEN,
                     "SENKRON APT SALDIRISI! %d+ IP eszamanli payload: "
                     "BOTNET/DEVLET DESTEKLI TEHDIT AKTORU.",
                     APT_MIN_CLUSTER_IPS);
            break;
        case APT_RESULT_ENTROPY:
            snprintf(out_alert->message, ALERT_MSG_LEN,
                     "DAGITIK APT KUMESI! Farkli IP'lerden AYNI entropi "
                     "payload — APT Toolkit tespiti.");
            break;
        default:
            snprintf(out_alert->message, ALERT_MSG_LEN,
                     "APT KUME ALARMI! %d+ farkli IP ayni normalize payload "
                     "kullaniyor. %s", APT_MIN_CLUSTER_IPS, cluster_desc);
    }
    alert_set_mitre(out_alert, MITRE_T1584, "Resource Development");
    return 1;
}

/*
 * anomaly_trigger_deception:
 *   LFI veya WAF WAF_CAT_LFI tespitinde çağrılır.
 *   Tarpit escalate + honey-credential log.
 */
int anomaly_trigger_deception(const char *ip, StrView url, int ipc_fd) {
    if (!ip) return 0;
    return deception_trigger_lfi(ip, url, ipc_fd >= 0 ? ipc_fd : g_ipc_fd);
}

/*
 * anomaly_check_covert:
 *   Log entry üzerinde 4 covert channel tespiti çalıştırır.
 *   Alarm üretirse 1 döner.
 */
int anomaly_check_covert(IpRecord *rec, const LogEntry *e, Alert *out_alert) {
    if (!rec || !e || !out_alert) return 0;
    out_alert->level = ALERT_NONE;

    CovertResult cr;
    CovertType ct = covert_ch_analyze(rec, e, &cr);
    if (ct == COVERT_NONE) return 0;

    out_alert->level = ALERT_WARN;
    copy_ip(out_alert->ip, rec->ip);
    out_alert->ts = e->ts;

    const char *type_str =
        ct == COVERT_COOKIE    ? "COOKIE/ETAG ENTROPI" :
        ct == COVERT_RESP_SIZE ? "YANIT BOYUTU SAPMASI" :
        ct == COVERT_DNS_TUNNEL? "DNS TUNELI" :
        ct == COVERT_TIMING    ? "ZAMANLAMA KANALI" :
                                 "COKLU COVERT SINYAL";

    snprintf(out_alert->message, ALERT_MSG_LEN,
             "COVERT CHANNEL! Tip: %s | %s | Entropi: %.2f",
             type_str, cr.detail, cr.entropy);
             
    if (ct == COVERT_DNS_TUNNEL) alert_set_mitre(out_alert, MITRE_T1071_004, "Command & Control");
    else                         alert_set_mitre(out_alert, MITRE_T1020, "Exfiltration");
    
    return 1;
}

/*
 * anomaly_process_tls_plaintext:
 *   eBPF uprobe'dan gelen TLS plaintext'i analiz eder.
 *   Büyük giden veri akışı → Data Exfiltration alarmı.
 */
void anomaly_process_tls_plaintext(const char *ip, const uint8_t *data,
                                   uint32_t len, uint8_t direction,
                                   Alert *out_alert) {
    if (!out_alert) return;
    out_alert->level = ALERT_NONE;
    (void)data;

    /* Giden veri (WRITE) büyükse exfil şüphesi */
    if (direction == 2 && len >= 512) {  /* TLS_EVENT_WRITE */
        out_alert->level = ALERT_WARN;
        if (ip) {
            size_t n = strlen(ip);
            if (n >= IP_STR_LEN) n = IP_STR_LEN - 1;
            memcpy(out_alert->ip, ip, n);
            out_alert->ip[n] = '\0';
        } else {
            strncpy(out_alert->ip, "unknown", IP_STR_LEN - 1);
        }
        snprintf(out_alert->message, ALERT_MSG_LEN,
                 "TLS PLAINTEXT EXFIL! Giden %u byte SSL oncesi bellekte "
                 "yakalandi (uprobe). Veri sizintisi suphesi.",
                 len);
        out_alert->ts = time(NULL);
        alert_set_mitre(out_alert, MITRE_T1040, "Credential Access");
    }
}

/*
 * anomaly_intel_stats:
 *   Tüm istihbarat motorlarının istatistiklerini tek çağrıda toplar.
 */
void anomaly_intel_stats(uint64_t *ja3_total, uint64_t *ja3_c2,
                         uint64_t *apt_clusters, uint64_t *apt_detections,
                         uint64_t *covert_hits, uint64_t *honey_traps) {
    ja3_get_stats(ja3_total, ja3_c2);
    apt_graph_get_stats(apt_clusters, apt_detections);

    uint64_t ck=0, rs=0, dns=0, tim=0;
    covert_get_stats(&ck, &rs, &dns, &tim);
    if (covert_hits) *covert_hits = ck + rs + dns + tim;

    uint64_t lfi=0, c2=0, hs=0;
    deception_get_stats(&lfi, &c2, &hs);
    if (honey_traps) *honey_traps = hs;
}