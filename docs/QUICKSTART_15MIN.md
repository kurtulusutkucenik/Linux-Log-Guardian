# 15 dakika — ilk “vay be” anı

Ücretsiz **Linux Log Guardian** — laptop veya tek sunucu. Satış değil; kurulum sürtünmesi minimum.

**Hub:** [LAPTOP_OPS.md](LAPTOP_OPS.md) · **Tam core:** [QUICKSTART_NGINX.md](QUICKSTART_NGINX.md)

---

## 0–5 dk: Kurulum

```bash
git clone https://github.com/kurtulusutkucenik/loganalyzer.git
cd loganalyzer
sudo bash install.sh
sudo bash scripts/install_first_run.sh
```

`install_first_run` şunları yapar:

- API fail-closed (`API_BIND=127.0.0.1`, `API_TOKEN`)
- nginx log format + inline consult (varsa)
- FP ısınma → prod trust listesi
- `demo_3min.sh` yönlendirmesi

Demo parola bilerek açık: `DegistirBeni!123` — laptop için yeterli.

---

## 5–10 dk: Demo

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/demo_3min.sh
```

Dashboard (opsiyonel):

```bash
bash scripts/dashboard_stack.sh
# https://localhost:8443/tests
```

---

## 10–15 dk: Doğrulama

```bash
bash scripts/local_security_audit.sh
bash scripts/api_fail_closed_test.sh
bash scripts/ops_smoke.sh
```

Haftalık otomatik:

```bash
bash scripts/install_audit_cron.sh
bash scripts/install_fp_report_cron.sh
```

Soak bitince kanıt arşivi:

```bash
bash scripts/publish_soak_report.sh
```

Demo GIF: [DEMO_GIF.md](DEMO_GIF.md)

---

## Dürüst beklenti

| Yapar | Yapmaz |
|-------|--------|
| nginx log → WAF → kernel ban (~17 ms) | L3/L4 DDoS absorb |
| FP trust + warmup | Inline ModSec hızı |
| localhost API + inline consult | VPS XDP (henüz laptop’ta yok) |

Detay: [ROADMAP_FREE.md](ROADMAP_FREE.md)

---

## Sonraki adımlar

| Hedef | Komut / doc |
|-------|-------------|
| 72h stabilite | `SOAK_1H=1 bash scripts/laptop_soak_72h.sh --start` |
| OpenAPI strict (API host) | `sudo bash scripts/install_openapi_strict_prod.sh` |
| VPS + XDP | [VPS_SETUP.md](VPS_SETUP.md) |
