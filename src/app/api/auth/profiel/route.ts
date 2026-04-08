export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, findUserById, updateUser } from '@/lib/auth';
import db from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { naam, email } = await req.json();

  if (email && email.toLowerCase().trim() !== user.email) {
    const emailExists = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?')
      .get(email.trim(), user.id);
    if (emailExists) {
      return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik' }, { status: 400 });
    }
  }

  const updates: Record<string, string> = {};
  if (naam && naam.trim()) updates.naam = naam.trim();
  if (email && email.toLowerCase().trim()) updates.email = email.toLowerCase().trim();

  if (Object.keys(updates).length > 0) {
    updateUser(user.id, updates);
  }

  const updated = findUserById(user.id)!;
  return NextResponse.json({
    success: true,
    user: { id: updated.id, naam: updated.naam, email: updated.email },
  });
}
