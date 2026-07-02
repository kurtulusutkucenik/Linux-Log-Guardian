# Mesh etcd — prod cluster

**Opsiyonel Enterprise.** Kod: `etcd_mesh.c`, `mesh_intel.c` · Helm: `helm/log-guardian`

## Ne yapar

| Bileşen | Rol |
|---------|-----|
| etcd | Tenant policy, ban listesi, fleet komutları |
| mesh_intel | Cross-node sinyal paylaşımı |
| ZMQ | Opsiyonel (HAVE_ZMQ=0 ise kapalı) |

Laptop/VM demo: `MESH_BACKEND=none` (journal gürültüsü önlenir).

## Prod açma

```bash
# 1) etcd (tek node veya cluster)
docker run -d --name etcd -p 2379:2379 quay.io/coreos/etcd:v3.5.16 \
  /usr/local/bin/etcd --advertise-client-urls http://0.0.0.0:2379 \
  --listen-client-urls http://0.0.0.0:2379

# 2) rules.conf
MESH_BACKEND=etcd
MESH_ETCD_ENDPOINTS=http://127.0.0.1:2379
MESH_PUB_ENABLED=1

# 3) doğrulama
bash scripts/mesh_etcd_e2e.sh
```

## Helm

```bash
helm upgrade --install lg ./helm/log-guardian \
  --set meshBackend=etcd \
  --set meshEtcd.endpoints=http://etcd:2379
```

## Kanıt

- `mesh-etcd-report.json` — `/tests` kartı
- `bash scripts/mesh_etcd_e2e.sh` — kod + helm values gate

İlgili: [ENTERPRISE_SUPPORT.md](ENTERPRISE_SUPPORT.md) · [SCOPE_COVERAGE.md](SCOPE_COVERAGE.md)
