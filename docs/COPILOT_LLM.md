# Copilot — Ollama (isteğe bağlı)

Log Guardian’ın **çekirdeği** (WAF, lineage, dashboard, ban) Ollama **olmadan** çalışır.

Copilot sohbeti için:

| Durum | Davranış |
|--------|----------|
| Ollama yok / model yok | **Kural tabanlı fallback** — filo özeti, lineage, RAG |
| Ollama + model kurulu | Yerel LLM ile doğal dil yanıtı |

## Müşteri Ollama kurmalı mı?

**Hayır — zorunlu değil.** Ürünü denemek ve güvenlik özelliklerini kullanmak için Ollama gerekmez.

**Evet — isteğe bağlı**, Copilot’ta “ChatGPT gibi” akıcı LLM cevabı isteyen kurulumlar için:

1. [Ollama](https://ollama.com) kur (Linux/macOS/Windows)
2. Model indir (önerilen, ~2 GB):

   ```bash
   ollama pull llama3.2:3b
   ```

3. Servis çalışıyor mu kontrol et:

   ```bash
   curl -s http://localhost:11434/api/tags
   ```

   `listen tcp 11434: address already in use` → zaten çalışıyor, ikinci `ollama serve` gerekmez.

4. Dashboard `dashboard/.env`:

   ```env
   COPILOT_OLLAMA_URL=http://localhost:11434
   COPILOT_MODEL=llama3.2:3b
   ```

Uzak sunucuda Ollama varsa `COPILOT_OLLAMA_URL=http://ollama-host:11434`.

## API

- `GET /api/copilot` — `llm.optional: true`, model ve base URL
- `POST /api/copilot` — `source`: `ollama` | `fallback`

## Satış paketi özeti

- Repoda **bulut API key yok**; yalnızca yerel Ollama desteklenir.
- Demo: fallback yeterli.
- Enterprise “akıllı sohbet”: müşteri kendi makinesinde Ollama + `llama3.2:3b` (veya `COPILOT_MODEL` ile başka model).
