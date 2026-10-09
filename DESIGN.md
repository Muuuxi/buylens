---
name: "BuyLens"
description: "A product-led buying companion with inspectable evidence and preserved uncertainty."
colors:
  paper: "#faf9f6"
  surface: "#fff"
  ink: "#20242b"
  muted: "#626a76"
  blue: "#3155e7"
  wash: "#eef2ff"
  line: "#e6e7e9"
  amber: "#845817"
  green: "#246953"
  product: "#efeee9"
  blue-hover: "#2345c9"
  field-line: "#d8dade"
  positive-wash: "#eaf4ed"
  caution-wash: "#fcf1de"
  neutral-wash: "#edf0f6"
  neutral-ink: "#4b5677"
  snapshot-wash: "#f6f6f2"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "21px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-.02em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  quote:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  action:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
  markdown:
    fontFamily: "Consolas, monospace"
    fontSize: "12px"
    lineHeight: 1.8
rounded:
  metadata: "4px"
  pill: "6px"
  quiet-control: "8px"
  field: "9px"
  action: "10px"
  inset: "12px"
  surface: "16px"
spacing:
  inline: "9px"
  action-gap: "10px"
  compact: "12px"
  small: "14px"
  standard: "16px"
  mobile-surface: "18px"
  mobile-gutter: "20px"
  medium: "22px"
  surface: "24px"
  form: "28px"
  large: "32px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
    rounded: "{rounded.action}"
    padding: "11px 18px"
    typography: "{typography.action}"
  button-primary-hover:
    backgroundColor: "{colors.blue-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "11px 18px"
    typography: "{typography.action}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 13px"
  surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  product-plate:
    backgroundColor: "{colors.product}"
    rounded: "{rounded.inset}"
    padding: "18px"
  pill-positive:
    backgroundColor: "{colors.positive-wash}"
    textColor: "{colors.green}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
    typography: "{typography.label}"
  pill-caution:
    backgroundColor: "{colors.caution-wash}"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
    typography: "{typography.label}"
  pill-neutral:
    backgroundColor: "{colors.neutral-wash}"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.pill}"
    padding: "5px 9px"
    typography: "{typography.label}"
  criterion-findings:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "20px"
  shopper-snapshot:
    backgroundColor: "{colors.snapshot-wash}"
    rounded: "{rounded.inset}"
    padding: "20px 22px"
  demo-trigger:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.quiet-control}"
    padding: "7px 10px"
---

# Design System: BuyLens

## Overview

**Creative North Star: "The Evidence-Led Buying Companion"**

BuyLens adapts the user's pinned modern consumer iOS visual world: warm neutral space, clean platform sans-serif, cobalt actions and a prominent product anchor. White reading surfaces and softly rounded product plates make dense review material approachable without adding shopping features or performance claims.

The existing headphone SVG remains the required product illustration. The three surfaces keep confirmed needs, inspectable evidence and the decision brief connected; the source drawer preserves exact quotations and diagnostic context. Compact desktop composition puts product context, the decision/action and criterion cards ahead of optional execution detail. A brief snapshot makes existing coverage, cited risks and critical gaps easier to compare.

Updated 2026-10-03 after the approved second-pass refinement. This reconciles the incumbent consumer-app system with the finished code; its palette, platform font, illustration and native product functions are preserved.

This is a code-led reference-video adaptation. No random concept seed, raster reproduction comp, detector output or visual pixel-match certification is claimed. The presentation changes preserve the existing backend, controller, APIs, fixtures and Markdown behavior; they do not establish a verified live integration.

**Key Characteristics:**

- Warm white canvas and white reading surfaces.
- Platform sans-serif hierarchy with prominent existing headphone SVG.
- Cobalt actions, green support and amber caution.
- Criterion-grouped evidence with exact source inspection.
- Real execution disclosures and preserved unknowns.

## Colors

Warm neutral product plates and reading surfaces carry the material; cobalt identifies action and current position. Frontmatter is the normative palette.

### Primary

- **Companion Cobalt** (`blue`): primary actions, active stage, focus outlines and source controls. The darker `blue-hover` is the primary hover fill.
- **Cobalt Wash** (`wash`): priority selectors, clarification and exact-quote highlights. Related local washes distinguish agent decisions and brief caveats without implying scores.

### Secondary

- **Evidence Green** (`green`) and **Support Wash** (`positive-wash`): supporting evidence, adequate coverage and completed execution.
- **Caution Amber** (`amber`) and **Caution Wash** (`caution-wash`): challenges, conflicts, missing evidence and failed or rejected execution.

### Neutral

- **Warm Paper** (`paper`): app canvas.
- **Reading White** (`surface`): forms, findings, brief and source drawer; reversed action text.
- **Charcoal** (`ink`): headings, review quotations and principal reading text.
- **Quiet Slate** (`muted`): descriptions, timestamps, source metadata and disclosure.
- **Soft Divider** (`line`): stage, row and document structure.
- **Product Stone** (`product`): plates behind the required headphone illustration.
- **Snapshot Neutral** (`snapshot-wash`): the brief's quieter evidence snapshot.
- **Field Outline** (`field-line`): inputs and secondary buttons.
- **Neutral Wash / Neutral Ink** (`neutral-wash`, `neutral-ink`): quiet contextual status and priority labels.

Semantic colors are accompanied by written labels: Supports, Challenges, evidence coverage and recorded status remain legible without color alone. The headphone SVG retains its own incumbent blue-gray gradient and geometry; those asset colors are not new interface palette roles.

## Typography

**Display and Body Font:** the user's required platform sans-serif stack, resolving locally to the operating system face.  
**Markdown Font:** Consolas with monospace fallback.

**Character:** clean consumer-app type with firm but restrained headings. The same family connects product context, the needs composer and cited material.

### Hierarchy

- **Display:** compact desktop page headings use the display token. Small-mobile page titles also use (30px); the middle-width baseline retains fluid sizing, and other small-mobile h1 elements use (32px).
- **Headline:** regular section titles use the headline token; desktop and small-mobile criterion headings use (20px), while middle mobile widths retain the baseline (22px).
- **Product heading:** criteria product names use (26px); desktop brief names use (23px), workspace names use (20px), and small-mobile brief/workspace names use (20px)/(18px). Product names wrap; only the desktop dossier's secondary use-case summary is clamped to three lines.
- **Title:** compact supporting headings use the title token.
- **Body:** default reading type uses the body token; contextual explanation often uses (13px) or (14px), with observed measures around (64–75ch).
- **Quote:** evidence rows use the quote role across desktop and mobile (14px, line height 1.65). Source-review and exact-quote text retain their drawer-specific reading sizes and line height (1.75).
- **Action and label:** button and pill roles are in frontmatter. Secondary diagnostic labels range from (10px) to (12px). Numeric execution measures use tabular figures, not a second display font.
- **Markdown:** wraps long text and scrolls within its disclosed reading surface.

## Layout

Desktop uses a centered outer measure (1080px) with side padding (24px). At (760px) and below, side padding is (20px) and the baseline outer measure remains (1200px), fitting the viewport. Header height is (64px) above (760px), (72px) at middle mobile widths and (56px) at (480px) and below. Desktop page-title margins are (18px 0 20px); main desktop gaps are typically (18px) or (22px).

**Criteria:** a product dossier column (300px) sits beside the primary needs composer, with gap (22px). The dossier is a white rounded card padded (14px); its inset product plate has minimum height (220px), padding (18px), inset radius and a headphone maximum width (225px). The form uses padding (22px); the composer uses (16px), with textarea minimum height (108px). At (760px), the full screen stacks into one column; the dossier itself pairs a small illustration plate with product copy. At (480px), the product plate column is (140px), form padding is (18px), and primary composer/confirmation actions span the available width.

**Evidence Workspace:** product context precedes a full-width white decision/action panel. Desktop then uses two equal criterion-card columns with gap (18px), followed by conflicts/critical gaps and optional Agent Run/activity. Support and challenge columns share each card; between (761px) and (940px), those inner columns stack and action layout tightens. Desktop criterion cards use padding (20px); small mobile uses (18px). At (760px) and below, the workspace is a single stack: decision and its available full-width action → evidence request when needed → compact Agent Run → evidence heading → criterion cards → conflicts/critical gaps → activity. Edit criteria remains beside product status. Both desktop and mobile show actual runtime and model-call count in a closed Agent Run summary; full records are available on expansion.

**Decision Brief:** a white document pairs the headphone plate with confirmed criteria, then a neutral shopper snapshot carries the actual completion caveat and data-backed coverage/risk/gap groups. Desktop document padding is (26px); the illustration plate is (125px × 120px), and fits/risks use gap (32px). Small mobile stacks snapshot groups, fits/risks and evidence-quality columns. Supporting material can be expanded, contradictory evidence begins open, and Markdown remains below the decision content.

**Source drawer:** a right-side reading panel uses width `min(560px, 100%)` and height (100dvh). On small screens it fills the width, with safe-area-aware padding and a sticky source title/Close row. It scrolls independently while the background page is locked. Closing with its control, backdrop or Escape restores focus to the source opener.

The implemented rhythm uses repeated short row spacings and larger surface pads rather than adding decorative density. Evaluation tables preserve their own horizontally scrollable minimum width on narrow screens.

## Elevation & Depth

Most surfaces distinguish themselves through warm-paper/white contrast and quiet row dividers. The desktop product dossier uses a faint ambient shadow, the Demo popover receives floating-control depth, and the source drawer keeps directional overlay depth. Its dimmed backdrop preserves page context.

### Shadow Vocabulary

- **Desktop product dossier:** `0 6px 22px #20242b09`, a faint lift beneath the product card.
- **Demo popover:** `0 12px 36px #20242b26`, restrained floating-menu depth.
- **Source drawer:** `-12px 0 48px #1118211a`, a restrained leftward shadow separating source inspection from the current decision screen.
- **Backdrop:** `#20242b55`, a translucent charcoal veil behind the drawer.

Primary and secondary buttons use (180ms) background/transform feedback; hover lifts primary actions by (1px) and active state returns them. Evidence and the open Demo popover enter over (180ms) from a (4px) offset; the drawer enters over (220ms) from a (24px) horizontal offset. The shared easing is `cubic-bezier(.16,1,.3,1)`. Reduced-motion preference removes animations and transitions and restores automatic scrolling.

## Shapes

Large reading surfaces and the desktop dossier use the surface radius; the compact desktop product plate uses the inset radius. Actions use the action radius; input fields use the field radius. Inset composer/caveat regions use the inset radius, while pills and metadata use smaller rounding. Stage markers and execution-state markers are circular.

Fine borders (1px) define field edges, evidence rows and document sections. Focus is cobalt with a visible outline (2px); controls generally offset it (4px), while fields use (2px). SVG artwork and the inline SVG brand mark are assets, not a mandate to invent new illustration styles.

## Components

### Primary, secondary and text actions

Primary buttons are cobalt with white text, minimum height (44px), padding from frontmatter and muted disabled opacity (.48). Secondary buttons use white fill, charcoal type and a field-outline border; hover uses a light neutral fill. Text actions stay cobalt with underlines on hover. On mobile, source and text controls grow to touch-friendly dimensions; the compact Agent Run summary and demo controls retain their measured compact treatment.

### Needs composer and criterion editor

The needs textarea leads the criteria screen inside a lightly outlined inset composer. Its visible label, user text and interpret action precede product/review inputs. Generated criteria remain editable and require explicit confirmation. Priority selectors and wearing duration are actual fields, not new scoring controls. Review input remains an expandable supplied-text area.

### Stage navigation and Demo menu

The visible stages read Criteria, Evidence and Decision, while their accessible names preserve the complete stage descriptions. Desktop hides numbered markers, underlines the current stage in cobalt and shows an SVG check for completed stages. Mobile retains numbered markers. Unavailable stages remain disabled.

A quiet Demo trigger in the header opens a native auto popover, closed by default. It contains the original mode, path selector and synthetic/unverified-review notice. Browser-native light dismissal, Escape and keyboard behavior remain authoritative. The panel is (320px) wide, capped to viewport width minus (32px), with inset radius and padding (18px). Opening the controls changes visibility, not agent state or request behavior.

### Criterion findings and source controls

White rounded groups lead with a confirmed criterion, priority/context and coverage label. A count row reports the actual supporting and challenging cited-item array lengths for that criterion; these are counts, not scores, and do not replace the assessment's distinct-account coverage count. Supporting and challenging quotations stay separate. Each quote retains a review-ID control, relevance, evidence quality and detected context, including wearing duration or glasses when supplied. Repeated wording and rating/text disagreement retain their diagnostics.

**The Confirmed Criteria Rule.** Render findings and brief claims only from the session's confirmed supported criteria and supplied evidence. Long-session comfort and subway noise cancellation remain the demo's scope; battery, sound quality and invented numerical scores do not enter this system.

### Agent decision, Agent Run and activity

The decision panel shows the actual selected action and the first sentence of its recorded reason, separate from evidence. The completed/stopped brief action sits in that panel; a waiting state exposes the existing evidence request below it. Agent Run is closed by default on desktop and mobile, showing recorded runtime/model-call count in its summary and full operation records/metrics on expansion. Activity preserves the existing log. No decorative latest-step preview remains.

**The Observed Execution Rule.** Execution labels, statuses, durations and call counts come from recorded operations. Deterministic mode can show zero model calls; pending server requests stay pending until observed steps return.

### Brief and caveats

The brief contains product, confirmed criteria, shopper snapshot, actual completion/missing-evidence label, fits, risks, supporting/contradictory quotes, coverage confidence, unknowns and before-buy checks. The snapshot uses a quiet neutral inset surface, with the actual incomplete state represented by its caution label.

**Strong evidence** includes only criteria whose existing assessment has adequate coverage and high confidence, excluding every criterion watched for a conflict or a cited brief risk. **Watch closely** derives from actual session conflicts or risks in the validated brief whose evidence IDs map back to the criterion. Conflict presence remains watched even if contextual explanation exists. **Still unknown** appears in the snapshot only when the existing critical-gap result is nonempty. The snapshot adds no scores, model request or classification service; strength remains coverage of supplied reviews rather than authenticity or guaranteed fit. Qualitative confidence describes coverage of the supplied material; it is not a numerical purchase recommendation. Markdown is derived from the existing structured brief and adds no model request.

### Source drawer

Inspection exposes original text, exact quote and diagnostic detail. It retains dialog semantics, background scroll locking, keyboard close handling and focus restoration. Tab handling currently focuses the Close control; this description does not claim a generalized multi-control dialog implementation.

**The Source Is Inspectable Rule.** Keep a source control beside cited evidence and retain original review text, exact quotation, criterion, context and diagnostic caveats in the drawer. A checked quotation does not establish review authenticity or personal fit.

### Product illustration

The required incumbent over-ear-headphone SVG appears at a large scale on the start screen and smaller scales in workspace and brief. It anchors the same candidate product across surfaces. It is an illustration, not photographic proof or an added product claim.

## Do's and Don'ts

### Do:

- **Do** use the shared warm-paper, white-surface, charcoal and cobalt tokens.
- **Do** retain the user's pinned platform sans-serif and existing headphone SVG.
- **Do** place the available next action before the compact Agent Run disclosure on small mobile screens.
- **Do** separate supports, challenges, coverage, unknowns and actual completion caveats.
- **Do** retain source inspection, synthetic-review disclosure and reduced-motion behavior.

### Don't:

- **Don't** introduce battery or sound criteria, fake ratings, performance scores or shopping controls.
- **Don't** turn observed execution into an invented timeline, fabricated duration or decorative loading delay.
- **Don't** present coverage confidence as review authenticity or a satisfaction probability.
- **Don't** omit adverse accounts or critical gaps from the brief.
- **Don't** claim reference-video pixel equivalence or validated live backend behavior.

