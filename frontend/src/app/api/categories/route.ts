import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/categories - category tree with live product counts. */
export async function GET() {
  return NextResponse.json({ categories: await getCategories() });
}
