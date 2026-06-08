#define PCRE2_CODE_UNIT_WIDTH 8
#include "pcre_engine.h"
#include <pcre2.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdatomic.h>

#define MAX_PATTERNS PCRE_MAX_PATTERNS
#define PATTERN_LINE_MAX 512
#define CRS_PREFIX      "CRS_REGEX="
#define CRS_PREFIX_LEN  10
#define REGEX_PREFIX    "REGEX_PATTERN="
#define REGEX_PREFIX_LEN 14

typedef struct {
    pcre2_code       *re;
    char              pattern[PATTERN_LINE_MAX];
} CompiledPattern;

static CompiledPattern g_patterns[MAX_PATTERNS];
static int             g_pattern_count = 0;
static int             g_crs_pattern_count = 0;
static char            g_crs_path[512]     = "";
static int             g_pcre_quiet        = 0;
static pcre2_match_context *g_match_context = NULL;

static pthread_key_t tls_match_data_key;
static pthread_once_t tls_init_once = PTHREAD_ONCE_INIT;

/* RWLock for safe reloading and Generation Counter to track stale TLS data */
static pthread_rwlock_t g_pcre_rwlock = PTHREAD_RWLOCK_INITIALIZER;
static _Atomic int g_pcre_generation = 0;

typedef struct {
    pcre2_match_data **mdata_array;
    int generation;
} TlsMatchData;

static void tls_destroy_match_data(void *ptr) {
    TlsMatchData *tls_data = (TlsMatchData *)ptr;
    if (tls_data) {
        if (tls_data->mdata_array) {
            for (int i = 0; i < MAX_PATTERNS; i++) {
                if (tls_data->mdata_array[i]) {
                    pcre2_match_data_free(tls_data->mdata_array[i]);
                }
            }
            free(tls_data->mdata_array);
        }
        free(tls_data);
    }
}

static void tls_init_routine(void) {
    pthread_key_create(&tls_match_data_key, tls_destroy_match_data);
}

static void free_patterns(void) {
    for (int i = 0; i < g_pattern_count; i++) {
        if (g_patterns[i].re) {
            pcre2_code_free(g_patterns[i].re);
            g_patterns[i].re = NULL;
        }
    }
    g_pattern_count = 0;
    g_crs_pattern_count = 0;
}

static int compile_and_add_pattern(const char *val, int is_crs)
{
    if (!val || !*val || g_pattern_count >= MAX_PATTERNS) return 0;

    PCRE2_SIZE erroffset;
    int        errcode;
    pcre2_code *re = pcre2_compile(
        (PCRE2_SPTR)val,
        PCRE2_ZERO_TERMINATED,
        PCRE2_CASELESS | PCRE2_UTF,
        &errcode,
        &erroffset,
        NULL
    );
    if (!re) {
        PCRE2_UCHAR errbuf[256];
        pcre2_get_error_message(errcode, errbuf, sizeof(errbuf));
        fprintf(stderr, "[PCRE2] Derleme hatasi (offset %zu): %s  pattern: %.80s...\n",
                erroffset, (char *)errbuf, val);
        return 0;
    }

    int jit_rc = pcre2_jit_compile(re, PCRE2_JIT_COMPLETE);
    if (jit_rc != 0)
        fprintf(stderr, "[PCRE2] JIT yok (interpreter): %.60s...\n", val);

    int idx = g_pattern_count++;
    g_patterns[idx].re = re;
    strncpy(g_patterns[idx].pattern, val, PATTERN_LINE_MAX - 1);
    g_patterns[idx].pattern[PATTERN_LINE_MAX - 1] = '\0';
    if (is_crs) g_crs_pattern_count++;
    return 1;
}

static int load_patterns_from_file(const char *rules_path, const char *prefix, int prefix_len)
{
    if (!rules_path || !prefix) return 0;
    FILE *fp = fopen(rules_path, "r");
    if (!fp) return 0;

    char line[PATTERN_LINE_MAX];
    int loaded = 0;

    while (fgets(line, sizeof(line), fp) && g_pattern_count < MAX_PATTERNS) {
        if (strncmp(line, prefix, (size_t)prefix_len) != 0) continue;

        char *val = line + prefix_len;
        /* Satır sonu temizle */
        size_t vlen = strlen(val);
        while (vlen > 0 && (val[vlen-1] == '\n' || val[vlen-1] == '\r' || val[vlen-1] == ' '))
            val[--vlen] = '\0';
        if (vlen == 0 || vlen >= PATTERN_LINE_MAX) continue;

        if (compile_and_add_pattern(val, strcmp(prefix, CRS_PREFIX) == 0))
            loaded++;
    }
    fclose(fp);
    return loaded;
}

int pcre_engine_init(const char *rules_path) {
    if (!g_match_context) {
        g_match_context = pcre2_match_context_create(NULL);
        pcre2_set_match_limit(g_match_context, 10000);
        pcre2_set_depth_limit(g_match_context, 10000);
    }
    free_patterns();
    int n = load_patterns_from_file(rules_path, REGEX_PREFIX, REGEX_PREFIX_LEN);
    if (n > 0)
        fprintf(stderr, "[PCRE2] %d ozel regex JIT derlendi.\n", n);
    return n;
}

int pcre_engine_set_quiet(int quiet)
{
    g_pcre_quiet = quiet ? 1 : 0;
    return 0;
}

int pcre_engine_load_crs(const char *crs_path)
{
    if (!crs_path || crs_path[0] == '\0') return 0;
    strncpy(g_crs_path, crs_path, sizeof(g_crs_path) - 1);
    g_crs_path[sizeof(g_crs_path) - 1] = '\0';
    int before = g_crs_pattern_count;
    int n = load_patterns_from_file(crs_path, CRS_PREFIX, CRS_PREFIX_LEN);
    int added = g_crs_pattern_count - before;
    if (n > 0 && !g_pcre_quiet)
        fprintf(stderr, "[CRS] %d OWASP regex yuklendi (toplam=%d).\n",
                added, g_pattern_count);
    return n;
}

/*
 * pcre_engine_match: Thread-Local Storage kullanarak Lock-Free eşleştirme
 */
int pcre_engine_match(StrView url) {
    pthread_rwlock_rdlock(&g_pcre_rwlock);
    
    if (!url.ptr || url.len == 0 || g_pattern_count == 0) {
        pthread_rwlock_unlock(&g_pcre_rwlock);
        return 0;
    }

    pthread_once(&tls_init_once, tls_init_routine);
    TlsMatchData *tls_data = pthread_getspecific(tls_match_data_key);

    int current_generation = atomic_load(&g_pcre_generation);

    /* If TLS data doesn't exist or is from an older generation, recreate it */
    if (!tls_data || tls_data->generation != current_generation) {
        if (tls_data) {
            tls_destroy_match_data(tls_data);
        }
        
        tls_data = calloc(1, sizeof(TlsMatchData));
        tls_data->mdata_array = calloc(MAX_PATTERNS, sizeof(pcre2_match_data *));
        for (int i = 0; i < g_pattern_count; i++) {
            tls_data->mdata_array[i] = pcre2_match_data_create_from_pattern(g_patterns[i].re, NULL);
        }
        tls_data->generation = current_generation;
        pthread_setspecific(tls_match_data_key, tls_data);
    }

    int matched = 0;
    for (int i = 0; i < g_pattern_count && !matched; i++) {
        int rc = pcre2_match(
            g_patterns[i].re,
            (PCRE2_SPTR)url.ptr,
            (PCRE2_SIZE)url.len,
            0, 0,
            tls_data->mdata_array[i],
            g_match_context
        );
        if (rc >= 0) matched = 1;
    }
    
    pthread_rwlock_unlock(&g_pcre_rwlock);
    return matched;
}

void pcre_engine_reload(const char *rules_path) {
    pthread_rwlock_wrlock(&g_pcre_rwlock);

    free_patterns();
    int n = load_patterns_from_file(rules_path, REGEX_PREFIX, REGEX_PREFIX_LEN);
    if (g_crs_path[0])
        n += load_patterns_from_file(g_crs_path, CRS_PREFIX, CRS_PREFIX_LEN);
    atomic_fetch_add(&g_pcre_generation, 1);

    pthread_rwlock_unlock(&g_pcre_rwlock);

    if (!g_pcre_quiet)
        fprintf(stderr, "[PCRE2] Hot-reload: %d regex (CRS dahil) JIT derlendi.\n", n);
}

void pcre_engine_destroy(void) {
    free_patterns();
    if (g_match_context) {
        pcre2_match_context_free(g_match_context);
        g_match_context = NULL;
    }
}

int pcre_engine_pattern_count(void) {
    return g_pattern_count;
}

int pcre_engine_crs_pattern_count(void) {
    return g_crs_pattern_count;
}
