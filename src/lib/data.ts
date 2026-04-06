import initiatievenRaw from '@/data/initiatieven.json';
import type { Initiatief } from './types';

export const initiatieven: Initiatief[] = initiatievenRaw as Initiatief[];

export const categorieen = [...new Set(initiatieven.map(i => i.categorie))].sort();

// Extraheer de hoofd-gemeente uit het gemeente/plaats veld
function extractGemeente(raw: string): string {
  if (!raw) return 'Onbekend';
  // Patronen: "Groningen (stad)", "Eemsdelta / Delfzijl", "Groningen / Vinkhuizen"
  const cleaned = raw.split('/')[0].trim().split('(')[0].trim().split(',')[0].trim();
  // Normaliseer bekende gemeentenamen
  const mapping: Record<string, string> = {
    'Groningen': 'Groningen',
    'Eemsdelta': 'Eemsdelta',
    'Het Hogeland': 'Het Hogeland',
    'Midden-Groningen': 'Midden-Groningen',
    'Oldambt': 'Oldambt',
    'Stadskanaal': 'Stadskanaal',
    'Veendam': 'Veendam',
    'Westerkwartier': 'Westerkwartier',
    'Westerwolde': 'Westerwolde',
    'Pekela': 'Pekela',
  };
  for (const [key, val] of Object.entries(mapping)) {
    if (cleaned.startsWith(key)) return val;
  }
  if (raw.includes('Provinciaal') || raw.includes('provincie') || raw.includes('Gehele')) return 'Provinciaal';
  if (raw.includes('Landelijk') || raw.includes('Regio')) return 'Provinciaal';
  return cleaned || 'Onbekend';
}

// Vaste lijst van alle gemeenten in de provincie Groningen
export const gemeenten = [
  'Eemsdelta',
  'Groningen',
  'Het Hogeland',
  'Midden-Groningen',
  'Oldambt',
  'Pekela',
  'Stadskanaal',
  'Veendam',
  'Westerkwartier',
  'Westerwolde',
];

export function getGemeente(initiatief: Initiatief): string {
  return extractGemeente(initiatief.gemeente);
}

export const stats = {
  totaal: initiatieven.length,
  categorieen: categorieen.length,
  gemeenten: 10,
};
