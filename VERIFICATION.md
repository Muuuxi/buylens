# BuyLens final engineering verification

Final live verification: 2026-10-06. This record supersedes earlier credential-blocked reports.

- Live scenarios: 3/3 passed with previously unseen, labeled synthetic reviews.
- Real OpenAI calls: PASS; recorded MODEL operations and native action calls.
- Supabase persistence: PASS; criteria, evidence, decision, activity/run log and brief restore after refresh.
- Deterministic fallback: NONE.
- Unit tests: 18/18 passed, including invalid citation and premature FINALIZE rejection.
- Browser tests: 9 passed, 1 skipped; the skipped test is only applicable when credentials are absent.
- Typecheck: PASS.
- Production build: PASS.

## Verified live paths

1. Comfort conflict → INVESTIGATE_CONFLICT → controller permits FINALIZE → validated brief.
2. Missing critical subway evidence → REQUEST_EVIDENCE → human skips → STOP_INSUFFICIENT.
3. Missing evidence → add subway reviews → version increments while history is retained → reanalyze → FINALIZE.

All live evidence quotes are checked against their source review. The synthetic validation annotations are not sent to the model.

## Actual integration lesson

The configured gpt-6.1-sol rejected Chat Completions function-tool calls. Its error suggested reasoning_effort=none, but that value was itself unsupported. A saved request succeeded with Responses API. Only action selection was adapted to Responses; supported structured tasks remain on Chat Completions. The 25-second request deadline also cut off extraction; it is now 60 seconds.

## Public-release boundary

Public production/Vercel APIs are disabled before model/database access. The public UI runs the existing deterministic flow with localStorage and synthetic reviews. Live validation results are historical engineering evidence; they do not imply that a visitor is using live AI.

Release checks for the public-deployment gate and deployed UI are recorded separately in DEPLOYMENT_STATUS.md. Metrics above refer to the completed engineering validation, not new user studies or general accuracy.
