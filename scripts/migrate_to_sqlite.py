"""
Migreer bestaande JSON data naar SQLite database.
Usage: python3 scripts/migrate_to_sqlite.py
"""
import json, sqlite3, os
from pathlib import Path

DB_PATH  = Path('data/db.sqlite')
USERS    = Path('data/users.json')
FORUM    = Path('data/forum.json')
SUBS     = Path('data/submissions.json')

if not DB_PATH.exists():
    print('data/db.sqlite bestaat nog niet — start eerst de dev server zodat de DB aangemaakt wordt.')
    exit(1)

con = sqlite3.connect(DB_PATH)
cur = con.cursor()

# Users
if USERS.exists():
    users = json.loads(USERS.read_text())
    for u in users:
        cur.execute('''
            INSERT OR IGNORE INTO users (id, naam, email, wachtwoordHash, resetToken, resetTokenVerloopt, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (u['id'], u['naam'], u['email'], u['wachtwoordHash'],
              u.get('resetToken'), u.get('resetTokenVerloopt'), u['createdAt']))
    print(f'✓ {len(users)} gebruikers gemigreerd')

# Forum posts + reacties
if FORUM.exists():
    posts = json.loads(FORUM.read_text())
    for p in posts:
        cur.execute('''
            INSERT OR IGNORE INTO forum_posts (id, titel, inhoud, categorie, auteurNaam, auteurEmail, gebruikerId, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (p['id'], p['titel'], p['inhoud'], p['categorie'],
              p['auteurNaam'], p['auteurEmail'], p.get('gebruikerId'), p['createdAt']))
        for r in p.get('reacties', []):
            cur.execute('''
                INSERT OR IGNORE INTO forum_reacties (id, postId, auteurNaam, gebruikerId, inhoud, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (r['id'], p['id'], r['auteurNaam'], r.get('gebruikerId'), r['inhoud'], r['createdAt']))
    print(f'✓ {len(posts)} forumberichten gemigreerd')

# Submissions
if SUBS.exists():
    subs = json.loads(SUBS.read_text())
    for s in subs:
        cur.execute('''
            INSERT OR IGNORE INTO submissions
            (id, soort, initiatiefId, naam, type, categorie, filters, gemeente, postcode, adres,
             beschrijving, doelgroep, website, telefoon, emailInitiatief, toelichting,
             indienerNaam, indienerEmail, status, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (s['id'], s['soort'], s.get('initiatiefId'), s['naam'],
              s.get('type'), s.get('categorie'),
              json.dumps(s['filters']) if s.get('filters') else None,
              s.get('gemeente'), s.get('postcode'), s.get('adres'),
              s.get('beschrijving'), s.get('doelgroep'), s.get('website'),
              s.get('telefoon'), s.get('emailInitiatief'), s.get('toelichting'),
              s['indienerNaam'], s['indienerEmail'], s['status'], s['createdAt']))
    print(f'✓ {len(subs)} aanmeldingen gemigreerd')

con.commit()
con.close()
print('\n✅ Migratie klaar!')
