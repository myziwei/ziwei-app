/**
 * 真太阳时校正
 * 以东经 120° 为民用时基准（中国常见做法），加上均时差。
 */
import type { TrueSolarInfo } from "./types";
import { HOUR_NAMES } from "./constants";

export interface TrueSolarParams {
  year: number;
  month: number;
  day: number;
  clockHour: number;
  clockMinute: number;
  longitude: number;
}

/** 一年中的第几天（1–365/366） */
function dayOfYear(year: number, month: number, day: number): number {
  const date = new Date(year, month - 1, day);
  const start = new Date(year, 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 均时差（分钟），近似公式
 * 真太阳时 = 平太阳时 + 均时差
 */
function equationOfTimeMinutes(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day);
  const B = ((2 * Math.PI) / 365) * (n - 81);
  // 单位：分钟
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 钟点 → 时辰索引 0–11（子…亥），以 23:00 为子时起点 */
export function clockToHourIndex(clockHour: number, clockMinute: number = 0): number {
  const total = ((clockHour % 24) * 60 + clockMinute + 60) % (24 * 60); // 对齐：0 分 = 23:00
  return Math.floor(total / 120) % 12;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * 钟表时间 + 经度 → 真太阳时 + 时辰
 * 经度：东经为正。每偏东 1°，真太阳时约早 4 分钟。
 */
export function computeTrueSolarTime(params: TrueSolarParams): TrueSolarInfo {
  const { year, month, day, clockHour, clockMinute, longitude } = params;

  const standardMeridian = 120; // 东八区常用基准
  const longCorr = (longitude - standardMeridian) * 4; // 分钟
  const eot = equationOfTimeMinutes(year, month, day);

  let totalMin = clockHour * 60 + clockMinute + longCorr + eot;
  // 归一到 0–24h
  totalMin = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);

  const trueH = Math.floor(totalMin / 60);
  const trueM = Math.round(totalMin % 60);
  // 处理 60 分进位
  const adjH = trueM === 60 ? (trueH + 1) % 24 : trueH;
  const adjM = trueM === 60 ? 0 : trueM;

  const hourIndex = clockToHourIndex(adjH, adjM);
  const hourName = HOUR_NAMES[hourIndex];

  return {
    clock: `${pad2(clockHour)}:${pad2(clockMinute)}`,
    corrected: `${pad2(adjH)}:${pad2(adjM)}`,
    hourIndex,
    hourName,
    note: `东经 ${longitude.toFixed(2)}°，相对 120° 经度差 ${longCorr >= 0 ? "+" : ""}${longCorr.toFixed(1)} 分，均时差 ${eot >= 0 ? "+" : ""}${eot.toFixed(1)} 分`,
    used: true,
  };
}
