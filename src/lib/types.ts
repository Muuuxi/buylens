export type Mode = 'demo' | 'live';
export type Phase = 'criteria' | 'clarify' | 'ready' | 'preparing' | 'extracting' | 'deciding' | 'investigating' | 'waiting' | 'composing' | 'complete' | 'stopped';
export type Action = 'INVESTIGATE_CONFLICT' | 'REQUEST_EVIDENCE' | 'FINALIZE' | 'STOP_INSUFFICIENT';
export type Constraint = { operator: 'lte' | 'gte' | 'eq'; value: number; unit: string };
export type Criterion = { id: string; label: string; priority: 'Critical' | 'Medium' | 'Low' | 'Hard constraint'; context: string; minutes: number | null; requiredEnvironment?: string | null; constraint?: Constraint | null };
export type Review = { id: string; rawText: string; group: string; rating: number | null };
export type Evidence = { id: string; reviewId: string; criterionId: string; quote: string; polarity: 'support' | 'challenge'; quality: 'low' | 'medium' | 'high'; relevance: 'direct' | 'partial'; environment: string; minutes: number | null; glasses: boolean | null; reason: string; repetitive: boolean; ratingContradiction: boolean; measurement?: { value: number; unit: string } | null };
export type Conflict = { id: string; criterionId: string; evidenceIds: string[]; status: 'open' | 'explained' | 'unresolved'; finding: string; findingEvidenceIds: string[]; investigatedVersion: number | null };
export type Assessment = { criterionId: string; coverage: 'adequate' | 'mixed' | 'insufficient'; units: number; confidence: 'low' | 'medium' | 'high'; reason: string };
export type BriefItem = { text: string; evidenceIds: string[] };
export type Brief = { fits: BriefItem[]; risks: BriefItem[]; beforeBuying: string[]; incomplete: boolean };
export type Activity = { id: string; kind: 'decision' | 'tool_called' | 'tool_result' | 'user_action'; label: string; detail: string };
export type Decision = { action: Action; targetId: string | null; reason: string };
export type RunStep = { id: string; name: string; type: 'MODEL' | 'TOOL' | 'CONTROLLER' | 'HUMAN'; status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REJECTED'; result: string; startedAt: number; endedAt?: number; durationMs?: number; version: number };
export type Session = {
  snapshotVersion?: 2;
  productProvided?: boolean;
  id: string; mode: Mode; phase: Phase; product: string; need: string; reviewText: string;
  criteria: Criterion[]; confirmed: boolean; question: string | null; reviews: Review[];
  evidence: Evidence[]; conflicts: Conflict[]; assessments: Assessment[]; log: Activity[];
  version: number; clarifications: number; requests: number; iterations: number;
  modelRequests?: number;
  decision: Decision | null; brief: Brief | null; error: string | null; pendingTool: string | null;
  modelCall?: { id: string; type: 'function'; function: { name: string; arguments: string } };
  run?: RunStep[];
};
export interface Reasoner {
  interpret(need: string, alreadyClarified: boolean, product?: string): Promise<{ criteria: Criterion[]; question: string | null; product?: string }>;
  extract(session: Session): Promise<Omit<Evidence, 'id'>[]>;
  investigate(session: Session, conflict: Conflict): Promise<{ explained: boolean; finding: string; evidenceIds: string[] }>;
  decide(session: Session, allowed: Action[]): Promise<Decision>;
  compose(session: Session, incomplete: boolean): Promise<Brief>;
}
