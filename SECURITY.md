# Güvenlik politikası / Security policy

## Desteklenen sürümler / Supported versions

| Sürüm / Version | Destek / Supported |
|-----------------|-------------------|
| `main` branch | Aktif geliştirme / active development |

## Güvenlik açığı bildirimi / Reporting a vulnerability

**Lütfen güvenlik açıklarını public issue olarak açmayın.**

Please **do not** open public issues for security vulnerabilities.

1. GitHub **Private vulnerability report** (repo → Security → Report) veya
2. Maintainer'a özel iletişim (GitHub profil üzerinden)

Bildirimde ekleyin / Include:

- Etkilenen bileşen (analyzer, daemon, dashboard, IPC)
- Tekrar adımları / reproduction steps
- Etki (RCE, privilege escalation, auth bypass vb.)

Hedef yanıt süresi / Target response: **7 gün** ilk geri dönüş.

## Güvenli kurulum hatırlatmaları / Secure deployment reminders

- Varsayılan şifreyi değiştirin: `ACCESS_PASSWORD_KDF` in `/etc/log-guardian/rules.conf`
- Dashboard JWT: güçlü `JWT_SECRET`
- Whitelist: ofis / monitoring IP'leri
- IPC token: `install.sh` üretir — paylaşmayın

Detay: [docs/OPERATIONS.md](docs/OPERATIONS.md)
