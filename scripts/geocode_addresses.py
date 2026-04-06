"""
Geocode only initiatives that have a real street address (contains a house number).
Leaves lat/lng as null for those without exact addresses.
Usage: python3 scripts/geocode_addresses.py
"""

import json, re, time, urllib.parse, subprocess
from pathlib import Path

JSON_PATH = Path('src/data/initiatieven.json')

def has_real_address(adres):
    """Check if address contains a house number (digit), indicating it's a real street address."""
    return bool(adres and adres.strip() and re.search(r'\d', adres))

def geocode(adres, gemeente):
    """Geocode using street address. No gemeente fallback."""
    # Clean up address
    adres_clean = adres.strip()
    # Add gemeente context if available
    gem = re.sub(r'\s*\(.*?\)', '', gemeente).split('/')[0].split(',')[0].strip() if gemeente else ''
    query = adres_clean
    if gem and gem.lower() not in adres_clean.lower():
        query = f"{adres_clean}, {gem}"
    query += ", Netherlands"

    url = f'https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1'
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
    return None, None

with open(JSON_PATH) as f:
    data = json.load(f)

to_geocode = [x for x in data if not x.get('lat') and has_real_address(x.get('adres', ''))]
print(f'{len(to_geocode)} initiatives with real addresses to geocode')
print(f'{sum(1 for x in data if not x.get("lat") and not has_real_address(x.get("adres","")))} without exact address → stay null')

updated = 0
failed = 0
for i, item in enumerate(to_geocode):
    lat, lng = geocode(item.get('adres', ''), item.get('gemeente', ''))
    # Update in-place
    for entry in data:
        if entry['id'] == item['id']:
            entry['lat'] = lat
            entry['lng'] = lng
            break

    if lat:
        updated += 1
        print(f'[{i+1}/{len(to_geocode)}] ✓ {item["naam"][:45]} → ({lat:.4f},{lng:.4f})', flush=True)
    else:
        failed += 1
        print(f'[{i+1}/{len(to_geocode)}] ✗ {item["naam"][:45]} | {item["adres"][:40]}', flush=True)

    time.sleep(1.1)

    if (i + 1) % 50 == 0:
        with open(JSON_PATH, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'  → Progress saved ({updated} geocoded so far)')

with open(JSON_PATH, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

on_map = sum(1 for x in data if x.get('lat'))
print(f'\n✅ Done! {updated} geocoded, {failed} failed (stay null)')
print(f'   {on_map} total initiatives will show on map')
