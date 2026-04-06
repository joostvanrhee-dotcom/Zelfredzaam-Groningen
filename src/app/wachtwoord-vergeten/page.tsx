'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function WachtwoordVergetenPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/wachtwoord-vergeten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Er ging iets mis');
        return;
      }

      setSent(true);
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
            <h1 className="text-2xl font-bold text-[#829362] mb-2">Wachtwoord vergeten</h1>

            {sent ? (
              <div>
                <p className="text-gray-600 text-sm mb-4">
                  Als er een account bestaat met dit e-mailadres, ontvang je binnen enkele minuten een e-mail met een link om je wachtwoord te herstellen.
                </p>
                <Link
                  href="/inloggen"
                  className="text-[#9cc47c] hover:underline text-sm font-medium"
                >
                  Terug naar inloggen
                </Link>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6">
                  Vul je e-mailadres in en we sturen je een link om je wachtwoord te herstellen.
                </p>

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

                  {error && <p className="text-red-600 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#829362] text-white py-2.5 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50 text-sm"
                  >
                    {submitting ? 'Versturen...' : 'Verstuur reset-link'}
                  </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-500">
                  <Link href="/inloggen" className="text-[#9cc47c] hover:underline font-medium">
                    Terug naar inloggen
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
