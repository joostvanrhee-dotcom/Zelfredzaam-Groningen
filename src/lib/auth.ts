import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import type { User } from '@/lib/types';
import db from '@/lib/db';

const COOKIE_NAME = 'veerkracht_token';
const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is niet ingesteld in .env.local');
  return new TextEncoder().encode(secret);
}

// ── Lookups ──

export function findUserByEmail(email: string): User | undefined {
  const row = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim()) as User | undefined;
  return row;
}

export function findUserById(id: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

// ── Password ──

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT ──

export async function generateToken(user: User): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, naam: user.naam })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<{ sub: string; email: string; naam: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { sub: string; email: string; naam: string };
  } catch {
    return null;
  }
}

// ── Request helpers ──

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return findUserById(payload.sub) ?? null;
}

export function tokenCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  };
}

export function clearTokenCookie() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

// ── Reset token ──

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// ── User creation ──

export async function createUser(naam: string, email: string, password: string): Promise<User> {
  const existing = findUserByEmail(email);
  if (existing) throw new Error('Dit e-mailadres is al in gebruik');

  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    naam: naam.trim(),
    email: email.toLowerCase().trim(),
    wachtwoordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  db.prepare(`
    INSERT INTO users (id, naam, email, wachtwoordHash, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.naam, user.email, user.wachtwoordHash, user.createdAt);

  return user;
}

// ── Profile update ──

export function updateUser(id: string, updates: Partial<Pick<User, 'naam' | 'email' | 'wachtwoordHash' | 'resetToken' | 'resetTokenVerloopt'>>) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE users SET ${fields} WHERE id = ?`).run(...values, id);
}
