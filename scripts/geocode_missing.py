"""
Geocode initiatives that have null lat/lng in initiatieven.json.
Usage: python3 scripts/geocode_missing.py
"""

import json, re, time, urllib.parse, subprocess
from pathlib import Path

JSON_PATH = Path('src/data/initiatieven.json')

def geocode(adres, gemeente):
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

    time.sleep(1)
    if adres and adres.strip():
        result = query(adres)
        if result:
            return result
    if gemeente and gemeente.strip():
        gem = re.sub(r'\s*\(.*?\)', '', gemeente).split('/')[0].strip()
        result = query(gem)
        if result:
            return result
    return None, None

with open(JSON_PATH) as f:
    data = json.load(f)

missing = [x for x in data if not x.get('lat')]
print(f'{len(missing)} initiatives need geocoding')

updated = 0
for i, item in enumerate(data):
    if item.get('lat'):
        continue

    lat, lng = geocode(item.get('adres', ''), item.get('gemeente', ''))
    item['lat'] = lat
    item['lng'] = lng

    status = f'✓ ({lat:.4f},{lng:.4f})' if lat else '✗'
    print(f'[{updated+1}/{len(missing)}] {item["naam"][:50]} — {status}', flush=True)
    updated += 1

    if updated % 50 == 0:
        with open(JSON_PATH, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'  → Saved progress')

with open(JSON_PATH, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

still_missing = sum(1 for x in data if not x.get('lat'))
print(f'\n✅ Done! {still_missing} still without coords')
