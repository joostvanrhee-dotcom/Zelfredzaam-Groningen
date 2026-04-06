import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import type { User } from '@/lib/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const COOKIE_NAME = 'veerkracht_token';
const TOKEN_EXPIRY = '7d';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is niet ingesteld in .env.local');
  return new TextEncoder().encode(secret);
}

// ── File I/O ──

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
}

export function readUsers(): User[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

export function writeUsers(users: User[]) {
  ensureFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ── Lookups ──

export function findUserByEmail(email: string): User | undefined {
  return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function findUserById(id: string): User | undefined {
  return readUsers().find((u) => u.id === id);
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
  const users = readUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) throw new Error('Dit e-mailadres is al in gebruik');

  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    naam: naam.trim(),
    email: email.toLowerCase().trim(),
    wachtwoordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeUsers(users);
  return user;
}
