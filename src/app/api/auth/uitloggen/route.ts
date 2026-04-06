import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  const cookie = clearTokenCookie();
  res.cookies.set(cookie.name, '', cookie);
  return res;
}
