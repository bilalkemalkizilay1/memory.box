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
    console.log("Dropping old database tables if they exist...");
    await client.query('DROP TABLE IF EXISTS memory_reactions CASCADE;');
    await client.query('DROP TABLE IF EXISTS media CASCADE;');
    await client.query('DROP TABLE IF EXISTS memories CASCADE;');
    await client.query('DROP TABLE IF EXISTS circle_memberships CASCADE;');
    await client.query('DROP TABLE IF EXISTS circles CASCADE;');
    await client.query('DROP TABLE IF EXISTS users CASCADE;');

    console.log("Creating new production database tables...");
    // 1. Users Table
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        author_token TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Circles Table
    await client.query(`
      CREATE TABLE circles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Circle Memberships Table
    await client.query(`
      CREATE TABLE circle_memberships (
        circle_id TEXT REFERENCES circles(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (circle_id, user_id)
      );
    `);

    // 4. Memories Table
    await client.query(`
      CREATE TABLE memories (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        content TEXT NOT NULL,
        privacy_mode TEXT NOT NULL,
        circle_id TEXT REFERENCES circles(id) ON DELETE SET NULL,
        memory_date DATE NOT NULL,
        music_provider TEXT,
        music_track_id TEXT,
        tagged_people JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
      );
    `);

    // 5. Media Table
    await client.query(`
      CREATE TABLE media (
        id TEXT PRIMARY KEY,
        memory_id TEXT REFERENCES memories(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'image',
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Memory Reactions Table
    await client.query(`
      CREATE TABLE memory_reactions (
        id TEXT PRIMARY KEY,
        memory_id TEXT REFERENCES memories(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        reaction_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (memory_id, user_id, reaction_type)
      );
    `);

    console.log("Seeding default circles...");
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
    console.log("Database initialized successfully!");
  } catch (err) {
    console.error('Failed to run PostgreSQL schema setup:', err);
    throw err;
  } finally {
    client.release();
  }
}
