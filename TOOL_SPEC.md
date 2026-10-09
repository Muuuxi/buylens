# BuyLens — 四个工具

> 2026-10-01 implementation update: Core direction approved. IMPLEMENTATION_PLAN.md supersedes the original engineering details below. Initial implementation uses Next.js/TypeScript/Vercel + one Supabase sessions JSONB table; one clarification round, one evidence request, one investigation per conflict/version, five decision iterations; exact/normalized duplicates; reviewId + exact quote verified with includes; four lightweight activity kinds. Six priority tests are release gates; the other original cases are backlog. Browser demo persistence is explicitly localStorage until cloud credentials are configured. The initial UI supports the two confirmed headphone criteria.

状态：接口设计，尚未实现。模型应通过真实函数调用请求工具，控制器只执行当前合法工具。界面动画或模型文本里的“我调用了工具”不算执行。

## 共同约定
输入为对象，拒绝额外字段。所有调用由控制器注入 `sessionId, operationId, expectedRevision, inputVersion, criteriaVersion`，模型不能伪造它们。下表只列业务字段；类型见 DATA_MODEL。

输出统一为：`{ok: true, data: <工具结果>, warnings: string[]}` 或 `{ok: false, error: {code, message, retryable}}`。模型结构化结果经校验后才写入状态；失败保持上次有效快照，记录事件，进入 ERROR_RECOVERABLE 或 ERROR_TERMINAL。每次执行都记录实际工具名、耗时、结果引用和简短理由。

所有模型执行（包括工具内模型请求）计入总预算；模型不访问文件路径、网络和任意 shell。评论是数据，嵌入其中的命令不得执行。

## 1. prepare_reviews
**目的：**规范化已提交评论，产生稳定原文 ID 与重复组。确定性工具，不评价真伪。

输入 schema：
- `product: {name: string, model: string, variant: string|null, facts: ProductFact[], provenance: SYNTHETIC/USER_PROVIDED}`。
- `reviews: Array<{text: string, rating: integer|null, sourceLabel: string|null, sourceUrl: string|null, authorKey: string|null, variant: string|null, provenance: SYNTHETIC/USER_PROVIDED}>`。
- reviews 1..40，text 非空且最多 2,000 字符，总 text 最多 20,000 字符，rating 有值则 1..5。
- 粘贴格式：空行分隔评论，行首可用 `[rating=5]`；预览分条并允许修改后提交。不识别的 metadata 保留在文字中，不猜星级。不能提交零条评论；一条也允许进入分析，随后可能不足。

输出 schema：`{product: Product, reviews: Review[], groups: Array<{id: string, reviewIds: string[], reason: EXACT/NORMALIZED/NEAR_MATCH}>}`。
首版实现规则：仅精确与规范化精确重复分组；LLM 可标记模板化文字并降低参考权重。不实现 Jaccard、三元组或模糊相似分组。保留全部原文。

失败：`EMPTY_REVIEWS / LIMIT_EXCEEDED / INVALID_METADATA / PRODUCT_MISSING` → 返回输入页；`STORE_FAILED` → 可重试。不得截断、删负评或猜来源。

## 2. extract_evidence
**目的：**从所有原文中找出针对已确认标准的体验与情境，逐条评估信息价值及相关性。LLM 语义提取 + 确定性校验/覆盖计算。

输入 schema：`{criterionIds: string[], reviewIds: string[]}`，由服务端加载当前版本对象。要求 criteriaConfirmedVersion 等于 criteriaVersion，ID 属于此 session，范围覆盖当前所有评论。最多四个标准，40 条评论。

模型结果 schema：`{items: Array<{reviewId, criterionId, polarity, claim, quote, context, information: LOW/MEDIUM/HIGH, qualityReasons: string[], ratingTextContradiction: boolean, relevance: DIRECT/PARTIAL/NONE, relevanceReason: string}>}`。枚举/context 同 DATA_MODEL，未知字段为 null/UNKNOWN；不能凭星级推断 polarity。

最终输出 schema：`{evidence: ExtractedEvidence[], assessments: CriterionAssessment[], conflicts: Conflict[], unknowns: Unknown[], excluded: Array<{reviewId, reason}>}`。
服务端分配 ID，精确定位 quote，校验元数据，继承重复组，重算覆盖。低信息/无关评论保留但不算直接覆盖；高质量措辞不代表事实真实。

失败：未确认 → `CRITERIA_NOT_CONFIRMED`，不给模型发送评论；无效引用/JSON → 一次受限修复请求（占预算），仍失败则 `INVALID_MODEL_OUTPUT`，不部分提交；timeout/429 → `MODEL_UNAVAILABLE`，允许一次手动重试；无证据是成功结果，返回 unknowns，不是工具异常。

## 3. investigate_conflict
**目的：**按 Agent 选择的一个冲突，检查时长、环境、用户特点、产品版本与信息价值差异，更新冲突及关联未知项。只能使用已有材料，不联网。

输入 schema：`{conflictId: string, focus: DURATION/ENVIRONMENT/WEARER/VARIANT/INFORMATION}`。
ID 必须是 OPEN 且当前版本未调查的冲突；同冲突每个输入/标准版本最多一次，总计最多两次。

输出 schema：`{conflict: Conflict, assessments: CriterionAssessment[], unknowns: Unknown[]}`。
模型产生 findings/hypotheses，服务端验证 evidenceIds 并重算标签。无依据只返回 UNRESOLVED 和缺口。`CONTEXT_EXPLAINED` 表示原文情境存在差异，不能消除反证或证明因果，也不能把不同版本的一条反馈当成目标版本的直接支持。

失败：`INVALID_TARGET / ALREADY_INVESTIGATED / BUDGET_EXCEEDED` → 控制器拒绝并重新决定；输出/模型错误与工具 2 相同。不可反复调查同一材料产生新“证据”。

## 4. compose_brief
**目的：**将当前已验证状态组织成个性化简报，保留反证与未知；不进行新一轮证据发现。

输入 schema：`{mode: COMPLETE_WITH_CAVEATS/INCOMPLETE, stopReason: string|null}`。完整模式仅在所有 Critical 标准通过充分性规则时可调用；不足或预算耗尽时必须 INCOMPLETE。

输出 schema：`{brief: FinalBrief}`，必须含 fits、risks、supportingEvidenceIds、challengingEvidenceIds、evidenceSummary、conflictIds、unknownIds、beforeBuying、limitations。依据版本与时间由服务端填写。
控制器验证产品判断引用、Critical 缺口是否显式披露、支持/反证是否遗漏、mode 是否与当前 assessments 一致。不存在通用购买评分或“必买”字段。

失败：引用/格式/遗漏 → 一次修复，失败后可重试错误状态，禁止展示未验证简报。预算不足或模型不可用时，确定性模板只显示已验证证据、未知及停止原因，标“降级证据清单，未生成完整简报”；终态 STOPPED_INSUFFICIENT。

## 为什么只有四个
澄清和标准解析是结构化模型响应，确认是用户动作，保存/引用检查是控制器职责，不为了数量伪装成工具。四个工具各自有可复用输入输出和真实副作用/结果：整理原文、建立证据、调查冲突、生成受校验简报。Agent 在执行结果之间重新选择下一步。
