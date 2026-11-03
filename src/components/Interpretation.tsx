"use client";

import { useEffect, useRef } from "react";

export type InterpretMode = "classic" | "smart";

export default function Interpretation({
  text,
  loading,
  mode,
  onModeChange,
  ragKey,
  ragHit,
}: {
  text: string;
  loading: boolean;
  mode: InterpretMode;
  onModeChange?: (m: InterpretMode) => void;
  ragKey?: string;
  ragHit?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [text]);

  if (!text && !loading && !onModeChange) return null;

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-ziwei-500" />
        <h2 className="font-serif text-lg text-ink-800">解读</h2>
        {onModeChange && (
          <div className="flex gap-1 ml-2">
            <button
              type="button"
              onClick={() => onModeChange("classic")}
              className={`text-xs px-2 py-1 rounded-full border ${
                mode === "classic"
                  ? "bg-ziwei-600 text-white border-ziwei-600"
                  : "border-ink-200 text-ink-600"
              }`}
            >
              经典断语
            </button>
            <button
              type="button"
              onClick={() => onModeChange("smart")}
              className={`text-xs px-2 py-1 rounded-full border ${
                mode === "smart"
                  ? "bg-ziwei-600 text-white border-ziwei-600"
                  : "border-ink-200 text-ink-600"
              }`}
            >
              智能解读
            </button>
          </div>
        )}
        {loading && (
          <span className="text-xs text-ink-400 animate-pulse">生成中…</span>
        )}
      </div>

      {(ragKey || ragHit != null) && (
        <p className="text-xs text-ink-400 mb-3">
          断语检索：{ragHit ? "已命中本地库" : "未精确命中（可能用了默认样例）"}
          {ragKey ? ` · key=${ragKey}` : ""}
        </p>
      )}

      <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-ink-800">
        {text || (loading ? "正在生成…" : "排盘后可在此查看解读")}
        <div ref={bottomRef} />
      </div>

      <p className="mt-4 text-[11px] text-ink-400">
        经典断语：直接展示库内原文。智能解读：以断语为素材，由 AI 润色综合。数据可替换为开源
        ziwei-doushu v4.0 分片。
      </p>
    </div>
  );
}
