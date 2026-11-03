"use client";

import type { ChartSummary, PalaceInfo, OverlayStar } from "@/lib/types";
import clsx from "clsx";

const PALACE_LAYOUT = [
  ["父母", "福德", "田宅", "官禄"],
  ["交友", null, null, "迁移"],
  ["疾厄", null, null, "财帛"],
  ["子女", "夫妻", "兄弟", "命宫"],
];

function PalaceCell({
  p,
  overlays,
  highlight,
}: {
  p: PalaceInfo | undefined;
  overlays?: OverlayStar[];
  highlight?: boolean;
}) {
  if (!p) return <div className="bg-ink-50 rounded-lg border border-dashed border-ink-200" />;

  return (
    <div
      className={clsx(
        "rounded-lg border p-2 min-h-[110px] flex flex-col text-xs",
        highlight
          ? "bg-amber-50 border-amber-500 ring-1 ring-amber-400"
          : p.isMingGong
          ? "bg-ziwei-50 border-ziwei-400 shadow-sm"
          : p.isShenGong
          ? "bg-amber-50 border-amber-300"
          : "bg-white border-ink-200"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-semibold text-ink-800">
          {p.name}
          {p.isMingGong && <span className="ml-1 text-ziwei-600 text-[10px]">命</span>}
          {p.isShenGong && <span className="ml-1 text-amber-600 text-[10px]">身</span>}
          {highlight && <span className="ml-1 text-amber-700 text-[10px]">限</span>}
        </span>
        <span className="text-ink-500">
          {p.stem}
          {p.branch}
        </span>
      </div>
      <div className="flex-1 space-y-0.5">
        {p.majorStars.length > 0 ? (
          p.majorStars.map((s) => (
            <div key={s} className="font-medium text-ink-900">
              {s}
              {p.brightness[s] && (
                <span className="text-[10px] text-ink-400 ml-0.5">({p.brightness[s]})</span>
              )}
            </div>
          ))
        ) : (
          <div className="text-ink-300">空</div>
        )}
        {p.minorStars.slice(0, 4).map((s) => (
          <div key={s} className="text-ink-500">
            {s}
          </div>
        ))}
        {p.sihua.length > 0 && (
          <div className="text-ziwei-600 font-medium mt-0.5">化{p.sihua.join("")}</div>
        )}
        {overlays && overlays.length > 0 && (
          <div className="mt-1 pt-1 border-t border-dashed border-ink-200 space-y-0.5">
            {overlays.slice(0, 6).map((o, i) => (
              <div
                key={`${o.kind}-${o.name}-${i}`}
                className={clsx(
                  "text-[10px]",
                  o.kind === "yearly"
                    ? "text-blue-600"
                    : o.kind === "monthly"
                    ? "text-emerald-600"
                    : "text-amber-700"
                )}
              >
                [{o.kind === "yearly" ? "年" : o.kind === "monthly" ? "月" : "限"}]{o.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChartBoard({
  chart,
  highlightPalaces = [],
}: {
  chart: ChartSummary;
  highlightPalaces?: string[];
}) {
  const byName = Object.fromEntries(chart.palaces.map((p) => [p.name, p]));
  const overlay = chart.overlayByPalace || {};

  const resolve = (name: string) => {
    return (
      byName[name] ||
      byName[name + "宫"] ||
      chart.palaces.find((p) => p.name.includes(name.replace("宫", "")))
    );
  };

  const resolveOverlay = (name: string) => {
    return (
      overlay[name] ||
      overlay[name + "宫"] ||
      overlay[name.replace("宫", "")] ||
      []
    );
  };

  const isHighlight = (name: string) => {
    const n = name.replace("宫", "");
    return highlightPalaces.some((h) => h.replace("宫", "") === n || h.includes(n));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm text-ink-600">
        <span>农历：{chart.lunarDate}</span>
        <span>五行局：{chart.fiveElementsBureau}</span>
        <span>命主：{chart.soul}</span>
        <span>身主：{chart.body}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PALACE_LAYOUT.flat().map((name, i) =>
          name === null ? (
            <div
              key={`empty-${i}`}
              className="rounded-lg bg-gradient-to-br from-ziwei-50 to-ink-50 border border-ink-100 flex items-center justify-center text-ink-400 text-sm"
            >
              {i === 5 || i === 6 || i === 9 || i === 10 ? (
                <div className="text-center leading-tight">
                  <div className="font-serif text-ziwei-700 text-lg">紫微</div>
                  <div className="text-xs">斗数</div>
                </div>
              ) : null}
            </div>
          ) : (
            <PalaceCell
              key={name}
              p={resolve(name)}
              overlays={resolveOverlay(name)}
              highlight={isHighlight(name)}
            />
          )
        )}
      </div>

      {chart.decadal?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-ink-700 mb-2">大限一览</h3>
          <div className="flex flex-wrap gap-2">
            {chart.decadal.map((d) => (
              <span
                key={d.palace + d.startAge}
                className={clsx(
                  "text-xs px-2 py-1 rounded-full",
                  isHighlight(d.palace)
                    ? "bg-amber-200 text-amber-900"
                    : "bg-ink-100 text-ink-700"
                )}
              >
                {d.palace} {d.startAge}–{d.endAge}岁
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-ink-400">
        叠星颜色：<span className="text-amber-700">限=大限</span>　
        <span className="text-blue-600">年=流年</span>　
        <span className="text-emerald-600">月=流月</span>
      </p>
    </div>
  );
}
