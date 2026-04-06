'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Suspense } from 'react';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [wachtwoord, setWachtwoord] = useState('');
  const [wachtwoord2, setWachtwoord2] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-gray-600 mb-4">Ongeldige link. Vraag een nieuwe reset-link aan.</p>
        <Link href="/wachtwoord-vergeten" className="text-[#9cc47c] hover:underline font-medium text-sm">
          Wachtwoord vergeten
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (wachtwoord !== wachtwoord2) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    if (wachtwoord.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens zijn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/wachtwoord-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, wachtwoord }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er ging iets mis');
        return;
      }

      setDone(true);
    } catch {
      setError('Er ging iets mis');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-gray-600 mb-4">Je wachtwoord is succesvol gewijzigd!</p>
        <Link
          href="/inloggen"
          className="inline-block bg-[#829362] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors text-sm"
        >
          Inloggen
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nieuw wachtwoord</label>
        <input
          value={wachtwoord}
          onChange={(e) => setWachtwoord(e.target.value)}
          type="password"
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">Minimaal 8 tekens</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord bevestigen</label>
        <input
          value={wachtwoord2}
          onChange={(e) => setWachtwoord2(e.target.value)}
          type="password"
          required
          minLength={8}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#829362] text-white py-2.5 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50 text-sm"
      >
        {submitting ? 'Opslaan...' : 'Wachtwoord opslaan'}
      </button>
    </form>
  );
}

export default function WachtwoordResetPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#829362] mb-6">Nieuw wachtwoord instellen</h1>
            <Suspense fallback={<div className="text-gray-400 text-sm">Laden...</div>}>
              <ResetForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
