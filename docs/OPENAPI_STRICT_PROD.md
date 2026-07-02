# OpenAPI strict — prod hikâyesi

API barındıran hosting müşterileri için BOLA/IDOR ve şema ihlali koruması.

**Modül:** `schema_validator.c` · **Test:** `bash scripts/bola_idor_e2e.sh`

---

## Ne sağlar

| Özellik | Açıklama |
|---------|----------|
| Path/param şema doğrulama | Tanımsız endpoint, tip uyumsuzluğu |
| BOLA / IDOR skoru | Başka kullanıcının kaynağına erişim pattern'i |
| GraphQL derinlik / introspection | Aşırı sorgu yüzeyi |

Log tabanlı WAF'a **ek** katman — nginx access log'da path + status görünür olmalı.

---

## Prod açma

`rules.conf`:

```ini
OPENAPI_STRICT=1
OPENAPI_SCHEMA_PATH=/etc/log-guardian/openapi.yaml
SCHEMA_BOLA_MIN_SCORE=80
```

Şema dosyasını dağıtın:

```bash
sudo cp examples/openapi/petstore-v3.yaml /etc/log-guardian/openapi.yaml
sudo systemctl restart log-guardian
```

## Müşteri şeması (prod)

Kendi OpenAPI 3 dosyanızı kullanın — petstore yalnızca demo:

```bash
sudo cp /path/to/your-api.yaml /etc/log-guardian/openapi.yaml
sudo sed -i 's|^OPENAPI_SCHEMA_PATH=.*|OPENAPI_SCHEMA_PATH=/etc/log-guardian/openapi.yaml|' /etc/log-guardian/rules.conf
sudo sed -i 's|^OPENAPI_STRICT=.*|OPENAPI_STRICT=1|' /etc/log-guardian/rules.conf
sudo systemctl restart log-guardian
```

`install_first_run.sh` internet-facing ortamda otomatik strict açar.

---

## Doğrulama

```bash
bash scripts/bola_idor_e2e.sh
bash scripts/openapi_v2_test.sh
```

Corpus: `corpus/bola_idor.access`, `corpus/schema_strict.access`

---

## nginx log formatı

OpenAPI ihlalleri genelde `GET /api/v1/users/123` gibi path'lerde görünür. `log_guardian` formatı yeterli; POST body şeması için `$request_body` alanı önerilir:

```bash
bash scripts/check_nginx_log_format.sh
```

---

## Hosting operatör notu

- Müşteri başına ayrı `openapi.yaml` → tenant policy ile (`tenant_policy.c`)
- Strict mod FP artırabilir — `AUTO_BAN_MIN_RISK` ve `INCIDENT_MIN_LOG_HITS` ile dengeleyin
- Dashboard `/schema` sayfası şema yükleme UI'si (Pro tier)

**İlgili:** [HOSTING_RUNBOOK_TR.md](HOSTING_RUNBOOK_TR.md) · [CUSTOMER_REQUIREMENTS.md](CUSTOMER_REQUIREMENTS.md)
