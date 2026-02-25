import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { WeatherDay } from '../services/planning';

interface Props {
  days: WeatherDay[];
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
  // Simple emoji-based weather icons
  const iconMap: Record<string, string> = {
    'sun': '☀️', '0': '☀️',
    'cloud': '⛅', '1': '⛅', '2': '⛅', '3': '⛅',
    'fog': '🌫️',
    'drizzle': '🌦️', '45': '🌫️', '48': '🌫️',
    'rain': '🌧️', '51': '🌦️', '53': '🌧️', '55': '🌧️', '61': '🌧️', '63': '🌧️', '65': '⛈️', '80': '🌧️', '81': '⛈️', '82': '⛈️',
    'snow': '❄️', '71': '❄️', '73': '❄️', '75': '❄️', '77': '❄️', '80': '🌧️', '85': '❄️', '86': '❄️',
    'thunder': '⛈️', '80': '⛈️', '82': '⛈️',
  };
  const icon = iconMap[String(code)] || '🌡️';
  return <span className={className}>{icon}</span>;
}

export function ForecastDays14({ days }: Props) {
  const [expanded, setExpanded] = useState(false);
  const initialDays = 7;
  const visibleDays = expanded ? days : days.slice(0, initialDays);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-stone-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          {expanded ? '14-Day Forecast' : '7-Day Forecast'}
        </h3>
        {days.length > initialDays && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium"
          >
            Show 14 Days
          </button>
        )}
        {expanded && days.length > initialDays && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded hover:bg-stone-200 font-medium"
          >
            Show 7 Days
          </button>
        )}
      </div>

      {/* Horizontal scroll container */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2 min-w-min">
          {visibleDays.map((day) => (
            <div
              key={day.date}
              className="flex-shrink-0 w-24 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg p-3 border border-stone-200 hover:border-blue-300 transition-colors"
            >
              {/* Date header */}
              <div className="text-center mb-2">
                <p className="font-bold text-sm text-stone-800">{day.dayName}</p>
                <p className="text-xs text-stone-600">{day.dayNum} {day.month}</p>
              </div>

              {/* Weather icon */}
              <div className="flex justify-center mb-2 text-2xl">
                <WeatherIcon code={day.icon} className="text-2xl" />
              </div>

              {/* Temperature */}
              <div className="text-center mb-2">
                <p className="text-sm font-bold text-stone-800">{day.maxTemp}°</p>
                <p className="text-xs text-stone-500">{day.minTemp}°</p>
              </div>

              {/* Risk badges */}
              <div className="space-y-1 text-center">
                <div className={`text-xs px-1.5 py-0.5 rounded border ${riskBg(day.tempRisk.color)}`}>
                  {day.tempRisk.label}
                </div>
                {day.precipMm > 0 && (
                  <div className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                    {day.precipMm}mm
                  </div>
                )}
                {day.humidityAvg !== null && (
                  <div className={`text-xs px-1.5 py-0.5 rounded border ${riskBg(day.humidityStatus?.color || 'stone')}`}>
                    {day.humidityAvg}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && visibleDays.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-200">
          <p className="text-xs text-stone-500 mb-2 font-medium">DETAILED VIEW</p>
          <div className="space-y-2">
            {visibleDays.map((day) => (
              <div key={day.date} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-800">{day.dayName}, {day.dayNum} {day.month}</span>
                    <WeatherIcon code={day.icon} className="text-xl" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${riskBg(day.tempRisk.color)}`}>
                    {day.tempRisk.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between"><span className="text-stone-600">Temp:</span><span className="font-medium">{day.maxTemp}° / {day.minTemp}°</span></div>
                  <div className="flex justify-between"><span className="text-stone-600">Rain:</span><span className="font-medium text-blue-600">{day.precipMm}mm</span></div>
                  {day.humidityAvg !== null && <div className="flex justify-between"><span className="text-stone-600">Humidity:</span><span className="font-medium">{day.humidityAvg}%</span></div>}
                  {day.windspeed !== null && <div className="flex justify-between"><span className="text-stone-600">Wind:</span><span className="font-medium">{day.windspeed} km/h</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
