# BuyLens

BuyLens is a buyer-side AI agent for one candidate product at a time. A visitor describes a purchase need in free text, confirms editable buying criteria, supplies review text, and receives an evidence-grounded decision brief when the controller permits one. The explicit **Load demo** path uses synthetic headphone reviews; a fresh purchase starts empty.

## Workflow

Free-text need → structured criteria → Confirm/Edit → review evidence → agent action → controller validation → decision brief.

The agent can choose `INVESTIGATE_CONFLICT`, `REQUEST_EVIDENCE`, `FINALIZE`, or `STOP_INSUFFICIENT`. Four conceptual tools prepare reviews, extract evidence, investigate conflict, and compose the brief. The controller validates exact source quotes, critical evidence coverage, action targets, investigation limits, and brief references. With no reviews, extraction is skipped and the agent requests evidence instead of inventing it. Adding reviews preserves request and decision history; editing confirmed criteria starts a new analysis version.

The model interprets meaning and proposes actions. The deterministic controller enforces the bounds. There is no scraping, product search, recommendation ranking, login, or checkout.

## Validation

The repaired generic flow was tested with new carry-on suitcase, office chair, and air fryer needs, including an unknown product clarified once. Headphone conflict/request/skip/add workflows remained 3/3 under the previously validated `gpt-6.1-sol` integration. Exact quote checks and category separation were exercised. These tests cover specific synthetic cases, not universal product accuracy or review authenticity. See `CORE_FLOW_AUDIT.md` for the repaired behavior and `VERIFICATION.md` for historical results.

Historical pre-release validation: `gpt-6-luna` passed English and Chinese generic interpretation and a complete office-chair evidence → `FINALIZE` → brief flow with valid citations. Two luggage attempts stopped at `REQUEST_EVIDENCE` because supplied price or durability evidence did not pass the existing critical coverage rules. No controller or sufficiency threshold was loosened. Historical `gpt-6.1-sol` validation remains recorded separately.

## Running and deployment

Next.js 16, TypeScript, Zod, OpenAI, and one Supabase `public.sessions` JSONB table. Copy `.env.example` to `.env.local` and set the server-only OpenAI/Supabase values locally. Apply `supabase/schema.sql` if the table does not exist.

```sh
npm ci
npm run dev -- --port 3102
npm test
npm run test:e2e
npm run typecheck
npm run build
```

Current production uses `OPENAI_MODEL=gpt-6-luna` and `BUYLENS_LIVE_ENABLED=true`. `MAX_LIVE_MODEL_CALLS_PER_SESSION=8` limits model request attempts per persisted guest session, with each request reserved before contacting OpenAI. A visitor can start a fresh session, so this is a per-session control rather than a global spend ceiling. The `Load demo` path stays available without model calls. `NEXT_PUBLIC_DEFAULT_LOCALE=en` or `zh` sets the first-visit language; saved user choice takes precedence. Confirmation keeps strict controller validation; user-facing failures use stable error codes and localized messages.

Only `NEXT_PUBLIC_DEFAULT_LOCALE` is public. Keep `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. `.env.local`, dependencies, build output, archives, and test screenshots are excluded from Git. `npm run test:e2e` runs the free demo and language checks; paid live suites remain separate.

## Public sites

- English Vercel: https://buylens-agent.vercel.app/
- Chinese Render: https://buylens-cn.onrender.com/

Both public sites run live model analysis and save guest sessions to Supabase. The English site defaults to English; the Chinese site defaults to Chinese. The same application commit is deployed to each, with locale selected by environment variable. Production release smoke results are recorded in the current release report; older validation files remain historical.
