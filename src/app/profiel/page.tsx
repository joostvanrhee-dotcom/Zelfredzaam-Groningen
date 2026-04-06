'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { ForumPost, ForumCategorie } from '@/lib/types';

interface AuthUser {
  id: string;
  naam: string;
  email: string;
}

const CATEGORIE_KLEUREN: Record<string, string> = {
  Hulpvraag: 'bg-orange-100 text-orange-700',
  Gezocht: 'bg-blue-100 text-blue-700',
  Aanbod: 'bg-green-100 text-green-700',
  Juridisch: 'bg-purple-100 text-purple-700',
  Vrijwilligers: 'bg-yellow-100 text-yellow-700',
  Overig: 'bg-gray-100 text-gray-600',
  Samenwerking: 'bg-teal-100 text-teal-700',
  Ervaringen: 'bg-pink-100 text-pink-700',
  Nieuws: 'bg-sky-100 text-sky-700',
};

export default function ProfielPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Omit<ForumPost, 'auteurEmail'>[]>([]);
  const [openPost, setOpenPost] = useState<string | null>(null);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editNaam, setEditNaam] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/mij')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push('/inloggen');
          return;
        }
        setUser(data.user);
        setEditNaam(data.user.naam);
        setEditEmail(data.user.email);
      })
      .catch(() => router.push('/inloggen'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/forum')
      .then((r) => r.json())
      .then((data) => {
        const myPosts = data.filter((p: Omit<ForumPost, 'auteurEmail'>) => p.gebruikerId === user.id);
        setPosts(myPosts);
      })
      .catch(() => {});
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch('/api/auth/profiel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ naam: editNaam, email: editEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Er ging iets mis');
        return;
      }

      setUser(data.user);
      setEditMode(false);
      setProfileSuccess('Profiel bijgewerkt');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch {
      setProfileError('Er ging iets mis');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-gray-400">Laden...</p>
        </div>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
          {/* Profile card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#829362]">Mijn profiel</h1>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="text-sm text-[#9cc47c] hover:text-[#829362] transition-colors"
                >
                  Bewerken
                </button>
              )}
            </div>

            {profileSuccess && (
              <p className="mb-4 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">{profileSuccess}</p>
            )}

            {editMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
                  <input
                    value={editNaam}
                    onChange={(e) => setEditNaam(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mailadres</label>
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  />
                </div>

                {profileError && <p className="text-red-600 text-sm">{profileError}</p>}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#829362] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setEditNaam(user.naam);
                      setEditEmail(user.email);
                      setProfileError('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Naam</span>
                  <p className="text-gray-800 font-medium">{user.naam}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">E-mailadres</span>
                  <p className="text-gray-800">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* User's posts */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#829362] mb-4">
              Mijn forumberichten ({posts.length})
            </h2>

            {posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Je hebt nog geen berichten geplaatst.</p>
                <a href="/forum" className="mt-2 inline-block text-[#9cc47c] hover:underline text-sm">
                  Ga naar het forum
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => {
                  const hasReacties = post.reacties.length > 0;
                  const isOpen = openPost === post.id;
                  return (
                    <div
                      key={post.id}
                      className={`bg-white rounded-xl border transition-colors ${hasReacties ? 'border-[#9cc47c]/40' : 'border-gray-100'}`}
                    >
                      <button
                        onClick={() => setOpenPost(isOpen ? null : post.id)}
                        className="w-full text-left p-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORIE_KLEUREN[post.categorie] || CATEGORIE_KLEUREN.Overig}`}>
                            {post.categorie}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {hasReacties && (
                            <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-[#829362] bg-[#9cc47c]/15 px-2 py-0.5 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {post.reacties.length} {post.reacties.length === 1 ? 'reactie' : 'reacties'}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-[#829362] text-sm">{post.titel}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.inhoud}</p>
                        {!hasReacties && (
                          <span className="text-xs text-gray-400 mt-2 inline-block">Nog geen reacties</span>
                        )}
                      </button>

                      {isOpen && hasReacties && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                          {post.reacties.map((reactie) => (
                            <div key={reactie.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-700">{reactie.auteurNaam}</span>
                                <span className="text-[11px] text-gray-400">
                                  {new Date(reactie.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{reactie.inhoud}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
