# Live validation: newly authored synthetic headphones

Status: awaiting user confirmation that credentials are present. No live request or database connection test performed yet. This dataset is validation-only and is not imported into the deterministic provider or product UI.

## Dataset
live-headphones-synthetic.json contains ten new English reviews for a fictional Validation-H2 headphone. Text was authored independently of src/lib/fixtures.ts. validationId and purpose are test annotations, not model inputs. Submit each review as `[rating=N] text`, with blank lines between reviews. The application will assign its own R1… IDs; retain a test mapping to L01…L10 for reporting.

## Live workflows
1. Full ten-review input: interpret the new need, inspect proposed criteria, explicitly confirm comfort (three-hour sessions) and subway low rumble as Critical. Extract all reviews and inspect exact quotes, quality, rating contradictions, context and conflicts. Verify a native action function call selects the next step. Relevant unresolved comfort conflict must not be silently discarded.
2. Eight-review missing-subway input: remove L04/L10, preserve office-only L05. Investigate comfort as needed; expect a request for subway evidence. Skip and verify STOP_INSUFFICIENT with an incomplete brief, not a complete/finalized assessment.
3. Separate missing-subway session: add L04/L10 when requested. Verify same session ID, retained confirmed criteria and decision/request history, version increment and reanalysis. FINALIZE is allowed only if all critical assessments become adequate; if conflict remains genuinely unexplained, retain uncertainty rather than forcing a passing result.

Model outputs may differ. Report actual decisions and reasons; do not substitute deterministic fixture outputs or fabricate a successful path.

## Deterministic boundary fault injections
These are controller tests, distinguished from organic live model outputs:
- A: at an actual critical-gap state, inject a reasoner response proposing FINALIZE. Expect rejection before composition/terminal state.
- B: replace one extraction quote with text absent from its review. Expect exact citation rejection before committing extraction.
- C: inspect actual conflict selection and investigation tools against full input.
- D: inspect missing-subway + skip terminal state, without another evidence request.

## Persistence
Use the actual Supabase-backed live session, not browser localStorage. Record session ID, state, criteria, evidence, decision, counters/version and activity log. Refresh in the same browser context; confirm GET /api/session restores all saved fields. Check matching JSONB snapshot by server-side read. No new auth, tables or event-sourcing architecture.

## Required report
Model connection; Supabase connection; live structured extraction; real tool calling; branching; invalid-finalization guard; citation validation; persistence after refresh. Each ultimately PASS/FAIL with evidence and all encountered errors/fixes. While credentials are pending these checks are NOT RUN, not FAIL and not PASS.
