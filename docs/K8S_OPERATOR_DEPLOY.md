# K8s operator — gerçek cluster deploy

**Opsiyonel Pro.** Kod: `k8s-operator/` · Chart: `helm/log-guardian`

## Önkoşul

- Kubernetes 1.26+ (kind/minikube veya prod cluster)
- `helm` 3.x · `kubectl` · `kind` (Linux Mint: `apt install kubectl` yok)
- Log Guardian binary veya container image

CLI (laptop, sudo gerektirmez):

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
bash scripts/install_k8s_cli.sh   # ~/.local/bin/kubectl + kind
```

## Smoke (cluster yok)

```bash
bash scripts/helm_install_smoke.sh
# Chart statik doğrulama — helm yoksa SKIP
```

## Kind / minikube (laptop lab)

```bash
# Dry-run / mevcut cluster
bash scripts/k8s_kind_e2e.sh

# Tam lab (~10-15 dk, docker + kind)
K8S_KIND_CREATE=1 K8S_KIND_BUILD=1 K8S_KIND_APPLY=1 bash scripts/k8s_kind_e2e.sh
kubectl -n log-guardian get pods
bash scripts/k8s_admission_test.sh
```

Tek komut (tüm opsiyonel katmanlar):

```bash
bash scripts/optional_layers_gate.sh
```

## Prod notları

| Konu | Öneri |
|------|--------|
| NIC / XDP | DaemonSet `hostNetwork: true`, `privileged: true` |
| Metrikler | ServiceMonitor → Prometheus |
| API token | Secret → `GUARDIAN_API_TOKEN` |
| Fleet | Her node `agent_sync` + dashboard telemetry |

## Kanıt

- `helm-install-smoke-report.json` — `/tests`
- `phase3_e2e.sh` — operator CRD smoke

İlgili: [TLS_PRODUCTION.md](TLS_PRODUCTION.md) · [LAPTOP_OPS.md](LAPTOP_OPS.md)
