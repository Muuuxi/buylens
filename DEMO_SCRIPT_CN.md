# BuyLens 中文演示脚本（约 85 秒）

录制前：打开 https://buylens-agent.vercel.app 的公开确定性演示或本地 demo，使用默认 Comfort conflict 场景；保持桌面窗口清晰，准备好三个主页面。不要录制设置、开发者控件或凭证。演示评论是合成数据，实时模型验证单独说明。

## 0–10 秒｜用户需求

画面：Criteria，需求与耳机卡片。

旁白：“这名学生每天坐地铁，也会在图书馆长时间戴耳机。好评很多，但他想知道：会不会压头，以及地铁降噪到底有没有依据？”

## 10–22 秒｜解释与确认标准

操作：点击 Interpret my needs，短暂停留解释出的舒适度、地铁 ANC 标准；点击 Confirm & analyze reviews。

旁白：“BuyLens 先把顾虑变成可检查的购买标准，由用户确认，再开始分析。”

## 22–38 秒｜证据与冲突调查

画面：Evidence Workspace，相关证据、舒适度冲突；展开 Agent Run，指向 INVESTIGATE_CONFLICT 对应记录。

旁白：“办公室降噪不能替代地铁证据。舒适度反馈冲突时，Agent 选择调查；执行记录保留 action、结果与耗时。”

## 38–52 秒｜精确来源

操作：点击冲突证据 R5，展示原评论和 Exact quote，再关闭来源框。

旁白：“每条引用都能回到原文。这里能看到眼镜、佩戴时间与具体不适；这些差异帮助理解冲突，但不会把关联说成因果，也不会抹掉负面经历。”

## 52–63 秒｜重新评估

画面：Agent Run 的调查结果、Re-evaluate state 和 Controller validation。

旁白：“调查后重新评估。模型提出下一步，控制器检查关键证据覆盖和停止条件；依据不足就请求补充，跳过则停止，不强行推荐。”

## 63–78 秒｜决策简报

操作：Read decision brief；停留适配、风险、未知项与 Before you buy；短暂展开 View Markdown Brief。

旁白：“简报把适配、风险和未知项分开，并保留出处。用户可以带走同一份 Markdown，最终是否购买仍由用户决定。”

## 78–85 秒｜Evaluation

操作：打开 Portfolio evaluation，短暂展示场景与保护规则。

旁白：“本次是合成评论的确定性演示。实时版本另行通过三个场景，验证真实模型调用、来源引用和 Supabase 恢复。场景通过不等于通用准确率或真实购买成效。”
