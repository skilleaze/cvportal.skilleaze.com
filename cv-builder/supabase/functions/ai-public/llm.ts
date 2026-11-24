// Shared AI caller: Claude (ANTHROPIC_API_KEY) first, then a free backup key (BACKUP_AI_KEY) if Claude fails
// (credit finished, key missing, rate limit, outage). The backup provider is detected from the key:
//   AIza...  -> Google Gemini      gsk_...  -> Groq      sk-or-... -> OpenRouter      sk-... -> OpenAI
// Optional secrets: BACKUP_AI_MODEL (force a model), BACKUP_AI_URL (any OpenAI-compatible chat/completions URL),
//                   AI_PRIMARY=backup (use the backup key first and Claude only if it fails).
type Out = { text: string; provider: string } | { error: string; status: number };

async function claude(system: string, prompt: string): Promise<Out> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return { error: "Claude key not set", status: 503 };
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5", max_tokens: 16000, temperature: 0.2, system, messages: [{ role: "user", content: prompt }] }),
  }).catch(() => null);
  if (!r) return { error: "Claude unreachable", status: 502 };
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { error: j?.error?.message ?? "Claude error " + r.status, status: r.status };
  const text = (j.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
  return text ? { text, provider: "claude" } : { error: "Claude returned nothing", status: 502 };
}

function backupCfg(key: string) {
  const url = Deno.env.get("BACKUP_AI_URL");
  const force = Deno.env.get("BACKUP_AI_MODEL");
  let c: { name: string; url: string; models: string[]; extra: Record<string, unknown>; max: number };
  if (key.startsWith("AIza")) c = { name: "gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", models: ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"], extra: { reasoning_effort: "low" }, max: 16000 };
  else if (key.startsWith("gsk_")) c = { name: "groq", url: "https://api.groq.com/openai/v1/chat/completions", models: ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"], extra: {}, max: 8000 };
  else if (key.startsWith("sk-or-")) c = { name: "openrouter", url: "https://openrouter.ai/api/v1/chat/completions", models: ["openrouter/free", "meta-llama/llama-3.3-70b-instruct:free", "deepseek/deepseek-chat-v3-0324:free"], extra: {}, max: 8000 };
  else c = { name: "openai", url: "https://api.openai.com/v1/chat/completions", models: ["gpt-4o-mini"], extra: {}, max: 16000 };
  if (url) { c.url = url; c.name = "custom"; c.extra = {}; }
  if (force) c.models = [force];
  return c;
}

async function backup(system: string, prompt: string): Promise<Out> {
  const key = (Deno.env.get("BACKUP_AI_KEY") ?? "").trim();
  if (!key) return { error: "Backup key not set", status: 503 };
  const c = backupCfg(key);
  let last: Out = { error: "Backup AI error", status: 502 };
  for (const model of c.models) {
    const r = await fetch(c.url, {
      method: "POST",
      headers: { authorization: "Bearer " + key, "content-type": "application/json", "HTTP-Referer": "https://cvportal.skilleaze.com", "X-Title": "Skilleaze" },
      body: JSON.stringify({ model, temperature: 0.2, max_tokens: c.max, ...c.extra, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] }),
    }).catch(() => null);
    if (!r) { last = { error: c.name + " unreachable", status: 502 }; continue; }
    const j = await r.json().catch(() => ({}));
    const msg = Array.isArray(j) ? j[0]?.error?.message : j?.error?.message;
    if (!r.ok) {
      last = { error: c.name + ": " + (msg ?? "error " + r.status), status: r.status };
      if (r.status === 404 || r.status === 400 || /model/i.test(String(msg))) continue; // try next model
      break;
    }
    const text = String(j?.choices?.[0]?.message?.content ?? "").replace(/^\s*<think>[\s\S]*?<\/think>\s*/i, "");
    if (text) return { text, provider: c.name + ":" + model };
    last = { error: c.name + " returned nothing", status: 502 };
  }
  return last;
}

export async function askAI(system: string, prompt: string): Promise<Out> {
  const order = (Deno.env.get("AI_PRIMARY") ?? "").toLowerCase() === "backup" ? [backup, claude] : [claude, backup];
  const a = await order[0](system, prompt);
  if ("text" in a) return a;
  const b = await order[1](system, prompt);
  if ("text" in b) return b;
  const real = [a, b].find((x) => "error" in x && !/not set$/.test(x.error)) ?? a;
  return real;
}
