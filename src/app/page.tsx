'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import SearchBar from '@/components/SearchBar';
import { initiatieven, stats } from '@/lib/data';
import { useRouter } from 'next/navigation';
import type { Initiatief } from '@/lib/types';
import { PDF_FILTER_GROUPS, PDF_FILTERS } from '@/lib/pdfFilters';

export default function Home() {
  const router = useRouter();

  function handleSelect(item: Initiatief) {
    router.push(`/kaart?id=${item.id}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#9cc47c]/5 via-white to-[#9cc47c]/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#9cc47c]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#9cc47c]/8 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#829362] leading-tight">
            Samen sterk{' '}
            <br />
            tegen <span className="text-[#9cc47c]">armoede</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Een overzicht van alle formele en informele initiatieven tegen armoede
            in de provincie Groningen. Doorzoekbaar, op de kaart, en voor iedereen toegankelijk.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-xl mx-auto">
            <SearchBar
              initiatieven={initiatieven}
              onSelect={handleSelect}
              large
            />
          </div>

          {/* Quick actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kaart"
              className="inline-flex items-center gap-2 bg-[#829362] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2d3a47] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Bekijk de kaart
            </Link>
            <Link
              href="/aanmelden"
              className="inline-flex items-center gap-2 border-2 border-[#9cc47c] text-[#9cc47c] px-6 py-3 rounded-xl font-medium hover:bg-[#9cc47c]/5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Voeg initiatief toe
            </Link>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer>
        <div className="bg-white py-8">
          <div className="max-w-5xl mx-auto px-4">
            <p className="text-center text-sm text-gray-500 mb-6">In samenwerking met</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <Image src="/logo-Gezond-Groningen-1.jpg" alt="Gezond Groningen" width={180} height={60} className="h-12 w-auto object-contain" />
              <Image src="/OranjeFonds_logo_RGB_excl_payoff.jpg" alt="Oranje Fonds" width={180} height={60} className="h-12 w-auto object-contain" />
              <Image src="/ZIF-logo_RGB.jpg" alt="Zorg Innovatie Forum" width={180} height={60} className="h-12 w-auto object-contain" />
            </div>
          </div>
        </div>
        <div className="bg-[#829362] text-white/80">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm">
            <p>
              Zelfredzaam Groningen — Een inventarisatie van initiatieven tegen armoede in de provincie Groningen.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
