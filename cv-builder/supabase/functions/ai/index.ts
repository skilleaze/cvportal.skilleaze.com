// Supabase Edge Function "ai": POST { prompt, token } -> { text }
// Only signed-in portal users can use it (token is checked against portal_sessions).
import { askAI } from "./llm.ts";
// Secrets:  ANTHROPIC_API_KEY (Claude) and/or BACKUP_AI_KEY (free Gemini / Groq / OpenRouter key, used when Claude fails). See llm.ts.
// Older:    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...  ALLOWED_ORIGINS=https://cvportal.skilleaze.com
// Deploy:   supabase functions deploy ai --no-verify-jwt
const ALLOW = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5500").split(",").map((s) => s.trim());
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const norm = (s: string) => s.trim().replace(/\/+$/, "").toLowerCase();
  const ok = ALLOW.includes("*") || ALLOW.map(norm).includes(norm(origin)) ||
    /^https:\/\/([a-z0-9-]+\.)*skilleaze\.com$/i.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const cors = {
    "Access-Control-Allow-Origin": ok ? origin : (ALLOW[0] || "https://skilleaze.com"),
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "content-type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const { prompt, token } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 80000) return json({ error: "Bad request" }, 400);
    // Check the portal session
    const me = await fetch(SB_URL + "/rest/v1/rpc/portal_me", {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "content-type": "application/json" },
      body: JSON.stringify({ p_token: token ?? "" }),
    }).then((r) => r.json()).catch(() => null);
    if (!me || !me.username) return json({ error: "Please sign in again." }, 401);
    const out = await askAI("You are a senior CV writer and recruiter for Skilleaze. Be strictly truthful: never invent employers, job titles, dates, numbers, skills, tools or qualifications. When asked for JSON, return valid, complete JSON only.", prompt);
    if ("error" in out) return json({ error: out.error }, 502);
    return json({ text: out.text, provider: out.provider });
  } catch (_e) {
    return json({ error: "AI error" }, 500);
  }
});
