import type { Initiatief } from '@/lib/types';
import { PDF_FILTERS, type PdfFilterId } from '@/lib/pdfFilters';

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2019']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function initiativeText(item: Initiatief): string {
  return normalizeText(
    [
      item.naam,
      item.type,
      item.gemeente,
      item.adres,
      item.beschrijving,
      item.doelgroep,
      item.website,
    ].filter(Boolean).join(' ')
  );
}

export function getPdfFilterIdsForInitiatief(item: Initiatief): PdfFilterId[] {
  const text = initiativeText(item);

  const matches: PdfFilterId[] = [];
  for (const f of PDF_FILTERS) {
    const hit = f.keywords.some((kw) => {
      const k = normalizeText(kw);
      if (!k) return false;
      return text.includes(k);
    });
    if (hit) matches.push(f.id);
  }

  return matches;
}
