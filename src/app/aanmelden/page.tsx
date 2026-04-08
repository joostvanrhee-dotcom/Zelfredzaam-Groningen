'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { PDF_FILTER_GROUPS, type PdfFilterId } from '@/lib/pdfFilters';
import { gemeenten, initiatieven } from '@/lib/data';
import { getPdfFilterIdsForInitiatief } from '@/lib/pdfTagging';
import type { Initiatief } from '@/lib/types';

type Soort = 'nieuw' | 'wijziging' | 'afmelding';

export default function AanmeldenPage() {
  const [soort, setSoort] = useState<Soort>('nieuw');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedPdfFilters, setSelectedPdfFilters] = useState<PdfFilterId[]>([]);

  // Search & select state for wijziging/afmelding
  const [zoekTerm, setZoekTerm] = useState('');
  const [geselecteerdInitiatief, setGeselecteerdInitiatief] = useState<Initiatief | null>(null);

  const zoekResultaten = useMemo(() => {
    if (zoekTerm.length < 2) return [];
    const q = zoekTerm.toLowerCase();
    return initiatieven
      .filter(
        (i) =>
          i.naam.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          i.gemeente.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [zoekTerm]);

  function selectInitiatief(item: Initiatief) {
    setGeselecteerdInitiatief(item);
    setZoekTerm('');
    if (soort === 'wijziging') {
      setSelectedPdfFilters(getPdfFilterIdsForInitiatief(item));
    }
  }

  function resetSelectie() {
    setGeselecteerdInitiatief(null);
    setZoekTerm('');
    setSelectedPdfFilters([]);
  }

  // Reset selectie when switching soort
  function handleSoortChange(newSoort: Soort) {
    setSoort(newSoort);
    resetSelectie();
    setError('');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if ((soort === 'wijziging' || soort === 'afmelding') && !geselecteerdInitiatief) {
      setSubmitting(false);
      setError('Selecteer eerst een initiatief.');
      return;
    }

    if (soort !== 'afmelding' && selectedPdfFilters.length === 0) {
      setSubmitting(false);
      setError('Kies minimaal één onderwerp/filters.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((val, key) => {
      data[key] = val.toString();
    });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soort,
          initiatiefId: geselecteerdInitiatief?.id,
          naam: data.naam || geselecteerdInitiatief?.naam,
          ...data,
          filters: selectedPdfFilters,
        }),
      });

      if (!res.ok) throw new Error('Verzenden mislukt');
      setSubmitted(true);
    } catch {
      setError('Er ging iets mis bij het verzenden. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    const bevestigingTekst = {
      nieuw: {
        titel: 'Aanmelding ontvangen!',
        tekst: 'Je nieuwe initiatief is succesvol ingediend. Een beheerder zal je aanvraag beoordelen en goed- of afkeuren. Je ontvangt hierover bericht.',
      },
      wijziging: {
        titel: 'Wijziging ontvangen!',
        tekst: 'Je wijzigingsverzoek is succesvol ingediend. Een beheerder zal de wijziging beoordelen en goed- of afkeuren voordat deze wordt doorgevoerd.',
      },
      afmelding: {
        titel: 'Afmelding ontvangen!',
        tekst: 'Je afmelding is succesvol ingediend. Een beheerder zal dit verzoek beoordelen voordat het initiatief van de kaart wordt verwijderd.',
      },
    }[soort];

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-[#9cc47c]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#829362]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#829362]">{bevestigingTekst.titel}</h2>
            <p className="mt-2 text-gray-600">{bevestigingTekst.tekst}</p>
            <div className="mt-4 bg-[#9cc47c]/10 border border-[#9cc47c]/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 justify-center">
                <svg className="w-5 h-5 text-[#829362] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[#829362]">
                  Status: <span className="font-medium">In afwachting van goedkeuring</span>
                </p>
              </div>
            </div>
            <a href="/" className="mt-6 inline-block text-[#9cc47c] hover:underline">
              Terug naar home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const needsSearch = soort === 'wijziging' || soort === 'afmelding';
  const gi = geselecteerdInitiatief; // shorthand

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF7DE]">
      <Navbar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#829362]">
          Initiatief aanmelden
        </h1>
        <p className="mt-2 text-gray-600">
          Werkt u bij een initiatief dat armoede bestrijdt in Groningen? Meld uw organisatie hier aan.
          Na beoordeling verschijnt het op de kaart.
        </p>

        {/* Soort keuze */}
        <div className="mt-6 flex gap-2">
          {([
            ['nieuw', 'Nieuw initiatief'],
            ['wijziging', 'Wijziging'],
            ['afmelding', 'Afmelding'],
          ] as [Soort, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSoortChange(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                soort === value
                  ? 'bg-[#829362] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Search & select for wijziging/afmelding */}
          {needsSearch && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-[#829362]">
                {soort === 'wijziging' ? 'Welk initiatief wil je wijzigen?' : 'Welk initiatief wil je afmelden?'}
              </h3>

              {!gi ? (
                <div className="relative">
                  <input
                    type="text"
                    value={zoekTerm}
                    onChange={(e) => setZoekTerm(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                    placeholder="Zoek op naam, type of gemeente..."
                  />
                  {zoekResultaten.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                      {zoekResultaten.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectInitiatief(item)}
                          className="w-full text-left px-4 py-3 hover:bg-[#9cc47c]/5 border-b border-gray-50 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-sm text-[#829362]">{item.naam}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-[#9cc47c]/10 text-[#9cc47c] px-2 py-0.5 rounded-full">
                              {item.type}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.gemeente}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {zoekTerm.length >= 2 && zoekResultaten.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 text-sm text-gray-400">
                      Geen initiatieven gevonden voor &ldquo;{zoekTerm}&rdquo;
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-[#9cc47c]/5 border border-[#9cc47c]/20 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-[#829362]">{gi.naam}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-[#9cc47c]/10 text-[#9cc47c] px-2 py-0.5 rounded-full">
                        {gi.type}
                      </span>
                      <span className="text-[10px] text-gray-400">{gi.gemeente}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSelectie}
                    className="text-gray-400 hover:text-gray-600 text-xs underline"
                  >
                    Wijzig
                  </button>
                </div>
              )}
              {/* Hidden field to pass initiatiefId */}
              {gi && <input type="hidden" name="initiatiefId" value={gi.id} />}
            </div>
          )}

          {/* Initiatief gegevens */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
            {soort === 'nieuw' && (
              <h3 className="font-semibold text-[#829362]">Over het initiatief</h3>
            )}
            {soort === 'wijziging' && gi && (
              <h3 className="font-semibold text-[#829362]">Gegevens aanpassen</h3>
            )}

            {/* For nieuw: naam is required. For wijziging: pre-filled, hidden naam field */}
            {soort === 'nieuw' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naam initiatief *
                </label>
                <input
                  name="naam"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  placeholder="Bijv. Voedselbank Groningen"
                />
              </div>
            )}
            {soort === 'wijziging' && gi && (
              <input type="hidden" name="naam" value={gi.naam} />
            )}

            {(soort === 'nieuw' || (soort === 'wijziging' && gi)) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type initiatief
                  </label>
                  <input
                    name="type"
                    defaultValue={soort === 'wijziging' && gi ? gi.type : ''}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                    placeholder="Bijv. Voedselbank, Kledingbank, Buurtinitiatief"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Onderwerp(en) (1+)
                  </label>
                  <div className="space-y-2">
                    {PDF_FILTER_GROUPS.map((g) => (
                      <div key={g.id}>
                        <div className="text-[11px] text-gray-500 font-semibold mb-1">{g.label}</div>
                        <div className="space-y-1">
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
                                <span>{f.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemeente / Plaats
                    </label>
                    <select
                      name="gemeente"
                      defaultValue={soort === 'wijziging' && gi ? gi.gemeente : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                    >
                      <option value="">Selecteer gemeente</option>
                      {gemeenten.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode
                    </label>
                    <input
                      name="postcode"
                      defaultValue={soort === 'wijziging' && gi ? gi.postcode || '' : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      placeholder="1234 AB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <input
                      name="adres"
                      defaultValue={soort === 'wijziging' && gi ? gi.adres : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      placeholder="Straat en huisnummer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschrijving activiteiten
                  </label>
                  <textarea
                    name="beschrijving"
                    rows={3}
                    defaultValue={soort === 'wijziging' && gi ? gi.beschrijving : ''}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none resize-none"
                    placeholder="Wat doet dit initiatief?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Doelgroep
                  </label>
                  <input
                    name="doelgroep"
                    defaultValue={soort === 'wijziging' && gi ? gi.doelgroep : ''}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                    placeholder="Wie kan hier terecht?"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      name="website"
                      type="text"
                      defaultValue={soort === 'wijziging' && gi ? gi.website : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefoon
                    </label>
                    <input
                      name="telefoon"
                      defaultValue={soort === 'wijziging' && gi ? gi.telefoon : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      placeholder="06-12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail
                    </label>
                    <input
                      name="emailInitiatief"
                      type="email"
                      defaultValue={soort === 'wijziging' && gi ? gi.email : ''}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      placeholder="info@..."
                    />
                  </div>
                </div>

                {soort === 'wijziging' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Toelichting wijziging
                    </label>
                    <textarea
                      name="toelichting"
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none resize-none"
                      placeholder="Wat is er gewijzigd?"
                    />
                  </div>
                )}
              </>
            )}

            {soort === 'afmelding' && gi && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reden van afmelding
                </label>
                <textarea
                  name="toelichting"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none resize-none"
                  placeholder="Waarom moet dit initiatief van de kaart?"
                />
              </div>
            )}

            {soort === 'afmelding' && !gi && (
              <p className="text-sm text-gray-400">Zoek en selecteer hierboven het initiatief dat je wilt afmelden.</p>
            )}
            {soort === 'wijziging' && !gi && (
              <p className="text-sm text-gray-400">Zoek en selecteer hierboven het initiatief dat je wilt wijzigen. De huidige gegevens worden dan ingevuld.</p>
            )}
          </div>

          {/* Indiener gegevens */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-[#829362]">Jouw gegevens</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Je naam *
                </label>
                <input
                  name="indienerNaam"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Je e-mailadres *
                </label>
                <input
                  name="indienerEmail"
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#829362] text-white py-3 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Verzenden...' : soort === 'wijziging' ? 'Verstuur wijziging' : soort === 'afmelding' ? 'Verstuur afmelding' : 'Verstuur aanmelding'}
          </button>
        </form>
      </div>
    </div>
  );
}
