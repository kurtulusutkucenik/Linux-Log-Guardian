# Güvenlik mükemmelliği — Community Tier-A (ücretsiz MIT)

Log Guardian resmi **NATO/CE sertifikası** iddiasında değildir; açık kaynak olarak **ölçülebilir savunma derinliği** sunar. Laptop/community profili demo parolayı bilinçli tutar; internete açık sunucuda `laptop_harden.sh` zorunludur.

Detay: [SECURITY_PROFILES.md](SECURITY_PROFILES.md) · [LAPTOP_OPS.md](LAPTOP_OPS.md)

---

## Tek komut

```bash
APPLY=1 bash scripts/laptop_security_excellence.sh    # JWT + audit cron
sudo bash scripts/laptop_security_excellence.sh       # + API firewall + IPC abuse
bash scripts/security_closure_gate.sh                 # tam kapatma kapısı (~15 dk)
```

---

## Katmanlar (community laptop)

| Katman | Kontrol | Kanıt |
|--------|---------|--------|
| **API** | Fail-closed — token yok → 403 | `api_fail_closed_test.sh` |
| **Bind** | `API_BIND=127.0.0.1` + nftables/iptables 8090 | `firewall_api_bind.sh` |
| **IPC** | Unix socket SO_PEERCRED, grup izinleri | `ipc_abuse_test.sh` |
| **Rate limit** | Ban/consult throttling | `api_server.c` + `consult_rate_proof.sh` |
| **Dashboard** | JWT 32+ byte, scrypt login, rate limit | `laptop_jwt_setup.sh` |
| **Webhook** | `/etc/log-guardian/webhook.env` chmod 600 | `local_security_audit.sh` |
| **Statik site** | Hash-only CSP, SRI, Trusted Types, `_headers` | `website_security_check.sh` |
| **Relay** | Docker internal network — LAN sızıntı yok | `relay_lan_exposure_check.sh` |
| **Proxy** | XFF spoof koruması | `check_proxy_trust.sh` |
| **Wasm** | Path guard + fuel limit | `wasm_gate.sh` |
| **Secrets** | Repoda gerçek token yok | `pre_push_secret_scan.sh` |
| **İzleme** | Haftalık audit cron | `install_audit_cron.sh` |

---

## Community vs internet-facing

| | Community (ücretsiz tier) | Internet-facing (VPS) |
|--|---------------------------|------------------------|
| Analyzer parola | `DegistirBeni!123` bilinçli | `laptop_harden.sh` zorunlu |
| Dashboard | JWT güçlü, admin demo OK | Güçlü `DASHBOARD_ADMIN_PASSWORD` |
| Denetim | WARN:0 hedef (`local_security_audit`) | FAIL:0 zorunlu |
| Fleet token | Lab token | Production rotate |

---

## Operasyon ritmi

| Sıklık | Komut |
|--------|--------|
| Her demo öncesi | `bash scripts/laptop_excellence_gate.sh` |
| Güvenlik taraması | `bash scripts/laptop_security_excellence.sh` |
| Haftalık (cron) | `local_security_audit.sh` (Pazartesi 09:00) |
| Site deploy sonrası | `bash scripts/website_live_check.sh` |
| GitHub öncesi | `bash scripts/pre_push_secret_scan.sh` |

---

## VPS gelince (+1 katman)

- Kernel **XDP** ban map (`vps_xdp_proof.sh`)
- Cloudflare origin + `real_ip_header`
- `OPENAPI_STRICT=1` prod API

İlgili: [EDGE_PROTECTION.md](EDGE_PROTECTION.md) · [SECURITY.md](../SECURITY.md)
