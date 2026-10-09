import { criticalGaps, templateBrief } from './agent';
import { initialCriteria } from './fixtures';
import type { Evidence, Reasoner } from './types';

function minutes(text: string): number | null {
  const match = text.match(/(\d+)\s*[- ]?minute/i);
  if (match) return Number(match[1]);
  const hours = text.match(/(\d+)\s*[- ]?hour/i);
  if (hours) return Number(hours[1]) * 60;
  if (/two[- ]hour|两小时/.test(text)) return 120;
  if (/three[- ]hour|三小时/.test(text)) return 180;
  return null;
}
// Intentionally simple prepared-data provider. Never presented as live AI.
export const demoReasoner: Reasoner = {
  async interpret(need, clarified) {
    const specific = /subway|地铁/i.test(need) && /library|study|图书馆|学习/i.test(need);
    const criteria = initialCriteria();
    criteria[0].minutes = minutes(need) ?? 120;
    return { criteria, question: !specific && !clarified ? 'Where will you wear the headphones, and how long is one study session?' : null };
  },
  async extract(s) {
    const items: Omit<Evidence, 'id'>[] = [];
    for (const review of s.reviews) {
      const text = review.rawText;
      const duration = minutes(text);
      const environment = /subway|地铁/i.test(text) ? 'subway' : /office|desk|办公室/i.test(text) ? 'office' : /library|study|图书馆|自习/i.test(text) ? 'library' : 'unknown';
      const glasses = /without glasses|do not wear glasses|不戴眼镜/i.test(text) ? false : /wearing glasses|戴眼镜/i.test(text) ? true : null;
      for (const criterion of s.criteria) {
        const comfort = criterion.id === 'comfort';
        if (comfort ? !/comfort|clamp|ear pain|ears|head pressure|warm|hurt|夹头|耳痛|舒服/i.test(text) : !/anc|noise|rumble|降噪|轰鸣/i.test(text)) continue;
        const challenge = comfort ? /press into|hurt|painful|ear pain(?! or)|耳痛|不舒服/i.test(text) && !/no ear pain/i.test(text) : /little reduction|does not reduce|几乎没用/i.test(text);
        const specific = duration !== null && environment !== 'unknown';
        const direct = comfort ? duration !== null && duration >= (criterion.minutes ?? 0) : environment === 'subway';
        items.push({ reviewId: review.id, criterionId: criterion.id, quote: text, polarity: challenge ? 'challenge' : 'support', quality: specific ? 'high' : duration !== null ? 'medium' : 'low', relevance: direct ? 'direct' : 'partial', environment, minutes: duration, glasses, reason: !specific ? 'Little actual usage context.' : direct ? 'Usage context matches your confirmed criterion.' : 'Useful context, but it does not match your confirmed use case.', repetitive: false, ratingContradiction: review.rating !== null && review.rating >= 4 && challenge });
      }
    }
    return items;
  },
  async investigate(s, c) {
    const evidence = s.evidence.filter(e => c.evidenceIds.includes(e.id));
    const negative = evidence.filter(e => e.polarity === 'challenge');
    const positive = evidence.filter(e => e.polarity === 'support');
    const explained = negative.length > 0 && negative.every(e => e.glasses === true) && positive.every(e => e.glasses === false);
    return { explained, finding: explained ? 'The uncomfortable account involves glasses; the comfortable accounts explicitly do not. This is a context difference, not proof that glasses caused the pain. Your own fit remains uncertain.' : 'The provided accounts do not explain the conflicting experiences. More matching context is needed.', evidenceIds: evidence.map(e => e.id) };
  },
  async decide(s, allowed) {
    if (allowed.includes('INVESTIGATE_CONFLICT')) return { action: 'INVESTIGATE_CONFLICT', targetId: s.conflicts.find(c => c.status === 'open' && c.investigatedVersion !== s.version)!.id, reason: 'Comfort accounts conflict. Check the wearing context before drawing a conclusion.' };
    if (allowed.includes('REQUEST_EVIDENCE')) { const gap = criticalGaps(s)[0]; return { action: 'REQUEST_EVIDENCE', targetId: gap.criterionId, reason: gap.criterionId === 'anc' ? 'Office ANC cannot answer your subway question. Add two distinct subway usage reviews, or leave this unknown.' : 'Long-session comfort lacks enough distinct relevant accounts. Add long-session reviews, or leave this unknown.' }; }
    if (allowed.includes('FINALIZE')) return { action: 'FINALIZE', targetId: null, reason: 'Both critical criteria have relevant, distinct evidence. Preserve the caveats in a decision brief.' };
    return { action: 'STOP_INSUFFICIENT', targetId: null, reason: 'Critical evidence is still missing or conflicting. Stop rather than invent an answer.' };
  },
  async compose(s, incomplete) {
    const brief = templateBrief(s, incomplete);
    brief.beforeBuying = ['Try these headphones for your confirmed study duration, with your usual glasses if applicable.', 'Confirm the return policy and test ANC on your actual subway route.'];
    return brief;
  },
};
