# Wasm plugin (prod release path)

## Stub mod (geliştirme, Wasmtime yok)

`HAVE_WASM=0` — dosya adına göre filtre (`block-sqli.wasm`, `block-scanner.wasm`).

```bash
make log-guardian
REQUIRE_WASM_NATIVE=0 SKIP_WASM_GATE=1 bash scripts/competitive_suite.sh
```

## Prod release (CI ile aynı yol)

```bash
make wasm-release
# veya: bash scripts/wasm_release.sh
```

Bu adım:

1. `vendor/wasmtime` C API kurar
2. Rust plugin derler (`examples/plugins/block-sqli.wasm`)
3. `HAVE_WASM=1` ile `log-guardian` üretir
4. `wasm-status.json` → `"mode": "native"`, `"pass": true`

```bash
export LD_LIBRARY_PATH=$PWD/vendor/wasmtime/lib
bash scripts/competitive_suite.sh   # REQUIRE_WASM_NATIVE=1 (varsayılan)
```

## Hot-plug

`WASM_PLUGIN_DIR=examples/plugins` — inotify ile yeni `.wasm` otomatik yüklenir (Linux + `HAVE_WASM=1`).

Dashboard: `PUSH_WASM_PLUGIN` fleet komutu → `dashboard/src/app/api/plugins/route.ts`.

## CI

- **build** job: `wasm_gate.sh` → `competitive_suite` (`REQUIRE_WASM_NATIVE=1`)
- **wasm** job: ayrı paralel doğrulama + `wasm-status` artifact

Merge blocker: `competitive_gate.sh` — `wasm-status.json` **native** zorunlu.

## Kaynak

`examples/plugins/rust-plugin/` — export `analyze(ptr, len) -> i32` (0=pass, 1=block, 2=tarpit)
