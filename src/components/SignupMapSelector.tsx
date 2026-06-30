import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Check, Trash2, X } from 'lucide-react';

interface SignupMapSelectorProps {
  onClose: () => void;
  onSave: (coords: [number, number][], areaName: string) => void;
  initialCoords?: [number, number][];
  initialAreaName?: string;
}

export default function SignupMapSelector({
  onClose,
  onSave,
  initialCoords = [],
  initialAreaName = ''
}: SignupMapSelectorProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [coords, setCoords] = useState<[number, number][]>(initialCoords);
  const [areaName, setAreaName] = useState(initialAreaName);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Use Jaipur/Delhi average center
    const center: [number, number] = coords.length > 0 ? coords[0] : [28.6139, 77.2090]; // Delhi as default
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
    }).addTo(map);

    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Map Click handler to add coordinate
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
      setCoords(prev => [...prev, newPoint]);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers & Polygon when coordinates list changes
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // Re-draw point markers
    coords.forEach((point, idx) => {
      const markerIcon = L.divIcon({
        className: 'custom-signup-icon',
        html: `<div class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white text-white font-bold text-[10px] flex items-center justify-center shadow-lg">
          ${idx + 1}
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker(point, { icon: markerIcon }).addTo(markersGroup);
    });

    // Re-draw polygon overlay
    if (polygonRef.current) {
      polygonRef.current.remove();
      polygonRef.current = null;
    }

    if (coords.length >= 3) {
      polygonRef.current = L.polygon(coords, {
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.3,
        weight: 2
      }).addTo(map);
    } else if (coords.length === 2) {
      polygonRef.current = L.polygon(coords, {
        color: '#10b981',
        weight: 2
      }).addTo(map);
    }
  }, [coords]);

  const handleClear = () => {
    setCoords([]);
  };

  const handleRemoveLast = () => {
    setCoords(prev => prev.slice(0, prev.length - 1));
  };

  const handleSave = () => {
    if (!areaName.trim()) {
      alert('Please name your designated area (e.g., Delhi Central, Jaipur West).');
      return;
    }
    if (coords.length < 3) {
      alert('Please click at least 3 points on the map to define a coverage boundary.');
      return;
    }
    onSave(coords, areaName);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="text-emerald-500" size={16} /> Define Authority Jurisdiction Area
            </h3>
            <p className="text-[10px] text-slate-500 font-light mt-0.5">
              Click on the map to designate a closed boundary of coverage for your authority.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col md:flex-row relative">
          
          {/* Map canvas */}
          <div className="flex-1 h-2/3 md:h-full relative">
            <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow border border-gray-100 text-[10px] text-slate-700 z-[1000] font-semibold pointer-events-none">
              🖱️ Left-Click on map to draw your boundary
            </div>
          </div>

          {/* Sidebar controls */}
          <div className="w-full md:w-[320px] bg-slate-50 p-5 border-t md:border-t-0 md:border-l border-gray-150 flex flex-col justify-between shrink-0 h-1/3 md:h-full overflow-y-auto">
            
            <div className="space-y-4">
              {/* Area Name Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Jurisdiction Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi Municipal Corporation"
                  value={areaName}
                  onChange={e => setAreaName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition shadow-inner font-semibold"
                />
              </div>

              {/* Points count status */}
              <div className="bg-white p-3.5 rounded-xl border border-gray-150 space-y-1">
                <p className="text-[10px] font-bold text-slate-700 flex justify-between items-center">
                  <span>Boundary Coordinates</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${coords.length >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {coords.length} point{coords.length === 1 ? '' : 's'} {coords.length >= 3 ? '✓ Ready' : '• Need 3+'}
                  </span>
                </p>
                
                {coords.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-light italic pt-1 text-center">No points selected yet.</p>
                ) : (
                  <div className="max-h-[120px] overflow-y-auto divide-y divide-gray-50 text-[9px] font-mono text-slate-500 pt-1">
                    {coords.map((c, i) => (
                      <div key={i} className="py-1 flex justify-between">
                        <span>P{i + 1}</span>
                        <span>{c[0].toFixed(5)}, {c[1].toFixed(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 md:pt-0">
              <div className="flex gap-2">
                <button
                  onClick={handleRemoveLast}
                  disabled={coords.length === 0}
                  className="flex-1 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-bold rounded-xl text-[10px] transition border border-gray-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  Undo Last
                </button>
                <button
                  onClick={handleClear}
                  disabled={coords.length === 0}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold rounded-xl text-[10px] transition border border-red-100 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Clear All
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={coords.length < 3 || !areaName.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Check size={14} /> Save Designated Area
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
