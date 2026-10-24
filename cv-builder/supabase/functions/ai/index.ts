// Supabase Edge Function "ai": POST { prompt, token } -> { text }
// Only signed-in portal users can use it (token is checked against portal_sessions).
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...  ALLOWED_ORIGINS=https://cvportal.skilleaze.com
// Deploy:   supabase functions deploy ai --no-verify-jwt
const ALLOW = (Deno.env.get("ALLOWED_ORIGINS") ?? "http://localhost:5500").split(",").map((s) => s.trim());
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-4-5";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = {
    "Access-Control-Allow-Origin": ALLOW.includes(origin) ? origin : ALLOW[0],
    "Access-Control-Allow-Headers": "content-type, authorization, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...cors, "content-type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const { prompt, token } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.length > 30000) return json({ error: "Bad request" }, 400);
    // Check the portal session
    const me = await fetch(SB_URL + "/rest/v1/rpc/portal_me", {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "content-type": "application/json" },
      body: JSON.stringify({ p_token: token ?? "" }),
    }).then((r) => r.json()).catch(() => null);
    if (!me || !me.username) return json({ error: "Please sign in again." }, 401);
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: j?.error?.message ?? "AI error" }, 502);
    const text = (j.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    return json({ text });
  } catch (_e) {
    return json({ error: "AI error" }, 500);
  }
});
