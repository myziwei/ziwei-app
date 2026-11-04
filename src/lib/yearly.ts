/**
 * 大限 / 流年 / 流月 运限（基于 iztro horoscope）
 */
import { astro } from "iztro";
import type { BirthInfo, ChartSummary, OverlayStar } from "./types";

export type HoroscopeLayer = "natal" | "decadal" | "yearly" | "monthly";

export interface HoroscopeView {
  layer: HoroscopeLayer;
  targetDate: string;
  /** 大限所在宫名 */
  decadalPalace?: string;
  decadalRange?: string;
  /** 流年干支等摘要 */
  yearlyLabel?: string;
  monthlyLabel?: string;
  /** 宫名 → 叠星 */
  overlayByPalace: Record<string, OverlayStar[]>;
  /** 需要高亮的本命宫（大限宫等） */
  highlightPalaces: string[];
  note?: string;
}

function solarOf(info: BirthInfo) {
  return `${info.year}-${String(info.month).padStart(2, "0")}-${String(info.day).padStart(2, "0")}`;
}

function genderZh(g: BirthInfo["gender"]) {
  return g === "male" ? "男" : "女";
}

function collectStars(obj: unknown): string[] {
  if (!obj) return [];
  const names: string[] = [];
  const push = (x: unknown) => {
    if (!x) return;
    if (typeof x === "string") names.push(x);
    else if (typeof x === "object" && x !== null && "name" in x) {
      names.push(String((x as { name: unknown }).name));
    }
  };
  if (Array.isArray(obj)) {
    obj.forEach(push);
  } else if (typeof obj === "object" && obj !== null) {
    const o = obj as Record<string, unknown>;
    if (Array.isArray(o.stars)) o.stars.forEach(push);
    else if (Array.isArray(o.mutagen)) {
      // 四化名
      o.mutagen.forEach((m: unknown) => {
        if (typeof m === "string") {
          names.push(`化${m}`);
        } else if (typeof m === "object" && m !== null && "name" in m) {
          names.push(`化${String((m as { name: unknown }).name)}`);
        } else {
          names.push(`化${m}`);
        }
      });
    }
  }
  return names;
}

/**
 * 针对目标日期生成运限视图（叠星 + 高亮）
 */
export function buildHoroscopeView(
  info: BirthInfo,
  opts: { year: number; month?: number; layer: HoroscopeLayer }
): HoroscopeView {
  const layer = opts.layer;
  const month = opts.month ?? 6;
  const targetDate = `${opts.year}-${String(month).padStart(2, "0")}-15`;

  if (layer === "natal") {
    return {
      layer: "natal",
      targetDate,
      overlayByPalace: {},
      highlightPalaces: [],
      note: "本命盘",
    };
  }

  const astrolabe = astro.bySolar(solarOf(info), info.hour, genderZh(info.gender), true, "zh-CN");
  const horoscope = astrolabe.horoscope(targetDate, info.hour);
  const data = typeof horoscope.toJSON === "function" ? horoscope.toJSON() : horoscope;

  const overlayByPalace: Record<string, OverlayStar[]> = {};
  const highlightPalaces: string[] = [];

  const addOverlay = (palaceName: string, stars: string[], kind: OverlayStar["kind"]) => {
    if (!palaceName || !stars.length) return;
    const key = palaceName.replace(/宫$/, "");
    const full = palaceName.includes("宫") ? palaceName : palaceName;
    const aliases = [full, key, key + "宫"];
    for (const a of aliases) {
      if (!overlayByPalace[a]) overlayByPalace[a] = [];
      for (const s of stars) {
        if (!overlayByPalace[a].some((x) => x.name === s && x.kind === kind)) {
          overlayByPalace[a].push({ name: s, kind });
        }
      }
    }
  };

  // 大限
const decadal = data.decadal || {};
const decadalPalace =
  decadal.palaceName ||
  decadal.name ||
  decadal.palace ||
  (Array.isArray(decadal.palaceNames) ? decadal.palaceNames[0] : undefined);
  let decadalRange: string | undefined;
  if (decadal.range) {
    decadalRange = Array.isArray(decadal.range)
      ? `${decadal.range[0]}–${decadal.range[1]}岁`
      : String(decadal.range);
  } else if (decadal.startAge != null) {
    decadalRange = `${decadal.startAge}–${decadal.endAge}岁`;
  }
  if (decadalPalace) highlightPalaces.push(String(decadalPalace).replace(/宫$/, ""));

  // 流年 / 流月标签
  const yearly = data.yearly || {};
  const monthly = data.monthly || {};
  const yearlyLabel = [yearly.heavenlyStem, yearly.earthlyBranch].filter(Boolean).join("") ||
    yearly.name ||
    `${opts.year}流年`;
  const monthlyLabel =
    [monthly.heavenlyStem, monthly.earthlyBranch].filter(Boolean).join("") ||
    monthly.name ||
    (opts.month ? `${opts.year}年${opts.month}月` : undefined);

  // 尝试从各宫取流曜（结构因版本可能不同，做兼容）
  const scopes: Array<{ key: string; kind: OverlayStar["kind"] }> = [];
  if (layer === "decadal") scopes.push({ key: "decadal", kind: "decadal" });
  if (layer === "yearly" || layer === "monthly") {
    scopes.push({ key: "yearly", kind: "yearly" });
  }
  if (layer === "monthly") scopes.push({ key: "monthly", kind: "monthly" });

  const palaceNames = [
    "命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄",
    "迁移", "交友", "官禄", "田宅", "福德", "父母",
  ];

  for (const scope of scopes) {
    for (const pn of palaceNames) {
      try {
        const p = horoscope.palace?.(pn, scope.key);
        if (!p) continue;
    const stars = [
  ...collectStars(p.majorStars || p.stars),
  ...collectStars(p.minorStars),
  ...collectStars(p.horoscopeStars),
];
        // 运限四化
        if (p.mutagen) {
          const ms = Array.isArray(p.mutagen) ? p.mutagen : [p.mutagen];
      ms.forEach((m: unknown) => {
  const label =
    typeof m === "string"
      ? `化${m}`
      : typeof m === "object" && m !== null && "name" in m
      ? `化${String((m as { name: unknown }).name || "")}`
      : `化${m}`;
  if (label.length > 1) stars.push(label);
});
        }
        addOverlay(pn, stars, scope.kind);
      } catch {
        // ignore single palace errors
      }
    }
  }

  // 若 palace() 取不到星，退化为显示大限宫高亮 + 干支标签
  return {
    layer,
    targetDate,
    decadalPalace: decadalPalace ? String(decadalPalace) : undefined,
    decadalRange,
    yearlyLabel: String(yearlyLabel),
    monthlyLabel: monthlyLabel ? String(monthlyLabel) : undefined,
    overlayByPalace,
    highlightPalaces,
    note:
      layer === "decadal"
        ? `大限：${decadalPalace || "—"} ${decadalRange || ""}`
        : layer === "yearly"
        ? `流年 ${yearlyLabel}（${opts.year}）`
        : `流月 ${monthlyLabel || ""}`,
  };
}

/** 把运限视图合并进 ChartSummary（不改本命星） */
export function mergeHoroscopeIntoChart(
  chart: ChartSummary,
  view: HoroscopeView
): ChartSummary {
  return {
    ...chart,
    layer: view.layer,
    year: view.targetDate ? Number(view.targetDate.slice(0, 4)) : undefined,
    month:
      view.layer === "monthly" && view.targetDate
        ? Number(view.targetDate.slice(5, 7))
        : undefined,
    overlayByPalace: view.overlayByPalace,
  };
}
