export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { findUserByEmail, generateResetToken, updateUser } from '@/lib/auth';

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 });
  }

  // Always return success to avoid leaking which emails exist
  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = generateResetToken();
  const verloopt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  updateUser(user.id, { resetToken: token, resetTokenVerloopt: verloopt });

  const transporter = createTransporter();
  if (!transporter) {
    console.log('SMTP niet geconfigureerd – reset e-mail overgeslagen');
    return NextResponse.json({ success: true });
  }

  const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/wachtwoord-reset?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Wachtwoord herstellen - Ain Pronkjewail',
      text: `Hallo ${user.naam},\n\nJe hebt een wachtwoord-reset aangevraagd. Klik op de volgende link om je wachtwoord te herstellen:\n\n${resetUrl}\n\nDeze link is 1 uur geldig.\n\nAls je dit niet hebt aangevraagd, kun je deze e-mail negeren.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #829362;">Wachtwoord herstellen</h2>
          <p>Hallo ${user.naam},</p>
          <p>Je hebt een wachtwoord-reset aangevraagd. Klik op de knop hieronder om je wachtwoord te herstellen:</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: #829362; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
              Wachtwoord herstellen
            </a>
          </p>
          <p style="color: #888; font-size: 14px;">Deze link is 1 uur geldig. Als je dit niet hebt aangevraagd, kun je deze e-mail negeren.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Fout bij verzenden reset e-mail:', err);
  }

  return NextResponse.json({ success: true });
}
