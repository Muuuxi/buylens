# BuyLens — 最小数据模型

> 2026-10-01 implementation update: Core direction approved. IMPLEMENTATION_PLAN.md supersedes the original engineering details below. Initial implementation uses Next.js/TypeScript/Vercel + one Supabase sessions JSONB table; one clarification round, one evidence request, one investigation per conflict/version, five decision iterations; exact/normalized duplicates; reviewId + exact quote verified with includes; four lightweight activity kinds. Six priority tests are release gates; the other original cases are backlog. Browser demo persistence is explicitly localStorage until cloud credentials are configured. The initial UI supports the two confirmed headphone criteria.

状态：设计规范，尚未实现。类型为文档记法，不是应用代码。所有时间使用 ISO 8601 UTC；面向用户的日期按用户时区显示。ID 由服务端生成，不接受模型自造外键。

## Session：唯一持久化聚合
| 字段 | 类型/约束 |
|---|---|
| id, schemaVersion, createdAt, updatedAt | string；schemaVersion 初始为 1 |
| state, resumeState | AGENT_FLOW 中的状态枚举；resumeState 可空，错误恢复用 |
| revision | integer，任意状态写入递增；并发写使用预期 revision 校验 |
| inputVersion, criteriaVersion | integer；数据和标准变更时分别递增 |
| product | Product |
| rawNeeds | string，最多 2,000 字符 |
| reviewDrafts | prepare_reviews 输入格式的数组，暂未规范化的输入草稿；工具成功后清空，原文转入 reviews |
| criteria, criteriaConfirmedVersion | Criterion[]；后者 nullable integer，必须等于 criteriaVersion 才能分析 |
| reviews, evidence, conflicts, unknowns | 对应数组；均属于这一 session |
| assessments | CriterionAssessment[]，当前版本重算后的覆盖结果 |
| counters | clarificationAnswers 0..2，evidenceRequests 0..1，conflictCalls 0..2，modelCalls 0..10，toolCalls 0..8 |
| decision | ActionDecision 或 null，当前待执行的合法决策 |
| pendingQuestion | {kind: CLARIFY/EVIDENCE, text, criterionIds[], answered: boolean} 或 null |
| brief | FinalBrief 或 null |
| error | {code, message, retryable, failedOperationId} 或 null |
| events | Event[]，最多 60 条；达到上限停止，不丢弃早期记录 |

### Product
`{id, name, model, variant: string|null, facts: ProductFact[], provenance: SYNTHETIC/USER_PROVIDED}`。
ProductFact：`{id, text, sourceLabel: string|null}`。例如厂商“降噪深度”是商品声明，不是实测证据。评论未说明版本则保留 null，不能默认等于产品版本。

### Criterion
`{id, label, priority: CRITICAL/MEDIUM/LOW, desiredOutcome, context, minSessionMinutes: number|null, origin: USER/PROPOSED, confirmed: boolean}`。
- context：`{environment: SUBWAY/LIBRARY/ANY, noiseTarget: string|null, wearerDetails: string|null}`。
- 初始只有舒适度、地铁 ANC 为 CRITICAL；两小时候选标为 PROPOSED，确认后才生效。
- 不要求数字阈值才能表达清楚；“希望减少地铁轰鸣”可确认，“降噪好”则澄清目标环境。最多四项，至少一项 Critical。
- 用户编辑标准后：增加 criteriaVersion，取消确认，删除旧的派生证据/评估/冲突/未知/简报，原文与历史事件保留。

## Review：原文永不被模型改写
`{id, rawText, rating: 1..5|null, sourceLabel: string|null, sourceUrl: string|null, authorKey: string|null, variant: string|null, postedAt: string|null, provenance: SYNTHETIC/USER_PROVIDED, normalizedText, duplicateGroupId, inputVersion}`。

normalizedText 只用于去重，去空白、统一标点；引文永远定位 rawText。sourceLabel 为“用户粘贴”也合法；没有平台链接不伪造链接。authorKey 不推断身份。重复组只是文字支持单位，未知作者并不保证真实独立。

## ExtractedEvidence：一句相关体验对应一条证据
`{id, reviewId, criterionId, polarity: SUPPORT/CHALLENGE/MIXED, claim, quote, startOffset, endOffset, context, quality, relevance, duplicateGroupId, validated: boolean, inputVersion, criteriaVersion}`。

- 首版仅保存 reviewId + quote，以 rawText.includes(quote) 校验；不实现 UTF-16 偏移。旧模型中的 startOffset/endOffset 字段不使用。
- context：`{environment: SUBWAY/OFFICE/LIBRARY/OTHER/UNKNOWN, sessionMinutes: number|null, ownershipDays: number|null, glasses: boolean|null, variant: string|null}`。所有值必须有原文依据或明确输入元数据；“戴了半年”是拥有时长，不能当作连续佩戴半年。
- quality：`{information: LOW/MEDIUM/HIGH, reasons: string[], ratingTextContradiction: boolean, repetitive: boolean}`。这是信息参考价值，不是真伪概率。
- relevance：`{level: DIRECT/PARTIAL/NONE, reason}`。DIRECT 为覆盖已确认标准的情境与时长；办公室 ANC 对地铁是 PARTIAL。
- duplicateGroupId 引用 Review 组。明确同 authorKey 的记录在覆盖计算中合并；匿名记录不虚构身份关联。
- 没有相关体验的评论仍保留 Review，可有零条 Evidence；不强行把“好评”转成支持。

## CriterionAssessment：确定性重算结果
`{criterionId, supportUnitIds[], challengeUnitIds[], coverage: INSUFFICIENT/ADEQUATE/MIXED, confidence: LOW/MEDIUM/HIGH, reasons[], openConflictIds[], unknownIds[], inputVersion, criteriaVersion}`。

支持单位：同一重复组、同一已知作者合并后的单位。覆盖门槛与 confidence 规则在 AGENT_FLOW 定义；这些标签描述所提供材料的适配覆盖，不代表总体人群统计置信度。

## Conflict
`{id, criterionId, supportEvidenceIds[], challengeEvidenceIds[], status: OPEN/CONTEXT_EXPLAINED/UNRESOLVED, hypotheses: string[], findings: ConflictFinding[], investigatedAtVersion: string|null}`。
ConflictFinding：`{dimension: DURATION/ENVIRONMENT/WEARER/VARIANT/INFORMATION, explanation, evidenceIds[], kind: OBSERVED/INFERRED}`。有情境关联可标 CONTEXT_EXPLAINED，但仍保留所有反证，不宣称证明因果。无原文依据的可能原因仅为 hypothesis，不能消解冲突。

## Unknown
`{id, criterionId: string|null, question, reason: NO_EVIDENCE/LOW_INFORMATION/CONTEXT_MISMATCH/UNRESOLVED_CONFLICT/MISSING_USER_DETAIL/BUDGET_LIMIT, status: OPEN/ANSWERED, evidenceIds[], suggestedNextStep}`。
建议如“确认退换政策并试戴”，属于建议而非已查证商家事实。追加材料后可以 ANSWERED；旧的未知保留在事件历史中，当前数组只保留当前评估。

## ActionDecision：真实下一步提议
`{action: INVESTIGATE_CONFLICT/REQUEST_EVIDENCE/FINALIZE/STOP_INSUFFICIENT, targetIds: string[], reason: string, source: LLM/CONTROLLER, inputVersion, criteriaVersion}`。
reason 是可展示的简短事实理由，不保存隐藏思维链。模型不能直接写已确认标志、计数器或终态；控制器检查 targetIds 与合法动作。

## FinalBrief
`{id, status: COMPLETE_WITH_CAVEATS/INCOMPLETE, fits: BriefItem[], risks: BriefItem[], supportingEvidenceIds[], challengingEvidenceIds[], evidenceSummary: CriterionAssessment[], conflictIds[], unknownIds[], beforeBuying: BriefItem[], limitations: string[], generatedAt, inputVersion, criteriaVersion}`。
BriefItem：`{criterionId: string|null, text, kind: OBSERVATION/INFERENCE/RECOMMENDATION/UNKNOWN, evidenceIds: string[]}`。
OBSERVATION/INFERENCE 的产品判断必须有经过验证的引用；INFERENCE 明示推断。建议或用户标准不要求伪造评论引用。没有适配证据时 fits 可空，界面显示“暂无足够依据”。

## Event、持久化与不变量
Event：`{id, operationId, timestamp, fromState, toState, actor: USER/LLM/CONTROLLER/TOOL, action, reason, toolName: string|null, inputSummary, outputRefs: string[], outcome: OK/ERROR}`。

计划实现：一个 session 一个 JSON 文件，服务端在工具完成/用户操作/状态转换后，用临时文件加原子替换保存聚合快照；事件随快照一起存，避免独立日志与快照不一致。目录需要实际可写、部署重启可保留。单实例同 session 写入串行化，revision 检查拒绝旧写入。

- operationId + 工具名 + 输入/标准版本用于幂等；失败重试不能生成两套 Evidence。
- 模型请求发出前先存操作开始事件及计数；工具结果后存结果与下一状态。进程中断后，不确定结果不自动标成功，回到可重试错误状态。
- 终态不自动继续。追加材料显式启动更新：inputVersion 递增，brief 失效，全量重提取（最多 40 条，暂不做增量优化），复用已确认标准；调查预算、模型/工具预算按新版本重置，补充机会仍仅一次。
- 更换商品创建新 session，不混用旧证据。
- 浏览器仅保存随机 session ID；服务端密钥不进状态文件；事件不记录 API key 或完整系统提示词。
- 持久状态不等于跨设备账号。未批准安装/部署之前不创建运行时文件。
