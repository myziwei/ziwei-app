"use client";

import { useState } from "react";
import Link from "next/link";
import HepanForm from "@/components/HepanForm";
import HepanBoard from "@/components/HepanBoard";
import type { BirthInput, ChartSummary, HepanRelation } from "@/lib/types";

export default function HepanPage() {
  const [personA, setPersonA] = useState<ChartSummary | null>(null);
  const [personB, setPersonB] = useState<ChartSummary | null>(null);
  const [relations, setRelations] = useState<HepanRelation[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (a: BirthInput, b: BirthInput) => {
    setLoading(true);
    setError("");
    setInterpretation("");
    setPersonA(null);
    setPersonB(null);
    try {
      const res = await fetch("/api/hepan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personA: a, personB: b, withAI: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "合盘失败");
      setPersonA(data.personA);
      setPersonB(data.personB);
      setRelations(data.relations || []);
      setLoading(false);

      setLoadingAI(true);
      try {
        const aiRes = await fetch("/api/hepan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personA: a, personB: b, withAI: true }),
        });
        const ct = aiRes.headers.get("content-type") || "";
        if (aiRes.ok && ct.includes("text/plain")) {
          const reader = aiRes.body?.getReader();
          const decoder = new TextDecoder();
          let full = "";
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              full += decoder.decode(value, { stream: true });
              setInterpretation(full);
            }
          }
        } else {
          const j = await aiRes.json().catch(() => ({}));
          if (j.interpretation) setInterpretation(j.interpretation);
          else if (j.error)
            setInterpretation(`（AI 暂不可用：${j.error}）\n可先看上方关系要点与双盘。`);
          else setInterpretation("（AI 暂不可用，请先查看关系要点与双盘。）");
        }
      } catch {
        setInterpretation("（AI 暂不可用，请先查看关系要点与双盘。）");
      } finally {
        setLoadingAI(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "出错了");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-ziwei-50 via-white to-ink-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-ink-900">合盘</h1>
            <p className="text-sm text-ink-500 mt-1">双方命盘对照 · 关系要点 · AI 解读</p>
          </div>
          <Link href="/" className="text-sm text-ziwei-700 underline">
            ← 返回排盘
          </Link>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm mb-8">
          <HepanForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {personA && personB && (
          <>
            <HepanBoard personA={personA} personB={personB} relations={relations} />
            <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <h2 className="font-medium text-ink-800 mb-3">
                AI 关系解读 {loadingAI && <span className="text-xs text-ink-400">生成中…</span>}
              </h2>
              <div className="whitespace-pre-wrap text-sm text-ink-800 leading-relaxed">
                {interpretation || (loadingAI ? "正在生成…" : "暂无")}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
