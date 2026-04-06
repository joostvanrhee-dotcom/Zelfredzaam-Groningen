import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type { ForumPost, ForumReactie } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const FORUM_FILE = path.join(DATA_DIR, 'forum.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FORUM_FILE)) fs.writeFileSync(FORUM_FILE, '[]');
}

function readForum(): ForumPost[] {
  ensureDataDir();
  const raw = fs.readFileSync(FORUM_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeForum(data: ForumPost[]) {
  ensureDataDir();
  fs.writeFileSync(FORUM_FILE, JSON.stringify(data, null, 2));
}

// POST: add a reaction to a forum post (public, optionally authenticated)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await getUserFromRequest(req);

  const postId = body.postId;
  const auteurNaam = user ? user.naam : body.auteurNaam;
  const inhoud = body.inhoud;

  if (!postId || !auteurNaam || !inhoud) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const posts = readForum();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
  }

  const newReactie: ForumReactie = {
    id: `reactie_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    auteurNaam,
    gebruikerId: user?.id,
    inhoud,
    createdAt: new Date().toISOString(),
  };

  post.reacties.push(newReactie);
  writeForum(posts);

  return NextResponse.json({ success: true, id: newReactie.id });
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

  const posts = readForum();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
  }

  const reactie = post.reacties.find((r) => r.id === reactieId);
  if (!reactie) {
    return NextResponse.json({ error: 'Reactie niet gevonden' }, { status: 404 });
  }

  const isOwner = user && reactie.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  post.reacties = post.reacties.filter((r) => r.id !== reactieId);
  writeForum(posts);
  return NextResponse.json({ success: true });
}
