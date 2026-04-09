export interface Initiatief {
  id: number;
  naam: string;
  type: string;
  categorie: string;
  gemeente: string;
  postcode?: string;
  adres: string;
  beschrijving: string;
  doelgroep: string;
  website: string;
  telefoon: string;
  email: string;
  lat: number | null;
  lng: number | null;
  pdfFilterIds?: string[];
}

export interface Submission {
  id: string;
  soort: 'nieuw' | 'wijziging' | 'afmelding';
  initiatiefId?: number;
  data: Partial<Initiatief>;
  indienerNaam: string;
  indienerEmail: string;
  toelichting: string;
  status: 'pending' | 'goedgekeurd' | 'afgewezen';
  createdAt: string;
}

// Forum types
export type ForumCategorie = 'Hulpvraag' | 'Gezocht' | 'Aanbod' | 'Juridisch' | 'Vrijwilligers' | 'Overig';

export const FORUM_CATEGORIEEN: ForumCategorie[] = [
  'Hulpvraag', 'Gezocht', 'Aanbod', 'Juridisch', 'Vrijwilligers', 'Overig',
];

export interface ForumReactie {
  id: string;
  postId: string;
  auteurNaam: string;
  gebruikerId?: string;
  inhoud: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  titel: string;
  inhoud: string;
  categorie: ForumCategorie;
  auteurNaam: string;
  auteurEmail: string;
  gebruikerId?: string;
  reacties: ForumReactie[];
  createdAt: string;
}

export interface User {
  id: string;
  naam: string;
  email: string;
  wachtwoordHash: string;
  resetToken?: string;
  resetTokenVerloopt?: string;
  createdAt: string;
}
