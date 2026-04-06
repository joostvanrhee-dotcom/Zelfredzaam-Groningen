'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AuthUser {
  id: string;
  naam: string;
  email: string;
}

export default function AuthStatus() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/mij')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function uitloggen() {
    await fetch('/api/auth/uitloggen', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  }

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/inloggen"
        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-[#829362] hover:bg-gray-50 transition-colors"
      >
        Inloggen
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/profiel"
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#829362] hover:bg-[#9cc47c]/15 transition-colors flex items-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {user.naam}
      </Link>
      <button
        onClick={uitloggen}
        className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        Uitloggen
      </button>
    </div>
  );
}
