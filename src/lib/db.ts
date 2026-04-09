import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(path.join(DATA_DIR, 'db.sqlite'));

  _db.pragma('journal_mode = WAL');
  _db.pragma('busy_timeout = 10000');
  _db.pragma('foreign_keys = ON');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      naam TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      wachtwoordHash TEXT NOT NULL,
      resetToken TEXT,
      resetTokenVerloopt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      titel TEXT NOT NULL,
      inhoud TEXT NOT NULL,
      categorie TEXT NOT NULL,
      auteurNaam TEXT NOT NULL,
      auteurEmail TEXT NOT NULL,
      gebruikerId TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS forum_reacties (
      id TEXT PRIMARY KEY,
      postId TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
      auteurNaam TEXT NOT NULL,
      gebruikerId TEXT,
      inhoud TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      soort TEXT NOT NULL,
      initiatiefId INTEGER,
      naam TEXT NOT NULL,
      type TEXT,
      categorie TEXT,
      filters TEXT,
      gemeente TEXT,
      postcode TEXT,
      adres TEXT,
      beschrijving TEXT,
      doelgroep TEXT,
      website TEXT,
      telefoon TEXT,
      emailInitiatief TEXT,
      toelichting TEXT,
      indienerNaam TEXT NOT NULL,
      indienerEmail TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );
  `);

  return _db;
}

// Proxy zodat db pas geïnitialiseerd wordt bij eerste gebruik (niet bij import)
const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    return (getDb() as any)[prop as string];
  },
});

export default db;
