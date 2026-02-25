import { useState } from 'react';
import { ChevronDown, ChevronUp, Wind, Droplets } from 'lucide-react';
import type { WeatherHourly } from '../services/planning';

interface Props {
  hourly: WeatherHourly[];
  initialShowCount?: number;
}

function riskBg(color: string) {
  if (color === 'red') return 'bg-red-100 text-red-700 border-red-200';
  if (color === 'amber') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (color === 'green') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (color === 'blue') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (color === 'cyan') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  if (color === 'orange') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (color === 'yellow') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-stone-100 text-stone-700 border-stone-200';
}

function WeatherIcon({ code, className = 'w-5 h-5' }: { code: number | string; className?: string }) {
  const iconMap: Record<string, string> = {
    '0': '☀️', '1': '⛅', '2': '⛅', '3': '☁️', '45': '🌫️', '48': '🌫️',
    '51': '🌦️', '53': '🌧️', '55': '🌧️', '61': '🌧️', '63': '🌧️', '65': '⛈️',
    '71': '❄️', '73': '❄️', '75': '❄️', '77': '❄️', '80': '🌧️', '81': '⛈️', '82': '⛈️',
    '85': '❄️', '86': '❄️',
  };
  const icon = iconMap[String(code)] || '🌡️';
  return <span className={className}>{icon}</span>;
}

export function ForecastHourly({ hourly, initialShowCount = 6 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = expanded ? hourly.length : Math.min(initialShowCount, hourly.length);
  const visibleHours = hourly.slice(0, visibleCount);
  const hasMore = hourly.length > initialShowCount;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-500">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Hourly Forecast
        </h3>
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-medium flex items-center gap-1"
          >
            Show More <ChevronDown className="w-3 h-3" />
          </button>
        )}
        {expanded && hasMore && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded hover:bg-stone-200 font-medium flex items-center gap-1"
          >
            Show Less <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Horizontal scroll for hours */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 mb-3">
        <div className="flex gap-2 min-w-min">
          {visibleHours.map((hour, idx) => {
            const dateStr = hour.date ? hour.date.split('-').slice(1).join('/') : '';
            return (
              <div
                key={idx}
                className="flex-shrink-0 w-20 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg p-2 border border-stone-200 hover:border-emerald-300 transition-colors"
              >
                <p className="text-center text-xs font-bold text-stone-700 mb-1">
                  {hour.time}
                </p>
                <div className="flex justify-center text-xl mb-1">
                  <WeatherIcon code={hour.wcode} className="text-lg" />
                </div>
                <p className="text-center text-sm font-bold text-stone-800 mb-1">{hour.temp}°</p>
                <div className="space-y-0.5">
                  <div className={`text-xs px-1 py-0.5 rounded border text-center ${riskBg(hour.tempRisk.color)}`}>
                    {hour.tempRisk.label}
                  </div>
                  <div className="text-xs text-center text-blue-600 flex items-center justify-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5" /> {hour.humidity}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded detailed list view */}
      {expanded && visibleHours.length > initialShowCount && (
        <div className="mt-3 pt-3 border-t border-stone-200">
          <p className="text-xs text-stone-500 mb-2 font-medium">HOURLY DETAILS</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {visibleHours.slice(initialShowCount).map((hour, idx) => {
              const dateStr = hour.date ? hour.date.split('-').slice(1).join('/') : '';
              return (
                <div key={idx} className="p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold w-14 text-xs text-stone-600">{dateStr} {hour.time}</span>
                    <WeatherIcon code={hour.wcode} className="text-lg" />
                    <span className="font-bold w-10">{hour.temp}°</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${riskBg(hour.tempRisk.color)}`}>
                      {hour.tempRisk.label}
                    </span>
                    <span className="text-xs text-blue-600 flex items-center gap-0.5">
                      <Droplets className="w-3 h-3" /> {hour.humidity}%
                    </span>
                    <span className="text-xs text-stone-500 flex items-center gap-0.5">
                      <Wind className="w-3 h-3" /> {hour.wind}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary for initial view */}
      {!expanded && visibleHours.length > 0 && (
        <div className="text-xs text-stone-500 text-center">
          Showing {visibleHours.length} of {hourly.length} hours
          {hasMore && ' — Click "Show More" to see additional hours'}
        </div>
      )}
    </div>
  );
}
