/* deception.c — Active Cyber Deception Engine */
#include "deception.h"
#include "daemon_ipc.h"
#include "ipc_auth.h"
#include "tarpit_server.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <stdatomic.h>
#include <pthread.h>
#include <sys/socket.h>
#include <sys/un.h>

/* ── Honey-credential içerikleri ────────────────────────────────── */
/* Bu bilgiler gerçek gibi görünür ama izlenir.
 * "honeyadmin" kullanıcısı başka bir sistemde denenirse yakalanır. */
const char HONEY_PASSWD_CONTENT[] =
    "root:x:0:0:root:/root:/bin/bash\n"
    "daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n"
    "bin:x:2:2:bin:/bin:/usr/sbin/nologin\n"
    "sys:x:3:3:sys:/dev:/usr/sbin/nologin\n"
    "www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n"
    "honeyadmin:x:1337:1337:Honey Admin:/home/honeyadmin:/bin/bash\n"
    "svcaccount:x:1338:1338:Service Account:/home/svcaccount:/bin/sh\n";

const char HONEY_SHADOW_CONTENT[] =
    "root:!:19000:0:99999:7:::\n"
    "honeyadmin:$6$HoneyTrap$x3Kp9mN2vQ8wL5rJ7tYuI0sE4hFgDaZb"
    "CwXnOiMlKjH1yGpVdRqTsU6fBe.:19000:0:99999:7:::\n"
    "svcaccount:$6$SvcTrap42$mQ7rL9kN3vP5wJ8tYxI2sE1hFbDaZc"
    "CvXmOiLlJjG4yHpUdQqSsT7fAe.:19000:0:99999:7:::\n";

const char HONEY_ENV_CONTENT[] =
    "APP_ENV=production\n"
    "DB_HOST=localhost\n"
    "DB_PORT=5432\n"
    "DB_USER=honeysvc\n"
    "DB_PASSWORD=H0n3yTr4p!Secret#2024\n"
    "API_KEY=sk-honey-abcd1234efgh5678ijkl9012mnop3456\n"
    "AWS_ACCESS_KEY_ID=AKIAHONEY1234TRAP5678\n"
    "AWS_SECRET_ACCESS_KEY=HoneySecretKey+abcDEF123456789GHIjkl\n"
    "JWT_SECRET=honey_jwt_secret_do_not_use_in_prod\n";

/* ── Durum tablosu ───────────────────────────────────────────────── */
static DeceptionRecord  g_records[DECEPTION_MAX_RECORDS];
static HoneyToken       g_tokens[DECEPTION_MAX_TOKENS];
static int              g_token_count = 0;
static pthread_mutex_t  g_dec_mutex   = PTHREAD_MUTEX_INITIALIZER;

static _Atomic uint64_t g_lfi_traps   = 0;
static _Atomic uint64_t g_c2_traps    = 0;
static _Atomic uint64_t g_honey_cnt   = 0;

/* ── FNV-1a IP hash ──────────────────────────────────────────────── */
static uint32_t ip_hash(const char *ip) {
    uint32_t h = 2166136261u;
    for (const char *p = ip; *p; p++) { h ^= (uint8_t)*p; h *= 16777619u; }
    return h & (DECEPTION_MAX_RECORDS - 1);
}

/* ── Kayıt bul veya oluştur ──────────────────────────────────────── */
static DeceptionRecord *get_record(const char *ip) {
    uint32_t idx = ip_hash(ip);
    /* Open-addressing ile çakışma çözümü */
    for (int i = 0; i < 16; i++) {
        uint32_t slot = (idx + (uint32_t)i) & (DECEPTION_MAX_RECORDS - 1);
        DeceptionRecord *r = &g_records[slot];
        if (r->ip[0] == '\0') {
            /* Boş slot — yeni kayıt */
            size_t n = strlen(ip);
            if (n >= sizeof(r->ip)) n = sizeof(r->ip) - 1;
            memcpy(r->ip, ip, n);
            r->ip[n]       = '\0';
            r->tarpit_prob = 0;
            r->first_encounter = time(NULL);
            return r;
        }
        if (strcmp(r->ip, ip) == 0) return r;
    }
    /* Tablo dolu — slot 0'ı zorla (en kötü durum) */
    return &g_records[idx];
}

/* ── IPC üzerinden tarpit güncelle ──────────────────────────────── */
static void send_tarpit_ipc(const char *ip, uint8_t prob, int ipc_fd) {
    if (ipc_fd < 0) return;
    IpcMessage msg;
    memset(&msg, 0, sizeof(msg));
    msg.cmd  = strchr(ip, ':') ? IPC_CMD_TARPIT_V6 : IPC_CMD_TARPIT_V4;
    msg.prob = prob;
    size_t n = strlen(ip);
    if (n >= sizeof(msg.ip)) n = sizeof(msg.ip) - 1;
    memcpy(msg.ip, ip, n);
    msg.ip[n] = '\0';
    msg.prefix = 32;
    daemon_ipc_fill_auth(&msg);
    IpcResponse resp;
    send(ipc_fd, &msg, sizeof(msg), MSG_NOSIGNAL);
    recv(ipc_fd, &resp, sizeof(resp), 0);
}

/* ── Honey-token kayıt ───────────────────────────────────────────── */
static void plant_token(const char *ip, const char *token, const char *ctx) {
    if (g_token_count >= DECEPTION_MAX_TOKENS) return;
    HoneyToken *t = &g_tokens[g_token_count++];
    memset(t, 0, sizeof(*t));
    size_t tn = strlen(token); if (tn >= sizeof(t->token)) tn = sizeof(t->token)-1;
    size_t cn = strlen(ctx);   if (cn >= sizeof(t->context)) cn = sizeof(t->context)-1;
    size_t in = strlen(ip);    if (in >= sizeof(t->ip)) in = sizeof(t->ip)-1;
    memcpy(t->token,   token, tn); t->token[tn]   = '\0';
    memcpy(t->context, ctx,   cn); t->context[cn] = '\0';
    memcpy(t->ip,      ip,    in); t->ip[in]      = '\0';
    t->planted_ts = time(NULL);
    atomic_fetch_add(&g_honey_cnt, 1);
}

/* ── Kademeli tarpit olasılığı ───────────────────────────────────── */
static uint8_t escalate_tarpit(uint8_t current, uint8_t attempts) {
    /* 1. deneme: 10%, 2: 30%, 3: 60%, 4+: 90% */
    static const uint8_t levels[] = {10, 30, 60, 90};
    int idx = attempts - 1;
    if (idx < 0) idx = 0;
    if (idx >= 4) idx = 3;
    uint8_t next = levels[idx];
    return next > current ? next : current;
}

/* ── Public API ──────────────────────────────────────────────────── */
void deception_init(void) {
    pthread_mutex_lock(&g_dec_mutex);
    memset(g_records, 0, sizeof(g_records));
    memset(g_tokens,  0, sizeof(g_tokens));
    g_token_count = 0;
    pthread_mutex_unlock(&g_dec_mutex);
}

int deception_trigger_lfi(const char *ip, StrView url, int ipc_fd) {
    if (!ip) return 0;
    pthread_mutex_lock(&g_dec_mutex);

    DeceptionRecord *r = get_record(ip);
    r->lfi_attempts++;
    r->last_encounter = time(NULL);
    r->tarpit_prob = escalate_tarpit(r->tarpit_prob, r->lfi_attempts);

    /* Tarpit güncelle */
    uint8_t prob = r->tarpit_prob;
    pthread_mutex_unlock(&g_dec_mutex);

    send_tarpit_ipc(ip, prob, ipc_fd);
    /* AF_XDP tarpit yönlendirmesi: prob > 60 ise fiziksel port yönlendirmesi */
    if (prob > 60)
        tarpit_server_redirect(ip, 32);
    atomic_fetch_add(&g_lfi_traps, 1);

    /* URL'ye göre hangi tuzak içeriği sunulacak */
    int honey_type = 0;
    if (url.ptr) {
        if (url.len > 0 && (
            (url.len >= 6  && memcmp(url.ptr + url.len - 6,  "passwd", 6) == 0) ||
            (url.len >= 7  && memcmp(url.ptr + url.len - 7,  "shadow", 6) == 0) ||
            (url.len >= 8  && memcmp(url.ptr + url.len - 8, "/etc/passwd", 7) == 0)
        )) honey_type = 1;   /* passwd */
        else if (url.len >= 4 && memcmp(url.ptr + url.len - 4, ".env", 4) == 0)
            honey_type = 2;  /* .env */
    }

    /* İlk kez honey sunuluyorsa token'ları kaydet */
    pthread_mutex_lock(&g_dec_mutex);
    DeceptionRecord *r2 = get_record(ip);
    if (!r2->honey_served) {
        r2->honey_served = 1;
        if (honey_type == 1) {
            plant_token(ip, "honeyadmin",   "fake_passwd_user");
            plant_token(ip, "svcaccount",  "fake_passwd_user2");
        } else if (honey_type == 2) {
            plant_token(ip, "sk-honey-abcd1234efgh5678ijkl9012mnop3456",
                        "fake_api_key");
            plant_token(ip, "AKIAHONEY1234TRAP5678", "fake_aws_key");
        }
        fprintf(stderr,
            "[DECEPTION] IP=%s Tarpit=%u%% LFI=%u HoneyType=%d TUZAK AKTİF\n",
            ip, prob, r2->lfi_attempts, honey_type);
    }
    pthread_mutex_unlock(&g_dec_mutex);

    return honey_type;
}

int deception_trigger_c2_tool(const char *ip, const char *tool_name,
                               int ipc_fd) {
    if (!ip || !tool_name) return 0;
    pthread_mutex_lock(&g_dec_mutex);
    DeceptionRecord *r = get_record(ip);
    r->c2_encounters++;
    r->last_encounter = time(NULL);
    /* C2 tespitinde tarpit'i yüksek başlat */
    if (r->tarpit_prob < 60) r->tarpit_prob = 60;
    uint8_t prob = r->tarpit_prob;
    pthread_mutex_unlock(&g_dec_mutex);

    send_tarpit_ipc(ip, prob, ipc_fd);
    /* C2 aracı tespiti: doğrudan AF_XDP tarpit havuzuna al */
    tarpit_server_redirect(ip, 32);
    atomic_fetch_add(&g_c2_traps, 1);

    fprintf(stderr,
        "[DECEPTION] C2 ARACI TESPIT: IP=%s Tool=%s Tarpit=%u%%\n",
        ip, tool_name, prob);
    return 1;
}

uint8_t deception_get_tarpit_prob(const char *ip) {
    if (!ip) return 0;
    pthread_mutex_lock(&g_dec_mutex);
    uint32_t idx = ip_hash(ip);
    uint8_t prob = 0;
    for (int i = 0; i < 16; i++) {
        uint32_t slot = (idx + (uint32_t)i) & (DECEPTION_MAX_RECORDS - 1);
        if (strcmp(g_records[slot].ip, ip) == 0) {
            prob = g_records[slot].tarpit_prob;
            break;
        }
    }
    pthread_mutex_unlock(&g_dec_mutex);
    return prob;
}

void deception_dump_tokens(void) {
    pthread_mutex_lock(&g_dec_mutex);
    fprintf(stderr, "[DECEPTION] %d honey-token kayitli:\n", g_token_count);
    for (int i = 0; i < g_token_count; i++) {
        fprintf(stderr, "  [%d] IP=%-18s Ctx=%-20s Token=%s\n",
                i, g_tokens[i].ip, g_tokens[i].context, g_tokens[i].token);
    }
    pthread_mutex_unlock(&g_dec_mutex);
}

void deception_get_stats(uint64_t *lfi_traps, uint64_t *c2_traps,
                         uint64_t *honey_served) {
    if (lfi_traps)   *lfi_traps   = atomic_load(&g_lfi_traps);
    if (c2_traps)    *c2_traps    = atomic_load(&g_c2_traps);
    if (honey_served)*honey_served = atomic_load(&g_honey_cnt);
}
