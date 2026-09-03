'use client';

/**
 * Browser-side auth session store.
 *
 * The Insforge session token lives in localStorage and is sent to our own
 * /api/auth/* proxy, which forwards it to Insforge. The admin key never reaches
 * the browser.
 */

const TOKEN_KEY = 'sbd.session.token';
const USER_KEY = 'sbd.session.user';

export interface SessionUser {
  id: string;
  email?: string;
  name?: string | null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

function saveSession(token: string | null, user: SessionUser | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

async function authFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const token = getToken();
  const res = await fetch(`/api/auth/${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let data: T | null = null;
  try {
    data = text ? (JSON.parse(text) as T) : null;
  } catch {
    data = null;
  }
  const message =
    (data as { message?: string; error?: string } | null)?.message ??
    (data as { error?: string } | null)?.error ??
    undefined;
  return { ok: res.ok, status: res.status, data, error: message };
}

export async function register(email: string, password: string, name: string) {
  const res = await authFetch('users', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) return { ok: false as const, error: res.error ?? 'Registration failed.' };
  const token = extractToken(res.data);
  const user = extractUser(res.data, email, name);
  saveSession(token, user);
  return { ok: true as const, user };
}

export async function login(email: string, password: string) {
  const res = await authFetch('sessions', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false as const, error: res.error ?? 'Login failed.' };
  const token = extractToken(res.data);
  const user = extractUser(res.data, email);
  if (!token) return { ok: false as const, error: 'Insforge did not return a session token.' };
  saveSession(token, user);
  return { ok: true as const, user };
}

export async function logout() {
  await authFetch('logout', { method: 'POST' });
  saveSession(null, null);
}

/**
 * Customer Google Sign-In (login + signup). Sends the Google ID token to our
 * server, which verifies it and returns a signed session we store locally.
 */
export async function loginWithGoogle(credential: string) {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = (await res.json().catch(() => null)) as { token?: string; user?: SessionUser; error?: string } | null;
  if (!res.ok || !data?.token) {
    return { ok: false as const, error: data?.error ?? 'Google sign-in failed.' };
  }
  saveSession(data.token, data.user ?? null);
  return { ok: true as const, user: data.user ?? null };
}

/**
 * Store an Insforge session returned by the OAuth code exchange
 * (exchangeOAuthCode). Same shape as password login, so the rest of the app
 * treats a Google sign-in identically.
 */
export function saveOAuthSession(data: unknown) {
  const token = extractToken(data);
  const user = extractUser(data);
  if (token) saveSession(token, user);
  return { token, user };
}

export async function currentUser() {
  const token = getToken();
  if (!token) return null;
  // Google sessions are self-contained (signed by our server) — Insforge has
  // never seen them, so trust the locally stored user instead of re-checking.
  if (token.startsWith('sbdc.')) return getUser();
  const res = await authFetch<{ user?: SessionUser }>('sessions/current');
  if (!res.ok || !res.data) {
    saveSession(null, null);
    return null;
  }
  const user = res.data.user ?? null;
  if (user) saveSession(getToken(), user);
  return user;
}

export function publicConfig() {
  return authFetch<{ requireEmailVerification?: boolean; passwordMinLength?: number; disableSignup?: boolean }>(
    'public-config',
  );
}

/* --- shape helpers: Insforge wraps these differently across endpoints ---- */

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const session = d.session as Record<string, unknown> | undefined;
  const token =
    (session?.access_token as string) ??
    (session?.accessToken as string) ??
    (d.access_token as string) ??
    (d.accessToken as string) ??
    (d.token as string) ??
    null;
  return token ?? null;
}

function extractUser(data: unknown, email?: string, name?: string): SessionUser | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const u = (d.user ?? (d.session as Record<string, unknown> | undefined)?.user) as
    | Record<string, unknown>
    | undefined;
  if (!u?.id) {
    return email ? { id: 'unknown', email, name: name ?? null } : null;
  }
  return {
    id: String(u.id),
    email: (u.email as string) ?? email,
    name: (u.name as string) ?? (u.full_name as string) ?? name ?? null,
  };
}
