# dev-recall-agent

一个本地 CLI 工具，用于在你隔几天重新打开项目时，自动收集项目上下文并生成“恢复工作状态”报告。

它会读取目标项目的 Git 信息、README / package 配置、TODO 线索、最近修改文件，并调用 LLM 生成中文 Markdown 报告。

## 1) 项目是什么

`dev-recall-agent` 是一个“开发上下文恢复 Agent”，目标是帮助你快速回答：

1. 项目是做什么的
2. 最近在改什么
3. 当前可能停在哪里
4. 哪些文件最关键
5. 还有哪些任务未完成
6. 下一步建议是什么
7. 潜在风险有哪些

## 2) 安装依赖

```bash
npm install
```

## 3) 配置 `.env`

先复制模板：

```bash
cp .env.example .env
```

然后填写：

- `OPENAI_API_KEY`（必填）
- `OPENAI_BASE_URL`（可选，兼容 OpenAI API 的网关）
- `OPENAI_MODEL`（可选，默认 `gpt-4o-mini`）

## 4) 如何运行

开发模式（推荐）：

```bash
npm run dev -- ../some-project
```

构建并运行：

```bash
npm run build
npm start -- ../some-project
```

本地安装为全局命令（可选）：

```bash
npm run build
npm link
dev-recall ../some-project
```

## 5) 输出文件说明

在目标项目目录下生成：

```text
.context/
├── context-report.md
└── memory.json
```

- `context-report.md`：本次生成的上下文恢复报告（中文 Markdown）。
- `memory.json`：本次记忆快照，用于下次运行时做“相比上次的变化”分析。

## 6) 注意事项

- 该工具只做读取和分析，不会自动修改目标项目代码。
- 非 Git 项目可以运行，不会崩溃。
- 当 `OPENAI_API_KEY` 缺失时会给出清晰错误提示。
- 为控制上下文长度，工具会对 diff、README、最近文件摘录等内容做截断。
