# 30 saniye demo GIF — kayıt rehberi

README onboarding için kısa demo. **Araç:** terminal kaydı → GIF.

## Hızlı yol (asciinema + agg)

```bash
# asciinema + agg (bir kez)
sudo apt install -y asciinema
cargo install agg  # veya: https://github.com/asciinema/agg/releases

cd ~/Masaüstü/Linux\ Log\ Guardian
export LOGANALYZER_PASSWORD='DegistirBeni!123'

asciinema rec /tmp/lg-demo.cast -c "bash scripts/demo_3min.sh"
agg /tmp/lg-demo.cast docs/assets/demo-3min.gif
```

README'ye ekle:

```markdown
![3 dk demo](docs/assets/demo-3min.gif)
```

## Alternatif: peek / simplescreenrecorder

1. Terminal tam ekran, font 14+
2. `bash scripts/demo_3min.sh` (adım 3 ban webhook görünsün)
3. 30–45 sn kırp → `docs/assets/demo-3min.gif`
4. `gifsicle -O3 --colors 64` ile boyut düşür

## Ne göstermeli?

1. `sudo bash scripts/install_first_run.sh` (hızlı kesit) **veya** sadece `demo_3min.sh`
2. Webhook dry-run satırı
3. `alerts_total=1` + ban latency ~20 ms
4. `https://localhost:8443/tests` (opsiyonel)

## Yapılmaması gerekenler

- Gerçek Telegram token / API anahtarı ekranda
- Özel `ACCESS_PASSWORD_KDF` veya `API_TOKEN` tam metin
