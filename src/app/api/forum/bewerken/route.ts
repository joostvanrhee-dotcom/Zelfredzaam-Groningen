import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import type { ForumPost } from '@/lib/types';
import { getUserFromRequest } from '@/lib/auth';

const DATA_DIR = path.join(process.cwd(), 'data');
const FORUM_FILE = path.join(DATA_DIR, 'forum.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FORUM_FILE)) fs.writeFileSync(FORUM_FILE, '[]');
}

function readForum(): ForumPost[] {
  ensureDataDir();
  return JSON.parse(fs.readFileSync(FORUM_FILE, 'utf-8'));
}

function writeForum(data: ForumPost[]) {
  ensureDataDir();
  fs.writeFileSync(FORUM_FILE, JSON.stringify(data, null, 2));
}

// PUT: edit own post
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

  const posts = readForum();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return NextResponse.json({ error: 'Post niet gevonden' }, { status: 404 });
  }

  const isOwner = user && post.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  }

  if (titel) post.titel = titel;
  if (inhoud) post.inhoud = inhoud;
  if (categorie) post.categorie = categorie;

  writeForum(posts);
  return NextResponse.json({ success: true });
}
