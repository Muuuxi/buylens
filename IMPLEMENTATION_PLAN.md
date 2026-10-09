# BuyLens implementation plan

Core product direction approved 2026-10-01. This plan supersedes engineering details in the original definition documents. No product expansion.

## Smallest working architecture
Next.js App Router + TypeScript. Three screens: Criteria, Evidence Workspace, Decision Brief. One shared bounded engine; deterministic demo provider first, structured LLM provider second. Four real functions: prepare_reviews, extract_evidence, investigate_conflict, compose_brief. Model selects INVESTIGATE_CONFLICT / REQUEST_EVIDENCE / FINALIZE / STOP_INSUFFICIENT from a validated legal action set.

One Supabase sessions table: id UUID, state TEXT, data JSONB, created_at, updated_at. Server-only database access, RLS enabled, no public table grants. A random HttpOnly session cookie identifies the current guest session; no account or login. Full JSON snapshot replaces the previous snapshot, not event sourcing. No filesystem persistence on Vercel. Without credentials, the explicitly labelled deterministic demo uses browser localStorage; this does not count as verified Supabase persistence or live AI.

## Simplifications
- One clarification round, one additional-evidence request, one investigation per conflict/input version, five decision iterations across a task (not reset by adding evidence).
- Exact/normalized exact duplicates only; model may flag templated text. No similarity algorithms.
- Citation is reviewId + exact quote; require rawText.includes(quote), no offsets.
- Compact log: agent decision, tool called, tool result, user action. No event replay, event sourcing, background queue or multi-agent architecture.
- Six priority tests: vague need; sufficient evidence; comfort conflict; office-only ANC; repetitive/low-information reviews; added evidence changes result. Additional original cases are backlog, not initial release gates.
- Keep two Critical criteria by default; user can edit priority and long-session duration. Do not invent battery/sound priorities.

## Stages and gates
1. Scaffold and full deterministic UI flow. Verify in the browser: conflict → investigation → brief; office ANC → request → skip → insufficient brief; office ANC → add subway reviews → reanalysis → complete brief. Check source links and reload.
2. Add structured LLM provider and server-side tool execution. Validate all returned IDs, exact citations, allowed decisions and bounds. Never silently fall back from live AI to mocked reasoning.
3. Add Supabase JSONB snapshot persistence and guest-session endpoint. Verify writes/reads only against a confirmed project with credentials; missing configuration must remain visible.
4. Run six tests, production build, desktop/mobile browser checks. Document verified results and external setup still required.

## Design plan and critique
Palette: paper #f7f9fc, ink #182942, muted #68778e, blue #375de3, blue wash #edf2ff, amber #93641b. Body: system sans (Segoe UI on Windows); headings: Georgia for a calm reading rhythm. Max width 1160px, left alignment, genuine three-step navigation. Criteria uses a product dossier beside editable standards; workspace pairs evidence quotes with a narrow criteria/action rail; brief is a readable document, not a dashboard.

Initial generic card-grid idea rejected: identical cards would make supporting facts and uncertainty look equivalent. Use a single main evidence surface, restrained separators, and context-specific quote accents; the distinctive element is the review-to-criterion relationship. No decorative metrics or chat bubbles. No significant animation.

## Current external constraints
The locked portfolio completion on 2026-10-02 adds only measured Agent Run observations, expanded source/evidence details, Markdown generated from validated brief state, and a separate developer evaluation snapshot. Preserve three screens, four tools, action state machine and visual direction. Additive traces use existing JSONB snapshots with no schema migration. No fake demo model counts or delays. Gate live tests on credentials, keep the dev server running and do not deploy.

No OPENAI_API_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY found in the workspace environment. Connected Supabase account lists only an inactive project. Build integrations now; live model and cloud persistence cannot be claimed verified until configuration is available. Do not modify an unrelated project or create a paid resource without a selected target.
