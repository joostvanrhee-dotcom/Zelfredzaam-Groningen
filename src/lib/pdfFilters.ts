export type PdfFilterId = string;

export interface PdfFilter {
  id: PdfFilterId;
  label: string;
  groupLabel: string;
  keywords: string[];
  color?: string;
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
  {
    id: 'eten_ontmoeting',
    label: 'Eten en ontmoeting',
    groupLabel: 'Categorie',
    keywords: ['samen eten', 'buurtmaaltijd', 'volkskeuken', 'eettafel', 'gratis maaltijd', 'ontmoeting', 'ontmoetingsplek', 'buurthuis', 'dorpshuis', 'thuiskamer', 'inloophuis', 'inloop', 'buurtcafé', 'buurtcentrum', 'wijkcentrum', 'koffie', 'lunch', 'soepkeuken', 'maaltijdservice'],
  },
  {
    id: 'digitaal',
    label: 'Digitaal',
    groupLabel: 'Categorie',
    keywords: ['digitaal', 'computer', 'computerbank', 'laptop', 'internet', 'tablet', 'digibeet', 'digitale hulp', 'online', 'website', 'e-mail', 'smartphone', 'digivaardigheden', 'cursus computer', 'ict'],
  },
  {
    id: 'cultuur',
    label: 'Cultuur',
    groupLabel: 'Categorie',
    keywords: ['cultuur', 'museum', 'theater', 'concert', 'film', 'bioscoop', 'kunst', 'muziek', 'dans', 'bibliotheek', 'lezen', 'boek', 'expositie', 'tentoonstelling', 'cultureel', 'creatief', 'koor', 'toneel'],
  },
  {
    id: 'ruilen_hergebruik',
    label: 'Ruilen en delen',
    groupLabel: 'Categorie',
    keywords: ['ruilen', 'ruilwinkel', 'ruilnetwerk', 'weggeef', 'weggeefwinkel', 'weggeefkast', 'inbrengwinkel', 'tweedehands', 'kringloop', 'hergebruik', 'circulair', 'repair', 'reparatie', 'repair café', 'gratis spullen', 'delen', 'deeleconomie', 'niets-voor-niets'],
  },
];

export const SDG_FILTERS: PdfFilter[] = [
  {
    id: 'sdg1',
    label: 'SDG 1 – Geen armoede',
    groupLabel: "SDG's",
    color: '#E5243B',
    keywords: ['armoede', 'arm ', 'minima', 'minimum inkomen', 'bijstand', 'uitkering', 'schuld', 'schulden', 'financieel', 'noodfonds', 'noodhulp', 'voedselbank', 'leergeld', 'financiële hulp', 'financiële nood', 'financiële ondersteuning', 'inkomsten', 'inkomen'],
  },
  {
    id: 'sdg2',
    label: 'SDG 2 – Geen honger',
    groupLabel: "SDG's",
    color: '#DDA63A',
    keywords: ['voedsel', 'voedselbank', 'eten', 'maaltijd', 'soep', 'brood', 'voedselpakket', 'weggeefkast', 'buurtmaaltijd', 'samen eten', 'koken', 'honger', 'voedselhulp', 'gratis eten'],
  },
  {
    id: 'sdg3',
    label: 'SDG 3 – Goede gezondheid en welzijn',
    groupLabel: "SDG's",
    color: '#4C9F38',
    keywords: ['gezondheid', 'zorg', 'welzijn', 'medisch', 'dokter', 'apotheek', 'tandarts', 'ggz', 'psychisch', 'geestelijk', 'mantelzorg', 'sport', 'bewegen', 'fitness', 'wmo', 'mentaal', 'emotioneel', 'fysiek', 'huisarts', 'verpleging', 'ggd'],
  },
  {
    id: 'sdg4',
    label: 'SDG 4 – Kwaliteitsonderwijs',
    groupLabel: "SDG's",
    color: '#C5192D',
    keywords: ['onderwijs', 'school', 'educatie', 'bijles', 'huiswerkbegeleiding', 'studiefinanciering', 'leergeld', 'kinderopvang', 'opleiding', 'cursus', 'training', 'taalles', 'alfabetisering', 'leren', 'schoolspullen'],
  },
  {
    id: 'sdg5',
    label: 'SDG 5 – Gendergelijkheid',
    groupLabel: "SDG's",
    color: '#FF3A21',
    keywords: ['vrouw', 'gender', 'gendergelijkheid', 'vrouwen', 'emancipatie', 'huiselijk geweld', 'veilig thuis', 'menstruatie'],
  },
  {
    id: 'sdg6',
    label: 'SDG 6 – Schoon water en sanitair',
    groupLabel: "SDG's",
    color: '#26BDE2',
    keywords: ['water', 'sanitair', 'drinkwater', 'riolering', 'wateroverlast'],
  },
  {
    id: 'sdg7',
    label: 'SDG 7 – Betaalbare en duurzame energie',
    groupLabel: "SDG's",
    color: '#FCC30B',
    keywords: ['energie', 'energietoeslag', 'zonnepanelen', 'duurzame energie', 'energiearmoede', 'energiekosten', 'isolatie', 'warmtepomp', 'energiebesparing'],
  },
  {
    id: 'sdg8',
    label: 'SDG 8 – Waardig werk en economische groei',
    groupLabel: "SDG's",
    color: '#A21942',
    keywords: ['werk', 'baan', 'sollicitatie', 'werkervaring', 're-integratie', 'reintegratie', 'werktraject', 'leertraject', 'dagbesteding', 'vrijwillig', 'klussen', 'werklab', 'sociaal werkbedrijf', 'arbeidsmarkt'],
  },
  {
    id: 'sdg9',
    label: 'SDG 9 – Industrie, innovatie en infrastructuur',
    groupLabel: "SDG's",
    color: '#FD6925',
    keywords: ['innovatie', 'infrastructuur', 'digitaal', 'technologie', 'internet', 'computer', 'computerbank', 'laptop'],
  },
  {
    id: 'sdg10',
    label: 'SDG 10 – Ongelijkheid verminderen',
    groupLabel: "SDG's",
    color: '#DD1367',
    keywords: ['inclusief', 'inclusie', 'gelijkheid', 'ongelijkheid', 'diversiteit', 'discriminatie', 'toegankelijk', 'kwetsbaar', 'vluchtelingen', 'migranten', 'statushouders', 'anderstaligen', 'inburgering', 'integratie', 'gelijke kansen', 'kansengelijkheid'],
  },
  {
    id: 'sdg11',
    label: 'SDG 11 – Duurzame steden en gemeenschappen',
    groupLabel: "SDG's",
    color: '#FD9D24',
    keywords: ['duurzaam', 'duurzaamheid', 'gemeenschap', 'buurt', 'wijk', 'buurthuis', 'dorpshuis', 'ontmoeting', 'leefbaar', 'leefbaarheid', 'bewoners', 'solidariteit', 'verbinding', 'sociaal', 'wijkcentrum', 'buurtcentrum', 'buurtinitiatieven', 'samenleving'],
  },
  {
    id: 'sdg12',
    label: 'SDG 12 – Verantwoorde consumptie en productie',
    groupLabel: "SDG's",
    color: '#BF8B2E',
    keywords: ['tweedehands', 'kringloop', 'hergebruik', 'reparatie', 'weggeef', 'inbrengwinkel', 'ruilwinkel', 'circulair', 'weggeefkast', 'spullen', 'kleding'],
  },
  {
    id: 'sdg13',
    label: 'SDG 13 – Klimaatactie',
    groupLabel: "SDG's",
    color: '#3F7E44',
    keywords: ['klimaat', 'klimaatverandering', 'co2', 'milieu', 'groen', 'natuur', 'duurzaamheid', 'energiebesparing', 'uitstoot'],
  },
  {
    id: 'sdg14',
    label: 'SDG 14 – Leven in het water',
    groupLabel: "SDG's",
    color: '#0A97D9',
    keywords: ['zee', 'oceaan', 'water', 'vis', 'marien', 'kust'],
  },
  {
    id: 'sdg15',
    label: 'SDG 15 – Leven op het land',
    groupLabel: "SDG's",
    color: '#56C02B',
    keywords: ['natuur', 'landschap', 'biodiversiteit', 'bos', 'dieren', 'groen', 'planten', 'ecologie'],
  },
  {
    id: 'sdg16',
    label: 'SDG 16 – Vrede, justitie en sterke publieke diensten',
    groupLabel: "SDG's",
    color: '#00689D',
    keywords: ['juridisch', 'rechtshulp', 'rechtsbijstand', 'justitie', 'veiligheid', 'rechtbank', 'bestuur', 'overheid', 'gemeente', 'loket', 'spreekuur', 'recht'],
  },
  {
    id: 'sdg17',
    label: 'SDG 17 – Partnerschap om de doelen te bereiken',
    groupLabel: "SDG's",
    color: '#19486A',
    keywords: ['samenwerking', 'partnerschap', 'netwerk', 'coalitie', 'verbinding', 'samen', 'organisatie', 'stichting', 'vereniging'],
  },
];

export const PDF_FILTER_GROUPS: PdfFilterGroup[] = [
  {
    id: 'categorie',
    label: 'Categorie',
    filters: PDF_FILTERS,
  },
  {
    id: 'sdgs',
    label: "SDG's",
    filters: SDG_FILTERS,
  },
];
