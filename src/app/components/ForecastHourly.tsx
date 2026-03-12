import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { WeatherHourly } from '../services/planning';
import { t, type Language } from '../i18n';

interface Props {
  hourly: WeatherHourly[];
  initialShowCount?: number;
  lang?: Language;
}

function weatherEmoji(code: number | string): string {
  const m: Record<string, string> = {
    '0': '☀️', '1': '⛅', '2': '⛅', '3': '☁️',
    '45': '🌫️', '48': '🌫️',
    '51': '🌦️', '53': '🌧️', '55': '🌧️',
    '61': '🌧️', '63': '🌧️', '65': '⛈️',
    '71': '❄️', '73': '❄️', '75': '❄️', '77': '❄️',
    '80': '🌧️', '81': '⛈️', '82': '⛈️', '85': '❄️', '86': '❄️',
  };
  return m[String(code)] || '🌡️';
}

function tempExplanation(temp: number, lang: Language): string {
  if (temp >= 20 && temp <= 35) return t('tempOptimal', lang);
  if (temp > 35 || temp < 15) return t('tempDangerous', lang);
  return t('tempModerate', lang);
}

export function ForecastHourly({ hourly, initialShowCount = 6, lang = 'en' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = expanded ? hourly.length : Math.min(initialShowCount, hourly.length);
  const visibleHours = hourly.slice(0, visibleCount);
  const hasMore = hourly.length > initialShowCount;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-stone-800 text-[0.8rem] flex items-center gap-1.5">
          <span className="text-base">🕐</span>
          {t('hourlyForecast', lang)}
        </h3>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[0.65rem] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 font-medium flex items-center gap-0.5"
          >
            {expanded ? t('showLess', lang) : t('showMore', lang)}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Hourly rows — text-based, no ambiguous icons */}
      <div className="space-y-1.5">
        {visibleHours.map((hour, idx) => (
          <div key={idx} className="p-2 bg-stone-50 rounded-lg border border-stone-200">
            {/* Top row: time, emoji, temp */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[0.7rem] font-bold text-stone-700 w-10">{hour.time}</span>
                <span className="text-sm">{weatherEmoji(hour.wcode)}</span>
                <span className="text-[0.8rem] font-bold text-stone-800">{hour.temp}°C</span>
              </div>
              <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-bold ${
                hour.tempRisk.color === 'red' ? 'bg-red-200 text-red-800' :
                hour.tempRisk.color === 'amber' ? 'bg-amber-200 text-amber-800' :
                'bg-emerald-200 text-emerald-800'
              }`}>{hour.tempRisk.label}</span>
            </div>
            {/* Bottom row: named values in words */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.6rem] text-stone-600">
              <span>{t('humidity', lang)}: <strong>{hour.humidity}%</strong></span>
              <span>{t('wind', lang)}: <strong>{hour.wind} km/h</strong></span>
              {hour.precip > 0 && <span>{t('rainfall', lang)}: <strong>{hour.precip} mm</strong></span>}
            </div>
          </div>
        ))}
      </div>

      {/* Summary text */}
      {!expanded && hasMore && (
        <p className="text-[0.6rem] text-stone-400 text-center mt-1.5">
          {t('showingHours', lang)} {visibleHours.length} {t('ofHours', lang)} {hourly.length} {t('hours', lang)}
        </p>
      )}
    </div>
  );
}
