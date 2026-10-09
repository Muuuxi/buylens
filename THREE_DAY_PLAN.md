# BuyLens — 三天交付计划

> 2026-10-01 implementation update: Core direction approved. IMPLEMENTATION_PLAN.md supersedes the original engineering details below. Initial implementation uses Next.js/TypeScript/Vercel + one Supabase sessions JSONB table; one clarification round, one evidence request, one investigation per conflict/version, five decision iterations; exact/normalized duplicates; reviewId + exact quote verified with includes; four lightweight activity kinds. Six priority tests are release gates; the other original cases are backlog. Browser demo persistence is explicitly localStorage until cloud credentials are configured. The initial UI supports the two confirmed headphone criteria.

状态：待产品定义批准后执行。今晚只写文档，不启动 Day 1。按每天八小时有效工作、已有基本前端经验估算；Day 1/2/3 为相对开发日，不强制绑定日期。

## 实现建议与前提
**未验证的保守技术选择：**熟悉的 React 前端 + 单个 Node 服务端 + 一个支持结构化输出/工具调用的 LLM API；单实例 JSON 会话存储，原子写入，不加数据库/RAG/账号。若用户已有熟悉的等价栈，沿用即可。

服务端保管密钥；开发前确认模型、计费预算、工具调用能力与部署文件持久性。优先单实例持久磁盘/可保留目录；不要直接部署到会丢文件的运行时再声称可恢复。部署平台具体选择在批准实现后核实，不在本阶段安装或创建资源。

## Day 1：可运行产品闭环（8 小时）
| 时段 | 具体交付 | 完成标准 |
|---|---|---|
| 0–1h | 核实 API、可用技术栈和持久目录；建立最小服务端/前端 | 真正请求模型成功；密钥不进浏览器；存储写读与重启可保留 |
| 1–2h | 准备 Demo-H1 三组数据，标 SYNTHETIC；固定字段与输入预览 | 模糊、冲突、缺口、足够证据各有样例；不伪装真实购买评价 |
| 2–4h | 需求解析、单个澄清问题、标准 Confirm/Edit、输入边界 | 未确认时不分析；候选两小时可修改；最多四项 |
| 4–6h | prepare_reviews、extract_evidence、引用验证及质量 rubric | 真实函数执行，重复组不堆票，引用能定位原文 |
| 6–8h | 最小简报、确认→证据→结果闭环；快照写读 | F 输入可得到有引用的结果；刷新恢复标准和结果；记录 T02/T10 |

Day 1 闭环可以暂仅覆盖充分输入，但不能宣传完整 Agent。其他合法状态要在 Day 2 实现，未实现处显示未支持，不用动画伪装。

**检查点：**前两小时仍无 API 时，先修复配置或明确回放限制；不可把静态报告算 live 验收。如果存储环境不支持持久化，使用已验证的本地单实例作为保底运行环境，同时继续寻找部署方式，不谎称公开服务可恢复。

## Day 2：真实分支、状态和失败处理（8 小时）
| 时段 | 具体交付 | 完成标准 |
|---|---|---|
| 0–2h | DECIDE_NEXT 结构化动作、allowedActions、预算与事件记录 | 同商品不同材料实际选择不同工具序列；日志区分 LLM 和控制器 |
| 2–4h | investigate_conflict、情境差异、未解冲突状态 | T06 可解释且保留风险；T11 无依据时不编造原因 |
| 4–5.5h | 请求补充/跳过、inputVersion、终态与旧结果失效 | T07→T12 恢复；T09 跳过停止；仅一次补充机会 |
| 5.5–7h | timeout/坏引用/幂等重试/保存失败与预算降级 | T14/T15/T17 通过；停止状态真实可见，不展示未校验简报 |
| 7–8h | 核对四个工具契约与关键回归 | 所有 Must Have 后端行为可运行；列出剩余失败，不能移到“美化以后” |

**检查点：**Day 2 结束必须保住真实模型决策、四工具、确认门、三路径、持久化与引用。不能通过删分支来凑 Agent；有失败先修，削减动画、导出和复杂页面布局。

## Day 3：验证、部署、作品集（8 小时）
| 时段 | 具体交付 | 完成标准 |
|---|---|---|
| 0–1.5h | 一屏主流程视觉整理、证据展开、冲突/未知状态 | 标准、当前动作和最终简报易读；没有购买总分；操作实际可用 |
| 1.5–3.5h | 执行 TEST_CASES、真实模型关键路径重复、浏览器交互 | 保存真实执行记录，解决阻断错误；原文引用和刷新恢复通过 |
| 3.5–5h | 单实例部署、密钥配置、可用性与重启持久验证 | 从新浏览器完成充分与不足流程；不只检查首页加载 |
| 5–6h | 作品集叙述/架构图/已测指标与限制 | 不把设计目标写成已完成成绩；公开数据标合成 |
| 6–7h | 录制三分钟演示，覆盖确认、冲突、缺口和引用 | 显示真实工具记录；慢请求可剪辑并披露，不装实时 |
| 7–8h | 缓冲修复、最终回归、交付说明 | 链接、运行方法、录像、测试记录齐全；注明未通过项 |

## 降范围顺序与止损
1. 不做 NICE TO HAVE：下载、动画和额外窄屏优化。
2. 只保留最小三个视图区域：输入/标准、实际进度、简报/原文，不加仪表盘或聊天历史产品。
3. 所有性能优化先让位于固定最多 40 条的全量重算；不引入向量检索。
4. 部署若阻塞，交付已验证本地运行 + 录像，并**明确公开 live 链接未完成**；这属于未满足部署目标，不能算完整三天交付。
5. API 若始终不可用，交付清楚标注回放的架构原型，真实 Agent 目标判未达成。禁止伪装成功。

## 发布前最终门槛
八份定义已批准；T01–T20 有实际记录；确认门、引用、持久状态、冲突调查、不足停止及补充恢复均通过；真实模型关键路径通过；环境和重启存储验证通过；录像与作品集注明合成数据和已知限制。部署/发布操作按用户后续授权执行，不视为今晚已授权上线。
