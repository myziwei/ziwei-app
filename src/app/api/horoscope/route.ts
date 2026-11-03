import { NextRequest, NextResponse } from "next/server";
import { generateChart, generateChartFromInput } from "@/lib/chart";
import { buildHoroscopeView, mergeHoroscopeIntoChart } from "@/lib/yearly";
import type { BirthInfo, BirthInput } from "@/lib/types";
import type { HoroscopeLayer } from "@/lib/yearly";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const layer = (body.layer || "yearly") as HoroscopeLayer;
    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || new Date().getMonth() + 1;

    let natal;
    if (body.birthInfo?.hour != null) {
      natal = generateChart(body.birthInfo as BirthInfo);
    } else if (body.input) {
      natal = generateChartFromInput(body.input as BirthInput);
    } else if (body.hour != null && body.year && body.month && body.day && body.gender) {
      natal = generateChart(body as BirthInfo);
    } else if (body.year && body.month && body.day && body.gender) {
      natal = generateChartFromInput(body as BirthInput);
    } else {
      return NextResponse.json({ error: "缺少出生信息" }, { status: 400 });
    }

    const view = buildHoroscopeView(natal.birthInfo, { year, month, layer });
    const merged = mergeHoroscopeIntoChart(natal, view);
    const { raw, ...summary } = merged;

    return NextResponse.json({
      chart: summary,
      view: {
        layer: view.layer,
        note: view.note,
        decadalPalace: view.decadalPalace,
        decadalRange: view.decadalRange,
        yearlyLabel: view.yearlyLabel,
        monthlyLabel: view.monthlyLabel,
        highlightPalaces: view.highlightPalaces,
      },
    });
  } catch (err) {
    console.error("Horoscope error:", err);
    const message = err instanceof Error ? err.message : "运限计算失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
