# BuyLens 本地核心修复版（2026-10-08）

先读 CORE_FLOW_AUDIT.md。此次修复针对“需求没有走真实模型”和“新商品残留耳机内容”，不是作品集改版。没有部署；旧公开网址不能代表本包中的修复。

## 已验证

- 行李箱、办公椅、空气炸锅：真实模型生成标准并确认，缺失评论时请求证据；三个类别连续切换无旧类别/耳机泄漏。
- 模糊需求：最多一次真实澄清，不假设预算或重要参数。
- 行李箱新评论：真实结构化提取与精确引用验证；空气炸锅跳过证据后停止且不编造适配结论。
- 原有耳机实时测试 3/3；显式 demo/双语界面测试 9/9；单元测试 22/22；typecheck/build 通过。

## 运行

建议 Node.js 24。进入 buylens-agent 目录：

```powershell
npm ci
npm run dev -- --port 3102
```

打开 http://127.0.0.1:3102。普通入口为空；可输入购买需求。中英文切换位于右上角。

真实通用分析需自行把 .env.example 复制为 .env.local，配置自己的 OPENAI_API_KEY、OPENAI_MODEL、SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY，并配置 supabase/schema.sql。密钥不在包内，不要发到聊天或公开提交。

无密钥时，可显式点击 Load demo / 加载演示，查看原有合成耳机分支。它不是普通流程的回退。界面翻译不改变评论原文、引用或分析状态。

## 复现检查

```powershell
$env:BUYLENS_BASE_URL='http://127.0.0.1:3102'
npm test
npm run typecheck
npm run test:live:generic
npm run test:live
npm run build
```

实时检查会使用自己的 API 额度与 Supabase。打包不包含凭证、node_modules、.next、Git/Vercel 认证信息或旧压缩包。原有 README/作品集记录属于之前发布的耳机 MVP；本文件及 CORE_FLOW_AUDIT.md 说明本次修复范围与实测结果。
