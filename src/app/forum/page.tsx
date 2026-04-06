'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { FORUM_CATEGORIEEN, type ForumCategorie, type ForumPost, type ForumReactie } from '@/lib/types';

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'zojuist';
  if (mins < 60) return `${mins} min geleden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} uur geleden`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'gisteren';
  if (days < 7) return `${days} dagen geleden`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

const CATEGORIE_KLEUREN: Record<ForumCategorie, string> = {
  Hulpvraag: 'bg-orange-100 text-orange-700',
  Gezocht: 'bg-blue-100 text-blue-700',
  Aanbod: 'bg-green-100 text-green-700',
  Juridisch: 'bg-purple-100 text-purple-700',
  Vrijwilligers: 'bg-yellow-100 text-yellow-700',
  Overig: 'bg-gray-100 text-gray-600',
};

interface AuthUser {
  id: string;
  naam: string;
  email: string;
}

export default function ForumPage() {
  const [posts, setPosts] = useState<(Omit<ForumPost, 'auteurEmail'>)[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ForumCategorie | 'alle'>('alle');
  const [toonFormulier, setToonFormulier] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Auth state
  const [user, setUser] = useState<AuthUser | null>(null);

  // Form fields
  const [titel, setTitel] = useState('');
  const [inhoud, setInhoud] = useState('');
  const [categorie, setCategorie] = useState<ForumCategorie>('Hulpvraag');
  const [auteurNaam, setAuteurNaam] = useState('');
  const [auteurEmail, setAuteurEmail] = useState('');

  // Expanded post for reactions
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  // Reaction form state
  const [reactieNaam, setReactieNaam] = useState('');
  const [reactieInhoud, setReactieInhoud] = useState('');
  const [reactieSubmitting, setReactieSubmitting] = useState(false);

  // Edit state
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editTitel, setEditTitel] = useState('');
  const [editInhoud, setEditInhoud] = useState('');
  const [editCategorie, setEditCategorie] = useState<ForumCategorie>('Hulpvraag');

  // Fetch auth state
  useEffect(() => {
    fetch('/api/auth/mij')
      .then((r) => r.json())
      .then((data) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/forum');
      const data = await res.json();
      setPosts(data);
    } catch {
      console.error('Fout bij ophalen posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const body: Record<string, string> = { titel, inhoud, categorie };
      if (!user) {
        body.auteurNaam = auteurNaam;
        body.auteurEmail = auteurEmail;
      }

      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Verzenden mislukt');

      setSuccessMsg('Je bericht is geplaatst!');
      setTitel('');
      setInhoud('');
      setAuteurNaam('');
      setAuteurEmail('');
      setToonFormulier(false);
      fetchPosts();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReactie(postId: string) {
    const naam = user ? user.naam : reactieNaam;
    if ((!user && !naam.trim()) || !reactieInhoud.trim()) return;
    setReactieSubmitting(true);

    try {
      const body: Record<string, string> = { postId, inhoud: reactieInhoud };
      if (!user) body.auteurNaam = reactieNaam;

      const res = await fetch('/api/forum/reactie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Reactie plaatsen mislukt');

      setReactieNaam('');
      setReactieInhoud('');
      fetchPosts();
    } catch {
      alert('Er ging iets mis bij het plaatsen van je reactie.');
    } finally {
      setReactieSubmitting(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;

    try {
      const res = await fetch('/api/forum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId }),
      });
      if (res.ok) fetchPosts();
    } catch {
      alert('Verwijderen mislukt');
    }
  }

  async function handleDeleteReactie(postId: string, reactieId: string) {
    if (!confirm('Reactie verwijderen?')) return;

    try {
      const res = await fetch('/api/forum/reactie', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, reactieId }),
      });
      if (res.ok) fetchPosts();
    } catch {
      alert('Verwijderen mislukt');
    }
  }

  function startEdit(post: Omit<ForumPost, 'auteurEmail'>) {
    setEditingPost(post.id);
    setEditTitel(post.titel);
    setEditInhoud(post.inhoud);
    setEditCategorie(post.categorie as ForumCategorie);
  }

  async function handleSaveEdit(postId: string) {
    try {
      const res = await fetch('/api/forum/bewerken', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, titel: editTitel, inhoud: editInhoud, categorie: editCategorie }),
      });
      if (res.ok) {
        setEditingPost(null);
        fetchPosts();
      }
    } catch {
      alert('Bewerken mislukt');
    }
  }

  const filteredPosts = filter === 'alle' ? posts : posts.filter((p) => p.categorie === filter);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#829362]">Forum</h1>
            <p className="mt-2 text-gray-600">
              Heb je iets nodig of zoek je hulp? Plaats hier je vraag. Anderen kunnen reageren.
            </p>
          </div>
          <button
            onClick={() => setToonFormulier(!toonFormulier)}
            className="flex-shrink-0 bg-[#829362] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#6b7a4f] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe vraag
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* New post form */}
        {toonFormulier && (
          <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-semibold text-[#829362]">Nieuwe forum post aanmaken</h3>

            {user && (
              <p className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                Je plaatst als <span className="font-medium text-[#829362]">{user.naam}</span>
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
                <input
                  value={titel}
                  onChange={(e) => setTitel(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  placeholder="Bijv. Spullen gezocht."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as ForumCategorie)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                >
                  {FORUM_CATEGORIEEN.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving *</label>
              <textarea
                value={inhoud}
                onChange={(e) => setInhoud(e.target.value)}
                required
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none resize-none"
                placeholder="Beschrijf je hulpvraag..."
              />
            </div>

            {!user && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Je naam *</label>
                  <input
                    value={auteurNaam}
                    onChange={(e) => setAuteurNaam(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Je e-mailadres *
                    <span className="text-gray-400 font-normal ml-1">(wordt niet getoond)</span>
                  </label>
                  <input
                    value={auteurEmail}
                    onChange={(e) => setAuteurEmail(e.target.value)}
                    type="email"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#829362] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50 text-sm"
              >
                {submitting ? 'Plaatsen...' : 'Plaats bericht'}
              </button>
              <button
                type="button"
                onClick={() => setToonFormulier(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuleren
              </button>
            </div>
          </form>
        )}

        {/* Category filter */}
        <div className="mt-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('alle')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === 'alle'
                ? 'bg-[#829362] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Alle
          </button>
          {FORUM_CATEGORIEEN.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === c
                  ? 'bg-[#829362] text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Posts list */}
        <div className="mt-6 space-y-4">
          {loading && (
            <div className="text-center py-12 text-gray-400">Laden...</div>
          )}

          {!loading && filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {filter === 'alle' ? 'Nog geen forumberichten geplaatst.' : `Geen forumberichten in de categorie "${filter}".`}
              </p>
              {!toonFormulier && (
                <button
                  onClick={() => setToonFormulier(true)}
                  className="mt-3 text-[#9cc47c] hover:underline text-sm"
                >
                  Plaats het eerste bericht
                </button>
              )}
            </div>
          )}

          {filteredPosts.map((post) => {
            const isExpanded = expandedPost === post.id;
            const isOwner = user && post.gebruikerId === user.id;
            const isEditing = editingPost === post.id;

            return (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-5">
                  {isEditing ? (
                    /* Edit form */
                    <div className="space-y-3">
                      <input
                        value={editTitel}
                        onChange={(e) => setEditTitel(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#829362] focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none"
                      />
                      <select
                        value={editCategorie}
                        onChange={(e) => setEditCategorie(e.target.value as ForumCategorie)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:border-[#9cc47c] focus:outline-none"
                      >
                        {FORUM_CATEGORIEEN.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <textarea
                        value={editInhoud}
                        onChange={(e) => setEditInhoud(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:ring-2 focus:ring-[#9cc47c]/20 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(post.id)}
                          className="bg-[#829362] text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-[#6b7a4f] transition-colors"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => setEditingPost(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Annuleren
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORIE_KLEUREN[post.categorie as ForumCategorie] || CATEGORIE_KLEUREN.Overig}`}>
                              {post.categorie}
                            </span>
                            <span className="text-[11px] text-gray-400">{timeAgo(post.createdAt)}</span>
                          </div>
                          <h3 className="mt-1.5 font-semibold text-[#829362]">{post.titel}</h3>
                        </div>
                        {isOwner && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(post)}
                              className="text-xs text-gray-400 hover:text-[#829362] transition-colors px-2 py-1"
                              title="Bewerken"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
                              title="Verwijderen"
                            >
                              Verwijderen
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{post.inhoud}</p>

                      {/* Author & reactions toggle */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-400">door {post.auteurNaam}</span>
                        <button
                          onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                          className="text-xs text-[#9cc47c] hover:text-[#829362] transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.reacties.length} {post.reacties.length === 1 ? 'reactie' : 'reacties'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded reactions */}
                {isExpanded && post.reacties.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    <div className="divide-y divide-gray-100">
                      {post.reacties.map((r: ForumReactie) => {
                        const isReactieOwner = user && r.gebruikerId === user.id;
                        return (
                          <div key={r.id} className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">{r.auteurNaam}</span>
                              <span className="text-[10px] text-gray-400">{timeAgo(r.createdAt)}</span>
                              {isReactieOwner && (
                                <button
                                  onClick={() => handleDeleteReactie(post.id, r.id)}
                                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors ml-auto"
                                >
                                  Verwijder
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{r.inhoud}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reaction form — always visible */}
                <div className="border-t border-gray-100 px-5 py-4">
                  <div className="flex gap-2">
                    {!user && (
                      <input
                        value={reactieNaam}
                        onChange={(e) => setReactieNaam(e.target.value)}
                        placeholder="Je naam"
                        className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-[#9cc47c] focus:ring-1 focus:ring-[#9cc47c]/20 focus:outline-none"
                      />
                    )}
                    <input
                      value={reactieInhoud}
                      onChange={(e) => setReactieInhoud(e.target.value)}
                      placeholder="Schrijf een reactie..."
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-[#9cc47c] focus:ring-1 focus:ring-[#9cc47c]/20 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReactie(post.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handleReactie(post.id)}
                      disabled={reactieSubmitting || (!user && !reactieNaam.trim()) || !reactieInhoud.trim()}
                      className="bg-[#829362] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50"
                    >
                      {reactieSubmitting ? '...' : 'Reageer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
