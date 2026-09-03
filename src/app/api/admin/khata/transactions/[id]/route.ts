import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { run } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Delete a single ledger entry. */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await run(`DELETE FROM khata_transactions WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}
