import { NextResponse } from 'next/server';
import { INF_BASE_URL } from '@/lib/insforge';

export const dynamic = 'force-dynamic';

/**
 * Auth proxy to Insforge.
 *
 * The browser never sees INF_API_KEY. It stores its own Insforge session token
 * after sign-in and sends it here; this route forwards it unchanged so Insforge
 * applies the visitor's own identity and session rules.
 *
 * Allowed paths only - this is not an open proxy to the whole Insforge API.
 */
const ALLOWED = [
  'users',
  'sessions',
  'sessions/current',
  'logout',
  'refresh',
  'public-config',
  'email/send-otp',
  'email/verify',
  'email/send-verification',
  'email/send-reset-password',
  'email/reset-password',
  'email/exchange-reset-password-token',
  'profiles/current',
];

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
type Method = (typeof METHODS)[number];

async function forward(method: Method, request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join('/');

  if (!ALLOWED.includes(target)) {
    return NextResponse.json({ error: `Auth path "/${target}" is not permitted` }, { status: 403 });
  }

  // Forward only the visitor's own credentials.
  const auth = request.headers.get('authorization');
  const body = ['POST', 'PATCH', 'DELETE'].includes(method) ? await request.text() : undefined;

  const res = await fetch(`${INF_BASE_URL}/api/auth/${target}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(auth ? { Authorization: auth } : {}),
    },
    body: body || undefined,
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') ?? 'application/json';

  return new NextResponse(text || null, {
    status: res.status,
    headers: { 'content-type': contentType },
  });
}

export const GET = (r: Request, c: { params: Promise<{ path: string[] }> }) => forward('GET', r, c);
export const POST = (r: Request, c: { params: Promise<{ path: string[] }> }) => forward('POST', r, c);
export const PATCH = (r: Request, c: { params: Promise<{ path: string[] }> }) => forward('PATCH', r, c);
export const DELETE = (r: Request, c: { params: Promise<{ path: string[] }> }) => forward('DELETE', r, c);
