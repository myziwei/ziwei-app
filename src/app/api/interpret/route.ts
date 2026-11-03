import { NextRequest } from "next/server";
import OpenAI from "openai";
import { chartToPromptText, generateChart } from "@/lib/chart";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { fetchRag, getRagKey, ragToMarkdown } from "@/lib/rag";
import type { BirthInfo } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { birthInfo, topics, chart: existingChart, mode } = body as {
      birthInfo?: BirthInfo;
      topics?: string[];
      chart?: any;
      mode?: "classic" | "smart";
    };

    if (!birthInfo && !existingChart) {
      return new Response(JSON.stringify({ error: "缺少出生信息或命盘" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chart = existingChart || generateChart(birthInfo!);
    const info: BirthInfo = birthInfo || chart.birthInfo;
    const chartText = chartToPromptText(chart);

    const key = getRagKey(info);
    const ragHit = await fetchRag(key);
    const ragMarkdown = ragHit ? ragToMarkdown(ragHit) : null;

    // 经典模式：直接返回断语，不调用 AI
    if (mode === "classic") {
      const text =
        ragMarkdown ||
        `未找到该命盘的本地断语（key: ${key}）。\n\n请将开源 v4.0 数据分片放入 data/rag 目录，或改用「智能解读」模式。`;
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-RAG-Key": key,
          "X-RAG-Hit": ragHit ? "1" : "0",
        },
      });
    }

    const userPrompt = buildUserPrompt(chartText, topics, ragMarkdown);

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      const demo = `## 智能解读（演示模式）

未配置 AI API Key。以下先展示本地参考断语；配置 Key 后将自动润色。

${ragMarkdown || "（无本地断语命中）"}

---
命盘摘要：
\`\`\`
${chartText.slice(0, 600)}
\`\`\`
`;
      return new Response(demo, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    });

    const stream = await client.chat.completions.create({
      model,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-RAG-Key": key,
        "X-RAG-Hit": ragHit ? "1" : "0",
      },
    });
  } catch (err) {
    console.error("Interpret error:", err);
    const message = err instanceof Error ? err.message : "解读失败";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
