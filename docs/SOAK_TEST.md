# 72 Saat Soak Test (7/24 dogrulama)

Uzun sure calisma + saglik izleme. Kurulum sonrasi veya release oncesi calistirin.

## Hizli (CI / 5 dk)

```bash
SOAK_SHORT=1 bash scripts/soak_test.sh
```

## Tam (72 saat)

```bash
# Onceden: systemd servisleri ayakta
sudo systemctl start log-guardian-daemon log-guardian

bash scripts/soak_start.sh
```

Arka planda (eski yontem):

```bash
nohup bash scripts/soak_test.sh > soak.log 2>&1 &
echo $! > soak.pid   # dikkat: bazi shell'lerde PID yanlis olabilir — soak_start.sh tercih edin
tail -f soak.log
```

Izleme:

```bash
bash scripts/soak_status.sh
tail -f soak.log
wc -l soak-report.jsonl
```

## Ne olculur?

| Ornek | Kaynak |
|-------|--------|
| `./log-guardian --health` | IPC, daemon_stats, /metrics |
| systemd active | `log-guardian-daemon`, `log-guardian` |
| Prometheus metrikleri | EPS, alerts, lines |
| RSS bellek | analyzer + daemon prosesleri |

## Ciktilar

| Dosya | Icerik |
|-------|--------|
| `soak-report.jsonl` | Her ornek satir (JSON) |
| `soak-report.json` | Ozet: pass/fail, failures, max_rss_kb |

Basari: `pass: true`, `failures: 0`.

## Ortam degiskenleri

| Degisken | Varsayilan | Aciklama |
|----------|------------|----------|
| `SOAK_DURATION` | 259200 | Toplam saniye (72h) |
| `SOAK_INTERVAL` | 300 | Ornekleme araligi |
| `SOAK_SHORT` | 0 | 1 = 5 dk / 30s |
| `SOAK_METRICS_PORT` | 9091 | Prometheus port |
| `LOGANALYZER_PASSWORD` | — | `--health` icin |

## Ornek basarisizliklar

- `health_rc != 0` — daemon IPC veya metrics erisilemiyor
- systemd `inactive` — servis dusmus (restart sayacini `journalctl` ile kontrol edin)
- RSS surekli artis — olasi bellek sizintisi (GC / pool loglarina bakin)

## CI entegrasyonu

`scripts/prod_hardening_test.sh` daemon ayaktaysa `SOAK_SHORT=1` calistirir.
