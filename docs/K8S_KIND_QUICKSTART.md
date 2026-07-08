# K8s kind — hizli smoke (opsiyonel)

Log Guardian K8s operator: `k8s-operator/` · Helm smoke: `bash scripts/helm_install_smoke.sh`

**Durum:** Kod + helm chart ✅ · Gercek cluster deploy **opsiyonel** (Core vaadi icin zorunlu degil).

---

## Onkosul

```bash
# kind + kubectl + helm
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x kind && sudo mv kind /usr/local/bin/
```

---

## 5 dk smoke

```bash
kind create cluster --name lg-smoke
bash scripts/helm_install_smoke.sh
kubectl get pods -A | grep log-guardian || true
kind delete cluster --name lg-smoke
```

---

## Laptop kapisi (cluster gerekmez)

```bash
cd k8s-operator && go build -o /tmp/lg-operator ./...
bash scripts/helm_install_smoke.sh
```

Rapor: `helm-install-smoke-report.json`

---

## Prod notu

Gercek cluster'da admission webhook + TLS sertifikasi ayri runbook gerektirir. MVP: helm smoke + kind dokumantasyonu yeterli; filo/nginx ban hatti birincil kanit.
