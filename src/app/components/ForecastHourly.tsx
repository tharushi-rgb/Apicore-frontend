import { useState } from 'react';
import { X } from 'lucide-react';
import type { WeatherHourly } from '../services/planning';
import { t, type Language } from '../i18n';

interface Props {
  hourly: WeatherHourly[];
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

function riskDot(color: string) {
  if (color === 'red') return 'bg-red-500';
  if (color === 'amber') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function tempExplanation(temp: number, lang: Language): string {
  if (temp >= 20 && temp <= 35) return t('tempOptimal', lang);
  if (temp > 35 || temp < 15) return t('tempDangerous', lang);
  return t('tempModerate', lang);
}

function humidityExplanation(h: number, lang: Language): string {
  if (h >= 60 && h <= 95) return t('humidityOptimal', lang);
  if (h > 95) return t('humidityDangerous', lang);
  return t('humidityModerate', lang);
}

function windExplanation(w: number, lang: Language): string {
  if (w <= 15) return t('windCalm', lang);
  if (w <= 30) return t('windModerate', lang);
  return t('windStrong', lang);
}

function rainExplanation(mm: number, lang: Language): string {
  if (mm <= 0.5) return t('rainNone', lang);
  if (mm <= 5) return t('rainLight', lang);
  return t('rainHeavy', lang);
}

export function ForecastHourly({ hourly, lang = 'en' }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selectedHour = selectedIdx !== null ? hourly[selectedIdx] : null;

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center mb-2">
        <h3 className="font-bold text-stone-800 text-[0.8rem] flex items-center gap-1.5">
          <span className="text-base">🕐</span>
          {t('hourlyForecast', lang)}
        </h3>
      </div>

      {/* Horizontal scroll — compact hour cards */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-1.5 min-w-min">
          {hourly.map((hour, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedIdx(isSelected ? null : idx)}
                className={`flex-shrink-0 w-[3.5rem] rounded-lg p-1.5 border transition-colors text-center ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-stone-200 bg-stone-50 hover:border-emerald-300'
                }`}
              >
                <p className="text-[0.6rem] font-medium text-stone-500">{hour.time}</p>
                <p className="text-base leading-none my-0.5">{weatherEmoji(hour.wcode)}</p>
                <p className="text-[0.7rem] font-bold text-stone-800">{hour.temp}°</p>
                {hour.precip > 0 && (
                  <p className="text-[0.55rem] text-blue-500">💧{hour.precip}</p>
                )}
                <div className="flex justify-center mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${riskDot(hour.tempRisk.color)}`} />
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

      {/* ── Hour Detail Overlay (bottom sheet) ─────────────── */}
      {selectedHour && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSelectedIdx(null)}>
          <div
            className="bg-white w-full max-w-[22rem] rounded-t-2xl p-4 pb-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[0.95rem] text-stone-800">{selectedHour.time}</h3>
                <p className="text-[0.7rem] text-stone-500">{selectedHour.date}</p>
              </div>
              <button onClick={() => setSelectedIdx(null)} className="p-1 rounded-full bg-stone-100 hover:bg-stone-200">
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            {/* Top summary */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-3xl">{weatherEmoji(selectedHour.wcode)}</span>
              <div>
                <p className="text-[1.1rem] font-bold text-stone-800">{selectedHour.temp}°C</p>
                <p className="text-[0.7rem] text-stone-600">{selectedHour.tempRisk.label}</p>
              </div>
            </div>

            {/* Metric rows */}
            <div className="space-y-2.5">
              <HourMetricRow
                label={t('temperature', lang)}
                value={`${selectedHour.temp}°C`}
                explanation={tempExplanation(selectedHour.temp, lang)}
                color={selectedHour.tempRisk.color}
                statusLabel={selectedHour.tempRisk.label}
              />
              <HourMetricRow
                label={t('humidity', lang)}
                value={`${selectedHour.humidity}%`}
                explanation={humidityExplanation(selectedHour.humidity, lang)}
                color={selectedHour.humidityStatus.color}
                statusLabel={selectedHour.humidityStatus.label}
              />
              <HourMetricRow
                label={t('wind', lang)}
                value={`${selectedHour.wind} km/h`}
                explanation={windExplanation(selectedHour.wind, lang)}
                color={selectedHour.wind > 30 ? 'red' : selectedHour.wind > 15 ? 'amber' : 'green'}
                statusLabel={selectedHour.wind > 30 ? (lang === 'si' ? 'තද' : 'Strong') : selectedHour.wind > 15 ? (lang === 'si' ? 'මධ්‍යම' : 'Moderate') : (lang === 'si' ? 'සන්සුන්' : 'Calm')}
              />
              <HourMetricRow
                label={t('rainfall', lang)}
                value={`${selectedHour.precip} mm`}
                explanation={rainExplanation(selectedHour.precip, lang)}
                color={selectedHour.precip > 5 ? 'red' : selectedHour.precip > 0.5 ? 'amber' : 'green'}
                statusLabel={selectedHour.precip > 5 ? (lang === 'si' ? 'අධික' : 'Heavy') : selectedHour.precip > 0.5 ? (lang === 'si' ? 'සැහැල්ලු' : 'Light') : (lang === 'si' ? 'නැත' : 'None')}
              />
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
function HourMetricRow({ label, value, explanation, color, statusLabel }: {
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
