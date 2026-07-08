# Internet-facing guvenlik zinciri

VPS veya public IP'de tek sira — **Community laptop profili degismez**.

Ilgili: [SECURITY_PROFILES.md](SECURITY_PROFILES.md) · [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · [HARDENING_ROLLBACK.md](HARDENING_ROLLBACK.md)

---

## Tespit

```bash
bash scripts/detect_internet_facing.sh && echo PUBLIC || echo LAB
```

`LAB` → asagidaki zorunlu adimlar atlanir (`apply_internet_facing_hardening` skip).

---

## Zincir (sirayla)

```bash
# 0. Yedek
bash scripts/backup_operator_secrets.sh

# 1. Temel kurulum
sudo bash scripts/install_first_run.sh

# 2. Parola + KDF
sudo env LG_NEW_PASSWORD='GucluParola!' bash scripts/laptop_harden.sh

# 3. API + split token (Enterprise SOAR icin)
sudo bash scripts/ensure_api_security.sh
sudo bash scripts/ensure_api_split_tokens.sh   # opsiyonel mutation token

# 4. Dashboard JWT + guclu admin parola
bash scripts/laptop_jwt_setup.sh
# .env: DASHBOARD_ADMIN_PASSWORD=...  (ChangeMeOnFirstLogin! internet-facing FAIL)
bash scripts/sync_dashboard_api_token.sh
# Opsiyonel idle: DASHBOARD_JWT_IDLE_MIN=480 (dk; 0=kapali demo)

# 5. Internet-facing patch (nginx rate, WASM strict, firewall)
sudo bash scripts/apply_internet_facing_hardening.sh

# 6. Edge + nginx consult
sudo bash scripts/fix_nginx_inline_consult.sh
bash scripts/edge_protection_gate.sh

# 7. Kapilar
bash scripts/post_install_verify.sh          # demo parola FAIL olmamali
bash scripts/local_security_audit.sh         # FAIL:0 hedef
bash scripts/security_closure_gate.sh
```

---

## Enterprise SOAR (opt-in)

```bash
sudo bash scripts/enable_enterprise_soar_api.sh
bash scripts/ban_api_mtls_e2e.sh
bash scripts/enterprise_soar_gate.sh
```

Kapatma: `sudo bash scripts/disable_enterprise_soar_api.sh`

---

## Haftalik ritim

| Siklik | Komut |
|--------|--------|
| Sabah | `bash scripts/morning_operator_chain.sh` |
| Haftalik | `bash scripts/install_audit_cron.sh` (ilk kurulum) |
| Push oncesi | `bash scripts/pre_push_secret_scan.sh` |

---

## VPS ozel (+XDP)

```bash
sudo bash scripts/vps_xdp_proof.sh
# Cloudflare: deploy/cloudflare-origin.conf
```

Detay: [VPS_SETUP.md](VPS_SETUP.md)
