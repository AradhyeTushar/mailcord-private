import pg from 'pg';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

const isSQLite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('sqlite://');

let pool: any;
let sqliteDb: any;

let _dbInitPromise: Promise<void> | null = null;
export async function ensureDbConnected() {
  if (_dbInitPromise) return _dbInitPromise;
  _dbInitPromise = (async () => {
    if (isSQLite) {
      const dbPath = process.env.DATABASE_URL 
        ? process.env.DATABASE_URL.replace('sqlite://', '') 
        : path.join(process.cwd(), 'data', 'billing.db');
      
      // Ensure directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
      sqliteDb = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      console.log(`[DB] Connected to local SQLite database at ${dbPath}`);
    } else {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      console.log('[DB] Connected to PostgreSQL database');
    }
  })();
  return _dbInitPromise;
}

export const pgQuery = async (text: string, params?: any[]) => {
  await ensureDbConnected();
  if (isSQLite) {
    // Convert $1, $2 to ?, ? for SQLite
    const sql = text.replace(/\$(\d+)/g, '?');
    const result = await sqliteDb.all(sql, params || []);
    return {
      rows: result,
      rowCount: result.length
    };
  } else {
    return pool.query(text, params);
  }
};

export const pgTransaction = async (callback: (client: any) => Promise<any>) => {
  await ensureDbConnected();
  if (isSQLite) {
    // For SQLite, we just run the callback since it's already serializable in many ways, 
    // but we'll simulate a transaction.
    await sqliteDb.run('BEGIN TRANSACTION');
    try {
      const result = await callback({
        query: (text: string, params?: any[]) => {
            const sql = text.replace(/\$(\d+)/g, '?');
            return sqliteDb.all(sql, params || []).then((rows: any) => ({ rows, rowCount: rows.length }));
        }
      });
      await sqliteDb.run('COMMIT');
      return result;
    } catch (e) {
      await sqliteDb.run('ROLLBACK');
      throw e;
    }
  } else {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
};

export const initSQL = async () => {
  await ensureDbConnected();
  if (isSQLite) {
    const schemaPath = path.join(process.cwd(), 'api', 'billing', 'schema.sqlite.sql');
    const seedPath = path.join(process.cwd(), 'api', 'billing', 'seed.sql');
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    // SQLite doesn't support multiple statements in one .run() but .exec() works in some libraries.
    // The 'sqlite' library open()ed db has .exec()
    await sqliteDb.exec(schema);
    console.log('SQLite schema initialized.');

    // Check if plans exist, if not, try to seed
    const plansCount = await sqliteDb.get('SELECT COUNT(*) as count FROM plans');
    console.log(`[DB] Number of plans in database: ${plansCount.count}`);
    if (plansCount.count === 0 && fs.existsSync(seedPath)) {
        console.log('Seeding SQLite database...');
        const seed = fs.readFileSync(seedPath, 'utf8');
        try {
            await sqliteDb.exec(seed);
            const newCount = await sqliteDb.get('SELECT COUNT(*) as count FROM plans');
            console.log(`[DB] SQLite seeding complete. Plans count: ${newCount.count}`);
        } catch (e: any) {
            console.error('[DB] Seeding failed:', e.message);
        }
    }
  }
};

export default isSQLite ? sqliteDb : pool;


