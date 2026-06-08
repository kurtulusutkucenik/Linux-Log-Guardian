/* etcd_mesh.c — Dağıtık Mesh İstihbaratı: Etcd v3 HTTP API
 *
 * Enterprise seviyesinde dağıtık tehdit koordinasyonu:
 *   • Ajan ban atar  → Etcd KV store'a PUT (TTL lease ile)
 *   • Diğer ajanlar → Etcd Watch stream'i ile değişikliği anında alır
 *   • Alınan ban    → daemon_ipc_ban_ipv4/v6() → XDP kernel map'e yazılır
 *
 * ZeroMQ'nun aksine Etcd:
 *   - Kalıcı state (broker çökmesinde ban'lar kaybolmaz)
 *   - Raft consensus ile cluster toleransı
 *   - TTL lease: ban süresi dolunca otomatik temizlenir
 *   - Kubernetes'in kendi etcd'si (sıfır ek altyapı)
 *
 * Derleme: -DHAVE_ETCD -lcurl
 */

#define _GNU_SOURCE
#include "etcd_mesh.h"
#include "daemon_ipc.h"
#include "logger.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <stdatomic.h>
#include <syslog.h>
#include <time.h>
#include <errno.h>
#include <arpa/inet.h>

#ifdef HAVE_ETCD
#include <curl/curl.h>
#endif

/* ── İstatistik sayaçları ──────────────────────────────────────────── */
static _Atomic uint64_t g_stat_pub_sent      = 0;
static _Atomic uint64_t g_stat_watch_recv    = 0;
static _Atomic uint64_t g_stat_watch_applied = 0;
static _Atomic uint64_t g_stat_errors        = 0;
static _Atomic uint64_t g_stat_reconnects    = 0;

/* ── Modül durumu ──────────────────────────────────────────────────── */
static const EtcdMeshConfig *g_cfg          = NULL;
static pthread_t              g_watch_thread;
static int                    g_watch_thread_started = 0;
static volatile int           g_watch_running = 0;
static volatile int           g_initialized   = 0;

/* Aktif endpoint index (HA round-robin) */
static int   g_ep_count = 0;
static char  g_endpoints[ETCD_MESH_MAX_ENDPOINTS][ETCD_MESH_ENDPOINT_MAXLEN];
static int   g_ep_current = 0;

#ifdef HAVE_ETCD

/* ── Yardımcı: Base64 encode (Etcd v3 API key/value base64 ister) ── */
static const char B64_TABLE[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static void base64_encode(const unsigned char *in, size_t inlen,
                           char *out, size_t outsize) {
    size_t i = 0, o = 0;
    while (i < inlen && o + 5 < outsize) {
        uint32_t val = 0;
        int pad = 0;
        val = (uint32_t)in[i++] << 16;
        if (i < inlen) { val |= (uint32_t)in[i++] << 8; }
        else pad++;
        if (i < inlen) { val |= (uint32_t)in[i++]; }
        else pad++;

        out[o++] = B64_TABLE[(val >> 18) & 0x3F];
        out[o++] = B64_TABLE[(val >> 12) & 0x3F];
        out[o++] = (pad >= 2) ? '=' : B64_TABLE[(val >> 6) & 0x3F];
        out[o++] = (pad >= 1) ? '=' : B64_TABLE[ val       & 0x3F];
    }
    out[o] = '\0';
}

/* ── CURL write callback: yanıtı dinamik buffer'a yazar ─────────── */
typedef struct {
    char  *buf;
    size_t len;
    size_t cap;
} CurlBuf;

static size_t curl_write_cb(void *data, size_t sz, size_t nmemb, void *userp) {
    CurlBuf *cb  = (CurlBuf *)userp;
    size_t  bytes = sz * nmemb;
    if (cb->len + bytes + 1 > cb->cap) {
        size_t newcap = cb->cap + bytes + 4096;
        char  *tmp    = realloc(cb->buf, newcap);
        if (!tmp) return 0;
        cb->buf = tmp;
        cb->cap = newcap;
    }
    memcpy(cb->buf + cb->len, data, bytes);
    cb->len += bytes;
    cb->buf[cb->len] = '\0';
    return bytes;
}

/* ── Aktif endpoint URL'si ─────────────────────────────────────────── */
static const char *current_endpoint(void) {
    if (g_ep_count == 0) return "";
    return g_endpoints[g_ep_current % g_ep_count];
}

static void rotate_endpoint(void) {
    if (g_ep_count > 1) {
        g_ep_current = (g_ep_current + 1) % g_ep_count;
        syslog(LOG_INFO, "[ETCD_MESH] Endpoint rotasyonu: %s",
               current_endpoint());
    }
}

/* ── Etcd Lease oluştur (TTL saniye) ───────────────────────────────── */
static long long etcd_lease_grant(CURL *curl, int ttl_sec) {
    char url[512];
    snprintf(url, sizeof(url), "%s/v3/lease/grant", current_endpoint());

    char body[64];
    snprintf(body, sizeof(body), "{\"TTL\":%d,\"ID\":0}", ttl_sec);

    CurlBuf cb = { .buf = NULL, .len = 0, .cap = 0 };
    cb.buf = malloc(4096); cb.cap = 4096; cb.buf[0] = '\0';

    struct curl_slist *hdrs = NULL;
    hdrs = curl_slist_append(hdrs, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hdrs);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &cb);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);

    CURLcode rc = curl_easy_perform(curl);
    curl_slist_free_all(hdrs);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, NULL);

    long long lease_id = 0;
    if (rc == CURLE_OK && cb.buf) {
        /* Basit JSON parse: "ID":"<id>" */
        const char *p = strstr(cb.buf, "\"ID\":\"");
        if (p) { p += 6; lease_id = strtoll(p, NULL, 10); }
        if (!lease_id) {
            p = strstr(cb.buf, "\"ID\":");
            if (p) { p += 5; lease_id = strtoll(p, NULL, 10); }
        }
    }

    free(cb.buf);
    return lease_id;
}

/* ── Etcd KV PUT (ban'ı yaz) ────────────────────────────────────────── */
static int etcd_kv_put(CURL *curl,
                        const char *ip, uint32_t score,
                        const char *tactic, const char *reason,
                        long long lease_id) {
    /* Key: /mesh/bans/{tenant_id}/{ip} */
    char key_raw[256];
    snprintf(key_raw, sizeof(key_raw), "%s/%s/%s",
             ETCD_MESH_KEY_PREFIX,
             g_cfg->tenant_id[0] ? g_cfg->tenant_id : "default",
             ip);

    /* Value: JSON payload */
    char val_raw[512];
    snprintf(val_raw, sizeof(val_raw),
             "{\"ip\":\"%s\",\"score\":%u,\"tactic\":\"%s\","
             "\"reason\":\"%s\",\"ts\":%ld}",
             ip, score,
             tactic  ? tactic  : "",
             reason  ? reason  : "",
             (long)time(NULL));

    /* Base64 encode */
    char key_b64[512], val_b64[1024];
    base64_encode((const unsigned char *)key_raw, strlen(key_raw),
                  key_b64, sizeof(key_b64));
    base64_encode((const unsigned char *)val_raw, strlen(val_raw),
                  val_b64, sizeof(val_b64));

    /* JSON body */
    char body[2048];
    if (lease_id > 0) {
        snprintf(body, sizeof(body),
                 "{\"key\":\"%s\",\"value\":\"%s\",\"lease\":\"%lld\"}",
                 key_b64, val_b64, lease_id);
    } else {
        snprintf(body, sizeof(body),
                 "{\"key\":\"%s\",\"value\":\"%s\"}",
                 key_b64, val_b64);
    }

    char url[512];
    snprintf(url, sizeof(url), "%s/v3/kv/put", current_endpoint());

    CurlBuf cb = { .buf = NULL, .len = 0, .cap = 0 };
    cb.buf = malloc(4096); cb.cap = 4096; cb.buf[0] = '\0';

    struct curl_slist *hdrs = NULL;
    hdrs = curl_slist_append(hdrs, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hdrs);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &cb);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 5L);

    CURLcode rc = curl_easy_perform(curl);
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

    curl_slist_free_all(hdrs);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, NULL);
    free(cb.buf);

    if (rc != CURLE_OK || (http_code != 200)) {
        syslog(LOG_WARNING,
               "[ETCD_MESH] PUT hatası: curl=%d http=%ld ip=%s",
               rc, http_code, ip);
        rotate_endpoint();
        return -1;
    }
    return 0;
}

/* ── Etcd Watch: Beklenen JSON event'ten IP'yi parse et ────────────── */
/* Etcd v3 watch stream yanıtı:
 * {"result":{"events":[{"type":"PUT","kv":{"key":"...","value":"..."}}]}}
 * value base64 → decode → {"ip":"...", "score":..., ...} */

static int base64_decode_byte(char c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

static int base64_decode(const char *in, char *out, size_t outsize) {
    size_t len = strlen(in);
    size_t o = 0;
    for (size_t i = 0; i + 3 < len && o + 2 < outsize; i += 4) {
        int a = base64_decode_byte(in[i]);
        int b = base64_decode_byte(in[i+1]);
        int c = (in[i+2] != '=') ? base64_decode_byte(in[i+2]) : 0;
        int d = (in[i+3] != '=') ? base64_decode_byte(in[i+3]) : 0;
        if (a < 0 || b < 0) break;
        out[o++] = (char)((a << 2) | (b >> 4));
        if (in[i+2] != '=' && o < outsize) out[o++] = (char)((b << 4) | (c >> 2));
        if (in[i+3] != '=' && o < outsize) out[o++] = (char)((c << 6) | d);
    }
    if (o < outsize) out[o] = '\0';
    return (int)o;
}

/* Basit JSON string değer çekme */
static int json_get_str(const char *json, const char *key,
                          char *out, size_t outsize) {
    char search[128];
    snprintf(search, sizeof(search), "\"%s\":\"", key);
    const char *p = strstr(json, search);
    if (!p) return -1;
    p += strlen(search);
    size_t i = 0;
    while (*p && *p != '"' && i + 1 < outsize)
        out[i++] = *p++;
    out[i] = '\0';
    return (int)i;
}

/* Watch response'u işle: ban'ı uygula */
static void process_watch_event(const char *json_chunk) {
    /* "value":"<base64>" kısmını bul */
    const char *vp = strstr(json_chunk, "\"value\":\"");
    if (!vp) return;
    vp += 9;
    /* base64 değerini kopyala */
    char b64[512] = {0};
    size_t bi = 0;
    while (*vp && *vp != '"' && bi + 1 < sizeof(b64))
        b64[bi++] = *vp++;

    if (!bi) return;

    char val[512] = {0};
    if (base64_decode(b64, val, sizeof(val)) <= 0) return;

    /* {"ip":"...", "score":...} parse */
    char ip[64] = {0};
    if (json_get_str(val, "ip", ip, sizeof(ip)) <= 0) return;

    /* IP validasyonu */
    struct in_addr v4;
    struct in6_addr v6;
    int is_v6 = (strchr(ip, ':') != NULL);
    if (is_v6) {
        if (inet_pton(AF_INET6, ip, &v6) != 1) return;
    } else {
        if (inet_pton(AF_INET, ip, &v4) != 1) return;
    }

    atomic_fetch_add(&g_stat_watch_recv, 1);

    /* XDP map'e uygula */
    int ban_rc;
    if (is_v6)
        ban_rc = daemon_ipc_ban_ipv6(ip);
    else
        ban_rc = daemon_ipc_ban_ipv4(ip);

    if (ban_rc == 0) {
        atomic_fetch_add(&g_stat_watch_applied, 1);
        syslog(LOG_INFO,
               "[ETCD_MESH] Uzak ban uygulandı: IP=%s (Etcd watch)", ip);
    } else {
        atomic_fetch_add(&g_stat_errors, 1);
        syslog(LOG_WARNING,
               "[ETCD_MESH] Ban uygulanamadı: IP=%s (daemon_ipc hatası)", ip);
    }
}

/* ── Watch thread ──────────────────────────────────────────────────── */
static void *etcd_watch_thread(void *arg) {
    (void)arg;
    syslog(LOG_INFO, "[ETCD_MESH] Watch thread başladı → %s",
           current_endpoint());

    while (g_watch_running) {
        CURL *curl = curl_easy_init();
        if (!curl) {
            syslog(LOG_ERR, "[ETCD_MESH] curl_easy_init hatası");
            usleep(ETCD_MESH_RECONNECT_MS * 1000);
            continue;
        }

        /* Watch key prefix için base64 */
        char prefix_raw[256];
        snprintf(prefix_raw, sizeof(prefix_raw), "%s/%s/",
                 ETCD_MESH_KEY_PREFIX,
                 g_cfg->tenant_id[0] ? g_cfg->tenant_id : "default");

        char prefix_b64[512];
        base64_encode((const unsigned char *)prefix_raw,
                      strlen(prefix_raw), prefix_b64, sizeof(prefix_b64));

        /* range_end: prefix + '\0' trick (key + 1) */
        char range_raw[256];
        snprintf(range_raw, sizeof(range_raw), "%s", prefix_raw);
        range_raw[strlen(range_raw) - 1]++;   /* last char +1 */
        char range_b64[512];
        base64_encode((const unsigned char *)range_raw,
                      strlen(range_raw), range_b64, sizeof(range_b64));

        char body[1024];
        snprintf(body, sizeof(body),
                 "{\"create_request\":{"
                 "\"key\":\"%s\","
                 "\"range_end\":\"%s\","
                 "\"prev_kv\":false,"
                 "\"progress_notify\":true}}",
                 prefix_b64, range_b64);

        char url[512];
        snprintf(url, sizeof(url), "%s/v3/watch", current_endpoint());

        CurlBuf cb = { .buf = NULL, .len = 0, .cap = 0 };
        cb.buf = malloc(65536); cb.cap = 65536; cb.buf[0] = '\0';

        struct curl_slist *hdrs = NULL;
        hdrs = curl_slist_append(hdrs, "Content-Type: application/json");

        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hdrs);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &cb);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT,
                         (long)(ETCD_MESH_WATCH_TIMEOUT));
        curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);

        CURLcode rc = curl_easy_perform(curl);

        if (rc == CURLE_OK && cb.buf && cb.len > 0) {
            /* Yanıt içinde birden fazla JSON satırı gelebilir (streaming) */
            char *line = cb.buf;
            while (line && *line) {
                char *nl = strchr(line, '\n');
                if (nl) *nl = '\0';
                if (strstr(line, "\"PUT\"") || strstr(line, "\"kv\"")) {
                    process_watch_event(line);
                }
                if (!nl) break;
                line = nl + 1;
            }
        } else if (rc != CURLE_OPERATION_TIMEDOUT && g_watch_running) {
            syslog(LOG_WARNING,
                   "[ETCD_MESH] Watch bağlantısı koptu (curl=%d), yeniden bağlanıyor...",
                   rc);
            atomic_fetch_add(&g_stat_reconnects, 1);
            rotate_endpoint();
            usleep(ETCD_MESH_RECONNECT_MS * 1000);
        }

        curl_slist_free_all(hdrs);
        free(cb.buf);
        curl_easy_cleanup(curl);
    }

    syslog(LOG_INFO, "[ETCD_MESH] Watch thread durdu.");
    return NULL;
}

/* ── Endpoint string'ini parse et ─────────────────────────────────── */
static void parse_endpoints(const char *ep_str) {
    g_ep_count   = 0;
    g_ep_current = 0;
    if (!ep_str || !*ep_str) return;

    char tmp[ETCD_MESH_ENDPOINT_MAXLEN * ETCD_MESH_MAX_ENDPOINTS];
    strncpy(tmp, ep_str, sizeof(tmp) - 1);
    tmp[sizeof(tmp) - 1] = '\0';

    char *tok = strtok(tmp, ";,");
    while (tok && g_ep_count < ETCD_MESH_MAX_ENDPOINTS) {
        /* Baştaki/sondaki boşlukları temizle */
        while (*tok == ' ') tok++;
        size_t l = strlen(tok);
        while (l > 0 && tok[l-1] == ' ') tok[--l] = '\0';

        if (l > 0) {
            strncpy(g_endpoints[g_ep_count], tok,
                    ETCD_MESH_ENDPOINT_MAXLEN - 1);
            g_ep_count++;
        }
        tok = strtok(NULL, ";,");
    }
}

#endif /* HAVE_ETCD */

/* ═══════════════════════════════════════════════════════════════════ */
/*                      PUBLIC API                                      */
/* ═══════════════════════════════════════════════════════════════════ */

int etcd_mesh_init(const EtcdMeshConfig *cfg) {
#ifndef HAVE_ETCD
    (void)cfg;
    syslog(LOG_WARNING,
           "[ETCD_MESH] HAVE_ETCD ile derlenmedi. Etcd mesh devre dışı.");
    return -1;
#else
    if (!cfg || !cfg->endpoints[0]) return -1;
    if (g_initialized) return 0;

    curl_global_init(CURL_GLOBAL_DEFAULT);

    g_cfg = cfg;
    parse_endpoints(cfg->endpoints);

    if (g_ep_count == 0) {
        syslog(LOG_ERR, "[ETCD_MESH] Geçerli endpoint bulunamadı: %s",
               cfg->endpoints);
        return -1;
    }

    syslog(LOG_INFO,
           "[ETCD_MESH] Başlatıldı: %d endpoint, tenant=%s, TTL=%ds",
           g_ep_count,
           cfg->tenant_id[0] ? cfg->tenant_id : "default",
           cfg->ttl_sec > 0 ? cfg->ttl_sec : ETCD_MESH_TTL_DEFAULT_SEC);

    /* Watch thread'i başlat (mode 1 = sadece pub ise atla) */
    if (cfg->mode != 1) {
        g_watch_running = 1;
        int pr = pthread_create(&g_watch_thread, NULL,
                                etcd_watch_thread, NULL);
        if (pr == 0)
            g_watch_thread_started = 1;
        else {
            syslog(LOG_ERR, "[ETCD_MESH] Watch thread oluşturulamadı: %s",
                   strerror(pr));
            g_watch_running = 0;
        }
    }

    g_initialized = 1;
    return 0;
#endif
}

/* ── ─────────────────────────────────────────────────────────────── */

int etcd_mesh_publish(const char *ip, uint32_t threat_score,
                       const char *mitre_tactic, const char *reason) {
#ifndef HAVE_ETCD
    (void)ip; (void)threat_score; (void)mitre_tactic; (void)reason;
    return -1;
#else
    if (!g_initialized || !ip) return -1;
    if (g_cfg->mode == 2) return 0; /* sadece watch modu */

    /* Tehdit skoru eşiği */
    if ((int)threat_score < g_cfg->min_threat_score) return 0;

    CURL *curl = curl_easy_init();
    if (!curl) return -1;

    int ttl = g_cfg->ttl_sec > 0
              ? g_cfg->ttl_sec
              : ETCD_MESH_TTL_DEFAULT_SEC;

    /* Lease al */
    long long lease_id = etcd_lease_grant(curl, ttl);

    /* KV yaz */
    int rc = etcd_kv_put(curl, ip, threat_score,
                          mitre_tactic, reason, lease_id);

    curl_easy_cleanup(curl);

    if (rc == 0) {
        atomic_fetch_add(&g_stat_pub_sent, 1);
        syslog(LOG_INFO,
               "[ETCD_MESH] Ban yayınlandı: IP=%s score=%u "
               "tactic=%s TTL=%ds lease=%lld",
               ip, threat_score,
               mitre_tactic ? mitre_tactic : "-",
               ttl, lease_id);
    } else {
        atomic_fetch_add(&g_stat_errors, 1);
    }

    return rc;
#endif
}

/* ── ─────────────────────────────────────────────────────────────── */

void etcd_mesh_stop(void) {
#ifdef HAVE_ETCD
    if (!g_initialized) return;
    g_watch_running = 0;
    if (g_watch_thread_started) {
        pthread_join(g_watch_thread, NULL);
        g_watch_thread_started = 0;
    }
    curl_global_cleanup();
    g_initialized = 0;
    syslog(LOG_INFO, "[ETCD_MESH] Modül durduruldu.");
#endif
}

/* ── ─────────────────────────────────────────────────────────────── */

void etcd_mesh_get_stats(EtcdMeshStats *out) {
    if (!out) return;
    out->pub_sent      = atomic_load(&g_stat_pub_sent);
    out->watch_recv    = atomic_load(&g_stat_watch_recv);
    out->watch_applied = atomic_load(&g_stat_watch_applied);
    out->errors        = atomic_load(&g_stat_errors);
    out->reconnects    = atomic_load(&g_stat_reconnects);
}

/* ── ─────────────────────────────────────────────────────────────── */

int etcd_mesh_active(void) {
    return g_initialized;
}
