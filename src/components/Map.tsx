'use client';

import { useEffect, useRef, useState } from 'react';
import type { Initiatief } from '@/lib/types';
import { getLocatieType } from '@/lib/location';

interface MapProps {
  initiatieven: Initiatief[];
  selectedId: number | null;
  onSelect: (initiatief: Initiatief) => void;
  /** Set to true when selection came from clicking the sidebar list */
  fromList?: boolean;
  /** Per-initiative marker color, keyed by initiative id */
  markerColors?: Record<number, string>;
}

const geocodeCache: Record<string, [number, number]> = {
  'Groningen': [53.2194, 6.5665], 'Delfzijl': [53.33, 6.9167], 'Appingedam': [53.3211, 6.8582],
  'Winsum': [53.3315, 6.5134], 'Hoogezand': [53.1616, 6.7617], 'Sappemeer': [53.15, 6.7833],
  'Winschoten': [53.1441, 7.034], 'Stadskanaal': [52.9889, 6.9448], 'Veendam': [53.1061, 6.8793],
  'Grootegast': [53.2083, 6.2724], 'Uithuizen': [53.4042, 6.674], 'Opende': [53.1405, 6.2214],
  'Vinkhuizen': [53.231, 6.5333], 'Lewenborg': [53.2355, 6.601], 'Oosterparkwijk': [53.214, 6.583],
  'Ten Boer': [53.28, 6.695], 'Farmsum': [53.32, 6.94], 'Selwerd': [53.234, 6.553],
  'Grunobuurt': [53.207, 6.557], 'Oosterpoort': [53.2085, 6.565], 'Rivierenbuurt': [53.198, 6.56],
  'Slochteren': [53.2167, 6.8], 'Oude Pekela': [53.0981, 7.0048], 'Nieuwe Pekela': [53.0819, 7.026],
  'Loppersum': [53.3333, 6.75], 'Warffum': [53.3913, 6.5617], 'Zuidwolde': [53.2986, 6.6094],
  'Garrelsweer': [53.3, 6.8], "'t Zandt": [53.36, 6.77], 'Heiligerlee': [53.15, 7.05],
  'Finsterwolde': [53.1867, 7.0683], 'Musselkanaal': [52.94, 7.02], 'Vlagtwedde': [53.04, 7.1],
  'Ter Apel': [52.868, 7.067], 'Leek': [53.1648, 6.3793], 'Marum': [53.1417, 6.2583],
  'Zuidhorn': [53.2453, 6.4012], 'Bedum': [53.3, 6.6], 'Scheemda': [53.1669, 6.9756],
  'Bad Nieuweschans': [53.1766, 7.2128], 'Kolham': [53.19, 6.73], 'Haren': [53.1711, 6.6071],
  'Onstwedde': [53.0167, 7.05], 'Alteveer': [53.0, 6.9], 'De Hoogte': [53.224, 6.55],
  'De Wijert': [53.195, 6.56], 'Oranjebuurt': [53.22, 6.57], 'Beijum': [53.25, 6.59],
  'Glimmen': [53.13, 6.62], 'Korrewegwijk': [53.228, 6.57], 'Paddepoel': [53.238, 6.542],
  'Hoogkerk': [53.215, 6.5], 'Westpark': [53.22, 6.52], 'Kardinge': [53.246, 6.61],
  'Schilderswijk': [53.21, 6.56], 'Indische Buurt': [53.219, 6.575], 'Muntendam': [53.12, 6.82],
  'Noordbroek': [53.17, 6.81], 'Grijpskerk': [53.26, 6.3], 'Aduard': [53.25, 6.46],
  'Blijham': [53.11, 7.02], 'Bellingwolde': [53.1167, 7.1167], 'Holwierde': [53.3583, 6.8783],
  'Middelstum': [53.35, 6.6417], 'Bierum': [53.365, 6.8333], 'Spijk': [53.3917, 6.85],
  'Tuikwerd': [53.33, 6.9], 'Woldendorp': [53.2817, 6.9633], 'Kloosterburen': [53.395, 6.36],
  'Uithuizermeeden': [53.42, 6.72], 'Baflo': [53.36, 6.52], 'Den Andel': [53.38, 6.55],
  'Sauwerd': [53.3, 6.55], 'Ulrum': [53.37, 6.32], 'Adorp': [53.28, 6.52],
  'Wetsinge': [53.29, 6.53], 'Wedde': [53.08, 7.07], 'Wedderveer': [53.08, 7.05],
  'Veelerveen': [53.05, 7.06], 'Vriescheloo': [53.06, 7.03], 'Wehe-den Hoorn': [53.37, 6.4],
  'Froukemaheerd': [53.25, 6.58],
};

export type MarkerLocatieType = 'precies' | 'bijBenadering' | 'onbekend';

export function getMarkerLocation(item: Initiatief): {
  coords: [number, number];
  type: MarkerLocatieType;
  matchedPlace?: string;
} {
  if (item.lat && item.lng) {
    return { coords: [item.lat, item.lng], type: 'precies' };
  }
  return { coords: [53.22, 6.57], type: 'onbekend' };
}

export default function Map({ initiatieven, selectedId, onSelect, fromList, markerColors }: MapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersMapRef = useRef<Record<number, any>>({});
  const lastListPanTargetRef = useRef<number | null>(null);

  // Single effect: init map once, update markers when data changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        if (cancelled) return;

        const container = document.getElementById('map-container');
        if (!container) return;

        // --- INIT MAP (only once) ---
        if (!mapInstanceRef.current) {
          const map = L.map(container, {
            center: [53.22, 6.57],
            zoom: 10,
            zoomControl: true,
            doubleClickZoom: false,
            boxZoom: false,
            fadeAnimation: false,
            zoomAnimation: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 18,
          }).addTo(map);

          mapInstanceRef.current = map;

          // Leaflet geeft vaak een "leeg" canvas als de container initieel geen hoogte heeft.
          // invalidateSize forceert een herberekening zodra de layout is gezet.
          requestAnimationFrame(() => {
            if (cancelled) return;
            setTimeout(() => {
              if (cancelled) return;
              map.invalidateSize();
              setMapReady(true);
            }, 100);
          });
        }

        const map = mapInstanceRef.current;

        // --- UPDATE MARKERS (when initiatieven change) ---
        const makeIcon = (color: string) => L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;cursor:pointer;"><div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;"></div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        // Remove old markers
        Object.values(markersMapRef.current).forEach((m: any) => map.removeLayer(m));
        markersMapRef.current = {};

        initiatieven.forEach((item) => {
          const loc = getMarkerLocation(item);
          if (loc.type === 'onbekend') return;

          const color = (markerColors && markerColors[item.id]) || '#9cc47c';
          const icon = makeIcon(color);
          const marker = L.marker(loc.coords, { icon }).addTo(map);

          const locationNote =
            loc.type === 'bijBenadering'
              ? '<p style="margin:4px 0 0;font-size:11px;color:#9cc47c;">ℹ️ Locatie bij benadering</p>'
              : '';

          marker.bindPopup(
            `<div style="min-width:200px;max-width:300px;">
              <h3 style="margin:0 0 4px;font-weight:600;color:#829362;font-size:14px;">${item.naam}</h3>
              <div style="display:inline-block;background:#9cc47c;color:white;padding:1px 8px;border-radius:12px;font-size:11px;margin-bottom:6px;">${item.type}</div>
              <p style="margin:6px 0 4px;font-size:12px;color:#555;line-height:1.4;">${item.beschrijving ? item.beschrijving.substring(0, 150) + (item.beschrijving.length > 150 ? '...' : '') : ''}</p>
              ${item.gemeente ? `<p style="margin:2px 0;font-size:11px;color:#888;">📍 ${item.gemeente}</p>` : ''}
              ${item.adres ? `<p style="margin:2px 0;font-size:11px;color:#888;">${item.adres}</p>` : ''}
              ${locationNote}
              ${item.website ? `<p style="margin:4px 0 0;"><a href="${item.website.startsWith('http') ? item.website : 'https://' + item.website}" target="_blank" rel="noopener" style="color:#9cc47c;font-size:11px;">🌐 Website</a></p>` : ''}
              ${item.telefoon ? `<p style="margin:2px 0;font-size:11px;color:#888;">📞 ${item.telefoon}</p>` : ''}
              ${item.email ? `<p style="margin:2px 0;font-size:11px;color:#888;">✉️ ${item.email}</p>` : ''}
            </div>`,
            { maxWidth: 300 }
          );

          marker.on('click', () => {
            marker.openPopup();
            onSelect(item);
          });

          markersMapRef.current[item.id] = marker;
        });

        // --- HANDLE SELECTION from list (pan, no zoom) ---
        if (!fromList) {
          lastListPanTargetRef.current = null;
        }

        if (selectedId && fromList && markersMapRef.current[selectedId] && lastListPanTargetRef.current !== selectedId) {
          const m = markersMapRef.current[selectedId];
          map.panTo(m.getLatLng(), { animate: true });
          setTimeout(() => m.openPopup(), 300);
          lastListPanTargetRef.current = selectedId;
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Leaflet init/update failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [initiatieven, selectedId, fromList, onSelect, markerColors]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[320px]">
      <div id="map-container" className="absolute inset-0" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Kaart laden...</div>
        </div>
      )}
    </div>
  );
}
