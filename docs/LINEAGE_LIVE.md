# Lineage — canlı eBPF (üretim) vs önizleme

## Neden “demo” görünüyordu?

Dashboard, canlı veri yokken **onboarding** için `rules/lineage-demo.json` dosyasına düşüyordu. Bu, ürünün “demo sürümü” olduğu anlamına gelmez — **daemon çalışmadığında** gösterilen yedek önizlemedir.

Üretim yolu her zaman:

```bash
sudo ./log-guardian-daemon   # lineage_probe + attack_tree export
# → /run/log-guardian/attack_tree.json (5 sn'de bir)
```

## Veri önceliği (dashboard API)

1. Fleet telemetry (`attackTreeJson`)
2. Guardian API `:8080/api/v1/attack-tree`
3. Canlı dosyalar: `/run/log-guardian/attack_tree.json`, `ATTACK_TREE_PATH`, `corpus/lineage_live_snapshot.json`
4. **Önizleme** yalnızca `LINEAGE_ALLOW_DEMO=1` veya `?preview=1`

Yanıt alanları: `data_mode: "live" | "preview" | "none"`, `live: true` (üretim).

## E2E kapı

```bash
bash scripts/lineage_live_e2e.sh   # openat + execve + connect zinciri
bash scripts/lineage_e2e.sh        # merge gate wrapper
```

`competitive_gate.sh` canlı snapshot ve event tiplerini doğrular.

## Önizleme (isteğe bağlı)

```bash
./log-guardian lineage-stats --demo    # CLI önizleme snapshot
# Dashboard: /attack-tree?preview=1
```
