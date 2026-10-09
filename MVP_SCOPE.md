# BuyLens — 三天 MVP 边界

> 2026-10-01 implementation update: Core direction approved. IMPLEMENTATION_PLAN.md supersedes the original engineering details below. Initial implementation uses Next.js/TypeScript/Vercel + one Supabase sessions JSONB table; one clarification round, one evidence request, one investigation per conflict/version, five decision iterations; exact/normalized duplicates; reviewId + exact quote verified with includes; four lightweight activity kinds. Six priority tests are release gates; the other original cases are backlog. Browser demo persistence is explicitly localStorage until cloud credentials are configured. The initial UI supports the two confirmed headphone criteria.

状态：待审核。任何实现、安装、部署均需后续用户批准。预算按约 24 小时有效开发时间估算。

## MUST HAVE
- 中文桌面 Web 演示；单商品、头戴式降噪耳机这一场景。自然语言需求最多 2,000 字符，评论总量最多 40 条/20,000 字符，单条最多 2,000 字符；超限明确退回，不静默截断。
- 商品型号与变体确认；商品声明与评论证据分开呈现。
- 两个默认关键标准：长时舒适度、地铁 ANC。最多四个标准，用户主动提出才扩展；解析后必须 Confirm/Edit。
- 粘贴评论或加载合成演示数据；原文、稳定 ID、可选星级/变体/使用时间/来源；无元数据不补造。
- 四个工具的实际输入、执行、输出，以及每步简短动作理由。
- 一个模型驱动、受确定性规则约束的决策循环：冲突调查、补充证据请求、足够证据合成、不足停止。
- 证据质量与相关性分别呈现；重复分组、低信息标记、星级/文字矛盾保留；不得宣判假评论。
- 会话持久状态；刷新恢复；用户补充评论后更新证据，失败后可重试且不重复追加。
- 最多两次澄清回答、一次补充证据机会、两次冲突调查；有限模型/工具预算，避免无限运行。
- 简报七项：适配之处、个人风险、支持证据、反证/冲突、证据覆盖与质量、未知项、购买前确认事项。
- 引用原文校验与点击定位；明确区分“观察”“推断”“建议”。
- 提供能触发不同路径的演示数据，以及 TEST_CASES 的测试记录。
- 一份架构说明、三分钟演示录像和公开作品集页面/说明；部署必须完成真实分支检查才算可运行。

## NICE TO HAVE
只在必需路径全部通过后考虑，合计不超过一小时：简报 Markdown 下载、窄屏基本适配、轻量交互动画。没有这些也通过验收。

## OUT OF SCOPE
今晚写应用代码/安装依赖；截图上传与 OCR；淘宝/JD/其他平台爬取；浏览器扩展；登录/账号/支付/下单；价格跟踪；商家分析；跨商品推荐/比较；通用品类；手机 App；向量数据库/复杂 RAG；多 Agent；自动外部搜索；假评论真伪分类；数值购买分数；真实世界 ANC 测量；推断用户头型或评论作者身份；生产级多租户、后台队列与跨设备同步。

不增加电池、音质默认优先级；不把一小时通勤推断成一小时连续佩戴。证据不足时不会不断向用户追问。

## 最危险的退化方式与防线
| 退化方式 | 必须保留的防线 |
|---|---|
| 单个提示词吐出整份报告 | 提取、调查、决策、合成分别执行，工具结果写入状态 |
| 所有输入走固定五步动画 | 不同输入导致实际不同调用与终止状态，测试断言 |
| 冲突只被写进摘要 | 调查情境与版本，更新冲突状态，再决定下一步 |
| 一直有“高置信度” | 无相关证据则未知；冲突未解则混合；不用概率包装 |
| 把确认按钮作为装饰 | 未确认无法分析；编辑标准使旧结果过期 |
| 只有日志没有持续状态 | 刷新恢复任务，补充证据复用状态，失败可恢复 |

## 最终设计自检
以下是**设计层面 YES**，不是已实现/测试通过；每项附验收证据。实现若缺少任一关键项，应报告未通过而非包装完成。

| 问题 | 设计答案与实际验收要求 |
|---|---|
| 1. 真实自主下一步？ | YES：模型按当前状态选择冲突/缺口与合法动作；检查真实决策记录 |
| 2. 不同证据改变工作流？ | YES：足够、冲突、不足三条路径有不同工具序列 |
| 3. 真实工具调用？ | YES：四个服务端工具真实执行，记录输入摘要与输出引用 |
| 4. 保存任务状态？ | YES：会话快照和事件落盘；刷新恢复测试 |
| 5. 能因证据不足停止？ | YES：STOPPED_INSUFFICIENT，简报不得伪装为充分结论 |
| 6. 有意义的人工确认？ | YES：标准确认阻断分析，补充或跳过改变后续动作 |
| 7. 判断可追溯？ | YES：每条产品判断通过引用验证并能跳回原文 |
| 8. 三天可实现？ | YES，条件：已有 API/熟悉栈/约 24 小时/单实例存储；Day 1 前两小时核验 |
| 9. 超越评论摘要？ | YES：按个人标准标出反证、缺口与停止原因；用样例对照验证 |
| 10. 超越普通聊天 UI？ | YES：确认门、持久证据状态、受约束工具循环、恢复和不同终点 |

第八项条件未满足时，先删 NICE TO HAVE 和视觉复杂度；不删真实分支、引用、确认、持久状态来冒充 Agent。若仍不可交付，明确披露范围/进度，保留可核验演示，不宣称已完成。
