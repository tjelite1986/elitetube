import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "elitetube.db");

// Se till att katalogen finns
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
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

    CREATE TABLE IF NOT EXISTS playlists (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      description TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      position    INTEGER NOT NULL DEFAULT 0,
      added_at    TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(playlist_id, media_id)
    );
  `);

  try {
    db.exec(`ALTER TABLE media ADD COLUMN needs_ytdlp INTEGER NOT NULL DEFAULT 0`);
  } catch { /* kolumnen finns redan */ }

  try {
    db.exec(`ALTER TABLE media ADD COLUMN is_adult INTEGER NOT NULL DEFAULT 0`);
  } catch { /* kolumnen finns redan */ }

  try {
    db.exec(`ALTER TABLE media ADD COLUMN tags TEXT`);
  } catch { /* kolumnen finns redan */ }

  try {
    db.exec(`ALTER TABLE media ADD COLUMN likes INTEGER NOT NULL DEFAULT 0`);
  } catch { /* kolumnen finns redan */ }

  try {
    db.exec(`ALTER TABLE media ADD COLUMN dislikes INTEGER NOT NULL DEFAULT 0`);
  } catch { /* kolumnen finns redan */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export type User = {
  id: number;
  username: string;
  password_hash: string;
  role: "admin" | "viewer";
  created_at: string;
};

export type Source = {
  id: number;
  name: string;
  type: "local" | "smb" | "external_url";
  path?: string;
  description?: string;
  created_at: string;
};

export type MediaItem = {
  id: number;
  source_id?: number;
  title: string;
  description?: string;
  type: "video" | "audio" | "image";
  filename?: string;
  url?: string;
  thumbnail_url?: string;
  duration?: number;
  category?: string;
  views: number;
  created_at: string;
  needs_ytdlp: number;
  is_adult: number;
  tags?: string;
  likes: number;
  dislikes: number;
};

export type Playlist = {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  created_at: string;
};

export type PlaylistWithCount = Playlist & { item_count: number };

export type PlaylistItemWithMedia = MediaItem & {
  playlist_item_id: number;
  position: number;
};
