"""
Retry geocoding for initiatives that still have null coords but have parseable addresses.
Strategy:
  1. Extract Dutch postcode (e.g. "9672 AD") → geocode "9672 AD huisnummer"
  2. Clean address: strip parentheticals, building names, extra locations
  3. Take only the first address if multiple are listed
Usage: python3 scripts/geocode_retry.py
"""

import json, re, time, urllib.parse, subprocess
from pathlib import Path

JSON_PATH = Path('src/data/initiatieven.json')

def geocode_query(query):
    url = f'https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1&countrycodes=nl'
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

def clean_and_geocode(adres, gemeente):
    if not adres or not adres.strip():
        return None, None

    # Normalize newlines/tabs
    adres = re.sub(r'[\n\r\t]+', ' ', adres).strip()

    # Take only the first address if multiple separated by ; / + /
    first = re.split(r';|\s*/\s*|\s*\+\s*| en andere | \+ ', adres)[0].strip()

    # Remove parentheticals like "(inloop di 10-12u)", "(STAP-loket)", "(naast station)"
    first = re.sub(r'\s*\(.*?\)', '', first).strip()

    # Remove leading building names: if line has "Gebouwnaam, Straatnaam 5" strip the building
    # Heuristic: if first part has no digit but next part does, skip first part
    parts = [p.strip() for p in first.split(',')]
    if len(parts) >= 2 and not re.search(r'\d', parts[0]) and re.search(r'\d', parts[1]):
        first = ', '.join(parts[1:]).strip()

    # Extract Dutch postcode if present
    postcode_match = re.search(r'\b(\d{4}\s?[A-Z]{2})\b', first)

    time.sleep(1.1)

    if postcode_match:
        postcode = postcode_match.group(1).replace(' ', '')
        # Try: postcode + huisnummer
        housenr = re.search(r'\b(\d+\w*)\b', first)
        if housenr:
            lat, lng = geocode_query(f'{postcode} {housenr.group(1)}')
            if lat:
                return lat, lng
        # Try just the postcode
        lat, lng = geocode_query(postcode)
        if lat:
            return lat, lng

    # Try cleaned address with gemeente
    gem = re.sub(r'\s*\(.*?\)', '', gemeente or '').split('/')[0].split(',')[0].split('+')[0].strip()
    query = first
    if gem and gem.lower() not in first.lower():
        query = f'{first}, {gem}'

    lat, lng = geocode_query(query)
    if lat:
        return lat, lng

    # Last resort: just the street name + number without postcode
    street = re.sub(r'\d{4}\s?[A-Z]{2}', '', first).strip().rstrip(',').strip()
    if street != first:
        lat, lng = geocode_query(f'{street}, Netherlands')
        if lat:
            return lat, lng

    return None, None

def skip_address(adres):
    """Skip addresses that are clearly not geocodable as a single point."""
    if not adres:
        return True
    skip_patterns = [
        r'^\d+\s+(locaties|aandachtswijken|vestigingen|scholen|gemeenten)',
        r'^via\s+alle',
        r'^minimaal\s+\d+',
        r'werkgebied',
        r'bibliotheek.*gemeenten',
        r'scholen.*province',
    ]
    for p in skip_patterns:
        if re.search(p, adres.lower()):
            return True
    return False

with open(JSON_PATH) as f:
    data = json.load(f)

to_retry = [
    x for x in data
    if not x.get('lat')
    and x.get('adres', '').strip()
    and re.search(r'\d', x.get('adres', ''))
    and not skip_address(x.get('adres', ''))
]

print(f'{len(to_retry)} addresses to retry')

updated = 0
failed = []
for i, item in enumerate(to_retry):
    lat, lng = clean_and_geocode(item.get('adres', ''), item.get('gemeente', ''))
    for entry in data:
        if entry['id'] == item['id']:
            entry['lat'] = lat
            entry['lng'] = lng
            break

    if lat:
        updated += 1
        print(f'[{i+1}/{len(to_retry)}] ✓ {item["naam"][:50]} → ({lat:.4f},{lng:.4f})', flush=True)
    else:
        failed.append(item)
        print(f'[{i+1}/{len(to_retry)}] ✗ {item["naam"][:50]} | {item["adres"][:50]}', flush=True)

    if (i + 1) % 30 == 0:
        with open(JSON_PATH, 'w') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'  → Saved ({updated} new so far)')

with open(JSON_PATH, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

on_map = sum(1 for x in data if x.get('lat'))
print(f'\n✅ {updated} newly geocoded, {len(failed)} still failed')
print(f'   {on_map} total on map')
if failed:
    print('\nStill failed:')
    for x in failed:
        print(f'  {x["naam"][:50]} | {x["adres"][:60]}')
