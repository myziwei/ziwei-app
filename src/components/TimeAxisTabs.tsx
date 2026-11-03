"use client";

export type Layer = "natal" | "decadal" | "yearly" | "monthly";

interface Props {
  layer: Layer;
  year: number;
  month: number;
  onLayerChange: (layer: Layer) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  summary?: string;
}

const TABS: { id: Layer; label: string }[] = [
  { id: "natal", label: "本命" },
  { id: "decadal", label: "大限" },
  { id: "yearly", label: "流年" },
  { id: "monthly", label: "流月" },
];

export default function TimeAxisTabs({
  layer,
  year,
  month,
  onLayerChange,
  onYearChange,
  onMonthChange,
  summary,
}: Props) {
  const thisYear = new Date().getFullYear();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onLayerChange(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              layer === t.id
                ? "bg-ziwei-600 text-white border-ziwei-600"
                : "bg-white text-ink-700 border-ink-200 hover:border-ziwei-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(layer === "yearly" || layer === "monthly" || layer === "decadal") && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="text-ink-600">
            年份
            <input
              type="number"
              min={1950}
              max={2100}
              value={year}
              onChange={(e) => onYearChange(+e.target.value)}
              className="ml-2 w-24 rounded-lg border border-ink-200 px-2 py-1"
            />
          </label>
          {layer === "monthly" && (
            <label className="text-ink-600">
              月份
              <select
                value={month}
                onChange={(e) => onMonthChange(+e.target.value)}
                className="ml-2 rounded-lg border border-ink-200 px-2 py-1"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="text-xs text-ziwei-700 underline"
            onClick={() => {
              onYearChange(thisYear);
              onMonthChange(new Date().getMonth() + 1);
            }}
          >
            回到今年
          </button>
        </div>
      )}

      {summary && (
        <p className="text-sm text-ink-600 bg-ink-50 rounded-lg px-3 py-2">{summary}</p>
      )}
    </div>
  );
}
