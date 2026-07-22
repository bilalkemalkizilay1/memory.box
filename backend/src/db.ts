import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbPromise: Promise<Database> | null = null;

const dbPath = path.resolve(__dirname, '../../memory_box.db');

export async function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();
  
  // Create circles table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS circles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create pins table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS pins (
      id TEXT PRIMARY KEY,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      privacy_mode TEXT NOT NULL, -- 'public' or 'circle'
      circle_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      memory_date TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      hugs_count INTEGER DEFAULT 0,
      spotify_track_id TEXT,
      people TEXT,
      FOREIGN KEY(circle_id) REFERENCES circles(id)
    );
  `);

  // Migration: Add spotify_track_id if table already existed
  try {
    await db.exec('ALTER TABLE pins ADD COLUMN spotify_track_id TEXT');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  // Migration: Add people if table already existed
  try {
    await db.exec('ALTER TABLE pins ADD COLUMN people TEXT');
  } catch (err) {
    // Column already exists, safe to ignore
  }

  // Insert seed circles if they don't exist
  const count = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM circles');
  if (count && count.count === 0) {
    const seedCircles = [
      { id: 'bogazici-cimler', name: 'Boğaziçi Çimleri 🍀' },
      { id: 'bebek-sahili', name: 'Bebek Sahil Yolu 🌊' },
      { id: 'hisarustu-kahve', name: 'Hisarüstü Kahve Sohbetleri ☕' }
    ];
    for (const c of seedCircles) {
      await db.run('INSERT INTO circles (id, name) VALUES (?, ?)', c.id, c.name);
    }
  }
}
