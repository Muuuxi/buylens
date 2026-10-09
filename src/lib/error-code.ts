export type UiErrorCode = 'INVALID_CRITERIA' | 'INVALID_REQUEST' | 'INVALID_INPUT' | 'SESSION_MISSING' | 'LIVE_LIMIT' | 'LIVE_UNAVAILABLE' | 'PERSISTENCE' | 'ANALYSIS_FAILED';

export class UserFacingError extends Error {
  constructor(public readonly code: UiErrorCode, message: string) { super(message); }
}

export function codeForError(error: unknown): UiErrorCode {
  if (error instanceof UserFacingError) return error.code;
  const message = error instanceof Error ? error.message : String(error);
  if (Object.prototype.hasOwnProperty.call(messages, message)) return message as UiErrorCode;
  if (message.includes('live AI limit')) return 'LIVE_LIMIT';
  if (message.includes('No saved guest session')) return 'SESSION_MISSING';
  if (message.includes('Supabase') || message.includes('could not be saved')) return 'PERSISTENCE';
  if (message.includes('purchase need') || message.includes('up to 40 reviews')) return 'INVALID_INPUT';
  if (message.includes('Review the criteria') || message.includes('criterion ID')) return 'INVALID_CRITERIA';
  return 'ANALYSIS_FAILED';
}

const messages: Record<UiErrorCode, { en: string; zh: string }> = {
  INVALID_CRITERIA: { en: 'Review your criteria. A hard constraint needs an explicit value, and at least one priority must be critical or a hard constraint.', zh: '请检查购买标准：硬性条件需要明确数值，且至少有一项必须是关键标准或硬性条件。' },
  INVALID_REQUEST: { en: 'This action or its input is invalid. Check the fields and try again.', zh: '这一步的输入无效，请检查填写内容后重试。' },
  INVALID_INPUT: { en: 'Check your purchase need, product and review input, then try again.', zh: '请检查购买需求、商品和评论输入后重试。' },
  SESSION_MISSING: { en: 'The saved task could not be found. Start a new purchase.', zh: '找不到已保存的任务，请开始新的购买分析。' },
  LIVE_LIMIT: { en: 'This session has reached its live AI limit. Start a new purchase later or load the prepared demo.', zh: '本次会话已达到实时 AI 调用上限。请稍后开始新任务，或加载预设演示。' },
  LIVE_UNAVAILABLE: { en: 'Live analysis is unavailable right now. Try again later or load the prepared demo.', zh: '实时分析暂时不可用，请稍后重试或加载预设演示。' },
  PERSISTENCE: { en: 'Could not save or restore this task. Reload and try again.', zh: '任务保存或恢复失败，请刷新后重试。' },
  ANALYSIS_FAILED: { en: 'This analysis step failed. Your saved progress is preserved; retry this step.', zh: '这一步分析失败，已保存的进度仍在；请重试。' },
};

export function errorMessage(code: string, language: 'en' | 'zh'): string {
  return messages[code as UiErrorCode]?.[language] ?? messages.ANALYSIS_FAILED[language];
}
