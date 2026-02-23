import { api } from './api';

export interface WeatherDay {
  date: string;
  dayName: string;
  dayNum: number;
  month: string;
  icon: string;
  maxTemp: number;
  minTemp: number;
  precipMm: number;
  precipHours: number | null;
  humidityMax: number | null;
  humidityMin: number | null;
  humidityAvg: number | null;
  humidityStatus: { level: string; label: string; color: string } | null;
  tempRisk: { level: string; label: string; color: string; detail: string };
  rainStatus: { level: string; label: string; color: string };
  rainRisk: string;
  windspeed: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherHourly {
  date: string;
  time: string;
  temp: number;
  precip: number;
  humidity: number;
  wind: number;
  wcode: number;
  tempRisk: { level: string; label: string; color: string; detail: string };
  humidityStatus: { level: string; label: string; color: string };
}

export interface CurrentWeather {
  temp: number;
  humidity: number;
  wcode: number;
  wind: number;
  precip: number;
  tempRisk: { level: string; label: string; color: string; detail: string };
  humidityStatus: { level: string; label: string; color: string };
}

export interface ForagePlant {
  name: string;
  scientific: string;
  resourceType: string;
  bloomStart: number;
  bloomEnd: number;
  availability: string;
  note: string;
  zone: string;
}

export interface PlanningAnalysis {
  location: { lat: number; lng: number; district: string };
  saturation: { count: number; totalInSystem: number; level: string; message: string; radiusKm: number };
  suitability: { score: number; label: string; color: string };
  weather: { current: CurrentWeather | null; days: WeatherDay[]; hourly: WeatherHourly[]; source: string };
  forage: { current: ForagePlant[]; upcoming: ForagePlant[]; month: number };
}

export interface District {
  name: string;
  lat: number;
  lng: number;
}

export interface ApiaryWeather {
  location: { lat: number; lng: number; district: string };
  current: { temp: number; humidity: number; wcode: number; wind: number; precip: number; description: string };
  forecast: Array<{
    date: string; dayName: string; dayNum: number; month: string;
    maxTemp: number; minTemp: number; precipMm: number; wcode: number;
    description: string; windspeed: number | null;
    humidityMax: number | null; humidityMin: number | null;
    sunrise: string | null; sunset: string | null;
  }>;
  source: string;
}

export const planningService = {
  async analyze(lat: number, lng: number, district?: string) {
    const res = await api.post<{ success: boolean; data: PlanningAnalysis }>('/planning/analyze', { lat, lng, district });
    return res.data;
  },
  async getDistricts() {
    const res = await api.get<{ success: boolean; data: { districts: District[] } }>('/planning/districts');
    return res.data.districts;
  },
  async getApiaryWeather(apiaryId: number) {
    const res = await api.get<{ success: boolean; data: ApiaryWeather }>(`/apiaries/${apiaryId}/weather`);
    return res.data;
  },
};
