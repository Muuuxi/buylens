# BuyLens final release handoff

Released and verified on 2026-10-07 from the final refined project.

## Public URL

https://buylens-agent.vercel.app

Vercel project: buylens-agent, in the verified owner scope 174934qq-7634s-projects.
Production deployment: dpl_ANUu4xLxcsTx7EhDhzU3J21gsnnH, READY.
No deployment protection was disabled; the production alias was tested without authentication.

## Completed

- Chinese case-study source and page updated with verified results and the public demo link. Existing visual structure and English copy/navigation retained.
- README, final engineering verification record and 85-second Chinese recording script completed.
- Git repository initialized on main with clean sources/documents staged. No GitHub remote push was requested or performed.
- Local secrets, dependencies, build caches, generated screenshots, historical UI-audit artifacts, reference media and nested ZIPs excluded.
- Architecture documents and deterministic evaluation source/results retained; synthetic review dataset labeled.
- Candidate/staged source files checked against configured private keys and token patterns; built browser assets contain no configured private key values.
- OPENAI_API_KEY, OPENAI_MODEL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY configured as protected production Secrets via CLI stdin; only their names/statuses were printed.
- Production and Vercel API entry points disable live sessions before model/database access, even with credentials configured. Local development retains the verified live integration. Controller and agent behavior are unchanged.

## Release checks

- Unit tests: 18/18 PASS.
- Deterministic evaluation: 8/8 PASS; source fingerprint regenerated and verified live status clearly distinguished.
- Typecheck and local/remote production builds: PASS.
- Local built production app: 6/6 desktop/mobile deterministic browser flows PASS.
- Unauthenticated public URL: 6/6 browser flows PASS, including Criteria, Evidence Workspace, agent decisions, source quotations, Decision Brief, Markdown, Evaluation, reload and mobile.
- Public API cost gate: PASS, including direct live-create and step attempts with a supplied guest cookie.
- Chinese portfolio: desktop/mobile PASS; verified metrics in Evaluation, no page errors/overflow, English copy retained.

The completed 2026-10-06 engineering evidence remains: 3/3 live scenarios, real OpenAI calls PASS, Supabase refresh restoration PASS, deterministic fallback NONE, 9 browser tests passed and 1 credential-free-only check skipped. Publication checks did not repeat paid live calls.

## Remaining owner actions

None. Account authorization completed during the release. Public live access remains deliberately disabled; no complex authentication system or new product feature was added.
