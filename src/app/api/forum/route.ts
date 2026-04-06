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
  const raw = fs.readFileSync(FORUM_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeForum(data: ForumPost[]) {
  ensureDataDir();
  fs.writeFileSync(FORUM_FILE, JSON.stringify(data, null, 2));
}

// GET: list all forum posts (public, strips email)
export async function GET(req: NextRequest) {
  const posts = readForum();

  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get('categorie');

  let filtered = posts;
  if (categorie) {
    filtered = posts.filter((p) => p.categorie === categorie);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Check if admin request (to include emails)
  const pw = req.headers.get('x-admin-password');
  const isAdmin = pw === (process.env.ADMIN_PASSWORD || 'veerkracht2024');

  // Strip email for public requests
  const publicPosts = filtered.map(({ auteurEmail, ...rest }) => ({
    ...rest,
    ...(isAdmin ? { auteurEmail } : {}),
  }));

  return NextResponse.json(publicPosts);
}

// POST: create a new forum post (public, optionally authenticated)
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

  const posts = readForum();
  const newPost: ForumPost = {
    id: `forum_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    titel,
    inhoud,
    categorie,
    auteurNaam,
    auteurEmail,
    gebruikerId: user?.id,
    reacties: [],
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);
  writeForum(posts);

  return NextResponse.json({ success: true, id: newPost.id });
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

  const posts = readForum();
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  const isOwner = user && post.gebruikerId === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const filtered = posts.filter((p) => p.id !== id);
  writeForum(filtered);
  return NextResponse.json({ success: true });
}
