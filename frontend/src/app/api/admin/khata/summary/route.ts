import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { all, one } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Headline numbers for the khata dashboard. */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const rows = await all<{ balance: number }>(
    `SELECT (p.opening_balance + COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END),0)) AS balance
       FROM khata_parties p LEFT JOIN khata_transactions t ON t.party_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id`,
  );

  let toCollect = 0, toPay = 0;
  for (const r of rows) { if (r.balance > 0) toCollect += r.balance; else toPay += -r.balance; }

  const counts = await one<{ parties: number; entries: number; sales: number; payments: number }>(
    `SELECT
       (SELECT COUNT(*) FROM khata_parties WHERE is_active = 1) AS parties,
       (SELECT COUNT(*) FROM khata_transactions) AS entries,
       (SELECT COALESCE(SUM(amount),0) FROM khata_transactions WHERE type='credit') AS sales,
       (SELECT COALESCE(SUM(amount),0) FROM khata_transactions WHERE type='debit') AS payments`,
  );

  return NextResponse.json({
    toCollect: round2(toCollect),
    toPay: round2(toPay),
    net: round2(toCollect - toPay),
    parties: counts?.parties ?? 0,
    entries: counts?.entries ?? 0,
    totalSales: round2(counts?.sales ?? 0),
    totalPayments: round2(counts?.payments ?? 0),
  });
}

function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
