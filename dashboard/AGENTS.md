<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Log Guardian dashboard — operatör girişi

## Birincil URL: `https://localhost:8443`

Sunum ve operatör akışı **Docker prod stack** üzerinden (`docker-compose.prod.yml` + Caddy TLS).

| Ortam | URL | Ne için |
|-------|-----|---------|
| **Prod stack** | `https://localhost:8443` | Demo, sunum, operatör — **hedef bu** |
| Dev | `http://localhost:3001` | Hızlı UI iterasyonu (`npm run dev`) |

Yeni panel, API route veya ana sayfa bileşeni eklerken **:8443’te görünür olması şart** — sadece `:3001` yeterli değil.

## Dashboard değişikliği sonrası (repo kökü)

```bash
cd ~/Masaüstü/Linux\ Log\ Guardian   # dashboard/ içinden script çalıştırma
bash scripts/sync_dashboard_data.sh   # bench/kanıt JSON — isteğe bağlı
bash scripts/dashboard_refresh.sh       # Docker image rebuild + container up
```

Tarayıcı: **Ctrl+Shift+R** on `https://localhost:8443/`

## Mevcut ana sayfa katmanları (:8443)

- Attack map (`AttackWorldMap`)
- **SOC timeline** (`SocTimelinePanel` — incident · ban · lineage)
- Validation tests · Banned IPs · Incidents

Yeni SOC/operatör özelliği → `page.tsx` veya ilgili panel + `/api/*` route; ardından `dashboard_refresh.sh`.
