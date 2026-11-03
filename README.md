# 紫微斗数 · AI 排盘应用

一个完整的、可本地运行的紫微斗数排盘 + AI 解读 Web 应用。

- **排盘引擎**：基于 [iztro](https://github.com/SylarLong/iztro)（与 Renhuai123/ziwei-doushu 同源核心）
- **AI 解读**：支持 OpenAI / DeepSeek / 通义等任意兼容接口，流式输出
- **界面**：出生信息表单、十二宫命盘、大限、Markdown 解读

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 AI（可选，不配也能看排盘）
cp .env.example .env.local
# 编辑 .env.local，填入 OPENAI_API_KEY

# 3. 启动
npm run dev
```

打开 http://localhost:3000

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `OPENAI_API_KEY` | API Key（必填才能 AI 解读） | - |
| `OPENAI_BASE_URL` | 兼容接口地址 | OpenAI 官方 |
| `AI_MODEL` | 模型名 | `gpt-4o-mini` |

### 常用第三方示例

**DeepSeek**
```
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

**硅基流动 / 其他 OpenAI 兼容**
```
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.siliconflow.cn/v1
AI_MODEL=deepseek-ai/DeepSeek-V3
```

## 项目结构

```
src/
  app/
    api/chart/route.ts      # 排盘 API
    api/interpret/route.ts  # AI 解读 API（流式）
    page.tsx                # 主页面
  components/
    BirthForm.tsx           # 出生信息表单
    ChartBoard.tsx          # 十二宫命盘
    Interpretation.tsx      # 解读展示
  lib/
    chart.ts                # iztro 封装 + 文本摘要
    prompt.ts               # 系统提示词
    types.ts
```

## 后续可扩展

- 真太阳时（按出生地经度校正）
- 流年 / 流月切换
- 合盘
- 把开源数据集 v4.0 的断语作为 RAG 知识库

## 免责声明

本项目仅供学习与研究，命理内容不构成任何人生决策建议。

## 一键部署到 Vercel（推荐）

### 方法一：网页导入（最简单）

1. 把本项目推到你的 GitHub 仓库（或直接上传）
2. 打开 [vercel.com/new](https://vercel.com/new)
3. 导入该仓库
4. 在 **Environment Variables** 里添加：
   - `OPENAI_API_KEY` = 你的 Key
   - `OPENAI_BASE_URL` = （可选）如 `https://api.deepseek.com/v1`
   - `AI_MODEL` = （可选）如 `deepseek-chat`
5. 点击 Deploy

### 方法二：命令行

```bash
npm i -g vercel
vercel login
vercel          # 预览
vercel --prod   # 生产
```

部署后在 Vercel 项目设置 → Environment Variables 添加上面的变量并 Redeploy。

### 国内用户注意

若 OpenAI 官方接口在服务器所在区域不可用，请使用 DeepSeek / 硅基流动 / 通义等兼容接口，并设置 `OPENAI_BASE_URL`。
