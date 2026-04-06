import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';
import db from '@/lib/db';

const INITIATIEVEN_FILE = path.join(process.cwd(), 'src', 'data', 'initiatieven.json');

interface SubmissionRow {
  id: string;
  soort: string;
  initiatiefId?: number;
  naam: string;
  type?: string;
  categorie?: string;
  filters?: string;
  gemeente?: string;
  postcode?: string;
  adres?: string;
  beschrijving?: string;
  doelgroep?: string;
  website?: string;
  telefoon?: string;
  emailInitiatief?: string;
  toelichting?: string;
  indienerNaam: string;
  indienerEmail: string;
  status: 'pending' | 'goedgekeurd' | 'afgewezen';
  createdAt: string;
}

function rowToSubmission(row: SubmissionRow) {
  return {
    ...row,
    filters: row.filters ? JSON.parse(row.filters) : undefined,
  };
}

// ---- Email ----
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

async function sendStatusEmail(sub: SubmissionRow) {
  const transporter = createTransporter();
  if (!transporter) return;

  const isGoedgekeurd = sub.status === 'goedgekeurd';
  const soortLabel = { nieuw: 'aanmelding', wijziging: 'wijzigingsverzoek', afmelding: 'afmelding' }[sub.soort] || 'aanvraag';
  const subject = isGoedgekeurd
    ? `✅ Je ${soortLabel} voor "${sub.naam}" is goedgekeurd`
    : `❌ Je ${soortLabel} voor "${sub.naam}" is afgewezen`;

  const bodyText = isGoedgekeurd
    ? `Beste ${sub.indienerNaam},\n\nGoed nieuws! Je ${soortLabel} voor "${sub.naam}" is goedgekeurd.\n\n${
        sub.soort === 'nieuw' ? 'Het initiatief is nu zichtbaar op de kaart van Zelfredzaam Groningen.'
        : sub.soort === 'wijziging' ? 'De wijzigingen zijn doorgevoerd.'
        : 'Het initiatief is van de kaart verwijderd.'
      }\n\nMet vriendelijke groet,\nZelfredzaam Groningen`
    : `Beste ${sub.indienerNaam},\n\nHelaas is je ${soortLabel} voor "${sub.naam}" afgewezen.\n\nAls je vragen hebt, neem dan contact met ons op.\n\nMet vriendelijke groet,\nZelfredzaam Groningen`;

  const htmlBody = isGoedgekeurd
    ? `<div style="font-family:sans-serif;max-width:500px;margin:0 auto"><div style="background:#829362;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center"><h2 style="margin:0">✅ Goedgekeurd</h2></div><div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><p>Beste ${sub.indienerNaam},</p><p>Je <strong>${soortLabel}</strong> voor <strong>"${sub.naam}"</strong> is <span style="color:#16a34a;font-weight:bold">goedgekeurd</span>.</p><p>${sub.soort === 'nieuw' ? 'Het initiatief is nu zichtbaar op de kaart.' : sub.soort === 'wijziging' ? 'De wijzigingen zijn doorgevoerd.' : 'Het initiatief is verwijderd.'}</p><p style="color:#6b7280;font-size:14px">Met vriendelijke groet,<br/>Zelfredzaam Groningen</p></div></div>`
    : `<div style="font-family:sans-serif;max-width:500px;margin:0 auto"><div style="background:#dc2626;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center"><h2 style="margin:0">❌ Afgewezen</h2></div><div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px"><p>Beste ${sub.indienerNaam},</p><p>Je <strong>${soortLabel}</strong> voor <strong>"${sub.naam}"</strong> is <span style="color:#dc2626;font-weight:bold">afgewezen</span>.</p><p>Als je vragen hebt, neem dan contact met ons op.</p><p style="color:#6b7280;font-size:14px">Met vriendelijke groet,<br/>Zelfredzaam Groningen</p></div></div>`;

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: sub.indienerEmail, subject, text: bodyText, html: htmlBody });
  } catch (err) {
    console.error('Fout bij verzenden e-mail:', err);
  }
}

// GET: list submissions (admin only)
export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (pw !== (process.env.ADMIN_PASSWORD || 'veerkracht2024')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rows = db.prepare('SELECT * FROM submissions ORDER BY createdAt DESC').all() as SubmissionRow[];
  return NextResponse.json(rows.map(rowToSubmission));
}

// POST: create new submission
export async function POST(req: NextRequest) {
  const body = await req.json();
  const naam = body.naam;
  if (!naam || !body.indienerNaam || !body.indienerEmail) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  db.prepare(`
    INSERT INTO submissions (id, soort, initiatiefId, naam, type, categorie, filters, gemeente, postcode, adres, beschrijving, doelgroep, website, telefoon, emailInitiatief, toelichting, indienerNaam, indienerEmail, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
  `).run(
    id, body.soort || 'nieuw', body.initiatiefId ? Number(body.initiatiefId) : null,
    naam, body.type ?? null, body.categorie ?? null,
    body.filters ? JSON.stringify(body.filters) : null,
    body.gemeente ?? null, body.postcode ?? null, body.adres ?? null,
    body.beschrijving ?? null, body.doelgroep ?? null, body.website ?? null,
    body.telefoon ?? null, body.emailInitiatief ?? null, body.toelichting ?? null,
    body.indienerNaam, body.indienerEmail, new Date().toISOString()
  );

  return NextResponse.json({ success: true, id });
}

// PATCH: update submission status (admin only)
export async function PATCH(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (pw !== (process.env.ADMIN_PASSWORD || 'veerkracht2024')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;

  if (!id || !['goedgekeurd', 'afgewezen'].includes(status)) {
    return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 });
  }

  const sub = db.prepare('SELECT * FROM submissions WHERE id = ?').get(id) as SubmissionRow | undefined;
  if (!sub) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, id);
  sub.status = status;

  if (status === 'goedgekeurd') {
    try {
      const initiatieven = JSON.parse(fs.readFileSync(INITIATIEVEN_FILE, 'utf-8'));

      if (sub.soort === 'nieuw') {
        const maxId = initiatieven.reduce((max: number, i: { id: number }) => Math.max(max, i.id), 0);

        let lat: number | null = null;
        let lng: number | null = null;
        if (sub.adres && sub.gemeente) {
          try {
            const q = encodeURIComponent(`${sub.adres}, ${sub.postcode || ''} ${sub.gemeente}, Netherlands`);
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=nl&limit=1`, {
              headers: { 'User-Agent': 'ZelfredzaamGroningen/1.0' },
            });
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
              lat = parseFloat(geoData[0].lat);
              lng = parseFloat(geoData[0].lon);
            }
          } catch { /* geocoding failed */ }
        }

        initiatieven.push({
          id: maxId + 1, naam: sub.naam, type: sub.type || '',
          categorie: sub.categorie || sub.type || '', gemeente: sub.gemeente || '',
          postcode: sub.postcode || '', adres: sub.adres || '',
          beschrijving: sub.beschrijving || '', doelgroep: sub.doelgroep || '',
          website: sub.website || '', telefoon: sub.telefoon || '',
          email: sub.emailInitiatief || '', lat, lng,
        });
        fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(initiatieven, null, 2));

      } else if (sub.soort === 'wijziging' && sub.initiatiefId) {
        const idx = initiatieven.findIndex((i: { id: number }) => i.id === sub.initiatiefId);
        if (idx !== -1) {
          const updated = { ...initiatieven[idx] };
          if (sub.type) updated.type = sub.type;
          if (sub.gemeente) updated.gemeente = sub.gemeente;
          if (sub.postcode !== undefined) updated.postcode = sub.postcode;
          if (sub.adres !== undefined) updated.adres = sub.adres;
          if (sub.beschrijving) updated.beschrijving = sub.beschrijving;
          if (sub.doelgroep) updated.doelgroep = sub.doelgroep;
          if (sub.website !== undefined) updated.website = sub.website;
          if (sub.telefoon !== undefined) updated.telefoon = sub.telefoon;
          if (sub.emailInitiatief !== undefined) updated.email = sub.emailInitiatief;
          if (sub.adres && sub.gemeente) {
            try {
              const q = encodeURIComponent(`${sub.adres}, ${sub.postcode || ''} ${sub.gemeente}, Netherlands`);
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=nl&limit=1`, {
                headers: { 'User-Agent': 'ZelfredzaamGroningen/1.0' },
              });
              const geoData = await geoRes.json();
              if (geoData.length > 0) { updated.lat = parseFloat(geoData[0].lat); updated.lng = parseFloat(geoData[0].lon); }
            } catch { /* geocoding failed */ }
          }
          initiatieven[idx] = updated;
          fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(initiatieven, null, 2));
        }

      } else if (sub.soort === 'afmelding' && sub.initiatiefId) {
        fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(
          initiatieven.filter((i: { id: number }) => i.id !== sub.initiatiefId), null, 2
        ));
      }
    } catch (err) {
      console.error('Fout bij verwerken goedkeuring:', err);
    }
  }

  await sendStatusEmail(sub);
  return NextResponse.json({ success: true });
}
