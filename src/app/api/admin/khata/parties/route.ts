import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { requireAdmin } from '@/lib/admin';
import { all, run, one } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** List every party with its live balance (opening + credit − debit). */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  const rows = await all<{
    id: string; name: string; phone: string | null; email: string | null;
    address: string | null; notes: string | null; opening_balance: number;
    is_active: number; created_at: string; tx: number; last_entry: string | null;
  }>(
    `SELECT p.id, p.name, p.phone, p.email, p.address, p.notes, p.opening_balance,
            p.is_active, p.created_at,
            COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END), 0) AS tx,
            MAX(t.entry_date) AS last_entry
       FROM khata_parties p
       LEFT JOIN khata_transactions t ON t.party_id = p.id
      ${q ? `WHERE lower(p.name) LIKE ? OR p.phone LIKE ?` : ''}
      GROUP BY p.id
      ORDER BY (p.opening_balance + COALESCE(SUM(CASE WHEN t.type='credit' THEN t.amount ELSE -t.amount END),0)) DESC,
               p.name ASC`,
    q ? [`%${q.toLowerCase()}%`, `%${q}%`] : [],
  );

  const parties = rows.map((r) => ({
    ...r,
    balance: round2(r.opening_balance + (r.tx || 0)),
  }));

  return NextResponse.json({ parties });
}

/** Create a party. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const b = await request.json().catch(() => null);
  if (!b || typeof b !== 'object') return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const name = String(b.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const id = crypto.randomUUID();
  await run(
    `INSERT INTO khata_parties (id, name, phone, email, address, notes, opening_balance, is_active, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    [
      id, name,
      b.phone ? String(b.phone).trim() : null,
      b.email ? String(b.email).trim() : null,
      b.address ? String(b.address).trim() : null,
      b.notes ? String(b.notes).trim() : null,
      Number(b.opening_balance) || 0,
      b.is_active === false ? 0 : 1,
    ],
  );

  const party = await one(`SELECT * FROM khata_parties WHERE id = ?`, [id]);
  return NextResponse.json({ ok: true, party }, { status: 201 });
}

function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
