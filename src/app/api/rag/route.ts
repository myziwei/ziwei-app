import { NextRequest, NextResponse } from "next/server";
import { fetchRag, getRagKey, ragToMarkdown } from "@/lib/rag";
import type { BirthInfo } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let key = body.key as string | undefined;
    if (!key && body.birthInfo) {
      key = getRagKey(body.birthInfo as BirthInfo);
    }
    if (!key) {
      return NextResponse.json({ error: "需要 key 或 birthInfo" }, { status: 400 });
    }
    const hit = await fetchRag(key);
    if (!hit) {
      return NextResponse.json({ hit: null, markdown: null, key });
    }
    return NextResponse.json({
      hit,
      markdown: ragToMarkdown(hit),
      key,
      exact: hit.key === key || !hit.key.startsWith("_"),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "RAG 检索失败" }, { status: 500 });
  }
}
