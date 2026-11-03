/**
 * 全局类型定义（阶段 0 定稿）
 * 后续阶段只实现逻辑，尽量不再改字段名
 */

/** 时辰地支：0=子 … 11=亥 */
export type HourIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * 旧版出生信息（兼容现有排盘 API / 前端）
 * hour 为时辰地支索引 0–11
 */
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: "male" | "female";
  name?: string;
}

/**
 * 新版出生输入（阶段 1 起表单使用）
 * - 可只传 hourIndex（与旧版相同）
 * - 或传钟点 + 经度，做真太阳时后再得到 hourIndex
 */
export interface BirthInput {
  year: number;
  month: number;
  day: number;
  gender: "male" | "female";
  name?: string;

  /** 直接指定时辰 0–11 */
  hourIndex?: number;

  /** 钟点模式 */
  clockHour?: number;
  clockMinute?: number;

  /** 出生地 */
  city?: string;
  longitude?: number;
  latitude?: number;

  /** 有经度+钟点时是否做真太阳时，默认 true */
  useTrueSolarTime?: boolean;
}

/** 真太阳时说明（展示给用户） */
export interface TrueSolarInfo {
  clock: string;
  corrected: string;
  hourIndex: number;
  hourName: string;
  note: string;
  used: boolean;
}

/** 单个宫位 */
export interface PalaceInfo {
  name: string;
  branch: string;
  stem: string;
  isMingGong: boolean;
  isShenGong: boolean;
  majorStars: string[];
  minorStars: string[];
  brightness: Record<string, string>;
  sihua: string[];
}

/** 流年/流月等叠加星 */
export interface OverlayStar {
  name: string;
  kind: "yearly" | "monthly" | "decadal";
}

/** 命盘摘要（排盘 API 主返回） */
export interface ChartSummary {
  birthInfo: BirthInfo;
  lunarDate: string;
  fiveElementsBureau: string;
  soul: string;
  body: string;
  mingGong: string;
  shenGong: string;
  palaces: PalaceInfo[];
  decadal: Array<{ palace: string; startAge: number; endAge: number }>;

  /** 阶段 1 */
  trueSolar?: TrueSolarInfo;

  /** 阶段 2 */
  layer?: "natal" | "decadal" | "yearly" | "monthly";
  year?: number;
  month?: number;
  overlayByPalace?: Record<string, OverlayStar[]>;

  raw?: unknown;
}

/** RAG 断语命中（阶段 3） */
export type RagTopicKey =
  | "overview"
  | "personality"
  | "love"
  | "career"
  | "wealth"
  | "health"
  | "family"
  | "children"
  | "move"
  | "friends"
  | "home"
  | "spirit"
  | "parents";

export interface RagHit {
  key: string;
  topics: Partial<Record<RagTopicKey, string>>;
}

/** 合盘（阶段 4） */
export interface HepanRelation {
  label: string;
  detail: string;
}

export interface HepanResult {
  personA: ChartSummary;
  personB: ChartSummary;
  relations: HepanRelation[];
  contextText: string;
}
