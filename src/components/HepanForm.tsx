"use client";

import { useState } from "react";
import type { BirthInput } from "@/lib/types";
import { HOUR_NAMES, HOUR_RANGES } from "@/lib/constants";

function PersonFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: BirthInput;
  onChange: (v: BirthInput) => void;
}) {
  const set = (patch: Partial<BirthInput>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 p-4 bg-ink-50/50">
      <h3 className="font-medium text-ink-800">{title}</h3>
      <input
        type="text"
        placeholder="姓名（可选）"
        value={value.name || ""}
        onChange={(e) => set({ name: e.target.value })}
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          placeholder="年"
          value={value.year}
          onChange={(e) => set({ year: +e.target.value })}
          className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="月"
          value={value.month}
          onChange={(e) => set({ month: +e.target.value })}
          className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="日"
          value={value.day}
          onChange={(e) => set({ day: +e.target.value })}
          className="rounded-lg border border-ink-200 px-2 py-2 text-sm"
        />
      </div>
      <select
        value={value.hourIndex ?? 5}
        onChange={(e) => set({ hourIndex: +e.target.value, useTrueSolarTime: false })}
        className="w-full rounded-lg border border-ink-200 px-2 py-2 text-sm"
      >
        {HOUR_NAMES.map((n, i) => (
          <option key={i} value={i}>
            {n}时（{HOUR_RANGES[i]}）
          </option>
        ))}
      </select>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={value.gender === "male"}
            onChange={() => set({ gender: "male" })}
          />
          男
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={value.gender === "female"}
            onChange={() => set({ gender: "female" })}
          />
          女
        </label>
      </div>
    </div>
  );
}

const defaultPerson = (name: string, gender: "male" | "female"): BirthInput => ({
  year: 1995,
  month: 6,
  day: 15,
  hourIndex: 5,
  gender,
  name,
  useTrueSolarTime: false,
});

export default function HepanForm({
  onSubmit,
  loading,
}: {
  onSubmit: (a: BirthInput, b: BirthInput) => void;
  loading?: boolean;
}) {
  const [a, setA] = useState<BirthInput>(defaultPerson("甲方", "male"));
  const [b, setB] = useState<BirthInput>(defaultPerson("乙方", "female"));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(a, b);
      }}
    >
      <div className="grid md:grid-cols-2 gap-4">
        <PersonFields title="甲方" value={a} onChange={setA} />
        <PersonFields title="乙方" value={b} onChange={setB} />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ziwei-600 hover:bg-ziwei-700 disabled:opacity-60 text-white font-medium py-3"
      >
        {loading ? "合盘计算中…" : "开始合盘"}
      </button>
    </form>
  );
}
