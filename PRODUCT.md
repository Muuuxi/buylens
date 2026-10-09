# BuyLens product context

BuyLens helps a student inspect supplied reviews for one candidate product against confirmed personal criteria. The current headphone demo supports long-session comfort and subway noise cancellation. Review authenticity and personal fit remain uncertain.

The journey is Criteria → Evidence Workspace → Decision Brief. Users describe their needs, edit and confirm the supported criteria, inspect quotes and conflicts, provide additional reviews or retain an unknown, and read a brief with source citations. There is no checkout, price engine, generic chat or scraping.

Deterministic demo paths use labelled synthetic examples. Browser storage restores the demo. The existing live model/Supabase integration is preserved; this copied version has no credentials, so live round-trip verification is not claimed.

The agent can investigate a conflict, request evidence, finalize, or stop with insufficient evidence. Controller limits, quote validation, coverage rules, Markdown generation and all existing tests remain authoritative. Execution displays observed timestamps and statuses, including zero model calls in deterministic mode.

UI redesign authority: the user's 2026-10-02 pasted request and `references/ui-reference.mp4`. Apply warm neutral space, modern sans-serif typography, prominent existing headphone visuals, lightweight evidence organized by criterion, cobalt actions and a source drawer. Preserve the three stages and all existing product behavior.

Success for this presentation task: all deterministic paths and original tests still pass, each screen is readable on desktop/mobile, next action and uncertainty remain visible, source details/Agent Run/activity/Markdown/evaluation remain accessible, and no original project or deployment changes.
