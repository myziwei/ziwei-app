"use client";

import type { ChartSummary, HepanRelation } from "@/lib/types";
import ChartBoard from "./ChartBoard";

export default function HepanBoard({
  personA,
  personB,
  relations,
}: {
  personA: ChartSummary;
  personB: ChartSummary;
  relations: HepanRelation[];
}) {
  const nameA = personA.birthInfo.name || "甲方";
  const nameB = personB.birthInfo.name || "乙方";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-200 bg-white p-4">
        <h3 className="font-medium text-ink-800 mb-3">关系要点</h3>
        <ul className="space-y-2 text-sm text-ink-700">
          {relations.map((r) => (
            <li key={r.label} className="border-b border-ink-100 pb-2">
              <span className="font-medium text-ziwei-800">{r.label}：</span>
              {r.detail}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 overflow-auto">
          <h3 className="font-medium text-ink-800 mb-3">{nameA} 命盘</h3>
          <ChartBoard chart={personA} />
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 overflow-auto">
          <h3 className="font-medium text-ink-800 mb-3">{nameB} 命盘</h3>
          <ChartBoard chart={personB} />
        </div>
      </div>
    </div>
  );
}
