# Wasm plugin dizini (Faz 4)

`HAVE_WASM=0` (varsayilan) iken `.wasm` dosya adina gore **stub** kurallar calisir:

| Dosya | Davranis |
|-------|----------|
| `block-sqli.wasm` | `union select`, `1=1` → BLOCK |
| `block-scanner.wasm` | `sqlmap`, `nikto`, `nmap` UA → BLOCK |

Wasmtime ile derleme: `export analyze(i32, i32) -> i32` (0=PASS, 1=BLOCK).

```bash
# rules.conf
WASM_ENABLED=1
WASM_PLUGIN_DIR=examples/plugins
```
