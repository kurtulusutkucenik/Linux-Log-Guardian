/* ja3_engine.c — JA3/JA4 TLS Fingerprinting + C2 Veritabanı */
#include "ja3_engine.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdatomic.h>
#include <openssl/sha.h>

static void sort_u16(uint16_t *arr, int len) {
    for (int i = 0; i < len - 1; i++) {
        for (int j = 0; j < len - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                uint16_t tmp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = tmp;
            }
        }
    }
}

static void sha256_hex_12(const char *in, size_t len, char out[13]) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char *)in, len, hash);
    static const char hex[] = "0123456789abcdef";
    for (int i = 0; i < 6; i++) {
        out[i * 2]     = hex[hash[i] >> 4];
        out[i * 2 + 1] = hex[hash[i] & 0x0f];
    }
    out[12] = '\0';
}

/* ── İstatistik sayaçları ───────────────────────────────────────── */
static _Atomic uint64_t g_total_fp  = 0;
static _Atomic uint64_t g_c2_hits   = 0;

/* ── GREASE değerleri (RFC 8701) — JA3 hesabında çıkarılır ──────── */
static int is_grease(uint16_t v) {
    return ((v & 0x0f0f) == 0x0a0a) && ((v >> 8) == (v & 0xff));
}

/* ── Bilinen C2 JA3 imza veritabanı ─────────────────────────────── */
static const Ja3Signature JA3_C2_DB[] = {
    /* Cobalt Strike */
    {"72a7c13523d8d3f56e4bd4b0f3536af4", "Cobalt Strike (default)",        99},
    {"b386946a5a44d1ddcc843bc75336dfce", "Cobalt Strike (malleable C2)",    95},
    {"0d85b8d7ba5f5e4c1285b29d1d73b7c5", "Cobalt Strike (v4 profile)",      90},
    /* Metasploit */
    {"c35e4b7e60a65d84e2e3a7b0c6f81a4d", "Metasploit Meterpreter",          98},
    {"de350869b8c85de67a350c8d186f11e6", "Metasploit (Ruby SSL)",            85},
    /* Sliver C2 */
    {"51c64c77e60f3980eea90869b68c58a8", "Sliver C2",                       97},
    {"5fd5f04d4c9e2f82e01d44d14c8e0f4d", "Sliver C2 (mTLS)",               92},
    /* Havoc C2 */
    {"a0e9f5d9b3c8f7e2a1d6b4c5e8f9a2b1", "Havoc C2",                       94},
    /* Brute Ratel */
    {"e7d705a3286e19ea42f587b344ee6865", "Brute Ratel C4",                  96},
    /* Mythic C2 */
    {"fc5e396555b2b00e4e6ea5bdf13438ef", "Mythic C2 (Poseidon agent)",      88},
    /* Deimos C2 */
    {"1aa7bf75b46cce15d34c72c49cb36781", "Deimos C2",                       82},
    /* Empire */
    {"3b5074b1b5d032e5620f69f9159c1f7a", "PowerShell Empire",               90},
    /* Covenant */
    {"64371c14b6aa99957c78f5f3a6e2a3c1", "Covenant C2",                     87},
    /* Msfvenom reverse shells */
    {"4e71f4f6f81b32f3d8a0c9b8e4c7d9a2", "Msfvenom Reverse Shell",          80},
    /* curl (eski, zayıf TLS yapılandırması) */
    {"35bf68f6974dff66e4b73d0de60f9b33", "curl (weak TLS config)",          60},
    /* Nmap TLS scan */
    {"308b1bf5e28a7b4a4b0c9f1c2d4e8a3b", "Nmap SSL scanner",               75},
    /* Python requests kütüphanesi (zayıf) */
    {"6734f37431670b3ab4292b8f60f29984", "Python-requests (no SNI)",        55},
    /* Go net/http default */
    {"791c10de1f4a3e9c7b12ec62f5c0bcaf", "Go net/http (default)",           50},
};
#define JA3_DB_SIZE ((int)(sizeof(JA3_C2_DB)/sizeof(JA3_C2_DB[0])))

/* ── Custom (Dinamik) JA3 imza veritabanı ───────────────────────── */
#define MAX_CUSTOM_SIGS 64
static Ja3Signature g_custom_sigs[MAX_CUSTOM_SIGS];
static int g_custom_sig_count = 0;

void ja3_load_custom_sig(const char *hash, const char *tool, int confidence) {
    if (!hash || !tool || strlen(hash) != 32) return;

    /* Mevcut imzayı güncelle (hot-reload bellek sızıntısı önlemi) */
    for (int i = 0; i < g_custom_sig_count; i++) {
        if (g_custom_sigs[i].ja3_hash &&
            strcmp(g_custom_sigs[i].ja3_hash, hash) == 0) {
            free((void *)g_custom_sigs[i].tool_name);
            g_custom_sigs[i].tool_name  = strdup(tool);
            g_custom_sigs[i].confidence = confidence;
            return; /* güncellendi, yeni kayıt açma */
        }
    }

    if (g_custom_sig_count >= MAX_CUSTOM_SIGS) return;

    Ja3Signature *sig = &g_custom_sigs[g_custom_sig_count++];
    sig->ja3_hash   = strdup(hash);
    sig->tool_name  = strdup(tool);
    sig->confidence = confidence;
}

/* Tüm custom imzaları serbest bırak (hot-reload öncesi çağrılır) */
void ja3_clear_custom_sigs(void) {
    for (int i = 0; i < g_custom_sig_count; i++) {
        free((void *)g_custom_sigs[i].ja3_hash);
        free((void *)g_custom_sigs[i].tool_name);
        g_custom_sigs[i].ja3_hash  = NULL;
        g_custom_sigs[i].tool_name = NULL;
    }
    g_custom_sig_count = 0;
}



/* ── MD5 implementasyonu (bağımlılık gerektirmez) ───────────────── */
typedef struct { uint8_t d[64]; uint32_t s[4]; uint64_t bits; uint32_t n; } Md5Ctx;

#define MD5_F(x,y,z) ((x&y)|(~x&z))
#define MD5_G(x,y,z) ((x&z)|(y&~z))
#define MD5_H(x,y,z) (x^y^z)
#define MD5_I(x,y,z) (y^(x|~z))
#define MD5_ROL(x,n) (((x)<<(n))|((x)>>(32-(n))))
#define MD5_STEP(f,a,b,c,d,x,t,s) a=b+MD5_ROL(a+f(b,c,d)+x+t,s)

static const uint32_t MD5_K[64]={
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
};
static const uint8_t MD5_S[64]={
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5, 9,14,20,5, 9,14,20,5, 9,14,20,5, 9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21
};

static void md5_transform(Md5Ctx *c, const uint8_t *blk) {
    uint32_t a=c->s[0],b=c->s[1],cc=c->s[2],d=c->s[3],m[16];
    for(int i=0;i<16;i++){
        int j=i*4;
        m[i]=(uint32_t)blk[j]|((uint32_t)blk[j+1]<<8)|
             ((uint32_t)blk[j+2]<<16)|((uint32_t)blk[j+3]<<24);
    }
    for(int i=0;i<64;i++){
        uint32_t f,g;
        if(i<16){f=MD5_F(b,cc,d);g=(uint32_t)i;}
        else if(i<32){f=MD5_G(b,cc,d);g=(5u*(uint32_t)i+1)%16;}
        else if(i<48){f=MD5_H(b,cc,d);g=(3u*(uint32_t)i+5)%16;}
        else{f=MD5_I(b,cc,d);g=(7u*(uint32_t)i)%16;}
        uint32_t t=d; d=cc; cc=b;
        b=b+MD5_ROL(a+f+MD5_K[i]+m[g],MD5_S[i]);
        a=t;
    }
    c->s[0]+=a; c->s[1]+=b; c->s[2]+=cc; c->s[3]+=d;
}
static void md5_init(Md5Ctx *c){
    c->s[0]=0x67452301; c->s[1]=0xefcdab89;
    c->s[2]=0x98badcfe; c->s[3]=0x10325476;
    c->bits=0; c->n=0;
}
static void md5_update(Md5Ctx *c, const uint8_t *d, size_t len){
    for(size_t i=0;i<len;i++){
        c->d[c->n++]=d[i];
        c->bits+=8;
        if(c->n==64){md5_transform(c,c->d);c->n=0;}
    }
}
static void md5_final(Md5Ctx *c, uint8_t out[16]){
    uint32_t n=c->n;
    c->d[n++]=0x80;
    if(n>56){while(n<64)c->d[n++]=0;md5_transform(c,c->d);n=0;}
    while(n<56)c->d[n++]=0;
    for(int i=0;i<8;i++) c->d[56+i]=(uint8_t)(c->bits>>(8*i));
    md5_transform(c,c->d);
    for(int i=0;i<4;i++){
        out[i*4]  =(uint8_t)(c->s[i]);
        out[i*4+1]=(uint8_t)(c->s[i]>>8);
        out[i*4+2]=(uint8_t)(c->s[i]>>16);
        out[i*4+3]=(uint8_t)(c->s[i]>>24);
    }
}
static void md5_hex(const char *in, size_t in_len, char out[33]){
    static const char h[]="0123456789abcdef";
    Md5Ctx c; md5_init(&c);
    md5_update(&c,(const uint8_t*)in,in_len);
    uint8_t raw[16]; md5_final(&c,raw);
    for(int i=0;i<16;i++){out[i*2]=h[raw[i]>>4];out[i*2+1]=h[raw[i]&0xf];}
    out[32]='\0';
}

/* ── TLS Client Hello ayrıştırıcısı ─────────────────────────────── */
/*
 * TLS Record: 0x16 0x03 0x?? <len16> <Handshake>
 * Handshake:  0x01 <len24> <ClientHello>
 * ClientHello: version(2) random(32) session_id(1+N)
 *              cipher_suites(2+N) compression(1+N) extensions(2+N)
 */
int ja3_parse_client_hello(const uint8_t *d, uint16_t dlen, Ja3Result *out) {
    if (!d || !out || dlen < 43) return -1;
    memset(out, 0, sizeof(*out));

    /* TLS Record layer */
    if (d[0] != 0x16) return -1;           /* Content-Type: Handshake */
    /* d[1..2]: legacy record version (skip) */
    uint16_t rec_len = (uint16_t)((d[3]<<8)|d[4]);
    if (rec_len + 5 > dlen) return -1;

    /* Handshake header */
    const uint8_t *hs = d + 5;
    if (hs[0] != 0x01) return -1;          /* HandshakeType: ClientHello */
    uint32_t hs_len = ((uint32_t)hs[1]<<16)|((uint32_t)hs[2]<<8)|hs[3];
    if (hs_len + 4 > rec_len) return -1;

    const uint8_t *p   = hs + 4;           /* ClientHello başlangıcı */
    const uint8_t *end = hs + 4 + hs_len;

    /* TLS Version */
    if (p + 2 > end) return -1;
    out->parsed.tls_version = (uint16_t)((p[0]<<8)|p[1]);
    p += 2;

    /* Random (32 byte) */
    if (p + 32 > end) return -1;
    p += 32;

    /* Session ID */
    if (p + 1 > end) return -1;
    uint8_t sid_len = *p++;
    if (p + sid_len > end) return -1;
    p += sid_len;

    /* Cipher Suites */
    if (p + 2 > end) return -1;
    uint16_t cs_len = (uint16_t)((p[0]<<8)|p[1]); p += 2;
    if (p + cs_len > end) return -1;
    for (uint16_t i = 0; i < cs_len/2 && out->parsed.cipher_count < JA3_MAX_CIPHERS; i++) {
        uint16_t cs = (uint16_t)((p[i*2]<<8)|p[i*2+1]);
        if (!is_grease(cs)) out->parsed.ciphers[out->parsed.cipher_count++] = cs;
    }
    p += cs_len;

    /* Compression Methods */
    if (p + 1 > end) return -1;
    uint8_t cm_len = *p++;
    if (p + cm_len > end) return -1;
    p += cm_len;

    /* Extensions */
    if (p + 2 > end) goto build_hash;
    uint16_t ext_total = (uint16_t)((p[0]<<8)|p[1]); p += 2;
    const uint8_t *ext_end = p + ext_total;
    if (ext_end > end) ext_end = end;

    while (p + 4 <= ext_end) {
        uint16_t etype = (uint16_t)((p[0]<<8)|p[1]);
        uint16_t elen  = (uint16_t)((p[2]<<8)|p[3]);
        p += 4;
        if (p + elen > ext_end) break;

        if (!is_grease(etype) && out->parsed.ext_count < JA3_MAX_EXTS)
            out->parsed.extensions[out->parsed.ext_count++] = etype;

        /* SNI (type=0) */
        if (etype == 0x0000 && elen > 5) {
            uint16_t sni_len = (uint16_t)((p[3]<<8)|p[4]);
            if (sni_len < sizeof(out->parsed.sni) && p+5+sni_len <= ext_end) {
                memcpy(out->parsed.sni, p+5, sni_len);
                out->parsed.sni[sni_len] = '\0';
                out->parsed.has_sni = 1;
            }
        }
        /* Supported Groups / Elliptic Curves (type=0x000a) */
        else if (etype == 0x000a && elen >= 2) {
            uint16_t gl = (uint16_t)((p[0]<<8)|p[1]);
            for (uint16_t i=0; i<gl/2 && out->parsed.curve_count<JA3_MAX_EXTS; i++){
                uint16_t cv=(uint16_t)((p[2+i*2]<<8)|p[3+i*2]);
                if(!is_grease(cv)) out->parsed.elliptic_curves[out->parsed.curve_count++]=cv;
            }
        }
        /* EC Point Formats (type=0x000b) */
        else if (etype == 0x000b && elen >= 1) {
            uint8_t pfl = p[0];
            for (uint8_t i=0; i<pfl && out->parsed.ec_pf_count<16 && 1+i<elen; i++)
                out->parsed.ec_point_formats[out->parsed.ec_pf_count++] = p[1+i];
        }
        /* ALPN (type=0x0010) */
        else if (etype == 0x0010 && elen >= 4) {
            uint16_t al = (uint16_t)((p[2]<<8)|p[3]);
            if (al < sizeof(out->parsed.alpn)-1 && p+4+al <= ext_end){
                memcpy(out->parsed.alpn, p+4, al);
                out->parsed.alpn[al] = '\0';
            }
        }
        p += elen;
    }

build_hash:;
    /* JA3 string oluştur */
    char ja3_str[2048];
    int  pos = 0;

    /* Version */
    pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos, "%u,", out->parsed.tls_version);

    /* Ciphers (tire ile ayrılmış) */
    for (int i=0; i<out->parsed.cipher_count; i++)
        pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos,
                        i?"-":"" "%u", out->parsed.ciphers[i]);
    pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos, ",");

    /* Extensions */
    for (int i=0; i<out->parsed.ext_count; i++)
        pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos,
                        i?"-":"" "%u", out->parsed.extensions[i]);
    pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos, ",");

    /* Elliptic Curves */
    for (int i=0; i<out->parsed.curve_count; i++)
        pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos,
                        i?"-":"" "%u", out->parsed.elliptic_curves[i]);
    pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos, ",");

    /* EC Point Formats */
    for (int i=0; i<out->parsed.ec_pf_count; i++)
        pos += snprintf(ja3_str+pos, sizeof(ja3_str)-pos,
                        i?"-":"" "%u", out->parsed.ec_point_formats[i]);

    md5_hex(ja3_str, (size_t)pos, out->ja3_hash);

    /* --- Resmi JA4 Hesaplama A_B_C --- */
    /* JA4_A: {proto}{ver}{sni}{ciphers}{extensions}{alpn} */
    char ja4_a[16];
    const char *ver_str = (out->parsed.tls_version == 0x0304) ? "13" :
                          (out->parsed.tls_version == 0x0303) ? "12" :
                          (out->parsed.tls_version == 0x0302) ? "11" :
                          (out->parsed.tls_version == 0x0301) ? "10" : "00";
    
    char alpn_code[3] = "00";
    if (out->parsed.alpn[0]) {
        int alpn_len = strlen(out->parsed.alpn);
        alpn_code[0] = out->parsed.alpn[0];
        alpn_code[1] = out->parsed.alpn[alpn_len - 1];
        alpn_code[2] = '\0';
    }

    snprintf(ja4_a, sizeof(ja4_a), "t%s%c%02d%02d%s",
             ver_str,
             out->parsed.has_sni ? 's' : 'n',
             out->parsed.cipher_count > 99 ? 99 : out->parsed.cipher_count,
             out->parsed.ext_count > 99 ? 99 : out->parsed.ext_count,
             alpn_code);

    /* JA4_B: Sıralanmış ve SHA256 ile hashlenmiş cipher listesi */
    uint16_t ciphers_sorted[JA3_MAX_CIPHERS];
    memcpy(ciphers_sorted, out->parsed.ciphers, out->parsed.cipher_count * sizeof(uint16_t));
    sort_u16(ciphers_sorted, out->parsed.cipher_count);

    char ciphers_str[1024] = "";
    int ciphers_pos = 0;
    for (int i = 0; i < out->parsed.cipher_count; i++) {
        ciphers_pos += snprintf(ciphers_str + ciphers_pos, sizeof(ciphers_str) - ciphers_pos,
                                i ? ",%04x" : "%04x", ciphers_sorted[i]);
    }

    char ja4_b[13] = "000000000000";
    if (out->parsed.cipher_count > 0) {
        sha256_hex_12(ciphers_str, ciphers_pos, ja4_b);
    }

    /* JA4_C: Sıralanmış ve SHA256 ile hashlenmiş extension listesi */
    uint16_t exts_sorted[JA3_MAX_EXTS];
    memcpy(exts_sorted, out->parsed.extensions, out->parsed.ext_count * sizeof(uint16_t));
    sort_u16(exts_sorted, out->parsed.ext_count);

    char exts_str[1024] = "";
    int exts_pos = 0;
    for (int i = 0; i < out->parsed.ext_count; i++) {
        exts_pos += snprintf(exts_str + exts_pos, sizeof(exts_str) - exts_pos,
                             i ? ",%04x" : "%04x", exts_sorted[i]);
    }

    char ja4_c[13] = "000000000000";
    if (out->parsed.ext_count > 0) {
        sha256_hex_12(exts_str, exts_pos, ja4_c);
    }

    /* Tam JA4 Hash formatı: JA4_A_B_C */
    snprintf(out->ja4_hash, sizeof(out->ja4_hash), "%s_%s_%s", ja4_a, ja4_b, ja4_c);

    /* C2 veritabanında ara */
    ja3_lookup_c2(out->ja3_hash, out->c2_tool, sizeof(out->c2_tool));

    atomic_fetch_add(&g_total_fp, 1);
    if (out->c2_tool[0]) atomic_fetch_add(&g_c2_hits, 1);
    return 0;
}

int ja3_lookup_c2(const char *hash, char *tool_out, size_t tool_len) {
    if (!hash || !tool_out) return 0;
    tool_out[0] = '\0';
    
    /* Önce custom (kullanıcı tanımlı) imzalarda ara */
    for (int i = 0; i < g_custom_sig_count; i++) {
        if (strcmp(g_custom_sigs[i].ja3_hash, hash) == 0) {
            size_t n = strlen(g_custom_sigs[i].tool_name);
            if (n >= tool_len) n = tool_len - 1;
            memcpy(tool_out, g_custom_sigs[i].tool_name, n);
            tool_out[n] = '\0';
            return g_custom_sigs[i].confidence;
        }
    }

    for (int i = 0; i < JA3_DB_SIZE; i++) {
        if (strcmp(JA3_C2_DB[i].ja3_hash, hash) == 0) {
            size_t n = strlen(JA3_C2_DB[i].tool_name);
            if (n >= tool_len) n = tool_len - 1;
            memcpy(tool_out, JA3_C2_DB[i].tool_name, n);
            tool_out[n] = '\0';
            return JA3_C2_DB[i].confidence;
        }
    }
    return 0;
}

void ja3_get_stats(uint64_t *total, uint64_t *c2_hits) {
    if (total)   *total   = atomic_load(&g_total_fp);
    if (c2_hits) *c2_hits = atomic_load(&g_c2_hits);
}

void ja3_dump_db(void) {
    fprintf(stderr, "[JA3-DB] %d bilinen C2 imzasi:\n", JA3_DB_SIZE);
    for (int i = 0; i < JA3_DB_SIZE; i++)
        fprintf(stderr, "  %s  →  %s (%d%%)\n",
                JA3_C2_DB[i].ja3_hash,
                JA3_C2_DB[i].tool_name,
                JA3_C2_DB[i].confidence);
}
