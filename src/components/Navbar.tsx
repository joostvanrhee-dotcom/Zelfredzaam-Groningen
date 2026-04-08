'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthStatus from './AuthStatus';

const links = [
  { href: '/', label: 'Home' },
  { href: '/kaart', label: 'Kaart' },
  { href: '/forum', label: 'Forum' },
  { href: '/aanmelden', label: 'Meld initiatief' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-[#829362] text-lg">
              <span className="hidden sm:inline">Zelfredzaam Groningen</span>
              <span className="sm:hidden">ZG</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#9cc47c]/15 text-[#829362]'
                      : 'text-gray-500 hover:text-[#829362] hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="ml-2 pl-2 border-l border-gray-200">
              <AuthStatus />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
