'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function InloggenPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, wachtwoord }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er ging iets mis');
        return;
      }

      router.push('/profiel');
    } catch {
      setError('Er ging iets mis');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#829362] mb-6">Inloggen</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
                <input
                  value={wachtwoord}
                  onChange={(e) => setWachtwoord(e.target.value)}
                  type="password"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#829362] text-white py-2.5 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'Inloggen...' : 'Inloggen'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link href="/wachtwoord-vergeten" className="text-sm text-gray-400 hover:text-gray-600">
                Wachtwoord vergeten?
              </Link>
              <p className="text-sm text-gray-500">
                Nog geen account?{' '}
                <Link href="/registreren" className="text-[#9cc47c] hover:underline font-medium">
                  Registreer je hier
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
