import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'))
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const db = new Database(path.join(DATA_DIR, 'golddigg.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT UNIQUE NOT NULL COLLATE NOCASE,
  pass TEXT NOT NULL,
  role TEXT,
  name TEXT,
  age INTEGER,
  city TEXT,
  bio TEXT,
  photos TEXT NOT NULL DEFAULT '[]',
  net_worth INTEGER,
  main_car TEXT,
  companies TEXT NOT NULL DEFAULT '[]',
  income_source TEXT,
  realty TEXT,
  yacht TEXT,
  allowance INTEGER,
  skills TEXT NOT NULL DEFAULT '[]',
  verified INTEGER NOT NULL DEFAULT 0,
  is_bot INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  last_seen INTEGER
);
CREATE TABLE IF NOT EXISTS swipes (
  from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (from_id, to_id)
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE (a, b)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, id);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  ref_id INTEGER,
  image TEXT,
  created_at INTEGER NOT NULL,
  read_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, id);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`)

export function getSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get('jwt_secret')
  if (row) return row.value
  const secret = crypto.randomBytes(32).toString('hex')
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run('jwt_secret', secret)
  return secret
}

const JSON_FIELDS = ['photos', 'companies', 'skills']

export function publicUser(row, { full = true } = {}) {
  if (!row) return null
  const u = {
    id: row.id,
    role: row.role,
    name: row.name,
    age: row.age,
    city: row.city,
    bio: row.bio,
    verified: !!row.verified,
    online: !!row.is_bot || (row.last_seen && Date.now() - row.last_seen < 5 * 60 * 1000),
  }
  for (const f of JSON_FIELDS) u[f] = JSON.parse(row[f] || '[]')
  if (row.role === 'f') {
    Object.assign(u, {
      netWorth: row.net_worth,
      mainCar: row.main_car,
      incomeSource: row.income_source,
      realty: row.realty,
      yacht: row.yacht,
      allowance: row.allowance,
    })
  }
  if (!full) return { id: u.id, name: u.name, photo: u.photos[0] || null, role: u.role, online: u.online }
  return u
}

export const now = () => Date.now()
