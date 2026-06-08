/** Copilot — yalnızca yerel Ollama; kapalıysa API kural tabanlı fallback kullanır. */

export type CopilotOllamaConfig = {
  baseUrl: string;
  model: string;
};

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

import { pickCopilotModel } from "@/lib/copilotQuality";

export function resolveCopilotOllamaConfig(): CopilotOllamaConfig {
  const defaultUrl =
    process.env.NODE_ENV === "production"
      ? "http://host.docker.internal:11434"
      : "http://127.0.0.1:11434";
  return {
    baseUrl: trimSlash(process.env.COPILOT_OLLAMA_URL || defaultUrl),
    model: pickCopilotModel(),
  };
}

export function copilotOllamaStatus(): {
  provider: "ollama";
  model: string;
  baseUrl: string;
  optional: boolean;
  hint: string;
} {
  const cfg = resolveCopilotOllamaConfig();
  return {
    provider: "ollama",
    model: cfg.model,
    baseUrl: cfg.baseUrl,
    optional: true,
    hint: "Yerel Ollama bagliysa dogal dil; degilse filo verisine dayali akilli ozet.",
  };
}

/** Ollama erisilebilir mi (hizli saglik kontrolu). */
export async function checkOllamaReachable(config?: CopilotOllamaConfig): Promise<boolean> {
  const cfg = config ?? resolveCopilotOllamaConfig();
  try {
    const res = await fetch(`${cfg.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function collectCopilotChat(
  messages: { role: string; content: string }[],
  config?: CopilotOllamaConfig
): Promise<{ content: string; provider: "ollama"; model: string }> {
  const cfg = config ?? resolveCopilotOllamaConfig();
  const content = await collectOllamaChat(cfg.baseUrl, {
    model: cfg.model,
    messages,
  });
  return { content, provider: "ollama", model: cfg.model };
}

/** Ollama /api/chat stream — parça birikimli (cumulative) veya delta olabilir */
export function mergeOllamaChunk(previous: string, chunk: string): string {
  if (!chunk) return previous;
  if (!previous) return chunk;
  if (chunk.startsWith(previous)) return chunk;
  if (previous.endsWith(chunk)) return previous;
  return previous + chunk;
}

export async function collectOllamaChat(
  ollamaUrl: string,
  payload: { model: string; messages: { role: string; content: string }[] }
): Promise<string> {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, stream: true }),
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (!response.body) {
    throw new Error("Empty Ollama response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const data = JSON.parse(trimmed) as {
          message?: { content?: string };
        };
        const part = data.message?.content ?? "";
        if (part) full = mergeOllamaChunk(full, part);
      } catch {
        /* NDJSON satırı bölünmüş olabilir — sonraki chunk'ta tamamlanır */
      }
    }
  }

  if (buffer.trim()) {
    try {
      const data = JSON.parse(buffer.trim()) as { message?: { content?: string } };
      const part = data.message?.content ?? "";
      if (part) full = mergeOllamaChunk(full, part);
    } catch {
      /* ignore trailing partial */
    }
  }

  return full.trim();
}
