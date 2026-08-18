import pg from 'pg';
import 'dotenv/config';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
});

/** Parameterized query helper — never interpolate user input into SQL. */
export function query(text, params) {
  return pool.query(text, params);
}
