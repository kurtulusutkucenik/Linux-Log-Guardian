# Wasm prod checklist

## Hedef

`wasm-status.json` → `"mode": "native"`, `"pass": true` (CI `competitive_gate` varsayılan).

## Adımlar

```bash
# Ubuntu/Debian
sudo apt install -y libwasmtime-dev  # veya wasmtime release
curl https://sh.rustup.rs -sSf | sh -s -- -y
bash scripts/build_wasm_plugin.sh
bash scripts/wasm_release.sh
cat wasm-status.json
```

## Doğrulama

- `rules.conf`: `WASM_ENABLED=1`, `WASM_PLUGIN_DIR=examples/plugins`
- `./log-guardian --status` → `"wasm":{"native":true,"plugins_native":1,...}`
- `WASM_PROD_STRICT=1` → `analyze` export olmayan plugin yüklenmez (CI wasm_gate)
- Hot-plug: plugin dizinine yeni `.wasm` kopyala → inotify reload

## Stub mod (yalnızca dev)

`REQUIRE_WASM_NATIVE=0 bash scripts/competitive_suite.sh` — dosya adı kuralları (`block-sqli.wasm`).

Prod yayınında stub kullanma.
