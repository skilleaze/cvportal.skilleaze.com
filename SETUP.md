# Skilleaze Internal CV Portal — go-live guide

Time needed: about 45 minutes. Cost: Supabase free plan + Anthropic pay-as-you-go (a few cents per AI action).

## What runs where
- **Hosting (static files):** this folder, on GitHub Pages / Vercel / Netlify, e.g. `cvportal.skilleaze.com`.
- **Supabase (backend):** users, sign-ins, CVs (database) + the `ai` Edge Function.
- **Anthropic (AI):** called only from the Edge Function, so the API key never reaches the browser.

---

## Step 1 — Create the Supabase project
1. Go to supabase.com → sign in → **New project**.
2. Name `skilleaze-portal`, set a strong database password (save it), region **Mumbai (ap-south-1)**.
3. Wait ~2 minutes until the project is ready.

## Step 2 — Create the database
1. Left menu → **SQL Editor** → **New query**.
2. Open `supabase-schema.sql`, copy everything, paste, click **Run**. You should see "Success".
3. This creates the tables, the admin account `skilleazeadmin` and all sign-in/CV functions. Tables are locked; the app can only use these functions.

## Step 3 — Connect the portal to Supabase
1. **Project Settings → API**. Copy **Project URL** and the **anon public** key.
2. Open `cv-builder/portal-config.js` and fill in:
   ```js
   supabaseUrl:'https://xxxx.supabase.co',
   supabaseAnonKey:'eyJhbGciOi...',
   ```
3. Delete the `window.SKP_SEED_ADMIN_PW=...` line.
4. The anon key is safe to be public. **Never** paste the `service_role` key anywhere in this folder.

## Step 4 — Put the portal online
1. Create a new GitHub repo, e.g. `skilleaze-cv-portal`, and push this folder.
2. Hosting: repo → **Settings → Pages** → Deploy from branch `main` / root. Or import the repo in Vercel (no build settings needed).
3. Custom domain: add `cvportal.skilleaze.com` in Pages/Vercel, then at your domain provider add a **CNAME** `cvportal` → the address they give you.
4. Wait for HTTPS to turn on (up to an hour).

## Step 5 — First sign-in
1. Open `https://cvportal.skilleaze.com`.
2. Sign in: `skilleazeadmin` / `Skz!Adm-4Rq9#Vt72Lp`.
3. **Change the password straight away**: CV experts list → your row → Reset password (or ask me to add a self-service change).
4. Create each CV expert with Add a CV expert, and send them their username and password privately.

## Step 6 — Turn on AI
You need: an Anthropic API key and the Supabase CLI on your Mac.

1. **Anthropic key:** console.anthropic.com → sign up → **Billing**: add a card and $10 credit → set a **monthly spend limit** (e.g. $20) → **API Keys → Create key** (starts `sk-ant-`). Copy it once.
2. **Install the CLI** (Terminal):
   ```bash
   brew install supabase/tap/supabase
   ```
3. **Link and deploy** — run inside this folder:
   ```bash
   cd path/to/skilleaze-cv-portal/cv-builder
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
   supabase secrets set ALLOWED_ORIGINS=https://cvportal.skilleaze.com
   supabase functions deploy ai --no-verify-jwt
   ```
   `YOUR_PROJECT_REF` is the `xxxx` part of your Project URL.
4. That's it — `aiEnabled:true` in `portal-config.js` makes the builders call `https://xxxx.supabase.co/functions/v1/ai`.

**How it's protected:** the function only answers signed-in portal users (it checks their session against the database), only from your domain, and prompts are capped in size. Your spend limit is the final safety net.

**AI features this unlocks:** Start with AI (draft a CV from rough notes), Suggest skills, Tailor my summary, add missing keywords from a job description, and cover-letter drafting — in both the ATS and Europass builders.

## Step 7 — Test checklist
- [ ] Admin signs in; dashboard counts load.
- [ ] Create a test expert; sign in as them in a private window.
- [ ] Expert creates an ATS CV and a Europass CV; both show in the admin search by name, phone and CV code.
- [ ] Open the same CV on a second laptop/phone — it's there.
- [ ] Click **Suggest skills** — suggestions appear within ~10 seconds.
- [ ] Download PDF and Word.
- [ ] Disable the test expert; they can no longer sign in. Then delete them.

## If something fails
- **"Please sign in again"** on every action → `portal-config.js` URL/key wrong, or the SQL in Step 2 didn't run fully.
- **AI: "Please sign in again."** → you're signed out, or the CV builder was opened outside the portal.
- **AI: CORS / "AI unavailable"** → `ALLOWED_ORIGINS` must match the address in the browser exactly (https, no trailing slash). Add several separated by commas.
- **AI: credit / billing error** → top up in the Anthropic console.
- Logs: Supabase → **Edge Functions → ai → Logs**.

## Ongoing
- Backups: Supabase free plan has no automatic backups — export monthly (**Database → Backups** on Pro, or Table Editor → export CSV).
- Free plan pauses after 7 days with no activity; any sign-in wakes it. Upgrade to Pro ($25/month) when the team uses it daily.
- Payments in the builder are still simulated (`DEMO_PAY=true`) until Razorpay/Stripe is connected.
