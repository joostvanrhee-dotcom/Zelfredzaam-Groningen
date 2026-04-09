"""
Geocode initiatives using Photon (komoot) — only for real street addresses.
Real = has a house number digit in the address field.
"""

import json, re, time, urllib.parse, subprocess
from pathlib import Path

JSON_PATH = Path('src/data/initiatieven.json')

NO_FIXED = [
    'via website', 'diverse locatie', 'mobiel door', 'op afspraak',
    'landelijk', 'provinciaal', 'gehele provincie', 'wisselende',
    'postbus', 'locatie op aanvraag', 'aan huis', 'thuisbezoek',
]

def has_real_address(adres):
    if not adres or not adres.strip():
        return False
    al = adres.lower()
    if any(k in al for k in NO_FIXED):
        return False
    # must contain a digit (house number or postcode)
    return bool(re.search(r'\d', adres))

def geocode_photon(adres, gemeente):
    gem = re.sub(r'\s*\(.*?\)', '', gemeente or '').split('/')[0].split(',')[0].strip()
    query = adres.strip()
    if gem and gem.lower() not in query.lower():
        query = f"{query} {gem}"
    query += " Netherlands"

    url = f'https://photon.komoot.io/api/?q={urllib.parse.quote(query)}&limit=1'
    try:
        result = subprocess.run(
            ['curl', '-s', url],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        features = data.get('features', [])
        if features:
            coords = features[0]['geometry']['coordinates']  # [lng, lat]
            return coords[1], coords[0]
    except Exception:
        pass
    return None, None

with open(JSON_PATH) as f:
    data = json.load(f)

to_geocode = [x for x in data if not x.get('lat') and has_real_address(x.get('adres', ''))]
already = sum(1 for x in data if x.get('lat'))
skip = sum(1 for x in data if not x.get('lat') and not has_real_address(x.get('adres', '')))
print(f'Al geocoded: {already} | Te geocoden: {len(to_geocode)} | Geen adres (blijven null): {skip}')

new_coords = 0
failed = 0
for i, item in enumerate(to_geocode):
    lat, lng = geocode_photon(item.get('adres', ''), item.get('gemeente', ''))
    for entry in data:
        if entry['id'] == item['id']:
            entry['lat'] = lat
            entry['lng'] = lng
            break

    if lat:
        new_coords += 1
    else:
        failed += 1

    time.sleep(0.5)

    if (i + 1) % 50 == 0:
        with open(JSON_PATH, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'{i+1}/{len(to_geocode)} verwerkt, {new_coords} nieuw geocoded...', flush=True)

with open(JSON_PATH, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

on_map = sum(1 for x in data if x.get('lat'))
print(f'\nKlaar: {new_coords} nieuw, {on_map}/{len(data)} totaal met coords')
print(f'Opgeslagen!')
