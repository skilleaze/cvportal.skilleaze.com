// Supabase Edge Function "ai-public": AI for the customer CV Builder (no login).
// Only accepts requests from cvbuilder.skilleaze.com (and localhost for testing), with a per-visitor limit.
// Secrets: ANTHROPIC_API_KEY and/or BACKUP_AI_KEY (free Gemini / Groq / OpenRouter key, used when Claude fails). See llm.ts.
// Optional: ANTHROPIC_MODEL, PUBLIC_AI_LIMIT (requests per hour, default 40)
import { askAI } from "./llm.ts";
const LIMIT = Number(Deno.env.get("PUBLIC_AI_LIMIT") ?? "40");
const hits = new Map<string, number[]>();

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const ok = /^https:\/\/cvbuilder\.skilleaze\.com$/i.test(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const cors = {
    "Access-Control-Allow-Origin": ok ? origin : "https://cvbuilder.skilleaze.com",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "content-type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!ok) return json({ error: "Not allowed" }, 403);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (list.length >= LIMIT) return json({ error: "You have used the AI a lot this hour. Please try again later." }, 429);
  list.push(now); hits.set(ip, list);

  try {
    const body = await req.json();
    if (typeof body?.url === "string") {
      // Read a public job post and return its text
      let u: URL;
      try { u = new URL(body.url); } catch { return json({ error: "Bad link" }, 400); }
      if (!/^https?:$/.test(u.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) return json({ error: "Bad link" }, 400);
      const pr = await fetch(u.toString(), { headers: { "user-agent": "Mozilla/5.0 (compatible; SkilleazeBot/1.0)", "accept": "text/html,*/*" }, redirect: "follow" }).catch(() => null);
      if (!pr || !pr.ok) return json({ error: "Could not open that page" }, 422);
      const html = (await pr.text()).slice(0, 600000);
      const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join(" ");
      const jp = /"@type"\s*:\s*"JobPosting"/.test(ld) ? ld : "";
      const text = (jp + " " + html)
        .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, "\n").replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\\u003c[^>]*\\u003e/g, " ")
        .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 12000);
      if (text.length < 150) return json({ error: "Not enough text on that page" }, 422);
      return json({ text });
    }
    const { prompt } = body;
    if (!prompt || typeof prompt !== "string" || prompt.length > 80000) return json({ error: "Bad request" }, 400);
    const out = await askAI("You are an expert CV writer and ATS specialist. Follow the user's instructions exactly. Never invent employers, dates, qualifications or achievements. Return only what is asked.", prompt);
    if ("error" in out) return json({ error: "AI unavailable: " + out.error }, 502);
    return json({ text: out.text, provider: out.provider });
  } catch (_e) {
    return json({ error: "AI unavailable" }, 500);
  }
});
