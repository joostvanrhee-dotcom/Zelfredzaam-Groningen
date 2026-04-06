import { NextRequest, NextResponse } from 'next/server';
import { readUsers, writeUsers, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { token, wachtwoord } = await req.json();

  if (!token || !wachtwoord) {
    return NextResponse.json({ error: 'Token en wachtwoord zijn verplicht' }, { status: 400 });
  }

  if (wachtwoord.length < 8) {
    return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.resetToken === token);

  if (idx === -1) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link' }, { status: 400 });
  }

  const user = users[idx];

  // Check expiry
  if (user.resetTokenVerloopt && new Date(user.resetTokenVerloopt) < new Date()) {
    // Clean up expired token
    users[idx].resetToken = undefined;
    users[idx].resetTokenVerloopt = undefined;
    writeUsers(users);
    return NextResponse.json({ error: 'Deze link is verlopen. Vraag een nieuwe aan.' }, { status: 400 });
  }

  // Update password and clear token
  users[idx].wachtwoordHash = await hashPassword(wachtwoord);
  users[idx].resetToken = undefined;
  users[idx].resetTokenVerloopt = undefined;
  writeUsers(users);

  return NextResponse.json({ success: true });
}
