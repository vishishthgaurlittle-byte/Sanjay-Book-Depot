/**
 * Turso (libSQL) client + small query helpers.
 *
 * Foreign keys are enforced by default on Turso, so no PRAGMA is needed here,
 * but we assert it once at startup rather than trusting the default.
 */
import { createClient } from '@libsql/client';

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url || !authToken) {
  throw new Error(
    'TURSO_URL and TURSO_TOKEN must be set. Copy .env.example to .env, or run via "npm run <script>".',
  );
}

export const db = createClient({ url, authToken });

/** Rows only - drops the columns/rowsAffected envelope. */
export async function all(sql, args = []) {
  return (await db.execute({ sql, args })).rows;
}

/** First row or undefined. */
export async function get(sql, args = []) {
  return (await db.execute({ sql, args })).rows[0];
}

export async function run(sql, args = []) {
  return db.execute({ sql, args });
}

/** Run many statements inside one write transaction. */
export async function tx(statements) {
  const t = await db.transaction('write');
  try {
    for (const s of statements) {
      const sql = typeof s === 'string' ? s : s.sql;
      const args = typeof s === 'string' ? [] : s.args ?? [];
      await t.execute({ sql, args });
    }
    await t.commit();
  } catch (e) {
    t.close();
    throw e;
  }
}

/**
 * Verify referential integrity is actually on. Silently-unenforced FKs are the
 * failure mode that produces orphaned orders, so this is a hard assertion.
 */
export async function assertForeignKeysEnabled() {
  const { rows } = await db.execute('PRAGMA foreign_keys');
  const on = Number(rows[0]?.foreign_keys) === 1;
  if (!on) throw new Error('PRAGMA foreign_keys is OFF - refusing to write data without FK enforcement');
  return true;
}

export { url as TURSO_URL };
