import { NextResponse } from 'next/server';

import { getPaymentConfig } from '@/lib/payments';

export const dynamic = 'force-dynamic';

/** Public: which payment methods are enabled + QR / bank details for checkout. */
export async function GET() {
  return NextResponse.json(await getPaymentConfig());
}
