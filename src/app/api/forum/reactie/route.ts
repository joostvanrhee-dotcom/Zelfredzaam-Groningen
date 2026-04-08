export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ForumPost, ForumReactie } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';
import db from '@/lib/db';

// POST: add a reaction to a forum post
export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await getUserFromRequest(req);

  const postId = body.postId;
  const auteurNaam = user ? user.naam : body.auteurNaam;
  const inhoud = body.inhoud;

  if (!postId || !auteurNaam || !inhoud) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const post = db.prepare('SELECT id FROM forum_posts WHERE id = ?').get(postId);
  if (!post) {
    return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
  }

  const id = `reactie_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO forum_reacties (id, postId, auteurNaam, gebruikerId, inhoud, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, postId, auteurNaam, user?.id ?? null, inhoud, createdAt);

  return NextResponse.json({ success: true, id });
}

// DELETE: remove a reaction (admin or owner)
export async function DELETE(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  const isAdmin = pw === (process.env.ADMIN_PASSWORD || 'veerkracht2024');
  const user = await getUserFromRequest(req);

  const body = await req.json();
  const { postId, reactieId } = body;

  if (!postId || !reactieId) {
    return NextResponse.json({ error: 'postId en reactieId verplicht' }, { status: 400 });
  }

  const reactie = db.prepare('SELECT * FROM forum_reacties WHERE id = ? AND postId = ?').get(reactieId, postId) as ForumReactie | undefined;
  if (!reactie) {
    return NextResponse.json({ error: 'Reactie niet gevonden' }, { status: 404 });
  }

  const isOwner = user && reactie.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  db.prepare('DELETE FROM forum_reacties WHERE id = ?').run(reactieId);
  return NextResponse.json({ success: true });
}
