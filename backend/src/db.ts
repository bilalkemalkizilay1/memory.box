import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined!");
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false
});

function convertPlaceholders(sql: string): string {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export interface DatabaseShim {
  all: (text: string, ...params: any[]) => Promise<any[]>;
  get: <T = any>(text: string, ...params: any[]) => Promise<T | null>;
  run: (text: string, ...params: any[]) => Promise<{ lastID: any; changes: any }>;
}

let shimInstance: DatabaseShim | null = null;

export async function getDb(): Promise<DatabaseShim> {
  if (!shimInstance) {
    shimInstance = {
      all: async (text: string, ...params: any[]) => {
        const parsedSql = convertPlaceholders(text);
        const res = await pool.query(parsedSql, params);
        return res.rows;
      },
      get: async (text: string, ...params: any[]) => {
        const parsedSql = convertPlaceholders(text);
        const res = await pool.query(parsedSql, params);
        return res.rows[0] || null;
      },
      run: async (text: string, ...params: any[]) => {
        const parsedSql = convertPlaceholders(text);
        await pool.query(parsedSql, params);
        return { lastID: null, changes: null };
      }
    };
  }
  return shimInstance;
}

export async function initDb() {
  const client = await pool.connect();
  try {
    // Create circles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS circles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pins (
        id TEXT PRIMARY KEY,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        privacy_mode TEXT NOT NULL,
        circle_id TEXT REFERENCES circles(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        memory_date TEXT NOT NULL,
        likes_count INTEGER DEFAULT 0,
        hugs_count INTEGER DEFAULT 0,
        spotify_track_id TEXT,
        people TEXT
      );
    `);

    // Insert seed circles if they don't exist
    const countRes = await client.query('SELECT COUNT(*) as count FROM circles');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0) {
      const seedCircles = [
        { id: 'bogazici-cimler', name: 'Boğaziçi Çimleri 🍀' },
        { id: 'bebek-sahili', name: 'Bebek Sahil Yolu 🌊' },
        { id: 'hisarustu-kahve', name: 'Hisarüstü Kahve Sohbetleri ☕' }
      ];
      for (const c of seedCircles) {
        await client.query(
          'INSERT INTO circles (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [c.id, c.name]
        );
      }
    }
  } catch (err) {
    console.error('Failed to run PostgreSQL schema setup:', err);
    throw err;
  } finally {
    client.release();
  }
}
