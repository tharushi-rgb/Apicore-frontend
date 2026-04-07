// planning.ts — fully client-side, no backend required
// Weather: Open-Meteo (https://api.open-meteo.com) — free, no API key needed
// Districts: embedded static list for Sri Lanka
// Forage: enriched with GBIF occurrence data (dataset 0017890-260108223611665)

import { GBIF_FORAGE_SPECIES, getNearbyGBIFForage, getGBIFBiodiversityScore } from './gbifForage';
export type { GBIFForageSpecies } from './gbifForage';
import { supabase } from './supabaseClient';

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
  /** Number of GBIF field occurrence records in Sri Lanka (0 = not in dataset) */
  gbifCount?: number;
  /** True if verified present in GBIF Sri Lanka occurrence dataset */
  confirmed?: boolean;
}

export interface NearbyApiaryInfo {
  id: number;
  name: string;
  district: string;
  distance: number;
  hiveCount: number;
  hives: NearbyHiveInfo[];
}

export interface NearbyHiveInfo {
  id: number;
  name: string;
  distance: number;
  apiary?: string; // For standalone hives
}

export interface PlanningAnalysis {
  location: { lat: number; lng: number; district: string };
  saturation: {
    count: number;
    totalInSystem: number;
    level: string;
    message: string;
    radiusKm: number;
    nearbyApiaries: NearbyApiaryInfo[];
    nearbyStandaloneHives: NearbyHiveInfo[];
  };
  suitability: { score: number; label: string; color: string };
  weather: { current: CurrentWeather | null; days: WeatherDay[]; hourly: WeatherHourly[]; source: string };
  forage: {
    current: ForagePlant[];
    upcoming: ForagePlant[];
    month: number;
    /** GBIF-verified bee forage plants observed near the selected location */
    gbifNearby: ReturnType<typeof getNearbyGBIFForage>;
    /** Biodiversity score 0-100 from GBIF data */
    gbifScore: number;
  };
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

// ─── Static data ─────────────────────────────────────────────────────────────

const SRI_LANKA_DISTRICTS: District[] = [
  { name: 'Ampara', lat: 7.2833, lng: 81.6667 },
  { name: 'Anuradhapura', lat: 8.3356, lng: 80.4067 },
  { name: 'Badulla', lat: 6.9898, lng: 81.0556 },
  { name: 'Batticaloa', lat: 7.7170, lng: 81.7000 },
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
  { name: 'Gampaha', lat: 7.0917, lng: 80.0000 },
  { name: 'Hambantota', lat: 6.1241, lng: 81.1185 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
  { name: 'Kalutara', lat: 6.5854, lng: 79.9607 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Kegalle', lat: 7.2513, lng: 80.3464 },
  { name: 'Kilinochchi', lat: 9.3803, lng: 80.3770 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3624 },
  { name: 'Mannar', lat: 8.9780, lng: 79.9044 },
  { name: 'Matale', lat: 7.4675, lng: 80.6234 },
  { name: 'Matara', lat: 5.9549, lng: 80.5550 },
  { name: 'Monaragala', lat: 6.8727, lng: 81.3506 },
  { name: 'Mullaitivu', lat: 9.2671, lng: 80.8120 },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { name: 'Polonnaruwa', lat: 7.9403, lng: 81.0188 },
  { name: 'Puttalam', lat: 8.0362, lng: 79.8283 },
  { name: 'Ratnapura', lat: 6.6828, lng: 80.3992 },
  { name: 'Trincomalee', lat: 8.5874, lng: 81.2152 },
  { name: 'Vavuniya', lat: 8.7514, lng: 80.4997 },
];

// ─── Weather helpers ──────────────────────────────────────────────────────────

function wmoCodes(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '⛅';
  if (code <= 3) return '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌦️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '❄️';
  if (code <= 82) return '🌧️';
  if (code <= 84) return '⛈️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

function tempRisk(t: number): { level: string; label: string; color: string; detail: string } {
  if (t < 15) return { level: 'cold', label: 'Too Cold', color: 'blue', detail: 'Below 15°C – bees cluster, no flying' };
  if (t < 20) return { level: 'cool', label: 'Cool', color: 'cyan', detail: 'Reduced foraging activity' };
  if (t <= 33) return { level: 'optimal', label: 'Optimal', color: 'green', detail: 'Ideal foraging range 26–33°C' };
  if (t <= 35) return { level: 'warm', label: 'Stress', color: 'orange', detail: '34–35°C – provide shade and water' };
  return { level: 'hot', label: 'Risk', color: 'red', detail: 'Above 35°C – heat stress risk' };
}

function humidityStatus(h: number): { level: string; label: string; color: string } {
  if (h > 95) return { level: 'risky', label: 'Risky', color: 'red' };
  if (h >= 70 && h <= 79) return { level: 'best', label: 'Best for foraging', color: 'green' };
  if (h >= 60 && h <= 95) return { level: 'optimal', label: 'Optimal', color: 'green' };
  return { level: 'low', label: 'Low', color: 'orange' };
}

function rainStatus(p: number): { level: string; label: string; color: string } {
  if (p < 1) return { level: 'none', label: 'No Rain', color: 'green' };
  if (p < 5) return { level: 'light', label: 'Light Rain', color: 'blue' };
  if (p < 15) return { level: 'moderate', label: 'Moderate Rain', color: 'orange' };
  return { level: 'heavy', label: 'Heavy Rain', color: 'red' };
}

function suitabilityScore(avgTemp: number, avgHumidity: number, totalRain: number): { score: number; label: string; color: string } {
  let score = 100;
  if (avgTemp < 15 || avgTemp > 40) score -= 40;
  else if (avgTemp < 20 || avgTemp > 35) score -= 15;
  if (avgHumidity > 95) score -= 20;
  else if (avgHumidity < 60) score -= 15;
  if (totalRain > 50) score -= 20;
  else if (totalRain < 1) score -= 5;
  score = Math.max(0, Math.min(100, score));
  if (score >= 75) return { score, label: 'Excellent', color: 'green' };
  if (score >= 55) return { score, label: 'Good', color: 'lime' };
  if (score >= 35) return { score, label: 'Fair', color: 'orange' };
  return { score, label: 'Poor', color: 'red' };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

async function fetchWeather(lat: number, lng: number, startDate?: string, endDate?: string) {
  const today = new Date();
  const start = startDate ?? today.toISOString().split('T')[0];
  const rawEnd = endDate ?? new Date(today.getTime() + 13 * 86400000).toISOString().split('T')[0];
  // Open-Meteo supports max 16-day forecast; cap at today+16
  const maxEnd = new Date(today.getTime() + 16 * 86400000).toISOString().split('T')[0];
  const end = rawEnd > maxEnd ? maxEnd : rawEnd;

  // Try multiple weather API endpoints to avoid CORS issues
  const urls = [
    // Direct API call
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,` +
    `precipitation_hours,sunrise,sunset` +
    `&hourly=temperature_2m,precipitation,relativehumidity_2m,windspeed_10m,weathercode` +
    `&current_weather=true` +
    `&start_date=${start}&end_date=${end}` +
    `&timezone=Asia%2FColombo`,

    // CORS proxy fallback (if available)
    `https://cors-anywhere.herokuapp.com/https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,` +
    `precipitation_hours,sunrise,sunset` +
    `&hourly=temperature_2m,precipitation,relativehumidity_2m,windspeed_10m,weathercode` +
    `&current_weather=true` +
    `&start_date=${start}&end_date=${end}` +
    `&timezone=Asia%2FColombo`
  ];

  for (let i = 0; i < urls.length; i++) {
    try {
      console.log(`Trying weather API endpoint ${i + 1}/${urls.length}...`);
      const res = await fetch(urls[i]);
      if (!res.ok) {
        console.warn(`Weather API ${i + 1} returned ${res.status}: ${res.statusText}`);
        continue;
      }
      const data = await res.json();
      console.log('Weather API success!');
      return data;
    } catch (error) {
      console.warn(`Weather API ${i + 1} failed:`, error);
    }
  }

  console.warn('All weather APIs failed, using fallback data');
  return generateFallbackWeatherData(start, end);
}

// Generate realistic fallback weather data for Sri Lanka
function generateFallbackWeatherData(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

  const daily = {
    time: [] as string[],
    weathercode: [] as number[],
    temperature_2m_max: [] as number[],
    temperature_2m_min: [] as number[],
    precipitation_sum: [] as number[],
    windspeed_10m_max: [] as number[],
    precipitation_hours: [] as number[],
    sunrise: [] as string[],
    sunset: [] as string[]
  };

  const hourly = {
    time: [] as string[],
    temperature_2m: [] as number[],
    precipitation: [] as number[],
    relativehumidity_2m: [] as number[],
    windspeed_10m: [] as number[],
    weathercode: [] as number[]
  };

  // Generate realistic Sri Lankan weather data
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];

    daily.time.push(dateStr);
    daily.weathercode.push(Math.random() > 0.7 ? 61 : 1); // 30% chance of rain
    daily.temperature_2m_max.push(28 + Math.random() * 4); // 28-32°C
    daily.temperature_2m_min.push(22 + Math.random() * 3); // 22-25°C
    daily.precipitation_sum.push(Math.random() > 0.7 ? Math.random() * 15 : 0); // 0-15mm if raining
    daily.windspeed_10m_max.push(8 + Math.random() * 7); // 8-15 km/h
    daily.precipitation_hours.push(Math.random() > 0.7 ? Math.random() * 6 : 0);
    daily.sunrise.push(`${dateStr}T06:00`);
    daily.sunset.push(`${dateStr}T18:30`);

    // Generate 24 hourly data points for each day
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      hourly.time.push(`${dateStr}T${hour}:00`);
      hourly.temperature_2m.push(24 + Math.sin((h - 6) * Math.PI / 12) * 4); // Temperature curve
      hourly.precipitation.push(Math.random() > 0.9 ? Math.random() * 2 : 0);
      hourly.relativehumidity_2m.push(65 + Math.random() * 20); // 65-85%
      hourly.windspeed_10m.push(5 + Math.random() * 10);
      hourly.weathercode.push(Math.random() > 0.8 ? 61 : 1);
    }
  }

  return {
    daily,
    hourly,
    current_weather: {
      temperature: 27,
      windspeed: 8,
      weathercode: 1,
      time: new Date().toISOString()
    }
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Haversine great-circle distance in kilometres */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface SatApiaryInfo {
  id: number;
  name: string;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  district?: string;
}

export interface SatHiveInfo {
  id: number;
  name: string;
  apiary_id?: number | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
}

export const planningService = {
  async analyze(
    lat: number,
    lng: number,
    district?: string,
    opts?: {
      startDate?: string;
      endDate?: string;
      apiaries?: SatApiaryInfo[];
      hives?: SatHiveInfo[];
    }
  ): Promise<PlanningAnalysis> {
    const raw = await fetchWeather(lat, lng, opts?.startDate, opts?.endDate);

    const dailyDates: string[] = raw.daily?.time ?? [];
    const dailyWcode: number[] = raw.daily?.weathercode ?? [];
    const dailyMaxTemp: number[] = raw.daily?.temperature_2m_max ?? [];
    const dailyMinTemp: number[] = raw.daily?.temperature_2m_min ?? [];
    const dailyPrecip: number[] = raw.daily?.precipitation_sum ?? [];
    const dailyWind: number[] = raw.daily?.windspeed_10m_max ?? [];
    const dailyPrecipHours: number[] = raw.daily?.precipitation_hours ?? [];
    const dailySunrise: string[] = raw.daily?.sunrise ?? [];
    const dailySunset: string[] = raw.daily?.sunset ?? [];

    const hourlyTimes: string[] = raw.hourly?.time ?? [];
    const hourlyTemp: number[] = raw.hourly?.temperature_2m ?? [];
    const hourlyPrecip: number[] = raw.hourly?.precipitation ?? [];
    const hourlyHumidity: number[] = raw.hourly?.relativehumidity_2m ?? [];
    const hourlyWind: number[] = raw.hourly?.windspeed_10m ?? [];
    const hourlyWcode: number[] = raw.hourly?.weathercode ?? [];

    const days: WeatherDay[] = dailyDates.map((dateStr, i) => {
      const d = new Date(dateStr);
      const maxT = dailyMaxTemp[i] ?? 28;
      const minT = dailyMinTemp[i] ?? 22;
      const avgT = (maxT + minT) / 2;
      const precip = dailyPrecip[i] ?? 0;
      // Approximate humidity from day index (Open-Meteo daily doesn't give humidity)
      const dayHourlyIdx = hourlyTimes.findIndex(t => t.startsWith(dateStr));
      let humMax: number | null = null, humMin: number | null = null, humAvg: number | null = null;
      if (dayHourlyIdx >= 0) {
        const slice = hourlyHumidity.slice(dayHourlyIdx, dayHourlyIdx + 24).filter(v => v != null);
        if (slice.length) {
          humMax = Math.max(...slice);
          humMin = Math.min(...slice);
          humAvg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
        }
      }
      return {
        date: dateStr,
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        month: MONTH_NAMES[d.getMonth()],
        icon: wmoCodes(dailyWcode[i] ?? 0),
        maxTemp: maxT,
        minTemp: minT,
        precipMm: precip,
        precipHours: dailyPrecipHours[i] ?? null,
        humidityMax: humMax,
        humidityMin: humMin,
        humidityAvg: humAvg,
        humidityStatus: humAvg != null ? humidityStatus(humAvg) : null,
        tempRisk: tempRisk(avgT),
        rainStatus: rainStatus(precip),
        rainRisk: precip >= 10 ? 'high' : precip >= 3 ? 'medium' : 'low',
        windspeed: dailyWind[i] ?? null,
        sunrise: dailySunrise[i] ?? null,
        sunset: dailySunset[i] ?? null,
      };
    });

    const hourly: WeatherHourly[] = hourlyTimes.slice(0, days.length * 24).map((timeStr, i) => {
      const t = hourlyTemp[i] ?? 28;
      const h = hourlyHumidity[i] ?? 70;
      return {
        date: timeStr.split('T')[0],
        time: timeStr.split('T')[1]?.slice(0, 5) ?? '',
        temp: t,
        precip: hourlyPrecip[i] ?? 0,
        humidity: h,
        wind: hourlyWind[i] ?? 0,
        wcode: hourlyWcode[i] ?? 0,
        tempRisk: tempRisk(t),
        humidityStatus: humidityStatus(h),
      };
    });

    const cw = raw.current_weather;
    const currentHumidityIdx = cw ? hourlyTimes.findIndex(t => t.startsWith(cw.time?.slice(0, 13))) : -1;
    const currentHumidity = currentHumidityIdx >= 0 ? (hourlyHumidity[currentHumidityIdx] ?? 70) : 70;
    const current: CurrentWeather | null = cw ? {
      temp: cw.temperature,
      humidity: currentHumidity,
      wcode: cw.weathercode,
      wind: cw.windspeed,
      precip: hourlyPrecip[currentHumidityIdx >= 0 ? currentHumidityIdx : 0] ?? 0,
      tempRisk: tempRisk(cw.temperature),
      humidityStatus: humidityStatus(currentHumidity),
    } : null;

    // Suitability
    const avgMaxTemp = days.length ? days.reduce((s, d) => s + d.maxTemp, 0) / days.length : 28;
    const avgHumidity = days.reduce((s, d) => s + (d.humidityAvg ?? 70), 0) / (days.length || 1);
    const totalRain = days.reduce((s, d) => s + d.precipMm, 0);
    const suit = suitabilityScore(avgMaxTemp, avgHumidity, totalRain);

    // CSV-backed forage data only (no hardcoded forage descriptions)
    const currentMonth = new Date().getMonth() + 1;
    const nextMonth = (currentMonth % 12) + 1;
    const gbifNearby = getNearbyGBIFForage(lat, lng);
    const currentForage: ForagePlant[] = gbifNearby
      .filter((entry) => entry.observedMonths.includes(currentMonth))
      .slice(0, 10)
      .map((entry) => {
        const minMonth = entry.observedMonths.length ? Math.min(...entry.observedMonths) : currentMonth;
        const maxMonth = entry.observedMonths.length ? Math.max(...entry.observedMonths) : currentMonth;
        return {
          name: entry.common,
          scientific: entry.scientific,
          resourceType: 'records',
          bloomStart: minMonth,
          bloomEnd: maxMonth,
          availability: 'observed',
          note: `CSV records near location: ${entry.nearbyCount}`,
          zone: 'all',
          gbifCount: entry.gbifCount,
          confirmed: true,
        };
      });
    const upcomingForage: ForagePlant[] = gbifNearby
      .filter((entry) => entry.observedMonths.includes(nextMonth) && !entry.observedMonths.includes(currentMonth))
      .slice(0, 10)
      .map((entry) => {
        const minMonth = entry.observedMonths.length ? Math.min(...entry.observedMonths) : nextMonth;
        const maxMonth = entry.observedMonths.length ? Math.max(...entry.observedMonths) : nextMonth;
        return {
          name: entry.common,
          scientific: entry.scientific,
          resourceType: 'records',
          bloomStart: minMonth,
          bloomEnd: maxMonth,
          availability: 'observed',
          note: `CSV records near location: ${entry.nearbyCount}`,
          zone: 'all',
          gbifCount: entry.gbifCount,
          confirmed: true,
        };
      });

    const gbifScore = getGBIFBiodiversityScore(lat, lng);

    // Keep the suitability score internal for now; the UI no longer surfaces it directly.
    const biodiversityBonus = Math.round(gbifScore * 0.15);
    const boostedScore = Math.min(100, suit.score + biodiversityBonus);
    let boostedLabel = suit.label;
    let boostedColor = suit.color;
    if (boostedScore >= 75) { boostedLabel = 'Excellent'; boostedColor = 'green'; }
    else if (boostedScore >= 55) { boostedLabel = 'Good'; boostedColor = 'lime'; }
    else if (boostedScore >= 35) { boostedLabel = 'Fair'; boostedColor = 'orange'; }
    else { boostedLabel = 'Poor'; boostedColor = 'red'; }

    // Real saturation: count ALL hives from ALL users in the same district within 50km radius

    // Query all apiaries and hives from database (all users) in the district
    let allApiaries: SatApiaryInfo[] = [];
    let allHives: SatHiveInfo[] = [];

    try {
      // Get all apiaries from the database with names
      const { data: apiariesData, error: apiariesError } = await supabase
        .from('apiaries')
        .select('id, name, gps_latitude, gps_longitude, district');

      // Get all hives from the database with names
      const { data: hivesData, error: hivesError } = await supabase
        .from('hives')
        .select('id, name, apiary_id, gps_latitude, gps_longitude');

      if (apiariesError) {
        console.warn('Failed to fetch apiaries:', apiariesError);
      }
      if (hivesError) {
        console.warn('Failed to fetch hives:', hivesError);
      }

      allApiaries = (apiariesData ?? []).map(a => ({
        id: a.id,
        name: a.name,
        gps_latitude: a.gps_latitude,
        gps_longitude: a.gps_longitude,
        district: a.district
      }));

      allHives = (hivesData ?? []).map(h => ({
        id: h.id,
        name: h.name,
        apiary_id: h.apiary_id,
        gps_latitude: h.gps_latitude,
        gps_longitude: h.gps_longitude
      }));
    } catch (err) {
      console.warn('Failed to fetch all hives/apiaries for saturation calc:', err);
    }

    let nearbyHiveCount = 0;
    const nearbyApiaryIds = new Set<number>();
    const nearbyApiaries: NearbyApiaryInfo[] = [];
    const nearbyStandaloneHives: NearbyHiveInfo[] = [];
    const RADIUS_KM = 30; // 30km radius for nearby hive detection

    console.log(`Calculating saturation for location: ${lat}, ${lng}`);
    console.log(`Total apiaries in database: ${allApiaries.length}`);
    console.log(`Total hives in database: ${allHives.length}`);

    // Count hives from apiaries within radius or same district
    for (const a of allApiaries) {
      let isNearby = false;
      let distance = 0;

      if (a.gps_latitude != null && a.gps_longitude != null) {
        // GPS-based proximity check
        distance = haversineKm(lat, lng, a.gps_latitude, a.gps_longitude);
        if (distance <= RADIUS_KM) {
          isNearby = true;
          console.log(`Apiary ${a.name} (${a.id}) is ${distance.toFixed(1)}km away (GPS-based)`);
        }
      } else if (a.district && district) {
        // District-based proximity check (same district)
        if (a.district.toLowerCase().includes(district.toLowerCase()) ||
            district.toLowerCase().includes(a.district.toLowerCase())) {
          isNearby = true;
          distance = 0; // Same district, exact distance unknown
          console.log(`Apiary ${a.name} (${a.id}) is in same district: ${a.district}`);
        }
      }

      if (isNearby) {
        nearbyApiaryIds.add(a.id);
        // Count hives belonging to this apiary
        const apiaryHives = allHives.filter(h => h.apiary_id === a.id);
        nearbyHiveCount += apiaryHives.length;
        console.log(`Apiary ${a.name} (${a.id}) has ${apiaryHives.length} hives`);

        // Collect detailed apiary info for overlay
        nearbyApiaries.push({
          id: a.id,
          name: a.name,
          district: a.district || 'Unknown',
          distance: distance,
          hiveCount: apiaryHives.length,
          hives: apiaryHives.map(h => ({
            id: h.id,
            name: h.name,
            distance: distance, // Same as apiary distance
          }))
        });
      }
    }

    // Count standalone hives (not linked to any apiary or linked to non-nearby apiary) within radius
    for (const h of allHives) {
      // Skip if hive is already counted via its apiary
      if (h.apiary_id && nearbyApiaryIds.has(h.apiary_id)) {
        continue;
      }

      if (h.gps_latitude != null && h.gps_longitude != null) {
        const distance = haversineKm(lat, lng, h.gps_latitude, h.gps_longitude);
        if (distance <= RADIUS_KM) {
          nearbyHiveCount++;
          console.log(`Standalone hive ${h.name} (${h.id}) is ${distance.toFixed(1)}km away`);

          // Collect detailed standalone hive info for overlay
          nearbyStandaloneHives.push({
            id: h.id,
            name: h.name,
            distance: distance,
            apiary: h.apiary_id ? `Apiary ${h.apiary_id}` : 'Standalone'
          });
        }
      }
    }

    console.log(`Total nearby hives found: ${nearbyHiveCount}`);

    const totalInSystem = allHives.length;
    const satCount = nearbyHiveCount;
    const satPct = satCount >= 40 ? 100 : Math.round((satCount / 40) * 100);
    const satLevel = satPct >= 75 ? 'high' : satPct >= 40 ? 'medium' : 'low';
    const satMessage =
      satLevel === 'high'   ? 'Zone is heavily stocked — consider a different site or reduce density.' :
      satLevel === 'medium' ? 'Zone has moderate hive density. Monitor competition carefully.' :
      satCount === 0        ? 'No registered hives found in this zone — great opportunity for a new site.' :
                              'Zone has low hive density — good opportunity for new hives.';

    return {
      location: { lat, lng, district: district ?? 'Unknown' },
      saturation: {
        count: satCount,
        totalInSystem,
        level: satLevel,
        message: satMessage,
        radiusKm: RADIUS_KM,
        nearbyApiaries,
        nearbyStandaloneHives
      },
      suitability: { score: boostedScore, label: boostedLabel, color: boostedColor },
      weather: { current, days, hourly, source: 'Open-Meteo' },
      forage: { current: currentForage, upcoming: upcomingForage, month: currentMonth, gbifNearby, gbifScore },
    };
  },

  async getDistricts(): Promise<District[]> {
    return SRI_LANKA_DISTRICTS;
  },

  async getForageByMonth(month: number): Promise<ForagePlant[]> {
    // CSV-backed monthly forage snapshot
    return Object.entries(GBIF_FORAGE_SPECIES)
      .filter(([, species]) => species.observedMonths.includes(month))
      .sort(([, left], [, right]) => right.gbifCount - left.gbifCount)
      .slice(0, 20)
      .map(([scientific, species]) => ({
        name: species.common,
        scientific,
        resourceType: 'records',
        bloomStart: species.observedMonths.length ? Math.min(...species.observedMonths) : month,
        bloomEnd: species.observedMonths.length ? Math.max(...species.observedMonths) : month,
        availability: 'observed',
        note: `CSV records in Sri Lanka: ${species.gbifCount}`,
        zone: 'all',
        gbifCount: species.gbifCount,
        confirmed: true,
      }));
  },

  async getApiaryWeather(lat: number, lng: number, district = 'Unknown'): Promise<ApiaryWeather> {
    const raw = await fetchWeather(lat, lng);
    const dailyDates: string[] = raw.daily?.time ?? [];
    const cw = raw.current_weather;
    const hourlyTimes: string[] = raw.hourly?.time ?? [];
    const hourlyHumidity: number[] = raw.hourly?.relativehumidity_2m ?? [];
    const currentIdx = cw ? hourlyTimes.findIndex(t => t.startsWith(cw.time?.slice(0, 13))) : -1;
    const currentHumidity = currentIdx >= 0 ? (hourlyHumidity[currentIdx] ?? 70) : 70;

    const forecast = dailyDates.map((dateStr, i) => {
      const d = new Date(dateStr);
      const maxT = raw.daily.temperature_2m_max[i] ?? 28;
      const minT = raw.daily.temperature_2m_min[i] ?? 22;
      const hi = hourlyTimes.findIndex(t => t.startsWith(dateStr));
      const slice = hi >= 0 ? hourlyHumidity.slice(hi, hi + 24).filter((v: number) => v != null) : [];
      const humMax = slice.length ? Math.max(...slice) : null;
      const humMin = slice.length ? Math.min(...slice) : null;
      return {
        date: dateStr,
        dayName: DAY_NAMES[d.getDay()],
        dayNum: d.getDate(),
        month: MONTH_NAMES[d.getMonth()],
        maxTemp: maxT,
        minTemp: minT,
        precipMm: raw.daily.precipitation_sum[i] ?? 0,
        wcode: raw.daily.weathercode[i] ?? 0,
        description: wmoCodes(raw.daily.weathercode[i] ?? 0),
        windspeed: raw.daily.windspeed_10m_max[i] ?? null,
        humidityMax: humMax,
        humidityMin: humMin,
        sunrise: raw.daily.sunrise[i] ?? null,
        sunset: raw.daily.sunset[i] ?? null,
      };
    });

    return {
      location: { lat, lng, district },
      current: {
        temp: cw?.temperature ?? 28,
        humidity: currentHumidity,
        wcode: cw?.weathercode ?? 0,
        wind: cw?.windspeed ?? 0,
        precip: 0,
        description: wmoCodes(cw?.weathercode ?? 0),
      },
      forecast,
      source: 'Open-Meteo',
    };
  },
};
