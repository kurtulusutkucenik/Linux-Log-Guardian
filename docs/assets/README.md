# Demo görsel varlıkları

3 dakikalık demo GIF veya kısa video buraya konur.

## Üretim

```bash
# Terminal kaydı → GIF (asciinema + agg)
sudo apt install -y asciinema
# agg: https://github.com/asciinema/agg/releases

cd "$(git rev-parse --show-toplevel)"
export LOGANALYZER_PASSWORD='DegistirBeni!123'
asciinema rec /tmp/lg-demo.cast -c "SKIP_WEBHOOK=1 bash scripts/demo_3min.sh"
agg /tmp/lg-demo.cast docs/assets/demo-3min.gif
```

Detay: [DEMO_GIF.md](../DEMO_GIF.md)

## Beklenen dosya

| Dosya | Kullanım |
|-------|----------|
| `demo-3min.gif` | README + landing hero altı |

GIF yokken README ve site metin + komut linki gösterir; repo işleyişi etkilenmez.
