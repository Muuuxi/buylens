# BuyLens live setup — final

Verified on 2026-10-06 in the final refined project.

- OPENAI_API_KEY, OPENAI_MODEL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured locally in the ignored .env.local.
- Configured model: gpt-6.1-sol. Structured requests use Chat Completions; action selection uses Responses API.
- Model connection and strict structured output: PASS.
- Supabase Data API and all required public.sessions columns: PASS.
- Live scenario validation: 3/3 passed. Exact quotations, bounded controller actions and refresh restoration were verified.
- Provider timeout: 60 seconds. No retry or deterministic fallback hides a failed live call.

Use BUYLENS_BASE_URL to target the running private development server. Credentials remain server-only.

All four required production variables were securely configured as protected Vercel Secrets on 2026-10-07; their values were not printed. Public demo: https://buylens-agent.vercel.app.

Public production/Vercel deployments disable live session APIs. There is no approved controlled public-live access mechanism; local development retains live mode. See VERIFICATION.md and DEPLOYMENT_STATUS.md.
