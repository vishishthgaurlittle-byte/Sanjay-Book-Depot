import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { getPaymentConfig, setPaymentConfig, type PaymentConfig } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json(await getPaymentConfig());
}

export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const body = (await req.json().catch(() => ({}))) as Partial<PaymentConfig>;
  const next = { ...getSafe(await getPaymentConfig()), ...sanitize(body) };
  await setPaymentConfig(next);
  return NextResponse.json(next);
}

function getSafe(c: PaymentConfig): PaymentConfig {
  return { ...c };
}
function sanitize(b: Partial<PaymentConfig>): Partial<PaymentConfig> {
  const out: Partial<PaymentConfig> = {};
  (['cod', 'upi', 'bank'] as const).forEach((k) => {
    if (typeof b[k] === 'boolean') out[k] = b[k];
  });
  (['upiId', 'upiName', 'bankName', 'bankHolder', 'bankAccount', 'bankIfsc', 'note'] as const).forEach((k) => {
    if (typeof b[k] === 'string') out[k] = b[k];
  });
  if (b.qrDataUrl === null || typeof b.qrDataUrl === 'string') out.qrDataUrl = b.qrDataUrl;
  return out;
}
