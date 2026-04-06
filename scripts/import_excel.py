"""
Import initiatives from Excel into initiatieven.json.
- Skips section headers
- Deduplicates by name (case-insensitive)
- Geocodes via Nominatim (1 req/sec, free)
- Falls back to gemeente-level coords if address fails
Usage: python3 scripts/import_excel.py
"""

import json, re, time, urllib.request, urllib.parse, sys
from pathlib import Path
import openpyxl

EXCEL_PATH = Path('/Users/joostvanrhee/Desktop/Initiatieven_V5 (2).xlsx')
JSON_PATH  = Path('src/data/initiatieven.json')
HEADERS    = {'User-Agent': 'ZelfredzaamGroningen/1.0 (joost3839@gmail.com)'}

# ── Category mapping: Excel section → site categorie ─────────────────────────
CAT_MAP = {
    'Voedselbanken en voedselhulp':                         'Voedsel & basisbehoeften',
    'Volkskeukens, eettafels en gratis maaltijden':         'Voedsel & basisbehoeften',
    'Voedsel- en tuininitiatieven':                         'Voedsel & basisbehoeften',
    'Voedseltuinen en buurtmoestuinen':                     'Voedsel & basisbehoeften',
    'Gratis maaltijden en voedsel (aanvullend)':            'Voedsel & basisbehoeften',
    'Schoolmaaltijden en voedselhulp kinderen':             'Voedsel & basisbehoeften',
    'Maaltijdnetwerken door buren':                         'Voedsel & basisbehoeften',
    'Gratis menstruatieproducten en voedselkastjes':        'Voedsel & basisbehoeften',
    'Weggeefkasten en minibiebs':                           'Voedsel & basisbehoeften',

    'Kledingbanken':                                        'Kleding & spullen',
    'Weggeefwinkels en ruilnetwerken':                      'Kleding & spullen',
    'Weggeefwinkels en weggeefpunten':                      'Kleding & spullen',
    'Meubelbanken en babyspullenbanken':                    'Kleding & spullen',
    'Kringloopwinkels met sociaal doel':                    'Kleding & spullen',
    'Repair Cafés':                                         'Kleding & spullen',
    'Materiële hergebruik (aanvullend)':                    'Kleding & spullen',
    'Computerbanken':                                       'Kleding & spullen',
    'Fietsbanken en brillenbanken':                         'Kleding & spullen',
    'Brillen en optiek voor minima':                        'Kleding & spullen',
    'Speelgoedbanken en speelotheek':                       'Kleding & spullen',
    'Speelgoeduitleen en kinderopvang':                     'Kleding & spullen',
    'Wasvoorzieningen voor minima':                         'Kleding & spullen',
    'Deeleconomie en zaadbanken':                           'Kleding & spullen',
    'Online weggeefplatforms en Facebook-groepen':          'Kleding & spullen',
    'Digitale hulp en ruilplatforms (aanvullend)':          'Kleding & spullen',

    'Schuldhulpverlening en financieel advies (vrijwilligers)': 'Financiële ondersteuning',
    'Schuldhulp (aanvullend)':                              'Financiële ondersteuning',
    'Noodhulp, fondsen en kindhulporganisaties':            'Financiële ondersteuning',
    'Noodfondsen en studiefondsen (aanvullend)':            'Financiële ondersteuning',
    'Kerkelijke noodfondsen en diaconale hulp (aanvullend)':'Financiële ondersteuning',
    'Religieuze noodfondsen':                               'Financiële ondersteuning',
    'Solidariteitsfondsen en buurtbudgetten':               'Financiële ondersteuning',
    'Spaarkringen en migrantennetwerken (aanvullend)':      'Financiële ondersteuning',
    'Belastingservice, formulierenbrigades en energiecoaches': 'Financiële ondersteuning',
    'Informele administratie- en belastinghulp':            'Financiële ondersteuning',

    'Welzijnsorganisaties, buurthuizen en maatjesprojecten': 'Ontmoeting & ondersteuning',
    'Buurthulp en buurtnetwerken':                          'Ontmoeting & ondersteuning',
    'Dorpscoöperaties en noaberschap-initiatieven':         'Ontmoeting & ondersteuning',
    'Bewonersinitiatieven stad Groningen':                  'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Eemsdelta':                          'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Het Hogeland':                       'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Midden-Groningen':                   'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Oldambt':                            'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Pekela':                             'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Veendam':                            'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Westerkwartier':                     'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Westerwolde':                        'Ontmoeting & ondersteuning',
    'Wijk- en dorpsinitiatieven (aanvullend)':              'Ontmoeting & ondersteuning',
    'Informele zorgnetwerken':                              'Ontmoeting & ondersteuning',
    'Mantelzorgondersteuning':                              'Ontmoeting & ondersteuning',
    'Senioren in armoede':                                  'Ontmoeting & ondersteuning',
    'Statushouders en vluchtelingen':                       'Ontmoeting & ondersteuning',
    'Taalmaatjes en taalondersteuning':                     'Ontmoeting & ondersteuning',
    'Klussenteams':                                         'Ontmoeting & ondersteuning',
    'Vervoershulp en buurtbussen':                          'Ontmoeting & ondersteuning',
    'Overige initiatieven':                                 'Ontmoeting & ondersteuning',

    'Onderwijs & ontwikkeling':                             'Onderwijs & ontwikkeling',
    "Jongeren in armoede – onderwijs en creatieve programma's": 'Onderwijs & ontwikkeling',
    'Huiswerkbegeleiding':                                  'Onderwijs & ontwikkeling',
    'Digitale hulp en digibeten-ondersteuning':             'Onderwijs & ontwikkeling',

    'Vakantie, uitjes en vrije tijd voor minima':           'Vrije tijd & welzijn',
    'Sport, zwemlessen en vakantiekampen voor kinderen':    'Vrije tijd & welzijn',
    'Muziek en cultuur voor minima':                        'Vrije tijd & welzijn',
    'Creatieve solidariteit: cadeaus en pakketten':         'Vrije tijd & welzijn',

    'Zorg en gezondheid voor minima':                       'Gezondheid & zorg',
    'Kapper voor daklozen en minima':                       'Gezondheid & zorg',
    'Daklozen- en nachtopvang':                             'Gezondheid & zorg',
    'Gratis kinderopvang':                                  'Gezondheid & zorg',
    'Dierenwelzijn en huisdieren voor minima':              'Gezondheid & zorg',

    'Werk en participatie (aanvullend)':                    'Werk & participatie',
    'Schoonmaakhulp en opruimteams':                        'Werk & participatie',
}

def map_categorie(excel_cat):
    return CAT_MAP.get(excel_cat, 'Ontmoeting & ondersteuning')

def geocode(adres, gemeente):
    """Try full address first, fall back to gemeente. Uses curl to avoid SSL issues."""
    import subprocess

    def query(q):
        q_full = q + ', Netherlands'
        url = f'https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q_full)}&format=json&limit=1'
        try:
            result = subprocess.run(
                ['curl', '-s', '-A', 'ZelfredzaamGroningen/1.0 (joost3839@gmail.com)', url],
                capture_output=True, text=True, timeout=10
            )
            data = json.loads(result.stdout)
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
        except Exception:
            pass
        return None

    time.sleep(1)  # Nominatim rate limit
    if adres and adres.strip():
        result = query(adres)
        if result:
            return result
    if gemeente and gemeente.strip():
        # Strip municipality hints like "Groningen (stad)"
        gem = re.sub(r'\s*\(.*?\)', '', gemeente).split('/')[0].strip()
        result = query(gem)
        if result:
            return result
    return None, None

# ── Load existing data ────────────────────────────────────────────────────────
with open(JSON_PATH) as f:
    existing = json.load(f)

existing_names = {e['naam'].strip().lower() for e in existing}
next_id = max(e['id'] for e in existing) + 1

# ── Parse Excel ───────────────────────────────────────────────────────────────
wb = openpyxl.load_workbook(EXCEL_PATH)
ws = wb['Alle initiatieven']

current_cat = ''
new_items = []

for row in ws.iter_rows(min_row=2, values_only=True):
    naam = str(row[0]).strip() if row[0] else ''
    type_ = str(row[1]).strip() if row[1] else ''

    # Section header?
    if naam and not type_ and re.match(r'^\d+\.', naam):
        current_cat = re.sub(r'^\d+\.\s*', '', naam)
        continue

    if not naam or not type_:
        continue

    # Deduplicate
    if naam.lower() in existing_names:
        continue

    gemeente = str(row[2]).strip() if row[2] else ''
    adres    = str(row[3]).strip() if row[3] else ''
    beschr   = str(row[4]).strip() if row[4] else ''
    doelgr   = str(row[5]).strip() if row[5] else ''
    website  = str(row[6]).strip() if row[6] else ''
    telefoon = str(row[7]).strip() if row[7] else ''
    email    = str(row[8]).strip() if row[8] else ''

    for field in [website, telefoon, email]:
        if field == 'None': field = ''

    new_items.append({
        'naam': naam,
        'type': type_,
        'categorie': map_categorie(current_cat),
        'gemeente': gemeente if gemeente != 'None' else '',
        'adres': adres if adres != 'None' else '',
        'beschrijving': beschr if beschr != 'None' else '',
        'doelgroep': doelgr if doelgr != 'None' else '',
        'website': '' if website in ('None', '—') else website,
        'telefoon': '' if telefoon in ('None', '—') else telefoon,
        'email': '' if email in ('None', '—') else email,
    })
    existing_names.add(naam.lower())

print(f'Found {len(new_items)} new initiatives to add (skipped duplicates)')

# ── Geocode ───────────────────────────────────────────────────────────────────
geocoded = []
for i, item in enumerate(new_items):
    lat, lng = geocode(item['adres'], item['gemeente'])
    item['id'] = next_id
    item['lat'] = lat
    item['lng'] = lng
    item['postcode'] = ''
    geocoded.append(item)
    next_id += 1

    status = f'✓ ({lat:.4f},{lng:.4f})' if lat else '✗ no coords'
    print(f'[{i+1}/{len(new_items)}] {item["naam"][:50]} — {status}', flush=True)

    # Save progress every 50
    if (i + 1) % 50 == 0:
        merged = existing + geocoded
        with open(JSON_PATH, 'w') as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
        print(f'  → Saved progress ({len(merged)} total)')

# ── Final save ────────────────────────────────────────────────────────────────
merged = existing + geocoded
with open(JSON_PATH, 'w') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

no_coords = sum(1 for x in geocoded if not x['lat'])
print(f'\n✅ Done! {len(merged)} total initiatives ({len(geocoded)} added, {no_coords} without coords)')
