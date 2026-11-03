"use client";

import { useMemo, useState } from "react";
import type { BirthInput } from "@/lib/types";
import { HOUR_NAMES, HOUR_RANGES } from "@/lib/constants";
import citiesData from "@/data/cities.json";

interface CityItem {
  name: string;
  province: string;
  longitude: number;
  latitude?: number;
}

const CITIES = citiesData as CityItem[];

interface Props {
  onSubmit: (info: BirthInput) => void;
  loading?: boolean;
}

export default function BirthForm({ onSubmit, loading }: Props) {
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(6);
  const [day, setDay] = useState(15);
  const [gender, setGender] = useState<"male" | "female">("female");
  const [name, setName] = useState("");

  /** branch = 直接选时辰；clock = 填钟点 */
  const [timeMode, setTimeMode] = useState<"branch" | "clock">("clock");
  const [hourIndex, setHourIndex] = useState(7);
  const [clockHour, setClockHour] = useState(14);
  const [clockMinute, setClockMinute] = useState(0);

  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(true);
  const [showCityList, setShowCityList] = useState(false);

  const filteredCities = useMemo(() => {
    const k = cityQuery.trim();
    if (!k) return CITIES.slice(0, 12);
    return CITIES.filter(
      (c) =>
        c.name.includes(k) ||
        c.province.includes(k) ||
        `${c.province}${c.name}`.includes(k)
    ).slice(0, 12);
  }, [cityQuery]);

  const pickCity = (c: CityItem) => {
    setCity(c.name);
    setCityQuery(`${c.province} ${c.name}`);
    setLongitude(c.longitude);
    setShowCityList(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base: BirthInput = {
      year,
      month,
      day,
      gender,
      name: name || undefined,
      city: city || undefined,
      longitude: longitude === "" ? undefined : Number(longitude),
      useTrueSolarTime,
    };

    if (timeMode === "clock") {
      base.clockHour = clockHour;
      base.clockMinute = clockMinute;
    } else {
      base.hourIndex = hourIndex;
      // 选时辰时默认不做真太阳时
      base.useTrueSolarTime = false;
    }

    onSubmit(base);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-1">姓名（可选）</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：张三"
          className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">年</label>
          <input
            type="number"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(+e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">月</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(+e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">日</label>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(+e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
          />
        </div>
      </div>

      {/* 出生地 */}
      <div className="relative">
        <label className="block text-sm font-medium text-ink-700 mb-1">出生地（城市）</label>
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setShowCityList(true);
          }}
          onFocus={() => setShowCityList(true)}
          placeholder="例如：台中、北京、上海"
          className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
        />
        {showCityList && filteredCities.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-ink-200 bg-white shadow-lg">
            {filteredCities.map((c) => (
              <li key={`${c.province}-${c.name}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-ziwei-50"
                  onClick={() => pickCity(c)}
                >
                  {c.province} · {c.name}
                  <span className="ml-2 text-ink-400">东经 {c.longitude}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-ink-500 whitespace-nowrap">经度</label>
          <input
            type="number"
            step="0.01"
            value={longitude}
            onChange={(e) =>
              setLongitude(e.target.value === "" ? "" : +e.target.value)
            }
            placeholder="东经，如 120.67"
            className="w-full rounded-lg border border-ink-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ziwei-400"
          />
        </div>
      </div>

      {/* 时间模式 */}
      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">时间输入</label>
        <div className="flex gap-3 mb-3">
          <button
            type="button"
            onClick={() => setTimeMode("clock")}
            className={`flex-1 rounded-lg py-2 text-sm border ${
              timeMode === "clock"
                ? "border-ziwei-600 bg-ziwei-50 text-ziwei-800"
                : "border-ink-200 text-ink-600"
            }`}
          >
            钟点（推荐）
          </button>
          <button
            type="button"
            onClick={() => setTimeMode("branch")}
            className={`flex-1 rounded-lg py-2 text-sm border ${
              timeMode === "branch"
                ? "border-ziwei-600 bg-ziwei-50 text-ziwei-800"
                : "border-ink-200 text-ink-600"
            }`}
          >
            时辰地支
          </button>
        </div>

        {timeMode === "clock" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ink-500 mb-1">时 (0–23)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={clockHour}
                  onChange={(e) => setClockHour(+e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-500 mb-1">分 (0–59)</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={clockMinute}
                  onChange={(e) => setClockMinute(+e.target.value)}
                  className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useTrueSolarTime}
                onChange={(e) => setUseTrueSolarTime(e.target.checked)}
                className="rounded border-ink-300 text-ziwei-600 focus:ring-ziwei-400"
              />
              使用真太阳时（按出生地经度校正）
            </label>
          </div>
        ) : (
          <select
            value={hourIndex}
            onChange={(e) => setHourIndex(+e.target.value)}
            className="w-full rounded-lg border border-ink-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ziwei-400"
          >
            {HOUR_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}时（{HOUR_RANGES[i]}）
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700 mb-2">性别</label>
        <div className="flex gap-4">
          {[
            { v: "male" as const, label: "男" },
            { v: "female" as const, label: "女" },
          ].map((g) => (
            <label key={g.v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={gender === g.v}
                onChange={() => setGender(g.v)}
                className="text-ziwei-600 focus:ring-ziwei-400"
              />
              <span>{g.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-ziwei-600 hover:bg-ziwei-700 disabled:opacity-60 text-white font-medium py-3 transition"
      >
        {loading ? "排盘中…" : "开始排盘 + AI 解读"}
      </button>
    </form>
  );
}
