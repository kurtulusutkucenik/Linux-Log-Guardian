# Falco kurallari ve Log Guardian

Log Guardian, Falco ile ayni runtime’i paylasmaz; bunun yerine **access log + eBPF lineage + WAF** ile benzer MITRE senaryolarini kapsar.

## Esleme dosyasi

`rules/falco-guardian-map.yaml` — yaygin Falco rule adlarinin Guardian sinyallerine karsiligi.

| Falco benzeri olay | Guardian |
|--------------------|----------|
| Outbound connect | `INC_SIG_EBPF_OUTBOUND` (lineage `connect`) |
| Container shell | `INC_SIG_EBPF_EXECVE` |
| Dosya okuma/yazma | `INC_SIG_EBPF_LINEAGE` |
| SQLi / WAF | `INC_SIG_LOG_SQLI` / `INC_SIG_LOG_WAF` |

## Korelasyon

`rules.conf`:

```ini
INCIDENT_MIN_LOG_HITS=3
INCIDENT_WINDOW_SEC=600
```

eBPF yokken ayni IP’de 3+ log alarmi → `INC-xxxxxxxx-xxxx` (`test_incident_3hits.log`).

## Import (v2 — macro + list expansion)

```bash
pip install pyyaml   # onerilir
python3 scripts/falco_import.py rules/falco/ vendor/falco-rules/rules -o rules/generated-falco-host.json --max 512
bash scripts/falco_import_test.sh   # >=100 kural kapisi
bash scripts/falco_fetch_and_import.sh
```

`rules.conf`: `FALCO_HOST_RULES=rules/generated-falco-host.lst`

v2: Falco `macro` ve `list` ifadelerini genisletir; bir Falco kurali birden fazla Guardian satirina donusur.

Test:

```bash
bash scripts/incident_e2e.sh
```
