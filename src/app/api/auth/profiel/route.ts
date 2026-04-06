import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, readUsers, writeUsers } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { naam, email } = await req.json();

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const emailExists = users.some(
      (u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase().trim()
    );
    if (emailExists) {
      return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik' }, { status: 400 });
    }
    users[idx].email = email.toLowerCase().trim();
  }

  if (naam && naam.trim()) {
    users[idx].naam = naam.trim();
  }

  writeUsers(users);

  return NextResponse.json({
    success: true,
    user: { id: users[idx].id, naam: users[idx].naam, email: users[idx].email },
  });
}
