import 'server-only';
import { createClient, type Client } from '@libsql/client';

/**
 * Turso client. Server-side only.
 *
 * The Turso token grants read/write to the whole database, so it must never be
 * imported from a client component or exposed via NEXT_PUBLIC_*. The browser
 * reaches this data only through the route handlers in src/app/api.
 */

let client: Client | undefined;

export function db(): Client {
  if (!client) {
    const url = process.env.TURSO_URL;
    const authToken = process.env.TURSO_TOKEN;
    if (!url || !authToken) {
      throw new Error('TURSO_URL and TURSO_TOKEN must be set in .env.local');
    }
    client = createClient({ url, authToken });
  }
  return client;
}

export type Row = Record<string, string | number | null | ArrayBuffer>;

/**
 * Spread each row into a fresh object.
 *
 * libsql rows are created with a null prototype, and React refuses to pass
 * null-prototype objects from a Server Component to a Client Component
 * ("Only plain objects can be passed..."). Spreading restores Object.prototype.
 */
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

/** Rows only, dropping the libsql envelope. */
export async function all<T = Row>(sql: string, args: (string | number | null)[] = []): Promise<T[]> {
  const { rows } = await db().execute({ sql, args });
  return rows.map((r) => plain<T>(r));
}

/** First row, or null. */
export async function one<T = Row>(sql: string, args: (string | number | null)[] = []): Promise<T | null> {
  const { rows } = await db().execute({ sql, args });
  return rows[0] ? plain<T>(rows[0]) : null;
}

export async function run(sql: string, args: (string | number | null)[] = []) {
  return db().execute({ sql, args });
}

/**
 * Build an `IN (?, ?, ...)` placeholder list. libsql has no array binding, and
 * interpolating values into SQL is how you get injected.
 */
export function placeholders(values: unknown[]): string {
  return values.map(() => '?').join(', ');
}
