import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { requireAdmin } from '@/lib/admin';
import { run, one } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Add a ledger entry. type: 'credit' = You Gave (sale), 'debit' = You Got (payment). */
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { id: partyId } = await params;

  const party = await one(`SELECT id FROM khata_parties WHERE id = ?`, [partyId]);
  if (!party) return NextResponse.json({ error: 'Party not found' }, { status: 404 });

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const type = b.type === 'debit' ? 'debit' : 'credit';
  const amount = Number(b.amount);
  if (!(amount > 0)) return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });

  const entryDate = (typeof b.entry_date === 'string' && b.entry_date) ? b.entry_date : new Date().toISOString().slice(0, 10);
  const txId = crypto.randomUUID();

  await run(
    `INSERT INTO khata_transactions (id, party_id, type, amount, note, reference, entry_date, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    [txId, partyId, type, round2(amount), b.note ? String(b.note) : null, b.reference ? String(b.reference) : null, entryDate],
  );

  const txn = await one(`SELECT * FROM khata_transactions WHERE id = ?`, [txId]);
  return NextResponse.json({ ok: true, transaction: txn }, { status: 201 });
}

function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
