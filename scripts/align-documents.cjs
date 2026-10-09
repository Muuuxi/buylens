const fs = require('node:fs');
const files = ['PROJECT_BRIEF.md', 'AGENT_FLOW.md', 'TOOL_SPEC.md', 'DATA_MODEL.md', 'TEST_CASES.md', 'MVP_SCOPE.md', 'THREE_DAY_PLAN.md', 'PORTFOLIO_STORY.md'];
const note = '\n> 2026-10-01 implementation update: Core direction approved. IMPLEMENTATION_PLAN.md supersedes the original engineering details below. Initial implementation uses Next.js/TypeScript/Vercel + one Supabase sessions JSONB table; one clarification round, one evidence request, one investigation per conflict/version, five decision iterations; exact/normalized duplicates; reviewId + exact quote verified with includes; four lightweight activity kinds. Six priority tests are release gates; the other original cases are backlog. Browser demo persistence is explicitly localStorage until cloud credentials are configured. The initial UI supports the two confirmed headphone criteria.\n';
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes('2026-10-01 implementation update:')) continue;
  const firstEnd = text.indexOf('\n');
  text = text.slice(0, firstEnd + 1) + note + text.slice(firstEnd + 1);
  if (file === 'TOOL_SPEC.md') text = text.replace('实现规则：精确/规范化相同必合并；长度 ≥20 的文字用字符三元组 Jaccard ≥0.85 标近重复，阈值为待校准假设。近重复组采用代表文本逐个比较，避免相似链无限扩张；出现“舒服/不舒服”等否定差异不得自动合并。短句不套近似阈值。保留全部原文。', '首版实现规则：仅精确与规范化精确重复分组；LLM 可标记模板化文字并降低参考权重。不实现 Jaccard、三元组或模糊相似分组。保留全部原文。');
  if (file === 'DATA_MODEL.md') text = text.replace('- 偏移采用 JavaScript UTF-16，区间 `[startOffset,endOffset)`；`rawText.slice(startOffset,endOffset) === quote` 才能 validated。MVP 引用连续原文，不允许拼接出一句话。', '- 首版仅保存 reviewId + quote，以 rawText.includes(quote) 校验；不实现 UTF-16 偏移。旧模型中的 startOffset/endOffset 字段不使用。');
  if (file === 'TEST_CASES.md') text = text.replace('## 执行方式与记录要求', '## 首版六项优先测试\n模糊需求、充分证据、舒适度冲突、办公室 ANC 缺地铁、重复/低信息、补充改变结果。实际实现见 tests/agent.test.ts。其余原案例保留为后续测试计划，不要求首版全部执行。\n\n## 执行方式与记录要求');
  fs.writeFileSync(file, text, 'utf8');
}
