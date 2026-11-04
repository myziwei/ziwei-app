/**
 * 断语 RAG — 用 findstr 按 key 抽一行，避免 700MB 读入 Node 字符串
 */
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { BirthInfo, RagHit, RagTopicKey } from "./types";

const execFileAsync = promisify(execFile);

const TOPIC_LABELS: Record<RagTopicKey, string> = {
  overview: "总论",
  personality: "性格",
  love: "感情",
  career: "事业",
  wealth: "财运",
  health: "健康",
  family: "兄弟/家庭",
  children: "子女",
  move: "迁移",
  friends: "交友",
  home: "田宅",
  spirit: "福德",
  parents: "父母",
};

const TOPIC_ALIASES: Record<string, RagTopicKey> = {
  overview: "overview",
  命格总览: "overview",
  总论: "overview",
  总览: "overview",
  personality: "personality",
  性格: "personality",
  love: "love",
  感情: "love",
  婚姻: "love",
  career: "career",
  事业: "career",
  wealth: "wealth",
  财运: "wealth",
  health: "health",
  健康: "health",
  family: "family",
  兄弟: "family",
  children: "children",
  子女: "children",
  move: "move",
  迁移: "move",
  friends: "friends",
  人际: "friends",
  交友: "friends",
  home: "home",
  田宅: "home",
  spirit: "spirit",
  福德: "spirit",
  parents: "parents",
  父母: "parents",
};

export function getRagKey(info: BirthInfo): string {
  const m = String(info.month).padStart(2, "0");
  const d = String(info.day).padStart(2, "0");
  return `${info.year}-${m}-${d}-${info.hour}-${info.gender}`;
}

function keyVariants(key: string): string[] {
  const variants = new Set<string>([key]);
  if (key.endsWith("-female")) variants.add(key.replace(/-female$/, "-女"));
  if (key.endsWith("-male")) variants.add(key.replace(/-male$/, "-男"));
  if (key.endsWith("-女")) variants.add(key.replace(/-女$/, "-female"));
  if (key.endsWith("-男")) variants.add(key.replace(/-男$/, "-male"));
  return [...variants];
}

function resolveRagDir(): string {
  const envDir = process.env.RAG_DATA_DIR;
  if (envDir) {
    const abs = path.isAbsolute(envDir) ? envDir : path.join(process.cwd(), envDir);
    if (fs.existsSync(abs)) return abs;
    console.warn("[RAG] RAG_DATA_DIR not found:", abs);
  }
  for (const c of [
    path.join(process.cwd(), "src/data/rag"),
    path.join(process.cwd(), "data/rag"),
  ]) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(process.cwd(), "src/data/rag");
}

function normalizeTopics(raw: unknown): Partial<Record<RagTopicKey, string>> {
  const out: Partial<Record<RagTopicKey, string>> = {};
  if (!raw) return out;
  if (typeof raw === "string") {
    out.overview = raw;
    return out;
  }
  if (Array.isArray(raw)) {
    const order: RagTopicKey[] = [
      "overview", "personality", "love", "career", "wealth", "health",
      "family", "children", "move", "friends", "home", "spirit", "parents",
    ];
    raw.forEach((item, i) => {
      if (typeof item === "string" && order[i]) out[order[i]] = item;
    });
    return out;
  }
  if (typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v !== "string") continue;
      const mapped = TOPIC_ALIASES[k];
      if (mapped) out[mapped] = v;
      else if (k in TOPIC_LABELS) out[k as RagTopicKey] = v;
    }
  }
  return out;
}

function rowToHit(row: Record<string, unknown> | null | undefined): RagHit | null {
  if (!row) return null;
  const key = String(row.k || row.key || "");
  if (!key) return null;
  return { key, topics: normalizeTopics(row.c || row.topics || row.t) };
}

let sampleCache: Map<string, RagHit> | null = null;
const hitCache = new Map<string, RagHit | null>();

function loadSampleFiles(dir: string): Map<string, RagHit> {
  if (sampleCache) return sampleCache;
  const map = new Map<string, RagHit>();
  try {
    if (!fs.existsSync(dir)) {
      sampleCache = map;
      return map;
    }
    for (const file of fs.readdirSync(dir)) {
      if (/^year-\d{4}/i.test(file)) continue;
      if (!file.endsWith(".jsonl") && !file.endsWith(".json")) continue;
      const full = path.join(dir, file);
      if (fs.statSync(full).size > 5 * 1024 * 1024) continue;
      const text = fs.readFileSync(full, "utf-8");
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try {
          const hit = rowToHit(JSON.parse(t));
          if (hit) map.set(hit.key, hit);
        } catch {
          /* skip */
        }
      }
    }
  } catch (e) {
    console.error("[RAG] sample error", e);
  }
  sampleCache = map;
  return map;
}

/** Windows: findstr 只取出包含 key 的行，避免整文件进 Node */
async function findWithFindstr(
  filePath: string,
  variants: string[]
): Promise<RagHit | null> {
  for (const v of variants) {
    // 更精确：匹配 "k":"完整key"
    const pattern = `"k":"${v}"`;
    try {
      const { stdout } = await execFileAsync(
        "findstr",
        ["/C:" + pattern, filePath],
        {
          encoding: "utf8",
          maxBuffer: 30 * 1024 * 1024, // 单条断语足够
          windowsHide: true,
        }
      );
      const line = stdout.split(/\r?\n/).find((l) => l.includes(pattern));
      if (!line) continue;
      try {
        const hit = rowToHit(JSON.parse(line));
        if (hit) return hit;
      } catch (e) {
        console.error("[RAG] JSON parse fail for key", v, e);
      }
} catch (e: unknown) {
  // findstr 找不到时 exit code 1
  const err = e as { code?: number; status?: number; message?: string };
  if (err?.code === 1) continue;
  if (err?.status === 1) continue;
  console.error("[RAG] findstr error", v, err?.message || e);
}
  }
  return null;
}

export async function fetchRag(key: string): Promise<RagHit | null> {
  if (hitCache.has(key)) return hitCache.get(key) ?? null;

  const dir = resolveRagDir();
  const variants = keyVariants(key);
  console.log("[RAG] dir=", dir, "exists=", fs.existsSync(dir), "key=", key);

  const samples = loadSampleFiles(dir);
  for (const v of variants) {
    if (samples.has(v)) {
      const hit = samples.get(v)!;
      hitCache.set(key, hit);
      return hit;
    }
  }

  const yearMatch = key.match(/^(\d{4})-/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const filePath = path.join(dir, `year-${year}.jsonl`);
    if (!fs.existsSync(filePath)) {
      console.warn("[RAG] missing file", filePath);
      hitCache.set(key, null);
      return null;
    }
    console.log("[RAG] searching", filePath);
    const hit = await findWithFindstr(filePath, variants);
    hitCache.set(key, hit);
    if (!hit) console.warn("[RAG] not found", key);
    return hit;
  }

  if (samples.has("_default")) {
    return { key, topics: samples.get("_default")!.topics };
  }
  hitCache.set(key, null);
  return null;
}

export function ragToMarkdown(hit: RagHit, only?: RagTopicKey[]): string {
  const keys = (only?.length ? only : (Object.keys(TOPIC_LABELS) as RagTopicKey[])).filter(
    (k) => hit.topics[k]
  );
  const lines: string[] = [
    `> 命盘键：\`${hit.key}\``,
    `> 数据来源：紫微斗数开源解读数据集 v4.0（Renhuai123/ziwei-doushu，CC BY 4.0）`,
    "",
  ];
  for (const k of keys) {
    lines.push(`### ${TOPIC_LABELS[k]}`);
    lines.push(hit.topics[k] || "");
    lines.push("");
  }
  if (!keys.length) {
    lines.push("_命中记录但未解析出分维正文_");
  }
  return lines.join("\n");
}

export { TOPIC_LABELS };
