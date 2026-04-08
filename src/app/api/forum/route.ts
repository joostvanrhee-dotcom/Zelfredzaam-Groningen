export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ForumPost, ForumReactie } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';
import db from '@/lib/db';

function getPostsWithReacties(whereClause = '', params: unknown[] = []): Omit<ForumPost, 'auteurEmail'>[] {
  const posts = db.prepare(`SELECT * FROM forum_posts ${whereClause} ORDER BY createdAt DESC`).all(...params) as (ForumPost & { auteurEmail: string })[];
  const reacties = db.prepare('SELECT * FROM forum_reacties ORDER BY createdAt ASC').all() as ForumReactie[];

  return posts.map(({ auteurEmail: _email, ...post }) => ({
    ...post,
    reacties: reacties.filter((r) => r.postId === post.id),
  })) as Omit<ForumPost, 'auteurEmail'>[];
}

function getPostsWithReactiesAdmin(): ForumPost[] {
  const posts = db.prepare('SELECT * FROM forum_posts ORDER BY createdAt DESC').all() as (ForumPost & { reacties?: ForumReactie[] })[];
  const reacties = db.prepare('SELECT * FROM forum_reacties ORDER BY createdAt ASC').all() as ForumReactie[];

  return posts.map((post) => ({
    ...post,
    reacties: reacties.filter((r) => r.postId === post.id),
  }));
}

// GET: list all forum posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get('categorie');
  const pw = req.headers.get('x-admin-password');
  const isAdmin = pw === (process.env.ADMIN_PASSWORD || 'veerkracht2024');

  if (isAdmin) {
    return NextResponse.json(getPostsWithReactiesAdmin());
  }

  if (categorie) {
    return NextResponse.json(getPostsWithReacties('WHERE categorie = ?', [categorie]));
  }

  return NextResponse.json(getPostsWithReacties());
}

// POST: create a new forum post
export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await getUserFromRequest(req);

  const titel = body.titel;
  const inhoud = body.inhoud;
  const categorie = body.categorie;
  const auteurNaam = user ? user.naam : body.auteurNaam;
  const auteurEmail = user ? user.email : body.auteurEmail;

  if (!titel || !inhoud || !categorie || !auteurNaam || !auteurEmail) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const id = `forum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO forum_posts (id, titel, inhoud, categorie, auteurNaam, auteurEmail, gebruikerId, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, titel, inhoud, categorie, auteurNaam, auteurEmail, user?.id ?? null, createdAt);

  return NextResponse.json({ success: true, id });
}

// DELETE: remove a forum post (admin or owner)
export async function DELETE(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  const isAdmin = pw === (process.env.ADMIN_PASSWORD || 'veerkracht2024');
  const user = await getUserFromRequest(req);

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID ontbreekt' }, { status: 400 });
  }

  const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(id) as ForumPost | undefined;
  if (!post) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  const isOwner = user && post.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  db.prepare('DELETE FROM forum_posts WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
