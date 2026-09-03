import { NextResponse } from 'next/server';
import { getBrands } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/brands */
export async function GET() {
  return NextResponse.json({ brands: await getBrands() });
}
