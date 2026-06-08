#define _GNU_SOURCE
#include "logger.h"
#include <stdarg.h>
#include <stdio.h>
#include <time.h>
#include <pthread.h>
#include <string.h>
#include <stdint.h>

extern char g_tenant_id[128];

#define MAX_LOG_MESSAGES 256
#define RATE_LIMIT_SECONDS 1
#define RATE_LIMIT_BURST 3

typedef struct {
    unsigned int hash;
    time_t last_ts;
    int count;
} LogBucket;

static LogBucket g_log_buckets[MAX_LOG_MESSAGES];
static pthread_mutex_t g_log_mutex = PTHREAD_MUTEX_INITIALIZER;

/* HMAC audit key */
static unsigned char g_hmac_key[64];
static size_t        g_hmac_key_len = 0;
static pthread_mutex_t g_hmac_key_mutex = PTHREAD_MUTEX_INITIALIZER;

/* Simple string hashing algorithm */
static unsigned int simple_hash(const char *str) {
    unsigned int hash = 5381;
    int c;
    while ((c = *str++))
        hash = ((hash << 5) + hash) + c;
    return hash;
}

void log_rl_init(void) {
    /* Initialize syslog */
    openlog("loganalyzer", LOG_PID | LOG_NDELAY, LOG_DAEMON);
    
    pthread_mutex_lock(&g_log_mutex);
    memset(g_log_buckets, 0, sizeof(g_log_buckets));
    pthread_mutex_unlock(&g_log_mutex);
}

void log_rl(int priority, const char *fmt, ...) {
    time_t now = time(NULL);
    unsigned int h = simple_hash(fmt);
    int slot = h % MAX_LOG_MESSAGES;
    int allowed = 0;

    pthread_mutex_lock(&g_log_mutex);
    if (g_log_buckets[slot].hash != h) {
        g_log_buckets[slot].hash = h;
        g_log_buckets[slot].last_ts = now;
        g_log_buckets[slot].count = 1;
        allowed = 1;
    } else {
        if (now - g_log_buckets[slot].last_ts >= RATE_LIMIT_SECONDS) {
            g_log_buckets[slot].last_ts = now;
            g_log_buckets[slot].count = 1;
            allowed = 1;
        } else if (g_log_buckets[slot].count < RATE_LIMIT_BURST) {
            g_log_buckets[slot].count++;
            allowed = 1;
        }
    }
    pthread_mutex_unlock(&g_log_mutex);

    if (allowed) {
        va_list args;
        va_start(args, fmt);
        vsyslog(priority, fmt, args);
        va_end(args);
    }
}

/* Include anomaly.h inside the source to avoid circular deps in header */
#include "anomaly.h"

void log_alert_json(const void *alert_ptr, const char *filepath) {
    if (!alert_ptr || !filepath) return;
    const Alert *a = (const Alert *)alert_ptr;
    
    FILE *f = fopen(filepath, "a");
    if (!f) return;
    
    char ts_str[64];
    struct tm tm_info;
    localtime_r(&a->ts, &tm_info);
    strftime(ts_str, sizeof(ts_str), "%Y-%m-%dT%H:%M:%S%z", &tm_info);
    
    fprintf(f, "{\"tenant_id\":\"%s\",\"timestamp\":\"%s\",\"level\":%d,\"ip\":\"%s\","
               "\"incident_id\":\"%s\",\"mitre_id\":\"%s\",\"mitre_tactic\":\"%s\",\"message\":\"",
            g_tenant_id, ts_str, a->level, a->ip,
            a->incident_id[0] ? a->incident_id : "",
            a->mitre_id, a->mitre_tactic);
    for (const char *p = a->message; *p; p++) {
        if (*p == '"' || *p == '\\') fputc('\\', f);
        fputc(*p, f);
    }
    fprintf(f, "\"}\n");
    fclose(f);
}

/* ── Minimal HMAC-SHA256 (bağımsız implementasyon) ─────────────── */

#define SHA256_BLOCK  64
#define SHA256_DIGEST 32

static const uint32_t K256[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

#define RR(x,n) (((x)>>(n))|((x)<<(32-(n))))
#define CH(x,y,z) (((x)&(y))^(~(x)&(z)))
#define MAJ(x,y,z) (((x)&(y))^((x)&(z))^((y)&(z)))
#define EP0(x) (RR(x,2)^RR(x,13)^RR(x,22))
#define EP1(x) (RR(x,6)^RR(x,11)^RR(x,25))
#define SG0(x) (RR(x,7)^RR(x,18)^((x)>>3))
#define SG1(x) (RR(x,17)^RR(x,19)^((x)>>10))

typedef struct { uint8_t d[64]; uint32_t s[8]; uint64_t b; uint32_t n; } S256;

static void s256_blk(S256 *c, const uint8_t *blk) {
    uint32_t a,b,cc,d,e,f,g,h,i,t1,t2,m[64];
    for(i=0;i<16;i++) m[i]=((uint32_t)blk[i*4]<<24)|((uint32_t)blk[i*4+1]<<16)|((uint32_t)blk[i*4+2]<<8)|blk[i*4+3];
    for(;i<64;i++) m[i]=SG1(m[i-2])+m[i-7]+SG0(m[i-15])+m[i-16];
    a=c->s[0];b=c->s[1];cc=c->s[2];d=c->s[3];e=c->s[4];f=c->s[5];g=c->s[6];h=c->s[7];
    for(i=0;i<64;i++){t1=h+EP1(e)+CH(e,f,g)+K256[i]+m[i];t2=EP0(a)+MAJ(a,b,cc);h=g;g=f;f=e;e=d+t1;d=cc;cc=b;b=a;a=t1+t2;}
    c->s[0]+=a;c->s[1]+=b;c->s[2]+=cc;c->s[3]+=d;c->s[4]+=e;c->s[5]+=f;c->s[6]+=g;c->s[7]+=h;
}
static void s256_init(S256 *c){
    c->s[0]=0x6a09e667;c->s[1]=0xbb67ae85;c->s[2]=0x3c6ef372;c->s[3]=0xa54ff53a;
    c->s[4]=0x510e527f;c->s[5]=0x9b05688c;c->s[6]=0x1f83d9ab;c->s[7]=0x5be0cd19;
    c->b=0;c->n=0;
}
static void s256_upd(S256 *c,const uint8_t *d,size_t l){
    for(size_t i=0;i<l;i++){c->d[c->n++]=d[i];c->b+=8;if(c->n==64){s256_blk(c,c->d);c->n=0;}}
}
static void s256_fin(S256 *c,uint8_t o[32]){
    uint32_t n=c->n; c->d[n++]=0x80;
    if(n>56){while(n<64)c->d[n++]=0;s256_blk(c,c->d);n=0;}
    while(n<56)c->d[n++]=0;
    for(int i=0;i<8;i++) c->d[56+i]=(uint8_t)(c->b>>(56-8*i));
    s256_blk(c,c->d);
    for(int i=0;i<4;i++){o[i]=(uint8_t)(c->s[0]>>(24-i*8));o[i+4]=(uint8_t)(c->s[1]>>(24-i*8));
        o[i+8]=(uint8_t)(c->s[2]>>(24-i*8));o[i+12]=(uint8_t)(c->s[3]>>(24-i*8));
        o[i+16]=(uint8_t)(c->s[4]>>(24-i*8));o[i+20]=(uint8_t)(c->s[5]>>(24-i*8));
        o[i+24]=(uint8_t)(c->s[6]>>(24-i*8));o[i+28]=(uint8_t)(c->s[7]>>(24-i*8));}
}
static void hmac_s256(const uint8_t *key, size_t kl,
                       const uint8_t *msg, size_t ml,
                       uint8_t out[32]) {
    uint8_t ki[64]={0}, ko[64]={0}, tk[32];
    if(kl>64){S256 t;s256_init(&t);s256_upd(&t,key,kl);s256_fin(&t,tk);key=tk;kl=32;}
    memcpy(ki,key,kl); memcpy(ko,key,kl);
    for(int i=0;i<64;i++){ki[i]^=0x36;ko[i]^=0x5c;}
    uint8_t ih[32]; S256 ic,oc;
    s256_init(&ic);s256_upd(&ic,ki,64);s256_upd(&ic,msg,ml);s256_fin(&ic,ih);
    s256_init(&oc);s256_upd(&oc,ko,64);s256_upd(&oc,ih,32);s256_fin(&oc,out);
}

void log_set_hmac_key(const unsigned char *key, size_t key_len) {
    if (!key || key_len == 0 || key_len > 64) return;
    pthread_mutex_lock(&g_hmac_key_mutex);
    memcpy(g_hmac_key, key, key_len);
    g_hmac_key_len = key_len;
    pthread_mutex_unlock(&g_hmac_key_mutex);
}

void log_alert_json_signed(const void *alert_ptr, const char *filepath) {
    if (!alert_ptr || !filepath) return;
    const Alert *a = (const Alert *)alert_ptr;

    /* JSON satırını önce belleğe yaz */
    char ts_str[64];
    struct tm tm_info;
    localtime_r(&a->ts, &tm_info);
    strftime(ts_str, sizeof(ts_str), "%Y-%m-%dT%H:%M:%S%z", &tm_info);

    /* Escaped mesaj */
    char esc_msg[ALERT_MSG_LEN * 2 + 4];
    size_t ei = 0;
    for (const char *p = a->message; *p && ei + 2 < sizeof(esc_msg); p++) {
        if (*p == '"' || *p == '\\') esc_msg[ei++] = '\\';
        esc_msg[ei++] = *p;
    }
    esc_msg[ei] = '\0';

    char line[1024];
    int llen = snprintf(line, sizeof(line),
        "{\"tenant_id\":\"%s\",\"timestamp\":\"%s\",\"level\":%d,\"ip\":\"%s\","
        "\"incident_id\":\"%s\",\"mitre_id\":\"%s\",\"mitre_tactic\":\"%s\","
        "\"message\":\"%s\"",
        g_tenant_id, ts_str, a->level, a->ip,
        a->incident_id[0] ? a->incident_id : "",
        a->mitre_id, a->mitre_tactic, esc_msg);
    if (llen < 0 || llen >= (int)sizeof(line)) llen = (int)sizeof(line) - 1;

    /* HMAC hesapla */
    pthread_mutex_lock(&g_hmac_key_mutex);
    size_t kl = g_hmac_key_len;
    uint8_t key_copy[64];
    if (kl > 0) memcpy(key_copy, g_hmac_key, kl);
    pthread_mutex_unlock(&g_hmac_key_mutex);

    FILE *f = fopen(filepath, "a");
    if (!f) return;

    if (kl > 0) {
        uint8_t mac[32];
        hmac_s256(key_copy, kl, (const uint8_t *)line, (size_t)llen, mac);
        static const char hx[] = "0123456789abcdef";
        char mac_hex[65];
        for (int i = 0; i < 32; i++) {
            mac_hex[i*2]   = hx[mac[i] >> 4];
            mac_hex[i*2+1] = hx[mac[i] & 0xf];
        }
        mac_hex[64] = '\0';
        fprintf(f, "%s,\"hmac\":\"%s\"}\n", line, mac_hex);
    } else {
        fprintf(f, "%s}\n", line);
    }
    fclose(f);
}

void log_alert_cef(const void *alert_ptr, const char *filepath) {
    if (!alert_ptr || !filepath) return;
    const Alert *a = (const Alert *)alert_ptr;

    /* CEF Formatı: CEF:Version|Device Vendor|Device Product|Device Version|Device Event Class ID|Name|Severity|Extension */
    FILE *f = fopen(filepath, "a");
    if (!f) return;

    char ts_str[64];
    struct tm tm_info;
    localtime_r(&a->ts, &tm_info);
    strftime(ts_str, sizeof(ts_str), "%b %d %H:%M:%S", &tm_info);

    int cef_severity = a->level * 2; /* 1-5 to 1-10 scale for CEF */

    /* Escaped mesaj */
    char esc_msg[ALERT_MSG_LEN * 2 + 4];
    size_t ei = 0;
    for (const char *p = a->message; *p && ei + 2 < sizeof(esc_msg); p++) {
        if (*p == '|' || *p == '\\' || *p == '\n') esc_msg[ei++] = '\\';
        esc_msg[ei++] = *p;
    }
    esc_msg[ei] = '\0';

    fprintf(f, "%s CEF:0|LogGuardian|LogAnalyzer|1.0|%s|%s|%d|src=%s msg=%s act=alert\n",
            ts_str, 
            a->mitre_id[0] != '\0' ? a->mitre_id : "LG_ALERT",
            a->mitre_tactic[0] != '\0' ? a->mitre_tactic : "General",
            cef_severity,
            a->ip,
            esc_msg);
    fclose(f);
}
