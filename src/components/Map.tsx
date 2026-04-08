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
  const clusterGroupRef = useRef<any>(null);
  const lastListPanTargetRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet.markercluster');
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
          className: '',
          html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
            <div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>
          </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        // Remove old cluster group
        if (clusterGroupRef.current) {
          map.removeLayer(clusterGroupRef.current);
        }
        markersMapRef.current = {};

        // Create new cluster group
        const LTyped = L as any;
        const clusterGroup = LTyped.markerClusterGroup({
          maxClusterRadius: 40,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          animate: true,
          animateAddingMarkers: false,
          spiderfyDistanceMultiplier: 1.5,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            const markers = cluster.getAllChildMarkers();
            // Use the most common color in the cluster
            const colorCounts: Record<string, number> = {};
            markers.forEach((m: any) => {
              const c = m.options._color || '#9cc47c';
              colorCounts[c] = (colorCounts[c] || 0) + 1;
            });
            const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '#9cc47c';
            return LTyped.divIcon({
              className: '',
              html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                <div style="width:36px;height:36px;background:${dominantColor};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
                  <span style="color:white;font-size:11px;font-weight:700;font-family:system-ui,sans-serif;">${count}</span>
                </div>
              </div>`,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });
          },
        });

        initiatieven.forEach((item) => {
          const loc = getMarkerLocation(item);
          if (loc.type === 'onbekend') return;

          const color = (markerColors && markerColors[item.id]) || '#9cc47c';
          const icon = makeIcon(color);
          const marker = L.marker(loc.coords, { icon, _color: color } as any);

          marker.bindPopup(buildPopupHtml(item, color), {
            maxWidth: 310,
            className: 'zg-popup',
          });

          marker.on('click', () => {
            marker.openPopup();
            onSelect(item);
          });

          clusterGroup.addLayer(marker);
          markersMapRef.current[item.id] = marker;
        });

        map.addLayer(clusterGroup);
        clusterGroupRef.current = clusterGroup;

        // --- HANDLE SELECTION from list ---
        if (!fromList) {
          lastListPanTargetRef.current = null;
        }

        if (selectedId && fromList && markersMapRef.current[selectedId] && lastListPanTargetRef.current !== selectedId) {
          const m = markersMapRef.current[selectedId];
          // Zoom out cluster if needed
          clusterGroup.zoomToShowLayer(m, () => {
            m.openPopup();
          });
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
      <div id="map-container" className="absolute inset-0" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-gray-400">Kaart laden...</div>
        </div>
      )}
    </div>
  );
}
