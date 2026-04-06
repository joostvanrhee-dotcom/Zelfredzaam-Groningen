export type PdfFilterId = string;

export interface PdfFilter {
  id: PdfFilterId;
  label: string;
  groupLabel: string;
  keywords: string[];
}

export interface PdfFilterGroup {
  id: string;
  label: string;
  filters: PdfFilter[];
}

export const PDF_FILTERS: PdfFilter[] = [
  {
    id: 'wonen',
    label: 'Wonen',
    groupLabel: 'Categorie',
    keywords: ['wonen', 'huur', 'huurtoeslag', 'woning', 'onderdak', 'daklozen', 'opvang', 'huisvesting', 'kamers', 'verhuis', 'energietoeslag', 'energie', 'isolatie'],
  },
  {
    id: 'boodschappen',
    label: 'Boodschappen',
    groupLabel: 'Categorie',
    keywords: ['boodschappen', 'voedsel', 'voedselbank', 'eten', 'maaltijd', 'soep', 'brood', 'gratis eten', 'voedselpakket', 'weggeefkast', 'buurtmaaltijd', 'samen eten', 'koken'],
  },
  {
    id: 'inkomsten',
    label: 'Inkomsten',
    groupLabel: 'Categorie',
    keywords: ['inkomsten', 'inkomen', 'uitkering', 'bijstand', 'toeslagen', 'belasting', 'subsidie', 'kinderbijslag', 'zorgtoeslag', 'minimaregeling', 'minima', 'financieel', 'armoede', 'koopkracht', 'gemeentefonds', 'noodfonds'],
  },
  {
    id: 'gezondheid',
    label: 'Gezondheid en zorg',
    groupLabel: 'Categorie',
    keywords: ['gezondheid', 'zorg', 'zorgverzekering', 'medisch', 'dokter', 'apotheek', 'tandarts', 'ggz', 'psychisch', 'mantelzorg', 'wmo', 'chronisch', 'menstruatie', 'zorgkosten', 'ggd'],
  },
  {
    id: 'kind_school',
    label: 'Kind en school',
    groupLabel: 'Categorie',
    keywords: ['kind', 'kinderen', 'school', 'onderwijs', 'leergeld', 'schoolspullen', 'studiefinanciering', 'huiswerkbegeleiding', 'bijles', 'kinderopvang', 'baby', 'zwangerschap', 'jeugd', 'jongeren', 'speelgoed', 'speelotheek', 'fietsbank', 'fiets', 'laptop'],
  },
  {
    id: 'kleding_spullen',
    label: 'Kleding en spullen',
    groupLabel: 'Categorie',
    keywords: ['kleding', 'kledingbank', 'spullen', 'weggeef', 'kringloop', 'tweedehands', 'gratis spullen', 'ruilwinkel', 'inbrengwinkel', 'meubels', 'huisraad', 'computer', 'computerbank', 'boetiek'],
  },
  {
    id: 'uitjes_vrije_tijd',
    label: 'Uitjes en vrije tijd',
    groupLabel: 'Categorie',
    keywords: ['uitje', 'vrije tijd', 'sport', 'cultuur', 'museum', 'zwembad', 'recreatie', 'vakantie', 'pas', 'stadjerspas', 'korting', 'ontmoeting', 'ontmoetingsplek', 'buurthuis', 'dorpshuis', 'thuiskamer', 'bewegen', 'fitness'],
  },
  {
    id: 'geldzaken',
    label: 'Geldzaken',
    groupLabel: 'Categorie',
    keywords: ['geld', 'schuld', 'schulden', 'schuldhulp', 'budget', 'budgetcoach', 'financieel', 'administratie', 'belasting', 'budgetbeheer', 'bewindvoering', 'spaarkring', 'sparen'],
  },
  {
    id: 'werk',
    label: 'Werk',
    groupLabel: 'Categorie',
    keywords: ['werk', 'baan', 'sollicitatie', 'werkervaring', 're-integratie', 'reintegratie', 'werktraject', 'leertraject', 'dagbesteding', 'vrijwillig', 'klussen', 'werklab', 'sociaal werkbedrijf'],
  },
  {
    id: 'organisaties',
    label: 'Organisaties die ondersteunen',
    groupLabel: 'Categorie',
    keywords: ['ondersteuning', 'hulpverlening', 'sociaal werk', 'maatschappelijk werk', 'wij groningen', 'humanitas', 'gemeente', 'stichting', 'buddy', 'coach', 'begeleiding', 'advies', 'spreekuur', 'loket', 'moskee', 'kerk', 'diaconie', 'religieus'],
  },
];

export const PDF_FILTER_GROUPS: PdfFilterGroup[] = [
  {
    id: 'categorie',
    label: 'Categorie',
    filters: PDF_FILTERS,
  },
];
