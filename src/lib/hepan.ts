/**
 * 合盘：双盘对照 + 关系要点
 */
import type { ChartSummary, HepanRelation, HepanResult, PalaceInfo } from "./types";

function findPalace(chart: ChartSummary, name: string): PalaceInfo | undefined {
  const n = name.replace(/宫$/, "");
  return (
    chart.palaces.find((p) => p.name === name || p.name === n || p.name === n + "宫") ||
    chart.palaces.find((p) => p.name.includes(n))
  );
}

function starLine(p?: PalaceInfo): string {
  if (!p) return "（无）";
  const major = p.majorStars.join("、") || "空";
  const sihua = p.sihua.length ? ` 化${p.sihua.join("")}` : "";
  return `${p.name}：${major}${sihua}`;
}

export function buildHepanContext(
  personA: ChartSummary,
  personB: ChartSummary
): HepanResult {
  const aMing = findPalace(personA, "命宫");
  const bMing = findPalace(personB, "命宫");
  const aSpouse = findPalace(personA, "夫妻");
  const bSpouse = findPalace(personB, "夫妻");
  const aFude = findPalace(personA, "福德");
  const bFude = findPalace(personB, "福德");
  const aGuan = findPalace(personA, "官禄");
  const bGuan = findPalace(personB, "官禄");
  const aCai = findPalace(personA, "财帛");
  const bCai = findPalace(personB, "财帛");

  const relations: HepanRelation[] = [
    { label: "双方命宫", detail: `甲 ${starLine(aMing)} ｜ 乙 ${starLine(bMing)}` },
    { label: "双方夫妻宫", detail: `甲 ${starLine(aSpouse)} ｜ 乙 ${starLine(bSpouse)}` },
    { label: "福德对照", detail: `甲 ${starLine(aFude)} ｜ 乙 ${starLine(bFude)}` },
    { label: "事业对照", detail: `甲 ${starLine(aGuan)} ｜ 乙 ${starLine(bGuan)}` },
    { label: "财帛对照", detail: `甲 ${starLine(aCai)} ｜ 乙 ${starLine(bCai)}` },
  ];

  const tips: string[] = [];
  if (
    aSpouse?.sihua.some((s) => String(s).includes("忌")) ||
    bSpouse?.sihua.some((s) => String(s).includes("忌"))
  ) {
    tips.push("一方或双方夫妻宫见化忌，相处中言语与期待需更多耐心。");
  }
  if (aMing?.majorStars.some((s) => bMing?.majorStars.includes(s))) {
    tips.push("命宫有同主星，性格底层易有共鸣。");
  }
  if (tips.length) {
    relations.push({ label: "提示", detail: tips.join(" ") });
  }

  const nameA = personA.birthInfo.name || "甲方";
  const nameB = personB.birthInfo.name || "乙方";

  const contextText = [
    `【合盘对象】${nameA} 与 ${nameB}`,
    `甲：${personA.birthInfo.year}-${personA.birthInfo.month}-${personA.birthInfo.day} 时辰${personA.birthInfo.hour} ${personA.birthInfo.gender}`,
    `乙：${personB.birthInfo.year}-${personB.birthInfo.month}-${personB.birthInfo.day} 时辰${personB.birthInfo.hour} ${personB.birthInfo.gender}`,
    "",
    ...relations.map((r) => `${r.label}：${r.detail}`),
    "",
    "请从缘分吸引、相处模式、可能摩擦、事业金钱合作、实用建议五方面解读，语气中性建设，避免绝对化离合判断。",
  ].join("\n");

  return { personA, personB, relations, contextText };
}

export const HEPAN_SYSTEM = `你是紫微斗数合盘顾问。根据双方命盘对照信息分析关系倾向。
要求：
1. 分节：缘分与吸引、相处模式、摩擦点、事业与金钱、实用建议。
2. 不恐吓、不绝对化「必分/必合」。
3. 只用所给盘面信息，不编造隐私。
4. Markdown 输出，简洁可读。`;
