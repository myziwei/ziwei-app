/**
 * 紫微斗数排盘封装 —— 基于 iztro
 * 输入公历 + 时辰地支索引，输出结构化命盘
 */
import { astro } from "iztro";
import type { BirthInfo, BirthInput, ChartSummary, PalaceInfo } from "./types";
import { HOUR_NAMES } from "./constants";
import { computeTrueSolarTime, clockToHourIndex } from "./true-solar-time";

const PALACE_ORDER = [
  "命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
  "迁移", "交友", "官禄", "田宅", "福德", "父母",
];

export function generateChart(info: BirthInfo): ChartSummary {
  const { year, month, day, hour, gender } = info;
  const solarDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const genderZh = gender === "male" ? "男" : "女";

  const astrolabe = astro.bySolar(solarDate, hour, genderZh, true, "zh-CN");

  const palaces: PalaceInfo[] = astrolabe.palaces.map((p: any, idx: number) => {
    const major = (p.majorStars || []).map((s: any) => s.name);
    const minor = [
      ...(p.minorStars || []).map((s: any) => s.name),
      ...(p.adjectiveStars || []).map((s: any) => s.name),
    ];

    const brightness: Record<string, string> = {};
    [...(p.majorStars || []), ...(p.minorStars || [])].forEach((s: any) => {
      if (s.brightness) brightness[s.name] = s.brightness;
    });

    const sihua: string[] = [];
    (p.majorStars || []).forEach((s: any) => {
      if (s.mutagen) sihua.push(s.mutagen);
    });

    return {
      name: p.name || PALACE_ORDER[idx] || `宫${idx}`,
      branch: p.earthlyBranch || "",
      stem: p.heavenlyStem || "",
      isMingGong: p.isOriginalPalace || p.name === "命宫",
      isShenGong: p.isBodyPalace || false,
      majorStars: major,
      minorStars: minor,
      brightness,
      sihua,
    };
  });

  const decadal = (astrolabe.palaces || [])
    .map((p: any) => {
      const d = p.decadal;
      if (!d) return null;
      return {
        palace: p.name,
        startAge: d.range?.[0] ?? d.startAge ?? 0,
        endAge: d.range?.[1] ?? d.endAge ?? 0,
      };
    })
    .filter(Boolean) as ChartSummary["decadal"];

  return {
    birthInfo: info,
    lunarDate: `${astrolabe.lunarDate || ""}`,
    fiveElementsBureau: astrolabe.fiveElementsClass || "",
    soul: astrolabe.soul || "",
    body: astrolabe.body || "",
    mingGong: palaces.find((p) => p.isMingGong)?.name || "命宫",
    shenGong: palaces.find((p) => p.isShenGong)?.name || "身宫",
    palaces,
    decadal,
    raw: astrolabe,
  };
}

/**
 * 新版入口：支持钟点 + 经度真太阳时
 */
export function generateChartFromInput(input: BirthInput): ChartSummary {
  const useTrue =
    input.useTrueSolarTime !== false &&
    input.longitude != null &&
    input.clockHour != null;

  let hourIndex: number;
  let trueSolar = undefined;

  if (useTrue) {
    trueSolar = computeTrueSolarTime({
      year: input.year,
      month: input.month,
      day: input.day,
      clockHour: input.clockHour!,
      clockMinute: input.clockMinute ?? 0,
      longitude: input.longitude!,
    });
    hourIndex = trueSolar.hourIndex;
  } else if (input.hourIndex != null) {
    hourIndex = input.hourIndex;
  } else if (input.clockHour != null) {
    hourIndex = clockToHourIndex(input.clockHour, input.clockMinute ?? 0);
  } else {
    throw new Error("请提供时辰或钟点时间");
  }

  const birthInfo: BirthInfo = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: hourIndex,
    gender: input.gender,
    name: input.name,
  };

  const chart = generateChart(birthInfo);
  if (trueSolar) {
    chart.trueSolar = trueSolar;
  } else if (input.clockHour != null) {
    chart.trueSolar = {
      clock: `${String(input.clockHour).padStart(2, "0")}:${String(input.clockMinute ?? 0).padStart(2, "0")}`,
      corrected: `${String(input.clockHour).padStart(2, "0")}:${String(input.clockMinute ?? 0).padStart(2, "0")}`,
      hourIndex,
      hourName: HOUR_NAMES[hourIndex],
      note: "未使用真太阳时（按钟点直接对应时辰）",
      used: false,
    };
  }
  return chart;
}

export function chartToPromptText(chart: ChartSummary): string {
  const lines: string[] = [];
  const { birthInfo, lunarDate, fiveElementsBureau, soul, body, palaces } = chart;

  lines.push(`【基本信息】`);
  lines.push(`公历：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${HOUR_NAMES[birthInfo.hour]}时`);
  if (chart.trueSolar) {
    lines.push(
      `时间：钟表 ${chart.trueSolar.clock} → ${chart.trueSolar.used ? "真太阳时" : "未校正"} ${chart.trueSolar.corrected} → ${chart.trueSolar.hourName}时`
    );
    lines.push(`说明：${chart.trueSolar.note}`);
  }
  lines.push(`农历：${lunarDate}`);
  lines.push(`性别：${birthInfo.gender === "male" ? "男" : "女"}`);
  lines.push(`五行局：${fiveElementsBureau}`);
  lines.push(`命主：${soul}　身主：${body}`);
  lines.push("");

  lines.push(`【十二宫星曜】`);
  for (const p of palaces) {
    const stars = [
      ...p.majorStars.map((s) => {
        const b = p.brightness[s] ? `(${p.brightness[s]})` : "";
        return s + b;
      }),
      ...p.minorStars,
    ].join("、") || "空宫";
    const sihua = p.sihua.length ? ` 【四化：${p.sihua.join("")}】` : "";
    const tags = [p.isMingGong ? "命" : "", p.isShenGong ? "身" : ""].filter(Boolean).join("");
    lines.push(`${p.name}（${p.stem}${p.branch}${tags ? "·" + tags : ""}）：${stars}${sihua}`);
  }

  if (chart.decadal?.length) {
    lines.push("");
    lines.push(`【大限】`);
    chart.decadal.forEach((d) => {
      lines.push(`${d.palace}：${d.startAge}–${d.endAge}岁`);
    });
  }

  return lines.join("\n");
}

export { HOUR_NAMES } from "./constants";
