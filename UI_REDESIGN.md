# Reference-video UI redesign — 2026-10-02

Preview: http://127.0.0.1:3102/ . The copied app's dev server is kept running. Restart with `Start-BuyLens-UI.cmd` or `npm run dev -- --port 3102` from this directory.

## Changes

- Warm white, modern sans-serif, charcoal typography and cobalt actions replace the editorial/serif presentation.
- Existing headphones become a large product hero. The user's needs are the primary composer; supported criteria remain editable with explicit confirmation.
- Evidence is grouped by confirmed criterion into supports/challenges, with real context, duration, quality, relevance and glasses metadata. Empty challenge sections explicitly preserve uncertainty.
- The workspace shows the actual agent action/reason and recorded execution. Desktop previews the latest four recorded steps. Mobile puts the next action before a compact Agent Run disclosure with real runtime/model-call counts; full records and activity remain expandable.
- Source details use a desktop drawer/mobile sheet, preserve exact quotes and all original context, trap focus, restore opener focus, lock background scrolling, and respect reduced motion.
- The brief begins with product/confirmed criteria and a shopper-facing caveat, then fits, risks, contradictions, quality, unknowns and before-buy checks. Markdown remains a secondary action.
- Demo controls are quieter and functional. Screen changes start at the document top. No new criteria, scores, backend features or fake delays.

## Source boundary

Only three existing application source files changed:

- `src/components/buylens.tsx`
- `src/components/agent-run.tsx`
- `src/app/globals.css`

Documentation, reference-video copies, captures and verification helpers are additional files. `artifacts/ui-redesign/preservation.json` confirms the other 25 baseline source/test/SQL/script files are unchanged, five protected functions (including the headphone SVG) and all 32 event handlers are identical, and all 218 original-source manifest entries retain their hashes. State machine, model/tools/controller, APIs, extraction, citation validation, decision branches, Supabase, fixtures, Markdown generation and existing test logic are untouched.

## Verification

| Check | Result |
| --- | --- |
| Typecheck | Pass; production build also completes TypeScript verification |
| Production build | Pass; `artifacts/ui-redesign/build.log` |
| Existing unit tests | 18 pass, including eight branching/rejection scenarios; `unit-tests.log` |
| Existing browser suite | 7 pass; 3 credential-dependent live tests skipped; `browser-tests.log` |
| Desktop/mobile visuals | All three screens, criteria confirmation, Agent Run, drawer, Markdown and evaluation captured at 1440/390 px; 16 state/viewport checks, no page errors or horizontal overflow |
| Supplemental interaction checks | 320/768 px: all three screens/evaluation fit, exact Markdown clipboard content after Windows LF→CRLF normalization, drawer keyboard/focus return/scroll lock, reduced motion and screen scroll reset pass |
| Preservation | Three presentation source changes only; 25 protected files and 218 originals unchanged |

The ordinary `npm test` launcher fails before tests execute because Windows `os.userInfo()` returns `uv_os_get_passwd ENOMEM` inside tsx. The same original TypeScript test files were compiled with the installed TypeScript compiler and run with Node; no test/provider/dependency alteration or mock was used:

```powershell
node node_modules/typescript/bin/tsc --module commonjs --moduleResolution node --target es2022 --esModuleInterop --resolveJsonModule --skipLibCheck --outDir artifacts/ui-redesign/node-tests tests/agent.test.ts tests/portfolio.test.ts scripts/evaluate.ts
$env:NODE_PATH=(Resolve-Path -LiteralPath node_modules).Path
node --test artifacts/ui-redesign/node-tests/tests/agent.test.js artifacts/ui-redesign/node-tests/tests/portfolio.test.js
```

An exact-text regression in the new execution summary was caught by the unchanged browser suite, fixed by retaining a standalone Agent Run label, and the complete suite rerun successfully. Supplemental clipboard checking accounts for Windows newline normalization; the content itself is unchanged.

Live model/Supabase round trips were not executed without credentials. Physical-device usability is not claimed. Evaluation displays the existing saved eight-scenario snapshot; current original unit tests also execute all eight scenarios.

## Independent review

Initial disposition: **fix**. Three material findings: mobile evidence hierarchy, controller-facing brief takeaway, redundant agent-mode eyebrow. One correction batch applied. The reviewer scored all three **resolved**, with no visible regressions from that batch. Final disposition: **ship**, scoped to those three fixes rather than a new full-surface certification. See `artifacts/ui-redesign/REVIEW.md`.

Design documentation: `DESIGN.md` and `.impeccable/design.json`. Reference frames: `references/frames/`; before/first/final screenshots and JSON reports: `artifacts/ui-redesign/`. No deployment or original-project edit.

Checkpoint: master portfolio `CONTINUE.md`. Continuation phrase: **继续作品集20261002**.
