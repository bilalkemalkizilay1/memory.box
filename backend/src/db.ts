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

    // Rename pins to memories if it exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'pins') THEN
          ALTER TABLE pins RENAME TO memories;
        END IF;
      END $$;
    `);

    // Create memories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memories (
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
        music_provider TEXT,
        music_track_id TEXT,
        tagged_people TEXT,
        user_id TEXT
      );
    `);

    // Create memory_media table
    await client.query(`
      CREATE TABLE IF NOT EXISTS memory_media (
        id TEXT PRIMARY KEY,
        memory_id TEXT REFERENCES memories(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Run schema migrations for existing databases to ensure all columns exist
    await client.query(`
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS music_provider TEXT;
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS music_track_id TEXT;
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS tagged_people TEXT;
      ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_id TEXT;
    `);

    // Migrate existing image_url data to memory_media if needed
    await client.query(`
      INSERT INTO memory_media (id, memory_id, url, type, display_order)
      SELECT gen_random_uuid()::text, id, image_url, 'image', 0
      FROM memories
      WHERE image_url IS NOT NULL 
        AND image_url != ''
        AND NOT EXISTS (
          SELECT 1 FROM memory_media WHERE memory_media.memory_id = memories.id
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
