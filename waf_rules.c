/* waf_rules.c — Genişletilmiş L7 WAF Kural Motoru + Schema Firewall + Wasm
 * (Feature 1 & 4 entegrasyon noktası)
 */
#define _GNU_SOURCE
#include "waf_rules.h"
#include "schema_validator.h"
#include "wasm_runtime.h"
#include <string.h>
#include <strings.h>
#include <stdio.h>
#include <ctype.h>
#include <stddef.h>

/* ── Varsayılan konfigürasyon ──────────────────────────────────────── */
static WafConfig g_waf_cfg = {
    .enabled              = 1,
    .ban_threshold        = 10,
    .lfi_enabled          = 1,
    .rfi_enabled          = 1,
    .path_trav_enabled    = 1,
    .ssrf_enabled         = 1,
    .xxe_enabled          = 1,
    .xss_enabled          = 1,
    .scanner_detect_enabled = 1,
    .shellcmd_enabled     = 1,
    .method_abuse_enabled = 1,
    .idor_enabled         = 1,
};

void waf_config_set(const WafConfig *cfg) { if (cfg) g_waf_cfg = *cfg; }
void waf_config_get(WafConfig *out)       { if (out) *out = g_waf_cfg; }

/* ── Kural tabloları ──────────────────────────────────────────────── */

/* case-insensitive substring arama */
static int ci_contains(const char *haystack, size_t hlen,
                        const char *needle) {
    if (!haystack || !needle || hlen == 0) return 0;
    size_t nlen = strlen(needle);
    if (nlen > hlen) return 0;
    for (size_t i = 0; i <= hlen - nlen; i++) {
        size_t j;
        for (j = 0; j < nlen; j++) {
            if (tolower((unsigned char)haystack[i+j]) !=
                tolower((unsigned char)needle[j])) break;
        }
        if (j == nlen) return 1;
    }
    return 0;
}

/* ── LFI / Path Traversal ─────────────────────────────────────────── */
static const char *lfi_patterns[] = {
    "../", "..\\", "%2e%2e%2f", "%2e%2e/", "..%2f",
    "%252e%252e", "..%5c", "%c0%ae", "....//",
    "/etc/passwd", "/etc/shadow", "/proc/self/environ",
    "/proc/self/cmdline", "/var/log/", "/boot/grub",
    "\\windows\\system32", "win.ini", "boot.ini",
    NULL
};

/* ── RFI ──────────────────────────────────────────────────────────── */
static const char *rfi_patterns[] = {
    "http://", "https://", "ftp://", "ftps://",
    "php://input", "php://filter", "data://",
    "expect://", "zip://", "glob://",
    NULL
};

/* ── SSRF ─────────────────────────────────────────────────────────── */
static const char *ssrf_patterns[] = {
    "169.254.169.254",   /* AWS metadata                     */
    "metadata.google",   /* GCP metadata                     */
    "169.254.170.2",     /* ECS metadata                     */
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "10.0.0.",
    "192.168.",
    "172.16.",
    "fd",                /* IPv6 ULA prefix                  */
    "file:///",
    "dict://",
    "gopher://",
    NULL
};

/* ── XXE ──────────────────────────────────────────────────────────── */
static const char *xxe_patterns[] = {
    "<!entity",
    "<!doctype",
    "system \"file",
    "system 'file",
    "system \"http",
    "system 'http",
    "%xxe;",
    "&xxe;",
    "SYSTEM",
    NULL
};

/* ── XSS ──────────────────────────────────────────────────────────── */
static const char *xss_patterns[] = {
    "<script",
    "</script>",
    "javascript:",
    "vbscript:",
    "onload=",
    "onerror=",
    "onfocus=",
    "onclick=",
    "onmouseover=",
    "ontoggle=",
    "onstart=",
    "alert(",
    "document.cookie",
    "document.write(",
    "eval(",
    "expression(",
    "fromcharcode(",
    "&#x",
    "%3cscript",
    NULL
};

#define GRAPHQL_MAX_DEPTH 12

static int graphql_nesting_depth(const char *data, size_t dlen)
{
    int depth = 0, max_d = 0;
    if (!data) return 0;
    for (size_t i = 0; i < dlen; i++) {
        if (data[i] == '{') {
            depth++;
            if (depth > max_d) max_d = depth;
        } else if (data[i] == '}') {
            if (depth > 0) depth--;
        }
    }
    return max_d;
}

/* ── NoSQL operator injection (Mongo/Couch-style) ──────────────────── */
static const char *nosql_patterns[] = {
    "$gt",
    "$ne",
    "$where",
    "$regex",
    "$or",
    "$and",
    "$nin",
    "$exists",
    "$expr",
    "$jsonschema",
    "$elemmatch",
    "$text",
    "$comment",
    "$mod",
    "$size",
    "$all",
    "$type",
    "$in",
    "$not",
    "[$ne]",
    "[$gt]",
    "[$regex]",
    "[$where]",
    NULL
};

/* ── GraphQL abuse / introspection ─────────────────────────────────── */
static const char *graphql_patterns[] = {
    "__schema",
    "introspectionquery",
    "query {",
    "mutation {",
    "__typename",
    "/graphql",
    "application/graphql",
    NULL
};

/* ── OS Command Injection ─────────────────────────────────────────── */
static const char *shellcmd_patterns[] = {
    ";ls ",
    ";cat ",
    ";id;",
    ";pwd",
    "|ls",
    "|cat",
    "|id",
    "|whoami",
    "`id`",
    "$(id)",
    "$(ls)",
    "/bin/sh",
    "/bin/bash",
    "cmd.exe",
    "powershell",
    "wget http",
    "curl http",
    "; ping",
    "&& ping",
    NULL
};

/* ── Java/Template RCE: Spring4Shell · Struts2 OGNL · Text4Shell · Log4Shell ─
 * Ultra-spesifik imzalar — legitim istekte görülmez, FP riski ~0.
 * CVE-2022-22965 (Spring4Shell), CVE-2022-42889 (Text4Shell),
 * CVE-2021-44228 (Log4Shell), Struts2 OGNL (S2-*).
 * CRS kapalıyken (community/test profili) bile bu sınıfı yakalar.        */
static const char *java_rce_patterns[] = {
    "class.module.classloader",   /* Spring4Shell                     */
    ".class.classloader",         /* classloader manipülasyonu        */
    "_memberaccess",              /* Struts2 OGNL                     */
    "@ognl.",                     /* OGNL çağrısı                     */
    "getruntime",                 /* Runtime.getRuntime()             */
    "processbuilder",             /* Java RCE                         */
    "${jndi:",                    /* Log4Shell                        */
    "${script:",                  /* Text4Shell (Commons Text)        */
    "${dns:",                     /* Text4Shell interpolation         */
    "${url:",                     /* Text4Shell interpolation         */
    "${lower:",                   /* Log4Shell obfuscation            */
    "${upper:",
    "${env:",                     /* Log4Shell env sızıntısı          */
    NULL
};

/* ── Modern uygulama RCE: PHP-CGI arg-injection · Spring SpEL ────────────
 * CVE-2024-4577 (PHP-CGI Windows argüman enjeksiyonu — php.ini override),
 * Spring SpEL type-reference RCE (CVE-2022-22963 vb. `T(java.lang.Runtime)`).
 * Ultra-spesifik imzalar — legitim query/body'de görülmez, FP riski ~0.
 * Not: Java deserialization base64 (rO0AB) case-insensitive taramada büyük
 *      upload'larda FP riski taşıdığı için bilinçli olarak dahil edilmedi.  */
static const char *modern_rce_patterns[] = {
    "allow_url_include",          /* PHP-CGI CVE-2024-4577 ini override */
    "auto_prepend_file",          /* PHP-CGI arg injection             */
    "cgi.force_redirect",         /* PHP-CGI hardening bypass          */
    "t(java.lang.runtime",        /* Spring SpEL → Runtime            */
    "t(java.lang.processbuilder", /* Spring SpEL → ProcessBuilder     */
    "#this.getclass(",            /* SpEL/OGNL reflection             */
    "%23this.getclass(",          /* aynısının URL-encoded (%23=#)    */
    NULL
};

/* ── Enterprise OGNL: Confluence · Struts WebWork stack ──────────────────
 * CVE-2022-26134 (Confluence), Struts2 WebWork OGNL zinciri.
 * nginx access log URL/body'de görülür; header-only exploit (Next.js
 * middleware bypass) log formatına düşmediği için burada kapsanmaz.      */
static const char *enterprise_ognl_patterns[] = {
    "ognl.OgnlUtil",              /* Confluence CVE-2022-26134         */
    "com.opensymphony.xwork2",    /* Struts2 / Confluence WebWork      */
    "webwork.util.ValueStack",    /* OGNL value-stack chain            */
    "confluence.webwork",         /* Atlassian Confluence stack        */
    "DefaultMemberAccess",        /* OGNL sandbox bypass               */
    NULL
};

/* ── Bilinen Tarayıcı / Scanner User-Agent İmzaları ─────────────── */
static const char *scanner_ua_patterns[] = {
    "sqlmap",
    "nikto",
    "nessus",
    "openvas",
    "masscan",
    "nmap",
    "zgrab",
    "hydra",
    "medusa",
    "burpsuite",
    "dirbuster",
    "gobuster",
    "ffuf",
    "wfuzz",
    "acunetix",
    "appscan",
    "w3af",
    "havij",
    "pangolin",
    "python-requests",
    "go-http-client",
    "libwww-perl",
    "lwp-trivial",
    "java/",
    "curl/",
    "wget/",
    "scrapy",
    "nuclei",
    NULL
};

/* ── Kötüye Kullanılan HTTP Metodları ─────────────────────────────── */
static const char *abused_methods[] = {
    "TRACE",
    "TRACK",
    "CONNECT",
    "PROPFIND",
    "PROPPATCH",
    "MKCOL",
    "COPY",
    "MOVE",
    "LOCK",
    "UNLOCK",
    "SEARCH",
    NULL
};

/* ── Yardımcı: WafResult'e eşleşme ekle ─────────────────────────── */
static void add_match(WafResult *r, WafCategory cat,
                      int score, const char *reason) {
    if (r->match_count < 8) {
        r->matches[r->match_count].category = cat;
        r->matches[r->match_count].score    = score;
        r->matches[r->match_count].reason   = reason;
        r->match_count++;
    }
    r->total_score += score;
    /* Dominant kategoriyi güncelle */
    if (score > 0) {
        int max_score = 0;
        for (int i = 0; i < r->match_count; i++) {
            if (r->matches[i].category == cat &&
                r->matches[i].score > max_score) {
                max_score = r->matches[i].score;
            }
        }
        r->dominant = cat;
    }
}

/* ── Desen dizisi tara ─────────────────────────────────────────────── */
static int scan_patterns(const char *data, size_t dlen,
                         const char **patterns) {
    for (int i = 0; patterns[i]; i++) {
        if (ci_contains(data, dlen, patterns[i])) return 1;
    }
    return 0;
}

/* ── IDOR tespiti: /path/NNN ardı ardına sayısal ID artışı ─────── */
static int detect_idor_pattern(StrView url) {
    if (!url.ptr || url.len < 4) return 0;
    /* /api/.../NNN veya ?id=NNN gibi sayısal ID içeren URL */
    int digit_seq = 0;
    for (size_t i = 0; i < url.len; i++) {
        if (isdigit((unsigned char)url.ptr[i])) {
            digit_seq++;
            if (digit_seq >= 3) return 1; /* En az 3 basamaklı sayısal ID */
        } else {
            digit_seq = 0;
        }
    }
    return 0;
}

/* ── Ana analiz fonksiyonu ─────────────────────────────────────────── */
WafResult waf_analyze(StrView url, StrView body,
                      StrView user_agent, const char *method) {
    WafResult r;
    memset(&r, 0, sizeof(r));

    if (!g_waf_cfg.enabled) return r;

    /* URL + Body birleşik analiz tamponu */
    const char *url_s  = url.ptr  ? url.ptr  : "";
    size_t      url_l  = url.len;
    const char *body_s = body.ptr ? body.ptr : "";
    size_t      body_l = body.len;
    const char *ua_s   = user_agent.ptr ? user_agent.ptr : "";
    size_t      ua_l   = user_agent.len;

    /* ── 1. LFI / Path Traversal ─────────────────────────────── */
    if (g_waf_cfg.lfi_enabled || g_waf_cfg.path_trav_enabled) {
        if (scan_patterns(url_s, url_l, lfi_patterns) ||
            scan_patterns(body_s, body_l, lfi_patterns)) {
            add_match(&r, WAF_CAT_LFI, 8, "LFI/Path Traversal tespit edildi");
        }
    }

    /* ── 2. RFI ──────────────────────────────────────────────── */
    if (g_waf_cfg.rfi_enabled) {
        if (scan_patterns(url_s, url_l, rfi_patterns) ||
            scan_patterns(body_s, body_l, rfi_patterns)) {
            add_match(&r, WAF_CAT_RFI, 6, "Remote File Inclusion girişimi");
        }
    }

    /* ── 3. SSRF ─────────────────────────────────────────────── */
    if (g_waf_cfg.ssrf_enabled) {
        if (scan_patterns(url_s, url_l, ssrf_patterns) ||
            scan_patterns(body_s, body_l, ssrf_patterns)) {
            add_match(&r, WAF_CAT_SSRF, 9, "SSRF hedef IP/hostname tespit edildi");
        }
    }

    /* ── 4. XXE ──────────────────────────────────────────────── */
    if (g_waf_cfg.xxe_enabled) {
        if (scan_patterns(url_s, url_l, xxe_patterns) ||
            scan_patterns(body_s, body_l, xxe_patterns)) {
            add_match(&r, WAF_CAT_XXE, 7, "XXE payload (DTD entity) tespit edildi");
        }
    }

    /* ── 5. XSS ──────────────────────────────────────────────── */
    if (g_waf_cfg.xss_enabled) {
        if (scan_patterns(url_s, url_l, xss_patterns) ||
            scan_patterns(body_s, body_l, xss_patterns)) {
            add_match(&r, WAF_CAT_XSS, 5, "XSS payload tespit edildi");
        }
    }

    /* ── 6. NoSQL / GraphQL introspection / depth abuse ─────── */
    if (g_waf_cfg.method_abuse_enabled) {
        if (scan_patterns(url_s, url_l, nosql_patterns) ||
            scan_patterns(body_s, body_l, nosql_patterns)) {
            add_match(&r, WAF_CAT_METHOD_ABUSE, 8,
                      "NoSQL operator injection tespit edildi");
        }
        int gql_hit = scan_patterns(url_s, url_l, graphql_patterns) ||
                      scan_patterns(body_s, body_l, graphql_patterns) ||
                      (method && ci_contains(method, strlen(method), "graphql"));
        int gql_depth = graphql_nesting_depth(body_s, body_l);
        if (gql_depth >= GRAPHQL_MAX_DEPTH) {
            add_match(&r, WAF_CAT_METHOD_ABUSE, 9,
                      "GraphQL depth limit abuse");
            gql_hit = 1;
        }
        if (gql_hit) {
            add_match(&r, WAF_CAT_METHOD_ABUSE, 8,
                      "GraphQL introspection veya API abuse");
        }
    }

    /* ── 7. OS Komut Enjeksiyonu ─────────────────────────────── */
    if (g_waf_cfg.shellcmd_enabled) {
        if (scan_patterns(url_s, url_l, shellcmd_patterns) ||
            scan_patterns(body_s, body_l, shellcmd_patterns)) {
            add_match(&r, WAF_CAT_SHELLCMD, 10, "OS komut enjeksiyonu imzasi");
        }
        /* 7b. Java/Template RCE (Spring4Shell/OGNL/Text4Shell/Log4Shell) */
        if (scan_patterns(url_s, url_l, java_rce_patterns) ||
            scan_patterns(body_s, body_l, java_rce_patterns)) {
            add_match(&r, WAF_CAT_SHELLCMD, 10,
                      "Java/Template RCE (Spring4Shell/OGNL/Text4Shell/Log4Shell)");
        }
        /* 7c. Modern uygulama RCE (PHP-CGI CVE-2024-4577 / Spring SpEL) */
        if (scan_patterns(url_s, url_l, modern_rce_patterns) ||
            scan_patterns(body_s, body_l, modern_rce_patterns)) {
            add_match(&r, WAF_CAT_SHELLCMD, 10,
                      "Modern uygulama RCE (PHP-CGI/SpEL)");
        }
        /* 7d. Enterprise OGNL (Confluence / Struts WebWork) */
        if (scan_patterns(url_s, url_l, enterprise_ognl_patterns) ||
            scan_patterns(body_s, body_l, enterprise_ognl_patterns)) {
            add_match(&r, WAF_CAT_SHELLCMD, 10,
                      "Enterprise OGNL (Confluence/Struts WebWork)");
        }
    }

    /* ── 8. Tarayıcı / Scanner Tespiti (User-Agent) ──────────── */
    if (g_waf_cfg.scanner_detect_enabled && ua_l > 0) {
        if (scan_patterns(ua_s, ua_l, scanner_ua_patterns)) {
            add_match(&r, WAF_CAT_SCANNER, 7, "Bilinen saldiri tarayicisi User-Agent");
        }
        /* Boş User-Agent → otomatik bot imzası */
        if (ua_l == 0 || (ua_l == 1 && ua_s[0] == '-')) {
            add_match(&r, WAF_CAT_SCANNER, 3, "Bos User-Agent (bot/crawler imzasi)");
        }
    }

    /* ── 9. HTTP Method Kötüye Kullanım ─────────────────────── */
    if (g_waf_cfg.method_abuse_enabled && method) {
        for (int i = 0; abused_methods[i]; i++) {
            if (strcasecmp(method, abused_methods[i]) == 0) {
                add_match(&r, WAF_CAT_METHOD_ABUSE, 4,
                          "Kötüye kullanilan HTTP metodu");
                break;
            }
        }
    }

    /* ── 10. IDOR Tarama Tespiti ─────────────────────────────── */
    if (g_waf_cfg.idor_enabled) {
        if (detect_idor_pattern(url)) {
            /* Düşük puan: tek başına karar vermez, bağlam gerekir */
            add_match(&r, WAF_CAT_IDOR, 2, "Sayisal ID tarama pattern (IDOR adayi)");
        }
    }

    return r;
}

int waf_should_ban(const WafResult *r) {
    if (!r || !g_waf_cfg.enabled) return 0;
    return r->total_score >= g_waf_cfg.ban_threshold;
}

const char *waf_category_str(WafCategory cat) {
    switch (cat) {
        case WAF_CAT_LFI:             return "LFI/PathTraversal";
        case WAF_CAT_RFI:             return "RFI";
        case WAF_CAT_PATH_TRAV:       return "PathTraversal";
        case WAF_CAT_SSRF:            return "SSRF";
        case WAF_CAT_XXE:             return "XXE";
        case WAF_CAT_XSS:             return "XSS";
        case WAF_CAT_SCANNER:         return "Scanner/Bot";
        case WAF_CAT_METHOD_ABUSE:    return "MethodAbuse";
        case WAF_CAT_SHELLCMD:        return "OsCommandInjection";
        case WAF_CAT_IDOR:            return "IDOR";
        case WAF_CAT_SCHEMA_VIOLATION:return "SchemaViolation";
        case WAF_CAT_WASM_BLOCK:      return "WasmPluginBlock";
        default:                      return "Unknown";
    }
}

/* ── waf_analyze_full: Schema → Wasm → Klasik WAF (Feature 1 & 4) ── */
/* Cookie / Host alanlarından header JSON üret (OpenAPI v2) */
static void build_headers_json(StrView ua, StrView host, StrView cookie,
                               char *out, size_t out_sz)
{
    if (!out || out_sz < 4) return;
    size_t n = 0;
    out[n++] = '{';
    int first = 1;

    if (ua.ptr && ua.len > 0) {
        if (!first && n + 1 < out_sz) out[n++] = ',';
        first = 0;
        n += snprintf(out + n, out_sz - n, "\"User-Agent\":\"");
        for (size_t i = 0; i < ua.len && n + 2 < out_sz; i++) {
            char c = ua.ptr[i];
            if (c == '"' || c == '\\') out[n++] = '\\';
            if (n + 1 < out_sz) out[n++] = c;
        }
        if (n + 1 < out_sz) out[n++] = '"';
    }
    if (host.ptr && host.len > 0) {
        if (!first && n + 1 < out_sz) out[n++] = ',';
        first = 0;
        n += snprintf(out + n, out_sz - n, "\"Host\":\"");
        for (size_t i = 0; i < host.len && n + 2 < out_sz; i++) {
            char c = host.ptr[i];
            if (c == '"' || c == '\\') out[n++] = '\\';
            if (n + 1 < out_sz) out[n++] = c;
        }
        if (n + 1 < out_sz) out[n++] = '"';
    }
    if (cookie.ptr && cookie.len > 0) {
        char buf[512];
        size_t cl = cookie.len < sizeof(buf) - 1 ? cookie.len : sizeof(buf) - 1;
        memcpy(buf, cookie.ptr, cl);
        buf[cl] = '\0';
        char *tok = strtok(buf, ";");
        while (tok) {
            while (*tok == ' ') tok++;
            char *eq = strchr(tok, '=');
            if (eq) {
                *eq = '\0';
                char *key = tok;
                char *val = eq + 1;
                while (*key == ' ') key++;
                if (key[0]) {
                    if (!first && n + 1 < out_sz) out[n++] = ',';
                    first = 0;
                    n += snprintf(out + n, out_sz - n, "\"%s\":\"", key);
                    for (const char *v = val; *v && n + 2 < out_sz; v++) {
                        if (*v == '"' || *v == '\\') out[n++] = '\\';
                        out[n++] = *v;
                    }
                    if (n + 1 < out_sz) out[n++] = '"';
                }
            }
            tok = strtok(NULL, ";");
        }
    }
    if (n + 1 < out_sz) out[n++] = '}';
    out[n] = '\0';
}

WafResult waf_analyze_full(StrView url, StrView body, StrView user_agent,
                           const char *method, const char *path,
                           const char *src_ip,
                           StrView host, StrView cookie) {
    WafResult r;
    memset(&r, 0, sizeof(r));

    /* ── Aşama 1: OpenAPI Schema Firewall ───────────────────────── */
    if (schema_is_loaded()) {
        char headers_json[1024];
        build_headers_json(user_agent, host, cookie,
                           headers_json, sizeof(headers_json));
        char url_path[1024] = {0};
        if (url.ptr && url.len > 0) {
            size_t cp = url.len < sizeof(url_path) - 1 ? url.len : sizeof(url_path) - 1;
            memcpy(url_path, url.ptr, cp);
            url_path[cp] = '\0';
        }
        const char *schema_path = url_path[0] ? url_path : path;
        SchemaValidationResult sv = schema_validate_request_v2(
            method, schema_path,
            body.ptr, body.len,
            src_ip,
            headers_json, strlen(headers_json));

        if (sv.status == SCHEMA_BLOCK) {
            add_match(&r, WAF_CAT_SCHEMA_VIOLATION, 15, sv.reason);
            /* Erken dönüş: şema ihlali kesin red */
            return r;
        } else if (sv.status == SCHEMA_WARN) {
            if (schema_strict_mode() && sv.idor_score >= 80) {
                add_match(&r, WAF_CAT_SCHEMA_VIOLATION, 15,
                          "BOLA/IDOR strict block");
                return r;
            }
            add_match(&r, WAF_CAT_SCHEMA_VIOLATION, 5, sv.reason);
            if (sv.idor_score >= 80)
                add_match(&r, WAF_CAT_IDOR, sv.idor_score / 20, "BOLA/IDOR pattern");
        }
    }

    /* ── Aşama 2: Wasm Plugin Analizi ─────────────────────────── */
    {
        char req_json[2048];
        size_t url_copy = url.len;
        if (url_copy > 512) url_copy = 512;
        snprintf(req_json, sizeof(req_json),
            "{\"method\":\"%s\",\"path\":\"%s\",\"url\":\"%.*s\",\"src_ip\":\"%s\","
            "\"url_len\":%zu,\"body_len\":%zu}",
            method ? method : "",
            path   ? path   : "",
            (int)url_copy, url.ptr ? url.ptr : "",
            src_ip ? src_ip : "",
            url.len, body.len);

        char wasm_reason[128] = {0};
        WasmVerdict verdict = wasm_plugin_analyze(req_json, wasm_reason, sizeof(wasm_reason));
        if (verdict == WASM_VERDICT_BLOCK) {
            add_match(&r, WAF_CAT_WASM_BLOCK, 20, wasm_reason[0] ? wasm_reason : "Wasm plugin blocked");
            return r;
        } else if (verdict == WASM_VERDICT_TARPIT) {
            add_match(&r, WAF_CAT_WASM_BLOCK, 8, "Wasm plugin: tarpit");
        }
    }

    /* ── Aşama 3: Klasik WAF Kural Motoru ────────────────────── */
    WafResult classic = waf_analyze(url, body, user_agent, method);
    /* Sonuçları birleştir */
    r.total_score += classic.total_score;
    for (int i = 0; i < classic.match_count && r.match_count < 8; i++)
        r.matches[r.match_count++] = classic.matches[i];
    if (classic.dominant != WAF_CAT_NONE)
        r.dominant = classic.dominant;

    return r;
}
