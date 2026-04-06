import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import nodemailer from 'nodemailer';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const INITIATIEVEN_FILE = path.join(process.cwd(), 'src', 'data', 'initiatieven.json');

interface SubmissionRecord {
  id: string;
  soort: string;
  initiatiefId?: number;
  naam: string;
  type?: string;
  categorie?: string;
  filters?: string[];
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

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, '[]');
}

function readSubmissions(): SubmissionRecord[] {
  ensureDataDir();
  const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeSubmissions(data: SubmissionRecord[]) {
  ensureDataDir();
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2));
}

// ---- Email ----
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

async function sendStatusEmail(submission: SubmissionRecord) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('SMTP niet geconfigureerd – e-mail overgeslagen');
    return;
  }

  const isGoedgekeurd = submission.status === 'goedgekeurd';
  const soortLabel = {
    nieuw: 'aanmelding',
    wijziging: 'wijzigingsverzoek',
    afmelding: 'afmelding',
  }[submission.soort] || 'aanvraag';

  const subject = isGoedgekeurd
    ? `✅ Je ${soortLabel} voor "${submission.naam}" is goedgekeurd`
    : `❌ Je ${soortLabel} voor "${submission.naam}" is afgewezen`;

  const bodyText = isGoedgekeurd
    ? `Beste ${submission.indienerNaam},\n\nGoed nieuws! Je ${soortLabel} voor "${submission.naam}" is beoordeeld en goedgekeurd door een beheerder.\n\n${
        submission.soort === 'nieuw'
          ? 'Het initiatief is nu zichtbaar op de kaart van Zelfredzaam Groningen.'
          : submission.soort === 'wijziging'
          ? 'De wijzigingen zijn doorgevoerd.'
          : 'Het initiatief is van de kaart verwijderd.'
      }\n\nMet vriendelijke groet,\nZelfredzaam Groningen`
    : `Beste ${submission.indienerNaam},\n\nHelaas is je ${soortLabel} voor "${submission.naam}" afgewezen door een beheerder.\n\nAls je vragen hebt, neem dan contact met ons op.\n\nMet vriendelijke groet,\nZelfredzaam Groningen`;

  const htmlBody = isGoedgekeurd
    ? `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #829362; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="margin: 0;">✅ Goedgekeurd</h2>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Beste ${submission.indienerNaam},</p>
          <p>Goed nieuws! Je <strong>${soortLabel}</strong> voor <strong>"${submission.naam}"</strong> is beoordeeld en <span style="color: #16a34a; font-weight: bold;">goedgekeurd</span>.</p>
          <p>${
            submission.soort === 'nieuw'
              ? 'Het initiatief is nu zichtbaar op de kaart van Zelfredzaam Groningen.'
              : submission.soort === 'wijziging'
              ? 'De wijzigingen zijn doorgevoerd.'
              : 'Het initiatief is van de kaart verwijderd.'
          }</p>
          <p style="color: #6b7280; font-size: 14px;">Met vriendelijke groet,<br/>Zelfredzaam Groningen</p>
        </div>
      </div>`
    : `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h2 style="margin: 0;">❌ Afgewezen</h2>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p>Beste ${submission.indienerNaam},</p>
          <p>Helaas is je <strong>${soortLabel}</strong> voor <strong>"${submission.naam}"</strong> <span style="color: #dc2626; font-weight: bold;">afgewezen</span>.</p>
          <p>Als je vragen hebt, neem dan contact met ons op.</p>
          <p style="color: #6b7280; font-size: 14px;">Met vriendelijke groet,<br/>Zelfredzaam Groningen</p>
        </div>
      </div>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: submission.indienerEmail,
      subject,
      text: bodyText,
      html: htmlBody,
    });
    console.log(`E-mail verzonden naar ${submission.indienerEmail}`);
  } catch (err) {
    console.error('Fout bij verzenden e-mail:', err);
  }
}

// GET: list submissions (for admin)
export async function GET(req: NextRequest) {
  const pw = req.headers.get('x-admin-password');
  if (pw !== (process.env.ADMIN_PASSWORD || 'veerkracht2024')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = readSubmissions();
  return NextResponse.json(submissions);
}

// POST: create new submission
export async function POST(req: NextRequest) {
  const body = await req.json();

  // naam is required for nieuw, but for wijziging/afmelding it comes from the selected initiatief
  const naam = body.naam;
  if (!naam || !body.indienerNaam || !body.indienerEmail) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  const submissions = readSubmissions();
  const newSubmission: SubmissionRecord = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    soort: body.soort || 'nieuw',
    initiatiefId: body.initiatiefId ? Number(body.initiatiefId) : undefined,
    naam,
    type: body.type,
    categorie: body.categorie,
    filters: body.filters,
    gemeente: body.gemeente,
    postcode: body.postcode,
    adres: body.adres,
    beschrijving: body.beschrijving,
    doelgroep: body.doelgroep,
    website: body.website,
    telefoon: body.telefoon,
    emailInitiatief: body.emailInitiatief,
    toelichting: body.toelichting,
    indienerNaam: body.indienerNaam,
    indienerEmail: body.indienerEmail,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  submissions.push(newSubmission);
  writeSubmissions(submissions);

  return NextResponse.json({ success: true, id: newSubmission.id });
}

// PATCH: update submission status (for admin)
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

  const submissions = readSubmissions();
  const idx = submissions.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  }

  submissions[idx].status = status;
  writeSubmissions(submissions);

  const sub = submissions[idx];

  if (status === 'goedgekeurd') {
    try {
      const initRaw = fs.readFileSync(INITIATIEVEN_FILE, 'utf-8');
      const initiatieven = JSON.parse(initRaw);

      if (sub.soort === 'nieuw') {
        // Nieuw initiatief toevoegen
        const maxId = initiatieven.reduce((max: number, i: { id: number }) => Math.max(max, i.id), 0);

        let lat: number | null = null;
        let lng: number | null = null;
        if (sub.adres && sub.gemeente) {
          try {
            const q = encodeURIComponent(`${sub.adres}, ${sub.postcode || ''} ${sub.gemeente}, Netherlands`);
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=nl&limit=1`, {
              headers: { 'User-Agent': 'veerkracht-groningen' },
            });
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
              lat = parseFloat(geoData[0].lat);
              lng = parseFloat(geoData[0].lon);
            }
          } catch { /* geocoding failed */ }
        }

        const nieuwInitiatief = {
          id: maxId + 1,
          naam: sub.naam,
          type: sub.type || '',
          categorie: sub.type || '',
          gemeente: sub.gemeente || '',
          postcode: sub.postcode || '',
          adres: sub.adres || '',
          beschrijving: sub.beschrijving || '',
          doelgroep: sub.doelgroep || '',
          website: sub.website || '',
          telefoon: sub.telefoon || '',
          email: sub.emailInitiatief || '',
          lat,
          lng,
        };

        initiatieven.push(nieuwInitiatief);
        fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(initiatieven, null, 2));
      } else if (sub.soort === 'wijziging' && sub.initiatiefId) {
        // Wijziging doorvoeren
        const initIdx = initiatieven.findIndex((i: { id: number }) => i.id === sub.initiatiefId);
        if (initIdx !== -1) {
          const updated = { ...initiatieven[initIdx] };
          if (sub.type) updated.type = sub.type;
          if (sub.gemeente) updated.gemeente = sub.gemeente;
          if (sub.postcode !== undefined) updated.postcode = sub.postcode;
          if (sub.adres !== undefined) updated.adres = sub.adres;
          if (sub.beschrijving) updated.beschrijving = sub.beschrijving;
          if (sub.doelgroep) updated.doelgroep = sub.doelgroep;
          if (sub.website !== undefined) updated.website = sub.website;
          if (sub.telefoon !== undefined) updated.telefoon = sub.telefoon;
          if (sub.emailInitiatief !== undefined) updated.email = sub.emailInitiatief;

          // Re-geocode if address changed
          if (sub.adres && sub.gemeente) {
            try {
              const q = encodeURIComponent(`${sub.adres}, ${sub.postcode || ''} ${sub.gemeente}, Netherlands`);
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=nl&limit=1`, {
                headers: { 'User-Agent': 'veerkracht-groningen' },
              });
              const geoData = await geoRes.json();
              if (geoData.length > 0) {
                updated.lat = parseFloat(geoData[0].lat);
                updated.lng = parseFloat(geoData[0].lon);
              }
            } catch { /* geocoding failed */ }
          }

          initiatieven[initIdx] = updated;
          fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(initiatieven, null, 2));
        }
      } else if (sub.soort === 'afmelding' && sub.initiatiefId) {
        // Initiatief verwijderen van de kaart
        const filtered = initiatieven.filter((i: { id: number }) => i.id !== sub.initiatiefId);
        fs.writeFileSync(INITIATIEVEN_FILE, JSON.stringify(filtered, null, 2));
      }
    } catch (err) {
      console.error('Fout bij verwerken goedkeuring:', err);
    }
  }

  // Stuur e-mail notificatie naar indiener
  await sendStatusEmail(submissions[idx]);

  return NextResponse.json({ success: true });
}
