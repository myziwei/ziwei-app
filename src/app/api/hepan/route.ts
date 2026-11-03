import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateChart, generateChartFromInput } from "@/lib/chart";
import { buildHepanContext, HEPAN_SYSTEM } from "@/lib/hepan";
import type { BirthInfo, BirthInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function toChart(body: any) {
  if (body.hour != null && body.year) return generateChart(body as BirthInfo);
  return generateChartFromInput(body as BirthInput);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personA, personB, withAI } = body as {
      personA: BirthInput | BirthInfo;
      personB: BirthInput | BirthInfo;
      withAI?: boolean;
    };

    if (!personA || !personB) {
      return NextResponse.json({ error: "需要双方出生信息" }, { status: 400 });
    }

    const chartA = toChart(personA);
    const chartB = toChart(personB);
    const hepan = buildHepanContext(chartA, chartB);

    const { raw: _r1, ...summaryA } = chartA as any;
    const { raw: _r2, ...summaryB } = chartB as any;

    if (!withAI) {
      return NextResponse.json({
        personA: summaryA,
        personB: summaryB,
        relations: hepan.relations,
        contextText: hepan.contextText,
      });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return NextResponse.json({
        personA: summaryA,
        personB: summaryB,
        relations: hepan.relations,
        interpretation:
          "（演示）未配置 API Key。关系要点已生成。\n\n" +
          hepan.relations.map((r) => `**${r.label}**\n${r.detail}`).join("\n\n"),
      });
    }

    const client = new OpenAI({ apiKey, baseURL: baseURL || undefined });
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: HEPAN_SYSTEM },
        { role: "user", content: hepan.contextText },
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
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("Hepan error:", err);
    const message = err instanceof Error ? err.message : "合盘失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
