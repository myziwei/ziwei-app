import { NextRequest, NextResponse } from "next/server";
import { generateChart, generateChartFromInput } from "@/lib/chart";
import type { BirthInfo, BirthInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 新版：带 clockHour / longitude / hourIndex
    const isNewFormat =
      body.hourIndex != null ||
      body.clockHour != null ||
      body.longitude != null ||
      body.useTrueSolarTime != null;

    if (isNewFormat) {
      const input = body as BirthInput;
      const { year, month, day, gender } = input;
      if (!year || !month || !day || !gender) {
        return NextResponse.json({ error: "请提供完整的出生信息" }, { status: 400 });
      }
      if (year < 1900 || year > 2100) {
        return NextResponse.json({ error: "出生年份需在 1900–2100 之间" }, { status: 400 });
      }
      if (
        input.useTrueSolarTime !== false &&
        input.clockHour != null &&
        input.longitude == null
      ) {
        return NextResponse.json(
          { error: "使用真太阳时时请选择出生地或填写经度" },
          { status: 400 }
        );
      }
      const chart = generateChartFromInput(input);
      const { raw, ...summary } = chart;
      return NextResponse.json(summary);
    }

    // 旧版兼容：hour 为时辰索引
    const old = body as BirthInfo;
    const { year, month, day, hour, gender } = old;
    if (!year || !month || !day || hour === undefined || !gender) {
      return NextResponse.json({ error: "请提供完整的出生信息" }, { status: 400 });
    }
    if (hour < 0 || hour > 11) {
      return NextResponse.json({ error: "时辰需为 0–11（子到亥）" }, { status: 400 });
    }
    const chart = generateChart(old);
    const { raw, ...summary } = chart;
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Chart error:", err);
    const message = err instanceof Error ? err.message : "排盘失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
