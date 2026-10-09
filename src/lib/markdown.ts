import { criticalGaps } from './agent';
import type { BriefItem, Evidence, Session } from './types';

// Escape user/model text as Markdown content, never as markup or HTML.
const text = (value: string) => value.replace(/\\/g, '\\\\').replace(/([`*_{}\[\]<>#|])/g, '\\$1').replace(/\r?\n/g, ' ');
export function markdownBrief(s: Session): string {
  if (!s.brief) throw new Error('A validated decision brief is required.');
  const refs = (ids: string[]) => [...new Set(ids.map(id => s.evidence.find(e => e.id === id)?.reviewId).filter((id): id is string => !!id))].map(id => `[${id}](#source-${id.toLowerCase()})`).join(', ');
  const items = (values: BriefItem[], empty: string) => values.length ? values.map(item => `- ${text(item.text)} ${refs(item.evidenceIds)}`).join('\n') : empty;
  const evidence = (e: Evidence) => `- ${text(s.criteria.find(c => c.id === e.criterionId)?.label ?? e.criterionId)}: “${text(e.quote)}” ${refs([e.id])} — ${e.polarity}, ${e.relevance}, ${e.quality} quality; context: ${text(e.environment)}${e.minutes === null ? '' : `, ${e.minutes} min`}${e.ratingContradiction ? '; rating/text contradiction' : ''}`;
  const gaps = criticalGaps(s);
  return [
    '# BuyLens Purchase Decision Brief',
    '## User Context', `${text(s.product)}\n\n${text(s.need)}\n\n${s.mode === 'demo' ? 'Deterministic demo using synthetic prepared examples.' : 'Live analysis of supplied reviews.'} Review authenticity is not verified.`,
    '## Confirmed Buying Criteria', s.criteria.map(c => `- ${text(c.label)} (${c.priority}): ${text(c.context)}${c.minutes === null ? '' : `; ${c.minutes} min per session`}`).join('\n'),
    '## Evidence Summary', `${s.reviews.length} reviews analyzed; ${s.evidence.length} exactly cited evidence items. ${s.brief.incomplete ? 'Critical evidence remains insufficient.' : 'Complete with caveats under the controller coverage rules.'}\n\n${s.assessments.map(a => `- ${text(s.criteria.find(c => c.id === a.criterionId)?.label ?? a.criterionId)}: ${a.coverage}, ${a.confidence} coverage confidence, ${a.units} distinct relevant accounts. ${refs(s.evidence.filter(e => e.criterionId === a.criterionId && e.quality !== 'low').map(e => e.id))}`).join('\n')}\n\n${s.evidence.map(evidence).join('\n')}`,
    '## What Fits Your Needs', items(s.brief.fits, 'No sufficiently supported fit claims for unresolved criteria.'),
    '## Risks For You', items(s.brief.risks, 'No specific adverse experience extracted; this does not prove there are no risks.'),
    '## Contradictory Evidence', `${s.evidence.filter(e => e.polarity === 'challenge').map(evidence).join('\n') || 'No contradictory evidence extracted.'}${s.conflicts.length ? '\n\n' + s.conflicts.map(c => `- ${text(c.finding || 'Conflict remains unexplained.')} ${refs(c.findingEvidenceIds.length ? c.findingEvidenceIds : c.evidenceIds)}`).join('\n') : ''}`,
    '## Evidence Gaps / Unknowns', `${gaps.map(a => `- ${text(s.criteria.find(c => c.id === a.criterionId)?.label ?? a.criterionId)}: ${text(a.reason)}`).join('\n') || 'No critical gap under the controller coverage rules.'}\n\nActual performance in your usage context remains unverified.${s.brief.incomplete ? `\n\nAnalysis stopped: ${text(s.decision?.reason ?? 'Critical unknowns remain.')}` : ''}`,
    '## Before You Buy', s.brief.beforeBuying.map(value => `- ${text(value)}`).join('\n'),
    '## Sources', s.reviews.map(r => `### Source ${r.id}\n\n<a id="source-${r.id.toLowerCase()}"></a>\n\n${r.rating === null ? '' : `Rating: ${r.rating}/5\n\n`}> ${text(r.rawText)}`).join('\n\n'),
  ].join('\n\n') + '\n';
}
