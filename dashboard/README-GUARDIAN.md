# Dashboard’dan Log Guardian komutları

Linux Log Guardian — scriptler ve `log-guardian-daemon` **bir üst dizinde** (proje kökü). Marka: [../docs/BRANDING.md](../docs/BRANDING.md)

```text
Linux Log Guardian/    ← proje kökü (önerilen klasör adı)
├── log-guardian
├── log-guardian-daemon
├── scripts/
└── dashboard/         ← npm run dev burada
    └── lg             ← kısayol (bu klasörden çalışır)
```

## Yanlış (dosya yok hatası)

```bash
cd dashboard
bash scripts/prod_stack_e2e.sh   # ❌ scripts burada yok
```

## Doğru — 3 yol

**1) Kısayol (dashboard içindeyken):**

```bash
chmod +x ./lg
./lg build
./lg prod
./lg daemon eth0        # NIC adını değiştir (ip link)
./lg status
```

**2) Kök dizine geç:**

```bash
cd ..
bash scripts/prod_stack_e2e.sh
sudo ./log-guardian-daemon --iface eth0
```

**3) npm (dashboard klasöründe):**

```bash
cd dashboard
npm run guardian:prod
```

**4) npm (proje kökünde):**

```bash
cd /path/to/log-guardian
npm run guardian:prod
npm run guardian:status
npm run dashboard:dev
```
