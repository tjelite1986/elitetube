import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "elitetube.db");
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Kör migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('local','smb','external_url')),
    path TEXT,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK(type IN ('video','audio','image')),
    filename TEXT,
    url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    category TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const hash = bcrypt.hashSync(adminPassword, 12);

const existing = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
if (!existing) {
  db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run("admin", hash, "admin");
  console.log(`Admin-användare skapad (lösenord: ${adminPassword})`);
} else {
  console.log("Admin-användare existerar redan.");
}

// Exempelkälla och media
const sourceExists = db.prepare("SELECT id FROM sources WHERE name = 'Demo'").get();
if (!sourceExists) {
  const src = db.prepare("INSERT INTO sources (name, type, description) VALUES (?, ?, ?)").run("Demo", "external_url", "Demokälla för YouTube-videos");

  db.prepare(
    `INSERT INTO media (source_id, title, description, type, url, thumbnail_url, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    src.lastInsertRowid,
    "Big Buck Bunny",
    "Klassisk öppen animationsfilm",
    "video",
    "https://www.youtube.com/watch?v=YE7VzlLtp-4",
    "https://img.youtube.com/vi/YE7VzlLtp-4/hqdefault.jpg",
    "Animation"
  );

  console.log("Exempeldata tillagd.");
}

console.log("Seed klar!");
db.close();
