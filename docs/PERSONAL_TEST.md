# Kişisel test rehberi (Production beta)

Bu dosya, geliştirme bittikten sonra **tek başına** doğrulama için yazıldı.  
Tahmini süre: **45–90 dk** (daemon/root testleri dahil).

---

## 0. Hazırlık

```bash
cd "/home/kurtulus/Masaüstü/Log Analyzer"   # kendi yolunuz
export LOGANALYZER_PASSWORD='DegistirBeni!123'

make -j$(nproc)
```

| Bağımlılık | Ubuntu |
|------------|--------|
| Derleme | `build-essential clang libbpf-dev libpcre2-dev libsqlite3-dev libcurl4-openssl-dev liburing-dev libseccomp-dev` |
| Dashboard | `cd dashboard && npm install` |
| Daemon (opsiyonel) | root + `bpftool`, NIC adı (`ip -br link`) |

---

## 1. Otomatik smoke (5 dk) — hepsi yeşil olmalı

```bash
bash scripts/smoke_test.sh
bash scripts/incident_e2e.sh
bash scripts/lineage_e2e.sh
bash scripts/fp_report.sh
bash scripts/verify_rules_conf.sh   # Faz 0.4
```

**Beklenen:** Her script sonunda `OK — ...`  
**Not:** `lineage-stats --demo` → `./attack_tree.json` oluşur.

---

## 2. Analyzer (ban yok, JSON) — 10 dk

```bash
./log-guardian test_access.log --no-tui --json --no-ban --no-db --rules test_rules.conf
./log-guardian test_schema_access.log --no-tui --json --no-ban --no-db --rules rules.conf
./log-guardian test_schema_strict.log --no-tui --json --no-ban --no-db --rules rules.conf
```

| Test | Beklenen (JSON sonunda) |
|------|-------------------------|
| `test_access.log` | `total_lines` > 0 |
| `test_schema_access.log` | `total_lines: 2` |
| `test_schema_strict.log` | `alerts_total` ≥ 1 (bilinmeyen `/api/evil` → strict) |

```bash
./log-guardian crs-stats --rules test_rules.conf | jq .
./log-guardian incident-sim | jq .
# incident_id: "INC-..." dolu olmalı
```

---

## 3. Operatör CLI + DB — 5 dk

```bash
rm -f events.db
./log-guardian test_access.log --no-tui --json --no-ban --rules test_rules.conf --db events.db

./log-guardian --status --db events.db | jq .
# incidents, recent_alerts, ban_pipeline alanları dolu olabilir
```

---

## 4. eBPF daemon + health (root, ~15 dk)

Gerçek NIC adınızı yazın (`eth0`, `ens33`, …):

```bash
sudo make -j$(nproc)    # xdp_filter.o vb.
sudo ./log-guardian-daemon --iface eth0
# Ayrı terminal:
export LOGANALYZER_PASSWORD='DegistirBeni!123'
./log-guardian --health
```

| Kontrol | Başarı |
|---------|--------|
| `[HEALTH] daemon IPC: OK` | IPC soketi çalışıyor |
| `daemon_stats.json` | RCE/lineage sayaçları okunuyor |
| `[HEALTH] /metrics:9091 OK` | Analyzer `--follow` veya kısa analiz sonrası metrics açık |

Metrics (analyzer çalışırken):

```bash
curl -s http://127.0.0.1:9091/metrics | grep 'tenant_id="default"'
./log-guardian lineage-stats
curl -s http://127.0.0.1:8080/api/v1/attack-tree | jq .
```

**Ban (root):**

```bash
sudo ./log-guardian ban 203.0.113.99 --reason personal-test
sudo ./log-guardian unban 203.0.113.99
```

---

## 5. Dashboard + Fleet (20–30 dk)

```bash
cd dashboard
npx prisma db push
node prisma/seed.mjs
npm run dev
```

Tarayıcı: `http://localhost:3000`  
Giriş: **admin** / **ChangeMeOnFirstLogin!** (veya seed sırasında `DASHBOARD_ADMIN_PASSWORD` ile belirlediğiniz parola)

| Sayfa | Ne kontrol edilir |
|-------|-------------------|
| `/` (Ana) | Fleet kartları, tenant filtresi |
| `/fleet` | `node-istanbul-01` vb. seed agent’lar; BAN_IP dispatch |
| `/attack-tree` | Demo veya daemon JSON |
| `/copilot` | Ollama yoksa statik yanıt; Ollama varsa özet |

Terminal (dashboard açıkken):

```bash
bash scripts/fleet_e2e.sh
```

**Beklenen:** telemetry `success:true`, komut poll `commands` alanı.

`rules.conf` ile canlı agent (opsiyonel):

```text
SAAS_ENABLED=1
SAAS_URL=http://127.0.0.1:3000/api/telemetry
SAAS_TOKEN=sk_guardian_fleet_test_token_123
AGENT_ID=node-istanbul-01
TENANT_ID=default
```

```bash
./log-guardian test_access.log --no-tui --rules rules.conf --follow
# /fleet sayfasında agent Online görünmeli (~15 sn)
```

---

## 6. Kurulum scripti (opsiyonel, VM)

```bash
sudo bash install.sh
# veya dry-run:
sudo bash install.sh --dry-run
```

Son satırda healthcheck + `/metrics` curl uyarısı/ok.

---

## 7. Benchmark / kanıt paketi

```bash
bash scripts/bench_report.sh
cat bench-report.txt
```

---

## Bilinen sınırlar (beklenti ayarı)

| Özellik | Durum |
|---------|--------|
| Wasm | Stub (`HAVE_WASM=0`); isim tabanli block-sqli/block-scanner; Wasmtime opsiyonel |
| Etcd mesh | Endpoint yoksa uyarı normal |
| ZMQ mesh | `MESH_BACKEND=etcd` iken kapalı |
| Fleet ACK | `delivered` → agent `executed`/`failed` POST `/api/fleet/commands/ack` |
| Fleet E2E 401 | Dashboard yeniden baslat (`middleware` agent Bearer API); tek `npm run dev` :3000 |
| `--health` IPC | Daemon acik + `sudo ./log-guardian --health` veya `/run/log-guardian` 0755 |
| Copilot | Ollama yoksa fleet+incident ozetli fallback |
| XDP / wlo1 | Bazi NIC'lerde BPF yuklenmez; IPC + log analizi yeterli |

5 faz %100 kapı: `bash scripts/phase100.sh` (veya `bash scripts/phase_complete.sh`)

Multi-tenant DB: `MULTI_TENANT_DB=1` + `TENANT_ID=musteri1` → `events-musteri1.db`

---

## Hızlı sorun giderme

| Belirti | Çözüm |
|---------|--------|
| `--health` IPC FAIL | `sudo log-guardian-daemon --iface <NIC>` |
| `/metrics` yok | Analyzer çalışsın; `METRICS_PORT=9091` |
| Dashboard 401 | `npm run dev` + `/login` |
| Fleet boş | `node prisma/seed.mjs` + telemetry veya SAAS_ENABLED |
| Lineage demo yazılamıyor | `./attack_tree.json` için repo kökünde yazma izni |
| Şifre hatası | `export LOGANALYZER_PASSWORD='DegistirBeni!123'` |

---

## Tek komut özeti (geliştirme makinesi)

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/run-all-e2e.sh
```

Dashboard açıksa fleet dahil; değilse fleet atlanır.

3 log alarmı → `INC-` (eBPF olmadan):

```bash
./log-guardian test_incident_3hits.log --no-tui --rules rules.conf --db events.db
./log-guardian --status --db events.db | jq '.incidents,.recent_alerts[0].incident_id'
```

Fleet Online: `docs/FLEET_ONLINE.md` · Docker: `docs/QUICKSTART_DOCKER.md`

Hepsi geçtiyse **Production beta** kişisel testi için hazırsınız.
