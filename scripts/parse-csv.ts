/**
 * Parse de CSV van initiatieven naar een JSON bestand.
 * Gebruik: npx tsx scripts/parse-csv.ts
 */
import * as fs from 'fs';
import * as path from 'path';

interface RawInitiatief {
  id: number;
  naam: string;
  type: string;
  categorie: string;
  gemeente: string;
  adres: string;
  beschrijving: string;
  doelgroep: string;
  website: string;
  telefoon: string;
  email: string;
  lat: number | null;
  lng: number | null;
}

const csvPath = '/Users/joostvanrhee/Downloads/Initiatieven_V5.csv';
const outPath = path.resolve(__dirname, '../src/data/initiatieven.json');

// Lees CSV
const raw = fs.readFileSync(csvPath, 'utf-8');
const lines = raw.split('\n');

let currentCategorie = '';
const initiatieven: RawInitiatief[] = [];
let id = 1;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.replace(/;/g, '').trim() === '') continue;

  const cols = line.split(';');
  const naam = cols[0]?.trim() || '';
  const type = cols[1]?.trim() || '';

  // Detecteer categorie-headers: "1. Voedselbanken en voedselhulp"
  if (naam.match(/^\d+\.\s/) && !type) {
    currentCategorie = naam.replace(/^\d+\.\s*/, '').trim();
    continue;
  }

  // Skip rijen zonder naam of type (lege rijen, "c", etc.)
  if (!naam || !type || naam.length <= 2) continue;

  // Skip rijen waar de "naam" eigenlijk een postcode, telefoonnummer of datum is
  if (naam.match(/^\d{4}\s?[A-Z]{0,2}\b/) || naam.match(/^\d{2,3}-/) || naam.match(/^"?\d/) && !naam.match(/^[A-Z]/i)) continue;
  // Skip rijen waar naam begint met een aanhalingsteken (verschoven data)
  if (naam.startsWith('"') || naam.startsWith('€') || naam.startsWith('In ')) continue;
  // Skip e-mailadressen en URLs die als naam verschijnen
  if (naam.includes('@') || naam.startsWith('http') || naam.startsWith('www.')) continue;

  const gemeente = cols[2]?.trim() || '';
  const adres = cols[3]?.trim() || '';
  const beschrijving = cols[4]?.trim() || '';
  const doelgroep = cols[5]?.trim() || '';
  const website = cols[6]?.trim() || '';
  const telefoon = cols[7]?.trim() || '';
  const email = cols[8]?.trim() || '';

  initiatieven.push({
    id: id++,
    naam,
    type,
    categorie: currentCategorie,
    gemeente,
    adres,
    beschrijving,
    doelgroep,
    website: website === '—' ? '' : website,
    telefoon: telefoon === '—' ? '' : telefoon,
    email: email === '—' ? '' : email,
    lat: null,
    lng: null,
  });
}

// Schrijf JSON
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(initiatieven, null, 2), 'utf-8');

console.log(`✅ ${initiatieven.length} initiatieven geparsed naar ${outPath}`);

// Toon unieke categorieën
const cats = [...new Set(initiatieven.map(i => i.categorie))];
console.log(`\n📂 ${cats.length} categorieën:`);
cats.forEach(c => console.log(`   - ${c}`));

// Toon unieke gemeenten
const gems = [...new Set(initiatieven.map(i => i.gemeente))];
console.log(`\n📍 ${gems.length} unieke gemeente-waarden:`);
gems.forEach(g => console.log(`   - ${g}`));
