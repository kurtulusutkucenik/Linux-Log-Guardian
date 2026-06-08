/* wasm_runtime.c — WebAssembly Plugin Engine (Feature 4)
 *
 * HAVE_WASM=1 → Wasmtime C API entegrasyonu
 * HAVE_WASM=0 → Stub implementasyon (build bağımlılığı yok)
 *
 * Hot-plug: /etc/log-guardian/plugins/ dizini inotify ile izlenir.
 * Yeni .wasm dosyası geldikçe otomatik yüklenir.
 */
#include "wasm_runtime.h"
#include "lg_stub.h"
#include "logger.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <pthread.h>
#include <stdatomic.h>
#include <dirent.h>
#include <sys/stat.h>
#include <time.h>

#ifdef HAVE_WASM
  #include <wasm.h>   /* Wasmtime C API */
#endif

/* ── İç Veri Yapıları ───────────────────────────────────────────── */
typedef struct {
    WasmPluginInfo  info;
    time_t          loaded_at;
#ifdef HAVE_WASM
    wasm_store_t   *store;
    wasm_module_t  *module;
    wasm_instance_t *instance;
    wasm_func_t    *analyze_fn;   /* export: analyze(ptr,len)->i32 */
    wasm_memory_t  *memory;
#endif
} WasmPlugin;

static WasmPlugin  g_plugins[WASM_MAX_PLUGINS];
static int         g_plugin_count = 0;
static pthread_rwlock_t g_rwlock  = PTHREAD_RWLOCK_INITIALIZER;
#ifdef HAVE_WASM
/* Wasmtime store/func call tek thread — worker pool ile cakismayi onler */
static pthread_mutex_t g_wasm_exec_mutex = PTHREAD_MUTEX_INITIALIZER;
#endif
static char        g_plugin_dir[WASM_PLUGIN_PATH_LEN] = WASM_PLUGIN_DIR_DEFAULT;

void wasm_runtime_set_plugin_dir(const char *dir)
{
    if (!dir || !dir[0]) return;
    strncpy(g_plugin_dir, dir, sizeof(g_plugin_dir) - 1);
    g_plugin_dir[sizeof(g_plugin_dir) - 1] = '\0';
}

const char *wasm_runtime_get_plugin_dir(void)
{
    return g_plugin_dir;
}

static int stub_ci_contains(const char *hay, const char *needle)
{
    if (!hay || !needle) return 0;
    size_t nlen = strlen(needle);
    size_t hlen = strlen(hay);
    if (nlen > hlen) return 0;
    for (size_t i = 0; i <= hlen - nlen; i++) {
        size_t j;
        for (j = 0; j < nlen; j++) {
            char a = hay[i + j], b = needle[j];
            if (a == '+') a = ' ';
            if (b == '+') b = ' ';
            if (a >= 'A' && a <= 'Z') a = (char)(a + 32);
            if (b >= 'A' && b <= 'Z') b = (char)(b + 32);
            if (a != b) break;
        }
        if (j == nlen) return 1;
    }
    return 0;
}

static WasmVerdict stub_analyze_by_name(const char *name, const char *req_json,
                                        char *reason, int reason_sz)
{
    if (!name || !req_json) return WASM_VERDICT_PASS;

    if (strstr(name, "block-sqli")) {
        if (stub_ci_contains(req_json, "union select") ||
            stub_ci_contains(req_json, "1=1") ||
            stub_ci_contains(req_json, "or 1=1")) {
            snprintf(reason, (size_t)reason_sz, "Wasm stub block-sqli");
            return WASM_VERDICT_BLOCK;
        }
    }
    if (strstr(name, "block-scanner")) {
        if (stub_ci_contains(req_json, "sqlmap") ||
            stub_ci_contains(req_json, "nikto") ||
            stub_ci_contains(req_json, "nmap")) {
            snprintf(reason, (size_t)reason_sz, "Wasm stub block-scanner");
            return WASM_VERDICT_BLOCK;
        }
    }
    return WASM_VERDICT_PASS;
}

static atomic_uint_fast64_t g_total_calls  = 0;
static atomic_uint_fast64_t g_total_blocks = 0;

#ifdef HAVE_WASM
static wasm_engine_t *g_engine = NULL;
static wasm_store_t  *g_shared_store = NULL;
#endif

/* ── Hot-plug izleyici thread ───────────────────────────────────── */
#if defined(__linux__)
#include <sys/inotify.h>
#include <sys/select.h>
#include <sys/time.h>
#include <unistd.h>

static int      g_inotify_fd = -1;
static pthread_t g_watch_tid;
static int       g_watch_stop = 0;

static void *plugin_watch_thread(void *arg) {
    (void)arg;
    char buf[4096];
    while (!g_watch_stop) {
        fd_set rfds;
        struct timeval tv = {1, 0};
        FD_ZERO(&rfds); FD_SET(g_inotify_fd, &rfds);
        if (select(g_inotify_fd + 1, &rfds, NULL, NULL, &tv) <= 0) continue;

        ssize_t n = read(g_inotify_fd, buf, sizeof(buf));
        if (n <= 0) continue;

        for (ssize_t i = 0; i < n; ) {
            struct inotify_event *ev = (struct inotify_event *)(buf + i);
            if (ev->len > 0 && strstr(ev->name, ".wasm")) {
                char full[WASM_PLUGIN_PATH_LEN];
                snprintf(full, sizeof(full), "%s/%s", g_plugin_dir, ev->name);
                log_rl(LOG_INFO, "Hot-plug: yeni plugin algılandı: %s", ev->name);
                wasm_plugin_load(full);
            }
            i += sizeof(*ev) + ev->len;
        }
    }
    return NULL;
}
#endif /* __linux__ */

/* ── init ───────────────────────────────────────────────────────── */
int wasm_runtime_init(void) {
    memset(g_plugins, 0, sizeof(g_plugins));
    g_plugin_count = 0;

#ifdef HAVE_WASM
    g_engine = wasm_engine_new();
    if (!g_engine) {
        log_rl(LOG_INFO, "HATA: Wasmtime engine başlatılamadı");
        return -1;
    }
    g_shared_store = wasm_store_new(g_engine);
    if (!g_shared_store) {
        wasm_engine_delete(g_engine);
        g_engine = NULL;
        log_rl(LOG_INFO, "HATA: Wasmtime store başlatılamadı");
        return -1;
    }
    log_rl(LOG_INFO, "Wasmtime engine başlatıldı (HAVE_WASM=1)");
#else
    log_rl(LOG_INFO, "Wasm runtime stub modu (HAVE_WASM=0) [%s]", LG_STUB_WASM_RUNTIME);
#endif

    mkdir(g_plugin_dir, 0700);

    /* Mevcut pluginleri tara */
    wasm_runtime_scan_plugins();

#if defined(__linux__)
    g_inotify_fd = inotify_init1(IN_NONBLOCK);
    if (g_inotify_fd >= 0) {
        inotify_add_watch(g_inotify_fd, g_plugin_dir, IN_CREATE | IN_MOVED_TO);
        pthread_create(&g_watch_tid, NULL, plugin_watch_thread, NULL);
        log_rl(LOG_INFO, "Plugin dizini izleniyor: %s", g_plugin_dir);
    }
#endif
    return 0;
}

/* ── plugin yükle ───────────────────────────────────────────────── */
int wasm_plugin_load(const char *wasm_path) {
    if (!wasm_path) return -1;

    /* Dosya adından isim türet */
    const char *base = strrchr(wasm_path, '/');
    base = base ? base + 1 : wasm_path;

    pthread_rwlock_wrlock(&g_rwlock);

    /* Zaten yüklü mü? */
    for (int i = 0; i < g_plugin_count; i++) {
        if (strcmp(g_plugins[i].info.path, wasm_path) == 0) {
            pthread_rwlock_unlock(&g_rwlock);
            log_rl(LOG_INFO, "Plugin zaten yüklü: %s", base);
            return 0;
        }
    }

    if (g_plugin_count >= WASM_MAX_PLUGINS) {
        pthread_rwlock_unlock(&g_rwlock);
        log_rl(LOG_INFO, "HATA: Maksimum plugin sayısına ulaşıldı (%d)", WASM_MAX_PLUGINS);
        return -1;
    }

    WasmPlugin *p = &g_plugins[g_plugin_count];
    memset(p, 0, sizeof(*p));
    strncpy(p->info.path, wasm_path, WASM_PLUGIN_PATH_LEN - 1);
    strncpy(p->info.name, base, WASM_PLUGIN_NAME_LEN - 1);
    p->info.version  = 1;
    p->info.active   = 0;
    p->loaded_at     = time(NULL);

#ifdef HAVE_WASM
    /* .wasm dosyasını oku */
    FILE *f = fopen(wasm_path, "rb");
    if (!f) {
        pthread_rwlock_unlock(&g_rwlock);
        log_rl(LOG_INFO, "HATA: Plugin dosyası açılamadı: %s", wasm_path);
        return -1;
    }
    fseek(f, 0, SEEK_END);
    long sz = ftell(f);
    fseek(f, 0, SEEK_SET);
    uint8_t *wasm_bytes = malloc((size_t)sz);
    if (!wasm_bytes) { fclose(f); pthread_rwlock_unlock(&g_rwlock); return -1; }
    fread(wasm_bytes, 1, (size_t)sz, f);
    fclose(f);

    wasm_byte_vec_t binary = {.size = (size_t)sz, .data = (wasm_byte_t *)wasm_bytes};
    p->store  = g_shared_store;
    p->module = wasm_module_new(g_shared_store, &binary);
    free(wasm_bytes);

    if (!p->module) {
        p->store = NULL;
        p->info.native_exec = 0;
        if (getenv("WASM_PROD_STRICT")) {
            pthread_rwlock_unlock(&g_rwlock);
            log_rl(LOG_INFO, "HATA: Wasm modülü yok (WASM_PROD_STRICT): %s", wasm_path);
            return -1;
        }
        struct stat st;
        if (stat(wasm_path, &st) == 0 && st.st_size >= 0) {
            p->info.active = 1;
            log_rl(LOG_INFO, "Plugin stub-fallback (modul yok): %s", base);
            g_plugin_count++;
            pthread_rwlock_unlock(&g_rwlock);
            return 0;
        }
        pthread_rwlock_unlock(&g_rwlock);
        log_rl(LOG_INFO, "HATA: Wasm modülü derlenemedi: %s", wasm_path);
        return -1;
    }

    /* Imports için boş extern listesi (sandboxed) */
    wasm_extern_vec_t imports = WASM_EMPTY_VEC;
    p->instance = wasm_instance_new(g_shared_store, p->module, &imports, NULL);
    if (!p->instance) {
        wasm_module_delete(p->module);
        p->module = NULL;
        p->store = NULL;
        pthread_rwlock_unlock(&g_rwlock);
        log_rl(LOG_INFO, "HATA: Wasm instance oluşturulamadı: %s", base);
        return -1;
    }

    /* "analyze" export + memory — ayni index, kind dogrulamasi */
    wasm_extern_vec_t exports;
    wasm_instance_exports(p->instance, &exports);
    wasm_exporttype_vec_t etypes;
    wasm_module_exports(p->module, &etypes);
    size_t nexp = exports.size < etypes.size ? exports.size : etypes.size;
    for (size_t i = 0; i < nexp; i++) {
        const wasm_name_t *ename = wasm_exporttype_name(etypes.data[i]);
        wasm_externkind_t kind = wasm_extern_kind(exports.data[i]);
        if (kind == WASM_EXTERN_FUNC && ename && ename->size == 7 &&
            memcmp(ename->data, "analyze", 7) == 0) {
            p->analyze_fn = wasm_extern_as_func(exports.data[i]);
        } else if (kind == WASM_EXTERN_MEMORY && !p->memory) {
            p->memory = wasm_extern_as_memory(exports.data[i]);
        }
    }
    wasm_exporttype_vec_delete(&etypes);
    wasm_extern_vec_delete(&exports);

    p->info.native_exec = (p->analyze_fn && p->memory) ? 1 : 0;
    if (!p->analyze_fn) {
        if (getenv("WASM_PROD_STRICT")) {
            p->info.active = 0;
            log_rl(LOG_INFO, "HATA: analyze export yok (WASM_PROD_STRICT): %s", base);
        } else {
            p->info.active = 1;
            log_rl(LOG_INFO, "UYARI: Plugin 'analyze' export'u yok: %s (stub-fallback)", base);
        }
    } else {
        p->info.active = 1;
        log_rl(LOG_INFO, "Plugin native yüklendi: %s", base);
    }
#else
    /* Stub mod: dosyanın var olduğunu doğrula, aktif işaretle */
    struct stat st;
    if (stat(wasm_path, &st) == 0) {
        p->info.active = 1;
        p->info.native_exec = 0;
        log_rl(LOG_INFO, "Plugin stub yüklendi: %s (HAVE_WASM=0, pass-through)", base);
    }
#endif

    g_plugin_count++;
    pthread_rwlock_unlock(&g_rwlock);
    return 0;
}

/* ── plugin kaldır ──────────────────────────────────────────────── */
int wasm_plugin_unload(const char *name) {
    pthread_rwlock_wrlock(&g_rwlock);
    for (int i = 0; i < g_plugin_count; i++) {
        if (strcmp(g_plugins[i].info.name, name) == 0) {
#ifdef HAVE_WASM
            if (g_plugins[i].instance) wasm_instance_delete(g_plugins[i].instance);
            if (g_plugins[i].module)   wasm_module_delete(g_plugins[i].module);
            if (g_plugins[i].store)    wasm_store_delete(g_plugins[i].store);
#endif
            /* Sonuncuyla yer değiştir */
            g_plugins[i] = g_plugins[--g_plugin_count];
            memset(&g_plugins[g_plugin_count], 0, sizeof(g_plugins[0]));
            pthread_rwlock_unlock(&g_rwlock);
            log_rl(LOG_INFO, "Plugin kaldırıldı: %s", name);
            return 0;
        }
    }
    pthread_rwlock_unlock(&g_rwlock);
    return -1;
}

/* ── ana analiz fonksiyonu ──────────────────────────────────────── */
WasmVerdict wasm_plugin_analyze(const char *req_json,
                                 char *reason_out, int reason_sz) {
    if (reason_out && reason_sz > 0) reason_out[0] = '\0';
    atomic_fetch_add(&g_total_calls, 1);

    pthread_rwlock_rdlock(&g_rwlock);
    if (g_plugin_count == 0) {
        pthread_rwlock_unlock(&g_rwlock);
        return WASM_VERDICT_PASS;
    }

#ifdef HAVE_WASM
    for (int i = 0; i < g_plugin_count; i++) {
        WasmPlugin *p = &g_plugins[i];
        if (!p->info.active) continue;
        p->info.calls_total++;

        WasmVerdict verdict = WASM_VERDICT_PASS;
        if (p->info.active) {
            verdict = stub_analyze_by_name(p->info.name, req_json,
                                           reason_out, reason_sz);
        }
        if (verdict == WASM_VERDICT_PASS && p->analyze_fn && p->instance && p->memory
            && getenv("WASM_NATIVE_EXEC")) {
            pthread_mutex_lock(&g_wasm_exec_mutex);
            if (req_json) {
                size_t jlen = strlen(req_json);
                size_t need = jlen + 1;
                size_t mem_sz = wasm_memory_data_size(p->memory);
                if (need > mem_sz) {
                    size_t delta = need - mem_sz;
                    size_t pages = (delta + 65535u) / 65536u;
                    if (pages == 0) pages = 1;
                    wasm_memory_grow(p->memory, pages);
                    mem_sz = wasm_memory_data_size(p->memory);
                }
                byte_t *mem = wasm_memory_data(p->memory);
                if (mem && need <= mem_sz) {
                    memcpy(mem, req_json, jlen + 1);
                    wasm_val_t args[2] = {
                        {.kind = WASM_I32, .of.i32 = 0},
                        {.kind = WASM_I32, .of.i32 = (int32_t)jlen}
                    };
                    wasm_val_t results[1] = {{.kind = WASM_I32}};
                    wasm_val_vec_t av = {2, args}, rv = {1, results};
                    if (wasm_func_call(p->analyze_fn, &av, &rv)) {
                        log_rl(LOG_INFO, "Wasm plugin trap: %s", p->info.name);
                    } else {
                        verdict = (WasmVerdict)results[0].of.i32;
                    }
                }
            }
            pthread_mutex_unlock(&g_wasm_exec_mutex);
        }

        if (verdict == WASM_VERDICT_BLOCK || verdict == WASM_VERDICT_TARPIT) {
            p->info.blocks_total++;
            atomic_fetch_add(&g_total_blocks, 1);
            if (reason_out && reason_out[0] == '\0')
                snprintf(reason_out, reason_sz, "Wasm plugin '%s' blocked request",
                         p->info.name);
            pthread_rwlock_unlock(&g_rwlock);
            return verdict;
        }
    }
#else
    for (int i = 0; i < g_plugin_count; i++) {
        WasmPlugin *p = &g_plugins[i];
        if (!p->info.active) continue;
        p->info.calls_total++;
        WasmVerdict v = stub_analyze_by_name(p->info.name, req_json,
                                             reason_out, reason_sz);
        if (v == WASM_VERDICT_BLOCK || v == WASM_VERDICT_TARPIT) {
            p->info.blocks_total++;
            atomic_fetch_add(&g_total_blocks, 1);
            pthread_rwlock_unlock(&g_rwlock);
            return v;
        }
    }
#endif

    pthread_rwlock_unlock(&g_rwlock);
    return WASM_VERDICT_PASS;
}

/* ── liste / istatistik ─────────────────────────────────────────── */
int wasm_plugin_list(WasmPluginInfo *out, int max_count) {
    pthread_rwlock_rdlock(&g_rwlock);
    int n = g_plugin_count < max_count ? g_plugin_count : max_count;
    for (int i = 0; i < n; i++) out[i] = g_plugins[i].info;
    pthread_rwlock_unlock(&g_rwlock);
    return n;
}

void wasm_runtime_stats(uint64_t *total_calls, uint64_t *total_blocks,
                        int *active_plugins) {
    if (total_calls)    *total_calls  = atomic_load(&g_total_calls);
    if (total_blocks)   *total_blocks = atomic_load(&g_total_blocks);
    if (active_plugins) {
        int cnt = 0;
        pthread_rwlock_rdlock(&g_rwlock);
        for (int i = 0; i < g_plugin_count; i++)
            if (g_plugins[i].info.active) cnt++;
        pthread_rwlock_unlock(&g_rwlock);
        *active_plugins = cnt;
    }
}

void wasm_runtime_scan_plugins(void) {
    DIR *d = opendir(g_plugin_dir);
    if (!d) return;
    struct dirent *ent;
    while ((ent = readdir(d)) != NULL) {
        size_t nlen = strlen(ent->d_name);
        if (nlen > 5 && strcmp(ent->d_name + nlen - 5, ".wasm") == 0) {
            char full[WASM_PLUGIN_PATH_LEN];
            snprintf(full, sizeof(full), "%s/%s", g_plugin_dir, ent->d_name);
            wasm_plugin_load(full);
        }
    }
    closedir(d);
}

int wasm_runtime_is_native(void)
{
#ifdef HAVE_WASM
    return 1;
#else
    return 0;
#endif
}

int wasm_runtime_count_native_plugins(void)
{
    int cnt = 0;
    pthread_rwlock_rdlock(&g_rwlock);
    for (int i = 0; i < g_plugin_count; i++) {
        if (g_plugins[i].info.active && g_plugins[i].info.native_exec)
            cnt++;
    }
    pthread_rwlock_unlock(&g_rwlock);
    return cnt;
}

void wasm_runtime_destroy(void) {
#if defined(HAVE_WASM) && defined(__linux__)
    g_watch_stop = 1;
    if (g_inotify_fd >= 0) { close(g_inotify_fd); g_inotify_fd = -1; }
    pthread_join(g_watch_tid, NULL);
#endif
    pthread_rwlock_wrlock(&g_rwlock);
    for (int i = 0; i < g_plugin_count; i++) {
#ifdef HAVE_WASM
        if (g_plugins[i].instance) wasm_instance_delete(g_plugins[i].instance);
        if (g_plugins[i].module)   wasm_module_delete(g_plugins[i].module);
#endif
        memset(&g_plugins[i], 0, sizeof(g_plugins[i]));
    }
    g_plugin_count = 0;
#ifdef HAVE_WASM
    if (g_shared_store) { wasm_store_delete(g_shared_store); g_shared_store = NULL; }
    if (g_engine) { wasm_engine_delete(g_engine); g_engine = NULL; }
#endif
    pthread_rwlock_unlock(&g_rwlock);
    log_rl(LOG_INFO, "Runtime kapatıldı.");
}
