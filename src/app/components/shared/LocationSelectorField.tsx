import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { MapViewer } from './MapViewer';
import { getDistrictCenter } from '../../constants/sriLankaLocations';

interface LocationSelectorFieldProps {
  label?: string;
  district?: string;
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  helperText?: string;
}

export function LocationSelectorField({
  label = 'Location',
  district,
  latitude,
  longitude,
  onChange,
  helperText = 'Pin exact location for accurate forage distance.',
}: LocationSelectorFieldProps) {
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [pendingLocation, setPendingLocation] = useState(() => {
    if (latitude && longitude) {
      return { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    }
    return getDistrictCenter(district);
  });

  const openMapPicker = () => {
    const fallback = getDistrictCenter(district);
    const nextLocation = latitude && longitude
      ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
      : fallback;
    setPendingLocation(nextLocation);
    setShowMapPicker(true);
  };

  const applyLocation = () => {
    onChange(pendingLocation.lat.toFixed(6), pendingLocation.lng.toFixed(6));
    setShowMapPicker(false);
  };

  return (
    <>
      {showMapPicker && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center px-3 py-4">
          <div className="w-[min(92vw,22rem)] bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
              <div>
                <h2 className="text-[0.95rem] font-semibold text-stone-800">Select location</h2>
                <p className="text-[0.72rem] text-stone-500">Tap map and confirm coordinates.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(false)}
                className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto">
              <MapViewer
                lat={pendingLocation.lat}
                lng={pendingLocation.lng}
                district={district}
                editable
                compact
                onLocationSelect={(lat, lng) => setPendingLocation({ lat, lng })}
              />
            </div>

            <div className="px-4 py-3 border-t border-stone-200 flex items-center justify-between gap-2">
              <div className="text-[0.72rem] text-stone-500">
                {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMapPicker(false)}
                  className="app-btn-ghost px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyLocation}
                  className="app-btn-primary px-3 py-2"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="app-card space-y-2">
        <div className="flex items-center justify-between">
          <label className="app-label">{label}</label>
          <button
            type="button"
            onClick={openMapPicker}
            className="app-btn-link"
          >
            Select location
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={latitude} readOnly placeholder="Latitude" className="app-input bg-stone-50" />
          <input value={longitude} readOnly placeholder="Longitude" className="app-input bg-stone-50" />
        </div>

        <p className="text-[0.72rem] text-stone-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          {helperText}
        </p>
      </div>
    </>
  );
}
