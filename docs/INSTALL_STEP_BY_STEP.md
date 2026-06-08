# Adim Adim Kurulum (Mint / Ubuntu / Debian)

`install.sh` tek komutla kurar; sorun cikarsa asagidaki adimlari sirayla calistirin.

## On kosul

- Linux Mint 22 / Ubuntu 24.04 benzeri
- `sudo` erisimi
- Ag arayuzu: otomatik `wlo1` / `eth0`

---

## Adim 1 — Bagimliliklar

```bash
sudo bash scripts/install_steps.sh 1-deps
```

**Not:** Eski `install.sh` `bpftool` sanal paket hatasi veriyordu. Duzeltme: `linux-tools-common` kullanilir.

Kontrol:

```bash
command -v clang bpftool pkg-config
pkg-config --exists libbpf libpcre2-8
```

---

## Adim 2 — Derleme

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/install_steps.sh 2-build
```

Basari: `./log-guardian` ve `./log-guardian-daemon` binary'leri olusur.

Hizli smoke:

```bash
./log-guardian test_access.log --no-tui --json --no-ban --rules test_rules.conf
```

---

## Adim 3 — Sistem kurulumu (systemd)

```bash
sudo bash scripts/install_steps.sh 3-install
# (deps/build atlanir — sadece binary + systemd)
# veya tek komut: sudo bash install.sh
```

Olusturur:

- `/etc/log-guardian/rules.conf`
- `/etc/log-guardian/env` (IPC token)
- `log-guardian-daemon.service` + `log-guardian.service`

---

## Adim 4 — Saglik kontrolu

Once servislerin ayakta oldugundan emin olun:

```bash
sudo systemctl restart log-guardian-daemon log-guardian
sudo systemctl status log-guardian-daemon log-guardian --no-pager
```

Sonra:

```bash
export LOGANALYZER_PASSWORD='DegistirBeni!123'
bash scripts/install_steps.sh 4-health
```

**Not:** Health check `log-guardian` kullanicisi ve `/etc/log-guardian/env` ile calisir (IPC soketi 0750).

Beklenen:

```
[HEALTH] daemon IPC: OK
[HEALTH] /metrics:9091 OK ...
```

Sorun giderme:

```bash
sudo journalctl -u log-guardian-daemon -n 30
sudo journalctl -u log-guardian -n 30
```

Yaygin hatalar:
- `libwasmtime.so` → `sudo bash scripts/install_steps.sh 3-install` (wasmtime `/usr/local/lib/log-guardian/` altina kurulur)
- BPF `.o` bulunamadi → Adim 2 + Adim 3 tekrar
- IPC FAIL → `sudo systemctl start log-guardian-daemon`

---

## Adim 5 — TLS Dashboard (Docker)

```bash
export JWT_SECRET=$(openssl rand -hex 32)
export DOMAIN=localhost
export HTTP_PORT=8080 HTTPS_PORT=8443   # 80/443 mesgulse
bash scripts/install_steps.sh 5-dashboard
```

Arka planda eski container varsa `tls_proxy_up.sh` otomatik temizler.

Manuel (ayni is):

```bash
export JWT_SECRET=$(openssl rand -hex 32)
bash scripts/dashboard_prod_smoke.sh   # next build (standalone)
bash scripts/tls_proxy_up.sh           # Caddy + dashboard
bash scripts/tls_proxy_test.sh
```

Panel: https://localhost:8443

Ilk admin (seed):

```bash
cd dashboard
DASHBOARD_SEED=1 DASHBOARD_ADMIN_PASSWORD='GucluParola!' node prisma/seed.mjs
```

---

## Adim 6 — Soak test (daemon ayaktayken)

**Kisa (5 dk, kurulum dogrulama):**

```bash
SOAK_SHORT=1 bash scripts/install_steps.sh 6-soak
```

**Tam (72 saat, release oncesi):**

```bash
sudo systemctl start log-guardian-daemon log-guardian
bash scripts/soak_start.sh
```

Izleme (test uzun surer — arka planda calisir):

```bash
bash scripts/soak_status.sh          # ozet
tail -f soak.log                     # canli log
wc -l soak-report.jsonl              # tamamlanan ornek (~864 hedef)
kill -0 $(cat soak.pid) && echo running
```

Bitince `soak-report.json` icinde `pass: true`, `failures: 0` beklenir.

Detay: [docs/SOAK_TEST.md](SOAK_TEST.md)

---

## Adim 7 — Grafana + Prometheus (Docker)

```bash
bash scripts/install_steps.sh 7-grafana
# veya: bash scripts/grafana_stack.sh && bash scripts/grafana_smoke_test.sh
```

Panel: http://127.0.0.1:3002 (admin/admin)

Detay: [docs/GRAFANA_SETUP.md](GRAFANA_SETUP.md)

---

## Laptop hizli stack

Soak calisirken dokunulmaz:

```bash
bash scripts/dev_stack.sh              # health + ops_smoke
bash scripts/dev_stack.sh --grafana    # + Grafana
bash scripts/dev_stack.sh --all        # + TLS dashboard + Grafana
sudo bash scripts/sync_local_install.sh  # repo → /usr/local binary
```

---

```
E: 'bpftool' paketi icin kurulum adayi yok
```

**Cozum:** `install.sh` guncellendi — `bpftool` yerine `linux-tools-common` / `linux-tools-$(uname -r)`.

Zaten kuruluysa:

```bash
/usr/sbin/bpftool version
```

yeterli.

---

## Tek komut (hepsi birden)

```bash
sudo bash install.sh
```

Dry-run:

```bash
sudo bash install.sh --dry-run
```
