import { NextRequest, NextResponse } from 'next/server';
import { createUser, generateToken, tokenCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { naam, email, wachtwoord } = await req.json();

    if (!naam || !email || !wachtwoord) {
      return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 });
    }

    if (wachtwoord.length < 8) {
      return NextResponse.json({ error: 'Wachtwoord moet minimaal 8 tekens zijn' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 });
    }

    const user = await createUser(naam, email, wachtwoord);
    const token = await generateToken(user);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, naam: user.naam, email: user.email },
    });

    const cookie = tokenCookieOptions();
    res.cookies.set(cookie.name, token, cookie);

    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Er ging iets mis';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
