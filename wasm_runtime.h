/* wasm_runtime.h — WebAssembly Plugin Engine (Feature 4)
 *
 * Şirketlerin Go/Rust/TypeScript ile yazdığı Wasm pluginlerini
 * Log Guardian C motoruna hot-plug olarak yükler.
 *
 * HAVE_WASM=1 → Wasmtime C API kullanılır
 * HAVE_WASM=0 → Stub (pass-through); derleme bağımlılığı yok
 */
#pragma once
#ifndef WASM_RUNTIME_H
#define WASM_RUNTIME_H

#include <stdint.h>
#include <stddef.h>

#define WASM_MAX_PLUGINS     16
#define WASM_PLUGIN_NAME_LEN 64
#define WASM_PLUGIN_PATH_LEN 256
#define WASM_VERDICT_LEN     32
#define WASM_PLUGIN_DIR_DEFAULT "/etc/log-guardian/plugins"

void wasm_runtime_set_plugin_dir(const char *dir);
const char *wasm_runtime_get_plugin_dir(void);

/* Plugin kararı */
typedef enum {
    WASM_VERDICT_PASS    = 0,  /* İzin ver                    */
    WASM_VERDICT_BLOCK   = 1,  /* Engelle                     */
    WASM_VERDICT_TARPIT  = 2,  /* Tarpit'e yönlendir          */
    WASM_VERDICT_LOG     = 3,  /* Sadece logla                */
} WasmVerdict;

typedef struct {
    char       name[WASM_PLUGIN_NAME_LEN];
    char       path[WASM_PLUGIN_PATH_LEN];
    uint32_t   version;
    int        active;
    uint64_t   calls_total;
    uint64_t   blocks_total;
    int        native_exec;  /* 1 = Wasmtime analyze(), 0 = stub/isim kurali */
} WasmPluginInfo;

/* ── API ─────────────────────────────────────────────────────────── */

/* Çalışma zamanını başlat; plugin dizinini izlemeye al */
int wasm_runtime_init(void);

/* Belirli bir .wasm dosyasını yükle (hot-plug) */
int wasm_plugin_load(const char *wasm_path);

/* Plugini adıyla kaldır */
int wasm_plugin_unload(const char *name);

/*
 * wasm_plugin_analyze: Yüklü tüm pluginlere isteği gönderir.
 *   req_json  — istek JSON string'i (URL, method, headers, body)
 *   verdict   — dolu döner: "PASS", "BLOCK", "TARPIT", "LOG"
 *   vsz       — verdict buffer boyutu
 *
 * Herhangi bir plugin BLOCK dönerse → WasmVerdict BLOCK.
 */
WasmVerdict wasm_plugin_analyze(const char *req_json,
                                 char       *reason_out,
                                 int         reason_sz);

/* Yüklü plugin listesini doldur */
int wasm_plugin_list(WasmPluginInfo *out, int max_count);

/* İstatistikler */
void wasm_runtime_stats(uint64_t *total_calls, uint64_t *total_blocks,
                        int *active_plugins);

/* Temiz kapat */
void wasm_runtime_destroy(void);

/* Hot-plug: Plugin dizinini bir kez tara (inotify yoksa polling) */
void wasm_runtime_scan_plugins(void);

/* 1 = Wasmtime C API, 0 = stub (dosya adi kurallari) */
int wasm_runtime_is_native(void);

/* Yüklü pluginlerden analyze() export'u olanlar (prod kaniti) */
int wasm_runtime_count_native_plugins(void);

#endif /* WASM_RUNTIME_H */
