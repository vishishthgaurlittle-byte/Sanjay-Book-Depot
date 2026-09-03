import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { all, run, one } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** One party + its full ledger + running balance. */
export async function GET(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const party = await one<any>(`SELECT * FROM khata_parties WHERE id = ?`, [id]);
  if (!party) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const txns = await all<any>(
    `SELECT id, type, amount, note, reference, entry_date, created_at
       FROM khata_transactions WHERE party_id = ?
      ORDER BY entry_date DESC, created_at DESC`,
    [id],
  );

  const tx = txns.reduce((s, t) => s + (t.type === 'credit' ? t.amount : -t.amount), 0);
  return NextResponse.json({
    party: { ...party, balance: round2(party.opening_balance + tx) },
    transactions: txns,
  });
}

/** Update party details. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const b = await request.json().catch(() => null);
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const fields: string[] = [];
  const args: (string | number | null)[] = [];
  for (const k of ['name', 'phone', 'email', 'address', 'notes'] as const) {
    if (b[k] !== undefined) { fields.push(`${k} = ?`); args.push(b[k] === null || b[k] === '' ? null : String(b[k])); }
  }
  if (b.opening_balance !== undefined) { fields.push('opening_balance = ?'); args.push(Number(b.opening_balance) || 0); }
  if (b.is_active !== undefined) { fields.push('is_active = ?'); args.push(b.is_active ? 1 : 0); }
  if (!fields.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  args.push(id);
  await run(`UPDATE khata_parties SET ${fields.join(', ')} WHERE id = ?`, args);
  const party = await one(`SELECT * FROM khata_parties WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true, party });
}

/** Delete a party (cascades its transactions). */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await run(`DELETE FROM khata_parties WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true });
}

function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
