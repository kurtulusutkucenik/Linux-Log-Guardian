/* ja3_engine.h — JA3/JA4 TLS Fingerprinting Engine
 *
 * Saldırganlar User-Agent'ı taklit edebilir; ancak TLS Client Hello
 * sırasındaki şifreleme algoritması sırası neredeyse taklit edilemez.
 *
 * JA3: MD5(Version,Ciphers,Extensions,EllipticCurves,PointFormats)
 * JA4: tls_{ver}_{sni}_{ciphers_n}_{ext_n}_{alpn}_{hash[:12]}
 *
 * Bilinen C2 araçları (Cobalt Strike, Metasploit, Sliver, Havoc…)
 * imzaları statik veritabanından anında karşılaştırılır.
 */
#ifndef JA3_ENGINE_H
#define JA3_ENGINE_H

#include <stdint.h>
#include <stddef.h>

#define JA3_HASH_LEN    33   /* MD5 hex + null */
#define JA4_HASH_LEN    64   /* JA4 string + null */
#define JA3_TOOL_LEN    64   /* C2 araç adı */
#define JA3_MAX_CIPHERS 64
#define JA3_MAX_EXTS    32

/* Parsed TLS Client Hello içeriği */
typedef struct {
    uint16_t tls_version;
    uint16_t ciphers[JA3_MAX_CIPHERS];
    uint8_t  cipher_count;
    uint16_t extensions[JA3_MAX_EXTS];
    uint8_t  ext_count;
    uint16_t elliptic_curves[JA3_MAX_EXTS];
    uint8_t  curve_count;
    uint8_t  ec_point_formats[16];
    uint8_t  ec_pf_count;
    uint8_t  has_sni;                    /* Server Name Indication var mı */
    char     sni[256];                   /* SNI domain */
    char     alpn[32];                   /* ALPN (h2, http/1.1, vs.) */
} Ja3Parsed;

/* JA3 fingerprint sonucu */
typedef struct {
    char     ja3_hash[JA3_HASH_LEN];     /* MD5 hex */
    char     ja4_hash[JA4_HASH_LEN];     /* JA4 string */
    char     c2_tool[JA3_TOOL_LEN];      /* Eşleşen C2 aracı adı ("" = yok) */
    int      c2_confidence;              /* 0-100 güven skoru */
    Ja3Parsed parsed;
} Ja3Result;

/* Bilinen C2 imzası */
typedef struct {
    const char *ja3_hash;
    const char *tool_name;
    int         confidence;
} Ja3Signature;

/* ── API ──────────────────────────────────────────────────────────── */

/*
 * ja3_parse_client_hello:
 *   XDP ring buffer'dan gelen raw TLS Client Hello baytlarını parse eder.
 *   data: TLS record başından (0x16 0x03 …) itibaren.
 *   Başarıyla parse edilirse 0, hata varsa -1 döner.
 */
int ja3_parse_client_hello(const uint8_t *data, uint16_t len, Ja3Result *out);

/*
 * ja3_lookup_c2:
 *   hash → bilinen C2 aracı veritabanında ara.
 *   Eşleşme varsa tool_out'u doldurur, güven skorunu döner (0=yok).
 */
int ja3_lookup_c2(const char *hash, char *tool_out, size_t tool_len);

/* Custom (dinamik) C2 imzasi ekle (hash = 32 hex) */
void ja3_load_custom_sig(const char *hash, const char *tool, int confidence);

/* Tüm custom imzaları sil (hot-reload öncesi belleği temizle) */
void ja3_clear_custom_sigs(void);

/* İstatistikler */
void ja3_get_stats(uint64_t *total_fingerprints, uint64_t *c2_hits);

/* Tüm JA3 C2 imzalarını stderr'e döker (debug/audit için) */
void ja3_dump_db(void);

#endif /* JA3_ENGINE_H */
