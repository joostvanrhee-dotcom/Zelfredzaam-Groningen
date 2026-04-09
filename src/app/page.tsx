import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';

const EXCLUDE = new Set(['next.svg', 'vercel.svg', 'file.svg', 'globe.svg', 'window.svg', 'leaflet.css']);

function getLogos(): string[] {
  const publicDir = path.join(process.cwd(), 'public');
  return fs
    .readdirSync(publicDir)
    .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f) && !EXCLUDE.has(f))
    .sort();
}

export default function Home() {
  const logos = getLogos();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <HeroSection />

      {/* Footer */}
      <footer className="mt-auto">
        {logos.length > 0 && (
          <div className="bg-white py-8">
            <div className="max-w-5xl mx-auto px-4">
              <p className="text-center text-sm text-gray-500 mb-6">In samenwerking met</p>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {logos.map((logo) => (
                  <Image
                    key={logo}
                    src={`/${logo}`}
                    alt={logo.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')}
                    width={180}
                    height={60}
                    className={`w-auto object-contain ${logo.toLowerCase().includes('rabobank') || logo.toLowerCase().includes('oranje') ? 'h-5' : 'h-12'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="bg-[#829362] text-white/80">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm">
            <p>
              Ain Pronkjewail — Samen Sterker tegen Armoede
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
