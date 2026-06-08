#ifndef ANOMALY_H
#define ANOMALY_H

#include "ip_map.h"
#include "parser.h"
#include "adaptive_threshold.h"
#include "waf_rules.h"
#include "ja3_engine.h"
#include "apt_graph.h"
#include "deception.h"
#include "covert_ch.h"
#include <time.h>
#include <math.h>
#include <string.h>

// Alarm seviyeleri
typedef enum {
    ALERT_NONE = 0,
    ALERT_INFO = 1,   // dusuk oncelik
    ALERT_WARN = 2,   // dikkat
    ALERT_CRIT = 3    // acil mudahale gerekli
} AlertLevel;

#define ALERT_MSG_LEN 256

/* MITRE ATT&CK Technique/Tactic sabitleri */
#define MITRE_T1190     "T1190"   /* Exploit Public-Facing Application (SQLi, LFI) */
#define MITRE_T1498     "T1498"   /* Network DoS                                   */
#define MITRE_T1110     "T1110"   /* Brute Force                                   */
#define MITRE_T1071_001 "T1071.001" /* App Layer C2 (beaconing, HTTP C2)          */
#define MITRE_T1071_004 "T1071.004" /* DNS Tunnel                                 */
#define MITRE_T1573_002 "T1573.002" /* Encrypted Channel: Asymmetric (JA3 C2)    */
#define MITRE_T1083     "T1083"   /* File and Directory Discovery (LFI)           */
#define MITRE_T1020     "T1020"   /* Automated Exfiltration (covert cookie)        */
#define MITRE_T1584     "T1584"   /* Compromise Infrastructure (APT cluster)       */
#define MITRE_T1499     "T1499"   /* Endpoint DoS (resource starvation)            */
#define MITRE_T1040     "T1040"   /* Network Sniffing / TLS exfil (uprobe)         */

typedef struct {
    AlertLevel  level;
    char        ip[IP_STR_LEN];
    char        message[ALERT_MSG_LEN];
    time_t      ts;
    char        mitre_id[16];     /* ATT&CK Technique ID: "T1190", "T1573.002", ... */
    char        mitre_tactic[32]; /* ATT&CK Tactic: "Initial Access", "C2", ... */
    char        incident_id[24];  /* Korelasyon: INC-xxxxxxxx-xxxx */
} Alert;

/* MITRE tag'ini Alert'e ata — anomaly.c içinde kullanilir */
static inline void alert_set_mitre(Alert *a, const char *id, const char *tactic) {
    if (!a) return;
    size_t ni = strlen(id);     if (ni >= sizeof(a->mitre_id))     ni = sizeof(a->mitre_id) - 1;
    size_t nt = strlen(tactic); if (nt >= sizeof(a->mitre_tactic)) nt = sizeof(a->mitre_tactic) - 1;
    memcpy(a->mitre_id,     id,     ni); a->mitre_id[ni]     = '\0';
    memcpy(a->mitre_tactic, tactic, nt); a->mitre_tactic[nt] = '\0';
}

// Esik degerleri (rules.conf ile override edilebilir)
#define THRESHOLD_LOW_SLOW_REQ    8
#define THRESHOLD_BRUTE_FORCE_ERR 1
#define THRESHOLD_DDOS_RPS        300
#define THRESHOLD_SLOW_RESP_MS    1200
#define THRESHOLD_SQLI_SCORE      1
#define THRESHOLD_SLOW_HIT_COUNT  3
#define THRESHOLD_ALERT_COOLDOWN  10

/* Shannon entropy esigi — obfuscated payload tespiti */
#define ENTROPY_THRESHOLD          6.5
/* Beaconing stddev esigi (saniye) — C2 bot tespiti */
#define BEACONING_STDDEV_THRESHOLD 0.5
#define BEACONING_MIN_SAMPLES      16
/* WAF toplam skor esigi — bu deger waf_config ile override edilir */
#define WAF_DEFAULT_BAN_THRESHOLD  10
/* Session fingerprint: UA degisiklik sayisi esigi */
#define SESSION_UA_CHANGE_THRESHOLD 3

// SQLi pattern tablosu
extern const char  *SQLI_PATTERNS[];
extern const size_t SQLI_PATTERN_COUNT;

// Log entry geldikten sonra cagrilir; supheli ise Alert doldurur
int anomaly_check(IpRecord *rec, const LogEntry *e, Alert *out_alert);

// URL icinde SQL enjeksiyonu tarar; bulursa 1 doner
int detect_sqli(StrView url, StrView body);

// URL kod cozme (URL decode) helper
void url_decode(const char *src, size_t src_len, char *dst, size_t *dst_len);

// Kaynak tuketim uyarisi (yanit suresi bazli)
int detect_resource_starvation(IpRecord *rec, const LogEntry *e);

// Low & Slow brute-force tespiti
int detect_low_and_slow(IpRecord *rec, time_t now);

// Beaconing (C2 bot): istek arasi stddev esik altindaysa 1 doner
int detect_beaconing(IpRecord *rec);

// Shannon entropy hesaplama (URL param icin)
double calc_shannon_entropy_pub(const char *s, size_t len);

typedef struct {
    char path[128];
    int  limit_rpm; // Requests Per Minute limit
} EndpointLimit;

extern EndpointLimit g_endpoint_limits[MAX_ENDPOINT_LIMITS];
extern int g_endpoint_limit_count;

void anomaly_add_endpoint_limit(const char *path, int limit);
int detect_endpoint_abuse(IpRecord *rec, StrView url);

// Runtime tuning (rules.conf)
void anomaly_get_thresholds(int *low_slow_req, int *brute_force_err,
                            int *ddos_rps, int *slow_resp_ms, int *sqli_score,
                            int *slow_hit_count, int *alert_cooldown_sec);

void anomaly_set_thresholds(int low_slow_req, int brute_force_err,
                            int ddos_rps, int slow_resp_ms, int sqli_score,
                            int slow_hit_count, int alert_cooldown_sec);

/* rules.conf WHITELIST_IP ile ayni liste (main.c callback) */
void anomaly_set_whitelist_fn(int (*fn)(const char *ip));
int is_whitelisted(const char *ip);

/* WAF Entegrasyonu */
int detect_waf_threat(StrView url, StrView body,
                      StrView user_agent, const char *method,
                      Alert *out_alert, const char *ip,
                      StrView host, StrView cookie);

/* Adaptive Threshold Entegrasyonu */
AdaptiveDecision anomaly_adaptive_check(IpRecord *rec, uint32_t cur_rps,
                                        double err_rate, long resp_ms);
void anomaly_adaptive_update(IpRecord *rec, uint32_t cur_rps,
                             double err_rate, long resp_ms);

/* Session Fingerprinting: User-Agent tutarlilik kontrolu */
int detect_ua_switching(IpRecord *rec, StrView user_agent);

/* WAF + adaptive konfigurasyonu rules.conf'tan yukle */
void anomaly_load_waf_config(int enabled, int ban_threshold,
                             int lfi, int ssrf, int xxe,
                             int xss, int scanner, int shellcmd);
void anomaly_load_adaptive_config(int enabled, double alpha,
                                  double warn_mult, double ban_mult,
                                  int warmup);

/* Genel skor bazli ban karari */
int anomaly_weighted_score(IpRecord *rec, const LogEntry *e);

/* ── Intelligence Motorlari ─────────────────────────────────────── */

/* JA3/JA4: XDP ring buffer'dan gelen TLS Client Hello event'ini isle */
int anomaly_process_ja3_event(const uint8_t *payload, uint16_t payload_len,
                              const char *ip_str, Alert *out_alert);

/* APT Graph: log entry'yi APT correlation motoruna gonder */
int anomaly_process_apt_graph(IpRecord *rec, const LogEntry *e,
                              Alert *out_alert);

/* Active Deception: LFI/WAF tespitinde tarpit + honey-credential */
int anomaly_trigger_deception(const char *ip, StrView url, int ipc_fd);

/* Covert Channel: tek log entry icin tum covert kanal tespiti */
int anomaly_check_covert(IpRecord *rec, const LogEntry *e, Alert *out_alert);

/* IPC fd'yi deception motoruna ilet (main.c'den cagirilir) */
void anomaly_set_ipc_fd(int fd);

/* Uprobe TLS olaylarini ozetle: buyuk data akisi exfil tespiti */
void anomaly_process_tls_plaintext(const char *ip, const uint8_t *data,
                                   uint32_t len, uint8_t direction,
                                   Alert *out_alert);

/* Yeni motorlarin istatistiklerini TUI'ya raporla */
void anomaly_intel_stats(uint64_t *ja3_total, uint64_t *ja3_c2,
                         uint64_t *apt_clusters, uint64_t *apt_detections,
                         uint64_t *covert_hits, uint64_t *honey_traps);

#endif /* ANOMALY_H */