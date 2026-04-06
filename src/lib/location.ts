import type { Initiatief } from './types';

export type LocatieType = 'precies' | 'bijBenadering' | 'onbekend';

const POSTCODE_REGEX = /\b\d{4}\s?[A-Z]{0,2}\b/i;

/**
 * Heuristiek: "specifiek adres" = bevat postcode of (meestal) een huisnummer.
 * Plaatsnamen zoals "Groningen stad" of "Appingedam" tellen dan als niet-specifiek.
 */
export function isSpecifiekAdres(adres: string | null | undefined): boolean {
  const a = (adres ?? '').trim();
  if (!a) return false;
  if (POSTCODE_REGEX.test(a)) return true;
  return /\d/.test(a); // huisnummerindicatie
}

export function getLocatieType(item: Initiatief): LocatieType {
  if (item.lat && item.lng) return 'precies';
  return isSpecifiekAdres(item.adres) ? 'precies' : 'bijBenadering';
}

