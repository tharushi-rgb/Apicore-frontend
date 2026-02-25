// planning.ts — fully client-side, no backend required
// Weather: Open-Meteo (https://api.open-meteo.com) — free, no API key needed
// Districts: embedded static list for Sri Lanka

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

const FORAGE_PLANTS: ForagePlant[] = [
  { name: 'Rubber', scientific: 'Hevea brasiliensis', resourceType: 'nectar', bloomStart: 3, bloomEnd: 5, availability: 'abundant', note: 'Major nectar source in wet zone', zone: 'wet' },
  { name: 'Coconut', scientific: 'Cocos nucifera', resourceType: 'pollen', bloomStart: 1, bloomEnd: 12, availability: 'moderate', note: 'Year-round pollen; coastal and low country', zone: 'all' },
  { name: 'Jak', scientific: 'Artocarpus heterophyllus', resourceType: 'nectar', bloomStart: 2, bloomEnd: 5, availability: 'moderate', note: 'Common in home gardens', zone: 'wet' },
  { name: 'Mango', scientific: 'Mangifera indica', resourceType: 'nectar', bloomStart: 1, bloomEnd: 3, availability: 'abundant', note: 'Heavy bloom Jan–Mar in dry zone', zone: 'dry' },
  { name: 'Rambutan', scientific: 'Nephelium lappaceum', resourceType: 'nectar', bloomStart: 5, bloomEnd: 7, availability: 'abundant', note: 'Key summer flow', zone: 'wet' },
  { name: 'Durian', scientific: 'Durio zibethinus', resourceType: 'nectar', bloomStart: 4, bloomEnd: 6, availability: 'moderate', note: 'Night-blooming but daytime forage too', zone: 'wet' },
  { name: 'Eucalyptus', scientific: 'Eucalyptus spp.', resourceType: 'nectar', bloomStart: 6, bloomEnd: 10, availability: 'abundant', note: 'Plantation species; excellent nectar flow', zone: 'mid' },
  { name: 'Coffee', scientific: 'Coffea arabica', resourceType: 'nectar', bloomStart: 4, bloomEnd: 6, availability: 'moderate', note: 'Short intense bloom after rain', zone: 'mid' },
  { name: 'Maize', scientific: 'Zea mays', resourceType: 'pollen', bloomStart: 3, bloomEnd: 8, availability: 'moderate', note: 'Important pollen source, multiple seasons', zone: 'dry' },
  { name: 'Sesame', scientific: 'Sesamum indicum', resourceType: 'nectar', bloomStart: 6, bloomEnd: 9, availability: 'moderate', note: 'Yala season crop; dry zone', zone: 'dry' },
  { name: 'Calotropis', scientific: 'Calotropis gigantea', resourceType: 'nectar', bloomStart: 1, bloomEnd: 12, availability: 'low', note: 'Roadside weed; year-round', zone: 'dry' },
  { name: 'Guava', scientific: 'Psidium guajava', resourceType: 'nectar', bloomStart: 3, bloomEnd: 5, availability: 'moderate', note: 'Home gardens and scrubland', zone: 'all' },
  { name: 'Neem', scientific: 'Azadirachta indica', resourceType: 'nectar', bloomStart: 2, bloomEnd: 4, availability: 'moderate', note: 'Dry zone trees; bitter honey possible', zone: 'dry' },
  { name: 'Pumpkin', scientific: 'Cucurbita maxima', resourceType: 'pollen', bloomStart: 9, bloomEnd: 12, availability: 'moderate', note: 'Maha season; important pollen', zone: 'all' },
  { name: 'Sunflower', scientific: 'Helianthus annuus', resourceType: 'nectar', bloomStart: 7, bloomEnd: 10, availability: 'abundant', note: 'Cultivated; excellent forage', zone: 'dry' },
  { name: 'Wild Mango', scientific: 'Mangifera zeylanica', resourceType: 'nectar', bloomStart: 1, bloomEnd: 3, availability: 'moderate', note: 'Forest edges', zone: 'dry' },
  { name: 'Wild Cinnamon', scientific: 'Cinnamomum verum', resourceType: 'pollen', bloomStart: 3, bloomEnd: 5, availability: 'low', note: 'Forest understory, wet zone', zone: 'wet' },
  { name: 'Lotus', scientific: 'Nelumbo nucifera', resourceType: 'nectar', bloomStart: 6, bloomEnd: 9, availability: 'moderate', note: 'Tanks and wetlands', zone: 'all' },
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
  if (t <= 35) return { level: 'optimal', label: 'Optimal', color: 'green', detail: 'Ideal foraging range 20–35°C' };
  if (t <= 40) return { level: 'warm', label: 'Warm', color: 'orange', detail: 'Provide shade and water' };
  return { level: 'hot', label: 'Too Hot', color: 'red', detail: 'Above 40°C – heat stress risk' };
}

function humidityStatus(h: number): { level: string; label: string; color: string } {
  if (h < 40) return { level: 'dry', label: 'Dry', color: 'orange' };
  if (h <= 70) return { level: 'optimal', label: 'Good', color: 'green' };
  if (h <= 85) return { level: 'humid', label: 'Humid', color: 'yellow' };
  return { level: 'very_humid', label: 'Very Humid', color: 'red' };
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
  if (avgHumidity > 85) score -= 20;
  else if (avgHumidity < 40) score -= 15;
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
  const rawEnd = endDate ?? new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
  // Open-Meteo supports max 16-day forecast; cap at today+16
  const maxEnd = new Date(today.getTime() + 16 * 86400000).toISOString().split('T')[0];
  const end = rawEnd > maxEnd ? maxEnd : rawEnd;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,` +
    `precipitation_hours,sunrise,sunset` +
    `&hourly=temperature_2m,precipitation,relativehumidity_2m,windspeed_10m,weathercode` +
    `&current_weather=true` +
    `&start_date=${start}&end_date=${end}` +
    `&timezone=Asia%2FColombo`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const planningService = {
  async analyze(lat: number, lng: number, district?: string, opts?: { startDate?: string; endDate?: string }): Promise<PlanningAnalysis> {
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

    // Forage
    const currentMonth = new Date().getMonth() + 1;
    const zone = lat > 8 ? 'dry' : lng > 80.7 && lat < 7.5 ? 'wet' : 'mid';
    const forageForZone = (z: string) => FORAGE_PLANTS.filter(p => p.zone === z || p.zone === 'all');
    const currentForage = forageForZone(zone).filter(p =>
      currentMonth >= p.bloomStart && currentMonth <= p.bloomEnd
    );
    const nextMonth = (currentMonth % 12) + 1;
    const upcomingForage = forageForZone(zone).filter(p =>
      nextMonth >= p.bloomStart && nextMonth <= p.bloomEnd && !currentForage.includes(p)
    );

    return {
      location: { lat, lng, district: district ?? 'Unknown' },
      saturation: { count: 0, totalInSystem: 0, level: 'low', message: 'No saturation data available offline', radiusKm: 5 },
      suitability: suit,
      weather: { current, days, hourly, source: 'Open-Meteo' },
      forage: { current: currentForage, upcoming: upcomingForage, month: currentMonth },
    };
  },

  async getDistricts(): Promise<District[]> {
    return SRI_LANKA_DISTRICTS;
  },

  async getForageByMonth(month: number): Promise<ForagePlant[]> {
    // Return forage plants blooming in the specified month
    return FORAGE_PLANTS.filter(p => month >= p.bloomStart && month <= p.bloomEnd);
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
