'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import type { ForumPost, ForumReactie } from '@/lib/types';

interface Submission {
  id: string;
  soort: string;
  naam: string;
  type?: string;
  categorie?: string;
  filters?: string[];
  gemeente?: string;
  adres?: string;
  beschrijving?: string;
  doelgroep?: string;
  website?: string;
  telefoon?: string;
  emailInitiatief?: string;
  toelichting?: string;
  indienerNaam: string;
  indienerEmail: string;
  status: string;
  createdAt: string;
}

type AdminTab = 'initiatieven' | 'forum';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'goedgekeurd' | 'afgewezen'>('pending');

  // Admin tab
  const [adminTab, setAdminTab] = useState<AdminTab>('initiatieven');

  // Forum state
  const [forumPosts, setForumPosts] = useState<(ForumPost & { auteurEmail?: string })[]>([]);
  const [forumLoading, setForumLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/submissions', {
        headers: { 'x-admin-password': password },
      });
      if (!res.ok) {
        setError('Onjuist wachtwoord');
        return;
      }
      const data = await res.json();
      setSubmissions(data);
      setAuthenticated(true);
    } catch {
      setError('Fout bij laden');
    } finally {
      setLoading(false);
    }
  }

  const fetchForumPosts = useCallback(async () => {
    setForumLoading(true);
    try {
      const res = await fetch('/api/forum', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      setForumPosts(data);
    } catch {
      console.error('Fout bij laden forum posts');
    } finally {
      setForumLoading(false);
    }
  }, [password]);

  useEffect(() => {
    if (authenticated && adminTab === 'forum') {
      fetchForumPosts();
    }
  }, [authenticated, adminTab, fetchForumPosts]);

  async function updateStatus(id: string, status: 'goedgekeurd' | 'afgewezen') {
    try {
      const res = await fetch('/api/submissions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }
    } catch {
      alert('Fout bij bijwerken');
    }
  }

  async function deleteForumPost(postId: string) {
    if (!confirm('Weet je zeker dat je deze hulpvraag wilt verwijderen?')) return;
    try {
      const res = await fetch('/api/forum', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: postId }),
      });
      if (res.ok) {
        setForumPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch {
      alert('Fout bij verwijderen');
    }
  }

  async function deleteForumReactie(postId: string, reactieId: string) {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return;
    try {
      const res = await fetch('/api/forum/reactie', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ postId, reactieId }),
      });
      if (res.ok) {
        setForumPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, reacties: p.reacties.filter((r) => r.id !== reactieId) }
              : p
          )
        );
      }
    } catch {
      alert('Fout bij verwijderen reactie');
    }
  }

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filter);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-[#829362] mb-4">Admin Login</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Wachtwoord"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#9cc47c] focus:outline-none"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              onClick={login}
              disabled={loading}
              className="mt-4 w-full bg-[#829362] text-white py-2 rounded-lg font-medium hover:bg-[#6b7a4f] transition-colors disabled:opacity-50"
            >
              {loading ? 'Laden...' : 'Inloggen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF7DE]">
      <Navbar />

      <div className="max-w-5xl mx-auto w-full px-4 py-8">
        {/* Admin tab switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAdminTab('initiatieven')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              adminTab === 'initiatieven'
                ? 'bg-[#829362] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Ingezonden initiatieven
          </button>
          <button
            onClick={() => setAdminTab('forum')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              adminTab === 'forum'
                ? 'bg-[#829362] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}
          >
            Forum moderatie
            {forumPosts.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({forumPosts.length})</span>
            )}
          </button>
        </div>

        {/* ===== INITIATIEVEN TAB ===== */}
        {adminTab === 'initiatieven' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#829362]">Ingezonden initiatieven</h1>
              <span className="text-sm text-gray-500">{submissions.length} totaal</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
              {([
                ['pending', 'In afwachting'],
                ['goedgekeurd', 'Goedgekeurd'],
                ['afgewezen', 'Afgewezen'],
                ['all', 'Alles'],
              ] as [typeof filter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === value
                      ? 'bg-[#829362] text-white'
                      : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {label}
                  {value !== 'all' && (
                    <span className="ml-1 text-xs opacity-70">
                      ({submissions.filter((s) => s.status === value).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Submissions list */}
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Geen aanmeldingen gevonden.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#829362]">{sub.naam}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sub.soort === 'nieuw' ? 'bg-green-100 text-green-700' :
                            sub.soort === 'wijziging' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sub.soort}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sub.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                            sub.status === 'goedgekeurd' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Ingezonden door {sub.indienerNaam} ({sub.indienerEmail}) op{' '}
                          {new Date(sub.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      {sub.type && <div><span className="text-gray-400">Type:</span> {sub.type}</div>}
                      {sub.categorie && <div><span className="text-gray-400">Categorie:</span> {sub.categorie}</div>}
                      {sub.filters && sub.filters.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-400">Onderwerpen:</span> {sub.filters.join(', ')}
                        </div>
                      )}
                      {sub.gemeente && <div><span className="text-gray-400">Gemeente:</span> {sub.gemeente}</div>}
                      {sub.adres && <div><span className="text-gray-400">Adres:</span> {sub.adres}</div>}
                      {sub.website && <div><span className="text-gray-400">Website:</span> {sub.website}</div>}
                      {sub.telefoon && <div><span className="text-gray-400">Telefoon:</span> {sub.telefoon}</div>}
                      {sub.emailInitiatief && <div><span className="text-gray-400">E-mail:</span> {sub.emailInitiatief}</div>}
                      {sub.doelgroep && <div className="col-span-2"><span className="text-gray-400">Doelgroep:</span> {sub.doelgroep}</div>}
                    </div>
                    {sub.beschrijving && (
                      <p className="mt-2 text-sm text-gray-600">{sub.beschrijving}</p>
                    )}
                    {sub.toelichting && (
                      <p className="mt-2 text-sm text-gray-500 italic">{sub.toelichting}</p>
                    )}

                    {sub.status === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => updateStatus(sub.id, 'goedgekeurd')}
                          className="px-4 py-1.5 bg-[#829362] text-white text-sm rounded-lg hover:bg-[#6b7a4f] transition-colors"
                        >
                          Goedkeuren
                        </button>
                        <button
                          onClick={() => updateStatus(sub.id, 'afgewezen')}
                          className="px-4 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Afwijzen
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== FORUM TAB ===== */}
        {adminTab === 'forum' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#829362]">Forum moderatie</h1>
              <span className="text-sm text-gray-500">{forumPosts.length} forumberichten</span>
            </div>

            {forumLoading && (
              <div className="text-center py-12 text-gray-400">Laden...</div>
            )}

            {!forumLoading && forumPosts.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Geen forumberichten gevonden.
              </div>
            )}

            <div className="space-y-4">
              {forumPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {post.categorie}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        <h3 className="mt-1 font-semibold text-[#829362]">{post.titel}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          door {post.auteurNaam}
                          {post.auteurEmail && <> ({post.auteurEmail})</>}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteForumPost(post.id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
                      >
                        Verwijderen
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{post.inhoud}</p>
                  </div>

                  {/* Reacties */}
                  {post.reacties.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="px-5 py-2">
                        <span className="text-xs font-medium text-gray-500">
                          {post.reacties.length} {post.reacties.length === 1 ? 'reactie' : 'reacties'}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {post.reacties.map((r: ForumReactie) => (
                          <div key={r.id} className="px-5 py-2.5 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-700">{r.auteurNaam}</span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(r.createdAt).toLocaleDateString('nl-NL')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-0.5">{r.inhoud}</p>
                            </div>
                            <button
                              onClick={() => deleteForumReactie(post.id, r.id)}
                              className="text-xs text-red-500 hover:text-red-700 flex-shrink-0 ml-3"
                            >
                              Verwijder
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
