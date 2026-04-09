'use client';

import { useEffect, useRef, useState } from 'react';
import type { Initiatief } from '@/lib/types';

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
  'Oldambt': [53.13, 7.02], 'Westerkwartier': [53.18, 6.3], 'Midden-Groningen': [53.16, 6.77],
  'Eemsdelta': [53.33, 6.9], 'Het Hogeland': [53.38, 6.55], 'Pekela': [53.09, 7.01],
  'Veenkoloniën': [53.08, 6.93], 'Westerwolde': [52.98, 7.05],
  'Groningen stad': [53.2194, 6.5665], 'Groningen (stad)': [53.2194, 6.5665],
  'stad Groningen': [53.2194, 6.5665],
};

export type MarkerLocatieType = 'precies' | 'bijBenadering' | 'onbekend';

function parsePlaceNames(gemeente: string): string[] {
  return gemeente
    .split(/[\/,\+]/)
    .map((s) => s.replace(/[\(\[].*?[\)\]]/g, '').trim())
    .filter(Boolean);
}

function jitter(id: number): [number, number] {
  const angle = (id * 137.508) % 360;
  const radius = 0.0003 + (id % 5) * 0.0001;
  return [
    radius * Math.sin((angle * Math.PI) / 180),
    radius * Math.cos((angle * Math.PI) / 180),
  ];
}

const NO_FIXED_ADDRESS = ['via website', 'diverse locatie', 'mobiel door', 'op afspraak',
  'landelijk', 'provinciaal', 'gehele provincie', 'wisselende', 'postbus',
  'locatie op aanvraag', 'aan huis', 'thuisbezoek'];

export function getMarkerLocation(item: Initiatief): {
  coords: [number, number];
  type: MarkerLocatieType;
  matchedPlace?: string;
} {
  const adresLower = (item.adres || '').toLowerCase();
  if (NO_FIXED_ADDRESS.some((k) => adresLower.includes(k))) {
    return { coords: [53.22, 6.57], type: 'onbekend' };
  }

  if (item.lat && item.lng) {
    return { coords: [item.lat, item.lng], type: 'precies' };
  }

  return { coords: [53.22, 6.57], type: 'onbekend' };
}

function buildPopupHtml(item: Initiatief, color: string): string {
  const website = item.website
    ? `<a href="${item.website.startsWith('http') ? item.website : 'https://' + item.website}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:4px;color:${color};font-size:12px;text-decoration:none;font-weight:500;">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        Website
      </a>`
    : '';
  const telefoon = item.telefoon
    ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#6b7280;font-size:12px;">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.12.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0122 14.9v2.02z"/></svg>
        ${item.telefoon}
      </span>`
    : '';
  const beschrijving = item.beschrijving
    ? `<p style="margin:8px 0 0;font-size:12px;color:#4b5563;line-height:1.5;">${item.beschrijving.substring(0, 160)}${item.beschrijving.length > 160 ? '…' : ''}</p>`
    : '';
  const meta = [
    item.gemeente ? `<span style="color:#6b7280;font-size:11px;">📍 ${item.gemeente}${item.adres ? ' · ' + item.adres : ''}</span>` : '',
  ].filter(Boolean).join('');

  return `
    <div style="min-width:220px;max-width:300px;font-family:system-ui,sans-serif;">
      <div style="background:${color};border-radius:10px 10px 0 0;padding:12px 14px;margin:-1px -1px 0;">
        <div style="font-size:11px;background:rgba(255,255,255,0.25);color:white;display:inline-block;padding:2px 8px;border-radius:20px;font-weight:600;margin-bottom:4px;">${item.type}</div>
        <h3 style="margin:0;font-size:14px;font-weight:700;color:white;line-height:1.3;">${item.naam}</h3>
      </div>
      <div style="padding:10px 14px 12px;background:white;border-radius:0 0 10px 10px;border:1px solid #e5e7eb;border-top:none;">
        ${meta ? `<div style="margin-bottom:6px;">${meta}</div>` : ''}
        ${beschrijving}
        ${website || telefoon ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;">${website}${telefoon}</div>` : ''}
      </div>
    </div>`;
}

export default function Map({ initiatieven, selectedId, onSelect, fromList, markerColors }: MapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapInstanceRef = useRef<any>(null);
  const markersMapRef = useRef<Record<number, any>>({});
  const markerLayerRef = useRef<any[]>([]);
  const lastListPanTargetRef = useRef<number | null>(null);

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
            fadeAnimation: true,
            zoomAnimation: true,
            zoomAnimationThreshold: 4,
            markerZoomAnimation: true,
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 18,
          }).addTo(map);

          mapInstanceRef.current = map;

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

        // --- UPDATE MARKERS ---
        const makeIcon = (color: string) => L.divIcon({
          className: 'zg-marker',
          html: `<div style="width:16px;height:16px;background:${color};border:2.5px solid white;border-radius:50%;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        // Remove old markers
        markerLayerRef.current.forEach((m) => map.removeLayer(m));
        markerLayerRef.current = [];
        markersMapRef.current = {};

        // Place each marker at its exact geocoded coordinate
        initiatieven.forEach((item) => {
          const loc = getMarkerLocation(item);
          if (loc.type === 'onbekend') return;

          const [lat, lng] = loc.coords;
          const color = (markerColors && markerColors[item.id]) || '#9cc47c';
          const icon = makeIcon(color);
          const marker = L.marker([lat, lng], { icon } as any);

          marker.bindPopup(buildPopupHtml(item, color), {
            maxWidth: 310,
            className: 'zg-popup',
          });

          marker.on('click', () => {
            marker.openPopup();
            onSelect(item);
          });

          marker.addTo(map);
          markerLayerRef.current.push(marker);
          markersMapRef.current[item.id] = marker;
        });

        // --- HANDLE SELECTION from list ---
        if (!fromList) {
          lastListPanTargetRef.current = null;
        }

        if (selectedId && fromList && markersMapRef.current[selectedId] && lastListPanTargetRef.current !== selectedId) {
          const m = markersMapRef.current[selectedId];
          map.panTo(m.getLatLng());
          m.openPopup();
          lastListPanTargetRef.current = selectedId;
        }
      } catch (err) {
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
      <div id="map-container" className="absolute inset-0 min-h-[200px]" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Kaart laden...</div>
        </div>
      )}
    </div>
  );
}
