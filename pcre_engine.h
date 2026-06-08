#ifndef PCRE_ENGINE_H
#define PCRE_ENGINE_H

#include "parser.h"
#include <stddef.h>

/* JIT derlemeli PCRE2 regex motoru.
 * Kurallar program başında bir kez derlenir; SIGHUP ile yeniden yüklenir. */

#define PCRE_MAX_PATTERNS 384

int  pcre_engine_init(const char *rules_path);
/* OWASP CRS / ek rules dosyasi (CRS_REGEX= satirlari) */
int  pcre_engine_load_crs(const char *crs_path);
int  pcre_engine_match(StrView url);      /* 1=eşleşti, 0=temiz */
void pcre_engine_reload(const char *rules_path);
void pcre_engine_destroy(void);

int  pcre_engine_set_quiet(int quiet);
int  pcre_engine_pattern_count(void);
int  pcre_engine_crs_pattern_count(void);

#endif /* PCRE_ENGINE_H */
