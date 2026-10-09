import dictionary from './translations.json';

export type Language = 'en' | 'zh';
const translations: Record<string, string> = dictionary;
const folded = new Map(Object.entries(translations).map(([key, value]) => [key.toLowerCase(), value]));

// Presentation only: never write translated text into the analysis snapshot.
export function translateUI(value: string): string {
  const key = value.trim().replace(/\s+/g, ' ');
  const direct = translations[key] ?? folded.get(key.toLowerCase());
  let result = direct;
  if (!result) {
    let match: RegExpMatchArray | null;
    if ((match = key.match(/^Agent chose: (.+)$/))) result = `Agent 选择：${translateUI(match[1])}`;
    else if ((match = key.match(/^Reason: (.+)$/))) result = `原因：${translateUI(match[1])}`;
    else if ((match = key.match(/^(INVESTIGATE_CONFLICT|REQUEST_EVIDENCE|FINALIZE|STOP_INSUFFICIENT): (.+)$/))) result = `${match[1]}：${translateUI(match[2])}`;
    else if ((match = key.match(/^### Source (R\d+)$/))) result = `### 来源 ${match[1]}`;
    else if ((match = key.match(/^(\d+) (Your criteria|Evidence workspace|Decision brief)$/))) result = `${match[1]} ${translateUI(match[2])}`;
    else if ((match = key.match(/^(.+) (context|priority)$/))) result = `${translateUI(match[1])}${match[2] === 'context' ? '使用情境' : '优先级'}`;
    else if ((match = key.match(/^(.+) \(deterministic\)$/))) result = `${translateUI(match[1])}（确定性）`;
    else if ((match = key.match(/^(\d+) min( sessions)?$/))) result = `${match[1]} 分钟${match[2] ? '单次使用' : ''}`;
    else if ((match = key.match(/^\(?(\d+) min\)?$/))) result = key.startsWith('(') ? `（${match[1]} 分钟）` : `${match[1]} 分钟`;
    else if ((match = key.match(/^FINALIZE; (\d+) exact source citations verified; no unresolved critical fit references$/))) result = `FINALIZE；${match[1]} 条原文引用已核验，没有未解决的关键适配引用`;
    else if ((match = key.match(/^(\d+) (critical criteria identified|reviews normalized|candidate evidence items|exact source citations accepted|evidence items extracted and verified|buying criteria confirmed)$/))) {
      const suffix: Record<string, string> = { 'critical criteria identified': '项关键标准已识别', 'reviews normalized': '条评论已规范化', 'candidate evidence items': '项候选证据', 'exact source citations accepted': '条精确原文引用已通过', 'evidence items extracted and verified': '项证据已提取并验证', 'buying criteria confirmed': '项购买标准已确认' };
      result = `${match[1]} ${suffix[match[2]]}`;
    } else if (key.includes(' · ')) result = key.split(' · ').map(translateUI).join(' · ');
    else if ((match = key.match(/^(.+): (.+)$/)) && translations[match[1]]) result = `${translateUI(match[1])}：${translateUI(match[2])}`;
  }
  if (!result || result === key) return value;
  return value.replace(value.trim(), result);
}

export function localizedMarkdown(value: string, language: Language) {
  if (language === 'en') return value;
  // Localize headings, while preserving all original evidence and source text.
  return value.split('\n').map(line => line.startsWith('#') ? translateUI(line) : line).join('\n');
}
