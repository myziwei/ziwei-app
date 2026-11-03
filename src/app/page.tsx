"use client";

import { useState, useCallback } from "react";
import BirthForm from "@/components/BirthForm";
import ChartBoard from "@/components/ChartBoard";
import Interpretation, { type InterpretMode } from "@/components/Interpretation";
import TimeAxisTabs, { type Layer } from "@/components/TimeAxisTabs";
import type { BirthInput, ChartSummary } from "@/lib/types";

export default function Home() {
  const [chart, setChart] = useState<ChartSummary | null>(null);
  const [birthPayload, setBirthPayload] = useState<BirthInput | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const [layer, setLayer] = useState<Layer>("natal");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [viewNote, setViewNote] = useState("");
  const [highlightPalaces, setHighlightPalaces] = useState<string[]>([]);

  const [mode, setMode] = useState<InterpretMode>("classic");
  const [ragKey, setRagKey] = useState("");
  const [ragHit, setRagHit] = useState(false);

  const runInterpret = async (
    chartData: ChartSummary,
    interpretMode: InterpretMode
  ) => {
    setLoadingAI(true);
    setInterpretation("");
    setError("");
    try {
      const aiRes = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birthInfo: chartData.birthInfo,
          chart: chartData,
          mode: interpretMode,
        }),
      });
      const keyHdr = aiRes.headers.get("X-RAG-Key");
      const hitHdr = aiRes.headers.get("X-RAG-Hit");
      if (keyHdr) setRagKey(keyHdr);
      setRagHit(hitHdr === "1");

      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => ({}));
        throw new Error(err.error || "解读失败");
      }
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "解读出错");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (info: BirthInput) => {
    setError("");
    setInterpretation("");
    setChart(null);
    setBirthPayload(info);
    setLayer("natal");
    setViewNote("本命盘");
    setHighlightPalaces([]);
    setLoadingChart(true);

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "排盘失败");
      setChart(data);
      setLoadingChart(false);
      await runInterpret(data, mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "出错了");
      setLoadingChart(false);
    }
  };

  const handleModeChange = async (m: InterpretMode) => {
    setMode(m);
    if (chart) await runInterpret(chart, m);
  };

  const applyLayer = useCallback(
    async (nextLayer: Layer, y: number, m: number) => {
      if (!birthPayload && !chart) return;
      setLayer(nextLayer);
      if (nextLayer === "natal") {
        if (chart) {
          setChart({ ...chart, layer: "natal", overlayByPalace: {} });
          setViewNote("本命盘");
          setHighlightPalaces([]);
        }
        return;
      }
      setLoadingChart(true);
      setError("");
      try {
        const res = await fetch("/api/horoscope", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: birthPayload,
            birthInfo: chart?.birthInfo,
            layer: nextLayer,
            year: y,
            month: m,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "运限计算失败");
        setChart(data.chart);
        setViewNote(data.view?.note || "");
        setHighlightPalaces(data.view?.highlightPalaces || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "运限失败");
      } finally {
        setLoadingChart(false);
      }
    },
    [birthPayload, chart]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-ziwei-50 via-white to-ink-50">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="font-serif text-3xl md:text-4xl text-ink-900 tracking-wide">
            紫微斗数 · AI 排盘
          </h1>
          <p className="mt-2 text-ink-500 text-sm md:text-base">
            本命 / 运限 · 真太阳时 · 断语 RAG · AI 解读
          </p>
                  <p className="mt-2">
            <a href="/hepan" className="text-sm text-ziwei-700 underline">
              去合盘 →
            </a>
          </p>
        </header>

        <div className="grid lg:grid-cols-[340px_1fr] gap-8">
          <aside className="lg:sticky lg:top-8 h-fit">
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
              <h2 className="font-medium text-ink-800 mb-4">出生信息</h2>
              <BirthForm onSubmit={handleSubmit} loading={loadingChart || loadingAI} />
              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
            <p className="mt-3 text-xs text-ink-400 leading-relaxed">
              经典断语不依赖 AI 余额；智能解读需要有效 API Key。样例库已含 2003-06-27 巳时女命。
            </p>
          </aside>

          <section className="space-y-6">
            {chart ? (
              <>
                {chart.trueSolar && (
                  <div className="rounded-xl border border-ziwei-200 bg-ziwei-50 px-4 py-3 text-sm text-ink-700">
                    <div className="font-medium text-ink-800 mb-1">时间说明</div>
                    <p>
                      钟表 {chart.trueSolar.clock}
                      {" → "}
                      {chart.trueSolar.used ? "真太阳时" : "未校正"}{" "}
                      {chart.trueSolar.corrected}
                      {" → "}
                      <span className="font-medium text-ziwei-800">
                        {chart.trueSolar.hourName}时
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-500">{chart.trueSolar.note}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm space-y-4">
                  <h2 className="font-medium text-ink-800">运限切换</h2>
                  <TimeAxisTabs
                    layer={layer}
                    year={year}
                    month={month}
                    summary={viewNote}
                    onLayerChange={(l) => applyLayer(l, year, month)}
                    onYearChange={(y) => {
                      setYear(y);
                      if (layer !== "natal") applyLayer(layer, y, month);
                    }}
                    onMonthChange={(m) => {
                      setMonth(m);
                      if (layer === "monthly") applyLayer("monthly", year, m);
                    }}
                  />
                </div>

                <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
                  <h2 className="font-medium text-ink-800 mb-4">
                    命盘{layer !== "natal" ? ` · ${viewNote}` : ""}
                  </h2>
                  {loadingChart ? (
                    <p className="text-ink-500 text-sm">计算运限中…</p>
                  ) : (
                    <ChartBoard chart={chart} highlightPalaces={highlightPalaces} />
                  )}
                </div>

                <Interpretation
                  text={interpretation}
                  loading={loadingAI}
                  mode={mode}
                  onModeChange={handleModeChange}
                  ragKey={ragKey}
                  ragHit={ragHit}
                />
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-12 text-center text-ink-400">
                {loadingChart ? (
                  <p>正在排盘…</p>
                ) : (
                  <p>填写出生信息后，将在此显示十二宫命盘与解读</p>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="mt-16 text-center text-xs text-ink-400">
          <p>
            排盘引擎 iztro · 断语可接入{" "}
            <a
              href="https://github.com/Renhuai123/ziwei-doushu"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-ink-600"
            >
              Renhuai123/ziwei-doushu
            </a>{" "}
            v4.0
          </p>
          <p className="mt-1">仅供学习研究，不构成任何人生决策建议</p>
        </footer>
      </div>
    </main>
  );
}
