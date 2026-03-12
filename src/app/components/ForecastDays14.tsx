import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import type { WeatherDay } from '../services/planning';
import { t, type Language } from '../i18n';

interface Props {
  days: WeatherDay[];
  lang?: Language;
}

function weatherEmoji(code: number | string): string {
  const m: Record<string, string> = {
    '0': '☀️', 'sun': '☀️',
    '1': '⛅', '2': '⛅', '3': '☁️', 'cloud': '⛅',
    '45': '🌫️', '48': '🌫️', 'fog': '🌫️',
    '51': '🌦️', '53': '🌧️', '55': '🌧️', 'drizzle': '🌦️',
    '61': '🌧️', '63': '🌧️', '65': '⛈️', 'rain': '🌧️',
    '80': '🌧️', '81': '⛈️', '82': '⛈️',
    '71': '❄️', '73': '❄️', '75': '❄️', '77': '❄️', '85': '❄️', '86': '❄️', 'snow': '❄️',
  };
  return m[String(code)] || '🌡️';
}

function riskDot(color: string) {
  if (color === 'red') return 'bg-red-500';
  if (color === 'amber') return 'bg-amber-500';
  return 'bg-emerald-500';
}

/* —— Explanation helpers — plain-language reasons for the beekeeper —— */

function tempExplanation(avg: number, lang: Language): string {
  if (avg >= 20 && avg <= 35) return t('tempOptimal', lang);
  if (avg > 35 || avg < 15) return t('tempDangerous', lang);
  return t('tempModerate', lang);
}

function humidityExplanation(h: number | null, lang: Language): string {
  if (h === null) return '';
  if (h >= 40 && h <= 70) return t('humidityOptimal', lang);
  if (h > 85) return t('humidityDangerous', lang);
  return t('humidityModerate', lang);
}

function windExplanation(w: number | null, lang: Language): string {
  if (w === null) return '';
  if (w <= 15) return t('windCalm', lang);
  if (w <= 30) return t('windModerate', lang);
  return t('windStrong', lang);
}

function rainExplanation(mm: number, lang: Language): string {
  if (mm <= 0.5) return t('rainNone', lang);
  if (mm <= 5) return t('rainLight', lang);
  return t('rainHeavy', lang);
}

function heatStressExplanation(maxTemp: number, lang: Language): string {
  if (maxTemp > 38) return t('heatStressHigh', lang);
  if (maxTemp > 33) return t('heatStressMod', lang);
  return t('heatStressLow', lang);
}

export function ForecastDays14({ days, lang = 'en' }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const initialDays = 7;
  const visibleDays = expanded ? days : days.slice(0, initialDays);
  const selectedDay = selectedIdx !== null ? days[selectedIdx] : null;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-stone-800 text-[0.8rem] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-500" />
          {expanded ? t('forecast14Day', lang) : t('forecast7Day', lang)}
        </h3>
        {days.length > initialDays && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[0.65rem] bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 font-medium"
          >
            {expanded ? t('show7Days', lang) : t('show14Days', lang)}
          </button>
        )}
      </div>

      {/* Horizontal scroll — compact day cards like UI reference */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1.5 min-w-min">
          {visibleDays.map((day, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={day.date}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`flex-shrink-0 w-[3.5rem] rounded-lg p-1.5 border transition-colors text-center ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-stone-200 bg-stone-50 hover:border-amber-300'
                }`}
              >
                <p className="text-[0.6rem] font-medium text-stone-500">{day.dayName}</p>
                <p className="text-[0.85rem] font-bold text-stone-800">{day.dayNum}</p>
                <p className="text-base leading-none my-0.5">{weatherEmoji(day.icon)}</p>
                <p className="text-[0.65rem] font-bold text-stone-700">{day.maxTemp}°</p>
                <p className="text-[0.55rem] text-stone-400">{day.minTemp}°</p>
                <div className="flex justify-center mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${riskDot(day.tempRisk.color)}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint */}
      {selectedIdx === null && (
        <p className="text-[0.6rem] text-stone-400 text-center mt-1.5">{t('tapDayForDetails', lang)}</p>
      )}

      {/* ── Day Detail Overlay (bottom sheet) ─────────────── */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSelectedIdx(null)}>
          <div
            className="bg-white w-full max-w-[22rem] rounded-t-2xl p-4 pb-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[0.95rem] text-stone-800">
                  {selectedDay.dayName}, {selectedDay.dayNum} {selectedDay.month}
                </h3>
                <p className="text-[0.7rem] text-stone-500">{t('dayDetails', lang)}</p>
              </div>
              <button onClick={() => setSelectedIdx(null)} className="p-1 rounded-full bg-stone-100 hover:bg-stone-200">
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {/* Top summary — temps */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-3xl">{weatherEmoji(selectedDay.icon)}</span>
              <div>
                <p className="text-[1.1rem] font-bold text-stone-800">
                  {selectedDay.maxTemp}°C / {selectedDay.minTemp}°C
                </p>
                <p className="text-[0.7rem] text-stone-600">
                  {t('maxTemp', lang)}: {selectedDay.maxTemp}°C · {t('minTemp', lang)}: {selectedDay.minTemp}°C
                </p>
              </div>
            </div>

            {/* Named + explained metric rows */}
            <div className="space-y-2.5">
              <MetricRow
                label={t('temperature', lang)}
                value={`${Math.round((selectedDay.maxTemp + selectedDay.minTemp) / 2)}°C ${lang === 'si' ? 'සාමාන්‍ය' : 'average'}`}
                explanation={tempExplanation(Math.round((selectedDay.maxTemp + selectedDay.minTemp) / 2), lang)}
                color={selectedDay.tempRisk.color}
                statusLabel={selectedDay.tempRisk.label}
              />

              <MetricRow
                label={t('heatStress', lang)}
                value={`${selectedDay.maxTemp}°C ${lang === 'si' ? 'උපරිම' : 'peak'}`}
                explanation={heatStressExplanation(selectedDay.maxTemp, lang)}
                color={selectedDay.maxTemp > 38 ? 'red' : selectedDay.maxTemp > 33 ? 'amber' : 'green'}
                statusLabel={selectedDay.maxTemp > 38 ? (lang === 'si' ? 'ඉහළ' : 'High') : selectedDay.maxTemp > 33 ? (lang === 'si' ? 'මධ්‍යම' : 'Moderate') : (lang === 'si' ? 'අඩු' : 'Low')}
              />

              <MetricRow
                label={t('rainfall', lang)}
                value={`${selectedDay.precipMm} mm`}
                explanation={rainExplanation(selectedDay.precipMm, lang)}
                color={selectedDay.rainStatus?.color || (selectedDay.precipMm > 5 ? 'red' : selectedDay.precipMm > 0.5 ? 'amber' : 'green')}
                statusLabel={selectedDay.rainStatus?.label || (selectedDay.precipMm > 5 ? 'Heavy' : selectedDay.precipMm > 0.5 ? 'Light' : 'None')}
              />

              {selectedDay.humidityAvg !== null && (
                <MetricRow
                  label={t('humidity', lang)}
                  value={`${selectedDay.humidityAvg}%`}
                  explanation={humidityExplanation(selectedDay.humidityAvg, lang)}
                  color={selectedDay.humidityStatus?.color || 'stone'}
                  statusLabel={selectedDay.humidityStatus?.label || ''}
                />
              )}

              {selectedDay.windspeed !== null && (
                <MetricRow
                  label={t('wind', lang)}
                  value={`${selectedDay.windspeed} km/h`}
                  explanation={windExplanation(selectedDay.windspeed, lang)}
                  color={selectedDay.windspeed > 30 ? 'red' : selectedDay.windspeed > 15 ? 'amber' : 'green'}
                  statusLabel={selectedDay.windspeed > 30 ? (lang === 'si' ? 'තද' : 'Strong') : selectedDay.windspeed > 15 ? (lang === 'si' ? 'මධ්‍යම' : 'Moderate') : (lang === 'si' ? 'සන්සුන්' : 'Calm')}
                />
              )}

              {(selectedDay.sunrise || selectedDay.sunset) && (
                <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex justify-between text-[0.75rem]">
                    {selectedDay.sunrise && <span className="text-stone-700">🌅 {t('sunrise', lang)}: <strong>{selectedDay.sunrise}</strong></span>}
                    {selectedDay.sunset && <span className="text-stone-700">🌇 {t('sunset', lang)}: <strong>{selectedDay.sunset}</strong></span>}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setSelectedIdx(null)} className="mt-4 w-full py-2 bg-stone-100 text-stone-700 rounded-xl text-[0.8rem] font-medium hover:bg-stone-200">
              {t('close', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Metric Row ─────────────────────────────────────────── */
function MetricRow({ label, value, explanation, color, statusLabel }: {
  label: string; value: string; explanation: string; color: string; statusLabel: string;
}) {
  const bgMap: Record<string, string> = {
    red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200',
    green: 'bg-emerald-50 border-emerald-200', blue: 'bg-blue-50 border-blue-200',
  };
  const badgeMap: Record<string, string> = {
    red: 'bg-red-200 text-red-800', amber: 'bg-amber-200 text-amber-800',
    green: 'bg-emerald-200 text-emerald-800', blue: 'bg-blue-200 text-blue-800',
  };
  return (
    <div className={`p-2.5 rounded-lg border ${bgMap[color] || 'bg-stone-50 border-stone-200'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-bold text-[0.75rem] text-stone-800">{label}</span>
        <span className={`text-[0.6rem] px-1.5 py-0.5 rounded font-bold uppercase ${badgeMap[color] || 'bg-stone-200 text-stone-800'}`}>{statusLabel}</span>
      </div>
      <p className="text-[0.8rem] font-semibold text-stone-700 mb-0.5">{value}</p>
      <p className="text-[0.65rem] text-stone-500 leading-snug">{explanation}</p>
    </div>
  );
}
