import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ApplicantAreaMapProps {
  coordinates?: [number, number][];
}

export default function ApplicantAreaMap({ coordinates = [] }: ApplicantAreaMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use default center or first point of the boundary coordinates
    const center: [number, number] = coordinates.length > 0 ? coordinates[0] : [28.6139, 77.2090];
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
    }).addTo(map);

    mapRef.current = map;

    // If coordinates are valid, draw a polygon and fit bounds
    if (coordinates.length >= 3) {
      const polygon = L.polygon(coordinates, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.4,
        weight: 3
      }).addTo(map);

      // Draw markers for vertices
      coordinates.forEach((point, idx) => {
        const markerIcon = L.divIcon({
          className: 'custom-applicant-point',
          html: `<div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow shadow-emerald-500/50">
            ${idx + 1}
          </div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker(point, { icon: markerIcon }).addTo(map);
      });

      // Zoom map to fit the entire polygon
      map.fitBounds(polygon.getBounds(), { padding: [20, 20] });
    } else if (coordinates.length > 0) {
      // Just drop a simple marker if not a full polygon
      L.marker(coordinates[0]).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordinates]);

  return (
    <div className="relative w-full h-full min-h-[180px] bg-slate-50">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}
