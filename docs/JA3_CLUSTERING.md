# JA3 / Dağıtık Saldırı Kanıtı

Linux Log Guardian'da **Tier 2** kanıtı: aynı scanner User-Agent, farklı kaynak IP'ler — klasik IP başına ban'ın ötesinde kural tabanlı tespit.

## Ne ölçülür?

| Katman | Ne | Komut |
|--------|-----|-------|
| **Offline** | `distributed` corpus satırları (sqlmap UA, 30+ IP) → WAF recall | `bash scripts/ja3_cluster_proof.sh` |
| **Canlı (opsiyonel)** | TLS :443 + `ja3-test` ClientHello + HTTPS swarm (openssl) | `LIVE=1 bash scripts/ja3_cluster_proof.sh` |
| **Canlı cluster ban** | nginx access log → UA cluster → `ban_pipeline` | `sudo bash scripts/ja3_cluster_ban_live.sh` |

Çıktı: `ja3-cluster-report.json` — dashboard `/tests` panelinde **ja3-cluster** satırı.  
Canlı ban: `ja3-cluster-ban-live.json` — **ja3-cluster-ban-live** test kartı.

## Canlı cluster ban (nginx ingest)

```bash
sudo bash scripts/merge_ja3_cluster_rules.sh
sudo systemctl restart log-guardian log-guardian-daemon
sudo bash scripts/ja3_cluster_ban_live.sh
bash scripts/sync_dashboard_data.sh
```

Her koşuda benzersiz IP bloğu (`45.33.${octet}.1–5`) ve benzersiz UA kullanılır — tekrar koşulabilir.

Prometheus: `loganalyzer_ja3_clusters_active`, `loganalyzer_ja3_cluster_bans_total`.

## Hızlı çalıştırma

```bash
# Offline (VPS gerekmez)
bash scripts/ja3_cluster_proof.sh

# Canlı TLS :443 (once nginx TLS)
sudo bash scripts/nginx_tls_local_setup.sh
sudo systemctl restart log-guardian-daemon log-guardian
bash scripts/t2_tls_proof.sh

# Rakip kanıt + TLS
JA3_LIVE=1 NGINX_CONSULT=1 LIVE_ATTACK=1 bash scripts/rakip_kanit.sh
```

## Hedef metrikler

| Metrik | Hedef | Ortam değişkeni |
|--------|-------|-----------------|
| Distributed recall | ≥ %85 | `DISTRIBUTED_MIN_RECALL` |
| Benzersiz IP | ≥ 80 | corpus `generate_attack_corpus.py` |

## Dürüst sınırlar

- **Offline kanıt** log replay ile WAF kurallarının her IP satırında uyarı ürettiğini gösterir; kernel ban veya JA3 fingerprint eşlemesi değildir.
- **JA3 canlı test** eBPF daemon + TLS :443 gerektirir; localhost'ta nginx sadece :80 ise `LIVE=1` modunda `skip` normaldir.
- CrowdSec senaryo tabanlı cluster ile yarışmıyoruz; mesaj: **ölçülebilir corpus + entegre log→WAF→ban**.
- **FP learn:** `FP_LEARN=1` iken tam güvenilir IP'ler JA3/UA cluster flush listesine **alınmaz** (tekil SQLi WAF alarmı ayrı kanal).

## FP × cluster testi

```bash
bash scripts/fp_cluster_trust_e2e.sh
```

Çıktı: `fp-cluster-trust-report.json` — güvenilir IP cluster ban dışında kalmalı (`pass=true`).

## Corpus

`scripts/generate_attack_corpus.py` → kategori `distributed`:

- Aynı `sqlmap` UA
- Farklı IP aralığı (`45.33.0.x` vb.)
- SQLi path varyantları

Manifest: `corpus/real_attack_manifest.json` → `categories.distributed.line_indices`

## Entegrasyon

- `scripts/competitive_proof_build.py` — `ja3Cluster` bölümü + scorecard
- `scripts/data_room_pack.sh` — ZIP artefaktı
- `scripts/sync_dashboard_data.sh` — dashboard volume

İlgili: [ATTACK_DEFENSE.md](ATTACK_DEFENSE.md) · [REAL_ATTACK.md](REAL_ATTACK.md) · [VS_RAKIPLER.md](VS_RAKIPLER.md)
