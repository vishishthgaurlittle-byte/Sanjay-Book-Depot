import 'server-only';

import { one, run } from '@/lib/db';

export interface PaymentConfig {
  cod: boolean;
  upi: boolean;
  bank: boolean;
  upiId: string;
  upiName: string;
  bankName: string;
  bankHolder: string;
  bankAccount: string;
  bankIfsc: string;
  qrDataUrl: string | null;
  note: string;
}

const KEY = 'payment_config';

/** Build a QR-looking placeholder SVG data URL (mock until a real QR is uploaded). */
function mockQr(): string {
  const n = 21;
  let seed = 42;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let cells = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const finder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      let on = false;
      if (finder) {
        const lx = x < 7 ? x : x - (n - 7);
        const ly = y < 7 ? y : y - (n - 7);
        on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4);
      } else {
        on = rnd() > 0.5;
      }
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><g fill="#111">${cells}</g></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_PAYMENTS: PaymentConfig = {
  cod: true,
  upi: true,
  bank: true,
  upiId: 'sanjaybookdepot@okhdfcbank',
  upiName: 'Sanjay Book Depot',
  bankName: 'State Bank of India',
  bankHolder: 'Sanjay Book Depot',
  bankAccount: '36541209876',
  bankIfsc: 'SBIN0001234',
  qrDataUrl: mockQr(),
  note: 'After paying via UPI or bank transfer, please upload the payment screenshot with your order.',
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    const row = await one<{ value: string }>(`SELECT value FROM site_settings WHERE key = ?`, [KEY]);
    if (!row?.value) return DEFAULT_PAYMENTS;
    return { ...DEFAULT_PAYMENTS, ...(JSON.parse(row.value) as Partial<PaymentConfig>) };
  } catch {
    return DEFAULT_PAYMENTS;
  }
}

export async function setPaymentConfig(cfg: PaymentConfig): Promise<void> {
  await run(
    `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [KEY, JSON.stringify(cfg)],
  );
}
