import { NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { infHealth, INF_BASE_URL } from '@/lib/insforge';

export const dynamic = 'force-dynamic';

/** GET /api/health - confirms both backends are reachable from the server. */
export async function GET() {
  const results: Record<string, unknown> = { insforge: false, turso: false };

  try {
    const row = await one<{ n: number }>('SELECT COUNT(*) AS n FROM products');
    results.turso = true;
    results.products = Number(row?.n ?? 0);
  } catch (e) {
    results.tursoError = e instanceof Error ? e.message : String(e);
  }

  try {
    results.insforge = await infHealth();
  } catch (e) {
    results.insforgeError = e instanceof Error ? e.message : String(e);
  }

  results.insforgeUrl = INF_BASE_URL;
  const healthy = results.turso === true && results.insforge === true;
  return NextResponse.json(results, { status: healthy ? 200 : 503 });
}
