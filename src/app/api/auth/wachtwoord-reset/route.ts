export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import db from '@/lib/db';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { token, wachtwoord } = await req.json();

  if (!token || !wachtwoord) {
    return NextResponse.json({ error: 'Token en wachtwoord zijn verplicht' }, { status: 400 });
  }

  if (wachtwoord.length < 8) {
    return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
  }

  const user = db.prepare('SELECT * FROM users WHERE resetToken = ?').get(token) as User | undefined;

  if (!user) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link' }, { status: 400 });
  }

  if (user.resetTokenVerloopt && new Date(user.resetTokenVerloopt) < new Date()) {
    db.prepare('UPDATE users SET resetToken = NULL, resetTokenVerloopt = NULL WHERE id = ?').run(user.id);
    return NextResponse.json({ error: 'Deze link is verlopen. Vraag een nieuwe aan.' }, { status: 400 });
  }

  db.prepare('UPDATE users SET wachtwoordHash = ?, resetToken = NULL, resetTokenVerloopt = NULL WHERE id = ?')
    .run(await hashPassword(wachtwoord), user.id);

  return NextResponse.json({ success: true });
}
