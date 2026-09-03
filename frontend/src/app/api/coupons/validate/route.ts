import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateCoupon } from '@/lib/queries';

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().nonnegative(),
});

/** POST /api/coupons/validate */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, reason: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false, reason: 'A coupon code and subtotal are required.' }, { status: 400 });
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
