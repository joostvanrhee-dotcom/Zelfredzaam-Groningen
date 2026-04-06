import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, generateToken, tokenCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, wachtwoord } = await req.json();

    if (!email || !wachtwoord) {
      return NextResponse.json({ error: 'E-mailadres en wachtwoord zijn verplicht' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord' }, { status: 401 });
    }

    const valid = await verifyPassword(wachtwoord, user.wachtwoordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Onjuist e-mailadres of wachtwoord' }, { status: 401 });
    }

    const token = await generateToken(user);

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, naam: user.naam, email: user.email },
    });

    const cookie = tokenCookieOptions();
    res.cookies.set(cookie.name, token, cookie);

    return res;
  } catch {
    return NextResponse.json({ error: 'Er ging iets mis' }, { status: 500 });
  }
}
