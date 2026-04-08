'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import { initiatieven, gemeenten, getGemeente } from '@/lib/data';
import { getMarkerLocation } from '@/components/Map';
import { PDF_FILTERS, PDF_FILTER_GROUPS, SDG_FILTERS, type PdfFilterId, type PdfFilter } from '@/lib/pdfFilters';
import { getPdfFilterIdsForInitiatief } from '@/lib/pdfTagging';
import type { Initiatief } from '@/lib/types';

// Leaflet must be loaded client-side only
const Map = dynamic(() => import('@/components/Map'), { ssr: false });

function SdgLegenda({
  markerColors,
  filtered,
  pdfFiltersByInitiatiefId,
}: {
  markerColors: Record<number, string>;
  filtered: Initiatief[];
  pdfFiltersByInitiatiefId: globalThis.Map<number, PdfFilterId[]>;
}) {
  const [open, setOpen] = useState(true);

  // Only show SDGs that are actually present in the filtered initiatives
  const activeSdgs = useMemo(() => {
    const usedColors = new Set(filtered.map((i) => markerColors[i.id]).filter(Boolean));
    return SDG_FILTERS.filter((f) => f.color && usedColors.has(f.color));
  }, [filtered, markerColors]);

  if (activeSdgs.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-3 z-[1000]">
      <div className="bg-white/95 backdrop-blur shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-xs font-semibold text-[#829362]">SDG-legenda</span>
          <svg
            className={`w-3.5 h-3.5 text-gray-400 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="px-3 pb-2.5 space-y-1.5 max-h-48 overflow-y-auto">
            {activeSdgs.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: f.color }}
                />
                <span className="text-[11px] text-gray-600 leading-tight">{f.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0 bg-[#9cc47c]" />
              <span className="text-[11px] text-gray-400 leading-tight">Geen SDG-match</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KaartPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') ? Number(searchParams.get('id')) : null;
  const initialFiltersParam = searchParams.get('filters') || '';

  const [selectedId, setSelectedId] = useState<number | null>(initialId);
  const [filterGemeente, setFilterGemeente] = useState('');
  const [selectedPdfFilters, setSelectedPdfFilters] = useState<PdfFilterId[]>(
    initialFiltersParam
      ? (initialFiltersParam
          .split(',')
          .map((s) => s.trim())
          .filter((id): id is PdfFilterId => [...PDF_FILTERS, ...SDG_FILTERS].some((f) => f.id === id)))
      : []
  );
  const [showFilters, setShowFilters] = useState(false);

  const pdfFiltersByInitiatiefId = useMemo(() => {
    const lookup = new globalThis.Map<number, PdfFilterId[]>();
    initiatieven.forEach((i) => {
      lookup.set(i.id, getPdfFilterIdsForInitiatief(i));
    });
    return lookup;
  }, []);

  const markerColors = useMemo(() => {
    const colors: Record<number, string> = {};
    const selectedSdgFilters = SDG_FILTERS.filter((f: PdfFilter) => f.color && selectedPdfFilters.includes(f.id));

    initiatieven.forEach((i) => {
      const tags = pdfFiltersByInitiatiefId.get(i.id) || [];
      // If SDG filters are active, color by the first selected SDG that matches
      const pool = selectedSdgFilters.length > 0 ? selectedSdgFilters : SDG_FILTERS;
      const match = (pool as PdfFilter[]).find((f) => f.color && tags.includes(f.id));
      if (match?.color) colors[i.id] = match.color;
    });
    return colors;
  }, [pdfFiltersByInitiatiefId, selectedPdfFilters]);

  const filtered = useMemo(() => {
    let result = initiatieven;
    if (selectedPdfFilters.length > 0) {
      result = result.filter((i) => {
        const tags = pdfFiltersByInitiatiefId.get(i.id) || [];
        return tags.some((t) => selectedPdfFilters.includes(t));
      });
    }
    if (filterGemeente) {
      result = result.filter((i) => getGemeente(i) === filterGemeente);
    }
    return result.sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
  }, [selectedPdfFilters, filterGemeente, pdfFiltersByInitiatiefId]);

  const [opDeKaart, heleProvincie] = useMemo(() => {
    const kaart: Initiatief[] = [];
    const provincie: Initiatief[] = [];
    filtered.forEach((i) => {
      const loc = getMarkerLocation(i);
      if (loc.type === 'onbekend') provincie.push(i);
      else kaart.push(i);
    });
    return [kaart, provincie];
  }, [filtered]);

  const [fromList, setFromList] = useState(false);
  const [showProvincieBanner, setShowProvincieBanner] = useState(false);

  const handleSelect = useCallback((item: Initiatief) => {
    setFromList(false); // clicked from map
    setSelectedId(item.id);
  }, []);

  const handleListSelect = useCallback((id: number) => {
    setFromList(true); // clicked from sidebar list
    setSelectedId(id);
  }, []);

  const selectedItem = selectedId
    ? initiatieven.find((i) => i.id === selectedId) || null
    : null;

  return (
    <div className="h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-full lg:w-96 bg-white border-r border-gray-100 flex flex-col overflow-hidden z-10">
          {/* Search + Filters */}
          <div className="p-4 border-b border-gray-100">
            <SearchBar
              initiatieven={initiatieven}
              onSelect={handleSelect}
              placeholder="Zoek initiatief..."
            />

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  showFilters || selectedPdfFilters.length > 0 || filterGemeente
                    ? 'bg-[#6b7a4f] text-white shadow-sm'
                    : 'bg-[#829362] text-white hover:bg-[#6b7a4f]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(selectedPdfFilters.length > 0 || filterGemeente) && (
                  <span className="bg-white text-[#829362] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {selectedPdfFilters.length + (filterGemeente ? 1 : 0)}
                  </span>
                )}
              </button>

              {(selectedPdfFilters.length > 0 || filterGemeente) && (
                <button
                  onClick={() => {
                    setSelectedPdfFilters([]);
                    setFilterGemeente('');
                  }}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Reset
                </button>
              )}

              <span className="ml-auto text-sm text-gray-500 font-medium">
                {filtered.length} resultaten
              </span>
            </div>

            {showFilters && (
              <div className="mt-3 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                <select
                  value={filterGemeente}
                  onChange={(e) => setFilterGemeente(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:border-[#9cc47c] focus:outline-none"
                >
                  <option value="">Alle gemeenten</option>
                  {gemeenten.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <div className="space-y-1">
                  <div className="text-[11px] text-gray-500">Onderwerpen (multi)</div>
                  {PDF_FILTER_GROUPS.map((g) => (
                    <div key={g.id} className="pt-2">
                      <div className="text-[11px] font-semibold text-gray-500">{g.label}</div>
                      <div className="mt-1 space-y-1">
                        {g.filters.map((f) => {
                          const checked = selectedPdfFilters.includes(f.id);
                          return (
                            <label
                              key={f.id}
                              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setSelectedPdfFilters((prev) => {
                                    if (prev.includes(f.id)) return prev.filter((x) => x !== f.id);
                                    return [...prev, f.id];
                                  });
                                }}
                              />
                              {f.color && (
                                <span
                                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: f.color }}
                                />
                              )}
                              <span className="truncate">{f.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results list */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-[#9cc47c]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-[#9cc47c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">Geen resultaten</p>
                <p className="text-xs text-gray-400 mt-1">Probeer andere filters of een andere gemeente.</p>
              </div>
            )}

            {opDeKaart.map((item) => (
              <button
                key={item.id}
                onClick={() => handleListSelect(item.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                  selectedId === item.id
                    ? 'bg-[#9cc47c]/10 border-l-2 border-l-[#9cc47c]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold text-[15px] text-[#829362]">{item.naam}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-[#9cc47c]/10 text-[#6b7a4f] px-2 py-0.5 rounded-full font-medium">
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-500">{item.gemeente}</span>
                </div>
              </button>
            ))}

            {heleProvincie.length > 0 && (
              <button
                onClick={() => setShowProvincieBanner(true)}
                className="w-full text-left px-4 py-3 bg-[#9cc47c]/5 border-y border-[#9cc47c]/20 hover:bg-[#9cc47c]/10 transition-colors flex items-center gap-2"
              >
                <span className="text-base">🌍</span>
                <span className="text-sm text-[#829362] font-medium">
                  {heleProvincie.length} provinciebrede initiatieven
                </span>
                <svg className="w-3.5 h-3.5 text-[#9cc47c] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <Map
            initiatieven={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            fromList={fromList}
            markerColors={markerColors}
          />

          {/* SDG Legend */}
          <SdgLegenda markerColors={markerColors} filtered={filtered} pdfFiltersByInitiatiefId={pdfFiltersByInitiatiefId} />

          {/* Province-wide initiatives banner */}
          {heleProvincie.length > 0 && !showProvincieBanner && (
            <button
              onClick={() => setShowProvincieBanner(true)}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-[#9cc47c]/30 hover:shadow-xl transition-shadow cursor-pointer"
            >
              <span className="text-sm">🌍</span>
              <span className="text-xs font-medium text-[#829362]">
                {heleProvincie.length} initiatieven zonder vaste locatie
              </span>
            </button>
          )}

          {/* Province-wide initiatives expanded card */}
          {showProvincieBanner && heleProvincie.length > 0 && (
            <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur shadow-xl rounded-xl border border-gray-200 w-80 max-h-[70vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌍</span>
                  <span className="text-sm font-semibold text-[#829362]">
                    Provinciebrede initiatieven
                  </span>
                  <span className="text-[10px] bg-[#9cc47c] text-white px-1.5 py-0.5 rounded-full">
                    {heleProvincie.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowProvincieBanner(false)}
                  className="text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2} strokeLinecap="round" />
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <p className="px-4 py-2 text-[11px] text-gray-400">
                Deze initiatieven zijn actief in de hele provincie Groningen en niet aan één locatie gebonden.
              </p>
              <div className="flex-1 overflow-y-auto min-h-0">
                {heleProvincie.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedId(item.id);
                      setShowProvincieBanner(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 border-b border-gray-50 transition-colors ${
                      selectedId === item.id
                        ? 'bg-[#9cc47c]/10'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm text-[#829362]">{item.naam}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-[#9cc47c]/10 text-[#9cc47c] px-2 py-0.5 rounded-full">
                        {item.type}
                      </span>
                    </div>
                    {item.beschrijving && (
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{item.beschrijving}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile selected item detail */}
      {selectedItem && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-[#829362]">{selectedItem.naam}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block text-xs bg-[#9cc47c]/10 text-[#9cc47c] px-2 py-0.5 rounded-full">
                  {selectedItem.type}
                </span>
                {heleProvincie.some((i) => i.id === selectedItem.id) && (
                  <span className="text-[10px] text-[#9cc47c]">🌍 Hele provincie</span>
                )}
              </div>
              {selectedItem.beschrijving && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{selectedItem.beschrijving}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
