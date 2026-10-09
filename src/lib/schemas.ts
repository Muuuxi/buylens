import { z } from 'zod';
export const criterionSchema = z.object({
  id: z.string().min(1).max(60).regex(/^[a-z][a-z0-9_]*$/), label: z.string().min(1).max(100), priority: z.enum(['Critical', 'Medium', 'Low', 'Hard constraint']),
  context: z.string().min(1).max(500), minutes: z.number().int().min(1).max(10080).nullable(),
  requiredEnvironment: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/).nullable().default(null),
  constraint: z.object({ operator: z.enum(['lte', 'gte', 'eq']), value: z.number().nonnegative(), unit: z.string().min(1).max(40) }).strict().nullable().default(null),
}).strict();
export const interpretationSchema = z.object({ product: z.string().min(1).max(200), criteria: z.array(criterionSchema).max(8), question: z.string().max(500).nullable() }).strict();
export const evidenceSchema = z.object({
  reviewId: z.string(), criterionId: z.string().min(1).max(60), quote: z.string().min(1).max(2000),
  polarity: z.enum(['support', 'challenge']), quality: z.enum(['low', 'medium', 'high']), relevance: z.enum(['direct', 'partial']),
  environment: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/), minutes: z.number().int().nonnegative().nullable(),
  glasses: z.boolean().nullable(), reason: z.string().max(500), repetitive: z.boolean(), ratingContradiction: z.boolean(),
  measurement: z.object({ value: z.number().nonnegative(), unit: z.string().min(1).max(40) }).strict().nullable().default(null),
}).strict();
export const extractionSchema = z.object({ items: z.array(evidenceSchema).max(160) }).strict();
export const investigationSchema = z.object({ explained: z.boolean(), finding: z.string().min(1).max(1500), evidenceIds: z.array(z.string()).min(1).max(160) }).strict();
export const decisionArgumentsSchema = z.object({ targetId: z.string().nullable(), reason: z.string().min(1).max(1000) }).strict();
const briefItem = z.object({ text: z.string().min(1).max(1500), evidenceIds: z.array(z.string()).min(1).max(160) }).strict();
export const briefSchema = z.object({ fits: z.array(briefItem).max(10), risks: z.array(briefItem).max(10), beforeBuying: z.array(z.string().min(1).max(1000)).min(1).max(6), incomplete: z.boolean() }).strict();
const create = z.object({ action: z.literal('create'), mode: z.enum(['demo', 'live']), product: z.string().max(200), need: z.string().min(1).max(2000), reviewText: z.string().max(20000) }).strict();
export const commandSchema = z.discriminatedUnion('action', [
  create,
  z.object({ action: z.literal('interpret') }).strict(),
  z.object({ action: z.literal('clarify'), answer: z.string().min(1).max(1000) }).strict(),
  z.object({ action: z.literal('confirm'), criteria: z.array(criterionSchema).min(1).max(8) }).strict(),
  z.object({ action: z.literal('step') }).strict(),
  z.object({ action: z.literal('add'), text: z.string().min(1).max(20000) }).strict(),
  z.object({ action: z.literal('skip') }).strict(),
  z.object({ action: z.literal('edit') }).strict(),
]);
