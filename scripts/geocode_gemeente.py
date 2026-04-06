"""
Assign municipality-level coordinates to initiatives that have no lat/lng.
Uses a hardcoded lookup of Groningen municipalities + common places.
Fast, no API needed.
Usage: python3 scripts/geocode_gemeente.py
"""

import json, re
from pathlib import Path

JSON_PATH = Path('src/data/initiatieven.json')

# Groningen province municipalities and common places → centroid coords
GEMEENTE_COORDS = {
    # Municipalities
    'groningen':            (53.2194, 6.5665),
    'stad groningen':       (53.2194, 6.5665),
    'groningen stad':       (53.2194, 6.5665),
    'groningen (stad)':     (53.2194, 6.5665),
    'eemsdelta':            (53.3200, 6.9200),
    'delfzijl':             (53.3330, 6.9176),
    'appingedam':           (53.3239, 6.8620),
    'loppersum':            (53.3355, 6.7880),
    'het hogeland':         (53.3900, 6.5500),
    'hogeland':             (53.3900, 6.5500),
    'uithuizen':            (53.4052, 6.6736),
    'winsum':               (53.3390, 6.5105),
    'midden-groningen':     (53.1800, 6.7700),
    'hoogezand':            (53.1636, 6.7703),
    'hoogezand-sappemeer':  (53.1636, 6.7703),
    'sappemeer':            (53.1636, 6.7703),
    'slochteren':           (53.2000, 6.8200),
    'menterwolde':          (53.1500, 6.8500),
    'oldambt':              (53.1200, 7.0500),
    'winschoten':           (53.1430, 7.0411),
    'reiderland':           (53.1800, 7.1500),
    'scheemda':             (53.1700, 6.9700),
    'pekela':               (53.1000, 6.9500),
    'nieuwe pekela':        (53.0980, 6.9700),
    'oude pekela':          (53.1010, 6.9350),
    'stadskanaal':          (52.9830, 6.9460),
    'veendam':              (53.1090, 6.8780),
    'wildervank':           (53.0920, 6.8780),
    'westerwolde':          (52.9200, 7.0700),
    'sellingen':            (52.9350, 7.1300),
    'ter apel':             (52.8780, 7.0610),
    'westerkwartier':       (53.2200, 6.3500),
    'leek':                 (53.1680, 6.3960),
    'marum':                (53.1470, 6.2530),
    'grootegast':           (53.2000, 6.2800),
    'zuidhorn':             (53.2430, 6.4080),
    'ten boer':             (53.2600, 6.7000),
    'lewenborg':            (53.2200, 6.6500),
    'selwerd':              (53.2350, 6.5500),
    'paddepoel':            (53.2350, 6.5400),
    'vinkhuizen':           (53.2250, 6.5200),
    'beijum':               (53.2430, 6.6200),
    'de hoogte':            (53.2180, 6.5650),
    'korrewegwijk':         (53.2250, 6.5750),
    'de wijert':            (53.2080, 6.5520),
    'helpman':              (53.2000, 6.5700),
    'oosterpoort':          (53.2100, 6.5830),
    'grunobuurt':           (53.2130, 6.5650),
    'rivierenbuurt':        (53.2070, 6.5680),
    'oosterparkwijk':       (53.2100, 6.5880),
    'haren':                (53.1740, 6.6090),
    'glimmen':              (53.1430, 6.6230),
    'ten boer':             (53.2600, 6.7000),
    'muntendam':            (53.1290, 6.8450),
    'middelstum':           (53.3290, 6.6660),
    'baflo':                (53.3620, 6.5900),
    'warffum':              (53.3890, 6.6310),
    'holwierde':            (53.2990, 6.9890),
    'uithuizermeeden':      (53.4180, 6.7250),
    'wehe-den hoorn':       (53.3710, 6.5000),
    'adorp':                (53.3200, 6.5200),
    'sauwerd':              (53.3120, 6.5000),
    'garrelsweer':          (53.2860, 6.8900),
    'bierum':               (53.3060, 6.9600),
    'heiligerlee':          (53.1520, 7.0130),
    'woldendorp':           (53.2200, 7.0000),
    'opende':               (53.1500, 6.3200),
    'grijpskerk':           (53.2600, 6.3000),
    'aduard':               (53.2530, 6.4500),
    'ulrum':                (53.3800, 6.3500),
    'spijk':                (53.3440, 7.0390),
    'tuikwerd':             (53.2700, 6.9700),
    "'t zandt":             (53.3000, 6.8800),
    'loppersum':            (53.3355, 6.7880),
    'noordbroek':           (53.1600, 6.8600),
    'zuidwolde':            (53.2570, 6.6770),
    'klooster':             (53.2100, 6.3000),
    'wetsinge':             (53.3100, 6.5200),
    'spiekeroog':           (53.3400, 7.0300),
    # Fallback
    'provincie groningen':  (53.2194, 6.5665),
    'groningen provincie':  (53.2194, 6.5665),
    'oost-groningen':       (53.0500, 7.0000),
    'zuidoost groningen':   (53.0500, 7.0000),
    'kanaalstreek':         (53.0000, 6.9500),
    'noord-groningen':      (53.3900, 6.5500),
    'west-groningen':       (53.2200, 6.3500),
}

def extract_gemeente(gemeente_str):
    """Extract a usable municipality name from complex strings."""
    if not gemeente_str:
        return None
    # Take first part before /, +, comma, en (but not within a word)
    first = re.split(r'[/,+]|\s+en\s+', gemeente_str)[0].strip()
    # Remove parenthetical
    first = re.sub(r'\s*\(.*?\)', '', first).strip()
    return first.lower() if first else None

def lookup(gemeente_str):
    gem = extract_gemeente(gemeente_str)
    if not gem:
        return None, None
    # Exact match
    if gem in GEMEENTE_COORDS:
        return GEMEENTE_COORDS[gem]
    # Partial match — find key that is contained in gem or vice versa
    for key, coords in GEMEENTE_COORDS.items():
        if key in gem or gem in key:
            return coords
    return None, None

with open(JSON_PATH) as f:
    data = json.load(f)

missing = [x for x in data if not x.get('lat')]
print(f'{len(missing)} initiatives without coords')

updated = 0
still_missing = 0
for item in data:
    if item.get('lat'):
        continue
    lat, lng = lookup(item.get('gemeente', ''))
    if lat:
        item['lat'] = lat
        item['lng'] = lng
        updated += 1
    else:
        still_missing += 1
        print(f'  ✗ No match: {item["naam"][:50]} | gemeente={item.get("gemeente","")!r}')

with open(JSON_PATH, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'\n✅ Assigned coords to {updated} initiatives')
print(f'   {still_missing} still without coords (will show without map pin)')
