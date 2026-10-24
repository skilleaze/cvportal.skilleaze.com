1. Copy everything into your portal repo (keep your own cv-builder/portal-config.js).
2. GitHub Desktop → Commit to main → Push origin.
3. Re-deploy the AI function (Terminal, inside the repo folder):
   cd cv-builder
   supabase functions deploy ai --no-verify-jwt
   (optional) choose the model: supabase secrets set ANTHROPIC_MODEL=claude-sonnet-4-5
