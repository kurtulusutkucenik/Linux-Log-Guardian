/* schema_validator.c — OpenAPI Zero-Trust Schema Firewall (Feature 1)
 * Embedded JSON tokenizer; sıfır harici bağımlılık.
 */
#define _GNU_SOURCE
#include "schema_validator.h"
#include <stdio.h>
#include <string.h>
#include <strings.h>
#include <stdlib.h>
#include <ctype.h>
#include <stdatomic.h>
#include <time.h>

static SchemaRegistry g_registry;
static int g_strict_global = 0;

void schema_set_strict_mode(int enabled)
{
    g_strict_global = enabled ? 1 : 0;
}

int schema_strict_mode(void)
{
    return g_strict_global;
}
static atomic_uint_fast64_t g_total   = 0;
static atomic_uint_fast64_t g_blocked = 0;
static atomic_uint_fast64_t g_warned  = 0;
static atomic_uint_fast64_t g_idor    = 0;
static atomic_uint_fast64_t g_rate_limited = 0;

#define RATE_BUCKETS 512
typedef struct {
    char     key[96];
    time_t   window_min;
    uint32_t count;
} RateBucket;
static RateBucket g_rate_buckets[RATE_BUCKETS];

/* BOLA/IDOR: oturum anahtari (IP veya IP|token) basina ID penceresi */
#define IDOR_TRACK_SLOTS 256
#define IDOR_WINDOW      16
typedef struct {
    char key[96];
    long ids[IDOR_WINDOW];
    int  pos;
    int  count;
} IdorTrack;
static IdorTrack g_idor_track[IDOR_TRACK_SLOTS];

/* ── Minimal JSON tokenizer ─────────────────────────────────────── */
typedef struct { const char *p; const char *end; } JTok;

static void jt_skip_ws(JTok *t) {
    while (t->p < t->end && isspace((unsigned char)*t->p)) t->p++;
}

static int jt_peek(JTok *t) {
    jt_skip_ws(t);
    return (t->p < t->end) ? (unsigned char)*t->p : -1;
}

/* Alıntı içindeki string'i buf'a kopyalar; maksimum bsz-1 karakter */
static int jt_read_string(JTok *t, char *buf, size_t bsz) {
    jt_skip_ws(t);
    if (t->p >= t->end || *t->p != '"') return -1;
    t->p++;
    size_t i = 0;
    while (t->p < t->end && *t->p != '"') {
        if (*t->p == '\\') { t->p++; if (t->p >= t->end) break; }
        if (i + 1 < bsz) buf[i++] = *t->p;
        t->p++;
    }
    if (t->p < t->end) t->p++; /* kapatan '"' */
    buf[i] = '\0';
    return (int)i;
}

/* İleride bir karakteri tüket (varsa) */
static void jt_consume(JTok *t, char c) {
    jt_skip_ws(t);
    if (t->p < t->end && *t->p == c) t->p++;
}

/* Gövdenin içinde belirli anahtarı ara; basit flat JSON için */
static const char *json_find_key(const char *json, size_t len, const char *key) {
    /* Örnek: json_find_key(body, len, "age") → age'in değer pointer'ı */
    char needle[80];
    snprintf(needle, sizeof(needle), "\"%s\"", key);
    const char *p = json;
    const char *end = json + len;
    size_t nlen = strlen(needle);
    while (p + nlen < end) {
        if (memcmp(p, needle, nlen) == 0) {
            p += nlen;
            while (p < end && (*p == ' ' || *p == ':')) p++;
            return p;
        }
        p++;
    }
    return NULL;
}

/* Değerin tipini hızlıca tespit et */
static SchemaFieldType detect_value_type(const char *v) {
    if (!v) return SCHEMA_TYPE_ANY;
    if (*v == '"') return SCHEMA_TYPE_STRING;
    if (*v == '{') return SCHEMA_TYPE_OBJECT;
    if (*v == '[') return SCHEMA_TYPE_ARRAY;
    if (*v == 't' || *v == 'f') return SCHEMA_TYPE_BOOLEAN;
    if (*v == 'n') return SCHEMA_TYPE_ANY; /* null */
    /* Sayı: integer mi float mi? */
    const char *p = v;
    if (*p == '-') p++;
    while (*p && isdigit((unsigned char)*p)) p++;
    if (*p == '.' || *p == 'e' || *p == 'E') return SCHEMA_TYPE_NUMBER;
    return SCHEMA_TYPE_INTEGER;
}

/* ── OpenAPI JSON Parser (paths→requestBody→properties) ─────────── */
static SchemaFieldType parse_type_str(const char *s) {
    if (!strcmp(s, "string"))  return SCHEMA_TYPE_STRING;
    if (!strcmp(s, "integer")) return SCHEMA_TYPE_INTEGER;
    if (!strcmp(s, "number"))  return SCHEMA_TYPE_NUMBER;
    if (!strcmp(s, "boolean")) return SCHEMA_TYPE_BOOLEAN;
    if (!strcmp(s, "object"))  return SCHEMA_TYPE_OBJECT;
    if (!strcmp(s, "array"))   return SCHEMA_TYPE_ARRAY;
    return SCHEMA_TYPE_ANY;
}

/* Özellikleri parse et: "properties": { "age": { "type": "integer" }, ... } */
static int parse_properties(const char *json, size_t len, SchemaEndpoint *ep,
                             const char *required_json, size_t req_len) {
    JTok t = { json, json + len };
    jt_skip_ws(&t);
    if (jt_peek(&t) != '{') return -1;
    t.p++; /* '{' tüket */

    ep->field_count = 0;
    while (jt_peek(&t) != '}' && t.p < t.end && ep->field_count < SCHEMA_MAX_FIELDS) {
        char fname[SCHEMA_MAX_FIELD_LEN] = {0};
        if (jt_read_string(&t, fname, sizeof(fname)) < 0) break;
        jt_consume(&t, ':');
        jt_skip_ws(&t);

        SchemaField *f = &ep->fields[ep->field_count++];
        strncpy(f->name, fname, SCHEMA_MAX_FIELD_LEN - 1);
        f->min_val = -1; f->max_val = -1;

        if (jt_peek(&t) == '{') {
            t.p++;
            /* type alanını bul */
            const char *obj_start = t.p - 1;
            int depth = 1;
            const char *obj_end = t.p;
            while (obj_end < t.end && depth > 0) {
                if (*obj_end == '{') depth++;
                else if (*obj_end == '}') depth--;
                obj_end++;
            }
            char type_val[SCHEMA_MAX_TYPE_LEN] = {0};
            const char *tv = json_find_key(obj_start, (size_t)(obj_end - obj_start), "type");
            if (tv && *tv == '"') {
                JTok tt = {tv, obj_end};
                jt_read_string(&tt, type_val, sizeof(type_val));
            }
            f->type = parse_type_str(type_val);
            t.p = obj_end;
        } else {
            /* Değer string veya başka bir şey; özellik nesnesini atla */
            while (t.p < t.end && *t.p != ',' && *t.p != '}') t.p++;
        }

        /* "required" dizisinde bu alan var mı? */
        if (required_json) {
            char needle[80];
            snprintf(needle, sizeof(needle), "\"%s\"", fname);
            if (memmem(required_json, req_len, needle, strlen(needle)))
                f->required = 1;
        }

        jt_skip_ws(&t);
        if (jt_peek(&t) == ',') t.p++;
    }
    return ep->field_count;
}

static uint32_t parse_rate_limit_rpm(const char *block, size_t block_len)
{
    const char *keys[] = { "\"x-ratelimit-rpm\"", "\"x-ratelimit-limit\"", NULL };
    for (int ki = 0; keys[ki]; ki++) {
        const char *p = memmem(block, block_len, keys[ki], strlen(keys[ki]));
        if (!p) continue;
        p += strlen(keys[ki]);
        while (p < block + block_len && (*p == ' ' || *p == ':')) p++;
        if (p < block + block_len && isdigit((unsigned char)*p))
            return (uint32_t)strtoul(p, NULL, 10);
    }
    return 0;
}

static int parse_one_parameter(const char *obj, size_t obj_len, SchemaParameter *out)
{
    char name[SCHEMA_MAX_FIELD_LEN] = {0};
    char loc[16] = {0};
    char type_val[SCHEMA_MAX_TYPE_LEN] = {0};
    int required = 0;

    const char *np = json_find_key(obj, obj_len, "name");
    if (np && *np == '"') {
        JTok tt = {np, obj + obj_len};
        jt_read_string(&tt, name, sizeof(name));
    }
    const char *lp = json_find_key(obj, obj_len, "in");
    if (lp && *lp == '"') {
        JTok tt = {lp, obj + obj_len};
        jt_read_string(&tt, loc, sizeof(loc));
    }
    const char *sp = memmem(obj, obj_len, "\"schema\"", 8);
    if (sp) {
        const char *tv = json_find_key(sp, (size_t)(obj + obj_len - sp), "type");
        if (tv && *tv == '"') {
            JTok tt = {tv, obj + obj_len};
            jt_read_string(&tt, type_val, sizeof(type_val));
        }
    }
    if (memmem(obj, obj_len, "\"required\":true", 15) ||
        memmem(obj, obj_len, "\"required\": true", 16))
        required = 1;

    if (!name[0] || !loc[0]) return -1;
    strncpy(out->name, name, SCHEMA_MAX_FIELD_LEN - 1);
    if (!strcmp(loc, "header")) out->location = SCHEMA_PARAM_HEADER;
    else if (!strcmp(loc, "query")) out->location = SCHEMA_PARAM_QUERY;
    else if (!strcmp(loc, "path")) out->location = SCHEMA_PARAM_PATH;
    else return -1;
    out->type = parse_type_str(type_val[0] ? type_val : "string");
    out->required = required;
    return 0;
}

static int parse_parameters(const char *block, size_t block_len, SchemaEndpoint *ep)
{
    const char *arr = memmem(block, block_len, "\"parameters\"", 12);
    if (!arr) return 0;
    arr += 12;
    while (arr < block + block_len && *arr != '[') arr++;
    if (arr >= block + block_len) return 0;
    arr++;

    ep->param_count = 0;
    int depth = 0;
    const char *obj_start = NULL;
    for (const char *p = arr; p < block + block_len && ep->param_count < SCHEMA_MAX_PARAMS; p++) {
        if (*p == '{') {
            if (depth == 0) obj_start = p;
            depth++;
        } else if (*p == '}') {
            depth--;
            if (depth == 0 && obj_start) {
                if (parse_one_parameter(obj_start, (size_t)(p - obj_start + 1),
                                        &ep->params[ep->param_count]) == 0)
                    ep->param_count++;
                obj_start = NULL;
            }
        } else if (*p == ']' && depth == 0)
            break;
    }
    return ep->param_count;
}

static void register_endpoint(const char *path_buf, const char *method_upper,
                              const char *props, size_t props_len,
                              const char *req_arr, size_t req_arr_len,
                              const char *method_block, size_t method_block_len)
{
    if (g_registry.count >= SCHEMA_MAX_PATHS) return;

    SchemaEndpoint *ep = &g_registry.endpoints[g_registry.count++];
    memset(ep, 0, sizeof(*ep));
    strncpy(ep->path, path_buf, SCHEMA_MAX_PATH_LEN - 1);
    strncpy(ep->method, method_upper, sizeof(ep->method) - 1);
    ep->strict = g_strict_global ? 1 : 1;
    ep->rate_limit_rpm = parse_rate_limit_rpm(method_block, method_block_len);
    parse_parameters(method_block, method_block_len, ep);

    if (props && props_len > 0)
        parse_properties(props, props_len, ep, req_arr, req_arr_len);
}

int schema_endpoint_count(void)
{
    return g_registry.count;
}

int schema_load_from_memory(const char *json_data, size_t len) {
    memset(&g_registry, 0, sizeof(g_registry));

    /* title ve version */
    const char *tv = json_find_key(json_data, len, "title");
    if (tv && *tv == '"') {
        JTok tt = {tv, json_data + len};
        jt_read_string(&tt, g_registry.title, sizeof(g_registry.title));
    }
    const char *vv = json_find_key(json_data, len, "version");
    if (vv && *vv == '"') {
        JTok tt = {vv, json_data + len};
        jt_read_string(&tt, g_registry.version, sizeof(g_registry.version));
    }

    /* "paths" nesnesini bul ve her path/method çiftini parse et */
    const char *paths_start = memmem(json_data, len, "\"paths\"", 7);
    if (!paths_start) return -1;
    paths_start += 7;
    while (paths_start < json_data + len && *paths_start != '{') paths_start++;
    if (paths_start >= json_data + len) return -1;

    JTok t = { paths_start + 1, json_data + len };
    int depth = 1;

    while (t.p < t.end && depth > 0 && g_registry.count < SCHEMA_MAX_PATHS) {
        jt_skip_ws(&t);
        if (*t.p == '}') { depth--; t.p++; continue; }
        if (*t.p == '{') { depth++; t.p++; continue; }

        if (*t.p != '"') { t.p++; continue; }

        /* path string'ini oku */
        char path_buf[SCHEMA_MAX_PATH_LEN] = {0};
        jt_read_string(&t, path_buf, sizeof(path_buf));
        jt_consume(&t, ':');
        jt_skip_ws(&t);

        if (path_buf[0] != '/') continue; /* path değil; başka bir key */
        if (jt_peek(&t) != '{') continue;

        /* Method nesnesini oku */
        const char *mobj_start = t.p++;
        int mdepth = 1;
        while (t.p < t.end && mdepth > 0) {
            if (*t.p == '{') mdepth++;
            else if (*t.p == '}') mdepth--;
            t.p++;
        }
        const char *mobj_end = t.p;
        size_t mobj_len = (size_t)(mobj_end - mobj_start);

        /* Her HTTP metodunu kontrol et */
        const char *methods[] = {"get","post","put","patch","delete","options",NULL};
        for (int mi = 0; methods[mi]; mi++) {
            char mkey[16];
            snprintf(mkey, sizeof(mkey), "\"%s\"", methods[mi]);
            const char *mp = memmem(mobj_start, mobj_len, mkey, strlen(mkey));
            if (!mp) continue;

            /* requestBody → content → application/json → schema → properties */
            const char *rb = memmem(mp, (size_t)(mobj_end - mp), "\"requestBody\"", 13);
            const char *props = NULL;
            size_t props_len = 0;
            const char *req_arr = NULL;
            size_t req_arr_len = 0;

            if (rb) {
                const char *p = memmem(rb, (size_t)(mobj_end - rb), "\"properties\"", 12);
                if (p) {
                    p += 12;
                    while (p < mobj_end && *p != '{') p++;
                    props = p;
                    int pd = 0; const char *pe = p;
                    do {
                        if (*pe == '{') pd++;
                        else if (*pe == '}') pd--;
                        pe++;
                    } while (pe < mobj_end && pd > 0);
                    props_len = (size_t)(pe - p);

                    /* required array */
                    const char *ra = memmem(rb, (size_t)(mobj_end - rb), "\"required\"", 10);
                    if (ra) {
                        ra += 10;
                        while (ra < mobj_end && *ra != '[') ra++;
                        req_arr = ra;
                        const char *re = ra;
                        while (re < mobj_end && *re != ']') re++;
                        req_arr_len = (size_t)(re - ra + 1);
                    }
                }
            }

            if (props && props_len > 0 && g_registry.count < SCHEMA_MAX_PATHS) {
                char method_upper[8] = {0};
                int j = 0;
                for (const char *m = methods[mi]; *m && j < 7; m++, j++)
                    method_upper[j] = (char)toupper((unsigned char)*m);
                register_endpoint(path_buf, method_upper, props, props_len,
                                  req_arr, req_arr_len, mp, mobj_len);
            } else if (g_registry.count < SCHEMA_MAX_PATHS) {
                /* GET / parametre-only veya rate-limit endpoint */
                uint32_t rl = parse_rate_limit_rpm(mp, mobj_len);
                const char *par = memmem(mp, mobj_len, "\"parameters\"", 12);
                if (rl > 0 || par) {
                    char method_upper[8] = {0};
                    int j = 0;
                    for (const char *m = methods[mi]; *m && j < 7; m++, j++)
                        method_upper[j] = (char)toupper((unsigned char)*m);
                    register_endpoint(path_buf, method_upper, NULL, 0, NULL, 0,
                                      mp, mobj_len);
                }
            }
        }
    }

    g_registry.loaded = 1;
    return g_registry.count > 0 ? 0 : -1;
}

int schema_load(const char *json_path) {
    FILE *f = fopen(json_path, "rb");
    if (!f) return -1;
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    if (sz <= 0 || sz > 4*1024*1024) { fclose(f); return -1; } /* max 4MB */
    char *buf = malloc((size_t)sz + 1);
    if (!buf) { fclose(f); return -1; }
    fread(buf, 1, (size_t)sz, f);
    fclose(f);
    buf[sz] = '\0';
    int r = schema_load_from_memory(buf, (size_t)sz);
    free(buf);
    return r;
}

int schema_is_loaded(void) { return g_registry.loaded; }

/* ── Path matching (path template → gerçek path) ───────────────── */
static int path_match(const char *templ, const char *actual) {
    char actual_clean[SCHEMA_MAX_PATH_LEN];
    size_t i = 0;
    while (actual[i] && actual[i] != '?' && actual[i] != '#'
           && i < sizeof(actual_clean) - 1) {
        actual_clean[i] = actual[i];
        i++;
    }
    actual_clean[i] = '\0';
    actual = actual_clean;

    while (*templ && *actual) {
        if (*templ == '{') {
            /* path parametresi — segment tüketilene kadar ilerle */
            while (*actual && *actual != '/') actual++;
            while (*templ && *templ != '}') templ++;
            if (*templ == '}') templ++;
        } else if (*templ == *actual) {
            templ++; actual++;
        } else {
            return 0;
        }
    }
    return *templ == '\0' && *actual == '\0';
}

static int header_get_value(const char *headers_json, size_t headers_len,
                            const char *name, char *out, size_t out_sz)
{
    if (!headers_json || !name || !out || out_sz == 0) return -1;
    char needle[80];
    snprintf(needle, sizeof(needle), "\"%s\"", name);
    const char *p = memmem(headers_json, headers_len, needle, strlen(needle));
    if (!p) return -1;
    p += strlen(needle);
    while (p < headers_json + headers_len && (*p == ' ' || *p == ':')) p++;
    if (p >= headers_json + headers_len || *p != '"') return -1;
    JTok tt = {p, headers_json + headers_len};
    return jt_read_string(&tt, out, out_sz) >= 0 ? 0 : -1;
}

static int query_get_value(const char *path, const char *name,
                           char *out, size_t out_sz)
{
    if (!path || !name || !out) return -1;
    const char *q = strchr(path, '?');
    if (!q) return -1;
    q++;
    char pattern[80];
    snprintf(pattern, sizeof(pattern), "%s=", name);
    const char *p = strstr(q, pattern);
    if (!p) return -1;
    p += strlen(pattern);
    size_t i = 0;
    while (p[i] && p[i] != '&' && i + 1 < out_sz) {
        out[i] = p[i];
        i++;
    }
    out[i] = '\0';
    return i > 0 ? 0 : -1;
}

static void idor_build_track_key(const char *src_ip, const char *path,
                                 const char *headers_json, size_t headers_len,
                                 char *out, size_t out_sz)
{
    if (!out || out_sz < 8) return;
    const char *ip = src_ip && src_ip[0] ? src_ip : "0.0.0.0";
    char token[128] = {0};
    if (path)
        query_get_value(path, "token", token, sizeof(token));
    if (!token[0] && headers_json && headers_len > 0)
        header_get_value(headers_json, headers_len, "Authorization", token, sizeof(token));
    if (token[0])
        snprintf(out, out_sz, "%s|%s", ip, token);
    else
        snprintf(out, out_sz, "%s", ip);
}

/* Path template /api/users/{id} → gercek segmentteki tamsayi */
static int path_param_long(const char *templ, const char *actual,
                           const char *param_name, long *out_val)
{
    if (!templ || !actual || !param_name || !out_val) return 0;
    char actual_clean[SCHEMA_MAX_PATH_LEN];
    size_t i = 0;
    while (actual[i] && actual[i] != '?' && actual[i] != '#'
           && i < sizeof(actual_clean) - 1) {
        actual_clean[i] = actual[i];
        i++;
    }
    actual_clean[i] = '\0';

    const char *t = templ;
    const char *a = actual_clean;
    while (*t && *a) {
        if (*t == '{') {
            char pname[64] = {0};
            int pi = 0;
            t++;
            while (*t && *t != '}' && pi < 63)
                pname[pi++] = *t++;
            if (*t == '}') t++;
            char seg[32] = {0};
            int si = 0;
            while (*a && *a != '/' && si < 31)
                seg[si++] = *a++;
            if (*a == '/') a++;
            if (strcmp(pname, param_name) == 0) {
                char *end = NULL;
                long v = strtol(seg, &end, 10);
                if (end != seg && v > 0) {
                    *out_val = v;
                    return 1;
                }
                return 0;
            }
        } else if (*t == *a) {
            t++;
            a++;
        } else {
            return 0;
        }
    }
    return 0;
}

static int idor_apply_score(const char *track_key, long id_val,
                            SchemaValidationResult *res)
{
    if (!track_key || !track_key[0] || id_val <= 0 || !res) return 0;

    uint32_t h = 5381;
    for (const char *p = track_key; *p; p++) h = h * 33 + (unsigned char)*p;
    IdorTrack *slot = &g_idor_track[h % IDOR_TRACK_SLOTS];

    if (strcmp(slot->key, track_key) != 0) {
        memset(slot, 0, sizeof(*slot));
        strncpy(slot->key, track_key, sizeof(slot->key) - 1);
    }
    slot->ids[slot->pos % IDOR_WINDOW] = id_val;
    slot->pos++;
    if (slot->count < IDOR_WINDOW) slot->count++;

    if (slot->count < 4) return 0;

    int sequential = 0;
    for (int i = 1; i < slot->count; i++) {
        long prev = slot->ids[(slot->pos - i - 1 + IDOR_WINDOW) % IDOR_WINDOW];
        long curr = slot->ids[(slot->pos - i + IDOR_WINDOW) % IDOR_WINDOW];
        if (curr - prev == 1 || curr - prev == -1) sequential++;
    }
    int score = (sequential * 100) / slot->count;
    if (score > res->idor_score) res->idor_score = score;
    if (score >= 80) {
        atomic_fetch_add(&g_idor, 1);
        snprintf(res->reason, SCHEMA_MAX_REASON_LEN,
                 "BOLA/IDOR pattern (score=%d, key=%.32s)", score, track_key);
        res->status = g_strict_global ? SCHEMA_BLOCK : SCHEMA_WARN;
        res->violation_count++;
        if (g_strict_global)
            atomic_fetch_add(&g_blocked, 1);
    }
    return score;
}

static void idor_check_path_and_body_params(SchemaEndpoint *ep,
                                            const char *path,
                                            const char *body, size_t body_len,
                                            const char *src_ip,
                                            const char *headers_json,
                                            size_t headers_len,
                                            SchemaValidationResult *res)
{
    char track_key[96];
    idor_build_track_key(src_ip, path, headers_json, headers_len,
                         track_key, sizeof(track_key));

    for (int i = 0; i < ep->param_count; i++) {
        if (ep->params[i].location != SCHEMA_PARAM_PATH) continue;
        if (ep->params[i].type != SCHEMA_TYPE_INTEGER) continue;
        long idv = 0;
        if (path_param_long(ep->path, path, ep->params[i].name, &idv))
            idor_apply_score(track_key, idv, res);
    }

    if (body && body_len > 0) {
        for (int i = 0; i < ep->field_count; i++) {
            if (ep->fields[i].type != SCHEMA_TYPE_INTEGER) continue;
            const char *val = json_find_key(body, body_len, ep->fields[i].name);
            if (!val) continue;
            long id_val = strtol(val, NULL, 10);
            if (id_val > 0)
                idor_apply_score(track_key, id_val, res);
        }
    }
}

static int rate_limit_exceeded(const char *src_ip, const char *method,
                               SchemaEndpoint *ep)
{
    if (!ep || ep->rate_limit_rpm == 0 || !src_ip) return 0;
    char key[96];
    snprintf(key, sizeof(key), "%s|%s|%s", src_ip, method, ep->path);
    uint32_t h = 5381;
    for (const char *p = key; *p; p++) h = h * 33 + (unsigned char)*p;
    RateBucket *slot = &g_rate_buckets[h % RATE_BUCKETS];
    time_t now_min = time(NULL) / 60;

    if (strcmp(slot->key, key) != 0) {
        memset(slot, 0, sizeof(*slot));
        strncpy(slot->key, key, sizeof(slot->key) - 1);
    }
    if (slot->window_min != now_min) {
        slot->window_min = now_min;
        slot->count = 0;
    }
    slot->count++;
    return slot->count > ep->rate_limit_rpm;
}

static int validate_unknown_body_fields(const char *body, size_t body_len,
                                        SchemaEndpoint *ep)
{
    if (!body || body_len == 0 || ep->field_count == 0) return 0;
    if (!ep->strict && !g_strict_global) return 0;

    JTok t = {body, body + body_len};
    jt_skip_ws(&t);
    if (jt_peek(&t) != '{') return 0;
    t.p++;

    while (jt_peek(&t) != '}' && t.p < t.end) {
        char fname[SCHEMA_MAX_FIELD_LEN] = {0};
        if (jt_read_string(&t, fname, sizeof(fname)) < 0) break;
        jt_consume(&t, ':');
        int known = 0;
        for (int i = 0; i < ep->field_count; i++) {
            if (!strcmp(ep->fields[i].name, fname)) {
                known = 1;
                break;
            }
        }
        if (!known) return -1;
        /* skip value */
        jt_skip_ws(&t);
        if (jt_peek(&t) == '"') {
            t.p++;
            while (t.p < t.end && *t.p != '"') {
                if (*t.p == '\\') t.p++;
                t.p++;
            }
            if (t.p < t.end) t.p++;
        } else if (jt_peek(&t) == '{' || jt_peek(&t) == '[') {
            int depth = 0;
            char open = *t.p;
            char close = open == '{' ? '}' : ']';
            do {
                if (*t.p == open) depth++;
                else if (*t.p == close) depth--;
                t.p++;
            } while (t.p < t.end && depth > 0);
        } else {
            while (t.p < t.end && *t.p != ',' && *t.p != '}') t.p++;
        }
        jt_skip_ws(&t);
        if (jt_peek(&t) == ',') t.p++;
    }
    return 0;
}

static int validate_parameters(SchemaEndpoint *ep, const char *path,
                               const char *headers_json, size_t headers_len,
                               SchemaValidationResult *res)
{
    if (!ep || ep->param_count == 0) return 0;
    for (int i = 0; i < ep->param_count; i++) {
        SchemaParameter *p = &ep->params[i];
        char val[256] = {0};
        int found = 0;

        if (p->location == SCHEMA_PARAM_HEADER && headers_json) {
            found = header_get_value(headers_json, headers_len,
                                     p->name, val, sizeof(val)) == 0;
        } else if (p->location == SCHEMA_PARAM_QUERY && path) {
            found = query_get_value(path, p->name, val, sizeof(val)) == 0;
        } else if (p->location == SCHEMA_PARAM_PATH) {
            found = path_match(ep->path, path);
        }

        if (!found && p->required) {
            snprintf(res->reason, SCHEMA_MAX_REASON_LEN,
                     "Required %s parameter missing: %s",
                     p->location == SCHEMA_PARAM_HEADER ? "header" :
                     p->location == SCHEMA_PARAM_QUERY ? "query" : "path",
                     p->name);
            strncpy(res->field_name, p->name, SCHEMA_MAX_FIELD_LEN - 1);
            return -1;
        }
        if (found && val[0] && p->type == SCHEMA_TYPE_INTEGER) {
            char *eptr = NULL;
            strtol(val, &eptr, 10);
            if (eptr == val) {
                snprintf(res->reason, SCHEMA_MAX_REASON_LEN,
                         "Type mismatch on %s '%s'", "parameter", p->name);
                return -1;
            }
        }
    }
    return 0;
}

/* ── Ana doğrulama fonksiyonu ───────────────────────────────────── */
SchemaValidationResult schema_validate_request(
    const char *method, const char *path,
    const char *body, size_t body_len, const char *src_ip)
{
    return schema_validate_request_v2(method, path, body, body_len, src_ip,
                                      NULL, 0);
}

SchemaValidationResult schema_validate_request_v2(
    const char *method, const char *path,
    const char *body, size_t body_len, const char *src_ip,
    const char *headers_json, size_t headers_len)
{
    SchemaValidationResult res = {0};
    atomic_fetch_add(&g_total, 1);

    if (!g_registry.loaded) {
        res.status = SCHEMA_UNKNOWN;
        return res;
    }

    /* Endpoint bul */
    SchemaEndpoint *ep = NULL;
    for (int i = 0; i < g_registry.count; i++) {
        if (strcasecmp(g_registry.endpoints[i].method, method) == 0 &&
            path_match(g_registry.endpoints[i].path, path)) {
            ep = &g_registry.endpoints[i];
            break;
        }
    }

    if (!ep) {
        if (g_strict_global) {
            snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                     "Unknown API endpoint (strict mode): %s %s",
                     method ? method : "?", path ? path : "?");
            res.status = SCHEMA_BLOCK;
            res.violation_count = 1;
            atomic_fetch_add(&g_blocked, 1);
        } else {
            res.status = SCHEMA_UNKNOWN;
        }
        return res;
    }

    if (rate_limit_exceeded(src_ip, method, ep)) {
        snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                 "Rate limit exceeded (%u req/min): %s %s",
                 ep->rate_limit_rpm, method, path);
        res.status = SCHEMA_BLOCK;
        res.violation_count = 1;
        atomic_fetch_add(&g_blocked, 1);
        atomic_fetch_add(&g_rate_limited, 1);
        return res;
    }

    if (validate_parameters(ep, path, headers_json, headers_len, &res) != 0) {
        res.status = SCHEMA_BLOCK;
        res.violation_count = 1;
        atomic_fetch_add(&g_blocked, 1);
        return res;
    }

    if (!body || body_len == 0) {
        /* Required alan kontrolü */
        for (int i = 0; i < ep->field_count; i++) {
            if (ep->fields[i].required) {
                snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                         "Required field missing: %s", ep->fields[i].name);
                strncpy(res.field_name, ep->fields[i].name, SCHEMA_MAX_FIELD_LEN-1);
                res.status = SCHEMA_BLOCK;
                res.violation_count++;
                atomic_fetch_add(&g_blocked, 1);
                return res;
            }
        }
        idor_check_path_and_body_params(ep, path, NULL, 0, src_ip,
                                        headers_json, headers_len, &res);
        if (res.violation_count > 0 && res.status != SCHEMA_BLOCK) {
            atomic_fetch_add(&g_warned, 1);
            if (res.status == 0) res.status = SCHEMA_WARN;
        } else if (res.violation_count == 0) {
            res.status = SCHEMA_PASS;
        }
        return res;
    }

    if (validate_unknown_body_fields(body, body_len, ep) != 0) {
        snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                 "Unknown field in request body (strict v2)");
        res.status = SCHEMA_BLOCK;
        res.violation_count = 1;
        atomic_fetch_add(&g_blocked, 1);
        return res;
    }

    /* Her alan için kontrol */
    for (int i = 0; i < ep->field_count; i++) {
        SchemaField *f = &ep->fields[i];
        const char *val = json_find_key(body, body_len, f->name);

        if (!val) {
            if (f->required) {
                snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                         "Required field missing: %s", f->name);
                strncpy(res.field_name, f->name, SCHEMA_MAX_FIELD_LEN-1);
                res.status = SCHEMA_BLOCK;
                res.violation_count++;
                atomic_fetch_add(&g_blocked, 1);
                return res;
            }
            continue;
        }

        /* Tip kontrolü */
        if (f->type != SCHEMA_TYPE_ANY) {
            SchemaFieldType got = detect_value_type(val);
            /* integer, number birbiriyle uyumlu say */
            int ok = (got == f->type) ||
                     (f->type == SCHEMA_TYPE_NUMBER && got == SCHEMA_TYPE_INTEGER);
            if (!ok) {
                snprintf(res.reason, SCHEMA_MAX_REASON_LEN,
                         "Type mismatch on field '%s': expected %d got %d",
                         f->name, f->type, got);
                strncpy(res.field_name, f->name, SCHEMA_MAX_FIELD_LEN-1);
                res.status = SCHEMA_BLOCK;
                res.violation_count++;
                atomic_fetch_add(&g_blocked, 1);
                return res;
            }

        }
    }

    idor_check_path_and_body_params(ep, path, body, body_len, src_ip,
                                    headers_json, headers_len, &res);

    if (res.violation_count == 0) {
        res.status = SCHEMA_PASS;
    } else if (res.status != SCHEMA_BLOCK) {
        atomic_fetch_add(&g_warned, 1);
        if (res.status == 0) res.status = SCHEMA_WARN;
    }
    return res;
}

void schema_get_stats(uint64_t *total, uint64_t *blocked,
                      uint64_t *warned, uint64_t *idor_hits,
                      uint64_t *rate_limited) {
    if (total)    *total    = atomic_load(&g_total);
    if (blocked)  *blocked  = atomic_load(&g_blocked);
    if (warned)   *warned   = atomic_load(&g_warned);
    if (idor_hits)*idor_hits = atomic_load(&g_idor);
    if (rate_limited) *rate_limited = atomic_load(&g_rate_limited);
}

void schema_unload(void) {
    memset(&g_registry, 0, sizeof(g_registry));
}

const char *schema_status_str(SchemaStatus s) {
    switch (s) {
        case SCHEMA_PASS:    return "PASS";
        case SCHEMA_WARN:    return "WARN";
        case SCHEMA_BLOCK:   return "BLOCK";
        case SCHEMA_UNKNOWN: return "UNKNOWN";
        default:             return "?";
    }
}
