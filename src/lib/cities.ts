/**
 * 城市与经度（阶段 1 完善数据与搜索）
 */
import citiesData from "@/data/cities.json";

export interface CityItem {
  name: string;
  province: string;
  longitude: number;
  latitude?: number;
}

const cities = citiesData as CityItem[];

export function listCities(): CityItem[] {
  return cities;
}

export function findCities(keyword: string, limit = 20): CityItem[] {
  const k = keyword.trim();
  if (!k) return cities.slice(0, limit);
  return cities
    .filter(
      (c) =>
        c.name.includes(k) ||
        c.province.includes(k) ||
        `${c.province}${c.name}`.includes(k)
    )
    .slice(0, limit);
}

export function getCityLongitude(name: string): number | undefined {
  const c = cities.find((x) => x.name === name || `${x.province}${x.name}` === name);
  return c?.longitude;
}
