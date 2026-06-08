#define _GNU_SOURCE
#include "parser.h"
#include "ip_map.h"
#include <string.h>
#include <strings.h>
#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <immintrin.h>

#define IS_DIGIT(c)  ((c) >= '0' && (c) <= '9')
#define IS_SPACE(c)  ((c) == ' '  || (c) == '\t')

int sv_eq_lit(StrView sv, const char *lit) {
    size_t n = strlen(lit);
    return sv.len == n && memcmp(sv.ptr, lit, n) == 0;
}

int sv_contains(StrView sv, const char *needle, size_t nlen) {
    if (!nlen || sv.len < nlen) return 0;
    size_t limit = sv.len - nlen;
    for (size_t i = 0; i <= limit; i++)
        if (memcmp(sv.ptr + i, needle, nlen) == 0) return 1;
    return 0;
}

size_t url_path_only(const char *url, size_t url_len, char *out, size_t out_sz)
{
    if (!out || out_sz == 0) return 0;
    out[0] = '\0';
    if (!url || url_len == 0) return 0;

    size_t n = url_len;
    if (n >= out_sz) n = out_sz - 1;
    memcpy(out, url, n);
    out[n] = '\0';

    char *q = strchr(out, '?');
    if (q) *q = '\0';
    char *h = strchr(out, '#');
    if (h) *h = '\0';
    return strlen(out);
}

static const char *month_names[] = {
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
};

time_t parse_timestamp(StrView ts) {
    if (ts.len < 20) return 0;
    struct tm t = {0};
    const char *p   = ts.ptr;
    const char *end = ts.ptr + ts.len;

    while (p < end && IS_DIGIT(*p)) { t.tm_mday = t.tm_mday * 10 + (*p - '0'); p++; }
    if (p >= end || *p != '/') return 0;
    p++;

    char mon[4] = {0};
    for (int i = 0; i < 3 && p < end && *p && *p != '/'; i++, p++) mon[i] = *p;
    if (p >= end || *p != '/') return 0;
    p++;
    t.tm_mon = -1;
    for (int i = 0; i < 12; i++)
        if (strncasecmp(mon, month_names[i], 3) == 0) { t.tm_mon = i; break; }
    if (t.tm_mon < 0) return 0;

    while (p < end && IS_DIGIT(*p)) { t.tm_year = t.tm_year * 10 + (*p - '0'); p++; }
    t.tm_year -= 1900;
    if (p >= end || *p != ':') return 0;
    p++;

    while (p < end && IS_DIGIT(*p)) { t.tm_hour = t.tm_hour * 10 + (*p - '0'); p++; }
    if (p >= end || *p != ':') return 0; p++;
    while (p < end && IS_DIGIT(*p)) { t.tm_min  = t.tm_min  * 10 + (*p - '0'); p++; }
    if (p >= end || *p != ':') return 0; p++;
    while (p < end && IS_DIGIT(*p)) { t.tm_sec  = t.tm_sec  * 10 + (*p - '0'); p++; }

    t.tm_isdst = -1;
    time_t utc = timegm(&t);
    if (utc <= 0) return 0;

    while (p < end && IS_SPACE(*p)) p++;
    if (p + 5 <= end && (*p == '+' || *p == '-')) {
        int sign = (*p == '+') ? 1 : -1;
        int hh = 0, mm = 0;
        if (IS_DIGIT(*(p+1)) && IS_DIGIT(*(p+2)) && IS_DIGIT(*(p+3)) && IS_DIGIT(*(p+4))) {
            hh = (*(p+1) - '0') * 10 + (*(p+2) - '0');
            mm = (*(p+3) - '0') * 10 + (*(p+4) - '0');
            utc -= sign * (long)(hh * 3600 + mm * 60);
        }
    }
    return utc;
}

/*
 * strip_ipv6_brackets: "[2001:db8::1]" → "2001:db8::1"
 * Tampon ip_buf'a yazar; orijinal pointer'ı değiştirmez.
 * Pointer döner, köşeli parantez yoksa orijinal ptr döner.
 */
static const char *strip_ipv6_brackets(const char *ptr, size_t len,
                                       char *ip_buf, size_t buf_cap,
                                       size_t *out_len) {
    if (len >= 2 && ptr[0] == '[' && ptr[len-1] == ']') {
        size_t inner = len - 2;
        if (inner == 0 || inner >= buf_cap) {
            *out_len = len;
            return ptr;
        }
        memcpy(ip_buf, ptr + 1, inner);
        ip_buf[inner] = '\0';
        *out_len = inner;
        return ip_buf;
    }
    *out_len = len;
    return ptr;
}

/*
 * log_line_is_tampered: Log satırında null byte, raw CRLF (\r) veya
 * ANSI escape (\x1b) tespiti yapar. Bunlar log enjeksiyonu girişimini gösterir.
 */
/* nginx log_format: alan icindeki \" sekanslari — yalnizca escape edilmemis " kapatir */
static int is_unescaped_closing_quote(const char *field_start, const char *p)
{
    if (p < field_start || *p != '"') return 0;
    size_t bs = 0;
    const char *q = p - 1;
    while (q >= field_start && *q == '\\') {
        bs++;
        q--;
    }
    return (bs % 2) == 0;
}

static int log_line_is_tampered(const char *line, size_t len) {
    for (size_t i = 0; i < len; i++) {
        unsigned char c = (unsigned char)line[i];
        if (c == '\0' || c == '\r' || c == '\x1b') return 1;
    }
    return 0;
}

int parse_log_line(const char *line, size_t line_len, LogEntry *out) {
    if (!line || !line_len || !out) return -1;
    memset(out, 0, sizeof(*out));

    /* Log tampering koruması */
    if (log_line_is_tampered(line, line_len)) return -2;

    ParserState state    = ST_IP_START;
    const char *p        = line;
    const char *end      = line + line_len;
    const char *tok_start = p;
    char        ip_bracket_buf[IP_STR_LEN];

    while (p <= end && state != ST_DONE && state != ST_ERROR) {
        char c = (p < end) ? *p : '\0';
        switch (state) {

        case ST_IP_START:
            tok_start = p; state = ST_IP;
            /* fall-through */
        case ST_IP:
            if (c == ' ' || c == '\0') {
                /* IPv6 köşeli parantez temizleme */
                size_t clean_len;
                const char *clean = strip_ipv6_brackets(tok_start, (size_t)(p - tok_start),
                                                        ip_bracket_buf, sizeof(ip_bracket_buf),
                                                        &clean_len);
                out->ip.ptr = clean;
                out->ip.len = clean_len;
                state = ST_SKIP_IDENT; p++;
            } else p++;
            break;

        case ST_SKIP_IDENT:
            while (p < end && *p != ' ') p++;
            p++;
            state = ST_SKIP_AUTH;
            break;

        case ST_SKIP_AUTH:
            while (p < end && *p != ' ') p++;
            p++;
            state = ST_BRACKET;
            break;

        case ST_BRACKET:
            if      (c == '[') { tok_start = p + 1; state = ST_TIMESTAMP; p++; }
            else if (c == ' ')   p++;
            else                 state = ST_ERROR;
            break;

        case ST_TIMESTAMP:
            if (c == ']') {
                StrView tv = { tok_start, (size_t)(p - tok_start) };
                out->ts = parse_timestamp(tv);
                state = ST_METHOD; p++;
                while (p < end && (*p == ' ' || *p == '"')) p++;
                tok_start = p;
            } else p++;
            break;

        case ST_METHOD:
            if (c == ' ' || c == '\0') {
                out->method.ptr = tok_start;
                out->method.len = (size_t)(p - tok_start);
                state = ST_URL; tok_start = p + 1; p++;
            } else p++;
            break;

        case ST_URL:
            if (c == ' ' || c == '"' || c == '\0') {
                out->url.ptr = tok_start;
                out->url.len = (size_t)(p - tok_start);
                state = ST_PROTOCOL; tok_start = p + 1; p++;
            } else p++;
            break;

        case ST_PROTOCOL:
            if (c == '"' || c == ' ' || c == '\0') {
                out->protocol.ptr = tok_start;
                out->protocol.len = (size_t)(p - tok_start);
                while (p < end && (*p == '"' || *p == ' ')) p++;
                tok_start = p; state = ST_STATUS;
            } else p++;
            break;

        case ST_STATUS:
            if (IS_DIGIT(c)) { out->status = out->status * 10 + (c - '0'); p++; }
            else { while (p < end && *p == ' ') p++; tok_start = p; state = ST_BYTES; }
            break;

        case ST_BYTES:
            if (IS_DIGIT(c)) { out->bytes = out->bytes * 10 + (c - '0'); p++; }
            else {
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') state = ST_SKIP_REF;
                else state = ST_DONE;
            }
            break;

        case ST_SKIP_REF:
            if (c == '"') {
                p++;
                while (p < end && *p != '"') { if (*p == '\\' && p+1 < end) p++; p++; }
                if (p < end && *p == '"') p++;
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') { state = ST_UA; tok_start = p + 1; p++; }
                else state = ST_DONE;
            } else state = ST_ERROR;
            break;

        case ST_UA:
            if (c == '"' && is_unescaped_closing_quote(tok_start, p)) {
                out->user_agent.ptr = tok_start;
                out->user_agent.len = (size_t)(p - tok_start);
                p++;
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') { state = ST_XFF; tok_start = p + 1; p++; }
                else state = ST_DONE;
            } else p++;
            break;

        case ST_XFF:
            if (c == '"' && is_unescaped_closing_quote(tok_start, p)) {
                out->xff.ptr = tok_start;
                out->xff.len = (size_t)(p - tok_start);
                p++;
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') {
                    state = ST_BODY;
                    tok_start = p + 1;
                    p++;
                } else {
                    state = ST_DONE;
                }
            } else p++;
            break;

        case ST_BODY:
            if (c == '"' && is_unescaped_closing_quote(tok_start, p)) {
                out->body.ptr = tok_start;
                out->body.len = (size_t)(p - tok_start);

                if (out->body.len == 1 && out->body.ptr[0] == '-') {
                    out->body.len = 0; out->body.ptr = NULL;
                } else if (out->body.len > 0 && out->body.ptr[0] == '/') {
                    out->body.len = 0; out->body.ptr = NULL;
                }

                p++;
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') { state = ST_COOKIE; tok_start = p + 1; p++; }
                else state = ST_DONE;
            } else p++;
            break;

        case ST_COOKIE:
            if (c == '"' && is_unescaped_closing_quote(tok_start, p)) {
                out->cookie.ptr = tok_start;
                out->cookie.len = (size_t)(p - tok_start);
                if (out->cookie.len == 1 && out->cookie.ptr[0] == '-') {
                    out->cookie.len = 0; out->cookie.ptr = NULL;
                }

                p++;
                while (p < end && *p == ' ') p++;
                if (p < end && *p == '"') { state = ST_HOST; tok_start = p + 1; p++; }
                else state = ST_DONE;
            } else p++;
            break;

        case ST_HOST:
            if (c == '"' && is_unescaped_closing_quote(tok_start, p)) {
                out->host.ptr = tok_start;
                out->host.len = (size_t)(p - tok_start);
                if (out->host.len == 1 && out->host.ptr[0] == '-') {
                    out->host.len = 0; out->host.ptr = NULL;
                }

                state = ST_DONE;
                p++;
            } else p++;
            break;

        default: state = ST_ERROR; break;
        }
    }

    if (state == ST_ERROR)                       return -1;
    if (!out->ip.len || !out->ts)                return -1;
    if (!out->method.len || !out->url.len)       return -1;
    if (out->status < 100 || out->status > 599)  return -1;
    out->resp_bytes = out->bytes;

    /* X-Forwarded-For: gerçek client IP'yi al */
    if (out->xff.len > 0 && out->xff.ptr[0] != '-') {
        const char *xp   = out->xff.ptr;
        size_t      xlen = 0;
        while (xlen < out->xff.len && xp[xlen] != ',' && xp[xlen] != ' ') xlen++;
        if (xlen > 0) {
            /* IPv6 köşeli parantez temizleme (XFF'de de gelebilir) */
            static char xff_ip_buf[IP_STR_LEN];
            size_t clean_len;
            const char *clean = strip_ipv6_brackets(xp, xlen,
                                                    xff_ip_buf, sizeof(xff_ip_buf),
                                                    &clean_len);
            out->ip.ptr = clean;
            out->ip.len = clean_len;
        }
    }

    return 0;
}

const char *find_newline_avx2(const char *ptr, const char *end) {
    __m256i newline = _mm256_set1_epi8('\n');

    while (ptr + 32 <= end) {
        __m256i chunk = _mm256_loadu_si256((const __m256i *)ptr);
        __m256i cmp = _mm256_cmpeq_epi8(chunk, newline);
        int mask = _mm256_movemask_epi8(cmp);

        if (mask != 0) {
            return ptr + __builtin_ctz(mask);
        }
        ptr += 32;
    }
    
    while (ptr < end) {
        if (*ptr == '\n') return ptr;
        ptr++;
    }
    return end;
}