# JWT ve dashboard parola rotasyonu

Otomatik rotate yok — bakım penceresinde manuel prosedür. Core log→ban hattını kesintisiz bırakır; yalnızca dashboard oturumu yenilenir.

## Ne zaman?

- Şüpheli erişim veya parola sızıntısı
- Operatör değişimi
- Periyodik bakım (ör. 90 günde bir, opsiyonel)

## Laptop / deneme

```bash
# Yeni dashboard parolası (opsiyonel — bos birakilirsa mevcut kalir)
export DASHBOARD_ADMIN_PASSWORD='YeniGucluParola!'
bash scripts/laptop_jwt_setup.sh
bash scripts/dashboard_refresh.sh   # :8443 stack aciksa
```

Tarayıcıda çıkış yapın veya gizli sekme ile `https://localhost:8443` açın.

## İnternet sunucusu (prod)

```bash
# 1 — Bakım penceresi bildirimi (opsiyonel)
# 2 — Yeni parola + JWT
sudo env DASHBOARD_ADMIN_PASSWORD='YeniGucluParola!' bash scripts/laptop_jwt_setup.sh

# 3 — Caddy/dashboard yeniden yukle
cd /path/to/Linux-Log-Guardian
bash scripts/dashboard_refresh.sh

# 4 — Dogrulama
bash scripts/laptop_harden_check.sh
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/api/health
```

## API_TOKEN (ban/consult API)

Dashboard JWT'den ayrıdır. Rotasyon:

```bash
sudo bash scripts/rotate_api_token.sh
bash scripts/sync_dashboard_api_token.sh
bash scripts/api_fail_closed_test.sh
```

## IPC token

`LOG_GUARDIAN_IPC_TOKEN` — `install.sh` / `/etc/log-guardian/env`. Rotasyon nadirdir; gerekirse:

```bash
sudo bash scripts/install_first_run.sh   # env yeniden uretmez — elle:
# /etc/log-guardian/env icinde LOG_GUARDIAN_IPC_TOKEN guncelle
sudo systemctl restart log-guardian-daemon log-guardian
sudo log-guardian --health
```

## Yedek

Rotasyon öncesi:

```bash
bash scripts/backup_operator_secrets.sh
```

İlgili: [SECURITY.md](../SECURITY.md) · [LAPTOP_OPS.md](LAPTOP_OPS.md) · [TLS_PRODUCTION.md](TLS_PRODUCTION.md)
