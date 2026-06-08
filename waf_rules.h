/* waf_rules.h — Genişletilmiş L7 WAF Kural Motoru
 *
 * PCRE2 tabanlı regex'in ötesinde; LFI, RFI, Path Traversal,
 * SSRF, XXE, XSS ve bilinen tarayıcı imzalarını tespit eder.
 *
 * Her kural eşleşmesi bir puan üretir. Toplam puan eşiği
 * (WAF_SCORE_BAN_THRESHOLD) aşılınca ban kararı verilir.
 */
#pragma once
#ifndef WAF_RULES_H
#define WAF_RULES_H

#include "parser.h"   /* StrView */
#include <stdint.h>

/* ── Kural Kategorileri ─────────────────────────────────────────── */
typedef enum {
    WAF_CAT_NONE         = 0,
    WAF_CAT_LFI          = 1,   /* Local File Inclusion         */
    WAF_CAT_RFI          = 2,   /* Remote File Inclusion        */
    WAF_CAT_PATH_TRAV    = 3,   /* Path Traversal               */
    WAF_CAT_SSRF         = 4,   /* Server-Side Request Forgery  */
    WAF_CAT_XXE          = 5,   /* XML External Entity          */
    WAF_CAT_XSS          = 6,   /* Cross-Site Scripting         */
    WAF_CAT_SCANNER      = 7,   /* Bilinen tarayıcı imzaları    */
    WAF_CAT_METHOD_ABUSE      = 8,   /* HTTP Method kötüye kullanım      */
    WAF_CAT_SHELLCMD          = 9,   /* OS komut enjeksiyonu             */
    WAF_CAT_IDOR              = 10,  /* IDOR / Mantıksal sıralama        */
    WAF_CAT_SCHEMA_VIOLATION  = 11,  /* OpenAPI şema ihlali (Feature 1)  */
    WAF_CAT_WASM_BLOCK        = 12,  /* Wasm plugin kararı (Feature 4)   */
} WafCategory;

/* Tek bir WAF kural eşleşmesinin sonucu */
typedef struct {
    WafCategory category;
    int         score;          /* Bu eşleşmenin puan katkısı    */
    const char *reason;         /* İnsan okunabilir açıklama     */
} WafMatch;

/* WAF analiz sonucu */
typedef struct {
    int         total_score;    /* Tüm eşleşmelerin toplam puanı */
    int         match_count;    /* Kaç kural tetiklendi          */
    WafMatch    matches[8];     /* İlk 8 eşleşme (log için)     */
    WafCategory dominant;       /* En yüksek puanlı kategori     */
} WafResult;

/* WAF konfigürasyonu (rules.conf ile yönetilir) */
typedef struct {
    int enabled;
    int ban_threshold;          /* Toplam puan >= bu değer → ban */
    int lfi_enabled;
    int rfi_enabled;
    int path_trav_enabled;
    int ssrf_enabled;
    int xxe_enabled;
    int xss_enabled;
    int scanner_detect_enabled;
    int shellcmd_enabled;
    int method_abuse_enabled;
    int idor_enabled;
} WafConfig;

/* ── API ──────────────────────────────────────────────────────────── */
void waf_config_set(const WafConfig *cfg);
void waf_config_get(WafConfig *out);

/*
 * waf_analyze: URL, gövde (body) ve User-Agent'ı tarar.
 * Doldurulmuş WafResult döner. total_score >= ban_threshold → ban.
 */
WafResult waf_analyze(StrView url, StrView body,
                      StrView user_agent, const char *method);

/*
 * waf_analyze_full: Schema Firewall + Wasm Plugin + klasik WAF'ı
 * sırayla çalıştırır (Feature 1 & 4 entegrasyon noktası).
 *   src_ip — IDOR/BOLA tracking için
 *   path   — OpenAPI path matching için
 */
WafResult waf_analyze_full(StrView url, StrView body, StrView user_agent,
                           const char *method, const char *path,
                           const char *src_ip,
                           StrView host, StrView cookie);

/* Skor eşiğine bakarak ban kararı ver */
int waf_should_ban(const WafResult *r);

/* Kategori adını döndür */
const char *waf_category_str(WafCategory cat);

#endif /* WAF_RULES_H */
