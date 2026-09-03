import 'server-only';

/**
 * Insforge access for authentication and file storage.
 *
 * IMPORTANT: INF_API_KEY is an ADMIN key. It authenticates against the whole
 * project, so it must only ever run on the server. The browser talks to
 * Insforge exclusively through /api/auth/*, which forwards the visitor's own
 * session token rather than the admin key.
 *
 * Note on the Insforge HTTP surface (verified against the live instance, the
 * published docs disagree):
 *   - Auth lives at /api/auth/* (users, sessions, oauth, email flows).
 *   - Column definitions on table creation use columnName/isNullable/isUnique,
 *     and `isUnique` is required on every column.
 *   - Foreign keys passed to POST /api/database/tables are SILENTLY DISCARDED;
 *     they only exist if added via PATCH /api/database/tables/{t}/schema.
 *   - The `numeric` column type is unsupported (HTTP 500).
 */

export const INF_BASE_URL = process.env.INF_BASE_URL ?? 'https://x2m4egk3.ap-southeast.insforge.app';
const ADMIN_KEY = process.env.INF_API_KEY ?? '';

export class InsforgeError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = 'InsforgeError';
    this.status = status;
    this.body = body;
  }
}

/** Call Insforge using the ADMIN key. Server-side administration only. */
export async function infAdmin<T = unknown>(
  path: string,
  init: RequestInit & { okStatus?: number[] } = {},
): Promise<T> {
  if (!ADMIN_KEY) throw new Error('INF_API_KEY is not configured');
  const ok = init.okStatus ?? [200, 201, 204];
  const res = await fetch(`${INF_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ADMIN_KEY}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!ok.includes(res.status)) {
    throw new InsforgeError(res.status, parsed, `Insforge ${init.method ?? 'GET'} ${path} failed`);
  }
  return parsed as T;
}

/**
 * Call Insforge using the VISITOR's own token. Use this for anything a logged-in
 * shopper does, so RLS and session checks apply to them and not to an admin.
 */
export async function infUser<T = unknown>(
  path: string,
  token: string,
  init: RequestInit & { okStatus?: number[] } = {},
): Promise<T> {
  const ok = init.okStatus ?? [200, 201, 204];
  const res = await fetch(`${INF_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!ok.includes(res.status)) {
    throw new InsforgeError(res.status, parsed, `Insforge ${init.method ?? 'GET'} ${path} failed`);
  }
  return parsed as T;
}

export async function infHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${INF_BASE_URL}/health`, { cache: 'no-store' });
    // /health returns the plain-text body "OK\n"
    return res.ok && (await res.text()).trim() === 'OK';
  } catch {
    return false;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
