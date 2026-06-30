import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Issue } from '../shared-types.js';
import {
  AlertTriangle,
  Droplet,
  Lightbulb,
  Trash2,
  Waves,
  Building2,
  Check,
  Plus,
  Minus,
  Locate,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Trees,
  Footprints,
  Wind,
  Paintbrush,
  Bus,
  HeartPulse,
  Compass,
  X
} from 'lucide-react';

// Fix Leaflet default marker icons in bundles
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Regional boundary loop wrapping Jaipur area (as seen in the screenshot)
const JAIPUR_BOUNDARY: [number, number][] = [
  [26.935, 75.720], // North-West (Heerapura/Vaishali Nagar area North)
  [26.940, 75.790], // North (Bani Park area North)
  [26.925, 75.850], // North-East (Pink City/Hawa Mahal area North)
  [26.850, 75.865], // East (Malviya Nagar/Jagatpura area East)
  [26.805, 75.845], // South-East (Jagatpura area South)
  [26.795, 75.780], // South (Sanganer area South)
  [26.810, 75.710], // South-West (Heerapura area South)
  [26.880, 75.705]  // West (Vaishali Nagar area West)
];

// SVG icons for high-fidelity custom pins (White vector icons inside colored circles)
const CATEGORY_ICONS: Record<string, string> = {
  'Road Damage / Pothole': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  'Road Damage': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  'Water Leakage': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplet"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
  'Streetlight Problem': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
  'Garbage & Waste': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  'Drainage / Sewage': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2"/></svg>`,
  'Traffic & Road Signs': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  'Parks & Recreation': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trees"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 11a5 5 0 0 1 7.5-4.3 5 5 0 0 1 8 0A5 5 0 0 1 20 11"/></svg>`,
  'Stray Animals / Safety': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-footprints"><path d="M4 16v-2.38C4 11.5 5.88 9.85 6 7c.05-1.12.27-2.23.66-3.29a1 1 0 0 1 1.88.66C8.17 5.43 8 6.7 8 8c0 1.8.84 3.32 1.66 4.75a25.5 25.5 0 0 1 1.34 2.5v.75"/><path d="M20 16v-2.38C20 11.5 18.12 9.85 18 7c-.05-1.12-.27-2.23-.66-3.29a1 1 0 0 0-1.88.66C15.83 5.43 16 6.7 16 8c0 1.8-.84 3.32-1.66 4.75a25.5 25.5 0 0 0-1.34 2.5v.75"/></svg>`,
  'Air & Noise Pollution': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wind"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59-3.41A2 2 0 1 1 14 8H2m15.59 7.41A2 2 0 1 1 16 12H2"/></svg>`,
  'Vandalism & Graffiti': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-paintbrush"><path d="m14 6-4-4-4 4 4 4z"/><path d="M8.5 8.5 4 13"/><path d="M16 11c0 2.2-1.8 4-4 4"/></svg>`,
  'Public Transit & Bus Stops': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M8 19h8"/><path d="M18 8h-3v4h3"/><path d="M6 8h3v4H6"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,
  'Public Health & Encroachments': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart-pulse"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H7l2-5 2 10 2-7 1.5 2h3.28"/></svg>`,
  'Public Infrastructure / Other': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`,
  'Public Infrastructure': `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
};

interface MapComponentProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  issues?: Issue[];
  selectedCoords?: [number, number] | null;
  onSelectCoords?: (coords: [number, number]) => void;
  onSelectIssue?: (issue: Issue) => void;
  heatmap?: boolean;
  fullScreen?: boolean;
  mapType?: 'street' | 'satellite';
  hideInnerLegend?: boolean;
  hideInnerMapTypeToggle?: boolean;
}

// Category colors for pins and overlays
const CATEGORY_COLORS: Record<string, string> = {
  'Road Damage / Pothole': '#ef4444', // Red
  'Road Damage': '#ef4444',
  'Water Leakage': '#3b82f6', // Blue
  'Streetlight Problem': '#f59e0b', // Amber/Yellow
  'Garbage & Waste': '#10b981', // Green
  'Drainage / Sewage': '#8b5cf6', // Purple
  'Traffic & Road Signs': '#f97316', // Orange
  'Parks & Recreation': '#22c55e', // Emerald/Green
  'Stray Animals / Safety': '#ec4899', // Pink
  'Air & Noise Pollution': '#14b8a6', // Teal
  'Vandalism & Graffiti': '#06b6d4', // Cyan
  'Public Transit & Bus Stops': '#6366f1', // Indigo
  'Public Health & Encroachments': '#64748b', // Slate
  'Public Infrastructure / Other': '#6b7280' // Gray
};

function getCategoryIcon(category: string): { svg: string; color: string } {
  const color = CATEGORY_COLORS[category] || '#6b7280';
  if (category === 'Road Damage / Pothole' || category === 'Road Damage') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      color
    };
  }
  if (category === 'Water Leakage') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>`,
      color
    };
  }
  if (category === 'Streetlight Problem') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>`,
      color
    };
  }
  if (category === 'Garbage & Waste') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
      color
    };
  }
  if (category === 'Drainage / Sewage') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.6 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
      color
    };
  }
  if (category === 'Traffic & Road Signs') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      color
    };
  }
  if (category === 'Parks & Recreation') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 11a5 5 0 0 1 7.5-4.3 5 5 0 0 1 8 0A5 5 0 0 1 20 11"/></svg>`,
      color
    };
  }
  if (category === 'Stray Animals / Safety') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M4 16v-2.38C4 11.5 5.88 9.85 6 7c.05-1.12.27-2.23.66-3.29a1 1 0 0 1 1.88.66C8.17 5.43 8 6.7 8 8c0 1.8.84 3.32 1.66 4.75a25.5 25.5 0 0 1 1.34 2.5v.75"/><path d="M20 16v-2.38C20 11.5 18.12 9.85 18 7c-.05-1.12-.27-2.23-.66-3.29a1 1 0 0 0-1.88.66C15.83 5.43 16 6.7 16 8c0 1.8-.84 3.32-1.66 4.75a25.5 25.5 0 0 0-1.34 2.5v.75"/></svg>`,
      color
    };
  }
  if (category === 'Air & Noise Pollution') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59-3.41A2 2 0 1 1 14 8H2m15.59 7.41A2 2 0 1 1 16 12H2"/></svg>`,
      color
    };
  }
  if (category === 'Vandalism & Graffiti') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="m14 6-4-4-4 4 4 4z"/><path d="M8.5 8.5 4 13"/><path d="M16 11c0 2.2-1.8 4-4 4"/></svg>`,
      color
    };
  }
  if (category === 'Public Transit & Bus Stops') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M8 19h8"/><path d="M18 8h-3v4h3"/><path d="M6 8h3v4H6"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`,
      color
    };
  }
  if (category === 'Public Health & Encroachments') {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H7l2-5 2 10 2-7 1.5 2h3.28"/></svg>`,
      color
    };
  }
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white"><path d="M3 22V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14"/><path d="M12 22V14"/><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6 10h2"/><path d="M6 14h2"/><path d="M10 10h2"/><path d="M10 14h2"/></svg>`,
    color
  };
}

export default function MapComponent({
  center = [26.8501, 75.8110], // Jaipur VGU
  zoom = 13,
  issues = [],
  selectedCoords = null,
  onSelectCoords,
  onSelectIssue,
  heatmap = false,
  fullScreen = false,
  mapType: externalMapType,
  hideInnerLegend = false,
  hideInnerMapTypeToggle = false
}: MapComponentProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const selectionMarkerRef = useRef<L.Marker | null>(null);
  const tileLayersRef = useRef<L.Layer[]>([]);
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>(externalMapType || 'street');

  useEffect(() => {
    if (externalMapType) {
      setMapType(externalMapType);
    }
  }, [externalMapType]);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.setView([position.coords.latitude, position.coords.longitude], 15);
        },
        (error) => {
          console.error("Error getting location: ", error);
          mapRef.current?.setView(center, 13);
        }
      );
    } else {
      mapRef.current?.setView(center, 13);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Create the Leaflet map instance with standard zoom controls hidden
    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: false,
      scrollWheelZoom: true
    });

    // Add high-fidelity, up-to-date Google Maps Street layer as default
    const streetLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Map data &copy; Google'
    }).addTo(map);
    tileLayersRef.current = [streetLayer];

    // Add beautiful regional boundary polygon (as seen in the screenshot)
    L.polygon(JAIPUR_BOUNDARY, {
      color: '#3b82f6', // Rich civic blue
      weight: 3.5,
      fillColor: '#3b82f6',
      fillOpacity: 0.04,
      dashArray: '4, 4' // Elegant dash stroke
    }).addTo(map);

    mapRef.current = map;

    // Create separate groups for markers and heat overlays
    markersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);

    // Click handler for coordinates picking
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onSelectCoords) {
        onSelectCoords([e.latlng.lat, e.latlng.lng]);
      }
    });

    // Setup ResizeObserver to automatically adjust size and prevent grey tiles bug
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Staggered size updates to guarantee clean loading regardless of screen transitions/drawer states
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 550),
      setTimeout(() => map.invalidateSize(), 1200),
      setTimeout(() => map.invalidateSize(), 2000),
    ];

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      timers.forEach(t => clearTimeout(t));
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync center and zoom
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Handle Map Type Change (Google Street vs Google Satellite/Hybrid)
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    // Remove all current tile layers
    tileLayersRef.current.forEach(layer => layer.remove());
    tileLayersRef.current = [];

    if (mapType === 'satellite') {
      // High-fidelity up-to-date Google Hybrid map (Photographic satellite imagery with roads & labels)
      const satHybridLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });

      satHybridLayer.addTo(map);
      satHybridLayer.bringToBack();

      tileLayersRef.current = [satHybridLayer];
    } else {
      // High-fidelity up-to-date Google Maps Street layer
      const streetLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: 'Map data &copy; Google'
      });
      streetLayer.addTo(map);
      streetLayer.bringToBack();
      tileLayersRef.current = [streetLayer];
    }
  }, [mapType]);

  // Sync issues and markers
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const heatmapLayer = heatmapLayerRef.current;

    if (!map || !markersLayer || !heatmapLayer) return;

    // Clear previous markers and overlays
    markersLayer.clearLayers();
    heatmapLayer.clearLayers();

    // Render active issue pins
    issues.forEach(issue => {
      if (issue.duplicateOfIssueId) return; // Skip sub-duplicates to avoid map clutter

      const catIconInfo = getCategoryIcon(issue.category);
      const isUrgent = issue.priorityScore >= 75 || issue.isUrgent;
      const color = catIconInfo.color;
      const svgIcon = CATEGORY_ICONS[issue.category] || CATEGORY_ICONS['Public Infrastructure / Other'];
      const hasDuplicates = issue.duplicateCount > 0;

      let pinHtml = '';
      if (hasDuplicates) {
        // High fidelity duplicate count cluster pin (solid colored circle with white total count and translucent outer ring halo)
        pinHtml = `
          <div class="relative flex items-center justify-center" style="width: 32px; height: 32px; overflow: visible;">
            <div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer" 
                 style="background-color: ${color}; box-shadow: 0 0 0 7px ${color}4d, 0 4px 10px rgba(0,0,0,0.35);">
              ${issue.duplicateCount + 1}
            </div>
          </div>
        `;
      } else {
        // High fidelity category pin (solid circle with vector icon inside, and small status indicators/badges on top-right)
        pinHtml = `
          <div class="relative flex items-center justify-center" style="width: 32px; height: 32px; overflow: visible;">
            <div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white shadow-md hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer" 
                 style="background-color: ${color}; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <div class="w-4 h-4 flex items-center justify-center text-white font-bold">
                ${svgIcon}
              </div>
            </div>
            ${isUrgent ? `
              <span class="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-500 rounded-full border border-white flex items-center justify-center text-[10px] font-black text-white shadow-md animate-pulse">!</span>
            ` : `
              <span class="absolute -top-1 -right-1 w-4 h-4 bg-gray-600 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white shadow-md">1</span>
            `}
          </div>
        `;
      }

      const pinIcon = L.divIcon({
        className: 'custom-div-icon-wrapper',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([issue.lat, issue.lng], { icon: pinIcon });

      // Action on pin click
      if (onSelectIssue) {
        marker.on('click', () => {
          onSelectIssue(issue);
        });
      }

      // Quick tooltip summary
      marker.bindTooltip(`
        <div class="p-1 font-sans">
          <p class="font-semibold text-gray-950">${issue.title}</p>
          <p class="text-xs text-gray-500">${issue.category} • <span class="font-medium text-red-500">PS: ${issue.priorityScore}</span></p>
          <p class="text-[10px] bg-gray-100 text-gray-800 rounded px-1 mt-1 inline-block">${issue.status === 'Assigned' ? 'assigned in process' : issue.status === 'In Progress' ? 'in process' : issue.status}</p>
        </div>
      `, { permanent: false, direction: 'top' });

      markersLayer.addLayer(marker);

      // P2: Translucent heat circles overlay if heatmap is active
      if (heatmap) {
        // Higher priorityScore or duplicates count creates a larger/more opaque hotspot
        const radius = 100 + (issue.priorityScore * 3); // meters
        const opacity = 0.15 + (issue.duplicateCount * 0.1);

        const circle = L.circle([issue.lat, issue.lng], {
          radius,
          color,
          fillColor: color,
          fillOpacity: Math.min(opacity, 0.6),
          weight: 1
        });
        heatmapLayer.addLayer(circle);
      }
    });
  }, [issues, heatmap, onSelectIssue]);

  // Sync selected coord marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (selectedCoords) {
      const pinIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-white shadow-xl animate-bounce bg-black">
          📍
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      selectionMarkerRef.current = L.marker(selectedCoords, { icon: pinIcon }).addTo(map);
      map.panTo(selectedCoords);
    }
  }, [selectedCoords]);

  // Refetch size when viewport updates
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
    }
  }, [issues, selectedCoords]);

  const activeIssues = issues.filter(i => !i.duplicateOfIssueId);
  
  const getCount = (categoryKey: string) => {
    return activeIssues.filter(i => {
      if (categoryKey === 'Road Damage / Pothole') {
        return i.category === 'Road Damage / Pothole' || i.category === 'Road Damage';
      }
      if (categoryKey === 'Public Transit & Bus Stops') {
        return i.category === 'Public Transit & Bus Stops' || i.category === 'Public Infrastructure / Other' || i.category === 'Public Infrastructure';
      }
      return i.category === categoryKey;
    }).length;
  };

  const urgentCount = activeIssues.filter(i => i.priorityScore >= 75).length;
  const totalCount = activeIssues.length;

  const categoryConfig = [
    {
      key: 'Road Damage / Pothole',
      label: 'Road Damage',
      color: '#ef4444',
      bgClass: 'bg-red-500',
      icon: AlertTriangle,
    },
    {
      key: 'Water Leakage',
      label: 'Water Leakage',
      color: '#3b82f6',
      bgClass: 'bg-blue-500',
      icon: Droplet,
    },
    {
      key: 'Streetlight Problem',
      label: 'Streetlight Problems',
      color: '#f59e0b',
      bgClass: 'bg-amber-500',
      icon: Lightbulb,
    },
    {
      key: 'Garbage & Waste',
      label: 'Garbage & Waste',
      color: '#10b981',
      bgClass: 'bg-emerald-500',
      icon: Trash2,
    },
    {
      key: 'Drainage / Sewage',
      label: 'Drainage & Sewage',
      color: '#8b5cf6',
      bgClass: 'bg-purple-500',
      icon: Waves,
    },
    {
      key: 'Traffic & Road Signs',
      label: 'Traffic & Road Signs',
      color: '#f97316',
      bgClass: 'bg-orange-500',
      icon: AlertCircle,
    },
    {
      key: 'Parks & Recreation',
      label: 'Parks & Recreation',
      color: '#22c55e',
      bgClass: 'bg-green-500',
      icon: Trees,
    },
    {
      key: 'Stray Animals / Safety',
      label: 'Stray Animals / Safety',
      color: '#ec4899',
      bgClass: 'bg-pink-500',
      icon: Footprints,
    },
    {
      key: 'Air & Noise Pollution',
      label: 'Air & Noise Pollution',
      color: '#14b8a6',
      bgClass: 'bg-teal-500',
      icon: Wind,
    },
    {
      key: 'Vandalism & Graffiti',
      label: 'Vandalism & Graffiti',
      color: '#06b6d4',
      bgClass: 'bg-cyan-500',
      icon: Paintbrush,
    },
    {
      key: 'Public Transit & Bus Stops',
      label: 'Transit / Bus Stops',
      color: '#6366f1',
      bgClass: 'bg-indigo-500',
      icon: Bus,
    },
    {
      key: 'Public Health & Encroachments',
      label: 'Health & Encroachments',
      color: '#64748b',
      bgClass: 'bg-slate-500',
      icon: HeartPulse,
    },
  ];

  // Filter categories dynamically based on active issues
  const categoriesWithIssues = categoryConfig.filter(cat => getCount(cat.key) > 0);
  
  // Decide what to show: 
  // - If we have categories with active issues, we show exactly those categories.
  // - If there are NO categories with active issues, we show the top 3 default categories as a fallback.
  const visibleCategories = categoriesWithIssues.length > 0 
    ? categoriesWithIssues 
    : categoryConfig.slice(0, 3);

  // Automatically determine if the legend should be in compact mode or full size (self-adjusting)
  // - If there are more than 4 visible items, use compact layout (smaller max-height with scroll).
  // - If there are 4 or fewer items, use a relaxed full-size layout (no scroll, fits content perfectly).
  const isCompact = visibleCategories.length > 4;

  // Auto-expand the legend if there are active issues
  useEffect(() => {
    if (totalCount > 0) {
      setIsLegendExpanded(true);
    }
  }, [totalCount]);

  return (
    <div className="relative w-full h-full min-h-[300px] border border-gray-100 bg-gray-50 shadow-inner rounded-xl overflow-hidden">
      {/* Global overrides to prevent Leaflet clipping divIcons shadow or bounding box */}
      <style>{`
        .custom-div-icon-wrapper {
          background: transparent !important;
          border: none !important;
          overflow: visible !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      <div ref={mapContainerRef} className="w-full h-full" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />

      {/* Map Style Toggle (Top-Right) */}
      {!hideInnerMapTypeToggle && (
        <div className="absolute top-4 right-4 z-[1001] flex items-center bg-white rounded-xl shadow-lg border border-gray-100 p-0.5 pointer-events-auto">
          <button
            onClick={() => setMapType('street')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mapType === 'street'
                ? 'bg-[#10b981] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mapType === 'satellite'
                ? 'bg-[#10b981] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Satellite
          </button>
        </div>
      )}

      {/* Custom Map Controls (Zoom & Location Tracking) */}
      {/* On desktop, if rendering full screen map next to the sticky sidebar, we shift left to avoid overlaps! */}
      <div className={`absolute top-4 z-[1001] flex flex-col gap-2.5 pointer-events-auto transition-all duration-300 ${
        fullScreen ? 'md:left-[312px] left-4' : 'left-4'
      }`}>
        {/* Zoom Group */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-250/10 flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 active:bg-slate-100 transition border-b border-gray-100/80 font-bold"
            title="Zoom In"
          >
            <Plus size={18} className="stroke-[2.5]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 active:bg-slate-100 transition font-bold"
            title="Zoom Out"
          >
            <Minus size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {/* Locate Group */}
        <button
          onClick={handleLocate}
          className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-250/10 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 active:bg-slate-100 transition"
          title="Zoom to My Location"
        >
          <Locate size={18} className="stroke-[2.5]" />
        </button>
      </div>

      {/* Visual map legend overlay */}
      {!hideInnerLegend && (
        <div className={`absolute bottom-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl z-[1001] border border-gray-100/80 w-[290px] pointer-events-auto md:block hidden transition-all duration-300 ${
          fullScreen ? 'md:left-[312px] left-4' : 'left-4'
        }`}>
          {/* Header - Always visible with total count and toggle arrow */}
          <div 
            onClick={() => setIsLegendExpanded(!isLegendExpanded)}
            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors rounded-t-2xl select-none"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-950 text-sm">Issue Map Legend</h3>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50 flex items-center justify-center shrink-0">
                {totalCount}
              </span>
            </div>
            <button
              type="button"
              className="text-gray-500 hover:text-gray-800 transition p-1 hover:bg-slate-100/80 rounded-lg"
              onClick={(e) => {
                e.stopPropagation(); // Avoid double toggling since the parent header is also clickable
                setIsLegendExpanded(!isLegendExpanded);
              }}
              title={isLegendExpanded ? "Collapse Legend" : "Expand Legend"}
            >
              {isLegendExpanded ? (
                <ChevronDown size={18} className="stroke-[2.5]" />
              ) : (
                <ChevronUp size={18} className="stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Collapsible body content */}
          {isLegendExpanded && (
            <div className="px-4 pb-4 pt-1 border-t border-gray-100/80 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-[11px] text-gray-500 leading-relaxed mt-1">
                Click on any marker to view issue details and status.
              </p>

              <div 
                className={`space-y-2.5 overflow-y-auto pr-1.5 custom-scrollbar transition-all duration-350 ${
                  isCompact 
                    ? 'max-h-[190px]' 
                    : 'max-h-[calc(100vh-290px)] md:max-h-[420px]'
                }`}
              >
                {visibleCategories.map((cat) => {
                  const count = getCount(cat.key);
                  const Icon = cat.icon;
                  return (
                    <div key={cat.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full ${cat.bgClass} flex items-center justify-center text-white shadow-sm shrink-0`}>
                          <Icon size={13} className="stroke-[2.5]" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-800 bg-gray-100/90 w-8 h-6 rounded-full flex items-center justify-center shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm">
                      <AlertTriangle size={13} className="stroke-[2.5]" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-600 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white">
                      !
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Urgent (Score ≥ 75)</span>
                </div>
                <span className="text-xs font-bold text-gray-800 bg-gray-100/90 w-8 h-6 rounded-full flex items-center justify-center shrink-0">
                  {urgentCount}
                </span>
              </div>

              <div className="bg-emerald-50 border border-emerald-100/60 rounded-xl p-3 flex items-center justify-between mt-1">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                    <Check size={14} className="stroke-[3]" />
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800">Total Active Issues</span>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 mr-1 shrink-0">
                  {totalCount}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
