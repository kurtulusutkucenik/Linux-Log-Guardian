/* schema_validator.h — OpenAPI 3.x Zero-Trust Schema Firewall
 *
 * Log Guardian'ın WAF pipeline'ının en üstünde çalışan, gelen
 * JSON/form isteklerini OpenAPI şemasıyla karşılaştıran motor.
 *
 * Özellikler:
 *  - OpenAPI 3.0 JSON dosyasından paths/requestBody/properties parse eder
 *  - Type mismatch tespiti: "age" string gelirse → BLOCK
 *  - Unexpected field tespiti: şemada olmayan parametre → WARN/BLOCK
 *  - Required field eksikliği: → BLOCK
 *  - BOLA/IDOR pattern: ardışık ID probing → anomaly score
 *  - Zero harici bağımlılık (embedded JSON tokenizer)
 *
 * Usage:
 *   schema_load("/etc/log-guardian/openapi.json");
 *   SchemaValidationResult r = schema_validate_request(method, path, body, body_len);
 *   if (r.status == SCHEMA_BLOCK) { ban_ip(...); }
 */
#pragma once
#ifndef SCHEMA_VALIDATOR_H
#define SCHEMA_VALIDATOR_H

#include <stdint.h>
#include <stddef.h>

/* ── Maksimum Limitler ──────────────────────────────────────────── */
#define SCHEMA_MAX_PATHS        64
#define SCHEMA_MAX_FIELDS       32
#define SCHEMA_MAX_PARAMS       16
#define SCHEMA_MAX_PATH_LEN    128
#define SCHEMA_MAX_FIELD_LEN    64
#define SCHEMA_MAX_TYPE_LEN     16
#define SCHEMA_MAX_REASON_LEN  256

typedef enum {
    SCHEMA_PARAM_HEADER = 0,
    SCHEMA_PARAM_QUERY  = 1,
    SCHEMA_PARAM_PATH   = 2,
} SchemaParamLocation;

/* ── Veri Tipleri ───────────────────────────────────────────────── */
typedef enum {
    SCHEMA_TYPE_ANY     = 0,
    SCHEMA_TYPE_STRING  = 1,
    SCHEMA_TYPE_INTEGER = 2,
    SCHEMA_TYPE_NUMBER  = 3,
    SCHEMA_TYPE_BOOLEAN = 4,
    SCHEMA_TYPE_OBJECT  = 5,
    SCHEMA_TYPE_ARRAY   = 6,
} SchemaFieldType;

typedef struct {
    char                name[SCHEMA_MAX_FIELD_LEN];
    SchemaParamLocation location;
    SchemaFieldType     type;
    int                 required;
} SchemaParameter;

/* (SchemaField follows) */

/* ── Tek Bir Alan Tanımı ────────────────────────────────────────── */
typedef struct {
    char            name[SCHEMA_MAX_FIELD_LEN];
    SchemaFieldType type;
    int             required;       /* 1 = zorunlu                  */
    int             allow_extra;    /* 0 = tanımsız alan → reject   */
    long            min_val;        /* integer/number için alt sınır (-1 = yok) */
    long            max_val;        /* integer/number için üst sınır (-1 = yok) */
    size_t          max_len;        /* string max karakter (0 = yok)            */
} SchemaField;

/* ── Bir Endpoint'in Şeması ─────────────────────────────────────── */
typedef struct {
    char        path[SCHEMA_MAX_PATH_LEN];   /* örn. "/api/users/{id}"  */
    char        method[8];                   /* "GET", "POST", ...       */
    SchemaField fields[SCHEMA_MAX_FIELDS];
    int         field_count;
    SchemaParameter params[SCHEMA_MAX_PARAMS];
    int         param_count;
    uint32_t    rate_limit_rpm; /* 0 = sınırsız; dakika başına istek      */
    int         strict;      /* 1 = unknown field → BLOCK                  */
} SchemaEndpoint;

/* ── Global Şema Koleksiyonu ────────────────────────────────────── */
typedef struct {
    SchemaEndpoint endpoints[SCHEMA_MAX_PATHS];
    int            count;
    char           title[64];
    char           version[16];
    int            loaded;
} SchemaRegistry;

/* ── Doğrulama Sonuçları ────────────────────────────────────────── */
typedef enum {
    SCHEMA_PASS    = 0,   /* Tüm kontroller geçildi                          */
    SCHEMA_WARN    = 1,   /* Şüpheli ama engellenmiyor (log + skor artışı)   */
    SCHEMA_BLOCK   = 2,   /* Kesin ihlal — istek reddedilmeli                */
    SCHEMA_UNKNOWN = 3,   /* Bu endpoint şemada tanımlı değil (pass-through) */
} SchemaStatus;

typedef struct {
    SchemaStatus status;
    int          violation_count;
    char         reason[SCHEMA_MAX_REASON_LEN];
    /* BOLA/IDOR tespiti için ek bilgi */
    int          idor_score;      /* 0-100, yüksekse IDOR şüphesi            */
    char         field_name[SCHEMA_MAX_FIELD_LEN]; /* İhlal eden alan adı   */
} SchemaValidationResult;

/* ── API ─────────────────────────────────────────────────────────── */

/*
 * schema_load: OpenAPI 3.0 JSON dosyasını yükler ve parse eder.
 * Başarıda 0, hata durumunda -1 döner.
 * Thread-safe değil; başlangıçta tek seferlik çağrılmalı.
 */
int schema_load(const char *json_path);

/*
 * schema_load_from_memory: Bellek içi JSON string'inden yükler.
 * Başarıda 0, hata durumunda -1 döner.
 */
int schema_load_from_memory(const char *json_data, size_t len);

/*
 * schema_validate_request: Gelen isteği yüklü şemayla doğrular.
 *   method    — "GET", "POST", "PUT", ...
 *   path      — "/api/users/42" (query string hariç)
 *   body      — istek gövdesi JSON (NULL olabilir)
 *   body_len  — gövde uzunluğu
 *   src_ip    — IDOR/BOLA tracking için istemci IP
 *
 * Dönen SchemaValidationResult.status:
 *   SCHEMA_PASS    → devam et
 *   SCHEMA_WARN    → logla + skor artır
 *   SCHEMA_BLOCK   → 400 Bad Request / ban
 *   SCHEMA_UNKNOWN → bu endpoint şemada yok, pass-through
 */
SchemaValidationResult schema_validate_request(
    const char *method,
    const char *path,
    const char *body,
    size_t      body_len,
    const char *src_ip
);

/*
 * v2: header JSON ({"X-API-Key":"..."}) + query string path içinde.
 */
SchemaValidationResult schema_validate_request_v2(
    const char *method,
    const char *path,
    const char *body,
    size_t      body_len,
    const char *src_ip,
    const char *headers_json,
    size_t      headers_len
);

int schema_endpoint_count(void);

/*
 * schema_is_loaded: Şema yüklü mü?
 */
int schema_is_loaded(void);

/*
 * schema_get_stats: Toplam istatistikleri döndürür.
 */
void schema_get_stats(uint64_t *total, uint64_t *blocked,
                      uint64_t *warned, uint64_t *idor_hits,
                      uint64_t *rate_limited);

/*
 * schema_unload: Şemayı bellekten temizler.
 */
void schema_unload(void);

/*
 * schema_status_str: Durum kodunu insan okunabilir string'e çevirir.
 */
const char *schema_status_str(SchemaStatus s);

/* OPENAPI_STRICT=1: bilinmeyen endpoint → BLOCK; yuksek IDOR → BLOCK */
void schema_set_strict_mode(int enabled);
int  schema_strict_mode(void);

#endif /* SCHEMA_VALIDATOR_H */
