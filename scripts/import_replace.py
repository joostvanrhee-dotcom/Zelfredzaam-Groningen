"""
Import initiatives from Excel — REPLACES all existing initiatieven.json data.
Uses Photon for geocoding (no SSL issues).
Usage: python3 scripts/import_replace.py
"""

import json, re, time, urllib.parse, subprocess
from pathlib import Path
import openpyxl

EXCEL_PATH = Path('/Users/joostvanrhee/Desktop/Initiatieven_V11.xlsx')
JSON_PATH  = Path('src/data/initiatieven.json')
ADRES_COL  = 12  # Column M (0-indexed): "Nieuwe adressen" — cleaner addresses for geocoding

NO_FIXED = [
    'via website', 'diverse locatie', 'mobiel door', 'op afspraak',
    'landelijk', 'provinciaal', 'gehele provincie', 'wisselende',
    'postbus', 'locatie op aanvraag', 'aan huis', 'thuisbezoek',
]

CAT_MAP = {
    'Voedselbanken en voedselhulp':                              'Voedsel & basisbehoeften',
    'Volkskeukens, eettafels en gratis maaltijden':              'Voedsel & basisbehoeften',
    'Voedsel- en tuininitiatieven':                              'Voedsel & basisbehoeften',
    'Voedseltuinen en buurtmoestuinen':                          'Voedsel & basisbehoeften',
    'Gratis maaltijden en voedsel (aanvullend)':                 'Voedsel & basisbehoeften',
    'Schoolmaaltijden en voedselhulp kinderen':                  'Voedsel & basisbehoeften',
    'Maaltijdnetwerken door buren':                              'Voedsel & basisbehoeften',
    'Gratis menstruatieproducten en voedselkastjes':             'Voedsel & basisbehoeften',
    'Weggeefkasten en minibiebs':                                'Voedsel & basisbehoeften',

    'Kledingbanken':                                             'Kleding & spullen',
    'Weggeefwinkels en ruilnetwerken':                           'Kleding & spullen',
    'Weggeefwinkels en weggeefpunten':                           'Kleding & spullen',
    'Meubelbanken en babyspullenbanken':                         'Kleding & spullen',
    'Kringloopwinkels met sociaal doel':                         'Kleding & spullen',
    'Repair Cafés':                                              'Kleding & spullen',
    'Materiële hergebruik (aanvullend)':                         'Kleding & spullen',
    'Computerbanken':                                            'Kleding & spullen',
    'Fietsbanken en brillenbanken':                              'Kleding & spullen',
    'Brillen en optiek voor minima':                             'Kleding & spullen',
    'Speelgoedbanken en speelotheek':                            'Kleding & spullen',
    'Speelgoeduitleen en kinderopvang':                          'Kleding & spullen',
    'Wasvoorzieningen voor minima':                              'Kleding & spullen',
    'Deeleconomie en zaadbanken':                                'Kleding & spullen',
    'Online weggeefplatforms en Facebook-groepen':               'Kleding & spullen',
    'Digitale hulp en ruilplatforms (aanvullend)':               'Kleding & spullen',

    'Schuldhulpverlening en financieel advies (vrijwilligers)':  'Financiële ondersteuning',
    'Schuldhulp (aanvullend)':                                   'Financiële ondersteuning',
    'Noodhulp, fondsen en kindhulporganisaties':                 'Financiële ondersteuning',
    'Noodfondsen en studiefondsen (aanvullend)':                 'Financiële ondersteuning',
    'Kerkelijke noodfondsen en diaconale hulp (aanvullend)':     'Financiële ondersteuning',
    'Religieuze noodfondsen':                                    'Financiële ondersteuning',
    'Solidariteitsfondsen en buurtbudgetten':                    'Financiële ondersteuning',
    'Spaarkringen en migrantennetwerken (aanvullend)':           'Financiële ondersteuning',
    'Belastingservice, formulierenbrigades en energiecoaches':   'Financiële ondersteuning',
    'Informele administratie- en belastinghulp':                 'Financiële ondersteuning',

    'Welzijnsorganisaties, buurthuizen en maatjesprojecten':     'Ontmoeting & ondersteuning',
    'Buurthulp en buurtnetwerken':                               'Ontmoeting & ondersteuning',
    'Dorpscoöperaties en noaberschap-initiatieven':              'Ontmoeting & ondersteuning',
    'Bewonersinitiatieven stad Groningen':                       'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Eemsdelta':                               'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Het Hogeland':                            'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Midden-Groningen':                        'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Oldambt':                                 'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Pekela':                                  'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Veendam':                                 'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Westerkwartier':                          'Ontmoeting & ondersteuning',
    'Dorpsinitiatieven Westerwolde':                             'Ontmoeting & ondersteuning',
    'Wijk- en dorpsinitiatieven (aanvullend)':                   'Ontmoeting & ondersteuning',
    'Informele zorgnetwerken':                                   'Ontmoeting & ondersteuning',
    'Mantelzorgondersteuning':                                   'Ontmoeting & ondersteuning',
    'Senioren in armoede':                                       'Ontmoeting & ondersteuning',
    'Statushouders en vluchtelingen':                            'Ontmoeting & ondersteuning',
    'Taalmaatjes en taalondersteuning':                          'Ontmoeting & ondersteuning',
    'Klussenteams':                                              'Ontmoeting & ondersteuning',
    'Vervoershulp en buurtbussen':                               'Ontmoeting & ondersteuning',
    'Overige initiatieven':                                      'Ontmoeting & ondersteuning',

    'Onderwijs & ontwikkeling':                                  'Onderwijs & ontwikkeling',
    "Jongeren in armoede – onderwijs en creatieve programma's":  'Onderwijs & ontwikkeling',
    'Huiswerkbegeleiding':                                       'Onderwijs & ontwikkeling',
    'Digitale hulp en digibeten-ondersteuning':                  'Onderwijs & ontwikkeling',

    'Vakantie, uitjes en vrije tijd voor minima':                'Vrije tijd & welzijn',
    'Sport, zwemlessen en vakantiekampen voor kinderen':         'Vrije tijd & welzijn',
    'Muziek en cultuur voor minima':                             'Vrije tijd & welzijn',
    'Creatieve solidariteit: cadeaus en pakketten':              'Vrije tijd & welzijn',

    'Zorg en gezondheid voor minima':                            'Gezondheid & zorg',
    'Kapper voor daklozen en minima':                            'Gezondheid & zorg',
    'Daklozen- en nachtopvang':                                  'Gezondheid & zorg',
    'Gratis kinderopvang':                                       'Gezondheid & zorg',
    'Dierenwelzijn en huisdieren voor minima':                   'Gezondheid & zorg',

    'Werk en participatie (aanvullend)':                         'Werk & participatie',
    'Schoonmaakhulp en opruimteams':                             'Werk & participatie',
}

def map_categorie(excel_cat):
    return CAT_MAP.get(excel_cat, 'Ontmoeting & ondersteuning')

def has_real_address(adres, adres_check=None):
    """Use heuristic: address must contain a digit (house number) and no NO_FIXED keywords."""
    if not adres or not adres.strip():
        return False
    al = adres.lower()
    if any(k in al for k in NO_FIXED):
        return False
    return bool(re.search(r'\d', adres))

def normalize_adres(adres):
    """
    V11 addresses are comma-separated: 'Straat, nummer, postcode, stad (extra)'
    Reconstruct as 'Straat nummer, postcode stad' for geocoding.
    Also strips parenthetical extras like '(inloop di 10-12u)'.
    """
    if not adres:
        return adres
    # Remove parenthetical extras
    adres = re.sub(r'\s*\(.*?\)', '', adres).strip()
    # If comma-separated with 4 parts: street, number, postcode, city
    parts = [p.strip() for p in adres.split(',') if p.strip()]
    if len(parts) == 4:
        street, number, postcode, city = parts
        # Sometimes postcode is duplicated like "9672, 9672AD" — take the one with letters
        if not re.search(r'[A-Z]', postcode):
            postcode = city
            city = parts[3] if len(parts) > 3 else ''
        return f"{street} {number}, {postcode} {city}".strip()
    # Otherwise return as-is (V10 style or already clean)
    return adres

def geocode_photon(adres, gemeente):
    gem = re.sub(r'\s*\(.*?\)', '', gemeente or '').split('/')[0].split(',')[0].strip()
    query = adres.strip()
    if gem and gem.lower() not in query.lower():
        query = f"{query} {gem}"
    query += " Netherlands"

    url = f'https://photon.komoot.io/api/?q={urllib.parse.quote(query)}&limit=1'
    try:
        result = subprocess.run(['curl', '-s', url], capture_output=True, text=True, timeout=10)
        data = json.loads(result.stdout)
        features = data.get('features', [])
        if features:
            coords = features[0]['geometry']['coordinates']  # [lng, lat]
            return coords[1], coords[0]
    except Exception:
        pass
    return None, None

# ── Parse Excel ───────────────────────────────────────────────────────────────
print(f'Lezen: {EXCEL_PATH}')
wb = openpyxl.load_workbook(EXCEL_PATH)

# Find the right sheet
sheet_name = 'Alle initiatieven' if 'Alle initiatieven' in wb.sheetnames else wb.sheetnames[0]
print(f'Sheet: {sheet_name}')
ws = wb[sheet_name]

current_cat = ''
items = []
next_id = 1

def clean(v):
    s = str(v).strip() if v else ''
    return '' if s in ('None', '—', '-') else s

for row in ws.iter_rows(min_row=2, values_only=True):
    naam = str(row[0]).strip() if row[0] else ''
    type_ = str(row[1]).strip() if row[1] else ''

    # Section header: starts with digit+dot, type column empty
    if naam and not type_ and re.match(r'^\d+[\.\)]', naam):
        current_cat = re.sub(r'^\d+[\.\)]\s*', '', naam)
        continue

    if not naam or naam == 'None':
        continue

    gemeente      = clean(row[2]) if len(row) > 2 else ''
    adres_raw     = clean(row[3]) if len(row) > 3 else ''
    beschr        = clean(row[4]) if len(row) > 4 else ''
    doelgr        = clean(row[5]) if len(row) > 5 else ''
    website       = clean(row[6]) if len(row) > 6 else ''
    telefoon      = clean(row[7]) if len(row) > 7 else ''
    email         = clean(row[8]) if len(row) > 8 else ''
    # Column M: "Nieuwe adressen" — use this for geocoding if available, else column D
    nieuw_adres   = clean(row[ADRES_COL]) if len(row) > ADRES_COL else ''
    geocode_adres = nieuw_adres if nieuw_adres else adres_raw

    items.append({
        'id': next_id,
        'naam': naam,
        'type': type_ if type_ else naam,
        'categorie': map_categorie(current_cat),
        'gemeente': gemeente,
        'postcode': '',
        'adres': adres_raw,
        'beschrijving': beschr,
        'doelgroep': doelgr,
        'website': website,
        'telefoon': telefoon,
        'email': email,
        'lat': None,
        'lng': None,
        '_geocode_adres': geocode_adres,  # temp field, removed after geocoding
    })
    next_id += 1

print(f'{len(items)} initiatieven ingelezen uit Excel')

# ── Geocode ───────────────────────────────────────────────────────────────────
to_geocode = [x for x in items if has_real_address(x['_geocode_adres'])]
skip = len(items) - len(to_geocode)
print(f'{len(to_geocode)} te geocoden | {skip} zonder exact adres (blijven null)')

geocoded = 0
for i, item in enumerate(to_geocode):
    lat, lng = geocode_photon(item['_geocode_adres'], item['gemeente'])
    item['lat'] = lat
    item['lng'] = lng
    if lat:
        geocoded += 1
    time.sleep(0.5)

    if (i + 1) % 50 == 0:
        with open(JSON_PATH, 'w') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f'{i+1}/{len(to_geocode)} verwerkt, {geocoded} geocoded...', flush=True)

# ── Save ──────────────────────────────────────────────────────────────────────
# Remove temp geocoding field
for item in items:
    item.pop('_geocode_adres', None)

with open(JSON_PATH, 'w') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

on_map = sum(1 for x in items if x.get('lat'))
no_loc = sum(1 for x in items if not x.get('lat'))
print(f'\nKlaar!')
print(f'  Totaal: {len(items)}')
print(f'  Op kaart: {on_map}')
print(f'  Zonder locatie: {no_loc}')
print(f'Opgeslagen naar {JSON_PATH}')
