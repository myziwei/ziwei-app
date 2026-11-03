/**
 * 断语 RAG：本地 sample.jsonl + 可扩展分片目录
 * 开源 v4.0 key 格式：YYYY-MM-DD-时辰序号-gender
 */
import fs from "fs";
import path from "path";
import type { BirthInfo, RagHit, RagTopicKey } from "./types";

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

export function getRagKey(info: BirthInfo): string {
  const y = info.year;
  const m = String(info.month).padStart(2, "0");
  const d = String(info.day).padStart(2, "0");
  return `${y}-${m}-${d}-${info.hour}-${info.gender}`;
}

function resolveRagDir(): string {
  const envDir = process.env.RAG_DATA_DIR;
  if (envDir) {
    const abs = path.isAbsolute(envDir) ? envDir : path.join(process.cwd(), envDir);
    if (fs.existsSync(abs)) return abs;
  }
  // 默认：src/data/rag 或 data/rag
  const candidates = [
    path.join(process.cwd(), "src/data/rag"),
    path.join(process.cwd(), "data/rag"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

let cache: Map<string, RagHit> | null = null;

function loadAllSamples(): Map<string, RagHit> {
  if (cache) return cache;
  const map = new Map<string, RagHit>();
  const dir = resolveRagDir();
  try {
    if (!fs.existsSync(dir)) {
      cache = map;
      return map;
    }
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl") || f.endsWith(".json"));
    for (const file of files) {
      const full = path.join(dir, file);
      const text = fs.readFileSync(full, "utf-8");
      if (file.endsWith(".json") && !file.endsWith(".jsonl")) {
        try {
          const obj = JSON.parse(text);
          if (obj.key && obj.topics) map.set(obj.key, obj as RagHit);
          else if (Array.isArray(obj)) {
            obj.forEach((row: RagHit) => row.key && map.set(row.key, row));
          }
        } catch {
          /* skip */
        }
        continue;
      }
      for (const line of text.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try {
          const row = JSON.parse(t) as RagHit;
          if (row.key) map.set(row.key, row);
        } catch {
          /* skip bad line */
        }
      }
    }
  } catch (e) {
    console.error("RAG load error", e);
  }
  cache = map;
  return map;
}

export async function fetchRag(key: string): Promise<RagHit | null> {
  const map = loadAllSamples();
  if (map.has(key)) return map.get(key)!;
  // 回退默认样例
  if (map.has("_default")) {
    const d = map.get("_default")!;
    return { key, topics: d.topics };
  }
  return null;
}

export function ragToMarkdown(hit: RagHit, only?: RagTopicKey[]): string {
  const keys = (only && only.length ? only : (Object.keys(TOPIC_LABELS) as RagTopicKey[])).filter(
    (k) => hit.topics[k]
  );
  const lines: string[] = [`> 命盘键：\`${hit.key}\``, ""];
  for (const k of keys) {
    lines.push(`### ${TOPIC_LABELS[k]}`);
    lines.push(hit.topics[k] || "");
    lines.push("");
  }
  return lines.join("\n");
}

export { TOPIC_LABELS };
