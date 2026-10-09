export const defaultNeed = 'I commute by subway for about an hour a day and study in the library. I want comfortable headphones for two-hour study sessions and less low-frequency subway noise.';
export const comfortReviews = [
  'In the library I wear these for 120 minutes at a time, without glasses. No ear pain or head pressure, but they get a little warm. I have used them for three weeks.',
  'After a month of use, my 180-minute study sessions are comfortable with no clamping. I do not wear glasses and the room is cool.',
];
export const subwayReviews = [
  'On the subway, after two weeks of commuting, ANC noticeably reduces the low rumble during my 40-minute rides. I can still hear announcements.',
  'I have used these on underground subway trains for three weeks. On 30-minute rides the low train noise is much quieter with ANC, but nearby voices remain audible.',
];
export const officeReviews = [
  'In the office I used ANC for 60 minutes. It reduces the air-conditioning hum, although I still hear typing.',
  'After two weeks at my desk, office fan noise is quieter with ANC on. I wear them for 45 minutes at a time.',
];
export const conflictReview = 'Wearing glasses during 120-minute library sessions, the arms press into my ears and hurt. This has happened throughout three weeks of use.';
export const scenarios = {
  conflict: { label: 'Comfort conflict', description: 'Investigate different wearing contexts.', reviews: [...comfortReviews, ...subwayReviews, conflictReview] },
  missing: { label: 'Missing subway evidence', description: 'Request evidence, then add or skip.', reviews: [...comfortReviews, ...officeReviews] },
  sufficient: { label: 'Sufficient evidence', description: 'Go straight to a supported brief.', reviews: [...comfortReviews, ...subwayReviews] },
  repetitive: { label: 'Repetitive reviews', description: 'Repeated praise cannot fill a gap.', reviews: [comfortReviews[0], comfortReviews[0].toUpperCase(), 'Great! Arrived today.', 'Great! Arrived today.', ...officeReviews] },
};
export type ScenarioKey = keyof typeof scenarios;
import { createSession } from './agent';
import type { Criterion } from './types';

// Explicitly loaded synthetic headphone demo only; never normal initialization.
export const initialCriteria = (): Criterion[] => [
  { id: 'comfort', label: 'Long-session comfort', priority: 'Critical', context: 'Library study; avoid clamping, ear pain and heat', minutes: 120, requiredEnvironment: null, constraint: null },
  { id: 'anc', label: 'Subway noise cancellation', priority: 'Critical', context: 'Subway; reduce low-frequency train rumble', minutes: null, requiredEnvironment: 'subway', constraint: null },
];

export function createDemoSession(reviewText = scenarios.conflict.reviews.join('\n\n')) {
  const session = createSession(reviewText, 'demo');
  session.product = 'Demo-H1 · Over-ear ANC headphones';
  session.productProvided = true;
  session.need = defaultNeed;
  return session;
}
