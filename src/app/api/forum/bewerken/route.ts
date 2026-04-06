import { NextRequest, NextResponse } from 'next/server';
import type { ForumPost } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';
import db from '@/lib/db';

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  const pw = req.headers.get('x-admin-password');
  const isAdmin = pw === (process.env.ADMIN_PASSWORD || 'veerkracht2024');

  if (!user && !isAdmin) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { postId, titel, inhoud, categorie } = await req.json();

  if (!postId) {
    return NextResponse.json({ error: 'postId is verplicht' }, { status: 400 });
  }

  const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(postId) as ForumPost | undefined;
  if (!post) {
    return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
  }

  const isOwner = user && post.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  if (titel)    { updates.push('titel = ?');    values.push(titel); }
  if (inhoud)   { updates.push('inhoud = ?');   values.push(inhoud); }
  if (categorie){ updates.push('categorie = ?'); values.push(categorie); }

  if (updates.length > 0) {
    db.prepare(`UPDATE forum_posts SET ${updates.join(', ')} WHERE id = ?`).run(...values, postId);
  }

  return NextResponse.json({ success: true });
}
