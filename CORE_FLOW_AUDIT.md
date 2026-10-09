# Core flow audit and repair — 2026-10-08

Canonical project: E:\cmx\AI作品集\portfolio-improved-2026-10-02\sources\buylens-agent

This is a local core-flow repair. No deployment or portfolio update was performed. This report supersedes any earlier claim that headphone-only validation proved a general purchase workflow.

## Root causes found before editing

A. The initial browser task was a deterministic headphone demo. Interpret my needs used demoReasoner unless a separate Start live analysis action first created a server session. The existing production policy disables paid live APIs.
B. demoReasoner returned seeded comfort/ANC criteria. The real provider also had a headphone-only system prompt and schema allowing only comfort/anc and two criteria.
C. createSession supplied Demo-H1, the browser initializer supplied default headphone need/reviews, and old demo localStorage was automatically restored.
D. Fixture reviews, headphone illustrations, preset criteria, glasses-based conflict explanations and headphone before-buying advice belong only to explicitly loaded demo mode.
E. Need/product edits did not replace the entire context; old review text and category-dependent content survived. Shared engine rules, display copy and Markdown also contained headphone assumptions. Both request schema and input validation required reviews before need interpretation.

## Repaired flow

- A normal task starts with empty product, need, criteria, review text, reviews, evidence and brief.
- Interpret my needs directly creates a private live session and calls the configured real model; no manual criterion construction or separate live-start action is needed.
- Product context can be inferred from the need. A model-inferred placeholder is distinguished from a user-provided product, so clarification can resolve the category correctly.
- Model-generated criteria use arbitrary stable IDs, Critical/Medium/Low priorities and explicit numeric Hard constraints. Unknown important values stay unknown.
- One targeted clarification is allowed when essential context is vague. No forced seeded criteria are required for that initial question.
- Confirm/Edit persists the user's confirmed criteria; downstream extraction/action/brief use those criteria and the current product.
- New purchase and changed context clear category-specific state and old reviews; a restore-request race cannot overwrite new input.
- Old demo storage is not restored unless the user explicitly selected Load demo. Demo initialization and preset criteria live in fixtures, not the normal constructor.
- Empty review input is valid. Extraction then records an empty-evidence controller step without asking the model to invent source material; the model selects a valid request/stop branch.
- The controller still enforces exact source quotes, critical/hard-constraint coverage, action targets, one request, one investigation per conflict/version and five decisions.
- Numeric limits are checked against quoted source numbers; changing an editable hard limit also updates its displayed text.
- Environment tags are canonical tokens, preventing descriptive-string mismatches between matching usage environments.
- Headphone compatibility labels apply only to explicitly supplied headphone needs. They are not defaults for another category.
- UI structure and provider/model endpoints are preserved. Existing bilingual display remains; source quotations are never translated or rewritten.

## Actual verification results

- Carry-on suitcase: PASS. Raw need -> real generated criteria including stated budget -> confirmation -> empty-evidence request. Newly authored synthetic reviews also passed real extraction, source quote validation and downstream brief checks.
- Office chair: PASS. Real lumbar/adjustability criteria, confirmed propagation, no luggage/headphone residue, missing-review request, refresh restoration.
- Air fryer: PASS. Real cleaning/footprint criteria, no invented numerical constraints, no old-category evidence; skipping produced STOP_INSUFFICIENT with empty fits/risks.
- Vague need: PASS. One real clarification, then inferred air-fryer context, two observed interpretation calls, no assumed budget/duration.
- Normal headphone leakage: NONE in the tested fresh/reset/category-switch paths.
- Original headphone live workflows: 3/3 PASS (investigate/finalize; request/skip/stop; add/reanalyze/finalize).
- Explicit demo and bilingual UI browser tests: 9/9 PASS.
- Unit tests: 22/22 PASS.
- Typecheck: PASS. Production build: PASS.
- Real model/Supabase were used for live tests; no deterministic fallback was substituted.
- These are observed test flows, not a measurement of arbitrary-product accuracy or review authenticity.

## Files changed for the core repair

- src/lib/types.ts — generic criteria/constraints and inferred-product state.
- src/lib/schemas.ts — generic IDs, criteria count, numeric constraints, canonical environment tokens, optional review input.
- src/lib/agent.ts — empty normal session, complete context reset, criterion propagation, no-review guard, hard-constraint coverage/source checks.
- src/lib/fixtures.ts — explicit headphone demo constructor and seeded demo criteria.
- src/lib/demo-reasoner.ts — demo-only interpretation and before-buying advice.
- src/lib/markdown.ts — product-neutral unknown/performance note.
- src/server/llm.ts — product-neutral interpretation/extraction/investigation/brief prompts and one-action verification.
- src/app/api/session/route.ts — create before reviews; persist provided/inferred product distinction.
- src/components/buylens.tsx — normal live entry, explicit demo, full reset, generic product display, generated-criteria indication and hard-limit editor.
- src/components/language.tsx — preserve static React child semantics during localization.
- src/lib/translations.json — generic entry/control labels.
- tests/generic.test.ts — reset/no-evidence/constraint regressions.
- tests/e2e/generic-live.spec.ts — real UI tests for three categories, vague need, new reviews, skip and restoration.
- tests/agent.test.ts, tests/evaluation.ts, tests/portfolio.test.ts — explicit demo setup and revised parsed-review reset assertion.
- tests/e2e/flows.spec.ts, tests/e2e/language.spec.ts — explicit Load demo setup; preserve demo/bilingual branches.
- tests/e2e/live.spec.ts — live session restoration assertion independent of demo controls.
- package.json — include generic unit tests and focused real generic validation command.
- CORE_FLOW_AUDIT.md and LOCAL_REPAIR_README.md — engineering handoff for this local repair.

## Remaining boundary

The published Vercel URL is unchanged and does not contain this repair. The owner instructed not to deploy. Local live parsing requires private OpenAI/Supabase credentials; no secrets are included in the review ZIP.
