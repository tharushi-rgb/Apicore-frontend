import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface Props {
  lat: number;
  lng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  district?: string;
  editable?: boolean;
}

// Fix leaflet icon issue in React using CDN URLs
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(DefaultIcon);

export function MapViewer({ lat, lng, onLocationSelect, district, editable = false }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([lat, lng], 10);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add initial marker
      marker.current = L.marker([lat, lng], { icon: DefaultIcon })
        .bindPopup(`<div class="text-sm"><strong>${district || 'Selected Location'}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`)
        .addTo(map.current);

      // Handle map clicks for location selection
      if (editable) {
        map.current.on('click', (e: L.LeafletMouseEvent) => {
          const { lat: newLat, lng: newLng } = e.latlng;

          // Update marker position
          if (marker.current) {
            marker.current.setLatLng([newLat, newLng]);
            marker.current.setPopupContent(
              `<div class="text-sm"><strong>Selected</strong><br/>${newLat.toFixed(4)}, ${newLng.toFixed(4)}</div>`
            );
          }

          // Notify parent component
          if (onLocationSelect) {
            onLocationSelect(newLat, newLng);
          }
        });

        // Add visual feedback
        map.current.on('mouseenter', () => {
          if (mapContainer.current) {
            mapContainer.current.style.cursor = 'crosshair';
          }
        });
        map.current.on('mouseleave', () => {
          if (mapContainer.current) {
            mapContainer.current.style.cursor = 'grab';
          }
        });
      }
    } else {
      // Update existing marker if coordinates changed
      if (marker.current) {
        marker.current.setLatLng([lat, lng]);
        marker.current.setPopupContent(
          `<div class="text-sm"><strong>${district || 'Location'}</strong><br/>${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`
        );
      }
      map.current.setView([lat, lng], 10);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [lat, lng, district, editable, onLocationSelect]);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="p-3 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-stone-200 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-emerald-600" />
        <div>
          <h3 className="font-bold text-sm text-stone-800">{district || 'Location Map'}</h3>
          <p className="text-xs text-stone-500">
            {editable ? 'Click on map to select location' : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
          </p>
        </div>
      </div>

      <div
        ref={mapContainer}
        className="w-full h-72 bg-stone-100"
        style={{ minHeight: '300px' }}
      />

      <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs text-stone-600">
        <p><strong>Coordinates:</strong> {lat.toFixed(6)}, {lng.toFixed(6)}</p>
        {editable && <p className="text-emerald-600 mt-1">✓ Click the map to update location</p>}
      </div>
    </div>
  );
}
