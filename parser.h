#ifndef PARSER_H
#define PARSER_H

#include <stddef.h>
#include <stdint.h>
#include <time.h>

// String view — kopyalama yok; orijinal bellege pointer + uzunluk
typedef struct {
    const char *ptr;
    size_t      len;
} StrView;

// Nginx/Apache combined log formati:
//   IP - - [timestamp] "METHOD URL HTTP/x.x" status bytes "ref" "ua"
typedef struct {
    StrView  ip;
    StrView  method;
    StrView  url;
    StrView  protocol;
    int      status;
    long     bytes;
    long     response_ms;  // yanit suresi (log'da varsa)
    long     resp_bytes;   // yanit govdesi boyutu (covert channel)
    time_t   ts;           // Unix timestamp
    StrView  xff;          // X-Forwarded-For
    StrView  body;         // İstek gövdesi (varsa)
    StrView  cookie;       // Cookie başlığı (covert channel tespiti)
    StrView  host;         // Host başlığı (DNS tüneli tespiti)
    StrView  user_agent;   // User-Agent (JA3 cross-reference)
} LogEntry;

// DFA parser durumlari
typedef enum {
    ST_IP_START=0, ST_IP,
    ST_SKIP_IDENT, ST_SKIP_AUTH,
    ST_BRACKET,    ST_TIMESTAMP,
    ST_METHOD,     ST_URL,
    ST_PROTOCOL,   ST_STATUS,
    ST_BYTES,      
    ST_SKIP_REF,
    ST_UA,
    ST_XFF,
    ST_BODY,
    ST_COOKIE,
    ST_HOST,
    ST_DONE, ST_ERROR
} ParserState;

// Tek bir log satirini ayristirir (zero-copy)
int parse_log_line(const char *line, size_t line_len, LogEntry *out);

// Timestamp string'ini parse eder: "10/Oct/2023:13:55:36 +0000" -> time_t
time_t parse_timestamp(StrView ts);

int sv_eq_lit(StrView sv, const char *lit);
int sv_contains(StrView sv, const char *needle, size_t nlen);

// AVX2 ile hizli newline arama
const char *find_newline_avx2(const char *ptr, const char *end);

/* URL/path'ten sorgu (#, ?) kirp; nginx log path eslestirmesi icin */
size_t url_path_only(const char *url, size_t url_len, char *out, size_t out_sz);

#endif /* PARSER_H */